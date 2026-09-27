from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
center=(ROOT/'src/pokecenter/pokecenter.js').read_text()
center_css=(ROOT/'src/styles/pokecenter.css').read_text()
party=(ROOT/'src/party/party-mobile.js').read_text()
party_css=(ROOT/'src/styles/party.css').read_text()
assert 'pc-party-summary' in center
assert 'function renderPartySummary()' in center
assert 'pc-nurse' in center
assert 'UI-3 — PokéCenter place + healing vertical slice' in center_css
assert '.ys-facelift-v1 .pc-party-summary' in center_css
assert 'party-storage-detail' in party
assert 'function drawStorageDetail(uid)' in party
assert 'BOX 1 · KANTO' in party
assert 'UI-3 — Pokémon Storage vertical slice' in party_css
assert '#select-screen #roster' in party_css
assert 'window.PokemonDetails?.summary(uid)' in party
print('PASS: UI-3 PokéCenter + Storage facelift stays inside canonical owners')
