
"use strict";
(() => {
  const partyIds = () => {
    const source = Array.isArray(save?.adventurePartyInstanceIds) && save.adventurePartyInstanceIds.length
      ? save.adventurePartyInstanceIds
      : Array.isArray(save?.activePartyInstanceIds) && save.activePartyInstanceIds.length
        ? save.activePartyInstanceIds
        : Array.isArray(selected) ? selected : [];
    return [...new Set(source.filter(uid => pokemonRecord(uid)))].slice(0, 6);
  };

  function assignCaught(record) {
    if (!record?.uid || !pokemonRecord(record.uid)) return false;
    const ids = partyIds();
    if (ids.includes(record.uid) || ids.length >= 6) return false;
    ids.push(record.uid);
    save.adventurePartyInstanceIds = [...ids];
    save.activePartyInstanceIds = [...ids];
    if (Array.isArray(selected) && selectionLimit === 6) selected = [...ids];
    writeSave();
    window.PartyTray?.render?.();
    window.JourneyController?.renderPartyPanel?.();
    window.YSFlow?.emit("party:autoFilled", { uid: record.uid, speciesId: record.speciesId, party: [...ids] });
    return true;
  }

  window.PartyAutoFill = Object.freeze({ assignCaught, partyIds });
})();

