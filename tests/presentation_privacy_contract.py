from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
PRESENTATION = ROOT / "src/presentation"

assets = (PRESENTATION / "assets.js").read_text()
director = (PRESENTATION / "battle-presentation-director.js").read_text()
polish62 = (PRESENTATION / "battle-decorators.js").read_text()

assert "const YSPresentationInternals = Object.create(null);" in assets
assert "const YSPresentationInstallers = Object.create(null);" in assets
assert "window.YSPresentationInternals" not in assets
assert "window.YSPresentationInstallers" not in assets
assert 'version: "C' in director, 'canonical director lost phase version marker'
assert 'Object.defineProperty(window, "BattlePresentationDirector"' in director

private_services = [
    "AttackEffects", "BattlePolish", "BattleFlow", "BattlePresentation",
    "BattleChoreography", "MoveSourceEffects", "SignatureEffects",
    "BattleCinematics", "BattleAtmosphere", "CaptureEffects",
]

all_presentation = "\n".join(p.read_text() for p in PRESENTATION.rglob("*.js"))
for name in private_services:
    assert not re.search(rf"window\.{name}\b", all_presentation), f"{name} leaked back onto window"
    assert f"YSPresentationInternals.{name}" in all_presentation, f"{name} missing from private registry"

# Historical versioned runtime service names are fully retired after absorption.
for old in ["BattleEffectsV51", "BattleDirectorV55", "BattleCaptureV47"]:
    assert old not in all_presentation, f"historical private service name remains: {old}"

# Event-driven decorators keep their listeners but no longer expose unused globals.
for name in ["BattleEnvironments", "BattleReadout", "BattleClarity", "BattleRefinement", "StadiumShow", "V62Polish"]:
    assert f"window.{name}" not in all_presentation, f"unused presentation export remains public: {name}"
assert "__YS_PRESENTATION_POLISH_V62__" not in polish62

# Director is the only public Battle* presentation implementation export.
exports = set(re.findall(r"window\.([A-Za-z_$][\w$]*)\s*=|Object\.defineProperty\(window,\s*['\"]([A-Za-z_$][\w$]*)", all_presentation))
flat = {a or b for a,b in exports}
battle_exports = sorted(x for x in flat if x.startswith("Battle"))
assert battle_exports == ["BattlePresentationDirector"], f"unexpected public battle presentation exports: {battle_exports}"

# Non-presentation modules cannot access either private registry.
for path in (ROOT / "src").rglob("*.js"):
    if "presentation" in path.parts:
        continue
    text = path.read_text()
    assert "YSPresentationInternals" not in text, f"private presentation registry leaked into {path.relative_to(ROOT)}"
    assert "YSPresentationInstallers" not in text, f"private presentation installers leaked into {path.relative_to(ROOT)}"

print("PASS: C2/C3 presentation services private behind BattlePresentationDirector")
