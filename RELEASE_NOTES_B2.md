# Yellow Stadium — Architecture B2

## Bag consolidation

- `src/bag/bag.js` is now the single authoritative owner of the full Bag screen, Bag tabs, Bag navigation binding, Poké Mart link, item cards, badge/record rendering, and `bag:rendered` lifecycle event.
- Canonical Bag markup now ships directly in `src/template.html`: Capture, Recovery, Growth, Held, and Record tabs share one `bag-panel-root`.
- `src/items/item-system.js` now owns only field-item behavior: evolution stones, Rare Candy, medicine, held-item equipping, and action eligibility. It no longer observes or decorates Bag DOM.
- `src/patches/runtime-v61.js` no longer owns Bag rendering/navigation and no longer clones/replaces navigation nodes to erase historical handlers.
- Mew egg progress moved into the canonical Growth tab instead of being injected by the progression runtime.
- Journey and Trainer Gear now open/render the Bag through `BagSystem`.
- The stable `YellowStadium` facade exposes `bag.open()` and `bag.render()` while retaining the historical `bag.show` Poké Mart alias for compatibility.

## Verification

- Added `tests/bag_contract.py` to enforce single Bag ownership and prevent the old mutation-observer/node-cloning patterns from returning.
- Existing save schema and battle/item mechanics are unchanged.

## Next

B3 absorbs the remaining v5.4/v6.1 regression fixes into their owning modules and retires the compatibility patch wherever equivalent contracts exist.
