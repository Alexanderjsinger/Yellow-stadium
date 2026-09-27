# Yellow Stadium — B3 Regression Patch Absorption

## Ownership consolidation

- Removed the v5.4 regression/debug runtime module.
- `src/ui/settings.js` now owns Settings entry, Shared EXP persistence, and the Settings New Game shortcut.
- Safari ready-screen difficulty visibility is owned directly by `BattleEntryUX`.
- `JourneyController` now owns the Journey party panel, party lookup helpers, Journey hub routing, and Party → Journey return control.
- Consumers in PokéCenter, Party auto-fill, and Interface V4.2 now use `JourneyController` instead of `JourneyParty`.

## Retired compatibility surfaces

- `window.JourneyParty` removed.
- `window.YellowDebug` removed.
- `window.__YS_RUNTIME_PATCH_V61__` removed.
- `src/patches/runtime-v61.js` removed.
- The recovered script slot formerly occupied by v6.1 remains inert temporarily to preserve RC8 source ordering during compatibility consolidation.

## Validation

- Archived RC8 golden hash remains unchanged.
- Canonical B3 build is reproducible.
- 81 non-generated JS source files syntax-clean.
- Architecture/source, Kanto Map, Bag, and B3 absorption contracts pass.
- Zero duplicate public `window.*` exports.
- Browser smoke: Settings, reset routing, Journey party panel/API, and Safari difficulty behavior pass with zero runtime console errors.

## Architecture movement

Public runtime exports dropped from 54 in B2 to 51 in B3. The next phase is B4: reduce direct cross-system access to historical globals by strengthening explicit subsystem/API boundaries.
