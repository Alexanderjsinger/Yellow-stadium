# Yellow Stadium — UI-1 Visual Facelift Preview

First controlled implementation slice from Visual Design Bible v1.

## Included
- Deep-navy handheld shell and revised Yellow Stadium identity treatment.
- Compact cream trainer HUD with current avatar, player name, money, wins and eight-badge progress strip.
- Console-like six-button bottom navigation with yellow selected state and cyan structural framing.
- Shared yellow-primary / navy-secondary button language and compact framed headers.
- Journey vertical slice: brighter Kanto campaign board, integrated KANTO REGION title bar, cream Adventure Recap / Party / Next Objective modules, compact party cards and city service controls.

## Deliberately unchanged
Party, Bag, PokéCenter, Storage, Battle, Cups, Safari and Pokédex retain their existing structures. They inherit only safe global shell/button/header primitives.

## Safety
- No battle, capture, AI, progression, save, audio, asset or item logic changed.
- Retains the F1.1 Gym/PokéCenter/Poké Mart click-isolation fix.
- No new runtime/style ownership slots were introduced; the 82-script / 14-style compatibility layout remains intact.
