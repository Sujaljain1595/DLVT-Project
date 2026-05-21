import os
import re

API_PATH = "c:/Users/sujal/OneDrive/Pictures/New folder/dl-virtual-teacher/api.py"

with open(API_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace the static RICH_MOCK constants with a dynamic function
mock_pattern = re.compile(r'RICH_MOCK_PLAN = """.*?RICH_MOCK_QUIZ = """.*?"""', re.DOTALL)

dynamic_mock_code = '''def get_mock_curriculum(topic):
    topic_lower = topic.lower()
    t_name = topic
    
    if any(w in topic_lower for w in ["gan", "generative", "adversarial"]):
        t_name = "Generative Adversarial Networks (GANs)"
        roadmap = "- Neural Networks\\n- CNN Basics\\n- Loss Functions\\n- Generator\\n- Discriminator\\n- GAN Training\\n- DCGAN\\n- StyleGAN\\n- Diffusion Models"
        content_text = """# Comprehensive Explanation
## A. Formal Technical Definition
**Definition:** A Generative Adversarial Network is a class of machine learning frameworks where two neural networks contest with each other in a game.
**Why It Is Needed:** To generate novel, realistic data instances from a latent space distribution.
## B. Core Concepts
- **Generator:** Learns to generate plausible data.
- **Discriminator:** Learns to distinguish the generator's fake data from real data.
## C. Step-by-Step Working
1. Generator takes random noise. 2. Produces fake image. 3. Discriminator evaluates it. 4. Loss is backpropagated.
## D. Mathematical Intuition
Min-Max Game: min_G max_D V(D,G) = E[log(D(x))] + E[log(1 - D(G(z)))]
## E. Real-World Applications
Deepfakes, image super-resolution, synthetic data generation.
## F. Interview Questions
- Why do GANs suffer from mode collapse?
- How does the Wasserstein GAN improve training?
"""
        code = """import torch.nn as nn
class Generator(nn.Module):
    def __init__(self):
        super().__init__()
        self.main = nn.Sequential(nn.Linear(100, 256), nn.ReLU(), nn.Linear(256, 784), nn.Tanh())
    def forward(self, x): return self.main(x)
"""
        viz = "Visualizing Generator creating noise and Discriminator predicting Real/Fake probabilities."
        quiz = "[{'q': 'What does the Generator do?', 'options': ['Creates fake data', 'Classifies data', 'Compresses data', 'Optimizes loss'], 'answer': 0, 'explanation': 'The generator maps latent noise to the data space.'}]"
        
    elif any(w in topic_lower for w in ["cnn", "convolution", "vision"]):
        t_name = "Convolutional Neural Networks (CNNs)"
        roadmap = "- Images as Tensors\\n- Convolution Operation\\n- Filters\\n- Pooling Layers\\n- Feature Maps\\n- CNN Architectures (ResNet, VGG)"
        content_text = """# Comprehensive Explanation
## A. Formal Technical Definition
**Definition:** A CNN is a regularized type of feed-forward neural network that learns feature engineering via filter optimization.
**Why It Is Needed:** Standard MLPs flatten images, destroying spatial features. CNNs preserve spatial structure.
## B. Core Concepts
- **Convolution:** Dot product of filter with local region.
- **Pooling:** Downsampling operation.
## C. Step-by-Step Working
Image -> Conv Layer (extract features) -> ReLU -> Pooling -> Fully Connected Layer -> Output.
## D. Mathematical Intuition
Feature Map(i,j) = (I * K)(i,j) = Sum_m Sum_n I(i-m, j-n) K(m,n)
## E. Real-World Applications
Facial recognition, medical imaging analysis, autonomous driving.
## F. Interview Questions
- What is the difference between Valid and Same padding?
"""
        code = """import torch.nn as nn
class SimpleCNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(1, 32, kernel_size=3)
        self.pool = nn.MaxPool2d(2, 2)
    def forward(self, x): return self.pool(nn.functional.relu(self.conv1(x)))
"""
        viz = "Visualizing a 3x3 filter sliding over a 5x5 image matrix to produce a feature map."
        quiz = "[{'q': 'What does a pooling layer do?', 'options': ['Reduces spatial dimensions', 'Increases channels', 'Calculates loss', 'Adds nonlinearity'], 'answer': 0, 'explanation': 'Pooling downsamples the feature map.'}]"

    elif any(w in topic_lower for w in ["transformer", "attention", "bert", "gpt"]):
        t_name = "Transformers & Self-Attention"
        roadmap = "- NLP Basics\\n- Embeddings\\n- Attention Mechanism\\n- Self-Attention\\n- Multi-Head Attention\\n- Encoder/Decoder Architecture\\n- BERT/GPT"
        content_text = """# Comprehensive Explanation
## A. Formal Technical Definition
**Definition:** A Transformer is a deep learning architecture that relies entirely on an attention mechanism to draw global dependencies between input and output.
**Why It Is Needed:** RNNs/LSTMs process sequences sequentially, preventing parallelization. Transformers allow parallel processing of sequences.
## B. Core Concepts
- **Self-Attention:** Weighing the importance of all other words when processing one word.
- **Positional Encoding:** Injecting order information into tokens.
## C. Step-by-Step Working
Input -> Embedding + Pos Encoding -> Multi-Head Attention -> Add & Norm -> Feed Forward -> Output.
## D. Mathematical Intuition
Attention(Q, K, V) = softmax(QK^T / sqrt(d_k)) V
## E. Real-World Applications
ChatGPT, Language Translation, GitHub Copilot.
## F. Interview Questions
- Why do we divide by sqrt(d_k) in scaled dot-product attention?
"""
        code = """import torch, torch.nn as nn
class SelfAttention(nn.Module):
    def __init__(self, embed_size, heads):
        super().__init__()
        self.values = nn.Linear(embed_size, embed_size, bias=False)
        self.keys = nn.Linear(embed_size, embed_size, bias=False)
        self.queries = nn.Linear(embed_size, embed_size, bias=False)
    def forward(self, values, keys, query, mask):
        # Implementation of Attention(Q, K, V)
        pass
"""
        viz = "Visualizing Query, Key, and Value matrices generating an attention weight heatmap."
        quiz = "[{'q': 'What replaces recurrence in Transformers?', 'options': ['Self-Attention', 'Convolutions', 'Pooling', 'Dropout'], 'answer': 0, 'explanation': 'Attention relates different positions of a single sequence.'}]"

    else:
        t_name = f"{topic} (Deep Learning)"
        roadmap = "- Basics\\n- Core Theory\\n- Mathematics\\n- Architecture\\n- Advanced Applications"
        content_text = f"""# Comprehensive Explanation
## A. Formal Technical Definition
**Definition:** {topic} is an important mechanism in deep neural networks.
**Why It Is Needed:** It enables models to learn complex, non-linear relationships efficiently.
## B. Core Concepts
- Optimization
- Architecture design
- Model evaluation
## C. Step-by-Step Working
Detailed flow of {topic} from input mapping to output generation.
## D. Mathematical Intuition
y = f(Wx + b)
## E. Real-World Applications
Used extensively in modern AI systems.
"""
        code = """# Topic-specific implementation
def implement_topic():
    print("Running implementation for this architecture...")
"""
        viz = f"Dynamic visualization for {topic}"
        quiz = "[{'q': 'What is the primary function?', 'options': ['Learning patterns', 'Deleting data', 'Overfitting', 'None'], 'answer': 0, 'explanation': 'AI learns patterns from data.'}]"

    return {
        "plan": f"# Detailed Learning Roadmap for {t_name}\\n\\n" + roadmap,
        "content": content_text,
        "code": "```python\\n" + code + "\\n```",
        "visualization": viz,
        "quiz": quiz
    }
'''

content = mock_pattern.sub(dynamic_mock_code, content)

# 2. Update the prompt inside teach_topic
prompt_pattern = re.compile(r'prompt = f"""You are an expert deep learning educator.*?Ensure all 5 sections are present and provide rich, comprehensive markdown content for each\. Do not use the delimiters inside the content itself\.\n"""', re.DOTALL)

new_prompt = '''prompt = f"""You are an expert deep learning educator. Build a topic-aware AI educational engine.
Generate a detailed beginner-to-advanced educational explanation for '{topic}' including architecture, training flow, adversarial learning, loss functions, applications, code examples, interview questions, and interactive visual explanations.

You MUST structure your response exactly using these delimiters:
===PLAN===
(A fully unique roadmap SPECIFIC to '{topic}'. List 7-10 topics starting from basics up to advanced cutting-edge concepts related to '{topic}'.)
===CONTENT===
(A VERY LONG, detailed explanation. Use this EXACT structure:
A. Definition: Simple beginner-friendly definition first.
B. Why It Is Needed: Real-world purpose and technical need.
C. Core Concepts: Main components explained (e.g. for Transformer: Self-Attention, Positional Encoding).
D. Step-by-Step Working: Detailed flow.
E. Mathematical Intuition: Equations + intuitive understanding.
F. Architecture Breakdown: Topic-specific architecture explanation.
G. Real-World Applications: Where used.
H. Advantages & Disadvantages.
I. Interview Questions.
J. Summary.
Add topic-specific analogies (e.g. GAN: art forger vs police, CNN: visual cortex). Never reuse a generic pizza analogy.)
===CODE===
(Clear, highly detailed, well-commented PyTorch/Python code implementation SPECIFIC to '{topic}'. Add syntax highlighting, line-by-line explanation, and editable code block style.)
===VISUALIZATION===
(Visualization guide: Describe the specific topic-aware animation required. E.g. GAN: Generator vs Discriminator animation, CNN: filter scanning animation. Plus Python matplotlib code to create one insightful diagram for '{topic}'.)
===QUIZ===
(5 highly specific MCQ questions testing deep understanding of '{topic}'. Format as JSON array of objects with keys: 'q', 'options' (array of 4 strings), 'answer' (index 0-3), 'explanation'.)

Do NOT output any generic template text. Everything MUST be dynamically tailored to '{topic}'.
"""'''

content = prompt_pattern.sub(new_prompt, content)

# 3. Update the fallback calls inside teach_topic
# Find all occurrences of the fallback return dict and replace them with a call to get_mock_curriculum
old_fallback_dict = r'''results=\{
\s*"plan": msg_banner \+ RICH_MOCK_PLAN\.replace\("\{topic\}", topic\),
\s*"content": msg_banner \+ RICH_MOCK_CONTENT\.replace\("\{topic\}", topic\),
\s*"code": msg_banner \+ RICH_MOCK_CODE\.replace\("\{topic\}", topic\),
\s*"visualization": msg_banner \+ RICH_MOCK_VIZ\.replace\("\{topic\}", topic\),
\s*"quiz": RICH_MOCK_QUIZ\.replace\("\{topic\}", topic\)
\s*\}'''

new_fallback_dict = '''results={
                "plan": msg_banner + get_mock_curriculum(topic)["plan"],
                "content": msg_banner + get_mock_curriculum(topic)["content"],
                "code": msg_banner + get_mock_curriculum(topic)["code"],
                "visualization": msg_banner + get_mock_curriculum(topic)["visualization"],
                "quiz": get_mock_curriculum(topic)["quiz"]
            }'''

content = re.sub(old_fallback_dict, new_fallback_dict, content)

with open(API_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("api.py patched successfully!")
