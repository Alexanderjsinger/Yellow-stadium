# Yellow Stadium — V4 UI 2.0 RC8

## Character intro
- Professor Joke now asks the player how they would describe themselves after name entry.
- Choices: Boy / Girl / Pokémon.
- Boy/Girl routes provide five Generation I–V styled trainer models and three palette variants: Classic, Field, Night.
- Pokémon player route offers Pikachu, Charmander, or Snorlax.
- Appearance persists in the existing save schema and is applied to Journey, Safari, and trainer identity UI.

## Tutorial → Tour
- Reframed onboarding from a tutorial into Professor Joke's quick Tour.
- Tour cycles through Journey, Cups, Party, Bag, PokéCenter, and Safari concepts after starter + egg setup.
- Mobile Tour tabs keep the active step centered while moving through the sequence.

## Safari field test
- Tour ends in Safari.
- An aggressive Mankey spots the player and starts a real Safari battle.
- Player is explicitly taught that they may capture it with Bag → Poké Ball or defeat it normally.
- The intro ends through the normal post-battle result flow, then continues to Journey.

## Compatibility
- Save schema remains 9.
- Battle math and normal Safari rules are unchanged.
- Existing PokéCenter, Journey, party, Bag, and progression behavior remain intact.

## Validation
- 81 JS modules syntax-clean.
- Architecture contract: 0 errors.
- Save/state/battle contracts pass.
- Existing browser regression suite: 21/21 pass.
- RC8 intro/Tour browser suite: 12/12 pass.