from pathlib import Path
import json, subprocess

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / "manifest.json").read_text())
failures = []
checked = 0

for entry in manifest["scripts"]:
    path = ROOT / entry["path"]
    proc = subprocess.run(["node", "--check", str(path)], text=True, capture_output=True)
    checked += 1
    if proc.returncode:
        failures.append((entry["path"], proc.stderr.strip() or proc.stdout.strip()))

print(f"syntax checked: {checked} JS source files")
if failures:
    for path, err in failures:
        print(f"FAIL {path}\n{err}")
    raise SystemExit(1)
print("PASS: JavaScript syntax clean")
