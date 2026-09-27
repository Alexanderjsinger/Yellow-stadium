from pathlib import Path
root=Path(__file__).resolve().parents[1]
entry=(root/'src/ui/battle-entry-mobile.js').read_text()
css=(root/'src/styles/battle.css').read_text()
assert "team:'PARTY'" in entry
assert 'area.after(tabs)' in entry
assert 'screen.dataset.ui4Mode' in entry
assert "choice.dataset.type" in entry
for required in [
  '/* UI-4 — Battle facelift.',
  '.ys-facelift-v1.mobile-battle #battle-screen #match-type',
  '.ys-facelift-v1.mobile-battle #battle-screen .announcer',
  '.ys-facelift-v1.mobile-battle #battle-screen .move-button[data-type=grass]',
  '.ys-facelift-v1.mobile-battle #battle-screen .battle-command-tabs',
]:
  assert required in css, required
print('PASS: UI-4 battle facelift contract')
