# Yellow Stadium — C3 presentation absorption

## Architecture
- Absorbed ten recovered battle-presentation implementation generations into two durable private modules: `battle-runtime.js` and `move-effects.js`.
- Added a private lexical `YSPresentationInstallers` registry so the original RC8 activation/listener order can be preserved without retaining separate implementation files.
- Historical presentation slots now contain eight tiny activation shims only.
- Retired the versioned private service names `BattleEffectsV51`, `BattleDirectorV55`, and `BattleCaptureV47`; their durable internal names are `MoveSourceEffects`, `SignatureEffects`, and `CaptureEffects`.
- `BattlePresentationDirector` remains the only public battle-presentation implementation boundary and now reports version C3.

## Compatibility
- Camera, battle pacing, send-out/withdraw, move anticipation, procedural effects, source-derived choreography, signatures, hit punctuation, status/result grammar, atmosphere, fainting, and capture choreography retain their historical activation order.
- Battle mechanics and RNG are unchanged.
- The immutable RC8 golden master remains unchanged.

## Validation
- Added C3 presentation-absorption contracts.
- Updated C1/C2 boundary/privacy contracts to the absorbed architecture.
- Canonical build remains deterministic.
- Architecture audit remains at 36 public `window.*` exports with zero duplicates.
- Chromium smoke confirmed all ten absorbed services installed behind the private registries, all three retired versioned service names absent, a real trainer turn advanced from turn 1 to turn 2, and capture choreography cleaned up with zero page/console errors.
- Canonical C3 SHA-256: `f560ae2da20e2705d0af760887d8f15553da29d5cea19438cf7bb40385d87e71`.
