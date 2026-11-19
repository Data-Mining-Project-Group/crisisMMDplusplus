"""
Build the image files for the CrisisMMD++ survey (run once).

Run this from inside the CrisisMMD_Survey folder:
    python build_images.py

It reads image_list.csv, opens each image from ../CrisisMMD_v2.0/,
shrinks it to a web-friendly size, and packs every 25 images into one
file in site/img/ (36 files in total). Packing keeps the GitHub upload
under 100 files, so you can drag and drop the whole site folder.
"""
import base64, csv, io, json, os, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_ROOT = os.path.join(HERE, "..", "CrisisMMD_v2.0")
OUT_DIR = os.path.join(HERE, "site", "img")
MAX_SIDE, QUALITY = 720, 72

os.makedirs(OUT_DIR, exist_ok=True)
chunks, missing = {}, []
with open(os.path.join(HERE, "image_list.csv"), newline="", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

for n, r in enumerate(rows, 1):
    path = os.path.join(DATA_ROOT, *r["image_path"].split("/"))
    try:
        im = Image.open(path).convert("RGB")
        im.thumbnail((MAX_SIDE, MAX_SIDE))
        buf = io.BytesIO()
        im.save(buf, "JPEG", quality=QUALITY, optimize=True)
        uri = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()
    except Exception as e:  # keep going, report at the end
        missing.append((r["item_id"], path, str(e)))
        uri = ""
    chunks.setdefault(int(r["chunk"]), {})[r["item_id"]] = uri
    if n % 100 == 0:
        print(f"  {n}/{len(rows)} images done")

for c, data in chunks.items():
    with open(os.path.join(OUT_DIR, f"chunk_{c:02d}.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, separators=(",", ":"))

size = sum(os.path.getsize(os.path.join(OUT_DIR, x)) for x in os.listdir(OUT_DIR)) / 1e6
print(f"Done: {len(chunks)} files written to site/img ({size:.1f} MB total)")
if missing:
    print(f"WARNING: {len(missing)} images could not be read:")
    for m in missing[:20]:
        print("  ", m)
    sys.exit(1)
