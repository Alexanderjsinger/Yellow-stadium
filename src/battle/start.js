
function startBattle(mode = "trainer", config = {}) {
  if (window.BattleEntryUX?.interceptStart?.(mode, config, startBattleImmediate)) return;
  return startBattleImmediate(mode, config);
}

function startBattleImmediate(mode = "trainer", config = {}) {
  const startContext = {
    mode,
    config: { ...config },
    cancelled: false,
    reason: "",
    cancel(reason = "cancelled") { this.cancelled = true; this.reason = reason; }
  };
  window.YSFlow?.emit("battle:beforeStart", startContext);
  mode = startContext.mode;
  config = startContext.config || {};
  const finishStart = (started = false) => window.YSFlow?.emit("battle:startFinished", { ...startContext, mode, config, battle: started ? battle : null, started });
  if (startContext.cancelled) {
    window.YSFlow?.emit("battle:startAborted", { ...startContext, mode, config });
    finishStart(false);
    return;
  }
  const adventure = ["cup","safari","elite","mewtwo","legendary"].includes(mode);
  const required = mode === "trainerDuo" ? 6 : 3;
  if (adventure ? (selected.length < 1 || selected.length > 6) : selected.length !== required) {
    window.YSFlow?.emit("battle:startAborted", { ...startContext, mode, config, reason: "invalid-party-size" });
    finishStart(false);
    return;
  }
  const difficulty = ["trainer", "trainerDuo"].includes(mode) && DIFFICULTIES[save.difficulty] ? save.difficulty : "stadium";
  const playerTeam = selected.map(uid => createMon(uid, "player"));
  const averageLevel = Math.round(playerTeam.reduce((sum, mon) => sum + mon.level, 0) / playerTeam.length);
  const levelDelta = config.levelBonus ?? (mode === "safari" ? currentSafariZone().levelBonus : DIFFICULTIES[difficulty].levelOffset);
  const enemyLevel = Math.max(1, Math.min(100, config.forcedLevel ?? averageLevel + levelDelta));
  const opponentPool = Object.keys(SPECIES);
  const uncaughtPool = opponentPool.filter(id => !save.owned.includes(id));
  const enemyIds = config.enemyIds || (mode === "safari"
    ? [shuffle(uncaughtPool.length ? uncaughtPool : opponentPool)[0]]
    : chooseOpponentTeam(opponentPool, playerTeam, difficulty, enemyLevel));
  markSeen(enemyIds);
  battle = {
    player: playerTeam,
    enemy: enemyIds.map(id => createMon(id, "enemy", enemyLevel)),
    mode, difficulty, profile: chooseProfile(difficulty), trainer: config.trainer || null,
    cupIndex: config.cupIndex, cupRound: config.cupRound ?? 2, eliteIndex: config.eliteIndex, captured: false,
    arcadeCupIndex: config.arcadeCupIndex, arcadeStage: config.arcadeStage, arcadeStageTitle: config.arcadeStageTitle, arcadeLabel: config.arcadeLabel, encounterText: config.encounterText || "", tutorialDemo: config.tutorialDemo === true,
    pActive: Math.max(0, playerTeam.findIndex(mon => mon.hp > 0)), eActive: 0, turn: 1, locked: false, over: false,
    participants: new Set([0, ...(mode === "trainerDuo" ? [1] : [])]),
    aiSwitchCooldown: 0, lastPlayerMove: null
  };
  window.AudioManager?.setScene?.("battle");
  hideMainScreens();
  els["mode-nav"].hidden = true;
  els["battle-screen"].hidden = false;
  updateBattleUI();
  announce(mode === "safari"
    ? battle.tutorialDemo
      ? `An aggressive ${activeEnemy().name} attacked! Defeat it, or open BAG and throw a Poké Ball to capture it.`
      : `A wild ${activeEnemy().name} appeared! Weaken it, then throw a Poké Ball.`
    : mode === "mewtwo"
      ? "Mewtwo answered the challenge. This is the final test."
      : `${battle.trainer?.name || battle.profile.label} enters the arena. Go, ${activePlayer().name}!`);
  window.scrollTo({ top: 0, behavior: "smooth" });
  window.YSFlow?.emit("battle:started", { battle, mode, config });
  finishStart(true);
}

function activePlayer() { return battle.player[battle.pActive]; }
function activeEnemy() { return battle.enemy[battle.eActive]; }
function duoPartner(side) {
  if (battle.mode !== "trainerDuo") return null;
  const team = battle[side];
  const active = side === "player" ? battle.pActive : battle.eActive;
  return team.find((mon, index) => index !== active && mon.hp > 0) || null;
}

function stageMultiplier(stage) {
  return stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
}

function effectiveStat(mon, stat) {
  let value = mon[stat] * stageMultiplier(mon.stages[stat] || 0);
  if (stat === "speed" && mon.status === "PAR") value *= .5;
  if (stat === "attack" && mon.status === "BRN") value *= .5;
  return Math.max(1, Math.floor(value));
}

function effectiveness(moveType, defender) {
  return defender.types.reduce((mult, type) => mult * (TYPE_CHART[moveType]?.[type] ?? 1), 1);
}

function hpColor(percent) {
  if (percent <= 20) return "#ef5c5c";
  if (percent <= 50) return "#f5c542";
  return "#28b36f";
}

function setHpBar(element, mon) {
  const percent = Math.max(0, Math.round((mon.hp / mon.maxHp) * 100));
  element.style.width = `${percent}%`;
  element.style.background = hpColor(percent);
}

