from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
bag = (ROOT / "src/bag/bag.js").read_text()
items = (ROOT / "src/items/item-system.js").read_text()
retired = (ROOT / "src/core/retired-v61-slot.js").read_text()
journey = (ROOT / "src/journey/journey-controller.js").read_text()
interface = (ROOT / "src/ui/interface-v42.js").read_text()
adventure = (ROOT / "src/progression/adventure-v58.js").read_text()
template = (ROOT / "src/template.html").read_text()

assert bag.count("window.BagSystem") == 1
for required in [
    "function open(event)",
    "function render()",
    "function setTab(key)",
    "function makeItemCard",
    "function renderRecord",
    "function appendMewEgg",
    'window.YSFlow?.emit("bag:rendered"',
]:
    assert required in bag, f"canonical Bag contract missing {required}"

# Static source owns the five canonical tabs and single content root.
for key in ["balls", "healing", "evo", "held", "record"]:
    assert f'data-bag-tab="{key}"' in template
assert template.count('id="bag-panel-root"') == 1
assert 'id="bag-items"' not in template
assert 'id="bag-badges"' not in template

# ItemSystem owns field actions only; it may not watch, render, or bind Bag DOM.
assert "MutationObserver" not in items
assert "bag-tab" not in items
assert "bag-panel-root" not in items
assert "actionFor" in items
assert "window.ItemSystem=Object.freeze" in items

# v6.1 is no longer allowed to supersede Bag/navigation handlers by cloning DOM.
for symbol in ["replaceNode", "BAG_DEFS", "renderPatchedBag", "openPatchedBag", "ensureBagScreen"]:
    assert symbol not in retired, f"retired v6.1 slot still owns Bag concern {symbol}"

assert "window.BagSystem?.init?.()" in journey
assert "window.BagSystem?.render?.()" in journey
assert "window.BagSystem?.open?.()" in interface

# Progression exposes Mew egg state; it no longer decorates Bag DOM itself.
assert 'getElementById("bag-items")' not in adventure
assert "MutationObserver(scheduleEggDecoration)" not in adventure

# Exactly one module owns the public Bag service.
owners=[]
for p in (ROOT / "src").rglob("*.js"):
    if re.search(r"window\.BagSystem\s*=", p.read_text()):
        owners.append(str(p.relative_to(ROOT)))
assert owners == ["src/bag/bag.js"], owners

print("PASS: Bag has one screen/navigation owner; ItemSystem owns field actions only")
