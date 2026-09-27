from pathlib import Path
import json, shutil

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / "manifest.json").read_text())
source = (ROOT / "src/template.html").read_text()

# UI-5.2: source CSS is already consolidated into 14 canonical owners.
# Keep the canonical build dependency-free and let the CDN apply gzip/brotli;
# parser minification saved only ~6 KB compressed while adding an npm failure point.
for entry in manifest["scripts"]:
    source = source.replace(entry["placeholder"], (ROOT / entry["path"]).read_text())
for entry in manifest["styles"]:
    source = source.replace(entry["placeholder"], (ROOT / entry["path"]).read_text())

dist = ROOT / "dist"
dist.mkdir(exist_ok=True)
out = dist / "index.html"
out.write_text(source, encoding="utf-8", newline="")

# E1: assets are real deploy artifacts rather than data URIs embedded in JS/CSS/HTML.
public = ROOT / "public"
for child in public.iterdir():
    target = dist / child.name
    if target.exists():
        if target.is_dir():
            shutil.rmtree(target)
        else:
            target.unlink()
    if child.is_dir():
        shutil.copytree(child, target)
    else:
        shutil.copy2(child, target)

print(out)
