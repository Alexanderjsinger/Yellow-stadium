# Yellow Stadium — UI-5.2 Tutorial Contract Fix

UI-5.2 promotes the approved UI-1 through UI-5 facelift into the canonical source and fixes the tutorial field-test state machine exposed by mobile playtesting.

## Tutorial ownership fix

- `field-demo` no longer marks normal onboarding complete before the Mankey encounter resolves.
- The normal app/navigation remains locked while the field test is pending.
- Safari has a narrow tutorial-only access path so the habitat can mount without unlocking Journey/Cups/Party/Bag.
- The tutorial Mankey battle is launched deterministically after the habitat paints; the old loose 900 ms timer is gone.
- A reload during `field-demo` resumes the owned Mankey encounter instead of dropping the player back into normal play.
- Saves created by the broken pre-fix flow (`onboardingComplete=true`, `introComplete=false`, `introStage=field-demo`) are repaired on load.
- Run/retreat is blocked during the tutorial battle.
- Tutorial hint/toast DOM is cleaned up when the battle ends or another battle starts, so the Mankey contract cannot leak into later encounters.
- Completing or capturing Mankey atomically sets `onboardingComplete`, `introComplete`, `tourComplete`, and `introStage=complete`.

## UI-5 promoted into source

- Compact battle console and mobile reward layout are now canonical CSS, not a preview-only overlay.
- Battle Party sprites are owned by the battle-entry UI layer.
- Safari map-first ordering/collapsed Trainer Gear is owned by the B62 Safari layer.
- UI-5's Safari DOM writes are idempotent; the mutation loop regression is not part of the canonical implementation.
