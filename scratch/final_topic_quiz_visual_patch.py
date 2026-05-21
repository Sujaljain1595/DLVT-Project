from pathlib import Path


API_PATH = Path(r"c:\Users\sujal\OneDrive\Pictures\New folder\dl-virtual-teacher\api.py")

NEW_QUIZ = r'''

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
'''


content = API_PATH.read_text(encoding="utf-8")
marker = "\nclass TeachRequest(BaseModel):"
if marker not in content:
    raise RuntimeError("TeachRequest marker not found")
if "# Final quiz override:" not in content:
    content = content.replace(marker, NEW_QUIZ + marker, 1)

old = '''def analyze_topic(request: AnalyzeTopicRequest):
    topic = request.topic.strip()
    
    prompt = f"""You are an expert AI architecture visualizer. The user searched for the deep learning concept: '{topic}'.'''
new = '''def analyze_topic(request: AnalyzeTopicRequest):
    topic = request.topic.strip()
    if not llm_config.api_key or llm_config.api_key == "your_gemini_api_key_here":
        return AnalyzeTopicResponse(type="custom_graph", data=build_visualization_graph(topic))
    
    prompt = f"""You are an expert AI architecture visualizer. The user searched for the deep learning concept: '{topic}'.'''
if old in content:
    content = content.replace(old, new, 1)

old_except = '''        return AnalyzeTopicResponse(
            type="custom_graph",
            data={
                "architectureType": arch,
                "topicName": topic,
                "description": f"Fallback architecture mapping for {topic}",
                "nodes": nodes,
                "edges": edges
            }
        )'''
new_except = '''        return AnalyzeTopicResponse(type="custom_graph", data=build_visualization_graph(topic))'''
if old_except in content:
    content = content.replace(old_except, new_except, 1)

API_PATH.write_text(content, encoding="utf-8")
print(f"Patched quiz answer variety and analyze_topic fallback in {API_PATH}")
