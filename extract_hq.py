import re
import base64
import os

for i in range(7):
    if i == 0:
        name = 'Photo rectangle'
    else:
        name = f'Photo rectangle ({i})'
    svg_path = f'src/shared/assets/images/gallery_hero/{name}.svg'
    with open(svg_path, 'r') as f:
        content = f.read()
    # Find the base64 JPEG data
    match = re.search(r'data:image/jpeg;base64,([^"\']+)', content)
    if match:
        b64 = match.group(1)
        jpeg_data = base64.b64decode(b64)
        out_path = f'src/shared/assets/images/gallery_hero/{name}_hq.jpg'
        with open(out_path, 'wb') as f:
            f.write(jpeg_data)
        print(f'{name}: {len(jpeg_data)} bytes extracted')
    else:
        print(f'{name}: No base64 JPEG found')