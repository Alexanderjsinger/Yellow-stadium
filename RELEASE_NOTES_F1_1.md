# Yellow Stadium F1.1

## Journey service click fix

- Fixed a capture-phase Journey handler that treated every button inside the selected Gym destination card as a Gym challenge.
- PokéCenter and Poké Mart buttons now reach their own handlers normally.
- Gym interception is limited to `.ui2-gym-action`.
- The Build Party path is preserved when no adventure party is selected.
- Added a regression contract so service buttons cannot be swallowed by the Gym handler again.
