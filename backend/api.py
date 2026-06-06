import os
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv, dotenv_values
backend_env = Path(__file__).parent / ".env"
if backend_env.exists():
    load_dotenv(dotenv_path=backend_env)
load_dotenv()
import uvicorn
from fastapi import FastAPI, HTTPException, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from google import genai
from google.genai import types
import io
try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None
try:
    import pytesseract
    from PIL import Image as PILImage
except ImportError:
    pytesseract = None

try:
    from groq import Groq
except ImportError:
    Groq = None

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

from config import llm_config

app = FastAPI(title="DL Virtual Teacher API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Fast clients (xAI/Grok, Gemini, or Groq) ---
_gemini_client = None
_groq_client = None
_xai_client = None
_xai_disabled = False  # Set True after a 403 no-credits error to stop retrying

def valid_api_key(value: Optional[str]) -> bool:
    if not value:
        return False
    lowered = value.strip().lower()
    return bool(lowered and not lowered.startswith("your_") and "api_key_here" not in lowered)

def load_frontend_xai_env_if_needed():
    current_key = os.getenv("XAI_API_KEY")
    if valid_api_key(current_key):
        return

    frontend_env = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", ".env")
    )
    if not os.path.exists(frontend_env):
        return

    values = dotenv_values(frontend_env)
    frontend_key = values.get("XAI_API_KEY")
    if not valid_api_key(frontend_key):
        return

    os.environ["XAI_API_KEY"] = frontend_key
    for name in ("XAI_BASE_URL", "XAI_MODEL"):
        if values.get(name) and not os.getenv(name):
            os.environ[name] = values[name]

def is_xai_key(value: Optional[str]) -> bool:
    """Return True if value looks like an xAI key (starts with 'xai-')."""
    return bool(value and value.strip().lower().startswith("xai-"))

def resolve_gemini_key() -> Optional[str]:
    """Return a valid Gemini API key, skipping xAI keys."""
    # Check GEMINI_API_KEY and GOOGLE_API_KEY from env
    for env_var in ("GEMINI_API_KEY", "GOOGLE_API_KEY"):
        k = os.getenv(env_var)
        if valid_api_key(k) and not is_xai_key(k):
            return k
    # Fallback: check the frontend .env for a real Gemini key
    frontend_env = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", ".env")
    )
    if os.path.exists(frontend_env):
        vals = dotenv_values(frontend_env)
        for env_var in ("GEMINI_API_KEY", "GOOGLE_API_KEY"):
            k = vals.get(env_var)
            if valid_api_key(k) and not is_xai_key(k):
                return k
    return None

def has_generation_backend():
    global _xai_disabled
    load_frontend_xai_env_if_needed()
    # Check xAI (only if not disabled due to no-credits 403)
    if not _xai_disabled and valid_api_key(os.getenv("XAI_API_KEY")):
        return True
    # Check Gemini (must be a real Google key, not an xAI key)
    if resolve_gemini_key():
        return True
    # Check Groq
    if valid_api_key(os.getenv("GROQ_API_KEY")):
        return True
    return False

def get_xai_client():
    global _xai_client, _xai_disabled
    if _xai_disabled:
        return None
    load_frontend_xai_env_if_needed()
    api_key = os.getenv("XAI_API_KEY")
    if _xai_client is None and valid_api_key(api_key) and OpenAI:
        _xai_client = OpenAI(
            base_url=os.getenv("XAI_BASE_URL", "https://api.x.ai/v1"),
            api_key=api_key,
        )
    return _xai_client

def get_gemini_client():
    global _gemini_client
    if _gemini_client is None:
        api_key = resolve_gemini_key()
        if api_key:
            _gemini_client = genai.Client(api_key=api_key)
    return _gemini_client

def get_groq_client():
    global _groq_client
    # Re-read from env every call so newly-written .env keys are picked up
    groq_key = os.getenv("GROQ_API_KEY")
    if valid_api_key(groq_key) and Groq:
        if _groq_client is None or _groq_client.api_key != groq_key:
            _groq_client = Groq(api_key=groq_key)
    return _groq_client

def fast_generate(prompt: str) -> str:
    global _xai_disabled, _xai_client
    if not has_generation_backend():
        raise RuntimeError(
            "No AI API key configured. Add GEMINI_API_KEY (from https://aistudio.google.com/apikey) "
            "or GROQ_API_KEY to the backend/.env file."
        )

    # 1. Try Gemini first (free tier, most reliable)
    try:
        gemini_client = get_gemini_client()
        if gemini_client:
            print("Using Gemini for generation...")
            response = gemini_client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    max_output_tokens=16000,
                )
            )
            return response.text
    except Exception as gemini_err:
        print(f"Gemini generation failed: {gemini_err}")

    # 2. Try xAI/Grok (skip if previously disabled due to no-credits)
    xai_client = get_xai_client()
    if xai_client:
        try:
            print("Using xAI/Grok for generation...")
            response = xai_client.chat.completions.create(
                model=os.getenv("XAI_MODEL", "grok-3"),
                messages=[{"role": "user", "content": prompt}],
                max_tokens=16000,
            )
            return response.choices[0].message.content
        except Exception as xai_err:
            err_str = str(xai_err)
            # Permanently disable xAI if the account has no credits or key is invalid
            if any(w in err_str.lower() for w in ["credits", "403", "permission", "401", "unauthorized", "invalid"]):
                print(f"xAI account/key is invalid or has no credits â€” disabling xAI for this session. Error: {xai_err}")
                _xai_disabled = True
                _xai_client = None
            else:
                print(f"xAI/Grok failed: {xai_err}. Trying Groq...")

    # 3. Try Groq as final fallback (free tier: max ~6000 output tokens for 70B, ~3000 for 8B)
    groq_client = get_groq_client()
    if groq_client:
        # Truncate very long prompts to avoid input token limits on free tier (~8k input limit)
        groq_prompt = prompt[:8000] if len(prompt) > 8000 else prompt
        try:
            print("Using Groq (70B) for generation...")
            response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": groq_prompt}],
                max_tokens=6000
            )
            return response.choices[0].message.content
        except Exception as groq_err:
            print(f"Groq 70B failed: {groq_err}. Trying Groq 8B...")
            try:
                response = groq_client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[{"role": "user", "content": groq_prompt}],
                    max_tokens=3000
                )
                return response.choices[0].message.content
            except Exception as groq_err2:
                print(f"Groq 8B also failed: {groq_err2}.")


    raise HTTPException(
        status_code=500,
        detail="All AI backends failed. Add a free GEMINI_API_KEY from https://aistudio.google.com/apikey to backend/.env"
    )

def offline_notes(topic: str, note_type: str = "detailed") -> str:
    mock = get_mock_curriculum(topic or "deep learning", "beginner")
    if note_type == "short":
        return mock["content"].split("## 4.")[0].strip()
    if note_type == "flashcard":
        return "\n\n".join([
            f"**Q**: What is the main idea behind {topic}?\n**A**: It learns useful representations from data so a model can make better predictions.",
            "**Q**: Why does training need a loss function?\n**A**: The loss measures prediction error and creates the signal used to update model parameters.",
            "**Q**: What should you check first when a model fails?\n**A**: Verify data shapes, labels, loss values, and whether the model can overfit a tiny batch.",
        ])
    if note_type == "formula":
        return f"""# Formula Sheet: {topic}

| Concept | Formula | Meaning |
|---|---|---|
| Linear layer | `y = Wx + b` | Maps input features to learned outputs. |
| Activation | `a = f(y)` | Adds non-linearity so the model can learn complex patterns. |
| Loss minimization | `theta* = argmin L(theta)` | Training searches for parameters with lower error. |
| Gradient update | `theta <- theta - lr * grad L(theta)` | Optimizer step that improves the model. |
"""
    if note_type == "exam":
        return mock["content"] + "\n\n## Exam Focus\n- Define the input, output, objective, and training signal.\n- Explain how information flows through the model.\n- Name one common failure mode and how to debug it.\n"
    return mock["content"]

def offline_chat_reply(message: str) -> str:
    msg = message.lower().strip()

    # Prefix for offline mode explanation
    prefix = "> âš ï¸ **AI Backend Unavailable:** The AI service could not be reached right now (API may be busy or the key may have expired). Here is a premium offline study guide for your query:\n\n"

    # Suffix with instructions
    suffix = "\n\n---\n*To enable dynamic AI responses, please restart the FastAPI backend (`python api.py` in the `backend/` folder) and ensure your `XAI_API_KEY` in `backend/.env` is valid. You can also add a free `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/).*"

    # 1. CNN vs RNN / Difference
    if any(w in msg for w in ["difference", "vs", "versus", "compare"]) and any(w in msg for w in ["cnn", "convolution"]) and any(w in msg for w in ["rnn", "recurrent"]):
        content = """### ðŸ”„ **CNN vs. RNN: Architecture Comparison**

| Feature | Convolutional Neural Network (CNN) | Recurrent Neural Network (RNN) |
| :--- | :--- | :--- |
| **Primary Input** | Spatial data (Images, grid layouts, 2D signals) | Sequential data (Text, Time-series, Audio waves) |
| **Data Flow** | Feedforward (No loops). Uses spatial convolution filters. | Recurrent (Feedback loops). Feeds output back as input. |
| **State Retention** | No memory of past inputs (stateless per sample). | Retains hidden state (temporal memory) from past steps. |
| **Parameter Sharing** | Shares weight kernels across spatial coordinates. | Shares same transition weights across all time steps. |
| **Main Drawback** | Poor at tracking long-term sequential state. | Highly susceptible to vanishing or exploding gradients. |

#### **Code Comparison**
* **CNN** uses spatial convolutions: `nn.Conv2d(in_channels, out_channels, kernel_size)`
* **RNN** uses temporal recursion: `nn.LSTM(input_size, hidden_size, batch_first=True)`"""
        return prefix + content + suffix

    # 2. CNN
    if any(w in msg for w in ["cnn", "convolution", "image", "vision"]):
        content = """### ðŸ§  **Convolutional Neural Networks (CNNs)**

A **Convolutional Neural Network (CNN)** is a deep learning architecture optimized for processing grid-structured data like images.

#### **Core Operations**
1. **Convolution (Feature Detection)**: Slides a small matrix (kernel/filter) over the input image to calculate dot products, capturing local spatial features like edges, corners, and textures.
2. **Activation (Non-Linearity)**: Applies functions like **ReLU** to introduce non-linear mapping capabilities.
3. **Pooling (Downsampling)**: Reduces the spatial size (width and height) of feature maps (usually via Max Pooling) to achieve translation invariance and decrease parameter size.

#### **PyTorch CNN Example**
```python
import torch
import torch.nn as nn

class PyTorchCNN(nn.Module):
    def __init__(self, num_classes=10):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 16, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2, 2)  # Halves spatial dimensions
        )
        self.classifier = nn.Linear(16 * 16 * 16, num_classes)

    def forward(self, x):
        x = self.features(x)
        x = torch.flatten(x, start_dim=1)
        return self.classifier(x)
```"""
        return prefix + content + suffix

    # 3. RNN
    if any(w in msg for w in ["rnn", "recurrent", "lstm", "gru", "sequence", "time"]):
        content = """### ðŸ”„ **Recurrent Neural Networks (RNNs)**

**RNNs** are designed to model sequential data by maintaining a "hidden state" (memory) that carries information from previous steps in the sequence.

#### **Core Equations**
At time step $t$, the hidden state $h_t$ is updated using the current input $x_t$ and the previous hidden state $h_{t-1}$:
$$h_t = \\tanh(W_{hh} h_{t-1} + W_{xh} x_t + b_h)$$

#### **Key Limitations & Solutions**
* **Vanishing Gradients**: Standard RNNs struggle with long sequences because backpropagating through time involves repeated matrix multiplication.
* **Modern Variants**: **LSTM** (Long Short-Term Memory) and **GRU** (Gated Recurrent Unit) use gating mechanisms to decide what information to store, write, and read, preventing gradient decay.

#### **PyTorch LSTM Example**
```python
import torch.nn as nn

# Define an LSTM layer
lstm_layer = nn.LSTM(input_size=10, hidden_size=20, num_layers=2, batch_first=True)
```"""
        return prefix + content + suffix

    # 4. Attention / Transformer
    if any(w in msg for w in ["attention", "transformer", "self-attention", "bert", "gpt", "llm"]):
        content = """### âš¡ **Attention Mechanism & Transformers**

The **Transformer** (introduced in the seminal paper *"Attention Is All You Need"*) relies on **Self-Attention** to process sequences in parallel, bypassing recurrent networks.

#### **Queries, Keys, and Values (Q, K, V)**
Self-attention maps a query to a distribution over keys to extract weighted value representations:
$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$
* **Query ($Q$)**: The representation of the current token looking for context.
* **Key ($K$)**: The indexing representations of all tokens in the sequence.
* **Value ($V$)**: The actual content vectors to be mixed.

#### **Why it is Revolutionary**
1. **No Recurrence**: Enables massive parallelization during training.
2. **Constant Path Length**: Tokens can connect directly across any distance, solving vanishing gradients in long contexts.

#### **PyTorch Self-Attention Example**
```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class SingleHeadAttention(nn.Module):
    def __init__(self, d_model):
        super().__init__()
        self.q_proj = nn.Linear(d_model, d_model)
        self.k_proj = nn.Linear(d_model, d_model)
        self.v_proj = nn.Linear(d_model, d_model)

    def forward(self, x):
        # x shape: (batch_size, seq_len, d_model)
        Q = self.q_proj(x)
        K = self.k_proj(x)
        V = self.v_proj(x)

        scores = torch.matmul(Q, K.transpose(-2, -1)) / (x.size(-1) ** 0.5)
        weights = F.softmax(scores, dim=-1)
        return torch.matmul(weights, V)
```"""
        return prefix + content + suffix

    # 5. Vanishing Gradient
    if any(w in msg for w in ["vanishing", "exploding", "gradient", "problem"]):
        content = """### ðŸ“‰ **The Vanishing/Exploding Gradient Problem**

This issue occurs during the backpropagation phase in deep or recurrent networks when gradients shrink (or grow) exponentially as they travel backward.

#### **Why it Happens**
* **Chain Rule Multiplication**: When backpropagating through many layers, gradients are multiplied together.
* **Saturating Activations**: Activation functions like **Sigmoid** or **Tanh** have very small derivative outputs near their boundaries (max $0.25$ for Sigmoid). Multiplying these repeatedly quickly reduces the gradient to zero.

#### **How to Fix It**
1. **Use ReLU**: The Rectified Linear Unit ($\\text{ReLU}(x) = \\max(0, x)$) has a constant gradient of $1.0$ for all positive inputs.
2. **Residual Connections**: Skip connections (e.g., in ResNets) allow the gradient to bypass layers without attenuation: $x_{l+1} = x_l + F(x_l)$.
3. **Batch Normalization**: Regulates activations to avoid saturating regions.
4. **Weight Initialization**: Use Xavier (Glorot) or He (Kaiming) initialization to maintain stable variance across layers."""
        return prefix + content + suffix

    # 6. Dropout
    if any(w in msg for w in ["dropout", "overfit", "regularization"]):
        content = """### ðŸ›¡ï¸ **Dropout: Regularization Technique**

**Dropout** is an elegant regularization technique designed to prevent deep neural networks from overfitting.

#### **Mechanism**
* During each training iteration, individual nodes are randomly "dropped out" (set to zero) with a probability $p$ (usually $0.2$ to $0.5$).
* During evaluation (inference), all nodes are active, but their outputs are scaled down by $(1 - p)$ to match the expected activation level.

#### **Why it Works**
1. **Avoids Co-adaptation**: Neurons cannot rely on the specific activations of adjacent neurons. Every node must learn features that are robust on their own.
2. **Simulates Ensembles**: Training with dropout is mathematically equivalent to training an exponential ensemble of smaller networks sharing parameters.

#### **PyTorch Usage**
```python
import torch.nn as nn

model = nn.Sequential(
    nn.Linear(512, 256),
    nn.ReLU(),
    nn.Dropout(p=0.3),  # Deactivates 30% of activations randomly
    nn.Linear(256, 10)
)
```"""
        return prefix + content + suffix

    # 7. Batch Normalization
    if any(w in msg for w in ["batch normalization", "batchnorm", "normalize"]):
        content = """### ðŸ“Š **Batch Normalization (BatchNorm)**

**Batch Normalization** is a technique that normalizes the inputs of each layer across the mini-batch during training.

#### **Core Benefits**
1. **Accelerates Training**: Allows the use of significantly higher learning rates.
2. **Reduces Internal Covariate Shift**: Keeps the distribution of layer activations stable throughout training.
3. **Acts as Regularizer**: Adds light noise to activations (since mean/variance are estimated per mini-batch), reducing the need for heavy dropout.

#### **The Algorithm**
For input features $x$ over batch $B$:
$$\\hat{x} = \\frac{x - \\mu_B}{\\sqrt{\\sigma_B^2 + \\epsilon}}$$
$$y = \\gamma \\hat{x} + \\beta$$
*(where $\\gamma$ and $\\beta$ are learnable scale/shift parameters)*"""
        return prefix + content + suffix

    # 8. Backpropagation
    if any(w in msg for w in ["backpropagation", "backprop", "chain rule", "gradient descent"]):
        content = """### ðŸ§® **Backpropagation Algorithm**

**Backpropagation** is the foundational algorithm used to calculate gradients of a loss function with respect to the network's parameters.

#### **Step-by-Step Flow**
1. **Forward Pass**: Compute activations layer by layer to get the final output $\\hat{y}$ and current loss $L$.
2. **Calculate Output Error**: Find the partial derivative of the loss at the output layer: $\\delta^{[L]} = \\frac{\\partial L}{\\partial z^{[L]}}$.
3. **Backward Pass (Chain Rule)**: Propagate the error backwards to calculate gradients for every layer:
   $$\\frac{\\partial L}{\\partial W^{[l]}} = \\delta^{[l]} (a^{[l-1]})^T$$
   $$\\delta^{[l-1]} = (W^{[l]})^T \\delta^{[l]} \\odot \\sigma'(z^{[l-1]})$$
4. **Parameter Update**: Apply an optimizer step (e.g., Stochastic Gradient Descent):
   $$W^{[l]} \\leftarrow W^{[l]} - \\eta \\frac{\\partial L}{\\partial W^{[l]}}$$"""
        return prefix + content + suffix

    # Default fallback response (general study guide helper)
    content = f"""### ðŸ“– **Deep Learning Offline Study Guide**

Your question: *"{message}"*

#### **Core Analysis Framework**
To understand or explain any deep learning concept, structure your explanation around these four components:
1. **Input Space**: What shape and type of data enters this component (e.g., `(B, C, H, W)` tensors, sequence embeddings)?
2. **Representation Layer**: What mathematical operations transform the inputs (e.g., convolutions, recurrence, attention projections)?
3. **Optimization Objective**: What loss function guides the weights (e.g., Cross-Entropy, Mean Squared Error, Contrastive Loss)?
4. **Output/Inference**: What form does the final prediction take?

#### **Common Troubleshooting Steps**
* **Tensor Shape Errors**: Always inspect shapes between layer boundaries. A quick `print(x.shape)` inside the forward method is highly effective.
* **Loss Exploding/NaNs**: Check for high learning rates, lack of input normalization, or division by zero/log(0) inside custom loss functions.
* **Model Not Learning**: Try training on a tiny subset of 5-10 samples first. If the model cannot overfit this small set to zero loss, there is a bug in the model's architecture or data pipeline."""

    return prefix + content + suffix

