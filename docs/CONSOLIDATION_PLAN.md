# Consolidation plan after RC8 recovery

## A2 — canonicalize recovered source — COMPLETE

RC8 was recovered into normal source files with a reproducible build, syntax checks, architecture contracts, CI, and an immutable archived golden master.

## B — remove shadowed compatibility code — COMPLETE

### B1 — Kanto Map ownership — COMPLETE

- `src/journey/kanto-map.js` is now the sole runtime owner of `window.KantoMap`.
- The earlier RC8 Kanto implementation was retired from runtime execution.
- Its recovered script slot remains as an inert documented shim for now so source ordering stays stable during compatibility work.
- Architecture contracts reject all duplicate `window.*` exports.
- Journey, Gym replay, PokéCenter/Poké Mart services, League routing, badges, map labels, and replay hooks continue to target the canonical implementation.

### B2 — Bag ownership — COMPLETE

- `src/bag/bag.js` owns the Bag screen, tabs, rendering, navigation binding and record view.
- `src/items/item-system.js` owns field-item actions only.
- The former v6.1 layer no longer renders/opens the Bag or clones navigation nodes.
- Mew egg Bag presentation is owned by the Growth tab instead of progression-side DOM decoration.
- Journey, Trainer Gear and the public facade route through `BagSystem`.

### B3 — regression patch absorption — COMPLETE

- The v5.4 regression/debug module has been removed.
- Settings entry, Shared EXP and the Settings reset shortcut are owned by `src/ui/settings.js`.
- Safari ready-screen difficulty visibility is owned by `src/ui/battle-entry-mobile.js`.
- Journey party/hub behavior from v6.1 is owned by `src/journey/journey-controller.js`.
- `window.JourneyParty`, `window.YellowDebug`, and `window.__YS_RUNTIME_PATCH_V61__` are gone.
- The recovered v6.1 script position remains as an inert core slot only until source-slot compaction is safe.

### B4 — API boundary — COMPLETE

- Added locked internal `YSRuntime` gateway in the core runtime-state slot.
- Journey, Kanto Map, Safari, PokéCenter, Settings/navigation, trainer-gear/mobile UI, and battle presentation now route shared runtime state through the gateway.
- `YellowStadium.state` delegates through the same boundary.
- Selected-party reads are defensive copies; common save writes use `updateSave()`.
- Added a regression contract that prevents migrated modules from returning to direct `save`, `battle`, `selected`, or `els` property access.
- Full-source direct historical-global references fell by 300 from the B3 baseline.

## C — battle presentation consolidation — COMPLETE

### C1 — engine-facing presentation boundary — COMPLETE

- `BattlePresentationDirector` is the only presentation service called by battle mechanics.
- Removed the RC8 runtime replacement of `AttackEffects.play`; the director invokes the existing recipe chain explicitly.
- `BattlePolish`, `BattleFlow`, `BattlePresentation`, `BattleCinematics`, `AttackEffects`, v4.4 choreography, v5.1 source effects, and v5.5 signatures are subordinate services/recipes rather than competing mechanical entry points.
- Removed the abandoned v5.5 `AudioFX`/AudioContext implementation and the v5.6 runtime code that disabled it.
- v4.7 capture choreography now has one owner (`BattleCaptureV47`) instead of mutating `BattleAtmosphere.capture`.
- The stable `YellowStadium.presentation.battle` facade exposes the canonical director.
- Browser smoke covers a real trainer turn through the staged move pipeline plus capture choreography with zero runtime console/page errors.

### C2 — recipe privatization — COMPLETE

**C2 complete:** subordinate battle-presentation generations now live behind the private `YSPresentationInternals` registry and no longer publish individual `window.*` APIs. `BattlePresentationDirector` remains the only public battle-presentation boundary.

### C3 — presentation absorption — COMPLETE

- Absorbed ten recovered battle-presentation implementation files into two durable private runtimes: `battle-runtime.js` and `move-effects.js`.
- Preserved RC8 activation/listener ordering through eight tiny declarative activation shims rather than carrying eight additional implementation modules.
- Retired versioned internal ownership names `BattleEffectsV51`, `BattleDirectorV55`, and `BattleCaptureV47` in favor of `MoveSourceEffects`, `SignatureEffects`, and `CaptureEffects`.
- `BattlePresentationDirector` remains the only public presentation implementation boundary.

