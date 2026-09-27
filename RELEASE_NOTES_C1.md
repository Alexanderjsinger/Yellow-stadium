# Yellow Stadium — C1 Battle Presentation Consolidation

## Canonical presentation boundary

- `BattlePresentationDirector` is now the only battle-presentation service called by battle mechanics.
- Stadium battle execution routes anticipation, move choreography, hit reactions, result/status messaging, switching, fainting, capture, cleanup and battle-end presentation through the director.
- `YellowStadium.presentation.battle` exposes the same locked director for future integrations.

## Runtime patch removal

- Removed the RC8 `AttackEffects.play` method replacement. The director now executes the core → v4.4 choreography → v5.1 source-effects → v5.5 signature pipeline explicitly.
- Removed the `__YS_BATTLE_PRESENTATION_ORCHESTRATED__` sentinel.
- v4.7 capture choreography now owns `BattleCaptureV47.capture`; it no longer replaces `BattleAtmosphere.capture` at runtime.

## Audio cleanup discovered during presentation work

- Removed the unused v5.5 `AudioFX` WebAudio implementation and its second AudioContext.
- Removed the v5.6 compatibility code that reached into `BattleDirectorV55.AudioFX` to disable those methods.
- `audio-v56.js` now reads the current battle through `YSRuntime`.

## Validation

- Existing B1–B4 ownership/API contracts pass.
- New C1 contract prevents battle mechanics from reaching directly into superseded presentation generations.
- 81 non-generated JavaScript modules syntax-clean.
- Chromium smoke exercised a real 3v3 trainer battle through a complete turn (`turn 1 → turn 2`) and v4.7 capture choreography.
- Browser smoke produced zero page errors and zero console errors.
- Archived RC8 golden master remains unchanged.
