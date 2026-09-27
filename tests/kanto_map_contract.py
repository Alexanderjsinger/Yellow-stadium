from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
current=(ROOT/'src/journey/kanto-map.js').read_text()
legacy=(ROOT/'src/journey/kanto-map-legacy.js').read_text()
refs=[]
for p in (ROOT/'src').rglob('*.js'):
    t=p.read_text()
    if 'KantoMap' in t:
        refs.append(str(p.relative_to(ROOT)))

assert 'window.KantoMap' not in legacy
assert current.count('window.KantoMap') == 1
assert 'window.KantoMap={render,inspect,stops};' in current
assert "const stops=[['Pewter City'" in current
assert "['Indigo Plateau',10,11]" in current
assert 'window.TrainerScenes.badge' in current
assert 'window.PokeCenter?.open?.()' in current
assert "typeof showShop==='function'&&showShop()" in current
assert 'startCup(i)' in current
assert 'renderElitePanel()' in current
assert any('journey/journey.js' in p for p in refs)
assert any('bag/bag.js' in p for p in refs)
print('PASS: KantoMap has one owner and required Journey integrations remain')
