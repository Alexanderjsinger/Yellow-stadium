from pathlib import Path
import hashlib, json, re

ROOT = Path(__file__).resolve().parents[1]
failures = []

def expect(condition, message):
    if not condition:
        failures.append(message)

# E1 provenance remains complete even though E2 prunes deploy-only duplicates.
archive_path = ROOT / "golden/asset-manifest.rc8.json"
live_path = ROOT / "public/asset-manifest.json"
expect(archive_path.exists(), "archived RC8 asset manifest missing")
expect(live_path.exists(), "live asset manifest missing")
archive = json.loads(archive_path.read_text()) if archive_path.exists() else {}
live = json.loads(live_path.read_text()) if live_path.exists() else {}
expect(len(archive) == 806, f"expected 806 recovered RC8 assets in archive, found {len(archive)}")
expect(len(live) <= len(archive), "live asset manifest cannot exceed recovered archive")

# Every live asset retains its exact decoded RC8 bytes.
asset_bytes = 0
for original_key, meta in live.items():
    expect(original_key in archive, f"live asset missing from RC8 provenance: {original_key}")
    path = ROOT / "public" / meta["path"]
    expect(path.exists(), f"externalized asset missing: {meta['path']}")
    if not path.exists():
        continue
    raw = path.read_bytes()
    asset_bytes += len(raw)
    expect(meta == archive[original_key], f"live manifest metadata drift: {original_key}")
    expect(len(raw) == meta["bytes"], f"asset byte size drift: {meta['path']}")
    expect(hashlib.sha256(raw).hexdigest() == meta["sha256"], f"asset hash drift: {meta['path']}")

inline = (ROOT / "src/generated/assets-inline.js").read_text()
expect("data:image/" not in inline, "generated asset slot still embeds image data")
expect(len(inline) < 512, "generated asset compatibility slot should stay tiny")

# The only allowed source data image is the tiny SVG favicon.
scan_paths = [ROOT / "src/template.html", *sorted((ROOT / "src/styles").glob("*.css"))]
data_image_refs = []
for path in scan_paths:
    text = path.read_text(errors="ignore")
    for match in re.finditer(r"data:image/", text):
        data_image_refs.append((path.relative_to(ROOT).as_posix(), match.start()))
expect(len(data_image_refs) == 1, f"embedded source images remain after E1: {data_image_refs}")
expect(data_image_refs and data_image_refs[0][0] == "src/template.html", "only favicon may remain inline")

# All straightforward assetUrl literals must resolve to a live asset.
source_js = "\n".join(p.read_text(errors="ignore") for p in (ROOT / "src").rglob("*.js"))
for literal in sorted(set(re.findall(r"assetUrl\(['\"](\./assets/[^'\"]+)['\"]\)", source_js))):
    expect((ROOT / "public" / literal[2:]).exists(), f"assetUrl literal has no physical file: {literal}")

# Build output remains externalized.
dist_html = ROOT / "dist/index.html"
expect(dist_html.exists(), "dist/index.html missing; run build first")
if dist_html.exists():
    size = dist_html.stat().st_size
    expect(size < 2_000_000, f"externalized index.html is unexpectedly large: {size} bytes")
    built_text = dist_html.read_text(errors="ignore")
    expect(built_text.count("data:image/") == 1, "dist HTML still contains embedded image payloads")
expect((ROOT / "dist/assets/maps/kanto.png").exists(), "dist cinematic map missing")
expect((ROOT / "dist/asset-manifest.json").exists(), "dist asset manifest missing")

if failures:
    print("E1 ASSET CONTRACT FAILURES")
    for failure in failures:
        print("-", failure)
    raise SystemExit(1)
print(f"PASS: E1 externalized asset provenance retained; {len(live)} live files / {asset_bytes} bytes")
