from pathlib import Path
import re


API_PATH = Path(r"c:\Users\sujal\OneDrive\Pictures\New folder\dl-virtual-teacher\api.py")


NEW_CURRICULUM = r'''def classify_topic(topic: str) -> str:
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


def get_mock_curriculum(topic):
    kind = classify_topic(topic)
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
    roadmap = "# Learning Roadmap: " + display + "\n\n" + "\n".join(
        f"{i}. **{title}** - {desc}" for i, (title, desc) in enumerate(roadmap_items, 1)
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

    code = f"""```python
import torch
import torch.nn as nn
import torch.nn.functional as F


class TopicModel(nn.Module):
    # A compact, editable PyTorch template for studying {display}.

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
        logits = self.classifier(features)
        return logits


def train_one_step(model, batch_x, batch_y, optimizer):
    model.train()
    logits = model(batch_x)
    loss = F.cross_entropy(logits, batch_y)

    optimizer.zero_grad()
    loss.backward()
    torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
    optimizer.step()

    preds = logits.argmax(dim=1)
    acc = (preds == batch_y).float().mean().item()
    return loss.item(), acc


model = TopicModel(input_dim=128, hidden_dim=256, num_classes=4)
optimizer = torch.optim.AdamW(model.parameters(), lr=3e-4, weight_decay=1e-2)

batch_x = torch.randn(32, 128)
batch_y = torch.randint(0, 4, (32,))
loss, acc = train_one_step(model, batch_x, batch_y, optimizer)
print(f"loss={{loss:.4f}} accuracy={{acc:.2%}}")
```

### Code Explanation
- `feature_extractor` learns a useful internal representation from the input.
- `classifier` maps that representation to task-specific logits.
- `cross_entropy` combines `log_softmax` and negative log likelihood, so you should pass raw logits.
- `zero_grad`, `backward`, and `step` are the essential training cycle.
- Gradient clipping prevents a single unstable batch from creating very large updates.
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
        "quiz": build_mock_quiz(topic),
    }


def build_mock_quiz(topic: str, count: int = 5) -> str:
    import json
    questions = build_quiz_questions(topic, count)
    return json.dumps(questions, ensure_ascii=False)


def build_quiz_questions(topic: str, count: int = 5) -> List[Dict[str, Any]]:
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
    return questions[:count]
'''


def replace_function(content: str, name: str, replacement: str, next_marker: str) -> str:
    pattern = rf"def {name}\(.*?\n(?={re.escape(next_marker)})"
    updated, count = re.subn(pattern, replacement + "\n\n", content, flags=re.S)
    if count != 1:
        raise RuntimeError(f"Could not replace {name}; replacements={count}")
    return updated


content = API_PATH.read_text(encoding="utf-8")
content = replace_function(content, "get_mock_curriculum", NEW_CURRICULUM, "class TeachRequest")

content = content.replace(
    '''        msg_banner = "> [!WARNING]\\n> **API Key Missing**. You have not provided a Gemini API key. Displaying a highly detailed offline mock curriculum so you can experience the full UI.\\n\\n"
        return TeachResponse(
            topic=topic, difficulty=diff,
            results={
                "plan": msg_banner + get_mock_curriculum(topic)["plan"],
                "content": msg_banner + get_mock_curriculum(topic)["content"],
                "code": msg_banner + get_mock_curriculum(topic)["code"],
                "visualization": msg_banner + get_mock_curriculum(topic)["visualization"],
                "quiz": get_mock_curriculum(topic)["quiz"]
            }
        )''',
    '''        return TeachResponse(topic=topic, difficulty=diff, results=get_mock_curriculum(topic))''',
)

content = content.replace(
    '''            msg_banner = "> [!WARNING]\\n> **API Unavailable**. Your Google Gemini API key is missing or rate limited. Displaying a highly detailed offline mock curriculum so you can experience the full UI.\\n\\n"
            return TeachResponse(
                topic=topic, difficulty=diff,
                results={
                "plan": msg_banner + get_mock_curriculum(topic)["plan"],
                "content": msg_banner + get_mock_curriculum(topic)["content"],
                "code": msg_banner + get_mock_curriculum(topic)["code"],
                "visualization": msg_banner + get_mock_curriculum(topic)["visualization"],
                "quiz": get_mock_curriculum(topic)["quiz"]
            }
            )''',
    '''            return TeachResponse(topic=topic, difficulty=diff, results=get_mock_curriculum(topic))''',
)

content = content.replace(
    '''        results = {k: v.strip() or "Content generation failed for this section." for k, v in sections.items()}''',
    '''        results = {k: v.strip() or get_mock_curriculum(topic).get(k, "Content generation failed for this section.") for k, v in sections.items()}
        results["visualization_graph"] = build_visualization_graph(topic)''',
)

old_quiz = r'''@app.post("/api/quiz", response_model=QuizResponse)
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
"""
    import json
    raw = fast_generate(prompt)
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip().rstrip("```").strip()
    try:
        questions = json.loads(raw)
    except Exception:
        questions = [
            {"q": f"What is the primary purpose of {request.topic}?",
             "options": ["Feature learning", "Data preprocessing", "Model compression", "Weight init"],
             "answer": 0, "explanation": f"{request.topic} is used for automatic feature learning."},
        ]
    return QuizResponse(topic=request.topic, questions=questions[:request.count])
'''

new_quiz = r'''@app.post("/api/quiz", response_model=QuizResponse)
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
Make every question specific to '{request.topic}'.
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
            questions = build_quiz_questions(request.topic, request.count)
    except Exception:
        questions = build_quiz_questions(request.topic, request.count)
    return QuizResponse(topic=request.topic, questions=questions[:request.count])
'''

if old_quiz not in content:
    raise RuntimeError("Could not find generate_quiz block")
content = content.replace(old_quiz, new_quiz)

API_PATH.write_text(content, encoding="utf-8")
print(f"Enhanced {API_PATH}")
