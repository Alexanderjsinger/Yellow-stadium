# Yellow Stadium — canonical source

This tree was mechanically recovered from the last known RC8 deployment artifact and is being consolidated into maintainable canonical source without intentionally changing game behavior.

## Reference strategy

`golden/index.rc8.html` is the immutable original RC8 release artifact. It remains permanently hash-locked at:

`f13a9c4e7f16aa85a64954cf14b0502c341c2cfca3258c4196162c8d42a0bb0c`

Canonical source is allowed to differ byte-for-byte as shadowed/dead compatibility code is retired. Each consolidation phase has its own reproducible build hash in `manifest.json`.

```bash
npm run verify
```

Verification checks both the untouched RC8 archive and the current canonical build.

## Current phase

**G2.1 — CSS consolidation/minification rebased on F1.1 — PRIMARY**

G2.1 keeps the proven F1.1 gameplay/runtime baseline, including the Journey PokéCenter/Poké Mart click-isolation fix, while consolidating the recovered CSS surface from 41 historical style slots into 14 concern-named source stylesheets. Readable source CSS is minified only during the canonical build with the pinned `css@3.0.0` parser/stringifier.

Independent validation covers the full B1→F1 regression gate plus the F1.1 Journey-service contract. Nine representative rendered states (Journey, Cup/Trainer, Safari, Pokédex, Shop, Collection, Bag, PokéCenter and active battle) were pixel-identical to F1.1 before minification; the exact build-time minifier path and full source test gate also pass on the primary deployment.

Primary canonical HTML SHA-256:

`6b30a8c5ad53da1975cb5cf3a0a33fe5cc919a95682bb4b612e8c03e3c682529`

## Development checks

```bash
npm test
```

This performs:

- archived RC8 integrity verification;
- canonical build reproducibility verification;
- JS syntax checks across recovered source;
- architecture/source contracts;
- Kanto Map ownership/integration contracts;
- Bag ownership/action contracts;
- B3 regression-absorption contracts;
- B4 API-boundary contracts;
- C1 battle-presentation boundary contracts;
- C2 presentation-privacy contracts;
- C3 presentation-absorption contracts;
- C4 presentation-decorator contracts;
- D1 unified-audio ownership contracts;
- E1 external-asset provenance/integrity contracts;
- E2 reachability, pruning and demand-loading contracts;
- F1 deterministic gameplay + CI contracts;
- F1.1 Journey Gym/Center/Mart click-isolation contract;
- G2 build-time CSS parser/minification through the pinned dependency;
- seeded onboarding/save, battle, Journey/Gym, Safari, Cup and PokéCenter runtime regressions;
- architecture + asset inventory generation.

Latest asset inventory is written to `reports/asset-inventory.json` / `.md`. F1 gameplay evidence is written to `reports/f1-gameplay-regression.json`. E2 reachability/preload evidence is in `reports/e2-asset-demand.json`, and HTTP deployment-path smoke evidence is in `reports/e2-http-smoke.json`. D1 audio runtime evidence remains in `reports/d1-audio-runtime-smoke.json`.

## Source layout

- `src/core/` — lifecycle, save, runtime state, progression helpers and temporary inert recovered slots
- `src/data/` — species/move/evolution data
- `src/battle/` — battle mechanics, AI and campaign challenge rules
- `src/presentation/` — battle visuals/choreography/readouts
- `src/audio/` — unified AudioManager plus inert historical compatibility slot
- `src/journey/`, `src/safari/`, `src/cups/` — game modes/progression
- `src/party/`, `src/items/`, `src/pokecenter/` — supporting game systems
- `src/ui/` — application shell, Settings and interface layers
- `src/api/yellow-stadium.js` — stable facade for future development
- `public/assets/` — live demand-loadable image assets
- `public/asset-manifest.json` — live deploy asset byte/hash inventory
- `public/asset-groups.json` — small screen-aware preload groups
- `golden/asset-manifest.rc8.json` — complete 806-asset recovery inventory
- `src/generated/assets-inline.js` — tiny compatibility slot; no longer contains image payloads

See `docs/ARCHITECTURE.md` and `docs/CONSOLIDATION_PLAN.md` before adding features.