def classify_topic(topic: str) -> str:
    topic_lower = topic.lower()
    if any(w in topic_lower for w in ["gan", "generative", "adversarial", "dcgan", "stylegan"]):
        return "gan"
    if any(w in topic_lower for w in ["cnn", "convolution", "vision", "image", "resnet", "vgg", "yolo"]):
        return "cnn"
    if any(w in topic_lower for w in ["transformer", "attention", "bert", "gpt", "llm", "vit"]):
        return "transformer"
    if any(w in topic_lower for w in ["rnn", "lstm", "gru", "sequence"]):
        return "rnn"
    if any(w in topic_lower for w in ["autoencoder", "vae", "encoder", "decoder"]):
        return "autoencoder"
    if any(w in topic_lower for w in ["diffusion", "ddpm", "denoise"]):
        return "diffusion"
    if any(w in topic_lower for w in ["reinforcement", "q-learning", "ppo", "dqn", "agent"]):
        return "rl"
    return "fnn"


def build_visualization_graph(topic: str) -> Dict[str, Any]:
    kind = classify_topic(topic)
    graphs = {
        "cnn": {
            "architectureType": "cnn",
            "description": f"{topic} transforms raw pixels into local edges, textures, object parts, and final predictions through shared convolution filters.",
            "nodes": [
                {"id": "n1", "label": "Input Image", "x": 10, "y": 50, "color": "#3b82f6"},
                {"id": "n2", "label": "Conv Filters", "x": 32, "y": 42, "color": "#8b5cf6"},
                {"id": "n3", "label": "Feature Maps", "x": 55, "y": 58, "color": "#ec4899"},
                {"id": "n4", "label": "Pooling", "x": 74, "y": 42, "color": "#f59e0b"},
                {"id": "n5", "label": "Classifier", "x": 90, "y": 50, "color": "#10b981"},
            ],
            "edges": [
                {"source": "n1", "target": "n2", "label": "scan"},
                {"source": "n2", "target": "n3", "label": "detect"},
                {"source": "n3", "target": "n4", "label": "downsample"},
                {"source": "n4", "target": "n5", "label": "predict"},
            ],
        },
        "transformer": {
            "architectureType": "transformer",
            "description": f"{topic} represents tokens, compares every token with every other token through attention, then predicts context-aware outputs.",
            "nodes": [
                {"id": "n1", "label": "Tokens", "x": 10, "y": 50, "color": "#3b82f6"},
                {"id": "n2", "label": "Embeddings", "x": 30, "y": 50, "color": "#8b5cf6"},
                {"id": "n3", "label": "Q K V", "x": 50, "y": 36, "color": "#f59e0b"},
                {"id": "n4", "label": "Self-Attention", "x": 70, "y": 58, "color": "#ec4899"},
                {"id": "n5", "label": "Prediction", "x": 90, "y": 50, "color": "#10b981"},
            ],
            "edges": [
                {"source": "n1", "target": "n2", "label": "embed"},
                {"source": "n2", "target": "n3", "label": "project"},
                {"source": "n3", "target": "n4", "label": "score"},
                {"source": "n4", "target": "n5", "label": "decode"},
            ],
        },
        "gan": {
            "architectureType": "gan",
            "description": f"{topic} trains a generator to create samples and a discriminator to judge them, forcing both models to improve through competition.",
            "nodes": [
                {"id": "n1", "label": "Noise z", "x": 10, "y": 28, "color": "#8b5cf6"},
                {"id": "n2", "label": "Generator", "x": 36, "y": 28, "color": "#ec4899"},
                {"id": "n3", "label": "Fake Sample", "x": 60, "y": 30, "color": "#f472b6"},
                {"id": "n4", "label": "Real Data", "x": 36, "y": 72, "color": "#3b82f6"},
                {"id": "n5", "label": "Discriminator", "x": 80, "y": 50, "color": "#f59e0b"},
            ],
            "edges": [
                {"source": "n1", "target": "n2", "label": "sample"},
                {"source": "n2", "target": "n3", "label": "generate"},
                {"source": "n3", "target": "n5", "label": "fake"},
                {"source": "n4", "target": "n5", "label": "real"},
            ],
        },
        "rnn": {
            "architectureType": "rnn",
            "description": f"{topic} processes a sequence one step at a time while carrying hidden state from earlier steps.",
            "nodes": [
                {"id": "n1", "label": "x_t", "x": 12, "y": 70, "color": "#3b82f6"},
                {"id": "n2", "label": "Hidden State", "x": 42, "y": 50, "color": "#f59e0b"},
                {"id": "n3", "label": "Memory Gate", "x": 64, "y": 38, "color": "#8b5cf6"},
                {"id": "n4", "label": "Output", "x": 88, "y": 30, "color": "#10b981"},
            ],
            "edges": [
                {"source": "n1", "target": "n2", "label": "input"},
                {"source": "n2", "target": "n3", "label": "update"},
                {"source": "n3", "target": "n2", "label": "carry"},
                {"source": "n2", "target": "n4", "label": "predict"},
            ],
        },
    }
    return graphs.get(kind, {
        "architectureType": kind,
        "description": f"{topic} maps input features through learned transformations into useful representations and predictions.",
        "nodes": [
            {"id": "n1", "label": "Input", "x": 10, "y": 50, "color": "#3b82f6"},
            {"id": "n2", "label": "Representation", "x": 38, "y": 40, "color": "#8b5cf6"},
            {"id": "n3", "label": "Training Signal", "x": 62, "y": 62, "color": "#f59e0b"},
            {"id": "n4", "label": "Output", "x": 90, "y": 50, "color": "#10b981"},
        ],
        "edges": [
            {"source": "n1", "target": "n2", "label": "encode"},
            {"source": "n2", "target": "n3", "label": "optimize"},
            {"source": "n3", "target": "n4", "label": "infer"},
        ],
    })



def build_specific_theory(display: str, kind: str) -> str:
    if kind == "cnn":
        return '''

## 11. CNN-Specific Deep Dive
A CNN is strong for images because nearby pixels are related. Instead of connecting every pixel to every neuron, a convolution filter slides across the image and reuses the same weights everywhere. This creates parameter sharing and translation awareness: if an edge appears in the top-left or bottom-right, the same filter can detect it.

For an input shaped `(batch, channels, height, width)`, a convolution layer produces feature maps. Early feature maps often respond to edges and colors, middle layers respond to textures and shapes, and later layers respond to semantic parts. Pooling or strided convolution reduces resolution while keeping the strongest signals. The classifier head then converts final feature maps into logits.

The key hyperparameters are kernel size, stride, padding, channel count, receptive field, and normalization. If these are chosen poorly, the network may lose spatial information too early or become too expensive to train.
'''
    if kind == "transformer":
        return '''

## 11. Transformer-Specific Deep Dive
A Transformer is strong for language and long-range structure because every token can directly compare itself with every other token. Queries ask what a token is looking for, keys describe what each token offers, and values carry the information that gets mixed after attention scores are computed.

Multi-head attention lets the model learn several relationship types at once. One head may track local syntax, another may connect pronouns to nouns, and another may focus on task-specific keywords. Residual connections and layer normalization keep optimization stable as the stack becomes deep.
'''
    if kind == "gan":
        return '''

## 11. GAN-Specific Deep Dive
A GAN has two networks with opposing goals. The generator maps random latent vectors to fake samples. The discriminator receives both real samples and generated samples, then predicts whether each one is real. The generator improves by learning how to fool the discriminator; the discriminator improves by detecting more subtle flaws.

GAN training is delicate because the target keeps moving. If the discriminator becomes too strong, the generator receives weak gradients. If the generator collapses to a few outputs, sample diversity disappears. Stable GAN work depends on balanced updates, careful normalization, and visual inspection of generated samples.
'''
    return '''

## 11. Topic-Specific Deep Dive
The most important next step is to connect the concept to tensor shapes, losses, and data flow. A clear mental model should answer: what is the input, what representation is learned, what objective is optimized, and how would you debug failure?
'''


def build_code_example(display: str, kind: str) -> str:
    if kind == "cnn":
        return '''```python
import torch
import torch.nn as nn
import torch.nn.functional as F


class SmallCNN(nn.Module):
    # CNN for 32x32 RGB image classification.

    def __init__(self, num_classes=10):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.Conv2d(32, 32, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),      # 32x32 -> 16x16

            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.Conv2d(64, 64, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),      # 16x16 -> 8x8
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(64 * 8 * 8, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, num_classes),
        )

    def forward(self, x):
        x = self.features(x)
        return self.classifier(x)


model = SmallCNN(num_classes=10)
images = torch.randn(16, 3, 32, 32)
labels = torch.randint(0, 10, (16,))

logits = model(images)
loss = F.cross_entropy(logits, labels)
loss.backward()

print("logits:", logits.shape)
print("loss:", float(loss))
```

### Code Explanation
- `Conv2d` learns small filters that scan across the image.
- `BatchNorm2d` stabilizes feature distributions during training.
- `MaxPool2d` reduces spatial size while keeping strong activations.
- `Flatten` converts final feature maps into a vector for classification.
- `CrossEntropyLoss` expects raw logits with shape `(batch, classes)`.
'''
    if kind == "transformer":
        return '''```python
import torch
import torch.nn as nn


class TinyTransformerClassifier(nn.Module):
    # Minimal Transformer encoder for token classification.

    def __init__(self, vocab_size=5000, d_model=128, heads=4, layers=2, num_classes=3, max_len=128):
        super().__init__()
        self.token_embed = nn.Embedding(vocab_size, d_model)
        self.pos_embed = nn.Parameter(torch.randn(1, max_len, d_model) * 0.02)
        block = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=heads,
            dim_feedforward=4 * d_model,
            dropout=0.1,
            batch_first=True,
        )
        self.encoder = nn.TransformerEncoder(block, num_layers=layers)
        self.classifier = nn.Linear(d_model, num_classes)

    def forward(self, token_ids):
        seq_len = token_ids.size(1)
        x = self.token_embed(token_ids) + self.pos_embed[:, :seq_len]
        encoded = self.encoder(x)
        pooled = encoded[:, 0]  # use first token representation
        return self.classifier(pooled)


model = TinyTransformerClassifier()
tokens = torch.randint(0, 5000, (8, 32))
logits = model(tokens)
print(logits.shape)
```

### Code Explanation
- Token embeddings turn discrete IDs into dense vectors.
- Positional embeddings give the model order information.
- Self-attention mixes information across all token positions.
- The classifier reads the pooled sequence representation.
'''
    if kind == "gan":
        return '''```python
import torch
import torch.nn as nn
import torch.nn.functional as F


class Generator(nn.Module):
    def __init__(self, z_dim=100, img_dim=784):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(z_dim, 256), nn.LeakyReLU(0.2),
            nn.Linear(256, 512), nn.LeakyReLU(0.2),
            nn.Linear(512, img_dim), nn.Tanh(),
        )

    def forward(self, z):
        return self.net(z)


class Discriminator(nn.Module):
    def __init__(self, img_dim=784):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(img_dim, 512), nn.LeakyReLU(0.2), nn.Dropout(0.3),
            nn.Linear(512, 256), nn.LeakyReLU(0.2),
            nn.Linear(256, 1),
        )

    def forward(self, x):
        return self.net(x)


G, D = Generator(), Discriminator()
z = torch.randn(32, 100)
fake = G(z)
real = torch.randn(32, 784)

d_real_loss = F.binary_cross_entropy_with_logits(D(real), torch.ones(32, 1))
d_fake_loss = F.binary_cross_entropy_with_logits(D(fake.detach()), torch.zeros(32, 1))
g_loss = F.binary_cross_entropy_with_logits(D(fake), torch.ones(32, 1))

print(d_real_loss.item(), d_fake_loss.item(), g_loss.item())
```

### Code Explanation
- The generator maps random noise into synthetic samples.
- The discriminator outputs raw logits for real/fake prediction.
- `fake.detach()` prevents discriminator updates from changing the generator.
- The generator is trained as if fake samples should be labeled real.
'''
    return f'''```python
import torch
import torch.nn as nn
import torch.nn.functional as F


class TopicModel(nn.Module):
    # Editable baseline for studying {display}.

    def __init__(self, input_dim=128, hidden_dim=256, num_classes=4):
        super().__init__()
        self.feature_extractor = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
        )
        self.classifier = nn.Linear(hidden_dim, num_classes)

    def forward(self, x):
        features = self.feature_extractor(x)
        return self.classifier(features)


model = TopicModel()
batch_x = torch.randn(32, 128)
batch_y = torch.randint(0, 4, (32,))
logits = model(batch_x)
loss = F.cross_entropy(logits, batch_y)
loss.backward()
print(loss.item())
```
'''

