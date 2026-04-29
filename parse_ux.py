import os
import re
import json

def analyze_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find states
    states = re.findall(r'const\s+\[(.*?)\]\s*=\s*useState', content)

    # Find elements
    buttons = re.findall(r'<button[^>]*>([\s\S]*?)</button>', content)
    buttons = [re.sub(r'<[^>]*>', '', b).strip() for b in buttons if b.strip()]
    
    links = re.findall(r'<Link[^>]*to=["\'](.*?)["\'][^>]*>([\s\S]*?)</Link>', content)
    links = [(l[0], re.sub(r'<[^>]*>', '', l[1]).strip()) for l in links if l[1].strip()]

    inputs = re.findall(r'<input[^>]*type=["\'](.*?)["\'][^>]*placeholder=["\'](.*?)["\'][^>]*>', content)

    # Clean empty strings
    buttons = [b for b in set(buttons) if b]
    
    return {
        "states": [s.split(',')[0].strip() for s in states],
        "buttons": buttons,
        "links": links,
        "inputs": inputs
    }

def analyze_portal(portal_path):
    pages_path = os.path.join(portal_path, 'src', 'pages')
    if not os.path.exists(pages_path): return {}
    
    data = {}
    for filename in os.listdir(pages_path):
        if filename.endswith('.tsx'):
            filepath = os.path.join(pages_path, filename)
            data[filename] = analyze_file(filepath)
    return data

portals = ['student-portal', 'professor-portal', 'admin-portal']
result = {p: analyze_portal(p) for p in portals}

with open('ux_data.json', 'w') as f:
    json.dump(result, f, indent=2)

print("Done")
