# Yellow Stadium — G2 build-time CSS minification

G2 adds a minification step to the build so the readable, concern-named source from G1 doesn't have to trade off against payload size.

## What changed

- Added `tools/minify_css.js`, which parses each canonical style file with a real CSS parser (the `css` package) and re-serializes it compressed — not text/regex surgery, so `calc()`, quoted strings, and selector combinators (`.a .b` vs `.a.b`) are handled correctly regardless of what gets hand-written into these files later.
- `tools/build.py` now shells out to that script and inlines the **minified** CSS into `dist/index.html`, while `src/styles/*.css` on disk stays exactly as formatted in G1 — this only affects the build output, never what you edit.
- This is the project's first runtime dependency: added `css@3.0.0` (6 small transitive packages) to `package.json`/`package-lock.json`. Every prior phase (A2–F1) shipped with zero dependencies; CI now runs `npm ci` before `npm test` to install it.

## Size result

| | G1 (pretty, unminified) | G2 (minified) | vs. original RC8-recovery build |
|---|---|---|---|
| `dist/index.html` (raw) | 900,826 bytes | 846,705 bytes | −1.0% |
| `dist/index.html` (gzip) | 219,845 bytes | 216,419 bytes | −4.2% |

## Validation

- Full `npm test` gate passes, including the `verify` hash check (canonical hash updated in `manifest.json` for the new minified output, same convention as every prior phase).
- Re-ran the G1 visual-regression check against this build: all 10 screens plus the persistent shell, `prefers-reduced-motion: reduce` forced, compared against the **original pre-G1 pristine build** (not just G1's output) — **pixel-identical, 0 differing pixels.** Minification changed nothing anyone can see.

## Compatibility

- RC8 golden master untouched and hash-locked, as always.
- No JS, save schema, or battle-rule changes.
- Building this project from a fresh checkout now requires `npm install` (or `npm ci`) before `npm run build` / `npm test`, since `tools/minify_css.js` needs `node_modules/css`.
