from pathlib import Path


API_PATH = Path(r"c:\Users\sujal\OneDrive\Pictures\New folder\dl-virtual-teacher\api.py")

OVERRIDE = r'''

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
'''


content = API_PATH.read_text(encoding="utf-8")
marker = "\nclass TeachRequest(BaseModel):"
if marker not in content:
    raise RuntimeError("Could not find TeachRequest marker")

if "# --- Topic-aware offline curriculum overrides ---" in content:
    before, after = content.split("# --- Topic-aware offline curriculum overrides ---", 1)
    override_body, rest = after.split(marker, 1)
    content = before.rstrip() + "\n" + OVERRIDE + marker + rest
else:
    content = content.replace(marker, "\n" + OVERRIDE + marker, 1)

API_PATH.write_text(content, encoding="utf-8")
print(f"Installed topic-aware overrides in {API_PATH}")
