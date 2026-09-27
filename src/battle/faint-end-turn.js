
async function faintAndAdvance(side) {
  const team = battle[side];
  const activeKey = side === "player" ? "pActive" : "eActive";
  const sprite = side === "player" ? els["player-sprite"] : els["enemy-sprite"];
  const fainted = team[battle[activeKey]];
  announce(`${fainted.name} fainted!`);
  sprite.classList.add("faint");
  await delay(800);
  const next = team.findIndex(mon => mon.hp > 0);
  if (next < 0) {
    endBattle(side === "enemy");
    return;
  }
  battle[activeKey] = next;
  sprite.classList.remove("faint");
  updateBattleUI();
  announce(side === "enemy" ? `The opponent sent out ${team[next].name}!` : `Go, ${team[next].name}!`);
  await delay(700);
}

async function endTurnEffects() {
  for (const mon of [activePlayer(), activeEnemy()]) {
    if (mon.hp <= 0) continue;
    if (mon.status === "BRN" || mon.status === "PSN") {
      mon.hp = Math.max(0, mon.hp - Math.max(1, Math.floor(mon.maxHp / 16)));
      announce(`${mon.name} is hurt by ${mon.status === "BRN" ? "its burn" : "poison"}!`);
      updateBattleUI();
      await delay(500);
    }
    if (mon.seeded && mon.hp > 0) {
      const drain = Math.max(1, Math.floor(mon.maxHp / 8));
      mon.hp = Math.max(0, mon.hp - drain);
      const other = mon === activePlayer() ? activeEnemy() : activePlayer();
      other.hp = Math.min(other.maxHp, other.hp + drain);
      announce(`LEECH SEED sapped ${mon.name}!`);
      updateBattleUI();
      await delay(500);
    }
    if (mon.trappedTurns > 0 && mon.hp > 0) {
      mon.hp = Math.max(0, mon.hp - Math.max(1, Math.floor(mon.maxHp / 8)));
      mon.trappedTurns -= 1;
      announce(`${mon.name} is hurt by the vortex!`);
      updateBattleUI();
      await delay(500);
    }
    if (mon.hp <= 0) {
      await faintAndAdvance(mon === activePlayer() ? "player" : "enemy");
      if (battle.over) return;
    }
  }
}

