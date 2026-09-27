# Yellow Stadium — C2 presentation recipe privatization

## Architecture
- Added a private global-lexical `YSPresentationInternals` recipe registry.
- `BattlePresentationDirector` remains the only public battle-presentation implementation API.
- Retired public `window.*` exports for AttackEffects, BattlePolish, BattleFlow, BattlePresentation, BattleChoreography, BattleEffectsV51, BattleDirectorV55, BattleCinematics, BattleAtmosphere and BattleCaptureV47.
- Retired unused presentation exports for BattleEnvironments, BattleReadout, BattleClarity, BattleRefinement, StadiumShow and V62Polish.
- Removed the obsolete v6.2 presentation-polish singleton sentinel.

## Compatibility
- Battle mechanics still call the same `BattlePresentationDirector` methods introduced in C1.
- Move choreography, camera treatment, impact punctuation, status/result flow, capture choreography, crowd presentation and audio timing remain in their existing script order.
- The immutable RC8 golden master remains unchanged.

## Validation
- C1 boundary contracts updated to the private recipe ownership model.
- Added C2 presentation privacy contracts.
- Canonical build remains deterministic.
- Architecture audit: 36 public `window.*` exports, down from the pre-C2 presentation surface, with zero duplicate exports.
- Chromium smoke: C2 director/private registry loaded, all retired presentation globals absent, and a full 3v3 trainer turn advanced from turn 1 to turn 2 with zero page/console errors.
