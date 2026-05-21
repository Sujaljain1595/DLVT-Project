from pathlib import Path


API_PATH = Path(r"c:\Users\sujal\OneDrive\Pictures\New folder\dl-virtual-teacher\api.py")


def replace_required(content: str, old: str, new: str) -> str:
    if old not in content:
        raise RuntimeError(f"Expected block not found:\n{old[:120]}...")
    return content.replace(old, new, 1)


content = API_PATH.read_text(encoding="utf-8")

replacements = [
    (
        '''roadmap = "- Neural Networks
- CNN Basics
- Loss Functions
- Generator
- Discriminator
- GAN Training
- DCGAN
- StyleGAN
- Diffusion Models"''',
        '''roadmap = "- Neural Networks\\n- CNN Basics\\n- Loss Functions\\n- Generator\\n- Discriminator\\n- GAN Training\\n- DCGAN\\n- StyleGAN\\n- Diffusion Models"''',
    ),
    (
        '''roadmap = "- Images as Tensors
- Convolution Operation
- Filters
- Pooling Layers
- Feature Maps
- CNN Architectures (ResNet, VGG)"''',
        '''roadmap = "- Images as Tensors\\n- Convolution Operation\\n- Filters\\n- Pooling Layers\\n- Feature Maps\\n- CNN Architectures (ResNet, VGG)"''',
    ),
    (
        '''roadmap = "- NLP Basics
- Embeddings
- Attention Mechanism
- Self-Attention
- Multi-Head Attention
- Encoder/Decoder Architecture
- BERT/GPT"''',
        '''roadmap = "- NLP Basics\\n- Embeddings\\n- Attention Mechanism\\n- Self-Attention\\n- Multi-Head Attention\\n- Encoder/Decoder Architecture\\n- BERT/GPT"''',
    ),
    (
        '''roadmap = "- Basics
- Core Theory
- Mathematics
- Architecture
- Advanced Applications"''',
        '''roadmap = "- Basics\\n- Core Theory\\n- Mathematics\\n- Architecture\\n- Advanced Applications"''',
    ),
    (
        '''"plan": f"# Detailed Learning Roadmap for {t_name}

" + roadmap,''',
        '''"plan": f"# Detailed Learning Roadmap for {t_name}\\n\\n" + roadmap,''',
    ),
    (
        '''"code": "```python
" + code + "
```",''',
        '''"code": "```python\\n" + code + "\\n```",''',
    ),
]

for old, new in replacements:
    content = replace_required(content, old, new)

API_PATH.write_text(content, encoding="utf-8")
print(f"Repaired {API_PATH}")
