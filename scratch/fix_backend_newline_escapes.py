from pathlib import Path


API_PATH = Path(r"c:\Users\sujal\OneDrive\Pictures\New folder\dl-virtual-teacher\api.py")

content = API_PATH.read_text(encoding="utf-8")
broken = '''    roadmap = "# Learning Roadmap: " + display + "

" + "
".join(
        f"{i}. **{title}** - {desc}" for i, (title, desc) in enumerate(roadmap_items, 1)
    )
'''
fixed = '''    roadmap = "# Learning Roadmap: " + display + "\\n\\n" + "\\n".join(
        f"{i}. **{title}** - {desc}" for i, (title, desc) in enumerate(roadmap_items, 1)
    )
'''

if broken not in content:
    raise RuntimeError("Expected broken roadmap block was not found")

API_PATH.write_text(content.replace(broken, fixed, 1), encoding="utf-8")
print(f"Fixed newline escapes in {API_PATH}")
