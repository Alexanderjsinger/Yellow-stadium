
function expForLevel(id, level) {
  const n = Math.max(1, Math.min(100, level));
  const growth = String(SPECIES[id].growth).toLowerCase();
  if (growth === "slow") return Math.floor(5 * n ** 3 / 4);
  if (growth === "mediumslow") return Math.max(0, Math.floor(6 * n ** 3 / 5 - 15 * n ** 2 + 100 * n - 140));
  return n ** 3;
}

function levelFromExperience(id, experience) {
  let level = 1;
  while (level < 100 && experience >= expForLevel(id, level + 1)) level += 1;
  return level;
}

function pokemonRecord(ref, state = save) {
  if (!ref || !Array.isArray(state?.pokemon)) return null;
  return state.pokemon.find(mon => mon.uid === ref) || state.pokemon.find(mon => mon.speciesId === ref) || null;
}

function speciesIdFor(ref, state = save) {
  return pokemonRecord(ref, state)?.speciesId || ref;
}

function pokemonNameFor(ref) {
  const mon = pokemonRecord(ref);
  const id = mon?.speciesId || ref;
  return mon?.notes?.nickname || SPECIES[id]?.name || "POKÉMON";
}

function experienceFor(ref) {
  const mon = pokemonRecord(ref);
  const id = mon?.speciesId || ref;
  return mon?.xp ?? save.xp[id] ?? expForLevel(id, 5);
}

function xpProgress(ref) {
  const id = speciesIdFor(ref);
  const level = levelFor(ref);
  if (level >= 100) return { current: 0, needed: 0, percent: 100 };
  const floor = expForLevel(id, level);
  const ceiling = expForLevel(id, level + 1);
  const current = experienceFor(ref) - floor;
  return { current, needed: ceiling - floor, percent: Math.max(0, Math.min(100, current / (ceiling - floor) * 100)) };
}

function validSave(value) {
  return value && typeof value === 'object' && !Array.isArray(value) &&
    Array.isArray(value.owned) && ['seen', 'pendingEggs', 'hatchedEggs'].every(key => value[key] === undefined || Array.isArray(value[key]));
}

function nextPokemonUid(state, speciesId) {
  const used = new Set((state.pokemon || []).map(mon => mon.uid));
  let ordinal = 1;
  while (used.has(`ys-${speciesId}-${ordinal}`)) ordinal += 1;
  return `ys-${speciesId}-${ordinal}`;
}

function createPokemonRecord(state, speciesId, source = {}) {
  const notes = source.notes && typeof source.notes === "object" ? { ...source.notes } : {};
  return {
    uid: nextPokemonUid(state, speciesId),
    speciesId,
    xp: Number.isFinite(source.xp) ? Math.max(0, Math.floor(source.xp)) : expForLevel(speciesId, 5),
    moveSet: Array.isArray(source.moveSet) ? source.moveSet.filter(move => typeof move === "string").slice(0, 4) : [],
    legacyMoves: Array.isArray(source.legacyMoves) ? source.legacyMoves.filter(move => typeof move === "string") : [],
    heldItem: typeof source.heldItem === "string" ? source.heldItem : "",
    notes,
    variant: ["shiny","dark"].includes(source.variant) ? source.variant : "",
    adventureState: source.adventureState && typeof source.adventureState === "object" ? {
      hp: Number.isFinite(source.adventureState.hp) ? Math.max(0, Math.floor(source.adventureState.hp)) : null,
      status: typeof source.adventureState.status === "string" ? source.adventureState.status : null,
      sleep: Number.isFinite(source.adventureState.sleep) ? Math.max(0, Math.floor(source.adventureState.sleep)) : 0
    } : { hp: null, status: null, sleep: 0 },
    evolutionPaused: source.evolutionPaused === true,
    evolutionHistory: Array.isArray(source.evolutionHistory) ? source.evolutionHistory.filter(id => SPECIES[id]) : []
  };
}

