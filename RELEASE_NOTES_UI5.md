# Yellow Stadium — UI-5 Refinement Preview

This preview layers three user-tested refinements onto the approved UI-4 battle facelift while leaving the underlying G2.1 gameplay runtime unchanged.

## UI-4.1 — Battle density
- Battle console is content-driven and capped at ~232–246 px on phone layouts.
- Announcer strip, move cards, PP/type metadata and command tabs are compressed.
- The arena receives substantially more vertical space for encounter cinematics.
- Four-move layouts remain a 2×2 grid; command panes become internally scrollable only when necessary.
- Battle Party rows restore Pokémon sprites and preserve HP / active / switch state.

## UI-4.2 — Mobile rewards
- Result sheet is reflowed for a single phone viewport.
- Coin / team XP summary, individual XP rows, progression reward, match recap, loot and next-action card are compacted.
- At 390×844 and 430×932 reference sizes the tested result sheet has no internal overflow (scrollHeight == clientHeight).

## UI-5 — Safari hierarchy
- Safari world/adventure map is the primary content at screen open.
- Trainer Gear is moved below the B62 habitat experience and collapsed by default.
- Navigation into Safari reasserts map-first ordering without changing Safari movement, encounters, capture or battle behavior.

## Deliberately unchanged
Attack VFX / move assets are not part of this slice. They remain the next presentation phase so layout and effects feedback stay separable.
