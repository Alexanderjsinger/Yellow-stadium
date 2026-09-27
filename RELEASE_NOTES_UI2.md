# Yellow Stadium — UI-2 Party + Bag Facelift Preview

Second controlled visual slice from Visual Design Bible v1.

## Included
- UI-1 shell and Journey remain intact.
- Party now uses the board-style stacked six-slot team panel, compact empty slots, inline Pokémon Info panel, coverage readout, and retained Box management below.
- Bag now uses compact icon category tiles, a dense item-list pattern, clear row selection, quantity readout, and a persistent item detail/action panel.
- Existing canonical Pokémon detail modal, party add/remove/swap behavior, field-item actions, inventory counts, and Bag category state are preserved.

## Deliberately unchanged
Battle, PokéCenter, Storage, Cups, Safari and Pokédex are not redesigned in UI-2.

## Safety
No battle math, capture logic, AI, progression, save schema, audio, inventory semantics, or asset ownership changed. UI-2 remains inside existing Party/Bag style and script owners.

## UI-2.1 rendered refinement

The first phone-width render pass exposed two hierarchy issues that were corrected before live testing:

- Party now uses a single integrated `YOUR PARTY` header with live party count and `TEAM ›` management action. The redundant `ACTIVE PARTY` header is suppressed, bringing the screen closer to the approved board and reclaiming vertical space.
- Bag helper copy now sits below the `BAG` header rather than above it, preserving the visual order established in Visual Design Bible v1.
- No Party or Bag gameplay semantics changed in this refinement.