def get_mock_curriculum(topic, difficulty: str = "beginner"):
    kind = classify_topic(topic)
    level = (difficulty or "beginner").lower()
    if level not in {"beginner", "intermediate", "advanced"}:
        level = "beginner"

    display = {
        "cnn": "Convolutional Neural Networks",
        "transformer": "Transformers and Attention",
        "gan": "Generative Adversarial Networks",
        "rnn": "Recurrent Neural Networks",
        "autoencoder": "Autoencoders",
        "diffusion": "Diffusion Models",
        "rl": "Reinforcement Learning",
        "fnn": topic,
    }.get(kind, topic)

    roadmaps = {
        "cnn": [
            ("Images as tensors", "Understand height, width, channels, normalization, and why spatial locality matters."),
            ("Convolution filters", "Learn kernels, receptive fields, stride, padding, and parameter sharing."),
            ("Feature maps", "See how early layers detect edges and later layers combine them into object parts."),
            ("Activation and pooling", "Use ReLU and pooling to add non-linearity and reduce spatial size."),
            ("CNN blocks", "Stack conv, normalization, activation, and pooling into reliable feature extractors."),
            ("Classification heads", "Flatten or pool features and map them to class probabilities."),
            ("Training practice", "Apply augmentation, regularization, learning-rate schedules, and validation checks."),
            ("Modern CNNs", "Compare VGG, ResNet, Inception, MobileNet, EfficientNet, and YOLO-style detectors."),
        ],
        "transformer": [
            ("Tokenization", "Split text or patches into discrete units the model can process."),
            ("Embeddings", "Convert tokens into dense vectors and add positional information."),
            ("Queries, keys, values", "Project each token into vectors used to compute attention scores."),
            ("Scaled dot-product attention", "Learn why QK^T is scaled, masked, softmaxed, and multiplied by V."),
            ("Multi-head attention", "Let different heads specialize in syntax, locality, long-range links, or visual regions."),
            ("Feed-forward blocks", "Apply per-token MLPs, residual paths, layer norm, and dropout."),
            ("Encoder vs decoder", "Compare BERT-style understanding with GPT-style generation."),
            ("Scaling and fine-tuning", "Study pretraining, instruction tuning, RAG, LoRA, and evaluation."),
        ],
        "gan": [
            ("Latent noise", "Sample a compact random vector that seeds generated data."),
            ("Generator network", "Transform noise into images, audio, or structured samples."),
            ("Discriminator network", "Classify whether data looks real or generated."),
            ("Adversarial objective", "Understand the minimax loss and why gradients can be unstable."),
            ("Training loop", "Alternate discriminator and generator updates without letting either dominate."),
            ("Failure modes", "Diagnose mode collapse, vanishing gradients, and poor diversity."),
            ("Stabilization methods", "Use DCGAN rules, label smoothing, spectral norm, WGAN-GP, and TTUR."),
            ("Applications", "Generate images, augment datasets, super-resolve images, and translate domains."),
        ],
    }
    roadmap_items = roadmaps.get(kind, [
        ("Foundations", f"Define {topic}, its inputs, outputs, and where it fits in deep learning."),
        ("Core intuition", "Build the mental model before equations or code."),
        ("Mathematical form", "Study variables, objective functions, gradients, and assumptions."),
        ("Architecture", "Break the model into components and follow information flow."),
        ("Training", "Choose loss, optimizer, metrics, and validation strategy."),
        ("Implementation", "Write a clean PyTorch version and test tensor shapes."),
        ("Debugging", "Inspect overfitting, underfitting, unstable gradients, and data leakage."),
        ("Advanced variants", "Connect the concept to modern research and production use cases."),
    ])
    if level == "beginner":
        selected_items = roadmap_items[:5]
        roadmap_intro = "Goal: build intuition, vocabulary, and a clean first mental model before heavy math."
    elif level == "intermediate":
        selected_items = roadmap_items[:7] + [
            ("Implementation choices", "Compare layer choices, regularization, optimizer settings, and validation signals."),
            ("Mini project", f"Build and evaluate a small {display} model with clear train/validation metrics."),
        ]
        roadmap_intro = "Goal: move from basic understanding to architecture decisions, training behavior, and debugging."
    else:
        selected_items = roadmap_items + [
            ("Mathematical derivation", "Derive the forward equations, objective, gradients, and important tensor shapes."),
            ("Optimization dynamics", "Analyze gradient flow, initialization, normalization, curvature, and stability issues."),
            ("Research extensions", f"Connect {display} to modern variants, scaling limits, and production tradeoffs."),
        ]
        roadmap_intro = "Goal: reason mathematically, compare advanced variants, and understand failure modes deeply."

    roadmap = f"# {level.title()} Roadmap: " + display + "\n\n" + roadmap_intro + "\n\n" + "\n".join(
        f"{i}. **{title}** - {desc}" for i, (title, desc) in enumerate(selected_items, 1)
    )

    content = f"""# {display}: Complete Theory

## 1. Beginner Intuition
{display} is not just a name for a model; it is a design pattern for turning raw data into useful representations. The central idea is to choose an architecture whose structure matches the structure of the data. When the structure is right, the model learns faster, generalizes better, and needs fewer unnecessary parameters.

## 2. Why It Is Needed
In real tasks, data is high-dimensional and noisy. A useful deep learning system must discover stable patterns, ignore irrelevant variation, and produce outputs that can be optimized with a loss function. {display} helps by defining how information should move through layers, what parameters are shared, and where the model should focus its capacity.

## 3. Core Components
- **Input representation:** The format given to the model, such as images, tokens, sequences, features, or noise vectors.
- **Learned transformation:** Layers with trainable weights that convert simple signals into richer features.
- **Non-linearity:** Activation functions that let the model learn relationships beyond straight lines.
- **Objective function:** A loss that tells the model what good behavior means.
- **Optimization loop:** Forward pass, loss computation, backpropagation, and parameter update.
- **Evaluation:** Metrics and validation checks that reveal whether the model is learning or memorizing.

## 4. Step-by-Step Working
1. Prepare input tensors with the correct shape and scale.
2. Pass the data through architecture-specific layers.
3. Build intermediate representations that capture useful structure.
4. Convert the final representation into predictions.
5. Compare predictions with the target using a loss function.
6. Backpropagate gradients through every differentiable operation.
7. Update parameters using an optimizer such as Adam or SGD.
8. Repeat until validation performance stops improving.

## 5. Mathematical Intuition
Most deep learning models can be viewed as a composition of functions:

`y_hat = f_L(...f_2(f_1(x; W_1); W_2)...; W_L)`

Training minimizes an objective:

`min_W mean(L(y_hat, y)) + regularization`

Backpropagation applies the chain rule so each parameter receives credit or blame for the final error. The architecture decides which transformations are possible and which patterns are easy for the model to learn.

## 6. Architecture Breakdown
For **{display}**, focus on the data flow: input preparation, representation layers, task head, loss, and feedback through gradients. A strong implementation always checks tensor shapes, watches the loss curve, compares train and validation metrics, and inspects a few real predictions.

## 7. Practical Training Advice
- Start with a small model and verify that it can overfit a tiny batch.
- Normalize inputs and keep tensor shapes explicit.
- Track train loss, validation loss, and task metrics separately.
- Use regularization only after confirming the model can learn.
- Save the best validation checkpoint, not just the final epoch.

## 8. Common Mistakes
- Using the wrong input shape.
- Applying softmax before `CrossEntropyLoss` in PyTorch.
- Judging only training accuracy.
- Ignoring class imbalance or data leakage.
- Making the model larger before fixing the data pipeline.

## 9. Interview Questions
1. What inductive bias does {display} add?
2. Which tensors are learned and which are fixed?
3. How does the loss gradient reach early layers?
4. What symptoms suggest underfitting or overfitting?
5. How would you debug a model whose loss does not decrease?

## 10. Summary
Learn the intuition first, then the architecture, then the training loop. The strongest understanding comes from tracing one example from input tensor to prediction and then tracing the gradient back to the parameters.
"""

    if level == "beginner":
        content = f"""# {display}: Beginner Theory

## 1. Simple Idea
{display} is a way to teach a neural network to recognize useful patterns from data. Think of it as a pipeline: input goes in, layers transform it step by step, and the final layer produces a prediction.

## 2. Why It Is Useful
Raw data is usually messy. Images contain many pixels, text contains many tokens, and signals contain noise. A deep learning model learns which parts matter for the task and which parts can be ignored.

## 3. Main Building Blocks
- **Input:** The data given to the model.
- **Layers:** Small processing steps that learn patterns.
- **Activation:** A function that helps the model learn non-simple relationships.
- **Prediction:** The model's answer.
- **Loss:** A score that tells the model how wrong it was.
- **Optimizer:** The update rule that improves the model after each mistake.

## 4. How It Works
1. Prepare the input in the right shape.
2. Pass it through the model.
3. Get a prediction.
4. Compare the prediction with the correct answer.
5. Update the model so it performs better next time.

## 5. Beginner Checklist
- Can you explain what the input and output are?
- Can you identify the main layers?
- Can you explain what loss means?
- Can you run a small example without tensor shape errors?
"""
        content += f"""

## Difficulty Focus: Beginner
This version stays practical and avoids heavy formulas. Focus on intuition, vocabulary, and the basic training flow before moving into advanced math.

### What To Master First
- The meaning of input tensors and output logits.
- The role of layers, activations, loss, and optimizer.
- The difference between training accuracy and validation accuracy.
- One simple implementation that runs without shape errors.
"""
    elif level == "intermediate":
        content += f"""

## Difficulty Focus: Intermediate
This version goes beyond definitions and asks how design choices affect learning. You should compare alternatives, predict training behavior, and debug common failures.

### Deeper Topics
- Architecture tradeoffs: capacity, parameter sharing, depth, and regularization.
- Training dynamics: learning rate, batch size, optimizer choice, and validation curves.
- Generalization: augmentation, dropout, normalization, early stopping, and data leakage.
- Diagnostics: gradient norms, confusion matrix, ablation tests, and overfitting checks.

### Practical Task
Train a baseline, change one architectural choice, and explain whether the validation metric improved for the reason you expected.
"""
    else:
        content += f"""

## Difficulty Focus: Advanced
This version treats {display} as a mathematical system. The goal is to reason about equations, gradients, stability, and advanced variants.

### Mathematical View
Represent the model as a parameterized function:

`f_theta: X -> Y`

Training solves:

`theta* = argmin_theta (1/N) sum_i L(f_theta(x_i), y_i) + lambda Omega(theta)`

Gradient-based learning updates parameters as:

`theta_(t+1) = theta_t - eta * grad_theta L(theta_t)`

The important advanced question is not only whether the loss decreases, but why the gradient signal is useful, noisy, unstable, biased, or poorly conditioned.

### Advanced Analysis Checklist
- Derive tensor shapes at every layer.
- Identify which operations are linear, non-linear, normalized, or stochastic.
- Explain how gradients flow to early layers.
- Discuss computational complexity and memory cost.
- Compare at least two variants and name the tradeoff each one makes.
- Connect the method to current architectures or research systems.
"""

    content += build_specific_theory(display, kind)
    code = build_code_example(display, kind)
    if level == "advanced":
        code += """

### Advanced Code Exercises
- Add hooks to inspect activation means, variances, and gradient norms.
- Run an ablation by removing normalization or dropout.
- Log train/validation loss separately and explain any gap.
- Compute parameter count and estimate memory use for one batch.
"""
    elif level == "intermediate":
        code += """

### Intermediate Code Exercises
- Change the hidden size or channel count and compare validation accuracy.
- Add a scheduler and inspect whether convergence becomes smoother.
- Save the best checkpoint based on validation loss.
"""

    graph = build_visualization_graph(topic)
    visualization = f"""# Visual Explanation

The animated diagram above shows the information flow for **{display}**. Read it from left to right:

1. The input enters in its raw representation.
2. Architecture-specific layers transform it into more useful features.
3. A task head converts those features into predictions.
4. During training, the loss sends gradient signals backward so earlier layers improve.

Use the moving particles as the forward signal. In a real model, the backward signal follows the same computational graph in reverse during backpropagation.
"""

    return {
        "plan": roadmap,
        "content": content,
        "code": code,
        "visualization": visualization,
        "visualization_graph": graph,
        "quiz": build_mock_quiz(topic, difficulty=level),
    }


def build_mock_quiz(topic: str, count: int = 5, difficulty: str = "beginner") -> str:
    import json
    questions = build_quiz_questions(topic, count, difficulty)
    return json.dumps(questions, ensure_ascii=False)


def build_quiz_questions(topic: str, count: int = 5, difficulty: str = "beginner") -> List[Dict[str, Any]]:
    questions = [
        {
            "q": f"What is the main goal of studying {topic}?",
            "options": ["To learn useful representations from data", "To delete noisy data", "To avoid training", "To replace evaluation metrics"],
            "answer": 0,
            "explanation": f"{topic} is useful because it helps a model transform raw inputs into representations that support prediction or generation.",
        },
        {
            "q": "What happens during backpropagation?",
            "options": ["The model computes gradients for trainable parameters", "The dataset is shuffled permanently", "The optimizer removes layers", "The validation set updates weights"],
            "answer": 0,
            "explanation": "Backpropagation applies the chain rule to compute how each parameter contributed to the loss.",
        },
        {
            "q": "Why should validation loss be monitored?",
            "options": ["It reveals generalization outside the training batch", "It always equals training loss", "It replaces the optimizer", "It prevents the forward pass"],
            "answer": 0,
            "explanation": "Validation loss helps detect overfitting and shows whether the model works on examples it did not train on.",
        },
        {
            "q": "Which PyTorch loss expects raw class logits?",
            "options": ["nn.CrossEntropyLoss", "nn.MSELoss only", "nn.Dropout", "nn.ReLU"],
            "answer": 0,
            "explanation": "CrossEntropyLoss internally applies log-softmax, so passing already-softmaxed probabilities is a common mistake.",
        },
        {
            "q": "What is a reliable first debugging check?",
            "options": ["Overfit a tiny batch", "Increase model size immediately", "Remove all metrics", "Train only on validation data"],
            "answer": 0,
            "explanation": "If a model cannot overfit a tiny batch, there may be a bug in data shapes, labels, loss, or training code.",
        },
    ]
    level = (difficulty or "beginner").lower()
    if level == "intermediate":
        questions = [
            {
                "q": f"Which signal best indicates that a {topic} model is overfitting?",
                "options": ["Training loss falls while validation loss rises", "Both losses fall together", "The model has parameters", "The batch size is greater than one"],
                "answer": 0,
                "explanation": "Overfitting appears when the model keeps improving on training data but gets worse on held-out data.",
            },
            {
                "q": "Why run an ablation experiment?",
                "options": ["To isolate the effect of one design choice", "To hide validation results", "To avoid comparing models", "To remove the loss function"],
                "answer": 0,
                "explanation": "Ablations help determine whether a component actually improves the model.",
            },
        ] + questions
    elif level == "advanced":
        questions = [
            {
                "q": f"In advanced analysis of {topic}, what does poor gradient flow usually affect first?",
                "options": ["Optimization stability and early-layer learning", "Only the file name", "Only the test-set labels", "The Python import order"],
                "answer": 0,
                "explanation": "Poor gradient flow can make early layers learn slowly, explode, vanish, or become unstable.",
            },
            {
                "q": "What does the regularization term lambda Omega(theta) control?",
                "options": ["A penalty on model complexity or parameter behavior", "The number of CPU cores", "The raw input filename", "The display color of charts"],
                "answer": 0,
                "explanation": "Regularization modifies the objective to discourage overly complex or unstable solutions.",
            },
            {
                "q": "Why track activation statistics in an advanced debugging workflow?",
                "options": ["To detect saturation, dead units, or distribution drift", "To skip backpropagation", "To convert labels into images", "To remove the optimizer"],
                "answer": 0,
                "explanation": "Activation means and variances reveal whether internal representations are healthy during training.",
            },
        ] + questions
    return questions[:count]




