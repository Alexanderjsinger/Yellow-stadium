# Yellow Stadium — E1 asset externalization

## What changed

- Extracted the RC8 `window.STADIUM_ASSETS` bundle into **806 physical image files** under `public/assets/`.
- Preserved the exact decoded bytes of every recovered asset; `public/asset-manifest.json` records per-file SHA-256, byte size and MIME type.
- Replaced the ~18.1 MB generated inline asset script with a tiny compatibility slot. Existing `assetUrl()` callers continue to work because physical `./assets/...` paths are now canonical.
- Removed duplicate data-URI copies from the Journey map HTML and environment/ball/Journey CSS.
- Marked the 3.4 MB Journey map image `loading="lazy"` + `decoding="async"`.
- Updated the build to copy deployable assets into `dist/assets/` and verify a deterministic asset-tree hash in addition to the HTML hash.
- Added `tools/extract_assets_from_golden.py`, `tools/asset_audit.py`, and an E1 asset contract.

## Size result

- Original RC8 single HTML artifact: **23,962,736 bytes**.
- E1 canonical `dist/index.html`: **851,077 bytes** — about **96.4% smaller HTML**.
- External physical image assets: **13,548,998 bytes across 806 files**.
- Complete E1 deploy (HTML + asset manifest + assets): about **14.6 MB**, substantially below the ~24 MB self-contained RC8 release while also becoming cacheable and demand-loadable.

The large reduction comes from eliminating base64 expansion and repeated embedded copies, not image-quality degradation.

## Compatibility

- RC8 golden master remains untouched and hash locked.
- Save schema remains 9.
- Asset paths used by game code remain the same `./assets/...` logical paths.
- No battle, progression, capture, AI, UI or audio rules were intentionally changed.

## Validation

- 82/82 JavaScript source slots syntax-clean.
- B1–B4, C1–C4, D1 and E1 contracts pass.
- All 806 external assets match their recovered RC8 decoded hashes.
- Canonical HTML and external asset tree are reproducible.
- Local HTTP smoke successfully served the canonical HTML, asset manifest, both large Kanto maps, Stadium arena, Pokémon sprite, item art and WebP environment with correct non-empty responses/MIME types (`reports/e1-http-smoke.json`).
- A new interactive Chromium smoke is not claimed for E1 because the headless Chromium process did not terminate reliably in this environment; the existing gameplay smoke evidence from earlier phases remains unchanged.
