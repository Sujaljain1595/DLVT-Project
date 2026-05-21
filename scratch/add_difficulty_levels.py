from pathlib import Path


API_PATH = Path(r"c:\Users\sujal\OneDrive\Pictures\New folder\dl-virtual-teacher\api.py")
content = API_PATH.read_text(encoding="utf-8")

content = content.replace("def get_mock_curriculum(topic):", "def get_mock_curriculum(topic, difficulty: str = \"beginner\"):", 1)
content = content.replace(
    '''    kind = classify_topic(topic)
    display = {''',
    '''    kind = classify_topic(topic)
    level = (difficulty or "beginner").lower()
    if level not in {"beginner", "intermediate", "advanced"}:
        level = "beginner"

    display = {''',
    1,
)

content = content.replace(
    '''    roadmap = "# Learning Roadmap: " + display + "\\n\\n" + "\\n".join(
        f"{i}. **{title}** - {desc}" for i, (title, desc) in enumerate(roadmap_items, 1)
    )''',
    '''    if level == "beginner":
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

    roadmap = f"# {level.title()} Roadmap: " + display + "\\n\\n" + roadmap_intro + "\\n\\n" + "\\n".join(
        f"{i}. **{title}** - {desc}" for i, (title, desc) in enumerate(selected_items, 1)
    )''',
    1,
)

content = content.replace(
    '''    content += build_specific_theory(display, kind)
    code = build_code_example(display, kind)''',
    '''    if level == "beginner":
        content += f"""

## Difficulty Focus: Beginner
This version keeps the theory practical and approachable. Focus on what the model does, why each component exists, and how data moves from input to output. You should be able to explain {display} without relying on equations first.

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
"""''',
    1,
)

content = content.replace('"quiz": build_mock_quiz(topic),', '"quiz": build_mock_quiz(topic, difficulty=level),', 1)
content = content.replace("def build_mock_quiz(topic: str, count: int = 5) -> str:", "def build_mock_quiz(topic: str, count: int = 5, difficulty: str = \"beginner\") -> str:", 1)
content = content.replace("questions = build_quiz_questions(topic, count)", "questions = build_quiz_questions(topic, count, difficulty)", 1)
content = content.replace("def build_quiz_questions(topic: str, count: int = 5) -> List[Dict[str, Any]]:", "def build_quiz_questions(topic: str, count: int = 5, difficulty: str = \"beginner\") -> List[Dict[str, Any]]:", 1)

content = content.replace(
    '''    return questions[:count]''',
    '''    level = (difficulty or "beginner").lower()
    if level == "intermediate":
        questions.extend([
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
        ])
    elif level == "advanced":
        questions.extend([
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
        ])
    return questions[:count]''',
    1,
)

for old, new in [
    ("results=get_mock_curriculum(topic)", "results=get_mock_curriculum(topic, diff)"),
    ("get_mock_curriculum(topic).get(k,", "get_mock_curriculum(topic, diff).get(k,"),
]:
    content = content.replace(old, new)

content = content.replace(
    "Generate a detailed beginner-to-advanced educational explanation for '{topic}' including architecture, training flow, adversarial learning, loss functions, applications, code examples, interview questions, and interactive visual explanations.",
    "Generate a {diff} level educational explanation for '{topic}'. For beginner use basic theory and intuition. For intermediate add architecture tradeoffs and training/debugging depth. For advanced include mathematical notation, gradient reasoning, complexity, advanced variants, and more rigorous detail.",
    1,
)

content = content.replace(
    "questions = build_quiz_questions(request.topic, request.count)",
    "questions = build_quiz_questions(request.topic, request.count, request.difficulty)",
)

API_PATH.write_text(content, encoding="utf-8")
print(f"Added difficulty-aware curriculum behavior to {API_PATH}")
