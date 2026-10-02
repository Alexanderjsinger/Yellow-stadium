from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
center=(ROOT/'src/pokecenter/pokecenter.js').read_text()
center_css=(ROOT/'src/styles/pokecenter.css').read_text()
party=(ROOT/'src/party/party-mobile.js').read_text()
party_css=(ROOT/'src/styles/party.css').read_text()
interface=(ROOT/'src/ui/interface-v42.js').read_text()

assert 'pc-party-summary' in center
assert 'function renderPartySummary()' in center
assert 'pc-nurse' in center
assert 'UI-3 — PokéCenter place + healing vertical slice' in center_css
assert '.ys-facelift-v1 .pc-party-summary' in center_css

# FINAL Party contract: overview is read-only by default and hands off to Team Management.
assert 'let managementOpen = false' in party
assert 'function setManagement(open)' in party
assert 'roster.hidden = true' in party
assert 'manage.textContent = managementOpen ? "‹ PARTY" : "TEAM ›"' in party
assert 'button.hidden = !managementOpen' in party
assert 'window.PartyMobile = { arrange, add, remove, openSwap, coverage: coverageForParty, setManagement }' in party
assert 'UI-3 — Pokémon Storage vertical slice' in party_css

# Center owns only healing/service UI and routes directly to Team Management.
assert '"pokecenter-screen": { key:"center", label:"Center", nav:"pokecenter-tab", accent:"red", gear:false' in interface
assert 'querySelectorAll(".trainer-gear").forEach(node => node.remove())' in interface
assert 'window.PartyMobile?.setManagement?.(true)' in center
print('PASS: UI-3 Party overview / Team Management / PokéCenter ownership contract')
