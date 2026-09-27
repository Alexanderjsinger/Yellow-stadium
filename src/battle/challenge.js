
/* Yellow Stadium v5.3 — campaign challenge director.
   Journey difficulty comes from progression stage, not a player-facing setting. */
(() => {
  const phaseFor = (mode, config={}) => {
    if (mode === 'cup') {
      const gym = Number(config.cupIndex ?? 0), round = Number(config.cupRound ?? 2);
      if (gym <= 1) return {id:'foundations',label:'FOUNDATIONS',difficulty:round===2?'stadium':'casual',items:round===2?'berry':'none'};
      if (gym <= 4) return {id:'teamcraft',label:'TEAMCRAFT',difficulty:'stadium',items:round===2?'full':'berry'};
      return {id:'tactics',label:'TACTICS',difficulty:round===2?'master':'stadium',items:'full'};
    }
    if (mode === 'elite') return {id:'gauntlet',label:'ELITE GAUNTLET',difficulty:'master',items:'full'};
    if (mode === 'mewtwo') return {id:'boss',label:'PSYCHIC BOSS',difficulty:'master',items:'boss'};
    return null;
  };

  window.YSFlow?.on('battle:beforeStart', context => {
    if (context.mode === 'mewtwo' && (context.config.levelBonus == null || context.config.levelBonus > 5)) {
      context.config = { ...context.config, levelBonus: 5 };
    }
  }, 60);

  window.YSFlow?.on('battle:started', ({battle:startedBattle, mode, config}) => {
    const phase = phaseFor(mode, config);
    if (!startedBattle || !phase) return;
    startedBattle.challengePhase = phase.id;
    startedBattle.challengeLabel = phase.label;
    startedBattle.difficulty = phase.difficulty;
    startedBattle.profile = phase.difficulty === 'master' ? AI_PROFILES.master : phase.difficulty === 'casual' ? AI_PROFILES.rookie : startedBattle.profile;

    // Equipment curve: early game teaches matchups; later game introduces resource pressure.
    startedBattle.enemy.forEach((mon, i) => {
      if (phase.items === 'none') mon.held = null;
      else if (phase.items === 'berry') mon.held = i === startedBattle.enemy.length - 1 ? 'sitrusBerry' : null;
      else if (phase.items === 'boss') mon.held = 'lumBerry';
    });

    // Foundations should not surprise players with a tactical coverage move on every qualifier.
    if (phase.id === 'foundations' && Number(config.cupRound ?? 2) < 2) {
      startedBattle.enemy.forEach(mon => {
        const natural = defaultMoves(SPECIES[mon.id]);
        if (natural?.length) {
          mon.moveIds = natural.slice(-4);
          mon.pp = mon.moveIds.map(id => MOVES[id]?.pp || 10);
        }
      });
    }

    requestAnimationFrame(() => {
      const profile = document.querySelector('#opponent-profile .profile-label, #opponent-profile strong');
      if (profile && !profile.textContent.includes(phase.label)) profile.textContent = `${phase.label} · ${profile.textContent}`;
      document.body.dataset.challengePhase = phase.id;
    });
  }, 40);


  window.YellowChallenge = { phaseFor };
})();

