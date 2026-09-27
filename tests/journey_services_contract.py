from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
src=(ROOT/'src/ui/battle-entry-mobile.js').read_text()
map_src=(ROOT/'src/journey/kanto-map.js').read_text()
ui2=(ROOT/'src/ui/ui2-final.js').read_text()
assert "closest('.ui2-gym-action')" in src
assert "if(!e.target.closest('button'))return" not in src
assert "center.onclick=()=>window.PokeCenter?.open?.()" in map_src
assert "mart.onclick=()=>typeof showShop==='function'&&showShop()" in map_src
assert 'serviceButton("✚ POKÉCENTER", "ui2-center-action", () => window.PokeCenter?.open?.())' in ui2
assert 'serviceButton("▣ POKÉ MART", "ui2-mart-action", () => typeof showShop === "function" && showShop())' in ui2
print('PASS: Journey Gym capture is isolated from PokéCenter/Mart service buttons')