# --- Topic-aware offline curriculum overrides ---
def classify_topic(topic: str) -> str:
    text = topic.lower()
    checks = [
        ("cnn", ["cnn", "convolution", "vision", "image", "resnet", "vgg", "yolo", "object detection"]),
        ("transformer", ["transformer", "attention", "bert", "gpt", "llm", "vit", "self-attention"]),
        ("gan", ["gan", "generative adversarial", "dcgan", "stylegan", "generator", "discriminator"]),
        ("rnn", ["rnn", "lstm", "gru", "sequence", "recurrent"]),
        ("autoencoder", ["autoencoder", "vae", "variational", "encoder", "decoder", "latent"]),
        ("diffusion", ["diffusion", "ddpm", "denoise", "stable diffusion", "score model"]),
        ("rl", ["reinforcement", "q-learning", "ppo", "dqn", "actor", "critic", "agent"]),
        ("gnn", ["graph neural", "gnn", "graph convolution", "message passing"]),
        ("backprop", ["backprop", "back propagation", "chain rule"]),
        ("gradient", ["gradient descent", "sgd", "adam", "optimizer", "optimization"]),
        ("normalization", ["batch normalization", "batch norm", "layer norm", "normalization"]),
        ("dropout", ["dropout", "regularization", "overfitting"]),
        ("transfer", ["transfer learning", "fine tuning", "finetuning", "pretrained"]),
        ("nlp", ["natural language", "nlp", "tokenization", "embedding"]),
    ]
    for kind, words in checks:
        if any(word in text for word in words):
            return kind
    return "fnn"


def topic_profile(topic: str) -> Dict[str, Any]:
    kind = classify_topic(topic)
    display = {
        "cnn": "Convolutional Neural Networks",
        "transformer": "Transformers and Attention",
        "gan": "Generative Adversarial Networks",
        "rnn": "Recurrent Neural Networks",
        "autoencoder": "Autoencoders",
        "diffusion": "Diffusion Models",
        "rl": "Reinforcement Learning",
        "gnn": "Graph Neural Networks",
        "backprop": "Backpropagation",
        "gradient": "Gradient Descent and Optimizers",
        "normalization": "Normalization Layers",
        "dropout": "Dropout and Regularization",
        "transfer": "Transfer Learning",
        "nlp": "Natural Language Processing",
        "fnn": topic.strip() or "Deep Learning",
    }[kind]

    data = {
        "cnn": {
            "input": "image tensor",
            "output": "class logits or bounding predictions",
            "core": ["convolution filters", "feature maps", "pooling or stride", "classification head"],
            "flow": ["Input Image", "Conv Filters", "Feature Maps", "Pooling", "Classifier"],
            "edges": ["scan", "detect", "compress", "predict"],
            "arch": "cnn",
            "math": "Y[b, k, i, j] = sum_c sum_u sum_v X[b, c, i+u, j+v] * W[k, c, u, v]",
            "risk": "losing spatial detail too early or overfitting small image datasets",
        },
        "transformer": {
            "input": "tokens or image patches",
            "output": "contextual token vectors or generated tokens",
            "core": ["token embeddings", "positional encoding", "Q/K/V projections", "multi-head attention"],
            "flow": ["Tokens", "Embeddings", "Q K V", "Attention Scores", "Output Head"],
            "edges": ["embed", "project", "compare", "decode"],
            "arch": "transformer",
            "math": "Attention(Q,K,V) = softmax(QK^T / sqrt(d_k))V",
            "risk": "quadratic attention cost and weak positional or masking design",
        },
        "gan": {
            "input": "latent noise plus real samples",
            "output": "generated samples and real/fake judgments",
            "core": ["latent vector", "generator", "discriminator", "adversarial loss"],
            "flow": ["Noise z", "Generator", "Fake Sample", "Discriminator", "Real/Fake"],
            "edges": ["sample", "generate", "judge", "feedback"],
            "arch": "gan",
            "math": "min_G max_D E[log D(x)] + E[log(1 - D(G(z)))]",
            "risk": "mode collapse, unstable discriminator-generator balance, and weak gradients",
        },
        "rnn": {
            "input": "ordered sequence",
            "output": "hidden states or sequence predictions",
            "core": ["time step input", "hidden state", "memory gate", "sequence output"],
            "flow": ["x_t", "Hidden State", "Gate Update", "Memory", "Output"],
            "edges": ["read", "update", "carry", "predict"],
            "arch": "rnn",
            "math": "h_t = phi(W_x x_t + W_h h_(t-1) + b)",
            "risk": "vanishing gradients and difficulty with very long dependencies",
        },
        "autoencoder": {
            "input": "data sample to reconstruct",
            "output": "reconstructed sample",
            "core": ["encoder", "latent bottleneck", "decoder", "reconstruction loss"],
            "flow": ["Input", "Encoder", "Latent z", "Decoder", "Reconstruction"],
            "edges": ["compress", "encode", "expand", "compare"],
            "arch": "autoencoder",
            "math": "min ||x - decoder(encoder(x))||^2",
            "risk": "learning identity mappings without useful compressed representations",
        },
        "diffusion": {
            "input": "noise and conditioning",
            "output": "denoised sample",
            "core": ["forward noise process", "U-Net denoiser", "timestep embedding", "reverse sampling"],
            "flow": ["Clean Data", "Add Noise", "Noisy x_t", "Denoiser", "Sample"],
            "edges": ["corrupt", "condition", "denoise", "iterate"],
            "arch": "diffusion",
            "math": "epsilon_theta(x_t, t) learns to predict the noise added at timestep t",
            "risk": "slow sampling and poor noise schedule or conditioning design",
        },
        "rl": {
            "input": "state from an environment",
            "output": "action policy or value estimate",
            "core": ["agent", "environment", "reward", "policy/value update"],
            "flow": ["State", "Agent", "Action", "Environment", "Reward"],
            "edges": ["observe", "choose", "act", "learn"],
            "arch": "rl",
            "math": "maximize E[sum_t gamma^t r_t]",
            "risk": "sparse rewards, unstable exploration, and off-policy distribution shift",
        },
        "gnn": {
            "input": "nodes, edges, and features",
            "output": "node, edge, or graph predictions",
            "core": ["node features", "edge structure", "message passing", "readout"],
            "flow": ["Node Features", "Neighbors", "Messages", "Aggregation", "Readout"],
            "edges": ["send", "aggregate", "update", "predict"],
            "arch": "fnn",
            "math": "h_v' = phi(h_v, AGG({h_u: u in N(v)}))",
            "risk": "over-smoothing and poor handling of graph heterogeneity",
        },
        "backprop": {
            "input": "loss value from the forward pass",
            "output": "gradients for each parameter",
            "core": ["loss", "local derivatives", "chain rule", "parameter gradients"],
            "flow": ["Loss", "Output Grad", "Hidden Grad", "Weight Grad", "Update"],
            "edges": ["differentiate", "chain", "accumulate", "step"],
            "arch": "fnn",
            "math": "dL/dW_l = (dL/da_l)(da_l/dz_l)(dz_l/dW_l)",
            "risk": "vanishing, exploding, or incorrectly accumulated gradients",
        },
        "gradient": {
            "input": "parameters and gradients",
            "output": "updated parameters",
            "core": ["learning rate", "gradient direction", "optimizer state", "convergence"],
            "flow": ["Parameters", "Gradient", "Learning Rate", "Optimizer", "New Parameters"],
            "edges": ["measure", "scale", "update", "iterate"],
            "arch": "fnn",
            "math": "theta_(t+1) = theta_t - eta * grad_theta L(theta_t)",
            "risk": "overshooting, slow convergence, saddle points, or noisy updates",
        },
        "normalization": {
            "input": "layer activations",
            "output": "normalized activations",
            "core": ["batch statistics", "scale gamma", "shift beta", "stable gradients"],
            "flow": ["Activations", "Mean/Variance", "Normalize", "Scale/Shift", "Next Layer"],
            "edges": ["measure", "standardize", "affine", "stabilize"],
            "arch": "fnn",
            "math": "y = gamma * ((x - mean) / sqrt(var + eps)) + beta",
            "risk": "small batch instability or mismatch between training and inference statistics",
        },
        "dropout": {
            "input": "layer activations",
            "output": "randomly masked activations",
            "core": ["mask sampling", "activation dropping", "ensemble effect", "inference scaling"],
            "flow": ["Activations", "Random Mask", "Dropped Units", "Robust Features", "Prediction"],
            "edges": ["sample", "mask", "regularize", "infer"],
            "arch": "fnn",
            "math": "h_drop = m * h / p where m ~ Bernoulli(p)",
            "risk": "underfitting if dropout is too high or placed poorly",
        },
        "transfer": {
            "input": "pretrained model and target dataset",
            "output": "adapted model",
            "core": ["frozen backbone", "new head", "fine-tuning", "domain shift"],
            "flow": ["Pretrained Model", "Frozen Layers", "New Head", "Fine Tune", "Target Task"],
            "edges": ["reuse", "adapt", "train", "evaluate"],
            "arch": "fnn",
            "math": "theta = [theta_pretrained, theta_task], often train theta_task first",
            "risk": "catastrophic forgetting or mismatch between source and target domains",
        },
        "nlp": {
            "input": "raw text",
            "output": "tokens, embeddings, labels, or generated text",
            "core": ["tokenization", "embeddings", "context modeling", "task head"],
            "flow": ["Text", "Tokens", "Embeddings", "Context Model", "Task Output"],
            "edges": ["split", "embed", "contextualize", "predict"],
            "arch": "transformer",
            "math": "p(token_t | context) from softmax over vocabulary logits",
            "risk": "tokenization mismatch, bias, hallucination, and long-context cost",
        },
    }
    profile = data.get(kind, {
        "input": "feature tensor",
        "output": "prediction or representation",
        "core": ["input features", "hidden layers", "loss function", "optimizer"],
        "flow": ["Input", "Features", "Hidden Layers", "Loss", "Prediction"],
        "edges": ["encode", "transform", "score", "update"],
        "arch": "fnn",
        "math": "y_hat = f_theta(x)",
        "risk": "using a generic architecture without checking data assumptions",
    })
    profile["kind"] = kind
    profile["display"] = display
    return profile


def build_visualization_graph(topic: str) -> Dict[str, Any]:
    p = topic_profile(topic)
    colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"]
    y_positions = [50, 35, 62, 42, 55]
    nodes = [
        {"id": f"n{i + 1}", "label": label, "x": 10 + i * 20, "y": y_positions[i % len(y_positions)], "color": colors[i % len(colors)]}
        for i, label in enumerate(p["flow"])
    ]
    edges = [
        {"source": f"n{i + 1}", "target": f"n{i + 2}", "label": p["edges"][i] if i < len(p["edges"]) else "flow"}
        for i in range(len(nodes) - 1)
    ]
    return {
        "architectureType": p["arch"],
        "topicName": topic,
        "description": f"{p['display']} visualization for '{topic}': {p['input']} becomes {p['output']} through {', '.join(p['core'][:3])}.",
        "nodes": nodes,
        "edges": edges,
    }


def _md_list(items: List[str]) -> str:
    return "\n".join(f"- {item}" for item in items)


def build_roadmap(profile: Dict[str, Any], level: str) -> str:
    display = profile["display"]
    core = profile["core"]
    if level == "beginner":
        items = [
            f"What {display} means",
            f"Inputs and outputs: {profile['input']} -> {profile['output']}",
            f"Core parts: {', '.join(core[:3])}",
            "One small worked example",
            "Common beginner mistakes",
        ]
        goal = "Build intuition and vocabulary. Keep the path short and practical."
    elif level == "intermediate":
        items = [
            f"Review the {display} data flow",
            f"Architecture components: {', '.join(core)}",
            "Training loop and validation strategy",
            "Important hyperparameters and tradeoffs",
            f"Debugging risk: {profile['risk']}",
            "Implementation checklist",
            "Mini project and evaluation",
        ]
        goal = "Move from knowing the idea to building, tuning, and debugging it."
    else:
        items = [
            f"Formal problem setup for {display}",
            f"Forward equation: {profile['math']}",
            "Loss design and assumptions",
            "Gradient flow and optimization dynamics",
            "Complexity, memory, and scaling limits",
            f"Failure mode analysis: {profile['risk']}",
            "Advanced variants and research connections",
            "Ablation and diagnostic experiments",
            "Production evaluation and monitoring",
        ]
        goal = "Reason mathematically and compare advanced design choices."
    return f"# {level.title()} Roadmap: {display}\n\n{goal}\n\n" + "\n".join(
        f"{i}. {item}" for i, item in enumerate(items, 1)
    )


def build_theory(profile: Dict[str, Any], topic: str, level: str) -> str:
    display = profile["display"]
    if level == "beginner":
        sections = [
            ("Simple Meaning", f"{display} is a deep learning idea used to turn {profile['input']} into {profile['output']}. For '{topic}', focus first on what goes in, what comes out, and which steps transform the data."),
            ("Why It Matters", f"It helps the model learn useful patterns instead of relying on hand-written rules. The important beginner idea is that each layer or step learns a small useful transformation."),
            ("Main Parts", _md_list([f"**{part}:** one essential part of the {display} pipeline." for part in profile["core"]])),
            ("Basic Flow", " -> ".join(profile["flow"])),
            ("Beginner Practice", f"Draw the pipeline for '{topic}', label the input and output, then explain the role of each step in one sentence."),
        ]
    elif level == "intermediate":
        sections = [
            ("Working Definition", f"{display} is best understood as a trainable system whose components are chosen to match the structure of {profile['input']}."),
            ("Architecture Decisions", _md_list([f"Choose and tune **{part}** based on data size, compute budget, and validation behavior." for part in profile["core"]])),
            ("Training Behavior", "Track training loss, validation loss, task metrics, gradient norms, and sample predictions. Do not trust a single metric by itself."),
            ("Tradeoffs", f"The main tradeoff for this topic is {profile['risk']}. A good implementation tests whether that risk is happening rather than guessing."),
            ("Debugging Checklist", _md_list(["Verify tensor shapes.", "Overfit a tiny batch.", "Compare train vs validation curves.", "Run one ablation.", "Inspect wrong predictions."])),
            ("Mini Project", f"Build a small {display} example for '{topic}', change one hyperparameter, and explain the validation result."),
            ("Interview Angle", "Be ready to explain why this architecture fits the data better than a plain fully connected network."),
        ]
    else:
        sections = [
            ("Formal Setup", f"Let the model be `f_theta` mapping {profile['input']} to {profile['output']}. The objective is to find parameters that minimize expected task loss."),
            ("Forward Mathematics", f"Core relation: `{profile['math']}`. Identify each tensor shape and which variables are learned."),
            ("Objective Function", "`theta* = argmin_theta (1/N) sum_i L(f_theta(x_i), y_i) + lambda Omega(theta)` combines empirical loss and regularization."),
            ("Gradient Reasoning", "Analyze how `grad_theta L` travels through the computational graph, where it can vanish, explode, become noisy, or become biased."),
            ("Complexity", "Estimate memory from activations plus parameters, and estimate compute from the dominant matrix, convolution, attention, or sampling operation."),
            ("Failure Modes", f"Primary risk: {profile['risk']}. Advanced work requires diagnosing the mechanism, not only naming the symptom."),
            ("Advanced Variants", f"Compare at least two variants of {display}; explain what each changes in the objective, architecture, or training dynamics."),
            ("Experiments", "Run ablations, calibration checks, robustness tests, and validation-set error analysis."),
            ("Research Summary", f"For '{topic}', connect the method to scaling behavior, data requirements, and deployment constraints."),
        ]
    return f"# {display}: {level.title()} Explanation\n\n" + "\n\n".join(
        f"## {i}. {title}\n{body}" for i, (title, body) in enumerate(sections, 1)
    )


def build_visual_text(profile: Dict[str, Any], topic: str) -> str:
    return f"""# Topic-Specific Visual Guide

This visual is generated for **{topic}**, not a generic neural network. Follow the animated path:

{_md_list([f"{i + 1}. **{label}**" for i, label in enumerate(profile["flow"])])}

The labels and arrows match the concept family: **{profile["display"]}**.
"""


