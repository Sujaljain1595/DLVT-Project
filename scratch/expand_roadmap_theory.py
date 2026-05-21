from pathlib import Path


API_PATH = Path(r"c:\Users\sujal\OneDrive\Pictures\New folder\dl-virtual-teacher\api.py")

OVERRIDE = r'''

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

    if level == "beginner":
        sections = [
            ("Simple Meaning", f"{display} is a method for turning {profile['input']} into {profile['output']}. For the topic **{topic}**, the most important first idea is the direction of information flow: data enters, each part transforms it, and the final output is compared with the correct answer."),
            ("Why We Need It", f"Raw data is usually too large or messy for hand-written rules. {display} helps a model learn patterns automatically. A beginner should focus on what pattern is being learned and why that pattern is useful."),
            ("Input and Output", f"Input: **{profile['input']}**. Output: **{profile['output']}**. If you can name these clearly, the rest of the architecture becomes easier to understand."),
            ("Main Components", _md_list([f"**{part}:** learn what this part receives, what it changes, and what it passes to the next step." for part in core])),
            ("Step-by-Step Flow", "The basic flow is: " + " -> ".join(profile["flow"]) + ". Read this like a story rather than a formula."),
            ("Tiny Training Story", "The model makes a prediction, the loss measures the mistake, and the optimizer changes the parameters. Repeating this many times slowly improves the model."),
            ("What To Practice", f"Draw the {topic} pipeline, write the input and output shapes if you know them, and explain each component using one short sentence."),
        ]
    elif level == "intermediate":
        sections = [
            ("Working Definition", f"{display} is a trainable system designed around the structure of **{profile['input']}**. At this level, do not only define it; explain why this structure is better than a generic fully connected model."),
            ("Architecture Breakdown", _md_list([f"**{part}:** describe its role, the design choice involved, and what can go wrong if it is poorly configured." for part in core])),
            ("Data Flow", f"The active pipeline is **{' -> '.join(profile['flow'])}**. For each transition, identify whether it changes shape, mixes information, filters noise, or produces a decision signal."),
            ("Training Behavior", "Track training loss, validation loss, task metric, learning rate, and sample predictions. A model is not good just because training loss decreases."),
            ("Hyperparameter Decisions", "Intermediate work means making controlled choices: change one setting at a time, record the metric, and explain the result."),
            ("Tradeoffs and Risks", f"The main topic-specific risk is **{profile['risk']}**. A good learner should describe how this failure appears in metrics or examples."),
            ("Debugging Procedure", _md_list(["Check tensor shapes and label format.", "Overfit a tiny batch.", "Compare train and validation curves.", "Inspect wrong predictions.", "Run one ablation to test a component."])),
            ("Mini Project", f"Build a small {display} experiment for **{topic}**. Keep the baseline, change one architecture or training choice, and compare the validation result."),
            ("Interview-Ready Summary", f"Explain {display} in terms of input, core components, output, loss, and failure modes. That answer is much stronger than only saying a definition."),
        ]
    else:
        sections = [
            ("Formal Problem Setup", f"Let `x` come from the input domain represented by **{profile['input']}**, and let the model `f_theta(x)` produce **{profile['output']}**. Define what is observed, what is predicted, and which parameters are learned."),
            ("Forward Relation", f"A useful mathematical anchor for this topic is `{profile['math']}`. Advanced understanding means identifying tensor shapes, learned variables, fixed variables, and assumptions behind this expression."),
            ("Objective Function", "`theta* = argmin_theta E[L(f_theta(x), y)] + lambda Omega(theta)` describes the learning problem. The first term rewards task performance; the second term controls complexity or stability."),
            ("Gradient Flow", "Backpropagation sends error signals backward through every differentiable operation. Analyze where gradients may vanish, explode, become sparse, or become noisy."),
            ("Optimization Dynamics", "Learning rate, initialization, normalization, batch size, optimizer state, and curvature all affect convergence. Advanced work explains training behavior instead of only reporting it."),
            ("Complexity Analysis", "Estimate the dominant compute operation and memory cost. Include parameter count, activation memory, and how cost changes when input length, image size, graph size, or sample count increases."),
            ("Failure Mode Analysis", f"The major risk here is **{profile['risk']}**. Explain the mechanism that causes it, the metric pattern that reveals it, and an experiment that confirms it."),
            ("Advanced Variants", f"Compare variants of {display}. For each variant, name what changes: architecture, loss, data assumption, optimizer, or inference process."),
            ("Ablation Design", "Remove or alter one component at a time. A strong ablation explains whether the component improves accuracy, stability, sample quality, calibration, latency, or robustness."),
            ("Research and Production View", f"For **{topic}**, connect theory to deployment: data requirements, monitoring, compute budget, failure cases, and what evidence would make you trust the model."),
            ("Mastery Checklist", _md_list(["Derive the main equation.", "Trace tensor shapes.", "Explain gradient flow.", "Name failure modes.", "Design ablations.", "Compare advanced variants."])),
        ]

    return f"# {display}: {level.title()} Explanation\n\n" + "\n\n".join(
        f"## {i}. {title}\n{body}" for i, (title, body) in enumerate(sections, 1)
    )
'''


content = API_PATH.read_text(encoding="utf-8")
marker = "\nclass TeachRequest(BaseModel):"
if marker not in content:
    raise RuntimeError("TeachRequest marker not found")

if "# Final content-depth override:" in content:
    before, after = content.split("# Final content-depth override:", 1)
    _, rest = after.split(marker, 1)
    content = before.rstrip() + "\n" + OVERRIDE + marker + rest
else:
    content = content.replace(marker, OVERRIDE + marker, 1)

API_PATH.write_text(content, encoding="utf-8")
print(f"Expanded roadmap and explanation depth in {API_PATH}")
