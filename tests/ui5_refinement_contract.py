from pathlib import Path
root=Path(__file__).resolve().parents[1]
battle_css=(root/'src/styles/battle.css').read_text()
reward_css=(root/'src/styles/modal-rewards.css').read_text()
safari_css=(root/'src/styles/safari.css').read_text()
battle_js=(root/'src/ui/battle-entry-mobile.js').read_text()
safari_js=(root/'src/safari/safari-b62.js').read_text()

assert 'max-height:246px' in battle_css
assert 'ui5-team-sprite' in battle_css and 'ui5-team-sprite' in battle_js
assert '#result-modal .modal-card' in reward_css and 'overflow' in reward_css
assert '#safari-screen' in safari_css or 'safari-b62' in safari_css
assert 'app.after(gear)' in safari_js
assert "gear.dataset.open!=='false'" in safari_js
assert "if(panel&&!panel.hidden)panel.hidden=true" in safari_js
print('UI5 canonical refinement contract passed')
