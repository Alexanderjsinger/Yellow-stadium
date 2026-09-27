"use strict";
(() => {
  const Runtime = window.YSRuntime;
  const byId = id => document.getElementById(id);

  function ensureResetControl() {
    const settings = byId("settings-screen");
    const canonical = byId("reset-save");
    if (!settings || !canonical) return null;
    let section = byId("settings-reset-section");
    if (!section) {
      section = document.createElement("section");
      section.id = "settings-reset-section";
      section.className = "save-reset-setting";
      section.innerHTML = '<div><strong>NEW GAME</strong><small>Erase your party, levels, items, coins, badges, Pokédex progress and battle record.</small></div><button id="reset-save-settings" type="button">RESET GAME SAVE</button>';
      settings.append(section);
    }
    const button = byId("reset-save-settings");
    if (button && button.dataset.settingsBound !== "true") {
      button.dataset.settingsBound = "true";
      button.addEventListener("click", () => canonical.click());
    }
    return button;
  }

  function show() {
    if (Runtime.battle) return;
    hideMainScreens();
    const screen = byId("settings-screen");
    if (!screen) return;
    screen.hidden = false;
    setActiveNav("settings-tab");
    const shared = byId("shared-exp");
    if (shared) shared.checked = Runtime.save.sharedExp !== false;
    ensureResetControl();
  }

  const shared = byId("shared-exp");
  if (shared) {
    shared.addEventListener("change", event => {
      Runtime.updateSave(current => { current.sharedExp = event.target.checked; });
    });
  }
  byId("settings-tab")?.addEventListener("click", show);
  ensureResetControl();
})();
