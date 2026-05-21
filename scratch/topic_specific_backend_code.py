from pathlib import Path
import re


API_PATH = Path(r"c:\Users\sujal\OneDrive\Pictures\New folder\dl-virtual-teacher\api.py")


HELPERS = r"""

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
"""


content = API_PATH.read_text(encoding="utf-8")

if "def build_specific_theory" not in content:
    content = content.replace("\ndef get_mock_curriculum(topic):", HELPERS + "\ndef get_mock_curriculum(topic):", 1)

content = content.replace(
    '''## 10. Summary
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
print(f"loss={loss:.4f} accuracy={acc:.2%}")
```

### Code Explanation
- `feature_extractor` learns a useful internal representation from the input.
- `classifier` maps that representation to task-specific logits.
- `cross_entropy` combines `log_softmax` and negative log likelihood, so you should pass raw logits.
- `zero_grad`, `backward`, and `step` are the essential training cycle.
- Gradient clipping prevents a single unstable batch from creating very large updates.
"""
''',
    '''## 10. Summary
Learn the intuition first, then the architecture, then the training loop. The strongest understanding comes from tracing one example from input tensor to prediction and then tracing the gradient back to the parameters.
"""

    content += build_specific_theory(display, kind)
    code = build_code_example(display, kind)
''',
)

API_PATH.write_text(content, encoding="utf-8")
print(f"Added topic-specific code examples to {API_PATH}")
