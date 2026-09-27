
function renderRoster() {
  els.roster.innerHTML = "";
  save.pokemon.slice().sort((a, b) => SPECIES[a.speciesId].dex - SPECIES[b.speciesId].dex || a.uid.localeCompare(b.uid)).forEach(record => {
    const id = record.speciesId;
    const uid = record.uid;
    const mon = SPECIES[id];
    const index = selected.indexOf(uid);
    const card = document.createElement("article");
    card.className = `party-entry${index >= 0 ? " selected" : ""}`;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `rental-card pokemon-profile-trigger${index >= 0 ? " selected" : ""}`;
    button.dataset.pokemonId = id;
    button.dataset.companionId = uid;
    button.setAttribute("aria-label", `View ${pokemonNameFor(uid)} details`);
    const level = levelFor(uid);
    const stats = calculatedStats(id, level);
    const progress = xpProgress(uid);
    button.innerHTML = `
      <span class="rental-name">${pokemonNameFor(uid)}</span>
      <span class="rental-meta">L${level} · ${mon.nature[0]} · ${level === 100 ? "MAX LEVEL" : `${Math.ceil(progress.needed - progress.current).toLocaleString()} TO NEXT`}</span>
      <span class="rental-xp" title="${Math.floor(progress.current).toLocaleString()} / ${progress.needed.toLocaleString()} EXP" aria-label="${Math.floor(progress.current).toLocaleString()} of ${progress.needed.toLocaleString()} experience to the next level"><i style="width:${progress.percent}%"></i></span>
      <img class="rental-sprite" alt="" />
      <span class="type-pills">${mon.types.map(type => `<span class="type-pill">${type}</span>`).join("")}</span>
      <span class="stat-grid">
        <span><small>HP</small><b>${stats.hp}</b></span><span><small>ATK</small><b>${stats.attack}</b></span><span><small>DEF</small><b>${stats.defense}</b></span>
        <span><small>SP.A</small><b>${stats.specialAttack}</b></span><span><small>SP.D</small><b>${stats.specialDefense}</b></span><span><small>SPE</small><b>${stats.speed}</b></span>
      </span>
      <span class="selected-index">${index + 1}</span>
    `;
    setSprite(button.querySelector(".rental-sprite"), id);
    button.addEventListener("click", () => window.PokemonDetails?.summary(uid));
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "party-toggle";
    toggle.setAttribute("aria-pressed", String(index >= 0));
    toggle.textContent = index >= 0 ? `TEAM ${index + 1} · REMOVE` : selected.length < selectionLimit ? "ADD TO TEAM" : "TEAM FULL";
    toggle.disabled = index < 0 && selected.length >= selectionLimit;
    toggle.addEventListener("click", () => toggleSelection(uid));
    card.append(button, toggle);
    els.roster.appendChild(card);
  });
  els["pick-count"].textContent = selected.length;
  els["pick-limit"].textContent = selectionLimit;
  els["team-size-3"].classList.toggle("active", selectionLimit === 3);
  els["team-size-6"].classList.toggle("active", selectionLimit === 6);
  els["team-size-6"].disabled = save.pokemon.length < 6;
  const ready = selected.length === selectionLimit;
  els["start-battle"].hidden = selectionLimit !== 3;
  els["start-safari"].hidden = selectionLimit !== 3;
  els["start-duo"].hidden = selectionLimit !== 6;
  els["start-battle"].disabled = !ready;
  els["start-safari"].disabled = !ready;
  els["start-duo"].disabled = !ready;
  els["selection-note"].textContent = ready
    ? (selectionLimit === 3 ? `${selected.map(pokemonNameFor).join(" · ")} are ready.` : "Six Pokémon are ready for a duo battle.")
    : `Pick ${selectionLimit - selected.length} more Pokémon to continue.`;
  window.YSFlow?.emit("party:rendered", { ready, selectionLimit, selected: [...selected] });
}

function toggleSelection(uid) {
  const index = selected.indexOf(uid);
  if (index >= 0) selected.splice(index, 1);
  else if (selected.length < selectionLimit && pokemonRecord(uid)) selected.push(uid);
  save.activePartyInstanceIds = [...selected];
  writeSave();
  renderRoster();
  window.PartyTray?.render();
}

function setTeamSize(size) {
  if (![3, 6].includes(size)) return;
  if (size === 3 && selectionLimit !== 3) {
    save.adventurePartyInstanceIds = selected.filter(uid => pokemonRecord(uid)).slice(0, 6);
  }
  if (size === 6 && selectionLimit !== 6) {
    const restored = (save.adventurePartyInstanceIds || []).filter(uid => pokemonRecord(uid)).slice(0, 6);
    if (restored.length) selected = restored;
  }
  selectionLimit = size;
  if (selected.length > size) selected = selected.slice(0, size);
  save.activePartyInstanceIds = [...selected];
  writeSave();
  renderRoster();
  window.PartyTray?.render();
}

