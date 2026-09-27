from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
failures = []

def expect(condition, message):
    if not condition:
        failures.append(message)

pkg = json.loads((ROOT / "package.json").read_text())
fixtures = json.loads((ROOT / "tests/fixtures/gameplay-fixtures.json").read_text())
runtime = (ROOT / "tests/gameplay_regression_runtime.js").read_text()
harness = (ROOT / "tests/helpers/runtime_harness.js").read_text()
workflow = (ROOT / ".github/workflows/ci.yml").read_text()

expect(pkg.get("scripts", {}).get("test:gameplay") == "node tests/gameplay_regression_runtime.js", "deterministic gameplay test script missing")
expect("npm run test:f1" in pkg.get("scripts", {}).get("test", ""), "npm test does not include the F1 gameplay gate")
expect(isinstance(fixtures.get("rng_seed"), int), "gameplay fixture must define an integer RNG seed")
expect("Math.random = function" in harness and "__setSeed" in harness, "runtime harness does not replace RNG deterministically")

for required in [
    "testOnboardingAndSaveReload",
    "testDamageAndTurnDeterminism",
    "testJourneyGymAndCupProgression",
    "testSafariCapture",
    "testArcadeCupProgression",
    "testPokeCenterHealing",
]:
    expect(required in runtime, f"F1 gameplay regression missing {required}")

for source in [
    "src/core/save.js",
    "src/onboarding/core.js",
    "src/battle/damage-status.js",
    "src/battle/turns.js",
    "src/battle/end.js",
    "src/battle/items-capture.js",
    "src/journey/journey.js",
    "src/pokecenter/pokecenter.js",
]:
    expect(source in runtime or source in harness, f"F1 test does not exercise canonical source module {source}")

expect("npm test" in workflow, "CI must run the full npm test gate")
expect("continue-on-error" not in workflow, "CI gameplay gate may not be soft-failed")

if failures:
    print("F1 CONTRACT FAILURES")
    for failure in failures:
        print("-", failure)
    raise SystemExit(1)
print("PASS: F1 deterministic gameplay/CI contract")
