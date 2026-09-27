
function safariCatchChance(mon, ballBonus = 1) {
  const healthFactor = 1 - mon.hp / mon.maxHp;
  const statusBonus = mon.status === "SLP" || mon.status === "FRZ" ? 1.65 : mon.status ? 1.3 : 1;
  return Math.min(.95, Math.max(.06, (SPECIES[mon.id].catchRate / 255) * (.5 + healthFactor * 1.6) * statusBonus * ballBonus));
}

async function enemyUtilityResponse() {
  const enemy = activeEnemy();
  await executeMove({ actor: enemy, target: activePlayer(), index: chooseEnemyMove(enemy, activePlayer()), side: "enemy" });
  updateBattleUI();
  if (activePlayer().hp <= 0) await faintAndAdvance("player");
  if (battle.over) return;
  if (battle.mode === "trainerDuo") {
    await resolveDuoAssist();
    if (battle.over) return;
  }
  await endTurnEffects();
  if (battle.over) return;
  battle.turn += 1;
  battle.locked = false;
  updateBattleUI();
  announce("What will you do?");
}

async function useBattleItem(id) {
  if (!battle || battle.locked || battle.over || !ITEMS[id] || (save.inventory[id] || 0) <= 0) return;
  const player = activePlayer();
  if (ITEMS[id].ball && !["safari","mewtwo","legendary"].includes(battle.mode)) return;
  if (ITEMS[id].ball && PRE_EVOLUTION[activeEnemy().id] && battle.mode === "safari") {
    announce(`${activeEnemy().name} must be obtained by evolving ${SPECIES[PRE_EVOLUTION[activeEnemy().id]].name}.`);
    return;
  }
  if ((id === "potion" || id === "superPotion") && (player.hp <= 0 || player.hp >= player.maxHp)) return;
  if (id === "fullHeal" && !player.status) return;
  const fainted = battle.player.find(mon => mon.hp <= 0);
  if (id === "revive" && !fainted) return;

  window.YSFlow?.emit("battle:item:before", { id, item: ITEMS[id], battle, player });
  battle.locked = true;
  save.inventory[id] -= 1;
  writeSave();
  if (ITEMS[id].ball) {
    const wild = activeEnemy();
    announce(`You threw a ${ITEMS[id].name} at ${wild.name}!`);
    await delay(800);
    if (ITEMS[id].ball >= 99 || Math.random() < safariCatchChance(wild, ITEMS[id].ball)) {
      battle.captured = true;
      battle.caughtNew = addOwned(wild.id, wild.level);
      const caughtRecord = save.pokemon?.[save.pokemon.length - 1] || null;
      battle.caughtAutoParty = window.PartyAutoFill?.assignCaught?.(caughtRecord) === true;
      announce(`Click! ${wild.name} was caught!${battle.caughtAutoParty ? " It joined your party!" : ""}`);
      updateBattleUI();
      await delay(850);
      window.YSFlow?.emit("battle:item:after", { id, item: ITEMS[id], battle, player, captured: true });
      endBattle(true);
      return;
    }
    window.YSFlow?.emit("battle:item:after", { id, item: ITEMS[id], battle, player, captured: false });
    announce(`${wild.name} broke free!`);
    await delay(650);
    await enemyUtilityResponse();
    return;
  }
  if (id === "potion" || id === "superPotion") {
    const amount = id === "potion" ? 40 : 70;
    player.hp = Math.min(player.maxHp, player.hp + amount);
    announce(`${ITEMS[id].name} restored ${player.name}'s HP!`);
  } else if (id === "fullHeal") {
    player.status = null;
    player.sleep = 0;
    announce(`${player.name} was cured!`);
  } else if (id === "revive") {
    fainted.hp = Math.max(1, Math.floor(fainted.maxHp / 2));
    fainted.status = null;
    announce(`${fainted.name} returned to battle!`);
  }
  updateBattleUI();
  window.YSFlow?.emit("battle:item:after", { id, item: ITEMS[id], battle, player });
  await delay(650);
  await enemyUtilityResponse();
}

