from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
party=(ROOT/'src/party/party-mobile.js').read_text()
bag=(ROOT/'src/bag/bag.js').read_text()
party_css=(ROOT/'src/styles/party.css').read_text()
bag_css=(ROOT/'src/styles/bag.css').read_text()
assert 'party-mobile-info' in party
assert 'function drawInfo(uid)' in party
assert 'UI-2 — Party vertical slice' in party_css
assert '#select-screen .party-mobile-team' in party_css
assert 'bag-detail-panel' in bag
assert 'function showDetail(id, item, tone, icon)' in bag
assert 'UI-2 — Bag vertical slice' in bag_css
assert '#bag-panel-root .bag-card.selected' in bag_css
assert 'window.BagSystem = Object.freeze' in bag

assert 'manage.textContent = "TEAM ›"' in party
assert 'bag-intro-copy' in bag
assert 'UI-2.1 — merge Party title + team summary' in party_css
assert 'UI-2.1 — keep Bag title first' in bag_css
print('PASS: UI-2 Party + Bag facelift stays inside canonical owners')
