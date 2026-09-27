# Yellow Stadium — F1 deterministic regression + CI hardening

F1 converts the architecture safety net into repeatable gameplay regression gates before feature development resumes.

## Deterministic gameplay harness

- Added a dependency-free Node `vm` runtime harness using the real canonical source modules.
- All randomized gameplay scenarios run through a seeded PRNG that can be reset inside a test.
- Added fixed regression fixtures under `tests/fixtures/gameplay-fixtures.json`.
- Gameplay evidence is emitted to `reports/f1-gameplay-regression.json`.

## Locked gameplay flows

The regression suite now executes and asserts:

1. New-game starter selection, both egg hatches, onboarding completion and browser save/reload integrity.
2. Seeded battle damage plus a complete deterministic player/enemy turn, including PP, HP, turn and lock state.
3. Journey -> Gym boss launch configuration and badge/coin/win progression after victory.
4. Safari Master Ball capture, inventory consumption and caught-Pokémon persistence.
5. Arcade Poké Cup boss completion, progress reset and first-clear Focus Band reward.
6. PokéCenter damaged-party detection plus full HP/status/sleep restoration.

The reference seed is `1592594996`.

## CI

- GitHub Actions now runs the complete `npm test` gate rather than only the earlier integrity subset.
- F1 contract checks ensure required gameplay flows remain present and deterministic.
- CI uploads `reports/` as regression evidence on every run.
- Gameplay failures are hard failures; there is no `continue-on-error` path.

## Behavior

No production source or game balance changed in F1. The E2 canonical HTML and external asset tree remain byte-identical to the previous release. F1 adds tests, fixtures, CI gates and documentation only.
