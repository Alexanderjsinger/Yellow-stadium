
function returnToRoster() {
  const finished = battle;
  els["result-modal"].hidden = true;
  els["battle-screen"].hidden = true;
  if (finished?.mode === "cup" && finished.victory && finished.cupRound < 2) {
    battle = null;
    startCupRound(finished.cupIndex, finished.cupRound + 1);
    return;
  }
  if (finished?.mode === "arcade" && finished.victory && Number.isInteger(finished.arcadeNextStage)) {
    const cupIndex=finished.arcadeCupIndex,next=finished.arcadeNextStage;
    battle=null;
    startArcadeStage(cupIndex,next);
    return;
  }
  battle = null;
  window.AudioManager?.setScene?.("menu");
  els["mode-nav"].hidden = false;
  if (finished?.tutorialDemo) showCups();
  else if (["trainer", "trainerDuo", "arcade"].includes(finished?.mode)) showTrainer();
  else if (finished?.mode === "safari") showSafari();
  else if (["cup", "elite", "mewtwo", "legendary"].includes(finished?.mode)) showCups();
  else showCollection();
  window.PartyTray?.render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

els["box-manage-party"].addEventListener("click",()=>window.PartyTray?.open());
els["battle-retreat"].addEventListener("click",()=>{if(!battle||battle.over||battle.locked)return;const safari=battle.mode==="safari";if(!window.confirm(safari?"Run from this wild encounter? No rewards will be earned.":"Retreat from this battle? No rewards will be earned and this run will end."))return;const finished=battle;window.YSAdventureV57?.syncBattleHealth?.(finished);if(finished.mode==="arcade"){save.arcadeCupProgress[finished.arcadeCupIndex]=0;writeSave();}else writeSave();battle=null;els["battle-screen"].hidden=true;els["result-modal"].hidden=true;els["mode-nav"].hidden=false;window.AudioManager?.setScene?.("menu");if(finished.mode==="safari")showSafari();else if(["cup","elite","mewtwo","legendary"].includes(finished.mode))showCups();else showTrainer();window.PartyTray?.render();});
els["start-battle"].addEventListener("click", showTrainer);
els["start-duo"].addEventListener("click", showTrainer);
els["start-safari"].addEventListener("click", showSafari);
els["continue-button"].addEventListener("click", returnToRoster);
els["collection-tab"].addEventListener("click", showCollection);
els["cups-tab"].addEventListener("click", showCups);
els["trainer-tab"].addEventListener("click", showTrainer);
els["safari-tab"].addEventListener("click", showSafari);
els["pokedex-tab"].addEventListener("click", showPokedex);
els["shop-tab"].addEventListener("click", showShop);
els["team-size-3"].addEventListener("click", () => setTeamSize(3));
els["team-size-6"].addEventListener("click", () => setTeamSize(6));
els["prepare-singles"]?.addEventListener("click", showTrainer);
els["prepare-duos"]?.addEventListener("click", showTrainer);
els["refresh-safari"].addEventListener("click", renderSafariField);
els["begin-journey"].addEventListener("click", finishOnboarding);
els["music-toggle"].addEventListener("click", () => { void window.AudioManager?.toggle?.(); });
document.addEventListener("pointerdown", () => { void window.AudioManager?.start?.(); }, { once: true });
document.addEventListener("keydown", () => { void window.AudioManager?.start?.(); }, { once: true });
document.querySelectorAll('input[name="difficulty"]').forEach(input => {
  input.addEventListener("change", () => {
    if (!input.checked || !DIFFICULTIES[input.value]) return;
    save.difficulty = input.value;
    writeSave();
    renderDifficulty();
  });
});
els["reset-save"].addEventListener("click", () => {
  if (!window.confirm("Reset your party, coins, items, levels, badges, and record?")) return;
  try { localStorage.removeItem(SAVE_KEY); } catch {}
  try { localStorage.removeItem(SAVE_BACKUP_KEY); } catch {}
  battle = null;
  save = loadSave();
  selected = [];
  renderApp();
});

