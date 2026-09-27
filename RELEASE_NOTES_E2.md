# Yellow Stadium — E2 asset demand/loading optimization

## Asset reachability cleanup
- Preserved the complete 806-file RC8 recovery manifest at `golden/asset-manifest.rc8.json`.
- Reduced the live deploy tree from 806 to 450 assets.
- Removed 356 unreachable legacy assets (143,283 bytes):
  - Gen I monochrome front/back sprite sets;
  - RS duplicate sprite sets;
  - legacy 12-Pokémon front/back sprite sets;
  - unused `ui/` art;
  - unused badge sheet.
- Pruned files remain recoverable from the immutable RC8 golden HTML and its archived asset manifest.

## Demand loading
- Added private `AssetDemand` ownership in `src/presentation/assets.js`.
- Added small screen-aware preload groups for intro UI, Journey UI, Safari UI and battle UI.
- Heavy scenic art is intentionally excluded from preload groups.
- Pokémon battle sprites are warmed as battle models are created.
- Stadium arena art is warmed only immediately before a Stadium-class battle.

## Heavy startup art
- The 7.39 MB cinematic Kanto map and 1.99 MB Stadium scene are no longer assigned when the intro module initializes.
- They are assigned only when the opening cinematic actually starts.
- The 3.44 MB Journey map no longer has a normal `src` in the base template; `KantoMap.render()` assigns it when Journey is rendered.
- Returning players therefore no longer explicitly request intro-only heavyweight art during module boot.

## Validation
- 82 JavaScript source slots syntax-clean.
- B1–B4, C1–C4, D1, E1 and E2 contracts pass.
- RC8 golden hash remains unchanged.
- Canonical HTML/assets are reproducible.
- HTTP deployment smoke confirms all representative live assets serve and representative pruned assets return 404.
- Managed Chromium in this environment blocks local HTTP/file pages, so E2 browser-network verification is not claimed.
