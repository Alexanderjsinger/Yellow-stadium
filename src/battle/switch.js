
async function switchPlayer(index) {
  if (!battle || battle.locked || index === battle.pActive || battle.player[index].hp <= 0) return;
  if (activePlayer().trappedTurns > 0) {
    announce(`${activePlayer().name} is trapped and can't switch!`);
    return;
  }
  battle.locked = true;
  const outgoingIndex = battle.pActive;
  const outgoing = activePlayer();
  battle.pActive = index;
  if (Array.isArray(battle.slots?.player)) {
    const slot = battle.slots.player.indexOf(outgoingIndex);
    if (slot >= 0) battle.slots.player[slot] = index;
    else if (battle.slots.player.length) battle.slots.player[0] = index;
  }
  battle.participants?.add(index);
  announce(`${outgoing.name}, come back! Go, ${activePlayer().name}!`);
  updateBattleUI();
  await delay(650);
  await enemyUtilityResponse();
}

