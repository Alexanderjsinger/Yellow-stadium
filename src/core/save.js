
function loadSave(imported = null) {
  const fallback = {
    version: SAVE_SCHEMA_VERSION, wins: 0, losses: 0, streak: 0, trainerStreak: 0, bestTrainerStreak: 0, coins: 300,
    xp: {}, owned: [], difficulty: "stadium", sharedExp: true, arcadeCupClears: [], arcadeCupProgress: [0,0,0], onboardingComplete: false,
    seen: [], caughtSpecies: [], cupsCompleted: 0, eliteProgress: 0, eliteCompleted: false, mewtwoDefeated: false,
    pendingEggs: [], hatchedEggs: [], activeParty: [], partyPresets: [], pokemon: [], activePartyInstanceIds: [], adventurePartyInstanceIds: [], partyPresetInstanceIds: [], introComplete: false,
    adventureBattles: 0, mewEgg: null,
    playerProfile: { first: "", middle: "", last: "", appearance: { kind: "trainer", gender: "boy", generation: 1, palette: 0 } },
    introStage: "cinematic", tourComplete: false,
    inventory: { pokeBall: 5, greatBall: 0, ultraBall: 0, superBall: 0, masterBall: 0, potion: 3, superPotion: 0, fullHeal: 0, revive: 0 }
  };
  try {
    const parsed = imported || [SAVE_KEY, SAVE_BACKUP_KEY]
      .map(key => {
        try {
          const value = JSON.parse(localStorage.getItem(key));
          return validSave(value) ? value : null;
        } catch { return null; }
      })
      .find(Boolean);
    if (!parsed) return fallback;
    const result = {
      ...fallback, ...parsed, version: SAVE_SCHEMA_VERSION,
      difficulty: DIFFICULTIES[parsed.difficulty] ? parsed.difficulty : "stadium",
      sharedExp: parsed.sharedExp !== false,
      xp: { ...(parsed.xp || {}) },
      owned: [...new Set((parsed.owned || []).filter(id => SPECIES[id]))],
      seen: [...new Set([...(parsed.seen || []), ...(parsed.owned || [])].filter(id => SPECIES[id]))],
      caughtSpecies: [...new Set([...(parsed.caughtSpecies || []), ...(parsed.owned || [])].filter(id => SPECIES[id]))],
      inventory: { ...fallback.inventory, ...(parsed.inventory || {}) }
    };
    const count = (value, defaultValue = 0) => Number.isFinite(value) ? Math.max(0, Math.floor(value)) : defaultValue;
    for (const key of ['wins','losses','streak','trainerStreak','bestTrainerStreak','coins','cupsCompleted','eliteProgress']) result[key] = count(result[key], fallback[key]);
    result.cupsCompleted = Math.min(8, result.cupsCompleted);
    result.eliteProgress = Math.min(4, result.eliteProgress);
    result.arcadeCupClears = Array.from({length:3},(_,i)=>parsed.arcadeCupClears?.[i]===true);
    result.arcadeCupProgress = Array.from({length:3},(_,i)=>Math.max(0,Math.min(4,count(parsed.arcadeCupProgress?.[i]))));
    result.xp = Object.fromEntries(Object.entries(result.xp).filter(([id]) => SPECIES[id]).map(([id, value]) => [id, count(value, expForLevel(id, 5))]));
    result.inventory = Object.fromEntries(Object.entries(result.inventory).map(([id, value]) => [id, count(value)]));
    for (const key of ['moveSets','legacyMoves']) result[key] = Object.fromEntries(Object.entries(parsed[key] && typeof parsed[key] === 'object' ? parsed[key] : {}).filter(([id, value]) => SPECIES[id] && Array.isArray(value)).map(([id, value]) => [id, value.filter(move => typeof move === 'string').slice(0, 4)]));
    result.heldItems = parsed.heldItems && typeof parsed.heldItems === 'object' && !Array.isArray(parsed.heldItems) ? parsed.heldItems : {};
    result.pokedexNotes = parsed.pokedexNotes && typeof parsed.pokedexNotes === 'object' && !Array.isArray(parsed.pokedexNotes)
      ? parsed.pokedexNotes
      : Object.fromEntries(Object.entries(parsed.pokemonNotes || {}).filter(([id]) => !result.owned.includes(id)));
    result.activeParty = Array.isArray(parsed.activeParty) ? [...new Set(parsed.activeParty.filter(id => result.owned.includes(id)))].slice(0, 6) : [];
    result.adventureBattles = count(parsed.adventureBattles, 0);
    result.mewEgg = parsed.mewEgg && typeof parsed.mewEgg === "object" ? { awarded: parsed.mewEgg.awarded === true, progress: Math.min(42, count(parsed.mewEgg.progress, 0)), hatched: parsed.mewEgg.hatched === true } : null;
    result.partyPresets = Array.isArray(parsed.partyPresets) ? parsed.partyPresets.slice(0, 3).map(team => Array.isArray(team) ? [...new Set(team.filter(id => result.owned.includes(id)))].slice(0, 6) : []) : [];
    const pendingFieldDemo = parsed.introStage === "field-demo" && parsed.introComplete !== true;
    result.introComplete = parsed.introComplete === true || (parsed.onboardingComplete === true && !pendingFieldDemo);
    // Repair saves written by the pre-UI5 tutorial flow. That flow unlocked the app before
    // the field demo was complete, which could strand a player with a persistent Mankey contract.
    if (pendingFieldDemo) result.onboardingComplete = false;
    const profile = parsed.playerProfile && typeof parsed.playerProfile === "object" ? parsed.playerProfile : {};
    const rawAppearance = profile.appearance && typeof profile.appearance === "object" ? profile.appearance : {};
    const kind = rawAppearance.kind === "pokemon" ? "pokemon" : "trainer";
    const speciesId = ["pikachu","charmander","snorlax"].includes(rawAppearance.speciesId) ? rawAppearance.speciesId : "pikachu";
    const gender = rawAppearance.gender === "girl" ? "girl" : "boy";
    const generation = Math.max(1, Math.min(5, Number(rawAppearance.generation) || 1));
    const palette = Math.max(0, Math.min(2, Number(rawAppearance.palette) || 0));
    result.playerProfile = {
      first: String(profile.first || "").slice(0, 18),
      middle: String(profile.middle || "").slice(0, 1),
      last: String(profile.last || "").slice(0, 22),
      appearance: { kind, speciesId, gender, generation, palette }
    };
    result.introStage = typeof parsed.introStage === "string" ? parsed.introStage : (result.introComplete ? "complete" : "cinematic");
    result.tourComplete = parsed.tourComplete === true;
    return reconcilePokemonRecords(result);
  } catch { return fallback; }
}

function writeSave() {
  save.version = SAVE_SCHEMA_VERSION;
  syncPokemonRecords();
  let saved = false;
  try {
    const next = JSON.stringify(save);
    const previous = localStorage.getItem(SAVE_KEY);
    let validPrevious = false;
    try { validPrevious = validSave(JSON.parse(previous)); } catch { /* Keep the recovery copy. */ }
    localStorage.setItem(SAVE_KEY, next);
    saved = localStorage.getItem(SAVE_KEY) === next;
    // An optional backup must never prevent the main save from succeeding.
    if (validPrevious && previous !== next) {
      try { localStorage.setItem(SAVE_BACKUP_KEY, previous); } catch { /* Main save is safe. */ }
    }
  } catch { /* SaveTools explains the failure and offers a portable backup. */ }
  window.SaveTools?.status(saved);
  renderRecord();
  return saved;
}

