from pathlib import Path
from collections import defaultdict, Counter
import json, re

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / "manifest.json").read_text())
REPORTS = ROOT / "reports"
REPORTS.mkdir(exist_ok=True)

assignments = defaultdict(list)
references = defaultdict(list)
events_on = defaultdict(list)
events_emit = defaultdict(list)
direct_refs = Counter()
boundary_refs = Counter()
runtime_gateway_modules = []
module_rows = []

GLOBAL_STATE = ["save", "battle", "selected", "els"]
BOUNDARY_PREFIXES = ("src/ui/", "src/journey/", "src/safari/", "src/pokecenter/", "src/presentation/")

for entry in manifest["scripts"]:
    rel = entry["path"]
    if rel.endswith("assets-inline.js"):
        continue
    text = (ROOT / rel).read_text(encoding="utf-8")
    assigns = sorted(set(re.findall(r"window\.([A-Za-z_$][\w$]*)\s*=", text)) | set(re.findall(r"Object\.defineProperty\(window,\s*[\'\"]([A-Za-z_$][\w$]*)[\'\"]", text)))
    refs = sorted(set(re.findall(r"window\.([A-Za-z_$][\w$]*)", text)))
    ons = sorted(set(re.findall(r"(?:window\.)?YSFlow\?*\.on\(\s*['\"]([^'\"]+)", text)))
    emits = sorted(set(re.findall(r"(?:window\.)?YSFlow\?*\.emit(?:Async)?\(\s*['\"]([^'\"]+)", text)))
    for name in assigns:
        assignments[name].append(rel)
    for name in refs:
        references[name].append(rel)
    for name in ons:
        events_on[name].append(rel)
    for name in emits:
        events_emit[name].append(rel)
    counts = {name: len(re.findall(rf"(?<![\w$.]){re.escape(name)}\b", text)) for name in GLOBAL_STATE}
    direct_refs.update(counts)
    if rel.startswith(BOUNDARY_PREFIXES):
        boundary_refs.update(counts)
    if "window.YSRuntime" in text:
        runtime_gateway_modules.append(rel)
    module_rows.append({
        "path": rel,
        "chars": len(text),
        "window_exports": assigns,
        "window_refs": refs,
        "events_on": ons,
        "events_emit": emits,
        "global_state_refs": counts,
    })

duplicates = {k:v for k,v in assignments.items() if len(v) > 1}
report = {
    "build": {
        "script_count": manifest["script_count"],
        "style_count": manifest["style_count"],
        "golden_sha256": manifest["golden_sha256"],
        "canonical_sha256": manifest.get("canonical_sha256"),
        "canonical_phase": manifest.get("canonical_phase"),
    },
    "summary": {
        "source_js_files_audited": len(module_rows),
        "public_window_exports": len(assignments),
        "duplicate_window_exports": duplicates,
        "direct_global_state_refs": dict(direct_refs),
        "boundary_global_state_refs": dict(boundary_refs),
        "runtime_gateway_modules": len(runtime_gateway_modules),
        "ysflow_subscribed_events": len(events_on),
        "ysflow_emitted_events": len(events_emit),
    },
    "runtime_gateway_modules": sorted(runtime_gateway_modules),
    "assignments": dict(sorted(assignments.items())),
    "event_subscribers": dict(sorted(events_on.items())),
    "event_emitters": dict(sorted(events_emit.items())),
    "modules": module_rows,
}
(REPORTS / "architecture-audit.json").write_text(json.dumps(report, indent=2), encoding="utf-8")

lines = [
    "# Generated architecture audit",
    "",
    f"- Source JS files audited: **{len(module_rows)}** (generated inline asset map excluded)",
    f"- Public `window.*` exports: **{len(assignments)}**",
    f"- YSFlow subscribed event names: **{len(events_on)}**",
    f"- YSFlow emitted event names: **{len(events_emit)}**",
    "- Direct global-state references: " + ", ".join(f"`{k}`={v}" for k,v in direct_refs.items()),
    "- Cross-system/UI direct-state references: " + ", ".join(f"`{k}`={v}" for k,v in boundary_refs.items()),
    f"- Modules using the B4 `YSRuntime` gateway: **{len(runtime_gateway_modules)}**",
    "",
    "## Duplicate public exports",
    "",
]
if duplicates:
    for name, paths in sorted(duplicates.items()):
        lines.append(f"- `{name}`: " + ", ".join(f"`{p}`" for p in paths))
else:
    lines.append("None.")
lines += [
    "",
    "## Guardrail",
    "",
    "Duplicate public exports are prohibited in canonical source. B1 removed the RC8 `KantoMap` override; any entry here is now a regression.",
]
(REPORTS / "architecture-audit.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
print("wrote reports/architecture-audit.json")
print("wrote reports/architecture-audit.md")
print(json.dumps(report["summary"], indent=2))
