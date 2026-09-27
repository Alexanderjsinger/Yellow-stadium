# Yellow Stadium — G1 CSS consolidation

G1 retires the last "version-named CSS hooks" debt called out in `docs/ARCHITECTURE.md`: the 41 numbered, unnamed style slots (`000.css`–`040.css`) recovered from RC8 are replaced with 14 concern-named files, with zero visual change.

## What changed

- Parsed all 41 recovered style files (2,497 unique selector/media-context pairs, 52 `@keyframes` blocks) in their original build order.
- Where the same selector was declared in more than one file (240 selectors, up to 5 files each — `.shell`, `.topbar`, `.nav-button`, `:root`, etc.), merged them property-by-property: for each property, the later source wins unless an earlier declaration was `!important` and the later one was not. This exactly reproduces the effective style the old 41-file cascade already produced — nothing was reinterpreted or redesigned.
- Regrouped the resulting rules into 14 files by concern instead of recovery order:
  `tokens`, `layout`, `onboarding`, `party`, `shop`, `cups`, `journey`, `safari`, `pokedex`, `bag`, `pokecenter`, `battle`, `modal-rewards`, `animations`.
- Collapsed the 41 `<style>` placeholders scattered through `src/template.html` (some inlined between unrelated `<script>` tags from the original recovery) into 14, together in `<head>`, in the same relative order so cascade behavior is unchanged.
- Regenerated `manifest.json`'s style entries (paths, placeholders, byte counts, hashes) and the canonical HTML hash. The asset tree hash is untouched — G1 touches no images.
- Updated the `style_count` contract in `tests/contracts.py` from the old behavior-lock value (41) to the new one (14), the same way each earlier phase closed its own gate.

## Why this was accepted

Rebucketing CSS can change cascade behavior when different selectors of equal specificity match the same element, so same-selector merging alone is not sufficient proof of equivalence. G1 therefore relies on both deterministic duplicate-property handling and rendered regression checks across the major game screens. The later G2.1 release audit repeated that stricter visual comparison against the F1.1 baseline and found 0 differing pixels on Journey, Trainer, Safari, Pokédex, Shop, Collection, Bag, PokéCenter, and Battle reference states.

## Validation

- Full `npm test` gate passes: verify, syntax, all architecture/presentation/audio/asset/gameplay contracts (B1–F1), and `audit`/`audit:assets`.
- **Visual regression check** (not part of the existing test suite, since none of it screenshots rendered output): captured all 10 screens (`onboarding`, `select`, `settings`, `cups`, `trainer`, `safari`, `pokedex`, `shop`, `bag`, `battle`) plus the persistent shell, before and after, with `prefers-reduced-motion: reduce` forced (the two intro-cinematic pan animations otherwise make same-selector screenshots land on different animation frames between runs). Result: **pixel-identical, 0 differing pixels, on every screen.** Without forcing reduced motion, only the moving cinematic background differed — expected animation-phase noise, not a regression; the underlying markup, layout, and UI chrome were unaffected either way.

## Compatibility

- RC8 golden master untouched and hash-locked, as always.
- Canonical HTML content changed (new hash, recorded in `manifest.json`); canonical asset tree hash unchanged.
- No JS, save schema, or battle-rule changes. Presentation-only, same as prior consolidation phases.
