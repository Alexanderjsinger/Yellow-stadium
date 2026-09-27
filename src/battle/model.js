
function createMon(ref, side, forcedLevel = null) {
  const record = side === "player" ? pokemonRecord(ref) : null;
  const id = record?.speciesId || ref;
  const base = SPECIES[id];
  const level = forcedLevel ?? (side === "player" ? levelFor(record?.uid || id) : 50);
  const stats = calculatedStats(id, level);
  const mon = {
    id, companionUid: record?.uid || null, name: record?.notes?.nickname || base.name, speciesName: base.name, types: base.types, level,
    maxHp: stats.hp, hp: stats.hp, attack: stats.attack, defense: stats.defense,
    specialAttack: stats.specialAttack, specialDefense: stats.specialDefense, speed: stats.speed,
    moveIds: base.moves, pp: base.moves.map(move => MOVES[move].pp),
    status: null, sleep: 0, seeded: false, recharge: false, trappedTurns: 0, flinched: false,
    stages: { attack: 0, defense: 0, speed: 0, specialAttack: 0, specialDefense: 0, accuracy: 0 }
  };
  window.YSFlow?.emit("battle:modelCreated", { mon, ref, side, forcedLevel, record });
  return mon;
}

function shuffle(items) {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function moveThreat(attacker, defender) {
  return Math.max(...attacker.moveIds.map(id => {
    const move = MOVES[id];
    if (!move.power) return 0;
    return estimateDamage(attacker, defender, move);
  }));
}

function matchupScore(candidate, opposing) {
  const outgoing = moveThreat(candidate, opposing) / Math.max(1, opposing.hp);
  const incoming = moveThreat(opposing, candidate) / Math.max(1, candidate.hp);
  return outgoing * 1.35 - incoming;
}

function chooseDiverseTeam(pool, count) {
  const available = shuffle(pool);
  const chosen = [];
  while (chosen.length < count && available.length) {
    available.sort((a, b) => {
      const aNew = SPECIES[a].types.filter(type => !chosen.some(id => SPECIES[id].types.includes(type))).length;
      const bNew = SPECIES[b].types.filter(type => !chosen.some(id => SPECIES[id].types.includes(type))).length;
      return bNew - aNew + (Math.random() - .5);
    });
    chosen.push(available.shift());
  }
  return chosen;
}

function chooseOpponentTeam(pool, playerTeam, difficulty, enemyLevel) {
  if (difficulty === "casual") return shuffle(pool).slice(0, 3);
  if (difficulty === "stadium") return chooseDiverseTeam(pool, 3);
  const candidates = pool.map(id => {
    const mon = createMon(id, "enemy", enemyLevel);
    const counterScore = playerTeam.reduce((sum, player) => sum + matchupScore(mon, player), 0);
    return { id, score: counterScore + Math.random() * .8 };
  }).sort((a, b) => b.score - a.score);
  const chosen = [];
  for (const candidate of candidates) {
    const repeatedTypes = SPECIES[candidate.id].types.filter(type => chosen.some(id => SPECIES[id].types.includes(type))).length;
    if (repeatedTypes === 0) chosen.push(candidate.id);
    if (chosen.length === 3) break;
  }
  for (const candidate of candidates) {
    if (chosen.length === 3) break;
    if (!chosen.includes(candidate.id)) chosen.push(candidate.id);
  }
  return chosen;
}

function chooseProfile(difficulty) {
  if (difficulty === "casual") return AI_PROFILES.rookie;
  if (difficulty === "master") return AI_PROFILES.master;
  return AI_PROFILES[shuffle(["aggressor", "tactician", "controller"])[0]];
}