def get_mock_curriculum(topic, difficulty: str = "beginner"):
    level = (difficulty or "beginner").lower()
    if level not in {"beginner", "intermediate", "advanced"}:
        level = "beginner"
    profile = topic_profile(topic)
    code = build_code_example(profile["display"], profile["kind"])
    if level == "intermediate":
        code += "\n### Intermediate Task\nChange one architecture or optimizer setting, then compare validation loss before and after the change.\n"
    elif level == "advanced":
        code += f"\n### Advanced Task\nDerive or verify this relation for the topic: `{profile['math']}`. Add hooks to inspect gradient norms and activation statistics.\n"
    return {
        "plan": build_roadmap(profile, level),
        "content": build_theory(profile, topic, level),
        "code": code,
        "visualization": build_visual_text(profile, topic),
        "visualization_graph": build_visualization_graph(topic),
        "quiz": build_mock_quiz(topic, difficulty=level),
    }


def build_mock_quiz(topic: str, count: int = 5, difficulty: str = "beginner") -> str:
    import json
    return json.dumps(build_quiz_questions(topic, count, difficulty), ensure_ascii=False)


def build_quiz_questions(topic: str, count: int = 5, difficulty: str = "beginner") -> List[Dict[str, Any]]:
    p = topic_profile(topic)
    display = p["display"]
    level = (difficulty or "beginner").lower()
    if level == "beginner":
        questions = [
            {"q": f"What is the input usually used in {topic}?", "options": [p["input"], "A database password", "Only the final loss value", "A browser URL"], "answer": 0, "explanation": f"For {display}, the starting point is usually {p['input']}."},
            {"q": f"What is the expected output of {topic}?", "options": [p["output"], "A deleted dataset", "A random filename", "A fixed constant for every input"], "answer": 0, "explanation": f"The goal is to produce {p['output']}."},
            {"q": f"Which component belongs to {display}?", "options": [p["core"][0], "HTML routing", "Disk formatting", "Screen brightness"], "answer": 0, "explanation": f"{p['core'][0]} is part of this topic's learning pipeline."},
            {"q": "What does the loss tell the model?", "options": ["How wrong the prediction was", "Which CSS file to load", "How to skip training", "The user's monitor size"], "answer": 0, "explanation": "Loss gives the training signal used to update model parameters."},
            {"q": f"What should a beginner draw for {topic}?", "options": ["The input-to-output pipeline", "Only the final accuracy number", "A package-lock file", "A random table"], "answer": 0, "explanation": "A pipeline diagram builds the correct mental model first."},
        ]
    elif level == "intermediate":
        questions = [
            {"q": f"Which issue should you watch for when training {topic}?", "options": [p["risk"], "The topic title being too short", "The browser tab color", "The keyboard layout"], "answer": 0, "explanation": f"A real intermediate concern is {p['risk']}."},
            {"q": "Why compare training and validation loss?", "options": ["To detect generalization problems", "To avoid using data", "To remove gradients", "To rename tensors"], "answer": 0, "explanation": "The gap between train and validation behavior often reveals overfitting or data mismatch."},
            {"q": f"Which step is most topic-specific for {display}?", "options": [p["core"][1] if len(p["core"]) > 1 else p["core"][0], "Changing the app theme", "Deleting checkpoints", "Ignoring labels"], "answer": 0, "explanation": "This component is part of the architecture or algorithm for the selected topic."},
            {"q": "What is an ablation experiment?", "options": ["Removing or changing one component to measure its effect", "Training without metrics", "Only reading documentation", "Changing all variables at once"], "answer": 0, "explanation": "Ablations isolate which design choices matter."},
            {"q": f"What should you inspect after a bad {topic} result?", "options": ["Shapes, data examples, metrics, and wrong predictions", "Only the page title", "Only node_modules", "Nothing"], "answer": 0, "explanation": "Debugging needs evidence from data, tensors, metrics, and errors."},
        ]
    else:
        questions = [
            {"q": f"Which formula best matches advanced analysis of {topic}?", "options": [p["math"], "margin: 0 auto", "npm run dev", "x = filename"], "answer": 0, "explanation": "Advanced understanding should connect the topic to its core mathematical relation."},
            {"q": "What does gradient-flow analysis study?", "options": ["How useful error signals reach parameters", "How files move between folders", "How to disable training", "How to hide validation loss"], "answer": 0, "explanation": "Gradient flow determines whether early and deep parameters can learn effectively."},
            {"q": f"What advanced risk is most relevant to {display}?", "options": [p["risk"], "Too many browser bookmarks", "Wrong button color", "Too few comments in CSS"], "answer": 0, "explanation": f"For this topic, a major risk is {p['risk']}."},
            {"q": "Why estimate computational complexity?", "options": ["To understand scaling, memory, and latency limits", "To avoid writing equations", "To remove the optimizer", "To change the topic name"], "answer": 0, "explanation": "Advanced model choices must account for compute and memory constraints."},
            {"q": "What makes an advanced answer stronger than a beginner answer?", "options": ["Equations, assumptions, failure modes, and experimental evidence", "More generic slogans", "Less detail", "No validation"], "answer": 0, "explanation": "Advanced answers justify the model mathematically and empirically."},
        ]
    return questions[:count]


# Final quiz override: topic-specific questions with varied correct positions.
def build_quiz_questions(topic: str, count: int = 5, difficulty: str = "beginner") -> List[Dict[str, Any]]:
    p = topic_profile(topic)
    display = p["display"]
    level = (difficulty or "beginner").lower()
    if level == "beginner":
        questions = [
            {"q": f"For {topic}, what usually goes into the model or process?", "options": ["Only a CSS file", p["input"], "A random password", "The final accuracy score"], "answer": 1, "explanation": f"{display} starts from {p['input']}."},
            {"q": f"What should {topic} produce?", "options": ["A deleted dataset", "A browser refresh", p["output"], "Nothing during training"], "answer": 2, "explanation": f"The useful output is {p['output']}."},
            {"q": f"Which part is actually related to {display}?", "options": ["Screen brightness", "File compression", "HTML buttons", p["core"][0]], "answer": 3, "explanation": f"{p['core'][0]} belongs to the selected topic pipeline."},
            {"q": "Why do we use a loss function?", "options": ["To measure prediction error", "To skip the optimizer", "To choose a font", "To delete tensors"], "answer": 0, "explanation": "The loss measures how wrong the model is and creates the learning signal."},
            {"q": f"What is the best beginner first step for {topic}?", "options": ["Tune ten things at once", "Draw the input-to-output flow", "Ignore the data shape", "Start with deployment"], "answer": 1, "explanation": "A simple flow diagram makes the concept easier to understand before code or math."},
        ]
    elif level == "intermediate":
        focus = p["core"][1] if len(p["core"]) > 1 else p["core"][0]
        questions = [
            {"q": f"What practical issue should you watch for in {topic}?", "options": ["Wrong nav color", p["risk"], "Too many markdown headings", "The topic name being long"], "answer": 1, "explanation": f"For {display}, a real training/design risk is {p['risk']}."},
            {"q": "What does an ablation experiment test?", "options": ["One design change at a time", "All changes at once", "Only the UI layout", "Only the file path"], "answer": 0, "explanation": "Ablations isolate the effect of a component or hyperparameter."},
            {"q": f"Which component is important for {display}?", "options": ["Package lock sorting", "Image download path", focus, "Browser zoom level"], "answer": 2, "explanation": f"{focus} is one of the topic-specific parts you should understand."},
            {"q": "Why compare training and validation curves?", "options": ["To hide overfitting", "To avoid metrics", "To disable gradients", "To diagnose generalization"], "answer": 3, "explanation": "The relationship between training and validation curves reveals underfitting, overfitting, and data mismatch."},
            {"q": f"After a weak {topic} result, what should you inspect?", "options": ["Only the page heading", "Tensor shapes, examples, metrics, and wrong predictions", "Only node_modules", "Nothing"], "answer": 1, "explanation": "Intermediate debugging needs evidence from data, tensors, metrics, and errors."},
        ]
    else:
        questions = [
            {"q": f"Which relation best matches advanced analysis of {topic}?", "options": ["npm run dev", p["math"], "display: flex", "x = filename"], "answer": 1, "explanation": "Advanced understanding connects the topic to its mathematical relation."},
            {"q": "What does gradient-flow analysis study?", "options": ["How error signals reach trainable parameters", "How CSS loads", "How folders are renamed", "How to skip validation"], "answer": 0, "explanation": "Gradient flow determines whether parameters can learn effectively and stably."},
            {"q": f"What advanced failure mode matters for {display}?", "options": ["Wrong button radius", "Too many routes", "No README", p["risk"]], "answer": 3, "explanation": f"A serious topic-specific issue is {p['risk']}."},
            {"q": "Why estimate compute or memory complexity?", "options": ["To remove the model", "To understand scaling limits", "To avoid equations", "To change the topic"], "answer": 1, "explanation": "Advanced model design must account for latency, memory, and scaling constraints."},
            {"q": "What makes an answer advanced?", "options": ["Only more text", "No examples", "Equations, assumptions, failure modes, and evidence", "Removing validation"], "answer": 2, "explanation": "Advanced answers justify claims mathematically and experimentally."},
        ]
    return questions[:count]


# Final content-depth override: richer roadmap and explanation by level.
def build_roadmap(profile: Dict[str, Any], level: str) -> str:
    display = profile["display"]
    core = profile["core"]
    if level == "beginner":
        items = [
            ("Meaning and purpose", f"Understand what {display} is used for and why it is useful for {profile['input']}."),
            ("Input and output", f"Identify the input as {profile['input']} and the output as {profile['output']}."),
            ("Core vocabulary", f"Learn these words first: {', '.join(core)}."),
            ("Pipeline intuition", "Trace one example through the visual flow from left to right."),
            ("Training idea", "Understand prediction, loss, correction, and repeated improvement."),
            ("Simple example", f"Run or read one small {display} example and explain each line in plain language."),
            ("Common mistakes", "Watch for wrong shapes, unclear target labels, and judging only training accuracy."),
        ]
        goal = "Beginner goal: build strong intuition, simple vocabulary, and a clear input-to-output picture."
    elif level == "intermediate":
        items = [
            ("Concept recap", f"Summarize the purpose of {display} without memorized wording."),
            ("Data assumptions", f"Explain why {profile['input']} is a good fit for this method."),
            ("Architecture components", f"Study how {', '.join(core)} cooperate in the model or algorithm."),
            ("Training loop", "Connect forward pass, loss, backpropagation, optimizer step, and validation metrics."),
            ("Hyperparameters", "Tune learning rate, batch size, regularization, model width/depth, or topic-specific settings."),
            ("Tradeoffs", f"Analyze the main risk: {profile['risk']}."),
            ("Debugging workflow", "Use shape checks, tiny-batch overfitting, validation curves, and wrong-example inspection."),
            ("Implementation project", f"Build a small {display} demo, change one design choice, and compare results."),
            ("Evaluation", "Report metric changes and explain whether the result supports your design choice."),
        ]
        goal = "Intermediate goal: move from understanding to building, tuning, debugging, and explaining tradeoffs."
    else:
        items = [
            ("Formal setup", f"Define input space, output space, parameters, and assumptions for {display}."),
            ("Forward mathematics", f"Use the core relation: {profile['math']}."),
            ("Tensor-shape derivation", "Track dimensions through every operation and identify learned parameters."),
            ("Objective function", "Define the task loss, regularization term, and what distribution the loss estimates."),
            ("Gradient analysis", "Reason about how gradients move through the graph and where instability can appear."),
            ("Optimization dynamics", "Discuss curvature, initialization, normalization, learning-rate schedules, and noisy gradients."),
            ("Complexity and scaling", "Estimate compute, memory, latency, and how cost changes with input size."),
            ("Failure modes", f"Analyze this topic-specific risk deeply: {profile['risk']}."),
            ("Advanced variants", f"Compare at least two variants of {display} and explain what each changes."),
            ("Experiments and ablations", "Design tests that isolate architecture, loss, data, and optimizer effects."),
            ("Production concerns", "Connect evaluation, robustness, monitoring, and deployment constraints."),
        ]
        goal = "Advanced goal: reason mathematically, diagnose failures, and compare research-level design choices."

    lines = [f"# {level.title()} Roadmap: {display}", "", goal, ""]
    for i, (title, desc) in enumerate(items, 1):
        lines.append(f"{i}. **{title}**")
        lines.append(f"   {desc}")
    return "\n".join(lines)


