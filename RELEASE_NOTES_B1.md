# Yellow Stadium — Architecture B1

## Kanto Map consolidation

- Retired the earlier RC8 `KantoMap` implementation from runtime execution.
- `src/journey/kanto-map.js` is now the single authoritative map owner.
- Preserved current RC8 Journey behavior: city/Gym progression, badges, map labels, Gym replay, League routing, PokéCenter/Poké Mart services, and current v6.1 hooks.
- Added a Kanto Map contract test.
- Tightened architecture contracts so duplicate public `window.*` exports are now a failure.

## Build/reference strategy

- Preserved the original RC8 HTML as an immutable golden archive.
- Canonical source is now allowed to differ byte-for-byte as dead compatibility code is retired.
- `npm run verify` checks both the archive hash and the current canonical build hash.

## Next

B2 consolidates Bag ownership and removes the need to clone/replace navigation nodes to defeat old handlers.
