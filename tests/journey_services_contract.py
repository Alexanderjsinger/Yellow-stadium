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

shop=(ROOT/'src/shop/shop.js').read_text()
template=(ROOT/'src/template.html').read_text()
shop_css=(ROOT/'src/styles/shop.css').read_text()
assert 'const SHOP_SELL_RATIO = .5' in shop
assert 'CONFIRM PURCHASE' in shop and 'CONFIRM SALE' in shop
assert 'function sellItem(id, quantity = 1)' in shop
assert 'Math.floor(Number(item?.price || 0) * SHOP_SELL_RATIO)' in shop
assert 'data-shop-mode="buy"' in shop and 'data-shop-mode="sell"' in shop
assert '<b id="shop-coins" hidden>0</b>' in template
shop_block=template.split('<section id="shop-screen"',1)[1].split('</section>',1)[0]
assert 'screen-heading' not in shop_block, 'legacy Mart heading regained screen ownership'
assert 'FINAL Poké Mart — one renderer owns Buy + Sell.' in shop_css
print('PASS: final Poké Mart Buy/Sell owner contract')
