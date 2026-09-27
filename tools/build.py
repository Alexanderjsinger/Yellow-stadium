from pathlib import Path
import json, shutil, subprocess, sys

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / "manifest.json").read_text())
source = (ROOT / "src/template.html").read_text()

# G2: style blocks are minified with a real CSS parser (tools/minify_css.js)
# rather than shipped as the readable, hand-edited source. Source on disk
# stays fully formatted; only the canonical build output is minified.
node = shutil.which("node") or "node"
minified_json = subprocess.run(
    [node, str(ROOT / "tools/minify_css.js")],
    cwd=ROOT, capture_output=True, text=True,
)
if minified_json.returncode != 0:
    sys.stderr.write(minified_json.stderr)
    raise SystemExit("CSS minification failed")
minified_styles = json.loads(minified_json.stdout)

for entry in manifest["scripts"]:
    source = source.replace(entry["placeholder"], (ROOT / entry["path"]).read_text())
for entry in manifest["styles"]:
    source = source.replace(entry["placeholder"], minified_styles[entry["path"]])

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