function reconcilePokemonRecords(state) {
  const parsed = Array.isArray(state.pokemon) ? state.pokemon : [];
  const valid = parsed.filter(mon => mon && typeof mon === "object" && typeof mon.uid === "string" && SPECIES[mon.speciesId]);
  const seenUids = new Set();
  state.pokemon = valid.filter(mon => !seenUids.has(mon.uid) && seenUids.add(mon.uid)).map(mon => ({
    ...createPokemonRecord({ pokemon: [] }, mon.speciesId, mon),
    ...mon,
    uid: mon.uid,
    speciesId: mon.speciesId,
    notes: mon.notes && typeof mon.notes === "object" ? { ...mon.notes } : {}
  }));
  state.owned.forEach(speciesId => {
    if (state.pokemon.some(mon => mon.speciesId === speciesId)) return;
    const notes = state.pokemonNotes?.[speciesId] || {};
    state.pokemon.push(createPokemonRecord(state, speciesId, {
      xp: state.xp?.[speciesId],
      moveSet: state.moveSets?.[speciesId],
      legacyMoves: state.legacyMoves?.[speciesId],
      heldItem: state.heldItems?.[speciesId],
      notes,
      evolutionPaused: state.pausedEvolutions?.[speciesId],
      evolutionHistory: notes.evolutionHistory
    }));
  });
  state.pokemon = state.pokemon.filter(mon => state.owned.includes(mon.speciesId));
  const validUids = new Set(state.pokemon.map(mon => mon.uid));
  const uidFor = speciesId => state.pokemon.find(mon => mon.speciesId === speciesId)?.uid;
  const migratedParty = (state.activeParty || []).map(uidFor).filter(Boolean);
  state.activePartyInstanceIds = Array.isArray(state.activePartyInstanceIds)
    ? state.activePartyInstanceIds.filter(uid => validUids.has(uid)).slice(0, 6)
    : migratedParty.slice(0, 6);
  if (!state.activePartyInstanceIds.length) state.activePartyInstanceIds = migratedParty.slice(0, 6);
  state.adventurePartyInstanceIds = Array.isArray(state.adventurePartyInstanceIds)
    ? state.adventurePartyInstanceIds.filter(uid => validUids.has(uid)).slice(0, 6)
    : state.activePartyInstanceIds.slice(0, 6);
  if (!state.adventurePartyInstanceIds.length) state.adventurePartyInstanceIds = state.activePartyInstanceIds.slice(0, 6);
  const migratedPresets = (state.partyPresets || []).map(team => team.map(uidFor).filter(Boolean));
  state.partyPresetInstanceIds = Array.isArray(state.partyPresetInstanceIds)
    ? state.partyPresetInstanceIds.slice(0, 3).map(team => Array.isArray(team) ? team.filter(uid => validUids.has(uid)).slice(0, 6) : [])
    : migratedPresets;
  return state;
}

function syncPokemonRecords() {
  reconcilePokemonRecords(save);
  save.owned = [...new Set(save.pokemon.map(mon => mon.speciesId).filter(id => SPECIES[id]))];
  save.xp = {}; save.moveSets = {}; save.legacyMoves = {}; save.heldItems = {}; save.pokemonNotes = {}; save.pausedEvolutions = {};
  for (const id of save.owned) {
    const mon = save.pokemon.find(entry => entry.speciesId === id);
    save.xp[id] = mon.xp;
    save.moveSets[id] = [...(mon.moveSet || [])];
    save.legacyMoves[id] = [...(mon.legacyMoves || [])];
    if (mon.heldItem) save.heldItems[id] = mon.heldItem; else delete save.heldItems[id];
    save.pokemonNotes[id] = { ...(mon.notes || {}) };
    if (mon.evolutionPaused) save.pausedEvolutions[id] = true; else delete save.pausedEvolutions[id];
  }
  save.activePartyInstanceIds = selected.filter(uid => pokemonRecord(uid));
  if (selectionLimit === 6) save.adventurePartyInstanceIds = save.activePartyInstanceIds.slice(0, 6);
  save.partyPresetInstanceIds = (save.partyPresetInstanceIds || []).slice(0, 3).map(team => team.filter(uid => pokemonRecord(uid)).slice(0, 6));
  save.activeParty = save.activePartyInstanceIds.map(uid => speciesIdFor(uid));
  save.partyPresets = save.partyPresetInstanceIds.map(team => team.map(uid => speciesIdFor(uid)));
}

function transformPokemonRecord(ref, to) {
  reconcilePokemonRecords(save);
  const mon = pokemonRecord(ref);
  if (!mon) return null;
  const from = mon.speciesId;
  mon.speciesId = to;
  mon.evolutionHistory = [...new Set([...(mon.evolutionHistory || []), from])];
  return mon.uid;
}

