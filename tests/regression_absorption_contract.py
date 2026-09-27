from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
settings = (ROOT / "src/ui/settings.js").read_text()
entry = (ROOT / "src/ui/battle-entry-mobile.js").read_text()
challenge = (ROOT / "src/battle/challenge.js").read_text()
journey = (ROOT / "src/journey/journey-controller.js").read_text()
retired = (ROOT / "src/core/retired-v61-slot.js").read_text()
return_js = (ROOT / "src/battle/return.js").read_text()
interface = (ROOT / "src/ui/interface-v42.js").read_text()
pokecenter = (ROOT / "src/pokecenter/pokecenter.js").read_text()
autofill = (ROOT / "src/party/auto-fill.js").read_text()

# v5.4 regression behavior is owned by normal UI modules now.
assert not (ROOT / "src/debug/regression-v54.js").exists()
assert "YellowDebug" not in settings
assert 'byId("settings-tab")?.addEventListener("click", show)' in settings
assert 'id="reset-save-settings"' in settings
assert 'canonical.click()' in settings
assert 'settings-tab' not in return_js
assert 'shared-exp' not in return_js
assert 'reset-save-settings' not in challenge
assert 'settings-screen' not in challenge

# Safari difficulty visibility is owned by battle-entry preparation, not a nav patch.
assert "const safariReady=title.includes('SAFARI')" in entry
assert "difficultyRow.hidden=safariReady" in entry

# v6.1 JourneyParty compatibility layer is gone; JourneyController owns it.
assert not (ROOT / "src/patches/runtime-v61.js").exists()
assert "window.JourneyParty" not in journey
assert "__YS_RUNTIME_PATCH_V61__" not in retired
for required in [
    "function activePartyIds()",
    "function recordForUid(uid)",
    "function renderPartyPanel()",
    "function ensureCollectionReturn()",
    "window.JourneyController = Object.freeze",
]:
    assert required in journey, required
for public_member in ["activePartyIds", "recordForUid", "renderPartyPanel", "ensureCollectionReturn"]:
    assert public_member in journey

# Consumers now use the canonical JourneyController service.
assert "JourneyController?.activePartyIds" in interface
assert "JourneyController?.recordForUid" in interface
assert "JourneyController?.renderPartyPanel" in pokecenter
assert "JourneyController?.renderPartyPanel" in autofill

# No source module may revive the retired globals/patch sentinels.
all_js = "\n".join(p.read_text() for p in (ROOT / "src").rglob("*.js") if p.name != "assets-inline.js")
assert "window.JourneyParty" not in all_js
assert "__YS_RUNTIME_PATCH_V61__" not in all_js
assert "window.YellowDebug" not in all_js

print("PASS: v5.4/v6.1 regression patches absorbed into Settings, BattleEntryUX and JourneyController")
