# Yellow Stadium — B4 API Boundary Consolidation

B4 continues the RC8 architectural stabilization without intentionally changing gameplay, balance, save schema, progression, or presentation timing.

## Internal runtime boundary

- Added locked `window.YSRuntime` as the single compatibility gateway around the recovered script-scope runtime state.
- `YSRuntime` owns cross-system access to the live save, current battle, selected party IDs, legacy element registry, persistence, selection updates, and finished-battle cleanup.
- `selectedIds` returns a defensive copy so cross-system readers cannot mutate the selected-party array accidentally.
- Save writes can now route through `updateSave()` rather than requiring unrelated UI/mode modules to call the core save writer directly.

## Migrated subsystems

Journey, Kanto Map, Safari, PokéCenter, Settings, navigation, battle-entry UI, trainer-gear UI, mobile reward UI, and the battle presentation layers now read shared runtime state through `YSRuntime` instead of directly reaching into historical `save`, `battle`, `selected`, and `els` globals.

The stable `window.YellowStadium` facade now delegates state reads/writes to `YSRuntime` rather than exposing the recovered globals itself.

## Architecture impact

Compared with the B3 audit, direct global-state references across the full recovered source fell from:

- `save`: 566 → 432
- `battle`: 754 → 651
- `selected`: 149 → 112
- `els`: 188 → 162

That removes **300 direct historical-global references** while leaving core battle/save/party owners intact for later focused consolidation.

B4 also adds a contract preventing migrated cross-system modules from regressing to direct property access on those globals.

## Validation

- JavaScript syntax clean across all 81 non-generated source modules.
- Existing B1/B2/B3 architecture contracts retained.
- New B4 API-boundary contract passes across 31 cross-system modules.
- Chromium smoke validation covers the locked runtime gateway, stable facade, Journey party, Safari, PokéCenter, Bag presence, and a live trainer battle/presentation path with no page or console errors.
- Save schema remains 9.
- Immutable RC8 golden master remains unchanged.
