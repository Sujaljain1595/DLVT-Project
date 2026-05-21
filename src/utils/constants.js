export const TOPICS = [
  'Convolutional Neural Networks (CNN)',
  'Recurrent Neural Networks (RNN)',
  'Transformers & Attention',
  'Backpropagation',
  'Generative Adversarial Networks (GAN)',
  'Autoencoders',
  'Reinforcement Learning',
  'Natural Language Processing',
  'Transfer Learning',
  'Graph Neural Networks',
  'Diffusion Models',
  'BERT & GPT Architecture',
]

export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced']

export const QUIZ_TYPES = [
  { value: 'mcq', label: 'Multiple Choice' },
  { value: 'true_false', label: 'True / False' },
  { value: 'fill_blank', label: 'Fill in the Blank' },
]

export const NOTE_TYPES = [
  { value: 'short', label: 'Short Notes' },
  { value: 'detailed', label: 'Detailed Notes' },
  { value: 'exam', label: 'Exam Notes' },
  { value: 'flashcard', label: 'Flashcard Format' },
  { value: 'formula', label: 'Formula Sheet' },
]

export const CODE_TEMPLATES = {
  cnn: {
    label: 'CNN Image Classifier',
    code: `import torch
import torch.nn as nn
import torch.nn.functional as F

class ConvNet(nn.Module):
    def __init__(self, num_classes=10):
        super().__init__()
        self.conv1 = nn.Conv2d(3, 32, 3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, 3, padding=1)
        self.pool  = nn.MaxPool2d(2, 2)
        self.fc1   = nn.Linear(64 * 8 * 8, 512)
        self.fc2   = nn.Linear(512, num_classes)
        self.drop  = nn.Dropout(0.5)

    def forward(self, x):
        x = self.pool(F.relu(self.conv1(x)))   # 32x16x16
        x = self.pool(F.relu(self.conv2(x)))   # 64x8x8
        x = x.view(x.size(0), -1)
        x = self.drop(F.relu(self.fc1(x)))
        return self.fc2(x)

model = ConvNet(num_classes=10)
print(model)
`
  },
  rnn: {
    label: 'RNN Text Classifier',
    code: `import torch
import torch.nn as nn

class RNNClassifier(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden, num_classes):
        super().__init__()
        self.embed   = nn.Embedding(vocab_size, embed_dim)
        self.rnn     = nn.LSTM(embed_dim, hidden, batch_first=True)
        self.fc      = nn.Linear(hidden, num_classes)

    def forward(self, x):
        x = self.embed(x)
        _, (h, _) = self.rnn(x)
        return self.fc(h[-1])

model = RNNClassifier(10000, 128, 256, 5)
print(model)
`
  },
  transformer: {
    label: 'Transformer Encoder',
    code: `import torch
import torch.nn as nn

class TransformerEncoder(nn.Module):
    def __init__(self, d_model=512, nhead=8, layers=6):
        super().__init__()
        enc_layer = nn.TransformerEncoderLayer(d_model, nhead, 
                         dim_feedforward=2048, dropout=0.1, batch_first=True)
        self.encoder = nn.TransformerEncoder(enc_layer, num_layers=layers)
        self.fc      = nn.Linear(d_model, d_model)

    def forward(self, src, src_key_padding_mask=None):
        out = self.encoder(src, src_key_padding_mask=src_key_padding_mask)
        return self.fc(out)

model = TransformerEncoder()
print(model)
`
  },
  gan: {
    label: 'Simple GAN',
    code: `import torch
import torch.nn as nn

class Generator(nn.Module):
    def __init__(self, z_dim=100, img_dim=784):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(z_dim, 256), nn.LeakyReLU(0.2),
            nn.Linear(256, 512),   nn.LeakyReLU(0.2),
            nn.Linear(512, img_dim), nn.Tanh()
        )
    def forward(self, z): return self.net(z)

class Discriminator(nn.Module):
    def __init__(self, img_dim=784):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(img_dim, 512), nn.LeakyReLU(0.2), nn.Dropout(0.3),
            nn.Linear(512, 256),     nn.LeakyReLU(0.2), nn.Dropout(0.3),
            nn.Linear(256, 1),       nn.Sigmoid()
        )
    def forward(self, x): return self.net(x)

G, D = Generator(), Discriminator()
print(G); print(D)
`
  },
  autoencoder: {
    label: 'Autoencoder',
    code: `import torch
import torch.nn as nn

class Autoencoder(nn.Module):
    def __init__(self, input_dim=784, latent_dim=32):
        super().__init__()
        # Encoder
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 256),
            nn.ReLU(),
            nn.Linear(256, 64),
            nn.ReLU(),
            nn.Linear(64, latent_dim)
        )
        # Decoder
        self.decoder = nn.Sequential(
            nn.Linear(latent_dim, 64),
            nn.ReLU(),
            nn.Linear(64, 256),
            nn.ReLU(),
            nn.Linear(256, input_dim),
            nn.Sigmoid()
        )

    def forward(self, x):
        z = self.encoder(x)       # Compress
        return self.decoder(z)    # Reconstruct

    def encode(self, x):
        return self.encoder(x)

model = Autoencoder(input_dim=784, latent_dim=32)
print(model)
x = torch.randn(8, 784)  # batch of 8
z = model.encode(x)
print(f"Input: {x.shape} → Latent: {z.shape}")
`
  },
}

export const NAV_ITEMS = [
  { path: '/dashboard',      label: 'Dashboard',       icon: 'LayoutDashboard' },
  { path: '/learn',          label: 'Learn Topic',     icon: 'BookOpen' },
  { path: '/notes',          label: 'Notes Generator', icon: 'FileText' },
  { path: '/quiz',           label: 'Quiz Generator',  icon: 'HelpCircle' },
  { path: '/flashcards',     label: 'Flashcards',      icon: 'Layers' },
  { path: '/visualizations', label: 'Visualizations',  icon: 'BarChart2' },
  { path: '/code',           label: 'Code Playground', icon: 'Code2' },
  { path: '/chat',           label: 'AI Chat Mentor',  icon: 'MessageSquare' },
  { path: '/planner',        label: 'Study Planner',   icon: 'Calendar' },
  { path: '/progress',       label: 'Progress',        icon: 'TrendingUp' },
  { path: '/settings',       label: 'Settings',        icon: 'Settings' },
]
