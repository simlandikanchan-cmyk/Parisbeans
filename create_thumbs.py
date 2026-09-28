from PIL import Image
import os

for i in [1, 2, 3]:
    name = f'tab{i}'
    png_path = f'src/shared/assets/images/menu/{name}.png'
    if os.path.exists(png_path):
        with Image.open(png_path) as img:
            # Create thumbnail at 64px (2x for retina 22px display)
            img.thumbnail((64, 64), Image.Resampling.LANCZOS)
            # Save as JPEG
            out_path = f'src/shared/assets/images/menu/{name}_thumb.jpg'
            img.convert('RGB').save(out_path, 'JPEG', quality=80, optimize=True)
            print(f'{name}: {os.path.getsize(out_path)} bytes')
    else:
        print(f'{name}: PNG not found')