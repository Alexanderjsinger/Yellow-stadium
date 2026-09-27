# Yellow Stadium — D1 Audio Consolidation

## Unified audio ownership
- Added `src/audio/audio-manager.js` as the sole Web Audio owner.
- Music, battle SFX, status/capture cues, cries, crowd noise, low-HP alerts, UI tones, and PokéCenter chimes now share one `AudioContext`, master gain, unlock/resume policy, and mute state.
- Preserved separate music/effects/UI buses under the one master graph; the RC8 music echo remains music-only.

## Retired compatibility audio
- Removed `music-legacy.js` as an independent music engine.
- Retired `audio-v56.js`; its historical script slot is now inert.
- Removed fallback `AudioContext` creation from battle presentation, Stadium crowd, Pokémon cries, and PokéCenter.
- Removed the `YSAudioV56` public global.

## API and lifecycle
- `window.AudioManager` is the single runtime audio service.
- `YellowStadium.audio` exposes the stable audio boundary.
- Mute now consistently applies across music, SFX, crowd audio, PokéCenter cues, and spoken Stadium commentary.
- Visibility handling stops transient effects and suspends the shared context; a later user gesture resumes it.

## Guardrail
- D1 contracts fail if any canonical source file other than `audio-manager.js` creates or references `AudioContext` / `webkitAudioContext`.
