from pathlib import Path
import re


API_PATH = Path(r"c:\Users\sujal\OneDrive\Pictures\New folder\dl-virtual-teacher\api.py")
content = API_PATH.read_text(encoding="utf-8")

pattern = r'    code = f"""```python\n.*?\n"""\n\n    graph = build_visualization_graph\(topic\)'
replacement = '''    content += build_specific_theory(display, kind)
    code = build_code_example(display, kind)

    graph = build_visualization_graph(topic)'''

updated, count = re.subn(pattern, replacement, content, flags=re.S)
if count != 1:
    raise RuntimeError(f"Expected one generic code block replacement, got {count}")

API_PATH.write_text(updated, encoding="utf-8")
print(f"Switched backend to topic-specific code in {API_PATH}")
