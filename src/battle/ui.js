
function updateBattleUI() {
  if (!battle) return;
  window.YSFlow?.emit("battle:beforeUI", { battle });
  const player = activePlayer();
  const enemy = activeEnemy();
  els["turn-count"].textContent = `TURN ${battle.turn}`;
  const labels = { safari: "WILD ENCOUNTER", cup: `${CUPS[battle.cupIndex]?.badge || "KANTO"} JOURNEY`, arcade: `${ARCADE_CUPS[battle.arcadeCupIndex]?.name || "ARCADE CUP"} · STAGE ${battle.arcadeStage + 1}`, elite: "ELITE FOUR", mewtwo: "FINAL CHALLENGE", trainer: "EXHIBITION 3v3", trainerDuo: "EXHIBITION 6v6 DUOS" };
  els["match-type"].textContent = labels[battle.mode] || "EXHIBITION";
  els["opponent-profile"].querySelector("span").textContent = battle.mode === "safari"
    ? "SAFARI · WILD ENCOUNTER"
    : `${DIFFICULTIES[battle.difficulty].label} · ${battle.trainer?.name || battle.profile.label}`;
  els["trainer-sprite"].hidden = !battle.trainer || battle.mode === "safari";
  if (battle.trainer) els["trainer-sprite"].src = assetUrl(`./assets/trainers/${battle.trainer.sprite}.png`);
  els["player-name"].textContent = player.name;
  els["player-level"].textContent = `L${player.level}`;
  els["player-hp"].textContent = Math.max(0, player.hp);
  els["player-max-hp"].textContent = player.maxHp;
  els["player-status"].textContent = [player.status, player.trappedTurns ? "TRAPPED" : ""].filter(Boolean).join(" · ");
  setSprite(els["player-sprite"], player.id, true);
  els["player-sprite"].alt = `${player.name}, viewed from behind`;
  els["enemy-name"].textContent = enemy.name;
  els["enemy-level"].textContent = `L${enemy.level}`;
  els["enemy-status"].textContent = [enemy.status, enemy.trappedTurns ? "TRAPPED" : ""].filter(Boolean).join(" · ");
  setSprite(els["enemy-sprite"], enemy.id);
  els["enemy-sprite"].alt = `Opponent ${enemy.name}`;
  setHpBar(els["player-hp-bar"], player);
  setHpBar(els["enemy-hp-bar"], enemy);
  const pPartner = duoPartner("player");
  const ePartner = duoPartner("enemy");
  els["player-partner"].hidden = !pPartner;
  els["enemy-partner"].hidden = !ePartner;
  if (pPartner) {
    setSprite(els["player-partner-sprite"], pPartner.id, true);
    els["player-partner-name"].textContent = `${pPartner.name} · ${Math.max(0,pPartner.hp)} HP`;
  }
  if (ePartner) {
    setSprite(els["enemy-partner-sprite"], ePartner.id);
    els["enemy-partner-name"].textContent = `${ePartner.name} · ${Math.max(0,ePartner.hp)} HP`;
  }
  renderMoves();
  renderTeamButtons();
  renderBattleItems();
  window.YSFlow?.emit("battle:ui", { battle });
}

function renderMoves() {
  const player = activePlayer();
  els.moves.innerHTML = "";
  player.moveIds.forEach((moveId, index) => {
    const move = MOVES[moveId];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "move-button";
    button.disabled = battle.locked || player.hp <= 0 || player.pp[index] <= 0;
    button.innerHTML = `<span><span class="move-name">${move.name}</span><span class="move-type">${move.type} · ${move.category}${move.power ? ` · ${move.power}` : ""}</span></span><span class="move-pp">${player.pp[index]}/${move.pp}</span>`;
    button.addEventListener("click", () => takeTurn(index));
    els.moves.appendChild(button);
  });
  window.YSFlow?.emit("battle:moves", { battle, player });
}

function renderTeamButtons() {
  const player = activePlayer();
  const partner = duoPartner("player");
  els["team-buttons"].innerHTML = "";
  battle.player.forEach((mon, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `team-button${index === battle.pActive ? " current" : mon === partner ? " partner" : ""}`;
    button.disabled = battle.locked || index === battle.pActive || mon.hp <= 0 || player.trappedTurns > 0;
    button.innerHTML = `<img alt=""><span>${mon.name}<em>L${mon.level}</em></span><small>${Math.max(0,mon.hp)}/${mon.maxHp}</small>`;
    setSprite(button.querySelector("img"), mon.id);
    button.addEventListener("click", () => switchPlayer(index));
    els["team-buttons"].appendChild(button);
  });
}

function renderBattleItems() {
  els["battle-items"].innerHTML = "";
  Object.entries(ITEMS).forEach(([id, item]) => {
    const count = save.inventory[id] || 0;
    const active = activePlayer();
    const usable = count > 0 && !battle.locked && (
      (item.ball && ["safari","mewtwo","legendary"].includes(battle.mode) && (!PRE_EVOLUTION[activeEnemy().id] || battle.mode === "mewtwo")) ||
      (id === "potion" && active.hp > 0 && active.hp < active.maxHp) ||
      (id === "superPotion" && active.hp > 0 && active.hp < active.maxHp) ||
      (id === "fullHeal" && Boolean(active.status)) ||
      (id === "revive" && battle.player.some(mon => mon.hp <= 0))
    );
    const button = document.createElement("button");
    button.type = "button";
    button.className = "item-button";
    button.disabled = !usable;
    button.innerHTML = `${item.name}<b>×${count}</b>`;
    button.addEventListener("click", () => useBattleItem(id));
    els["battle-items"].appendChild(button);
  });
}

