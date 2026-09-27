
async function resolveDuoAssist() {
  let playerPartner = duoPartner("player");
  let enemyPartner = duoPartner("enemy");
  if (!playerPartner || !enemyPartner || battle.over) return;
  const actions = effectiveStat(playerPartner, "speed") >= effectiveStat(enemyPartner, "speed")
    ? [[playerPartner, enemyPartner, "player"], [enemyPartner, playerPartner, "enemy"]]
    : [[enemyPartner, playerPartner, "enemy"], [playerPartner, enemyPartner, "player"]];
  for (const [actor, target, side] of actions) {
    if (actor.hp <= 0 || target.hp <= 0 || battle.over) continue;
    announce(`${actor.name} moved in from the duo slot!`);
    await delay(350);
    await executeMove({ actor, target, index: chooseEnemyMove(actor, target), side });
    if (target.hp <= 0) {
      announce(`${target.name} fainted!`);
      await delay(600);
      if (battle[side === "player" ? "enemy" : "player"].every(mon => mon.hp <= 0)) {
        endBattle(side === "player");
        return;
      }
      updateBattleUI();
    }
  }
}

function movePriority(mon, index) {
  return index < 0 ? 0 : (MOVES[mon.moveIds[index]].priority || 0);
}

async function takeTurn(playerMoveIndex) {
  if (!battle || battle.locked || battle.over) return;
  battle.locked = true;
  updateBattleUI();
  const p = activePlayer();
  const e = activeEnemy();
  battle.actedThisTurn = [];
  p.flinched = false;
  e.flinched = false;
  const enemyDecision = chooseEnemyAction(e, p);
  const enemyMoveIndex = enemyDecision.type === "move" ? enemyDecision.index : -1;
  const playerAction = { type: "move", actor: p, index: playerMoveIndex, side: "player" };
  const enemyAction = enemyDecision.type === "switch"
    ? { type: "switch", index: enemyDecision.index, side: "enemy" }
    : { type: "move", actor: e, index: enemyMoveIndex, side: "enemy" };
  const pPriority = movePriority(p, playerMoveIndex);
  const ePriority = movePriority(e, enemyMoveIndex);
  const actions = enemyDecision.type === "switch" ? [enemyAction, playerAction]
    : pPriority !== ePriority
      ? (pPriority > ePriority ? [playerAction, enemyAction] : [enemyAction, playerAction])
      : (effectiveStat(p,"speed") >= effectiveStat(e,"speed") ? [playerAction, enemyAction] : [enemyAction, playerAction]);

  for (const action of actions) {
    if (action.type === "switch") {
      await executeEnemySwitch(action.index);
      continue;
    }
    const target = action.side === "player" ? activeEnemy() : activePlayer();
    if (action.actor.hp <= 0 || target.hp <= 0 || battle.over) continue;
    await executeMove({ ...action, target });
    battle.actedThisTurn.push(action.side);
    updateBattleUI();
    if (target.hp <= 0) {
      await faintAndAdvance(action.side === "player" ? "enemy" : "player");
      if (battle.over) return;
    }
  }
  if (battle.mode === "trainerDuo") {
    await resolveDuoAssist();
    if (battle.over) return;
  }
  await endTurnEffects();
  if (battle.over) return;
  battle.aiSwitchCooldown = Math.max(0, battle.aiSwitchCooldown - 1);
  battle.turn += 1;
  battle.locked = false;
  updateBattleUI();
  window.BattlePresentationDirector?.ready(); announce("What will you do?");
}

async function executeMove({ actor, target, index, side }) {
  if (actor.flinched) {
    actor.flinched = false;
    announce(`${actor.name} flinched and couldn't move!`);
    await delay(700);
    return;
  }
  if (actor.recharge) {
    actor.recharge = false;
    announce(`${actor.name} must recharge!`);
    await delay(700);
    return;
  }
  if (actor.status === "SLP") {
    actor.sleep -= 1;
    if (actor.sleep > 0) {
      announce(`${actor.name} is fast asleep.`);
      await delay(700);
      return;
    }
    actor.status = null;
    announce(`${actor.name} woke up!`);
    updateBattleUI();
    await delay(550);
  }
  if (actor.status === "FRZ") {
    if (Math.random() < .2) {
      actor.status = null;
      announce(`${actor.name} thawed out!`);
      updateBattleUI();
      await delay(550);
    } else {
      announce(`${actor.name} is frozen solid!`);
      await delay(700);
      return;
    }
  }
  if (actor.status === "PAR" && Math.random() < .25) {
    announce(`${actor.name} is fully paralyzed!`);
    await delay(700);
    return;
  }
  if (index < 0 || actor.pp[index] <= 0) return;
  const move = MOVES[actor.moveIds[index]];
  if (side === "player") battle.lastPlayerMove = move;
  actor.pp[index] -= 1;
  announce(`${actor.name} used ${move.name}!`);
  animateAttack(side);
  await delay(430);

  const accuracy = move.accuracy * stageMultiplier(actor.stages.accuracy || 0);
  if (Math.random() * 100 >= accuracy) {
    announce(`${actor.name}'s attack missed!`);
    await delay(650);
    return;
  }

  if (!move.power) {
    await applyStatusMove(actor, target, move);
    return;
  }

  const effect = effectiveness(move.type, target);
  if (effect === 0 && !move.fixed) {
    announce(`It doesn't affect ${target.name}…`);
    await delay(650);
    return;
  }
  const hits = move.multi ? move.multi[0] + Math.floor(Math.random() * (move.multi[1] - move.multi[0] + 1)) : 1;
  let total = 0;
  let critical = false;
  for (let hit = 0; hit < hits && target.hp > 0; hit++) {
    const result = calculateDamage(actor, target, move);
    total += result.damage;
    critical ||= result.critical;
    target.hp = Math.max(0, target.hp - result.damage);
  }
  animateHit(side === "player" ? "enemy" : "player");
  updateBattleUI();
  await delay(450);

  if (critical) { announce("A critical hit!"); await delay(450); }
  if (effect > 1) { announce("It's super effective!"); await delay(500); }
  else if (effect > 0 && effect < 1) { announce("It's not very effective…"); await delay(500); }
  if (hits > 1) { announce(`Hit ${hits} times for ${total} damage!`); await delay(500); }

  if (target.hp > 0 && move.status && canInflictStatus(target, move.status) && Math.random() * 100 < move.chance) {
    inflictStatus(target, move.status);
    announce(statusMessage(target));
    await delay(550);
  }
  if (target.hp > 0 && move.effect === "specialDown" && Math.random() * 100 < move.chance) {
    target.stages.specialDefense = Math.max(-6, target.stages.specialDefense - 1);
    announce(`${target.name}'s SP. DEF fell!`);
    await delay(500);
  }
  const targetSide = side === "player" ? "enemy" : "player";
  if (target.hp > 0 && move.flinchChance && !battle.actedThisTurn.includes(targetSide) && Math.random() * 100 < move.flinchChance) {
    target.flinched = true;
    announce(`${target.name} flinched!`);
    await delay(450);
  }
  if (target.hp > 0 && move.trap && !target.trappedTurns) {
    target.trappedTurns = 4 + Math.floor(Math.random() * 2);
    announce(`${target.name} was trapped in the vortex!`);
    await delay(500);
  }
  if (move.effect === "recharge") actor.recharge = true;
}

