from pathlib import Path
import hashlib, json, subprocess, sys

ROOT = Path(__file__).resolve().parents[1]
subprocess.check_call([sys.executable, str(ROOT / "tools/build.py")])
manifest = json.loads((ROOT / "manifest.json").read_text())

# Immutable original RC8 release.
golden = (ROOT / "golden/index.rc8.html").read_bytes()
golden_hash = hashlib.sha256(golden).hexdigest()
print("RC8 golden expected ", manifest["golden_sha256"])
print("RC8 golden actual   ", golden_hash)
if golden_hash != manifest["golden_sha256"]:
    raise SystemExit("Archived RC8 golden-master drift")

built = (ROOT / "dist/index.html").read_bytes()
built_hash = hashlib.sha256(built).hexdigest()
expected = manifest.get("canonical_sha256", manifest["golden_sha256"])
print("canonical expected  ", expected)
print("canonical actual    ", built_hash)
if built_hash != expected:
    raise SystemExit("Canonical build mismatch")

# E1 makes the deploy a directory, so verify the asset tree as part of the
# canonical release rather than treating index.html as the complete product.
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

assets_hash, assets_count, assets_bytes = tree_hash(ROOT / "dist/assets")
print("assets expected     ", manifest.get("canonical_assets_sha256"))
print("assets actual       ", assets_hash)
if assets_hash != manifest.get("canonical_assets_sha256"):
    raise SystemExit("Canonical asset tree mismatch")
if assets_count != manifest.get("asset_count") or assets_bytes != manifest.get("asset_bytes"):
    raise SystemExit("Canonical asset tree count/size mismatch")
print("PASS: archived RC8 intact + canonical HTML/assets reproducible")
