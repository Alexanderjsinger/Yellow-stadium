
let save = loadSave();
let selected = Array.isArray(save.activePartyInstanceIds) ? save.activePartyInstanceIds.filter(uid => pokemonRecord(uid)).slice(0, 6) : [];
let battle = null;
let selectionLimit = 6;
let safariAggressionTimer = null;

/*
 * B4 internal runtime boundary.
 *
 * The recovered RC8 build historically exposed `save`, `battle`, `selected`
 * and `els` as shared script-scope globals.  Core battle/party/save code still
 * owns those variables while compatibility work continues, but cross-system
 * UI and mode modules must come through this gateway instead of reaching into
 * them directly.
 *
 * `save` is intentionally a live object during the compatibility phase so
 * existing subsystem-specific mutations can be absorbed incrementally. New
 * code should prefer `updateSave()` for writes and `selectedIds` for party
 * reads. The gateway itself is locked and has one owner.
 */
(() => {
  const api = {
    get save() { return save; },
    get battle() { return battle; },
    get selectedIds() { return [...selected]; },
    get selectionLimit() { return selectionLimit; },
    element(id) { return els?.[id] || document.getElementById(id); },
    updateSave(mutator, { persist = true } = {}) {
      if (typeof mutator !== "function") return undefined;
      const result = mutator(save);
      if (persist) writeSave();
      return result;
    },
    setSelected(ids) {
      selected = Array.isArray(ids)
        ? [...new Set(ids)].filter(uid => pokemonRecord(uid)).slice(0, selectionLimit)
        : [];
      return [...selected];
    },
    setSelectionLimit(limit) {
      selectionLimit = Math.max(1, Math.min(6, Number(limit) || 6));
      if (selected.length > selectionLimit) selected = selected.slice(0, selectionLimit);
      return selectionLimit;
    },
    clearFinishedBattle() {
      if (battle?.over) battle = null;
      return battle;
    },
    snapshot() { return JSON.parse(JSON.stringify(save)); },
    persist() { return writeSave(); },
  };
  Object.defineProperty(window, "YSRuntime", {
    value: Object.freeze(api),
    configurable: false,
    writable: false,
  });
})();
