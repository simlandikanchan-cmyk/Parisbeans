import re
import base64
import os

for i in [1, 2, 3]:
    name = f'tab{i}'
    svg_path = f'src/shared/assets/images/menu/{name}.svg'
    if os.path.exists(svg_path):
        with open(svg_path, 'r') as f:
            content = f.read()
        # Find the base64 image data
        match = re.search(r'data:image/(jpeg|webp|png);base64,([^"\']+)', content)
        if match:
            fmt = match.group(1)
            b64 = match.group(2)
            img_data = base64.b64decode(b64)
            out_path = f'src/shared/assets/images/menu/{name}_thumb.jpg'
            with open(out_path, 'wb') as f:
                f.write(img_data)
            print(f'{name}: {len(img_data)} bytes extracted as {fmt}')
        else:
            print(f'{name}: No base64 image found')
    else:
        print(f'{name}: SVG not found')