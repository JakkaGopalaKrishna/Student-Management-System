import os
import re

routes = [
    "dashboard", "students", "teachers", "attendance", "marks", "fees",
    "notes", "papers", "syllabus", "timetable", "holidays", "notifications",
    "reports", "settings"
]

for route in routes:
    source_file = f"{route}.html"
    if not os.path.exists(source_file):
        print(f"Skipping {source_file}, not found.")
        continue
    
    target_dir = os.path.join("admin", route)
    os.makedirs(target_dir, exist_ok=True)
    target_file = os.path.join(target_dir, "index.html")
    
    with open(source_file, "r") as f:
        content = f.read()
        
    # Replace relative links
    content = re.sub(r'href="css/', 'href="../../css/', content)
    content = re.sub(r'src="js/', 'src="../../js/', content)
    content = re.sub(r'src="assets/', 'src="../../assets/', content)
    content = re.sub(r'href="index\.html"', 'href="../../index.html"', content)
    content = re.sub(r'href="dashboard\.html"', 'href="../../dashboard.html"', content)
    content = re.sub(r'window\.location\.href\s*=\s*[\'"]index\.html[\'"]', 'window.location.href="../../index.html"', content)
    content = re.sub(r'window\.location\.href\s*=\s*[\'"]dashboard\.html[\'"]', 'window.location.href="../../dashboard.html"', content)

    # Any JS router paths that expect to hit `dashboard.html` from `admin/dashboard/index.html`?
    # Actually sidebar.js and router.js will be handling this.
    
    with open(target_file, "w") as f:
        f.write(content)
        
    print(f"Created {target_file}")
