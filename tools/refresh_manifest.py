from pathlib import Path
import hashlib, json, shutil

ROOT = Path(__file__).resolve().parents[1]
manifest_path = ROOT / "manifest.json"
manifest = json.loads(manifest_path.read_text())
template = (ROOT / "src/template.html").read_text()
built = template

for group in ("scripts", "styles"):
    for entry in manifest[group]:
        path = ROOT / entry["path"]
        text = path.read_text()
        entry["chars"] = len(text)
        entry["sha256"] = hashlib.sha256(path.read_bytes()).hexdigest()
        built = built.replace(entry["placeholder"], text)

manifest["canonical_sha256"] = hashlib.sha256(built.encode()).hexdigest()
manifest["canonical_phase"] = "source-owner-battle-stability"

def tree_hash(root: Path):
    h = hashlib.sha256()
    count = 0
    total = 0
    for path in sorted(p for p in root.rglob("*") if p.is_file()):
        rel = path.relative_to(root).as_posix().encode()
        raw = path.read_bytes()
        h.update(len(rel).to_bytes(4, "big")); h.update(rel)
        h.update(len(raw).to_bytes(8, "big")); h.update(raw)
        count += 1; total += len(raw)
    return h.hexdigest(), count, total

assets_hash, assets_count, assets_bytes = tree_hash(ROOT / "public/assets")
manifest["canonical_assets_sha256"] = assets_hash
manifest["asset_count"] = assets_count
manifest["asset_bytes"] = assets_bytes

manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")

dist = ROOT / "dist"
dist.mkdir(exist_ok=True)
(dist / "index.html").write_text(built, encoding="utf-8", newline="")
print("refreshed", manifest["canonical_sha256"])
