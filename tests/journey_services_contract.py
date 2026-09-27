from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
src = (ROOT / "src/ui/battle-entry-mobile.js").read_text()
map_src = (ROOT / "src/journey/kanto-map.js").read_text()
ui2_src = (ROOT / "src/ui/ui2-final.js").read_text()

# The capture-phase Journey interceptor may only own the explicit Gym control.
assert "closest('.ui2-gym-action')" in src, "Journey battle interceptor must target only the Gym action"
assert "if(!e.target.closest('button'))return" not in src, "Broad map-stop button interception would steal PokéCenter/Mart clicks"

# City service controls remain independently wired to their subsystem owners.
assert "center.onclick=()=>window.PokeCenter?.open?.()" in map_src
assert "mart.onclick=()=>typeof showShop==='function'&&showShop()" in map_src
assert 'serviceButton("✚ POKÉCENTER", "ui2-center-action", () => window.PokeCenter?.open?.())' in ui2_src
assert 'serviceButton("▣ POKÉ MART", "ui2-mart-action", () => typeof showShop === "function" && showShop())' in ui2_src

# Preserve the no-party Gym behavior rather than swallowing the Build Party action.
assert "if(Runtime.selectedIds.length)startCup(index);else window.PartyTray?.open?.();" in src

print("PASS: Journey Gym capture is isolated from PokéCenter/Mart service buttons")
