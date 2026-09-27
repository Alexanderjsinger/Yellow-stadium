# Yellow Stadium — G2.1 release candidate

G2.1 rebases the G1/G2 CSS consolidation + minification work onto the proven F1.1 gameplay baseline.

## Rebase fix

- Preserves the F1.1 Journey service click isolation: only `.ui2-gym-action` is intercepted by the Gym launcher.
- PokéCenter and Poké Mart service buttons remain independently clickable.
- Restores the F1.1 Journey service regression contract to the full test gate.

## CSS changes retained

- 41 recovered style slots remain consolidated into 14 concern-named source stylesheets.
- Readable source CSS is minified only at build time.
- No battle, save-schema, audio, asset, progression, or balance changes are introduced by G2.1.

## Validation

- Full B1→F1 + F1.1 regression gate passes from canonical source on Render.
- 81 JavaScript modules remain syntax-clean; 36 public runtime exports; zero duplicate owners.
- D1 runtime still creates exactly one AudioContext.
- E2 deploy remains 450 live assets / 13,405,715 bytes with the same asset-tree hash.
- Journey runtime click smoke: PokéCenter opens, Poké Mart opens, Gym battle starts.
- Nine representative UI states are pixel-identical to F1.1 (0 differing pixels).
- Exact canonical source build: 846,802-byte HTML.
- Canonical HTML SHA-256: `6b30a8c5ad53da1975cb5cf3a0a33fe5cc919a95682bb4b612e8c03e3c682529`.

## Promotion gate

- Networked clean install: `npm ci` installed 6 packages successfully.
- Canonical minified build: 846,802 bytes, SHA-256 `6b30a8c5ad53da1975cb5cf3a0a33fe5cc919a95682bb4b612e8c03e3c682529`.
- Full B1–F1.1 regression gate passed, including deterministic gameplay, unified audio, asset provenance/demand, and Journey service isolation.
- Independent F1.1 vs G2.1 rendered comparison: 0 differing pixels on Journey, Trainer, Safari, Pokédex, Shop, Collection, Bag, PokéCenter, and Battle reference states.
- Live HTTP check: root, asset manifest, and representative PNG asset all returned 200 from the promoted build.
