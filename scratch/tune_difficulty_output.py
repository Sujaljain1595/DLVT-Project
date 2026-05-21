from pathlib import Path


API_PATH = Path(r"c:\Users\sujal\OneDrive\Pictures\New folder\dl-virtual-teacher\api.py")
content = API_PATH.read_text(encoding="utf-8")

content = content.replace(
    '''    if level == "beginner":
        content += f"""

## Difficulty Focus: Beginner
This version keeps the theory practical and approachable. Focus on what the model does, why each component exists, and how data moves from input to output. You should be able to explain {display} without relying on equations first.

### What To Master First
- The meaning of input tensors and output logits.
- The role of layers, activations, loss, and optimizer.
- The difference between training accuracy and validation accuracy.
- One simple implementation that runs without shape errors.
"""''',
    '''    if level == "beginner":
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
"""''',
    1,
)

content = content.replace(
    '''    if level == "intermediate":
        questions.extend([''',
    '''    if level == "intermediate":
        questions = [''',
    1,
)
content = content.replace(
    '''        ])
    elif level == "advanced":
        questions.extend([''',
    '''        ] + questions
    elif level == "advanced":
        questions = [''',
    1,
)
content = content.replace(
    '''        ])
    return questions[:count]''',
    '''        ] + questions
    return questions[:count]''',
    1,
)

API_PATH.write_text(content, encoding="utf-8")
print(f"Tuned difficulty-specific content and quiz ordering in {API_PATH}")
