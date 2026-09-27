
function chooseEggs() {
  return shuffle(EGG_POOL.filter(id => !save.owned.includes(id))).slice(0, 2);
}

function markSeen(ids) {
  ids.forEach(id => { if (SPECIES[id] && !save.seen.includes(id)) save.seen.push(id); });
}

function addOwned(id, level = 5) {
  if (!SPECIES[id]) return false;
  markSeen([id]);
  save.caughtSpecies ||= [];
  if (!save.caughtSpecies.includes(id)) save.caughtSpecies.push(id);
  const isNew = !save.owned.includes(id);
  if (isNew) save.owned.push(id);
  save.pokemon ||= [];
  const record = createPokemonRecord(save, id, { xp: expForLevel(id, level) });
  save.pokemon.push(record);
  save.xp[id] ??= expForLevel(id, level);
  window.YSFlow?.emit("pokemon:added", { id, level, isNew, record });
  return isNew;
}

function chooseStarter(id) {
  if (!STARTER_IDS.includes(id) || save.owned.length) return;
  save.owned = [];
  save.pokemon = [];
  save.activePartyInstanceIds = [];
  save.partyPresetInstanceIds = [];
  addOwned(id, 5);
  save.pendingEggs = chooseEggs();
  save.hatchedEggs = [];
  writeSave();
  renderOnboarding();
}

function hatchEgg(index) {
  const id = save.pendingEggs[index];
  if (!id || save.hatchedEggs.includes(index)) return;
  save.hatchedEggs.push(index);
  addOwned(id, 5);
  writeSave();
  renderOnboarding();
}

function finishOnboarding() {
  if (save.hatchedEggs.length !== 2) return;
  save.onboardingComplete = true;
  save.introComplete = true;
  save.pendingEggs = [];
  save.hatchedEggs = [];
  selected = save.pokemon.slice(0, 6).map(mon => mon.uid);
  selectionLimit = 6;
  save.activePartyInstanceIds = [...selected];
  save.adventurePartyInstanceIds = [...selected];
  writeSave();
  renderApp();
}

function renderOnboarding() {
  hideMainScreens();
  els["mode-nav"].hidden = true;
  els["onboarding-screen"].hidden = false;
  const hasStarter = save.owned.length > 0;
  els["partner-step"].hidden = hasStarter;
  els["egg-step"].hidden = !hasStarter;
  if (!hasStarter) {
    els["starter-grid"].innerHTML = "";
    STARTER_IDS.forEach(id => {
      const mon = SPECIES[id];
      const button = document.createElement("button");
      button.type = "button";
      button.className = "starter-card";
      button.innerHTML = `<strong>${mon.name}</strong><small>${mon.types.join(" · ")}</small><img alt="${mon.name}">`;
      setSprite(button.querySelector("img"), id);
      button.addEventListener("click", () => chooseStarter(id));
      els["starter-grid"].appendChild(button);
    });
    return;
  }
  if (save.pendingEggs.length !== 2) {
    save.pendingEggs = chooseEggs();
    save.hatchedEggs = [];
    writeSave();
  }
  els["egg-grid"].innerHTML = "";
  save.pendingEggs.forEach((id, index) => {
    const hatched = save.hatchedEggs.includes(index);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `egg-card${hatched ? " hatched" : ""}`;
    button.disabled = hatched;
    button.innerHTML = hatched
      ? `<img alt="${SPECIES[id].name}"><strong>${SPECIES[id].name}</strong>`
      : `<span class="egg-shape" aria-hidden="true"></span><strong>CRACK EGG</strong>`;
    if (hatched) setSprite(button.querySelector("img"), id);
    else button.addEventListener("click", () => hatchEgg(index));
    els["egg-grid"].appendChild(button);
  });
  els["begin-journey"].disabled = save.hatchedEggs.length !== 2;
}

