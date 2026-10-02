
function estimateDamage(attacker, defender, move) {
  if (!move.power) return 0;
  if (move.fixed === "level") return Math.min(defender.hp, attacker.level);
  const special = move.category === "SPECIAL";
  const atk = effectiveStat(attacker, special ? "specialAttack" : "attack");
  const def = effectiveStat(defender, special ? "specialDefense" : "defense");
  const type = effectiveness(move.type, defender);
  if (type === 0) return 0;
  const stab = attacker.types.includes(move.type) ? 1.5 : 1;
  const base = Math.floor(Math.floor(Math.floor((2 * attacker.level / 5 + 2) * move.power * atk / Math.max(1, def)) / 50) + 2);
  const hits = move.multi ? (move.multi[0] + move.multi[1]) / 2 : 1;
  return Math.floor(base * stab * type * .925 * hits);
}

function scoreEnemyMove(mon, defender, option) {
  const move = option.move;
  const profile = battle.profile;
  let score = 0;
  if (move.power) {
    const expected = estimateDamage(mon, defender, move);
    score = expected / Math.max(1, defender.maxHp) * 300 * profile.damage;
    if (expected >= defender.hp) score += 190;
    if (effectiveness(move.type, defender) > 1) score += 28;
    if (move.status && canInflictStatus(defender, move.status)) score += move.chance * .3;
    if (move.flinchChance && effectiveStat(mon, "speed") > effectiveStat(defender, "speed")) score += 20;
    if (move.trap && !defender.trappedTurns) score += 24;
  } else if (move.effect === "recover" || move.effect === "rest") {
    const hpRatio = mon.hp / mon.maxHp;
    score = hpRatio < .3 ? 230 : hpRatio < .55 ? 100 : -80;
    if (move.effect === "rest" && mon.status) score += 50;
  } else if (move.effect === "sleep") {
    score = canInflictStatus(defender, "SLP") ? 118 * profile.status : -90;
  } else if (move.effect === "paralyze") {
    score = canInflictStatus(defender, "PAR") && !defender.types.includes("GROUND")
      ? (effectiveStat(defender, "speed") > effectiveStat(mon, "speed") ? 125 : 82) * profile.status
      : -90;
  } else if (move.effect === "seed") {
    score = !defender.seeded && !defender.types.includes("GRASS") ? 105 * profile.status : -90;
  } else if (move.effect === "speedUp") {
    score = mon.stages.speed < 2 && mon.hp / mon.maxHp > .45 ? 72 * profile.status : -45;
  }
  score *= move.accuracy / 100;
  score *= .92 + Math.random() * .16;
  return score;
}

function chooseEnemyMove(mon, defender) {
  const usable = mon.moveIds.map((id, i) => ({ id, i, move: MOVES[id] })).filter(x => mon.pp[x.i] > 0);
  if (!usable.length) return -1;
  if (battle.difficulty === "casual" && Math.random() < .62) return usable[Math.floor(Math.random() * usable.length)].i;
  const scored = usable.map(option => ({ ...option, score: scoreEnemyMove(mon, defender, option) }));
  scored.sort((a,b) => b.score - a.score);
  if (battle.difficulty === "stadium" && Math.random() < .14) return scored[Math.min(1, scored.length - 1)].i;
  return scored[0].i;
}

function chooseEnemySwitch(mon, defender) {
  if (battle.difficulty === "casual" || battle.aiSwitchCooldown > 0 || mon.trappedTurns > 0) return -1;
  const currentScore = matchupScore(mon, defender);
  const currentThreat = moveThreat(defender, mon) / Math.max(1, mon.hp);
  const predictedType = battle.lastPlayerMove?.type;
  const candidates = battle.enemy
    .map((candidate, index) => ({ candidate, index }))
    .filter(entry => entry.index !== battle.eActive && entry.candidate.hp > 0 && !entry.candidate.recharge)
    .map(entry => ({ ...entry, score: matchupScore(entry.candidate, defender) }))
    .sort((a, b) => b.score - a.score);
  if (!candidates.length) return -1;
  const best = candidates[0];
  const predictedDanger = predictedType ? effectiveness(predictedType, mon) : 1;
  const predictedRelief = predictedType ? effectiveness(predictedType, best.candidate) : 1;
  const needsHelp = currentThreat >= .55 || currentScore < -.12 || (predictedDanger >= 2 && predictedRelief < predictedDanger);
  const meaningfulUpgrade = best.score > currentScore + (battle.difficulty === "master" ? .12 : .28);
  if (!needsHelp || !meaningfulUpgrade) return -1;
  const chance = (battle.difficulty === "master" ? .88 : .56) * battle.profile.switching;
  return Math.random() < chance ? best.index : -1;
}

function chooseEnemyAction(mon, defender) {
  const switchIndex = chooseEnemySwitch(mon, defender);
  return switchIndex >= 0 ? { type: "switch", index: switchIndex } : { type: "move", index: chooseEnemyMove(mon, defender) };
}

async function executeEnemySwitch(index) {
  const outgoingIndex = battle.eActive;
  const outgoing = activeEnemy();
  battle.eActive = index;
  if (Array.isArray(battle.slots?.enemy)) {
    const slot = battle.slots.enemy.indexOf(outgoingIndex);
    if (slot >= 0) battle.slots.enemy[slot] = index;
    else if (battle.slots.enemy.length) battle.slots.enemy[0] = index;
  }
  battle.aiSwitchCooldown = 2;
  announce(`${battle.profile.label} withdrew ${outgoing.name}!`);
  await delay(500);
  updateBattleUI();
  announce(`The opponent sent out ${activeEnemy().name}!`);
  await delay(650);
}

