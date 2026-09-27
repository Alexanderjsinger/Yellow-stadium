# Generated architecture audit

- Source JS files audited: **81** (generated inline asset map excluded)
- Public `window.*` exports: **36**
- YSFlow subscribed event names: **32**
- YSFlow emitted event names: **39**
- Direct global-state references: `save`=432, `battle`=658, `selected`=112, `els`=160
- Cross-system/UI direct-state references: `save`=10, `battle`=119, `selected`=11, `els`=0
- Modules using the B4 `YSRuntime` gateway: **20**

## Duplicate public exports

None.

## Guardrail

Duplicate public exports are prohibited in canonical source. B1 removed the RC8 `KantoMap` override; any entry here is now a regression.
