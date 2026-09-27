
function endBattle(victory) {
  const finished = battle;
  window.YSFlow?.emit("battle:beforeEnd", { battle: finished, victory });
  battle.over = true;
  battle.locked = true;
  battle.victory = victory;
  const safari = battle.mode === "safari";
  const gains = battle.player.map(mon => {
    const participated = battle.participants?.has(battle.player.indexOf(mon));
    const ref = mon.companionUid || mon.id;
    const record = pokemonRecord(ref);
    const oldLevel = levelFor(ref);
    const oldXp = experienceFor(ref);
    const oldProgress = xpProgress(ref);
    const full = matchExperience(mon);
    const gained = !save.sharedExp && !participated ? 0 : battle.captured ? Math.floor(full * .45) : victory ? full : Math.floor(full * .25);
    const nextXp = Math.min(expForLevel(mon.id, 100), experienceFor(ref) + gained);
    if (record) record.xp = nextXp; else save.xp[mon.id] = nextXp;
    return { id: mon.id, uid: record?.uid || null, ref, gained, oldLevel, newLevel: levelFor(ref), oldXp, oldProgress, newProgress: xpProgress(ref) };
  });
  const evolutions = processEvolutions(gains);
  let coinGain = safari
    ? (battle.captured ? 45 : victory ? 60 : 10)
    : battle.mode === "trainerDuo"
      ? (victory ? 260 : -45)
      : battle.mode === "trainer"
        ? (victory ? 150 : -30)
        : battle.mode === "arcade"
          ? (victory ? (battle.arcadeStage === ARCADE_CUPS[battle.arcadeCupIndex].stages.length - 1 ? 500 + battle.arcadeCupIndex * 250 : 125 + battle.arcadeCupIndex * 50) : 0)
        : battle.mode === "cup"
          ? (victory ? (battle.cupRound === 2 ? 250 + battle.cupIndex * 50 : 75 + battle.cupIndex * 10) : 0)
          : battle.mode === "elite"
            ? (victory ? 500 : 0)
            : battle.mode === "mewtwo"
              ? (victory ? 1000 : 0)
              : (victory ? ({ casual: 90, stadium: 140, master: 220 }[battle.difficulty]) : 25);
  if (coinGain < 0) coinGain = -Math.min(save.coins, Math.abs(coinGain));
  save.coins = Math.max(0, save.coins + coinGain);
  save.version = SAVE_SCHEMA_VERSION;
  let progressionReward = "";
  if (battle.mode === "arcade") {
    const cup=ARCADE_CUPS[battle.arcadeCupIndex],last=battle.arcadeStage===cup.stages.length-1;
    if(victory&&last){
      const firstClear=!save.arcadeCupClears[battle.arcadeCupIndex];
      save.arcadeCupClears[battle.arcadeCupIndex]=true;save.arcadeCupProgress[battle.arcadeCupIndex]=0;battle.arcadeCupComplete=true;
      const prize=["focusBand","leftovers","quickClaw"][battle.arcadeCupIndex];
      if(firstClear){save.inventory[prize]=(save.inventory[prize]||0)+1;progressionReward=`${cup.name} CLEARED · ${ITEMS[prize].name} WON`;}
      else progressionReward=`${cup.name} CLEARED AGAIN`;
    }else if(victory){
      save.arcadeCupProgress[battle.arcadeCupIndex]=battle.arcadeStage+1;battle.arcadeNextStage=battle.arcadeStage+1;
      progressionReward=`STAGE ${battle.arcadeStage+1} CLEARED · NEXT: ${cup.stages[battle.arcadeStage+1].title}`;
    }else{
      save.arcadeCupProgress[battle.arcadeCupIndex]=0;battle.arcadeRunFailed=true;progressionReward=`${cup.name} RUN ENDED · RESTART FROM STAGE 1`;
    }
  }
  if (battle.mode === "cup" && victory && battle.cupRound === 2 && battle.cupIndex === save.cupsCompleted) {
    save.cupsCompleted += 1;
    progressionReward = `${CUPS[battle.cupIndex].badge} BADGE EARNED`;
  }
  if (battle.mode === "elite" && victory && battle.eliteIndex === save.eliteProgress) {
    save.eliteProgress += 1;
    if (save.eliteProgress >= 4) {
      save.eliteCompleted = true;
      save.inventory.masterBall = Math.max(1, save.inventory.masterBall || 0);
      progressionReward = "ELITE FOUR COMPLETE · MASTER BALL AWARDED";
    } else progressionReward = `${ELITE_FOUR[battle.eliteIndex].name} DEFEATED`;
  }
  if (battle.mode === "mewtwo" && victory) {
    save.mewtwoDefeated = true;
    progressionReward = battle.captured ? "MEWTWO CAPTURED" : "MEWTWO DEFEATED";
  }
  if (["trainer","trainerDuo"].includes(battle.mode)) {
    if (victory) {
      save.trainerStreak += 1;
      save.bestTrainerStreak = Math.max(save.bestTrainerStreak, save.trainerStreak);
      if (save.trainerStreak === 3) { save.inventory.potion += 2; progressionReward = "3-WIN PRIZE · 2 POTIONS"; }
      if (save.trainerStreak === 5) { save.coins += 300; progressionReward = "5-WIN PRIZE · 300 COINS"; }
      if (save.trainerStreak === 10) { save.inventory.ultraBall += 2; progressionReward = "10-WIN PRIZE · 2 ULTRA BALLS"; }
    } else save.trainerStreak = 0;
  }
  if (!safari && victory) {
    save.wins += 1;
    save.streak += 1;
  } else if (!safari) {
    save.losses += 1;
    save.streak = 0;
  }
  writeSave();
  els["result-title"].textContent = battle.captured ? "CAUGHT!" : victory ? "VICTORY!" : "DEFEAT";
  els["result-copy"].textContent = battle.captured
    ? battle.caughtAutoParty ? `${activeEnemy().name} joined your active party.` : `${activeEnemy().name} was sent to your Pokémon Box.`
    : safari && victory
      ? "The wild Pokémon was defeated. Search the Safari again for another encounter."
      : ["trainer","trainerDuo"].includes(battle.mode) && !victory
        ? "The opposing trainer takes the match and a portion of your coins. Your team still earns partial experience."
        : battle.mode === "arcade"
          ? victory
            ? battle.arcadeCupComplete?`${ARCADE_CUPS[battle.arcadeCupIndex].name} conquered. The boss is down.`:`${battle.arcadeStageTitle} cleared. The next arcade stage is waiting.`
            : `${battle.arcadeStageTitle} stopped the run. Adjust your party and restart the Cup.`
        : battle.mode === "cup" && victory
          ? battle.cupRound === 2
            ? `${CUPS[battle.cupIndex].leader} has awarded you the ${CUPS[battle.cupIndex].badge} Badge.`
            : `${battle.trainer.name} was defeated. ${2 - battle.cupRound} Journey battle${battle.cupRound === 1 ? "" : "s"} remain.`
          : battle.mode === "elite" && victory
            ? `${ELITE_FOUR[battle.eliteIndex].name} has been defeated.`
      : victory
        ? "The opposing team is down. Your team earned experience and prize coins."
        : "Your team receives partial experience. Return stronger and try again.";
  const caught = battle.captured
    ? `<strong>${battle.caughtAutoParty ? `${activeEnemy().name} JOINED PARTY` : `${activeEnemy().name} SENT TO BOX`}</strong>`
    : "";
  const evolutionCopy = evolutions.map(entry => `<strong>${SPECIES[entry.from].name} EVOLVED INTO ${SPECIES[entry.to].name}!</strong>`).join("");
  const itemGlyphs={pokeBall:"◉",greatBall:"◉",ultraBall:"◉",superBall:"◉",masterBall:"◉",potion:"✚",superPotion:"✚",fullHeal:"✦",revive:"✧",focusBand:"◈",leftovers:"▣",quickClaw:"✣",fireStone:"◆",waterStone:"◆",thunderStone:"◆",leafStone:"◆",moonStone:"◆"};
  const xpCards=gains.filter(g=>g.gained>0).map(gain=>{const levelUp=gain.newLevel>gain.oldLevel;const from=Math.max(0,Math.round(gain.oldProgress?.percent||0));const to=Math.max(0,Math.round(levelUp?100:(gain.newProgress?.percent||0)));const levelCopy=levelUp?`LV ${gain.oldLevel} → ${gain.newLevel}`:`LV ${gain.newLevel}`;const progressCopy=levelUp?'LEVEL UP READY':`${to}% TO NEXT LV`;return `<span class="xp-card${levelUp?' level-up':''}" style="--xp-from:${from}%"><img src="${spriteUrl(gain.id)}" alt=""><span class="xp-card-main"><span class="xp-card-topline"><strong>${pokemonNameFor(gain.ref)}</strong><em>${levelCopy}</em></span><span class="xp-card-head"><b>+${gain.gained.toLocaleString()} XP</b><small>${progressCopy}</small></span><span class="xp-track"><i class="xp-fill" data-xp-to="${to}"></i><i class="xp-cap"></i></span><span class="xp-meta"><small>START ${from}%</small><small>NOW ${to}%</small></span></span></span>`}).join("");
  const coinLabel=coinGain<0?'TRAINER LOSS':'PRIZE COINS';
  const major=progressionReward?`<strong class="reward-major"><span class="reward-icon">${/BADGE/.test(progressionReward)?'★':/BALL|POTION|BAND|LEFTOVERS|CLAW|STONE/.test(progressionReward)?'◆':'✦'}</span><span>${progressionReward}<small>${/BADGE/.test(progressionReward)?'A new milestone has been added to your journey.':'Battle progress updated.'}</small></span></strong>`:'';
  els.reward.innerHTML = `<div class="reward-summary"><span class="reward-chip coins${coinGain<0?' loss':''}"><span class="reward-icon" aria-hidden="true"></span><span><small>${coinLabel}</small><b>${coinGain>=0?'+':''}${coinGain} COINS</b></span></span><span class="reward-chip team-xp"><span class="reward-icon" aria-hidden="true"></span><span><small>TEAM EXPERIENCE</small><b>${gains.reduce((n,g)=>n+g.gained,0).toLocaleString()} XP</b></span></span></div>${xpCards?`<div class="xp-rewards">${xpCards}</div>`:''}${caught}${evolutionCopy}${major}`;
  els["result-modal"].hidden = false;
  requestAnimationFrame(()=>requestAnimationFrame(()=>els.reward.querySelectorAll('.xp-fill').forEach(bar=>bar.style.width=`${bar.dataset.xpTo}%`)));
  window.YSFlow?.emit("battle:ended", { battle: finished, victory, gains, evolutions, coinGain, progressionReward });
}

