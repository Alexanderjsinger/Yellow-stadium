
function calculateDamage(attacker, defender, move) {
  if (move.fixed === "level") return { damage: Math.min(defender.hp, attacker.level), critical: false };
  const special = move.category === "SPECIAL";
  const critRate = move.highCrit ? 1 / 8 : 1 / 24;
  const critical = Math.random() < critRate;
  const atkKey = special ? "specialAttack" : "attack";
  const defKey = special ? "specialDefense" : "defense";
  const atk = effectiveStat(attacker, atkKey);
  const def = effectiveStat(defender, defKey);
  const stab = attacker.types.includes(move.type) ? 1.5 : 1;
  const type = effectiveness(move.type, defender);
  const random = .85 + Math.random() * .15;
  const base = Math.floor(Math.floor(Math.floor((2 * attacker.level / 5 + 2) * move.power * atk / Math.max(1,def)) / 50) + 2);
  return { damage: Math.max(1, Math.floor(base * stab * type * random * (critical ? 1.5 : 1))), critical };
}

async function applyStatusMove(actor, target, move) {
  if (move.effect === "recover" || move.effect === "rest") {
    if (actor.hp === actor.maxHp) { announce("But it failed!"); await delay(550); return; }
    actor.hp = move.effect === "rest" ? actor.maxHp : Math.min(actor.maxHp, actor.hp + Math.floor(actor.maxHp / 2));
    if (move.effect === "rest") { actor.status = "SLP"; actor.sleep = 2; }
    announce(`${actor.name} restored its health!`);
  } else if (move.effect === "sleep" || move.effect === "paralyze") {
    const status = move.effect === "sleep" ? "SLP" : "PAR";
    if (!canInflictStatus(target, status) || (move.effect === "paralyze" && target.types.includes("GROUND"))) announce("But it failed!");
    else {
      inflictStatus(target, status);
      announce(statusMessage(target));
    }
  } else if (move.effect === "seed") {
    if (target.seeded || target.types.includes("GRASS")) announce("But it failed!");
    else { target.seeded = true; announce(`${target.name} was seeded!`); }
  } else if (move.effect === "speedUp") {
    actor.stages.speed = Math.min(6, actor.stages.speed + 2);
    announce(`${actor.name}'s SPEED sharply rose!`);
  }
  updateBattleUI();
  await delay(650);
}

function inflictStatus(mon, status) {
  mon.status = status;
  if (status === "SLP") mon.sleep = 1 + Math.floor(Math.random() * 3);
}

function canInflictStatus(mon, status) {
  // Stadium rules normalized TOX to poison before the legacy immunity checks.
  // Keep that exact behavior in the single engine-owned implementation.
  const normalized = status === "TOX" ? "PSN" : status;
  if (mon.status) return false;
  if ((normalized === "SLP" && mon.ability === "insomnia") ||
      (normalized === "PSN" && mon.ability === "immunity") ||
      (normalized === "PAR" && mon.ability === "limber")) return false;
  if (normalized === "PAR" && mon.types.includes("ELECTRIC")) return false;
  if (normalized === "BRN" && mon.types.includes("FIRE")) return false;
  if (normalized === "FRZ" && mon.types.includes("ICE")) return false;
  if (normalized === "PSN" && (mon.types.includes("POISON") || mon.types.includes("STEEL"))) return false;
  return true;
}

function statusMessage(mon) {
  return ({ PAR: `${mon.name} is paralyzed!`, SLP: `${mon.name} fell asleep!`, BRN: `${mon.name} was burned!`, FRZ: `${mon.name} was frozen solid!`, PSN: `${mon.name} was poisoned!` })[mon.status];
}

