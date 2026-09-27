
"use strict";
(() => {
  const byId = id => document.getElementById(id);
  const screen = byId("select-screen"), roster = byId("roster"), heading = screen?.querySelector(".screen-heading");
  if (!screen || !roster || !heading || !window.PokemonDetails) return;

  const layout = document.createElement("div");
  layout.className = "party-mobile-layout";
  const teamHead = document.createElement("header");
  teamHead.className = "party-mobile-head";
  teamHead.innerHTML = '<div><p class="eyebrow">ACTIVE PARTY</p><h2>Your lineup</h2></div><span class="party-mobile-count" aria-live="polite"></span>';
  const team = document.createElement("div");
  team.id = "party-mobile-team";
  team.className = "party-mobile-team";
  team.setAttribute("aria-label", "Active Pokémon team");
  const coverage = document.createElement("section");
  coverage.id = "party-mobile-coverage";
  coverage.className = "party-mobile-coverage";
  const boxHead = document.createElement("header");
  boxHead.className = "party-mobile-head box-head";
  boxHead.innerHTML = '<div><p class="eyebrow">COLLECTION</p><h2>Pokémon Box</h2></div><label>SORT<select aria-label="Sort Pokémon Box"><option value="level">LEVEL</option><option value="name">NAME</option><option value="dex">DEX NO.</option></select></label>';
  layout.append(teamHead, team, coverage, boxHead);
  roster.before(layout);

  const controls = heading.querySelector(".team-builder-controls");
  const manage = byId("box-manage-party");
  heading.classList.add("party-mobile-heading");
  manage.textContent = "PRESETS";
  manage.className = "secondary-button party-mobile-presets";
  controls?.append(manage);

  const swap = document.createElement("dialog");
  swap.className = "party-mobile-swap";
  swap.innerHTML = '<header><div><p class="eyebrow">TEAM FULL</p><h2>Choose a replacement</h2></div><button type="button" aria-label="Close">×</button></header><p>Tap the teammate who should return to the Box.</p><div></div>';
  document.body.append(swap);
  swap.querySelector("header button").onclick = () => swap.close();
  swap.addEventListener("cancel", event => { event.preventDefault(); swap.close(); });
  swap.onclick = event => { if (event.target === swap) swap.close(); };

  function commit() {
    save.activePartyInstanceIds = [...selected];
    writeSave();
    renderRoster();
    window.PartyTray?.render();
  }
  function openSwap(incoming) {
    const list = swap.querySelector(":scope > div");
    list.replaceChildren();
    selected.forEach((uid, index) => {
      const record = pokemonRecord(uid), button = document.createElement("button"), image = document.createElement("img");
      button.type = "button"; button.className = "party-mobile-swap-row";
      image.alt = ""; setSprite(image, record.speciesId);
      button.append(image);
      button.insertAdjacentHTML("beforeend", `<span><strong>${pokemonNameFor(uid)}</strong><small>Slot ${index + 1} · Level ${levelFor(uid)}</small></span><b>SWAP</b>`);
      button.onclick = () => { selected[index] = incoming; swap.close(); commit(); };
      list.append(button);
    });
    swap.showModal();
  }
  function add(uid) {
    if (selected.includes(uid)) return;
    if (selected.length < selectionLimit) { selected.push(uid); commit(); }
    else openSwap(uid);
  }
  function remove(uid) {
    const index = selected.indexOf(uid);
    if (index >= 0) { selected.splice(index, 1); commit(); }
  }
  function move(uid, step) {
    const index = selected.indexOf(uid), next = index + step;
    if (index < 0 || next < 0 || next >= selected.length) return;
    [selected[index], selected[next]] = [selected[next], selected[index]];
    commit();
    window.PokemonDetails.summary(uid);
  }

  function coverageForParty() {
    const types = [...new Set(Object.values(SPECIES).flatMap(mon => mon.types))];
    const covered = new Set();
    selected.forEach(uid => StadiumUpgrade.movesFor(uid, "player", levelFor(uid)).forEach(key => {
      const move = MOVES[key];
      if (!move?.power) return;
      types.forEach(type => { if (effectiveness(move.type, { types: [type] }) > 1) covered.add(type); });
    }));
    const priority = ["WATER","GROUND","ROCK","FIRE","GRASS","ELECTRIC","PSYCHIC","ICE","DRAGON","FLYING","POISON","BUG","FIGHTING","GHOST","NORMAL"];
    return { covered: priority.filter(type => covered.has(type)), gaps: priority.filter(type => !covered.has(type)) };
  }
  function typeChip(type) { return `<span class="party-type type-${type.toLowerCase()}">${type}</span>`; }
  function drawCoverage() {
    const result = coverageForParty();
    coverage.innerHTML = `<div><b>STRONG VS</b><span>${result.covered.slice(0, 3).map(typeChip).join("") || "Build move coverage"}</span></div><div><b>NO ANSWER</b><span>${result.gaps.slice(0, 3).map(typeChip).join("")}</span></div>`;
  }
  function sortBox() {
    const mode = boxHead.querySelector("select").value;
    [...roster.querySelectorAll(".party-entry")].sort((a, b) => {
      const auid = a.querySelector("[data-companion-id]").dataset.companionId, buid = b.querySelector("[data-companion-id]").dataset.companionId;
      const ar = pokemonRecord(auid), br = pokemonRecord(buid);
      return mode === "name" ? pokemonNameFor(auid).localeCompare(pokemonNameFor(buid)) : mode === "dex" ? SPECIES[ar.speciesId].dex - SPECIES[br.speciesId].dex : levelFor(buid) - levelFor(auid) || pokemonNameFor(auid).localeCompare(pokemonNameFor(buid));
    }).forEach(node => roster.append(node));
  }
  boxHead.querySelector("select").onchange = sortBox;

  function actionButton(entry, uid, isSelected) {
    const old = entry.querySelector(".party-toggle"), button = old.cloneNode(false);
    button.disabled = false;
    button.setAttribute("aria-pressed", String(isSelected));
    const action = isSelected ? "REMOVE" : selected.length < selectionLimit ? "ADD" : "SWAP";
    button.dataset.action = action.toLowerCase();
    button.innerHTML = `<span aria-hidden="true">${action === "ADD" ? "+" : action === "SWAP" ? "↔" : "×"}</span><span class="visually-hidden">${action}</span>`;
    button.setAttribute("aria-label", `${action.toLowerCase()} ${pokemonNameFor(uid)} ${isSelected ? "from" : "to"} active team`);
    button.onclick = () => isSelected ? remove(uid) : add(uid);
    old.replaceWith(button);
  }
  function emptySlot(index) {
    const button = document.createElement("button");
    button.type = "button"; button.className = "party-mobile-empty";
    button.innerHTML = `<b>+</b><span>SLOT ${index + 1}</span><small>ADD POKÉMON</small>`;
    button.onclick = () => roster.querySelector(".pokemon-profile-trigger")?.focus();
    return button;
  }
  function arrange() {
    team.replaceChildren();
    [...roster.querySelectorAll(".party-entry")].forEach(entry => {
      const uid = entry.querySelector("[data-companion-id]").dataset.companionId, isSelected = selected.includes(uid);
      actionButton(entry, uid, isSelected);
      const record = pokemonRecord(uid), info = document.createElement("span");
      info.className = "party-box-corner";
      info.innerHTML = `<b>L${levelFor(uid)}</b><span aria-hidden="true">${SPECIES[record.speciesId].types.map(type => `<i class="type-${type.toLowerCase()}"></i>`).join("")}</span>`;
      entry.append(info);
      if (isSelected) team.append(entry);
    });
    for (let index = selected.length; index < selectionLimit; index++) team.append(emptySlot(index));
    team.style.setProperty("--party-size", selectionLimit);
    teamHead.querySelector(".party-mobile-count").textContent = `${selected.length} / ${selectionLimit}`;
    boxHead.querySelector("h2").textContent = `Pokémon Box · ${roster.children.length}`;
    drawCoverage(); sortBox();
  }

  window.YSFlow?.on("party:rendered", () => { arrange(); }, 35);

  function enhanceDetails() {
    const modal = document.querySelector(".pokemon-detail-modal"), root = modal?.querySelector(".detail-content"), card = modal?.querySelector(".pokemon-detail-card");
    if (!root || !card || modal.hidden) return;
    card.querySelector(".party-detail-actions")?.remove();
    const uid = root.querySelector(".detail-switcher")?.value;
    if (!pokemonRecord(uid)) return;
    const index = selected.indexOf(uid), footer = document.createElement("footer");
    footer.className = "party-detail-actions";
    if (index >= 0) {
      [["←", -1], ["→", 1]].forEach(([label, step]) => {
        const button = document.createElement("button"); button.type = "button"; button.className = "secondary-button"; button.textContent = label;
        button.setAttribute("aria-label", `Move ${pokemonNameFor(uid)} ${step < 0 ? "left" : "right"}`); button.disabled = index + step < 0 || index + step >= selected.length; button.onclick = () => move(uid, step); footer.append(button);
      });
      const button = document.createElement("button"); button.type = "button"; button.className = "primary-button"; button.textContent = "REMOVE FROM TEAM";
      button.onclick = () => { modal.querySelector(".detail-close").click(); remove(uid); }; footer.append(button);
    } else {
      const button = document.createElement("button"); button.type = "button"; button.className = "primary-button"; button.textContent = selected.length < selectionLimit ? "ADD TO TEAM" : "SWAP INTO TEAM";
      button.onclick = () => { modal.querySelector(".detail-close").click(); add(uid); }; footer.append(button);
    }
    card.append(footer);
  }
  const baseSummary = window.PokemonDetails.summary;
  window.PokemonDetails.summary = ref => { baseSummary(ref); enhanceDetails(); };
  const detailModal = document.querySelector(".pokemon-detail-modal");
  detailModal.addEventListener("change", enhanceDetails);
  detailModal.addEventListener("click", event => { if (!event.target.closest(".party-detail-actions,.detail-close")) enhanceDetails(); });

  window.PartyMobile = { arrange, add, remove, openSwap, coverage: coverageForParty };
  renderRoster();
})();