def build_theory(profile: Dict[str, Any], topic: str, level: str) -> str:
    display = profile["display"]
    core = profile["core"]
    kind = profile.get("kind", "fnn")

    # ------------------------------------------------------------------ BEGINNER
    if level == "beginner":
        # Build rich analogies and step-by-step story based on topic kind
        analogies = {
            "cnn": f"Imagine your brain scanning a photo of a dog. You do not process every pixel at once â€” your eyes naturally detect shapes: ears, snout, fur texture. {display} works the same way: small filters slide across an image and each filter learns to recognise a specific visual pattern, like a horizontal edge or a colour gradient.",
            "transformer": f"Think of how you read a sentence. When you see the word 'bank', you look at nearby words â€” 'river' or 'money' â€” to figure out the meaning. {display} does this mathematically by letting every word 'attend' to every other word at the same time, rather than reading left-to-right one word at a time.",
            "gan": f"Imagine a forger trying to fake a painting and a detective trying to catch the fake. The forger gets better at fooling the detective, and the detective gets better at spotting fakes. This is exactly how {display} trains: the Generator (forger) and the Discriminator (detective) improve together through competition.",
            "rnn": f"Think of reading a story one sentence at a time and keeping notes in your head. Each new sentence updates your notes, which carry the meaning of everything you have read so far. {display} does the same with sequences: each input updates a hidden state that remembers the past.",
            "autoencoder": f"Imagine compressing a large photo into a tiny thumbnail, then expanding it back to full size. {display} learns to compress data into a small bottleneck and then reconstruct it. The compression forces the model to keep only the most important information.",
            "diffusion": f"Imagine a clear photo that you slowly bury under static noise until it is pure noise. {display} learns to reverse this process: given noisy static, it learns to gradually remove the noise and recover the original image.",
            "rl": f"Imagine training a dog with treats: when it sits on command, it gets a reward. Over time, it learns which actions lead to treats. {display} trains an agent the same way: try an action, observe the reward from the environment, and adjust behaviour to get more reward.",
        }
        analogy = analogies.get(kind, f"Think of {display} as a multi-step recipe for transforming raw data into a useful answer. Each layer in the network is like one cooking step: it takes the output from the previous step and makes it more refined and useful.")

        sections = [
            ("What Is It, Really?",
             f"{display} is a method for turning **{profile['input']}** into **{profile['output']}** by learning patterns from data. For **{topic}** specifically, you should focus first on the direction information flows: data enters at one end, is transformed step by step, and a prediction exits at the other end.\n\n"
             f"You do not need to understand every mathematical detail to start. The most powerful beginner move is to build a clear mental image of this data flow before you look at any equations or code.\n\n"
             f"Think of it this way: most machine learning methods need humans to hand-craft the features (edge detectors, frequency filters, etc.). {display} learns those features automatically by seeing many examples and being told whether its predictions were correct or not."),

            ("The Real-World Analogy",
             analogy + "\n\n"
             f"This analogy is not perfect â€” no analogy is â€” but it captures the key idea: **{display} is a trainable system that adjusts its internal behaviour based on feedback from its mistakes.** The more examples it sees, the better it gets.\n\n"
             f"The amazing thing is that you never have to write the rules yourself. The model figures them out by seeing thousands or millions of examples and being told after each one whether it was right or wrong."),

            ("The Three Things To Know First",
             f"Before diving into architecture details, lock in these three ideas for **{topic}**:\n\n"
             f"1. **Input â†’ {profile['input']}**: This is what the model receives. Understanding the shape and format of the input is the single most important first step.\n\n"
             f"2. **Output â†’ {profile['output']}**: This is what the model produces. Knowing what a good output looks like tells you how to measure success.\n\n"
             f"3. **Loss function**: This is the score that tells the model how wrong it was. A lower loss means a better prediction. The model spends all of its training time trying to minimise this score.\n\n"
             f"Once you can describe these three things in plain language for **{topic}**, you are already ahead of most beginners."),

            ("The Main Components (Plain English)",
             f"Every part of **{display}** has one job. Here is each component in the simplest possible terms:\n\n" +
             "\n\n".join([f"- **{part}**: This component receives data from the previous step, applies a transformation to make the data more useful, and passes the result to the next step." for part in core]) +
             f"\n\nTogether, these parts form a pipeline: **{'  â†’  '.join(profile['flow'])}**. Read this from left to right like a story. Data enters on the left, gets refined at each step, and exits as a useful prediction on the right."),

            ("Step-by-Step: How Training Works",
             f"Here is the beginner training story for **{topic}**, told as a simple loop:\n\n"
             f"**Step 1 â€” Forward Pass:** Feed one batch of input ({profile['input']}) through the model. Each layer transforms the data according to its current parameters.\n\n"
             f"**Step 2 â€” Compute Loss:** Compare the model's output ({profile['output']}) with the correct answer. Calculate how wrong the model was. This error number is called the loss.\n\n"
             f"**Step 3 â€” Backward Pass (Backpropagation):** The loss is sent back through the network. Using calculus (the chain rule), the model figures out which parameters caused the most error.\n\n"
             f"**Step 4 â€” Update Parameters:** An optimizer (like Adam or SGD) nudges each parameter slightly in the direction that reduces the loss. The nudge size is controlled by the learning rate.\n\n"
             f"**Step 5 â€” Repeat:** This loop runs thousands of times. Each repetition (called an epoch) makes the model slightly better. Eventually, the model learns patterns that generalise to new data it has never seen."),

            ("What To Avoid As A Beginner",
             f"New learners make a few very common mistakes with **{topic}**:\n\n"
             f"- **Jumping to code before understanding the data flow.** Always draw the pipeline first: input â†’ layers â†’ output.\n"
             f"- **Only checking training accuracy.** A model can memorise training data without learning anything useful. Always check validation accuracy too.\n"
             f"- **Getting lost in math too early.** The equations matter, but intuition comes first. Understand what each component *does* before you learn *why mathematically*.\n"
             f"- **Ignoring tensor shapes.** Most beginners spend hours debugging code because a tensor has the wrong shape. Get into the habit of printing shapes at every step.\n\n"
             f"The best thing you can do right now is: read one simple implementation of {display}, trace the data through each line, and explain each step in your own words."),
        ]

    # ------------------------------------------------------------------ INTERMEDIATE
    elif level == "intermediate":
        sections = [
            ("Architecture Breakdown: Beyond the Definition",
             f"At the intermediate level, you should be able to explain **{display}** not just as a definition, but as a set of deliberate *design decisions*. Each component was chosen because it solves a specific problem.\n\n"
             f"The input is **{profile['input']}** and the output is **{profile['output']}**. The architecture connects these through the pipeline: **{'  â†’  '.join(profile['flow'])}**.\n\n"
             f"For each stage, ask: **what shape does the tensor have here? what information has been captured? what information has been discarded?** This mindset separates intermediate practitioners from beginners.\n\n" +
             "\n\n".join([f"**{part}:** This component plays a specific architectural role. Understanding how it changes the tensor shape, what it learns, and what failure looks like when it is misconfigured is a key intermediate skill." for part in core])),

            ("The Training Loop In Depth",
             f"An intermediate understanding of **{topic}** means you can trace the full training loop at a technical level, not just describe it abstractly.\n\n"
             f"**Forward Pass:** Data flows through {' â†’ '.join(profile['flow'])}. At each stage, you should be able to state the tensor shape before and after the operation. For example, after an embedding layer the shape changes from (batch, seq_len) to (batch, seq_len, d_model). Always track shapes explicitly.\n\n"
             f"**Loss Computation:** The loss function is not just a black box. For {display}, the loss must be chosen to match the output type. Classification uses cross-entropy, generation often uses negative log-likelihood or reconstruction loss, and regression uses mean squared error. Using the wrong loss causes silent failures that are hard to debug.\n\n"
             f"**Backpropagation:** Gradients flow backward through the same operations that processed data forward. The chain rule ensures each parameter gets credited or blamed proportionally. Gradient clipping, normalization layers, and residual connections are all engineering choices that affect how cleanly the gradient signal reaches early layers.\n\n"
             f"**Optimizer Step:** Adam is typically best for getting started. It adapts the learning rate per parameter based on gradient history. Understanding the difference between Adam, SGD with momentum, and AdamW (which adds weight decay correctly) is an intermediate-level topic."),

            ("Key Hyperparameters and Their Effect",
             f"One of the most important intermediate skills is knowing which hyperparameter to change when something goes wrong.\n\n"
             f"**Learning Rate:** Too high â†’ loss oscillates or diverges. Too low â†’ training is too slow or gets stuck. Use a learning rate finder or start at 3e-4 (the 'Karpathy constant') and halve it if the loss is unstable.\n\n"
             f"**Batch Size:** Larger batches give more stable gradient estimates but use more memory and sometimes generalise worse. Smaller batches are noisier but act as a form of regularization. 32â€“256 is a good starting range.\n\n"
             f"**Model Size (Width/Depth):** More parameters = more capacity = potential for better fit. But more parameters also means slower training, more memory, and higher risk of overfitting on small datasets. Always validate the tradeoff.\n\n"
             f"**Regularization (Dropout, Weight Decay):** Only add regularization after you confirm the model can learn at all. If training loss is not going down, regularization is not your problem. If training loss goes down but validation loss goes up, regularization is your friend.\n\n"
             f"**Topic-Specific Risk:** The main failure mode for {display} is **{profile['risk']}**. Knowing this risk means you can set up monitoring to detect it early."),

            ("Debugging Workflow",
             f"Most intermediate practitioners waste time debugging the wrong thing. Here is a systematic approach for **{topic}**:\n\n"
             f"**1. Verify tensor shapes at every layer.** Add `print(x.shape)` throughout the forward pass. A shape mismatch will cause cryptic errors later.\n\n"
             f"**2. Overfit a tiny batch.** Take 2â€“4 examples and train until loss is near zero. If the model cannot overfit a tiny batch, there is a bug in the model, data, or loss function â€” not an underfitting problem.\n\n"
             f"**3. Separate training and validation curves.** Plot both on the same graph. If training loss decreases but validation loss increases (or stagnates), you have overfitting. If both are high, you have underfitting.\n\n"
             f"**4. Inspect wrong predictions.** Look at specific examples the model gets wrong. Is there a pattern? Wrong class boundary? Confusing class pairs? Data noise? This gives more signal than aggregate metrics.\n\n"
             f"**5. Run a controlled ablation.** Change exactly one thing, compare results, and record why you made the change. This is the difference between a practitioner who understands their model and one who just tries random things."),

            ("Architecture Comparison: When To Use This vs Alternatives",
             f"Intermediate knowledge means knowing not just *how* {display} works, but *when* to use it vs alternatives.\n\n"
             f"**Use {display} when:** your data has the structure that matches its inductive biases (e.g., spatial locality for CNNs, sequential context for RNNs/Transformers, generation from noise for GANs).\n\n"
             f"**Consider alternatives when:** the dataset is too small (use a simpler model or pretrained weights), the compute budget is low (use a smaller or quantized model), or the task structure does not match (e.g., do not use a CNN for pure sequence data).\n\n"
             f"**Transfer learning is often the right answer:** Starting from a pretrained {display} model and fine-tuning it on your task will almost always outperform training from scratch on limited data."),

            ("Implementation Checklist",
             f"Before declaring your {topic} implementation complete, verify:\n\n"
             f"- [ ] Tensor shapes are correct at each layer (log them in debug mode)\n"
             f"- [ ] The model can overfit a tiny batch (loss â†’ 0 on 4 examples)\n"
             f"- [ ] Training loss and validation loss are both being tracked and plotted\n"
             f"- [ ] The loss function matches the output type (logits, probabilities, or values)\n"
             f"- [ ] Learning rate was tuned (not left at a random default)\n"
             f"- [ ] Best checkpoint is saved based on validation metric, not last epoch\n"
             f"- [ ] At least one ablation was run to test the effect of a key component"),
        ]

    # ------------------------------------------------------------------ ADVANCED
    else:
        sections = [
            ("Formal Mathematical Formulation",
             f"Let the model be a parameterised function `f_Î¸: X â†’ Y` where `X` is the input domain ({profile['input']}) and `Y` is the output domain ({profile['output']}).\n\n"
             f"The learning objective is:\n\n"
             f"```\nÎ¸* = argmin_Î¸  (1/N) Î£áµ¢ L(f_Î¸(xáµ¢), yáµ¢)  +  Î» Î©(Î¸)\n```\n\n"
             f"where `L` is the task loss, `Î©(Î¸)` is a regularization term (L2, L1, or spectral norm), and `Î»` controls regularization strength.\n\n"
             f"**The core mathematical relation for {profile['display']} is:**\n\n"
             f"```\n{profile['math']}\n```\n\n"
             f"Advanced analysis requires: (1) identifying every tensor shape in this expression, (2) stating which variables are learned vs fixed, (3) deriving the gradient of this expression with respect to each trainable parameter, and (4) discussing the assumptions (independence, smoothness, stationarity) that make this formulation valid."),

            ("Gradient Flow and Backpropagation Analysis",
             f"Backpropagation applies the chain rule to compute `âˆ‚L/âˆ‚Î¸` for every parameter `Î¸` in `f_Î¸`. For **{profile['display']}**, the critical question is: *does the gradient signal reach early parameters with enough strength and direction to be useful?*\n\n"
             f"**Vanishing gradients** occur when repeated multiplications by values < 1 shrink the gradient signal to near zero in early layers. This was a major problem in deep RNNs and early deep networks. Solutions include: residual connections, gradient clipping, LSTM gating, and layer normalisation.\n\n"
             f"**Exploding gradients** occur when repeated multiplications by values > 1 cause the gradient to grow exponentially. Solutions: gradient clipping (by norm or by value), careful initialisation (Glorot/He), and batch normalisation.\n\n"
             f"**Dead neurons** (specifically with ReLU) occur when a neuron's pre-activation is always negative, so the gradient is always 0 and the neuron never learns. Leaky ReLU, GELU, and SiLU mitigate this.\n\n"
             f"For this topic specifically, the known gradient challenge is related to: **{profile['risk']}**. An advanced debugging session should include gradient norm monitoring for each layer group during training."),

            ("Computational Complexity and Scaling",
             f"Advanced practitioners must reason about the cost of {profile['display']} operations before choosing an architecture.\n\n"
             f"**Parameter count:** Estimate the number of trainable parameters analytically. For a linear layer with input dim `d_in` and output dim `d_out`, parameters = `d_in Ã— d_out + d_out`. For convolutional layers: `(k Ã— k Ã— C_in Ã— C_out) + C_out` per layer. For self-attention: `4 Ã— d_modelÂ²` per head group.\n\n"
             f"**Compute (FLOPs):** The dominant operation determines compute cost. For convolutions: `2 Ã— kÂ² Ã— C_in Ã— C_out Ã— H_out Ã— W_out` FLOPs per layer. For attention: `2 Ã— NÂ² Ã— d_model` FLOPs where N is sequence length â€” this is why attention is O(NÂ²) and Flash Attention matters.\n\n"
             f"**Memory:** Activation memory during training = sum of all intermediate tensors (needed for backpropagation). Gradient memory â‰ˆ parameter memory. Mixed precision (fp16/bf16) halves this. Gradient checkpointing trades compute for memory by recomputing activations during backprop.\n\n"
             f"**Scaling laws (Chinchilla):** For transformer-family models, optimal performance scales as `L âˆ (C/N)^Î±` where C is compute, N is parameters. The Chinchilla result showed that model parameters and training tokens should scale together, not just model size."),

            ("Failure Mode Deep Dive",
             f"The primary known failure mode for **{profile['display']}** is: **{profile['risk']}**.\n\n"
             f"Advanced analysis of a failure mode requires three things:\n\n"
             f"1. **The mechanism** â€” what goes wrong mathematically or algorithmically. For example, mode collapse in GANs happens when the generator finds one output that always fools the discriminator and stops exploring the rest of the distribution.\n\n"
             f"2. **The metric signature** â€” what pattern in the training curves, outputs, or diagnostic stats reveals the failure. Mode collapse shows as a near-constant generator output. Vanishing gradients show as near-zero gradient norms in early layers. Overfitting shows as diverging train/val loss curves.\n\n"
             f"3. **The intervention** â€” what architectural or training change addresses the root cause (not just the symptom). Blindly adding dropout or changing lr is not advanced debugging; analysing the gradient flow and loss landscape to find the structural cause is."),

            ("Advanced Variants and Architecture Comparison",
             f"A true advanced understanding of **{topic}** requires knowing the landscape of variants and what each one changes:\n\n"
             f"Every architectural variant makes one of these types of changes:\n- **Objective change** (e.g., Wasserstein loss in WGAN vs original GAN loss)\n- **Architecture change** (e.g., residual connections in ResNet vs plain CNN)\n- **Training procedure change** (e.g., contrastive learning in SimCLR vs supervised classification)\n- **Inference change** (e.g., DDIM for fast sampling vs DDPM for standard diffusion)\n\n"
             f"For each variant you study, you should be able to: (1) state the original problem it was designed to fix, (2) show the mathematical change it introduces, (3) describe the empirical tradeoff (what it improves vs what it sacrifices).\n\n"
             f"This type of comparative analysis is what separates researchers from practitioners and is expected at PhD-level understanding of {display}."),

            ("Ablation Design and Experimental Rigour",
             f"Advanced ML work is validated through careful ablation studies, not random hyperparameter searches.\n\n"
             f"**A rigorous ablation** for **{topic}** should:\n- Hold one variable constant while changing exactly one component\n- Measure multiple metrics (accuracy, loss, calibration, speed, memory)\n- Run multiple seeds to separate noise from signal\n- Report both mean and variance\n- Connect the result to a specific hypothesis about the architecture or training procedure\n\n"
             f"**Common ablation targets for {display}:** {'  |  '.join(core)}. Each of these represents a hypothesis: 'this component contributes X to the model's performance.'\n\n"
             f"A well-designed ablation table should have: a baseline row, one row per removed/modified component, and a significance test showing which differences are real."),

            ("Research and Production Connection",
             f"**For {topic} in production**, advanced practitioners must connect theoretical understanding to deployment constraints:\n\n"
             f"- **Data requirements:** How many examples does {display} need to reach good validation performance? What quality of labels is required? Is the method robust to label noise?\n\n"
             f"- **Compute budget:** What is the minimum compute to achieve acceptable performance? Can the model be distilled or quantized without significant accuracy loss?\n\n"
             f"- **Monitoring:** What metrics should be tracked in production? How do you detect distribution shift? When does the model need to be retrained?\n\n"
             f"- **Failure cases:** What types of inputs will this model confidently get wrong? How do you detect and handle these cases before they cause real-world harm?\n\n"
             f"**Advanced mastery checklist:**\n"
             f"- [ ] Derive the forward equation and identify every learned tensor\n"
             f"- [ ] Compute parameter count and FLOPs analytically\n"
             f"- [ ] Explain gradient flow and cite which mechanisms prevent vanishing/exploding\n"
             f"- [ ] Name the primary failure mode and its metric signature\n"
             f"- [ ] Compare at least two variants and explain the tradeoff each one makes\n"
             f"- [ ] Design a three-row ablation table with clear hypotheses"),
        ]

    return f"# {display}: {level.title()} Explanation\n\n" + "\n\n".join(
        f"## {i}. {title}\n{body}" for i, (title, body) in enumerate(sections, 1)
    )

class TeachRequest(BaseModel):
    topic: str
    difficulty: str = "beginner"
    skip_quiz: bool = False

