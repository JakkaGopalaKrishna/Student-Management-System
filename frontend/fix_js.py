import os
import re

js_dir = '/home/jgkrishna/Desktop/Student-Management-System/frontend/js'

for filename in os.listdir(js_dir):
    if not filename.endswith('.js'):
        continue
        
    filepath = os.path.join(js_dir, filename)
    with open(filepath, 'r') as f:
        content = f.read()

    original_content = content
    
    # Replace DOMContentLoaded with IIFE
    content = content.replace("document.addEventListener('DOMContentLoaded', async () => {", "(async () => {")
    content = content.replace("document.addEventListener('DOMContentLoaded', () => {", "(() => {")
    
    # If we made a replacement at the top, we need to fix the bottom
    if original_content != content:
        # Find the last `});` and replace with `})();`
        # We can do an rsplit
        parts = content.rsplit('});', 1)
        if len(parts) == 2:
            content = parts[0] + '})();' + parts[1]
            
    # Fix relative redirects
    content = re.sub(r'window\.location\.href\s*=\s*[\'"]index\.html[\'"]', 'window.location.href = \'/index.html\'', content)
    content = re.sub(r'window\.location\.href\s*=\s*[\'"]dashboard\.html[\'"]', 'window.location.href = \'/dashboard.html\'', content)

    with open(filepath, 'w') as f:
        f.write(content)
        
print("JS files fixed.")
