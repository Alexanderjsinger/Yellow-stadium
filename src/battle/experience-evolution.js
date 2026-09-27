
function matchExperience(mon) {
  if (mon.level >= 100) return 0;
  const earned = battle.enemy.reduce((sum, enemy) => {
    const ratio = (2 * enemy.level + 10) ** 2.5 / (enemy.level + mon.level + 10) ** 2.5;
    return sum + Math.floor((SPECIES[enemy.id].baseExp * enemy.level / 5) * ratio + 1);
  }, 0);
  return Math.max(1, Math.floor(earned * 3 / battle.player.length));
}

function processEvolutions(gains) {
  save.growthQueue = Array.isArray(save.growthQueue) ? save.growthQueue : [];
  gains.forEach(({ id, uid }) => {
    const record = pokemonRecord(uid || id);
    if (!record || EVOLUTION_STONE_RULES[id] || record.evolutionPaused) return;
    if (EVOLUTIONS[id] && levelFor(record.uid) >= EVOLUTIONS[id][1] && !save.growthQueue.some(entry => entry.kind === "evolve" && entry.uid === record.uid)) {
      save.growthQueue.push({ kind:"evolve", uid:record.uid, id });
    }
  });
  // Evolution choices are reviewed through the growth queue so the same Pokémon instance survives.
  return [];
}

