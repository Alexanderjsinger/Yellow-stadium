"""Recover the RC8 embedded asset bundle into public/assets.

This is a recovery/verification utility, not part of the normal build. E1 keeps
physical asset files as canonical source, but this tool proves they can be
recreated from the immutable RC8 golden master.
"""
from pathlib import Path
import base64, hashlib, json, urllib.parse

ROOT = Path(__file__).resolve().parents[1]
golden = (ROOT / "golden/index.rc8.html").read_text(encoding="utf-8")
marker = "window.STADIUM_ASSETS="
start = golden.index(marker) + len(marker)
end = golden.index(";</script>", start)
assets = json.loads(golden[start:end])

out_root = ROOT / "public"
manifest = {}
for key, uri in assets.items():
    rel = key[2:] if key.startswith("./") else key
    target = out_root / rel
    target.parent.mkdir(parents=True, exist_ok=True)
    header, payload = uri.split(",", 1)
    raw = base64.b64decode(payload) if ";base64" in header else urllib.parse.unquote_to_bytes(payload)
    target.write_bytes(raw)
    manifest[key] = {
        "path": rel,
        "bytes": len(raw),
        "sha256": hashlib.sha256(raw).hexdigest(),
        "mime": header[5:].split(";", 1)[0],
    }

(out_root / "asset-manifest.json").write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
print(f"recovered {len(manifest)} assets / {sum(x['bytes'] for x in manifest.values())} bytes")