The staged grammar remains:

`intro -> anticipation -> move -> impact -> result/status -> faint/capture -> cleanup`

### C4 — presentation decorators — COMPLETE

- Absorbed Stadium broadcast/crowd, battle clarity, environments, readout, refinement, and v6.2 presentation polish into `src/presentation/battle-decorators.js`.
- Preserved their historical listener-registration positions with five tiny activation shims and the original StadiumShow activation point.
- Removed the six superseded standalone implementation files.
- Battle clarity now uses `BattlePresentationDirector` for timing rather than reaching into the private BattlePolish implementation.
- Decorators remain event-driven observers and do not own mechanics.

Mechanics remain in `src/battle/`.

## D — audio consolidation

Create one `AudioManager` owning one AudioContext/master gain, unlock/resume/visibility, music, combat cues, UI/crowd/PokéCenter cues, and mute/preferences.

## E — asset externalization and modern build

### E1 — physical asset extraction — COMPLETE

- Extracted all 806 recovered image assets into `public/assets/` with byte/hash manifest.
- Removed the ~18.1 MB base64 asset map and duplicate embedded Journey/environment/item art.
- Build now emits `dist/index.html` plus a deterministic external asset tree.
- Canonical HTML fell to ~832 KB; no image quality was changed.

### E2 — demand/loading optimization — NEXT

- Audit asset reachability and remove only assets proven unused by canonical runtime/tests.
- Define small screen-aware preload groups.
- Keep large Journey/Stadium/environment art out of initial startup unless immediately needed.
- Add browser network assertions once the test runner reliably supports local HTTP pages.

## F — deterministic regression suite

Add seeded battle RNG and browser journeys for onboarding, save/reload, Gym, Safari capture, Cup, PokéCenter, party editing, and mobile navigation.


## D1 — Audio consolidation — COMPLETE

- One `AudioManager` owns Web Audio lifecycle and all generated playback.
- Legacy music/audio contexts are retired.
- Battle, crowd, cries and PokéCenter route through the shared service.
- D1 contract prevents future secondary `AudioContext` owners.

## E2 — complete

- Removed unreachable legacy/duplicate asset families from the deploy.
- Added private screen-aware asset demand/preload coordination.
- Deferred cinematic and Journey heavyweight art until its owning screen renders.
- Preserved complete RC8 asset provenance in the golden archive.

## Next: Phase F

Promote the current contract suite into deployment-grade regression coverage: deterministic battle fixtures, save/reload migration paths, onboarding/Tour, Journey → Gym, Safari capture, PokéCenter, Cup progression, and browser/deployment gates.

## G1 — CSS consolidation — COMPLETE

- Replaced the 41 numbered, unnamed `src/styles/NNN.css` recovery slots with 14 concern-named files.
- Merged 240 same-selector duplicates (up to 5 files each) property-by-property, replicating the original cascade's effective style exactly rather than redesigning anything.
- Collapsed the 41 `<style>` placeholders scattered through `src/template.html` into 14, together in `<head>`.
- `style_count` contract updated from 41 (behavior-lock) to 14.
- Verified with a pixel-diff of all 10 screens plus the persistent shell, before and after, under forced `prefers-reduced-motion: reduce`: 0 differing pixels. See `RELEASE_NOTES_G1.md`.
- Sets up the codebase for a UI/UX design pass: each screen's styles now live in one findable file instead of being smeared across ~5 numbered files in cascade order.

## G2 — build-time CSS minification — COMPLETE

- `tools/build.py` now minifies style blocks at build time via `tools/minify_css.js` (parses with the `css` package, re-serializes compressed); `src/styles/*.css` source stays fully readable.
- First runtime dependency in the project (`css@3.0.0`, 6 small transitive packages). CI now runs `npm ci` before `npm test`.
- `dist/index.html`: −1.0% raw, −4.2% gzip'd vs. the pre-G1 original build.
- Re-verified pixel-identical (0 differing pixels, `prefers-reduced-motion: reduce`) against the original pre-G1 build across all 10 screens. See `RELEASE_NOTES_G2.md`.