class TeachResponse(BaseModel):
    topic: str
    difficulty: str
    results: Dict[str, Any]

class NotesRequest(BaseModel):
    topic: str = ""
    type: str = "detailed"
    text: str = ""

class NotesResponse(BaseModel):
    topic: str
    type: str
    notes: str

class QuizRequest(BaseModel):
    topic: str
    quiz_type: str = "mcq"
    difficulty: str = "beginner"
    count: int = 5

class QuizResponse(BaseModel):
    topic: str
    questions: List[Dict[str, Any]]

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

class ChatResponse(BaseModel):
    reply: str

class VizGenRequest(BaseModel):
    topic: str

class VizGenResponse(BaseModel):
    topic: str
    html_code: str

class AnalyzeTopicRequest(BaseModel):
    topic: str

class AnalyzeTopicResponse(BaseModel):
    type: str  # "existing" or "custom_graph"
    id: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


@app.get("/")
def read_root():
    return {"status": "DL Virtual Teacher API is running", "version": "2.1"}


# â”€â”€ Full teaching session â€” direct Gemini (single prompt to avoid rate limit) â”€
@app.post("/api/teach", response_model=TeachResponse)
def teach_topic(request: TeachRequest):
    if not has_generation_backend():
        topic = request.topic.strip()
        diff = request.difficulty
        return TeachResponse(topic=topic, difficulty=diff, results=get_mock_curriculum(topic, diff))

    topic = request.topic.strip()
    diff  = request.difficulty

    try:
        if diff == "beginner":
            plan_structure = "(A highly intuitive, step-by-step learning roadmap for a beginner. 5-7 specific steps focusing on plain-English concepts and basic intuition.)"
            content_structure = f"""
        Generate a highly intuitive, incredibly clear, and beginner-friendly explanation.
        The explanation MUST be exceptionally good, breaking down complex ideas into simple, digestible concepts.
        WARNING: DO NOT use overly complex jargon without explaining it.
        You MUST use exactly 5 main sections. Each main section MUST have exactly 2 sub-sections.
        For EVERY SINGLE sub-section, you MUST write at least 3-4 long paragraphs (minimum 300 words per sub-section). INCREASE the length of the explanation significantly to provide maximum value! Do not be concise.
        Frame the entire response strictly for someone with zero prior deep learning knowledge.

        CRITICAL: DO NOT use generic headings. You MUST create highly specific, dynamic, and engaging headings tailored exactly to the topic '{topic}'.

        Example Structure Pattern (Create your own headings based on '{topic}'!):
        # 1. [Engaging Introduction to {topic}]
        ## 1.1 [What exactly is it?]
        ## 1.2 [The best real-world analogy]

        # 2. [Why {topic} was Invented]
        ## 2.1 [The problem it solves]
        ## 2.2 [Before and After this invention]

        # 3. [The Core Mechanics of {topic}]
        ## 3.1 [The main moving parts]
        ## 3.2 [How they connect together]

        # 4. [A Step-by-Step Walkthrough]
        ## 4.1 [Following the data flow]
        ## 4.2 [Seeing it in action]

        # 5. [Summary & Next Steps for {topic}]
        ## 5.1 [Simple trade-offs to remember]
        ## 5.2 [What you should learn next]
        """
        elif diff == "intermediate":
            plan_structure = "(An intermediate learning roadmap. Focus on architecture, training loop, tradeoffs, and practical debugging. 7-9 specific steps.)"
            content_structure = f"""
        Generate an EXTREMELY DEEP, architecture-focused explanation for practitioners.
        This level MUST contain the deepest information and explanation of the core mechanics of the topic.
        WARNING: YOU MUST DIVE DEEP into the technical details, providing exhaustive real-world coding and debugging context.
        You MUST use exactly 8 main sections. Each main section MUST have exactly 3 sub-sections.
        For EVERY SINGLE sub-section, you MUST write at least 5-6 long paragraphs (minimum 600 words per sub-section). INCREASE the overall word count and technical depth significantly! Be highly verbose and expansive.
        Focus heavily on how things work under the hood, tradeoffs, and architectural decisions.

        CRITICAL: DO NOT use generic headings. You MUST create highly specific, dynamic, and technically accurate headings tailored exactly to the topic '{topic}'.

        Example Structure Pattern (Create your own topic-specific headings!):
        # 1. [Technical Setup of {topic}]
        ## 1.1 [Formal problem definition]
        ## 1.2 [Architectural goals]
        ## 1.3 [Mathematical intuition]

        # 2. [Architecture Breakdown for {topic}]
        ## 2.1 [Deep dive into early layers]
        ## 2.2 [Deep dive into core mechanics]
        ## 2.3 [Information flow and connectivity]

        # 3. [Forward Pass Dynamics]
        ## 3.1 [Data input and tensor shapes]
        ## 3.2 [Intermediate transformations]
        ## 3.3 [Final output representations]

        # 4. [{topic}-Specific Loss Functions]
        ## 4.1 [Standard objective choices]
        ## 4.2 [Why this formulation works]
        ## 4.3 [Custom loss variations]

        # 5. [Training & Optimization Strategy]
        ## 5.1 [Optimizer selection]
        ## 5.2 [Batching and epoch walkthrough]
        ## 5.3 [Convergence behavior]

        # 6. [Crucial Hyperparameters for {topic}]
        ## 6.1 [Learning rate and schedulers]
        ## 6.2 [Key architectural knobs]
        ## 6.3 [Regularization strategies]

        # 7. [Implementation & Debugging Gotchas]
        ## 7.1 [Common shape and type bugs]
        ## 7.2 [Memory footprint management]
        ## 7.3 [Isolating model failures]

        # 8. [Practitioner's Guide to {topic}]
        ## 8.1 [Deployment strategies]
        ## 8.2 [Inference speedups]
        ## 8.3 [Summary checklist for production]
        """
        else: # advanced
            plan_structure = "(A masterclass, PhD-level learning roadmap. Focus on mathematical formulation, computational complexity, gradient flow, and SOTA research. 10-12 specific steps.)"
            content_structure = f"""
        Generate an EXHAUSTIVE, BOOK-CHAPTER LENGTH, PhD-level masterclass explanation.
        WARNING: This Advanced level MUST contain significantly MORE content, depth, and rigorous detail than the Intermediate level.
        You MUST use exactly 12 main sections. Each main section MUST have exactly 4 sub-sections.
        For EVERY SINGLE sub-section, you MUST write at least 8 to 10 giant paragraphs (minimum 1000 words per sub-section). INCREASE the length and depth to the absolute maximum! Write a massive wall of text for every section.
        You MUST elaborate on every mathematical proof, every hardware optimization, and every tensor shape in excruciating detail. Leave absolutely no stone unturned.

        CRITICAL: DO NOT use generic headings. You MUST create highly specific, dynamic, and advanced research-level headings tailored exactly to the topic '{topic}'.

        Example Structure Pattern (Create your own deeply technical headings!):
        # 1. [Formal Mathematical Formulation of {topic}]
        ## 1.1 [Objective Function Derivation (LaTeX)]
        ## 1.2 [Probabilistic interpretation]
        ## 1.3 [Assumptions and priors]
        ## 1.4 [Theoretical bounds]

        # 2. [Rigorous Architecture Analysis of {topic}]
        ## 2.1 [Exact tensor shapes (N, C, H, W)]
        ## 2.2 [Parameter count derivation]
        ## 2.3 [Activation functions analysis]
        ## 2.4 [Receptive fields / Attention span]

        # 3. [Advanced Forward Pass Mechanics]
        ## 3.1 [Feature extraction depth]
        ## 3.2 [Information bottleneck]
        ## 3.3 [Latent space topology]
        ## 3.4 [Jacobian of the forward pass]

        # 4. [Backward Pass & Gradient Dynamics in {topic}]
        ## 4.1 [Gradient derivation (LaTeX)]
        ## 4.2 [Chain rule expansion]
        ## 4.3 [Exploding/Vanishing analysis]
        ## 4.4 [Gradient clipping thresholds]

        # 5. [Loss Landscape & Optimization]
        ## 5.1 [Hessian matrix insights]
        ## 5.2 [Convergence proofs]
        ## 5.3 [Training stability analysis]
        ## 5.4 [Saddle points and local minima]

        # 6. [Computational Complexity of {topic}]
        ## 6.1 [Time complexity (Big-O)]
        ## 6.2 [Space complexity (VRAM)]
        ## 6.3 [Scaling laws (Compute vs Data)]
        ## 6.4 [Parallelization strategies]

        # 7. [SOTA {topic} Variants and Evolutions]
        ## 7.1 [Key foundational papers]
        ## 7.2 [Modern breakthroughs (2024+)]
        ## 7.3 [Architectural tweaks]
        ## 7.4 [Empirical performance comparisons]

        # 8. [Edge Cases & Failure Modes]
        ## 8.1 [Catastrophic forgetting]
        ## 8.2 [Out-of-distribution handling]
        ## 8.3 [Adversarial vulnerabilities]
        ## 8.4 [Bias, fairness, and safety]

        # 9. [Hardware Acceleration for {topic}]
        ## 9.1 [CUDA-level optimizations]
        ## 9.2 [TensorRT and quantization techniques]
        ## 9.3 [Memory tricks and Flash Attention]
        ## 9.4 [Multi-GPU scaling (DDP/FSDP)]

        # 10. [Open Problems & Future Research in {topic}]
        ## 10.1 [Unsolved theoretical challenges]
        ## 10.2 [Next-generation architectural shifts]
        ## 10.3 [Current theoretical gaps]
        ## 10.4 [The 5-year outlook for the field]

        # 11. [Hardcore Interview Assessment on {topic}]
        ## 11.1 [FAANG-level Coding question]
        ## 11.2 [Deep Research conceptual question]
        ## 11.3 [Production System Design question]
        ## 11.4 [Debugging an active distributed training run]

        # 12. [Final Conclusions on {topic}]
        ## 12.1 [Comprehensive technical summary]
        ## 12.2 [Key takeaways for researchers]
        ## 12.3 [Recommended seminal papers]
        ## 12.4 [Final thoughts and directions]
        """

        prompt = f"""You are a verbose, highly detailed AI professor at a Deep Learning University. Generate a MASTERCLASS level educational experience for '{topic}' at a {diff} level.

        CRITICAL INSTRUCTIONS:
        - EVERYTHING must be unique to '{topic}'. Never use generic templates.
        - CONTENT DEPTH: Provide extremely detailed, long-form content. You MUST write massive walls of text.
        - NEVER be concise. NEVER use short bullet points without massive paragraph explanations.
        - VISUALIZATION: You must classify '{topic}' into an architecture type (cnn, transformer, gan, diffusion, rl, rnn, autoencoder, fnn) and provide specific nodes/edges.
        - TONE: Professional, academic yet accessible, and deeply technical where appropriate.

        You MUST structure your response exactly using these delimiters:
        ===PLAN===
        {plan_structure}

        ===CONTENT===
        {content_structure}


        ===CODE===
        (A unique, production-ready PyTorch implementation of '{topic}'. Include comments and a brief explanation of the code structure.)

        ===GRAPH===
        (Provide a JSON object for the visualization architecture. FORMAT:
        {{
          "architectureType": "cnn|transformer|gan|diffusion|rl|rnn|autoencoder|fnn",
          "description": "Topic-specific description of the visual flow.",
          "nodes": [
            {{ "id": "n1", "label": "Specific Component 1", "x": 10, "y": 50, "color": "#3b82f6" }},
            ... 5-8 specific architectural nodes ...
          ],
          "edges": [
            {{ "source": "n1", "target": "n2", "label": "Specific Action" }},
            ...
          ]
        }}
        )

        ===QUIZ===
        (5 highly specific MCQs testing deep conceptual understanding. Format: JSON array of objects with 'q', 'options' (4), 'answer' (0-3), 'explanation'.)
        """
        response_text = fast_generate(prompt)

        import re as _re
        import json

        # â”€â”€ Robust delimiter parsing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        # Match delimiters even if the model wraps them in markdown decoration
        # (e.g. "**===PLAN===**" or "# ===PLAN===").  We look for the keyword
        # anywhere on a line that contains ONLY that keyword (plus whitespace /
        # markdown punctuation), so we never accidentally match content lines.
        _DELIMITER_RE = _re.compile(
            r'^[\s#*_\-]*=\s*=\s*=\s*(PLAN|CONTENT|CODE|GRAPH|QUIZ)\s*=\s*=\s*=[\s#*_\-]*$',
            _re.IGNORECASE
        )

        sections: Dict[str, str] = {"plan": "", "content": "", "code": "", "graph": "", "quiz": ""}
        current_section: Optional[str] = None

        for line in response_text.split('\n'):
            m = _DELIMITER_RE.match(line)
            if m:
                current_section = m.group(1).lower()
            elif current_section and current_section in sections:
                sections[current_section] += line + "\n"

        graph_data: Dict[str, Any] = {}
        try:
            raw_graph = sections["graph"].strip()
            # Strip any markdown code fences the model may have added
            raw_graph = _re.sub(r'^```[a-zA-Z]*\n?', '', raw_graph)
            raw_graph = _re.sub(r'\n?```$', '', raw_graph).strip()
            if raw_graph:
                graph_data = json.loads(raw_graph)
        except Exception as graph_err:
            print(f"Failed to parse AI graph ({graph_err}), using fallback analyzer...")
            try:
                graph_data = analyze_topic(AnalyzeTopicRequest(topic=topic)).data or {}
            except Exception:
                graph_data = build_visualization_graph(topic)

        if not graph_data:
            graph_data = build_visualization_graph(topic)

        results = {
            "plan": sections["plan"].strip(),
            "content": sections["content"].strip(),
            "code": sections["code"].strip(),
            "visualization": f"# Visual Guide for {topic}\n\nThe animated diagram above illustrates the data-flow architecture for **{topic}** at the **{diff}** level. Follow each node left-to-right to trace how raw input is transformed into the final output.",
            "visualization_graph": graph_data,
            "quiz": sections["quiz"].strip()
        }

        # Final safety check â€” fall back to rich offline mock for any missing section
        mock = get_mock_curriculum(topic, diff)
        for k in ["plan", "content", "code", "quiz"]:
            if not results.get(k):
                results[k] = mock.get(k, f"Content for {k} could not be generated.")
        if not results.get("visualization_graph"):
            results["visualization_graph"] = mock.get("visualization_graph", build_visualization_graph(topic))

        if request.skip_quiz:
            results["quiz"] = "Quiz skipped."

        return TeachResponse(topic=topic, difficulty=diff, results=results)

    except HTTPException as he:
        err = str(he.detail).lower()
        if any(w in err for w in ["429", "quota", "exhausted", "api key", "api_key", "limit", "unavailable"]):
            return TeachResponse(topic=topic, difficulty=diff, results=get_mock_curriculum(topic, diff))
        raise he
    except Exception as e:
        import traceback; traceback.print_exc()
        err = str(e).lower()
        if any(w in err for w in ["429", "quota", "exhausted", "api key", "api_key", "limit", "unavailable"]):
            return TeachResponse(topic=topic, difficulty=diff, results=get_mock_curriculum(topic, diff))
        raise HTTPException(status_code=500, detail=err)


# â”€â”€ Fast Notes generation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@app.post("/api/notes", response_model=NotesResponse)
def generate_notes(request: NotesRequest):
    topic = request.topic or "the provided text"
    prompts = {
        "short":    f"Generate concise short notes on '{topic}' in deep learning. Use markdown with bullet points. Keep under 300 words.",
        "detailed": f"Generate comprehensive detailed notes on '{topic}' in deep learning. Include: Introduction, Mathematical Background, Architecture, Training Process, Applications. Use markdown with headers, formulas, and examples.",
        "exam":     f"Generate exam-focused notes for '{topic}'. Include: 5 key points, common exam questions, important formulas, and quick summary. Use markdown.",
        "flashcard":f"Generate 6 Q&A flashcards for '{topic}' in this exact format:\n**Q**: question\n**A**: answer\n\nRepeat for each card.",
        "formula":  f"Generate a formula sheet for '{topic}' in deep learning. Include all key equations in LaTeX-style markdown tables.",
    }
    base_text = request.text[:2000] if request.text else ""
    extra = f"\n\nUse this provided text as reference:\n{base_text}" if base_text else ""
    prompt = prompts.get(request.type, prompts["detailed"]) + extra
    try:
        notes = fast_generate(prompt)
    except Exception as e:
        print(f"Notes generation unavailable, using offline notes: {e}")
        notes = offline_notes(topic, request.type)
    return NotesResponse(topic=topic, type=request.type, notes=notes)


