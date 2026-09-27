from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

runtime = (ROOT / "src/core/runtime-state.js").read_text()
api = (ROOT / "src/api/yellow-stadium.js").read_text()

for required in [
    'Object.defineProperty(window, "YSRuntime"',
    'get save() { return save; }',
    'get battle() { return battle; }',
    'get selectedIds() { return [...selected]; }',
    'updateSave(mutator',
    'setSelected(ids)',
    'clearFinishedBattle()',
    'element(id)',
]:
    assert required in runtime, f"YSRuntime contract missing {required}"

assert 'const Runtime = window.YSRuntime;' in api
assert 'get save() { return Runtime.save; }' in api
assert 'get selected() { return Runtime.selectedIds; }' in api
assert 'get battle() { return Runtime.battle; }' in api
assert 'snapshot: () => Runtime.snapshot()' in api

# Cross-system modules migrated in B4 must no longer reach directly into the
# historical script-scope state globals. Core battle/save/party owners retain
# direct access until their own consolidation phases.
files = []
for folder in ["journey", "safari", "pokecenter", "presentation"]:
    files.extend(sorted((ROOT / "src" / folder).glob("*.js")))
files.extend(ROOT / p for p in [
    "src/ui/settings.js",
    "src/ui/navigation.js",
    "src/ui/battle-entry-mobile.js",
    "src/ui/interface-v42.js",
    "src/ui/mobile-shell.js",
])


def code_only(text):
    out=[]; i=0; n=len(text); state="code"; quote=None
    while i<n:
        ch=text[i]; nxt=text[i+1] if i+1<n else ""
        if state=="code":
            if ch=="/" and nxt=="/": out.extend("  "); i+=2; state="line"; continue
            if ch=="/" and nxt=="*": out.extend("  "); i+=2; state="block"; continue
            if ch in ("\'", "\"", "`"):
                quote=ch; out.append(" "); i+=1; state="string"; continue
            out.append(ch); i+=1; continue
        if state=="line":
            if ch=="\n": out.append("\n"); state="code"
            else: out.append(" ")
            i+=1; continue
        if state=="block":
            if ch=="*" and nxt=="/": out.extend("  "); i+=2; state="code"
            else: out.append("\n" if ch=="\n" else " "); i+=1
            continue
        if state=="string":
            if ch=="\\":
                out.append(" "); i+=1
                if i<n: out.append(" "); i+=1
                continue
            if ch==quote:
                out.append(" "); i+=1; state="code"; continue
            out.append("\n" if ch=="\n" else " "); i+=1
    return "".join(out)

forbidden = {
    "save property access": re.compile(r"(?<![\w$.])save\s*(?:\?\.|\.)"),
    "battle property access": re.compile(r"(?<![\w$.])battle\s*(?:\?\.|\.)"),
    "selected collection access": re.compile(r"(?<![\w$.])selected\s*(?:\?\.|\.|\[)"),
    "legacy element registry access": re.compile(r"(?<![\w$.])els\s*\["),
    "legacy typeof state guard": re.compile(r"\btypeof\s+(?:save|battle|selected|els)\b"),
}

failures = []
for path in files:
    text = code_only(path.read_text())
    for label, pattern in forbidden.items():
        match = pattern.search(text)
        if match:
            line = text.count("\n", 0, match.start()) + 1
            failures.append(f"{path.relative_to(ROOT)}:{line}: {label}")

assert not failures, "B4 state-boundary regressions:\n" + "\n".join(failures)

# The migrated subsystems should visibly depend on the explicit runtime
# gateway instead of silently falling back to the old globals.
for path in [
    ROOT / "src/journey/journey-controller.js",
    ROOT / "src/safari/safari-b62.js",
    ROOT / "src/pokecenter/pokecenter.js",
    ROOT / "src/ui/settings.js",
    ROOT / "src/presentation/battle-runtime.js",
]:
    assert "window.YSRuntime" in path.read_text(), f"{path.name} is not routed through YSRuntime"

print(f"PASS: B4 API boundary enforced across {len(files)} cross-system modules")
