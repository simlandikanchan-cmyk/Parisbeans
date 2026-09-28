import re

with open('src/shared/assets/images/gallery_hero/Photo rectangle.svg', 'r') as f:
    content = f.read()

# Find all data: URIs
matches = re.findall(r'data:[^"\']+', content)
for m in matches[:3]:
    print(m[:100])