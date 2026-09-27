# Generated architecture audit

- Source JS files audited: **81** (generated inline asset map excluded)
- Public `window.*` exports: **36**
- YSFlow subscribed event names: **33**
- YSFlow emitted event names: **39**
- Direct global-state references: `save`=436, `battle`=665, `selected`=122, `els`=161
- Cross-system/UI direct-state references: `save`=10, `battle`=120, `selected`=13, `els`=0
- Modules using the B4 `YSRuntime` gateway: **20**

## Duplicate public exports

None.

## Guardrail

Duplicate public exports are prohibited in canonical source. B1 removed the RC8 `KantoMap` override; any entry here is now a regression.
