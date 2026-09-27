from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
tokens=(ROOT/'src/styles/tokens.css').read_text()
layout=(ROOT/'src/styles/layout.css').read_text()
journey=(ROOT/'src/styles/journey.css').read_text()
shell=(ROOT/'src/ui/app-shell.js').read_text()
ui2=(ROOT/'src/ui/ui2-final.js').read_text()
entry=(ROOT/'src/ui/battle-entry-mobile.js').read_text()
for token in ['--ys-navy-950:#07294d','--ys-yellow-400:#f9d55d','--ys-cream-50:#f4f4ee','--ys-cyan-500:#1e8dd5']:
    assert token in tokens
for primitive in ['.ys-player-hud','.ys-hud-badges','.mode-nav','.screen-heading']:
    assert primitive in layout
for primitive in ['[data-ui1-panel]','.ui2-map-banner','.mode-journey']:
    assert primitive in journey
assert "playerHud.className='ys-player-hud'" in shell
assert "badgeStrip.className='ys-hud-badges'" in shell
assert '"ys-facelift-v1"' in ui2
assert 'panel.dataset.ui1Panel = "objective"' in ui2
assert "closest('.ui2-gym-action')" in entry
assert "if(!e.target.closest('button'))return" not in entry
print('PASS: UI-1 facelift uses existing owners and preserves Journey service isolation')
