from pathlib import Path
import json, re, hashlib

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / "manifest.json").read_text())
failures = []

def expect(condition, message):
    if not condition:
        failures.append(message)

expect(manifest["script_count"] == 82, "recovered RC8 source slots must remain stable during compatibility consolidation")
expect(manifest["style_count"] == 14, "G1 must retain the 14 consolidated concern-named style files")

paths = [e["path"] for e in manifest["scripts"]]
expect("src/core/ys-flow.js" in paths, "YSFlow event bus missing")
expect("src/api/yellow-stadium.js" in paths, "stable YellowStadium facade missing")
expect("src/core/save.js" in paths, "save system missing")
expect("src/audio/audio-manager.js" in paths, "unified AudioManager missing")
expect("src/journey/kanto-map.js" in paths, "canonical Kanto map missing")

constants = (ROOT / "src/core/constants.js").read_text()
expect('SAVE_SCHEMA_VERSION = 9' in constants, "save schema changed from RC8 schema 9")

api = (ROOT / "src/api/yellow-stadium.js").read_text()
expect('version: "V4-ui2-rc8"' in api, "public facade version changed unexpectedly")
expect('Object.defineProperty(window, "YellowStadium"' in api, "YellowStadium facade is no longer locked onto window")

flow = (ROOT / "src/core/ys-flow.js").read_text()
for symbol in ["function on", "function emit", "function emitAsync"]:
    expect(symbol in flow, f"YSFlow contract missing {symbol}")

# B1: one authoritative KantoMap owner. The recovered legacy source slot stays
# as a documented inert shim until script-slot removal is safe, but it may not
# export or mutate the runtime map.
legacy = (ROOT / "src/journey/kanto-map-legacy.js").read_text()
current = (ROOT / "src/journey/kanto-map.js").read_text()
expect("window.KantoMap" not in legacy, "legacy Kanto map regained runtime ownership")
expect(current.count("window.KantoMap") == 1, "canonical Kanto map should export exactly once")
for required in ["function render", "function inspect", "const stops=", "renderElitePanel()"]:
    expect(required in current, f"canonical Kanto map contract missing {required}")

# Cross-file public-global overrides are no longer accepted. Future migration
# shims must expose distinct names or route through YellowStadium/YSFlow.
assignments = {}
for entry in manifest["scripts"]:
    if entry["path"].endswith("assets-inline.js"):
        continue
    text = (ROOT / entry["path"]).read_text()
    names = set(re.findall(r"window\.([A-Za-z_$][\w$]*)\s*=", text))
    names |= set(re.findall(r"Object\.defineProperty\(window,\s*[\'\"]([A-Za-z_$][\w$]*)[\'\"]", text))
    for name in names:
        assignments.setdefault(name, []).append(entry["path"])
cross_file_dupes = {k: sorted(set(v)) for k,v in assignments.items() if len(set(v)) > 1}
expect(not cross_file_dupes, f"cross-file global override(s) remain: {cross_file_dupes}")

# Verify recovered/canonical source files have not silently drifted without a
# manifest update.
for entry in manifest["scripts"] + manifest["styles"]:
    raw = (ROOT / entry["path"]).read_bytes()
    actual = hashlib.sha256(raw).hexdigest()
    expect(actual == entry["sha256"], f"source hash drift: {entry['path']}")

if failures:
    print("CONTRACT FAILURES")
    for f in failures:
        print("-", f)
    raise SystemExit(1)
print("PASS: canonical architecture/source contracts")
