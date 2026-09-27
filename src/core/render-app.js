
function renderApp() {
  renderRecord();
  renderDifficulty();
  if (!save.onboardingComplete || save.pokemon.length < 3) {
    renderOnboarding();
    window.YSFlow?.emit("app:rendered", { onboarding: true });
    return;
  }
  if (!selected.length) {
    selected = save.pokemon.slice(0, 6).map(mon => mon.uid);
    selectionLimit = 6;
    save.activePartyInstanceIds = [...selected];
    writeSave();
  }
  els["mode-nav"].hidden = false;
  showCollection();
  window.PartyTray?.render();
  window.YSFlow?.emit("app:rendered", { onboarding: false });
}

