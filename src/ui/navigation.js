const NavigationRuntime = window.YSRuntime;
function hideMainScreens() {
  if (safariAggressionTimer) window.clearTimeout(safariAggressionTimer);
  ["onboarding-screen", "select-screen", "cups-screen", "trainer-screen", "safari-screen", "pokedex-screen", "shop-screen", "settings-screen", "battle-screen"].forEach(id => { NavigationRuntime.element(id).hidden = true; });
  window.PartyTray?.render();
  window.YSFlow?.emit("screens:hidden", { battle: NavigationRuntime.battle });
}

function setActiveNav(id) {
  document.querySelectorAll(".nav-button").forEach(button => button.classList.toggle("active", button.id === id));
  window.YSFlow?.emit("nav:changed", { id });
}

function showCollection() {
  if (!NavigationRuntime.save.onboardingComplete) return;
  setTeamSize(6);
  hideMainScreens();
  NavigationRuntime.element("select-screen").hidden = false;
  setActiveNav("collection-tab");
  renderRoster();
  window.YSFlow?.emit("party:shown");
}

