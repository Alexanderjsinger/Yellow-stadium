const JourneyRuntime = window.YSRuntime;
function showCups() {
  if (!JourneyRuntime.save.onboardingComplete || JourneyRuntime.battle) return;
  setTeamSize(6);
  hideMainScreens();
  JourneyRuntime.element("cups-screen").hidden = false;
  setActiveNav("cups-tab");
  renderCups();
}

function renderCups() {
  if (window.KantoMap) { window.KantoMap.render(); window.YSFlow?.emit("journey:rendered"); return; }
  JourneyRuntime.element("badge-count").innerHTML = `<span>${JourneyRuntime.save.cupsCompleted}</span> / 8`;
  JourneyRuntime.element("cup-summary").textContent = JourneyRuntime.save.cupsCompleted < 8
    ? `${8 - JourneyRuntime.save.cupsCompleted} badge${8 - JourneyRuntime.save.cupsCompleted === 1 ? "" : "s"} remain before the Elite Four.`
    : "The Indigo Plateau is open.";
  JourneyRuntime.element("badge-grid").innerHTML = "";
  CUPS.forEach((cup, index) => {
    const completed = index < JourneyRuntime.save.cupsCompleted;
    const current = index === JourneyRuntime.save.cupsCompleted;
    const card = document.createElement("article");
    card.className = `badge-card${completed ? " completed" : current ? " current" : " locked"}`;
    card.innerHTML = `<span class="badge-icon">${cup.mark}</span><div><strong>${cup.badge} GYM</strong><small>${cup.leader} · ${cup.types.join(" / ")}${completed ? " · COMPLETE" : ""}</small>${current ? `<button type="button">${JourneyRuntime.selectedIds.length === 3 ? "CHALLENGE" : "SELECT TEAM"}</button>` : ""}</div>`;
    if (current) card.querySelector("button").addEventListener("click", () => JourneyRuntime.selectedIds.length === 3 ? startCup(index) : showCollection());
    JourneyRuntime.element("badge-grid").appendChild(card);
  });
  renderElitePanel();
  window.YSFlow?.emit("journey:rendered");
}

function renderElitePanel() {
  const panel = JourneyRuntime.element("elite-panel");
  if (JourneyRuntime.save.cupsCompleted < 8) {
    panel.innerHTML = `<h3>ELITE FOUR · LOCKED</h3><p>Complete all eight Kanto Gyms to enter the Indigo Plateau.</p>`;
    return;
  }
  if (!JourneyRuntime.save.eliteCompleted) {
    const member = ELITE_FOUR[JourneyRuntime.save.eliteProgress];
    panel.innerHTML = `<h3>ELITE FOUR · ${JourneyRuntime.save.eliteProgress}/4</h3><p>Next opponent: ${member.name}. Journey damage carries forward, so prepare your six-slot adventure party and Bag.</p><button class="primary-button" type="button">BATTLE ${member.name}<span>›</span></button>`;
    panel.querySelector("button").onclick = startElite;
    return;
  }
  const legendaryIds = ["articuno", "zapdos", "moltres"];
  const count = legendaryIds.filter(id => JourneyRuntime.save.owned.includes(id)).length;
  const allCaught = count === legendaryIds.length;
  panel.replaceChildren();
  const head = document.createElement("div");
  head.innerHTML = `<h3>KANTO CHAMPION · POSTGAME</h3><p>${allCaught ? "The three legendary birds are yours. A psychic signal has appeared near Cerulean Cave." : `${count} / 3 legendary birds caught. Their signals are now visible on the Kanto map.`}</p>`;
  panel.append(head);
  const grid = document.createElement("div");
  grid.className = "v57-legendary-grid";
  legendaryIds.forEach(id => {
    const caught = JourneyRuntime.save.owned.includes(id), button = document.createElement("button");
    button.type = "button"; button.dataset.legendary = id; button.className = `v57-legendary-card${caught ? " caught" : ""}`;
    const img = document.createElement("img"); img.alt = ""; setSprite(img, id);
    const span = document.createElement("span"); span.innerHTML = `<strong>${SPECIES[id].name}</strong><small>${caught ? "CAUGHT" : "TRACK ON MAP"}</small>`;
    button.append(img, span); button.disabled = caught;
    button.onclick = () => window.startLegendaryBattle?.(id); grid.append(button);
  });
  panel.append(grid);
  if (allCaught) {
    const button = document.createElement("button");
    button.type = "button"; button.className = "primary-button v57-mewtwo-button"; button.textContent = JourneyRuntime.save.mewtwoDefeated ? "REPLAY MEWTWO ENCOUNTER" : "CHALLENGE MEWTWO ›";
    button.onclick = startMewtwoBattle; panel.append(button);
  }
  if (JourneyRuntime.save.mewEgg?.awarded && !JourneyRuntime.save.mewEgg.hatched) {
    const egg = document.createElement("p"); egg.className = "v57-egg-progress";
    egg.textContent = `Mew Egg · ${JourneyRuntime.save.mewEgg.progress || 0} / 42 battles completed`;
    panel.append(egg);
  }
}

function startCup(index) {
  startCupRound(index, 0);
}

function startCupRound(index, round) {
  const cup = CUPS[index];
  if (!cup || index > JourneyRuntime.save.cupsCompleted || JourneyRuntime.selectedIds.length < 1 || JourneyRuntime.selectedIds.length > 6 || round < 0 || round > 2) return;
  const qualifier = CUP_ROUNDS[index][round];
  const seed = [...(qualifier?.team || cup.team)];
  const desired = index <= 1 ? (round === 2 ? 3 : 2) : index <= 4 ? (round === 2 ? 4 : 3) : (round === 2 ? 5 : 4);
  const legendaryIds = ["articuno", "zapdos", "moltres"];
  const pool = Object.keys(SPECIES).filter(id => !["mew", "mewtwo", ...legendaryIds].includes(id) && SPECIES[id].types.some(type => cup.types.includes(type)));
  for (const id of shuffle(pool)) {
    if (seed.length >= desired) break;
    if (!seed.includes(id)) seed.push(id);
  }
  startBattle("cup", {
    enemyIds: seed.slice(0, desired),
    trainer: qualifier || { name: cup.leader, sprite: cup.sprite },
    strategy: qualifier?.strategy,
    encounter: !qualifier && index === 0 ? "boulderFinal" : null,
    cupIndex: index, cupRound: round,
    levelBonus: Math.floor(index / 2) + (round === 2 ? 1 : 0)
  });
}

function startElite() {
  const member = ELITE_FOUR[JourneyRuntime.save.eliteProgress];
  if (!member || JourneyRuntime.selectedIds.length < 1 || JourneyRuntime.selectedIds.length > 6) return;
  startBattle("elite", { enemyIds: member.team, trainer: member, eliteIndex: JourneyRuntime.save.eliteProgress, levelBonus: 3 + JourneyRuntime.save.eliteProgress });
}

function startMewtwoBattle() {
  const legendarySet = ["articuno","zapdos","moltres"];
  if (!JourneyRuntime.save.eliteCompleted || !legendarySet.every(id => JourneyRuntime.save.owned.includes(id)) || JourneyRuntime.selectedIds.length < 1 || JourneyRuntime.selectedIds.length > 6) return;
  startBattle("mewtwo", { enemyIds: ["mewtwo"], trainer: { name: "MEWTWO", sprite: "psychic" }, levelBonus: 7 });
}

