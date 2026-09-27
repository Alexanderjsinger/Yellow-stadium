
let selectedArcadeCup = 0;
function arcadeCupUnlocked(index) { return index === 0 || save.arcadeCupClears[index - 1] === true; }
function showTrainer() {
  if (!save.onboardingComplete || battle) return;
  setTeamSize(3);
  hideMainScreens();
  els["trainer-screen"].hidden = false;
  setActiveNav("trainer-tab");
  if (!arcadeCupUnlocked(selectedArcadeCup)) selectedArcadeCup = Math.max(0, save.arcadeCupClears.findIndex(done => !done));
  renderArcadeCups();
  window.YSFlow?.emit("trainer:shown");
}

function renderArcadeCups() {
  const cleared = save.arcadeCupClears.filter(Boolean).length;
  els["arcade-clear-count"].textContent = `${cleared} / 3`;
  const grid = els["arcade-cup-grid"]; grid.replaceChildren();
  ARCADE_CUPS.forEach((cup,index) => {
    const unlocked = arcadeCupUnlocked(index), complete = save.arcadeCupClears[index], progress = save.arcadeCupProgress[index] || 0;
    const button = document.createElement("button"); button.type = "button";
    button.className = `arcade-cup-card ${cup.id}${index === selectedArcadeCup ? " selected" : ""}${complete ? " complete" : ""}`;
    button.disabled = !unlocked;
    button.innerHTML = `<span class="arcade-cup-ball">${cup.icon}</span><span><strong>${cup.name}</strong><small>${!unlocked ? `CLEAR ${ARCADE_CUPS[index-1].name}` : complete ? "CLEARED · REPLAY ANYTIME" : progress ? `STAGE ${progress + 1} / ${cup.stages.length}` : `${cup.stages.length} STAGES`}</small></span>`;
    button.addEventListener("click",()=>{selectedArcadeCup=index;renderArcadeCups();});
    grid.append(button);
  });
  const cup = ARCADE_CUPS[selectedArcadeCup], progress = save.arcadeCupProgress[selectedArcadeCup] || 0;
  els["arcade-run-title"].textContent = cup.name;
  els["arcade-run-copy"].textContent = cup.description;
  els["arcade-boss"].innerHTML = `<img src="${assetUrl(`./assets/trainers/${cup.bossSprite}.png`)}" alt="${cup.boss}"><span>FINAL BOSS<b>${cup.boss}</b></span>`;
  const track = els["arcade-stage-track"]; track.replaceChildren();
  cup.stages.forEach((stage,index)=>{
    const node=document.createElement("article");
    node.className=`arcade-stage ${stage.boss?"boss":""}${index<progress||save.arcadeCupClears[selectedArcadeCup]?" cleared":index===progress?" current":""}`;
    node.innerHTML=`<span>${index<progress||save.arcadeCupClears[selectedArcadeCup]?"✓":index+1}</span><div><small>${stage.label}</small><strong>${stage.title}</strong></div>`;
    track.append(node);
  });
  const action=els["arcade-start"], ready=selected.length===3;
  action.disabled=false;
  action.innerHTML=ready?`${save.arcadeCupClears[selectedArcadeCup]?"REPLAY":"ENTER"} ${cup.name} · STAGE ${progress+1} <span>›</span>`:`MANAGE 3-POKÉMON PARTY <span>›</span>`;
  action.onclick=()=>ready?startArcadeStage(selectedArcadeCup,progress):window.PartyTray?.open();
}

function prepareTrainer(size = 3) { if (window.BattleEntryUX?.prepareTrainer) return window.BattleEntryUX.prepareTrainer(size); showTrainer(); }

function startArcadeStage(cupIndex, stageIndex) {
  const cup=ARCADE_CUPS[cupIndex],stage=cup?.stages[stageIndex];
  if(!stage||!arcadeCupUnlocked(cupIndex)||selected.length!==3)return;
  const random=stage.randomTeam?.length?shuffle(stage.randomTeam)[0]:null;
  const enemyIds=random?[random]:stage.team;
  startBattle("arcade",{enemyIds,trainer:stage.trainer,strategy:stage.strategy,levelBonus:stage.levelBonus||Math.floor(cupIndex/2),arcadeCupIndex:cupIndex,arcadeStage:stageIndex,arcadeStageTitle:stage.title,arcadeLabel:stage.label,encounterText:stage.encounterText||""});
}

function startTrainer(size) {
  if (selected.length !== size) return;
  const trainer = shuffle(TRAINERS)[0];
  const average = Math.round(selected.reduce((sum, id) => sum + levelFor(id), 0) / selected.length);
  const ids = chooseDiverseTeam(Object.keys(SPECIES), size);
  startBattle(size === 6 ? "trainerDuo" : "trainer", { enemyIds: ids, trainer, forcedLevel: average });
}

// Safari zones are deliberately bounded: a high-level party cannot turn a starter habitat into an endgame area.