# â”€â”€ Fast Quiz generation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@app.post("/api/quiz", response_model=QuizResponse)
def generate_quiz(request: QuizRequest):
    prompt = f"""Generate {request.count} {request.quiz_type} quiz questions about '{request.topic}' at {request.difficulty} level.

Return ONLY valid JSON array (no markdown, no explanation):
[
  {{
    "q": "question text",
    "options": ["A", "B", "C", "D"],
    "answer": 0,
    "explanation": "why this is correct"
  }}
]

For true_false, use options: ["True", "False"] and answer 0 or 1.
For fill_blank, use options: ["answer1", "answer2", "answer3", "answer4"].
Make every question specific to '{request.topic}'. Ensure the questions are fresh, unique, and different from basic introductory facts.
"""
    import json
    try:
        raw = fast_generate(prompt).strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip().rstrip("```").strip()
        questions = json.loads(raw)
        if not isinstance(questions, list) or not questions:
            questions = build_quiz_questions(request.topic, request.count, request.difficulty)
    except Exception:
        questions = build_quiz_questions(request.topic, request.count, request.difficulty)
    return QuizResponse(topic=request.topic, questions=questions[:request.count])


@app.post("/api/extract_text")
async def extract_text(file: UploadFile = File(...)):
    content = await file.read()
    mime_type = file.content_type

    try:
        # 1. AI Extraction (Gemini)
        gemini_client = get_gemini_client()
        if gemini_client:
            print(f"Attempting AI extraction for {file.filename}...")
            try:
                response = gemini_client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=[
                        types.Part.from_bytes(data=content, mime_type=mime_type),
                        "Extract all text from this document accurately. If the text is not in English, translate it to English. Output ONLY the final English text."
                    ]
                )
                if response and response.text:
                    return {"text": response.text}
            except Exception as ai_err:
                print(f"Gemini Extraction failed: {ai_err}")

        # 1.5 Groq Vision Fallback
        if mime_type.startswith("image/") and get_groq_client():
            print("Using Groq Vision extraction...")
            try:
                import base64
                base64_image = base64.b64encode(content).decode('utf-8')
                groq_client = get_groq_client()
                response = groq_client.chat.completions.create(
                    model="llama-3.2-11b-vision-preview",
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": "Extract all text from this image accurately. If not in English, translate to English. Return ONLY the final English text."},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:{mime_type};base64,{base64_image}"
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens=1024
                )
                if response.choices and response.choices[0].message.content:
                    return {"text": response.choices[0].message.content}
            except Exception as groq_err:
                print(f"Groq Vision failed: {groq_err}")

        # 2. Local PDF Extraction (pypdf)
        if mime_type == "application/pdf" and PdfReader:
            print("Using local PDF extraction...")
            try:
                reader = PdfReader(io.BytesIO(content))
                text = ""
                for page in reader.pages:
                    extracted = page.extract_text()
                    if extracted: text += extracted + "\n\n"
                if text.strip(): return {"text": text.strip()}
            except Exception as pdf_err:
                print(f"Local PDF extraction failed: {pdf_err}")

        # 3. Local OCR (pytesseract)
        if mime_type.startswith("image/") and pytesseract:
            print("Using local OCR extraction...")
            try:
                image = PILImage.open(io.BytesIO(content))
                text = pytesseract.image_to_string(image)
                if text.strip(): return {"text": text.strip()}
            except Exception as ocr_err:
                print(f"Local OCR failed: {ocr_err}")

        # 4. Final Fallback: ONLY for actual text files
        if mime_type.startswith("text/"):
            try:
                return {"text": content.decode('utf-8')}
            except:
                pass

        return {"text": "", "error": "AI is busy and this file format cannot be read locally. Please try again in 30 seconds or paste the text manually."}

    except Exception as e:
        print(f"Extraction crash: {e}")
        return {"text": "", "error": str(e)}

# â”€â”€ Fast Chat â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    history_str = ""
    for msg in request.history[-6:]:
        role = "User" if msg.role == "user" else "Assistant"
        history_str += f"{role}: {msg.content}\n"

    prompt = f"""You are an expert Deep Learning tutor and AI mentor. Answer clearly and helpfully.
Be concise but thorough. Use markdown formatting. Include code examples when helpful.

{history_str}User: {request.message}
Assistant:"""

    try:
        reply = fast_generate(prompt)
    except Exception as e:
        print(f"Chat generation unavailable, using offline reply: {e}")
        reply = offline_chat_reply(request.message)
    return ChatResponse(reply=reply)

# â”€â”€ Dynamic Visualization Generation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@app.post("/api/generate_viz", response_model=VizGenResponse)
def generate_viz(request: VizGenRequest):
    topic = request.topic.strip()
    prompt = f"""You are an expert deep learning visualizer and web developer.
Create a beautiful, fully self-contained HTML document (with embedded CSS and JS) that visualizes and animates the deep learning concept: '{topic}'.
Requirements:
1. Use a dark, futuristic aesthetic matching a modern DL platform (deep purples, glowing neon greens/pinks, dark slate background #0f172a).
2. The visualization must be interactive or animated (use HTML5 Canvas or CSS animations/SVG).
3. Include brief explanatory text inside the UI.
4. Ensure the output is ONLY valid HTML code. Do NOT wrap in markdown backticks (like ```html), just output the raw HTML string starting with <div or <style or <!DOCTYPE html>.
Make it highly educational and visually impressive!"""

    try:
        raw = fast_generate(prompt)
        # Strip markdown code block if present
        raw = raw.strip()
        if raw.startswith("```html"):
            raw = raw[7:]
        elif raw.startswith("```"):
            raw = raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]

        return VizGenResponse(topic=topic, html_code=raw.strip())
    except Exception as e:
        import traceback; traceback.print_exc()
        graph = build_visualization_graph(topic)
        nodes = graph.get("nodes", [])
        edges = graph.get("edges", [])
        node_html = "".join(
            f'<div class="node" style="left:{node.get("x", 50)}%;top:{node.get("y", 50)}%;border-color:{node.get("color", "#8b5cf6")};color:{node.get("color", "#8b5cf6")}">{node.get("label", "Layer")}</div>'
            for node in nodes
        )
        edge_html = "".join(
            f'<li>{edge.get("source", "")} -> {edge.get("target", "")}: {edge.get("label", "flow")}</li>'
            for edge in edges
        )
        fallback_html = f"""
        <div style="color:white;padding:28px;font-family:Inter,system-ui,sans-serif;background:#0f172a;border-radius:12px;min-height:300px;">
            <style>
              .viz-wrap {{ position:relative; min-height:220px; border:1px solid rgba(148,163,184,.25); border-radius:12px; background:rgba(15,23,42,.7); overflow:hidden; }}
              .node {{ position:absolute; transform:translate(-50%,-50%); padding:10px 12px; border:1px solid; border-radius:10px; background:rgba(2,6,23,.92); font-weight:700; font-size:13px; white-space:nowrap; }}
              .viz-wrap::before {{ content:""; position:absolute; inset:0; background:linear-gradient(90deg, transparent, rgba(139,92,246,.12), transparent); animation:sweep 2.4s infinite; }}
              @keyframes sweep {{ from {{ transform:translateX(-100%); }} to {{ transform:translateX(100%); }} }}
            </style>
            <h3 style="margin:0 0 8px;">{topic} Visualization</h3>
            <p style="margin:0 0 18px;color:#cbd5e1;">{graph.get("description", "Offline architecture view.")}</p>
            <div class="viz-wrap">{node_html}</div>
            <ul style="margin:16px 0 0;color:#cbd5e1;font-size:13px;">{edge_html}</ul>
        </div>
        """
        return VizGenResponse(topic=topic, html_code=fallback_html)

# â”€â”€ Intelligent Fallback & Semantic Graph Generator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@app.post("/api/analyze_topic", response_model=AnalyzeTopicResponse)
def analyze_topic(request: AnalyzeTopicRequest):
    topic = request.topic.strip()
    if not has_generation_backend():
        return AnalyzeTopicResponse(type="custom_graph", data=build_visualization_graph(topic))

    prompt = f"""You are an expert AI architecture visualizer. The user searched for the deep learning concept: '{topic}'.

First, check if it matches an existing predefined UI component:
["neural-network", "backpropagation", "gradient-descent", "cnn", "loss-curve", "activation", "attention", "rnn", "dropout", "batch-norm", "embedding", "autoencoder", "gan", "softmax", "learning-rate"]
If it perfectly matches one of these (e.g., user typed exactly "dropout" or "batch norm"), return:
{{ "type": "existing", "id": "<matched_id>" }}

If not, you must classify '{topic}' into one of the following base architecture families:
1. "cnn" (e.g., AlexNet, VGG, ResNet, DenseNet, MobileNet, YOLO)
2. "transformer" (e.g., BERT, GPT, T5, ViT, LLMs, Self-Attention)
3. "gan" (e.g., DCGAN, StyleGAN, CycleGAN)
4. "diffusion" (e.g., Stable Diffusion, DDPM, Midjourney)
5. "rl" (e.g., DQN, PPO, Q-Learning, Actor-Critic)
6. "rnn" (e.g., LSTM, GRU, seq2seq)
7. "autoencoder" (e.g., VAE, U-Net)
8. "fnn" (generic Feed Forward / MLP if none of the above fit)

Return this JSON format:
{{
  "type": "custom_graph",
  "data": {{
    "architectureType": "<one_of_the_base_families>",
    "topicName": "{topic}",
    "description": "A 1-2 sentence explanation of how information flows in {topic} based on its architecture.",
    "nodes": [
       // Provide 4-6 specific architectural components (e.g. for CNN: Input Image, Conv Layer, Pooling, Fully Connected)
       {{ "id": "n1", "label": "Component 1", "x": 10, "y": 50, "color": "#3b82f6" }}
    ],
    "edges": [
       {{ "source": "n1", "target": "n2", "label": "Flow description" }}
    ]
  }}
}}
Rules:
- x and y are coordinates from 10 to 90 (left to right, top to bottom).
- Ensure the output is ONLY valid JSON. Do not use markdown backticks around the JSON.
- NEVER output a generic "Input -> Process -> Output" diagram. Always use specific architectural layer names based on the topic.
"""
    try:
        import json
        raw = fast_generate(prompt)
        raw = raw.strip()
        if raw.startswith("```json"): raw = raw[7:]
        elif raw.startswith("```"): raw = raw[3:]
        if raw.endswith("```"): raw = raw[:-3]

        parsed = json.loads(raw.strip())
        return AnalyzeTopicResponse(**parsed)
    except Exception as e:
        import traceback; traceback.print_exc()
        # Intelligent fallback based on simple keyword matching if API fails
        topic_lower = topic.lower()
        arch = "fnn"
        nodes = []
        edges = []
        if any(w in topic_lower for w in ["cnn", "net", "vision", "image", "yolo"]):
            arch = "cnn"
            nodes = [
                {"id": "n1", "label": "Input Image", "x": 10, "y": 50, "color": "#3b82f6"},
                {"id": "n2", "label": "Conv Filters", "x": 40, "y": 50, "color": "#8b5cf6"},
                {"id": "n3", "label": "Feature Maps", "x": 70, "y": 50, "color": "#ec4899"},
                {"id": "n4", "label": "Prediction", "x": 90, "y": 50, "color": "#10b981"}
            ]
            edges = [{"source": "n1", "target": "n2", "label": "Convolve"}, {"source": "n2", "target": "n3", "label": "Extract"}, {"source": "n3", "target": "n4", "label": "Classify"}]
        elif any(w in topic_lower for w in ["transformer", "gpt", "bert", "attention", "llm", "language"]):
            arch = "transformer"
            nodes = [
                {"id": "n1", "label": "Tokens", "x": 10, "y": 50, "color": "#3b82f6"},
                {"id": "n2", "label": "Embeddings", "x": 30, "y": 50, "color": "#8b5cf6"},
                {"id": "n3", "label": "Self-Attention", "x": 60, "y": 50, "color": "#f59e0b"},
                {"id": "n4", "label": "Output Prob", "x": 90, "y": 50, "color": "#10b981"}
            ]
            edges = [{"source": "n1", "target": "n2", "label": "Embed"}, {"source": "n2", "target": "n3", "label": "Attend"}, {"source": "n3", "target": "n4", "label": "Predict"}]
        elif any(w in topic_lower for w in ["gan", "adversarial", "generator"]):
            arch = "gan"
            nodes = [
                {"id": "n1", "label": "Noise (Z)", "x": 10, "y": 30, "color": "#8b5cf6"},
                {"id": "n2", "label": "Generator", "x": 40, "y": 30, "color": "#ec4899"},
                {"id": "n3", "label": "Discriminator", "x": 70, "y": 50, "color": "#f59e0b"},
                {"id": "n4", "label": "Real Data", "x": 40, "y": 70, "color": "#3b82f6"}
            ]
            edges = [{"source": "n1", "target": "n2", "label": "Generate"}, {"source": "n2", "target": "n3", "label": "Fake"}, {"source": "n4", "target": "n3", "label": "Real"}]
        elif any(w in topic_lower for w in ["diffusion", "noise", "ddpm"]):
            arch = "diffusion"
            nodes = [
                {"id": "n1", "label": "Pure Noise", "x": 10, "y": 50, "color": "#94a3b8"},
                {"id": "n2", "label": "U-Net Denoise", "x": 50, "y": 50, "color": "#8b5cf6"},
                {"id": "n3", "label": "Clean Image", "x": 90, "y": 50, "color": "#3b82f6"}
            ]
            edges = [{"source": "n1", "target": "n2", "label": "Step-by-step"}, {"source": "n2", "target": "n3", "label": "Remove Noise"}]
        elif any(w in topic_lower for w in ["rl", "reinforcement", "q-learning", "ppo", "dqn", "agent"]):
            arch = "rl"
            nodes = [
                {"id": "n1", "label": "Agent", "x": 30, "y": 30, "color": "#ec4899"},
                {"id": "n2", "label": "Environment", "x": 70, "y": 70, "color": "#3b82f6"}
            ]
            edges = [{"source": "n1", "target": "n2", "label": "Action"}, {"source": "n2", "target": "n1", "label": "State/Reward"}]
        elif any(w in topic_lower for w in ["rnn", "lstm", "gru", "sequence", "time"]):
            arch = "rnn"
            nodes = [
                {"id": "n1", "label": "Input Seq", "x": 10, "y": 70, "color": "#3b82f6"},
                {"id": "n2", "label": "Memory Cell", "x": 50, "y": 50, "color": "#f59e0b"},
                {"id": "n3", "label": "Output", "x": 90, "y": 30, "color": "#10b981"}
            ]
            edges = [{"source": "n1", "target": "n2", "label": "t"}, {"source": "n2", "target": "n2", "label": "t-1"}, {"source": "n2", "target": "n3", "label": "Predict"}]
        else:
            arch = "fnn"
            nodes = [
                {"id": "n1", "label": "Input Features", "x": 10, "y": 50, "color": "#3b82f6"},
                {"id": "n2", "label": "Hidden Layers", "x": 50, "y": 50, "color": "#8b5cf6"},
                {"id": "n3", "label": "Predictions", "x": 90, "y": 50, "color": "#ec4899"}
            ]
            edges = [{"source": "n1", "target": "n2", "label": "Weights"}, {"source": "n2", "target": "n3", "label": "Activation"}]

        return AnalyzeTopicResponse(type="custom_graph", data=build_visualization_graph(topic))



if __name__ == "__main__":
    print("Starting DL Virtual Teacher API on http://localhost:8000")
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
