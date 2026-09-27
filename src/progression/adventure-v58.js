
/* Yellow Stadium v5.8 — runtime stability + playable progression.
   Six-slot adventure party, persistent Journey/Safari health, 3-mon Cup rosters,
   badge-gated Safari expansion, variants, Mew egg, legendary map encounters. */
"use strict";
(() => {
  const ADVENTURE_MODES = new Set(["cup", "safari", "elite", "legendary", "mewtwo"]);
  const LEGENDARIES = ["articuno", "zapdos", "moltres"];
  const VARIANTS = new Set(["shiny", "dark"]);
  let launchMode = null;

  save.adventureBattles = Math.max(0, Number(save.adventureBattles) || 0);
  save.adventurePartyInstanceIds = (save.adventurePartyInstanceIds || selected || []).filter(uid => pokemonRecord(uid)).slice(0, 6);
  if (!save.adventurePartyInstanceIds.length) save.adventurePartyInstanceIds = (selected || []).filter(uid => pokemonRecord(uid)).slice(0, 6);
  if (save.mewEgg && typeof save.mewEgg === "object") {
    save.mewEgg = { awarded: save.mewEgg.awarded === true, progress: Math.max(0, Math.min(42, Number(save.mewEgg.progress) || 0)), hatched: save.mewEgg.hatched === true };
  }

  function maxHp(record) {
    return calculatedStats(record.speciesId, levelFor(record.uid)).hp;
  }

  function adventureState(record) {
    if (!record) return null;
    const max = maxHp(record);
    record.adventureState ||= { hp: max, status: null, sleep: 0 };
    if (!Number.isFinite(record.adventureState.hp)) record.adventureState.hp = max;
    record.adventureState.hp = Math.max(0, Math.min(max, Math.floor(record.adventureState.hp)));
    record.adventureState.status = typeof record.adventureState.status === "string" ? record.adventureState.status : null;
    record.adventureState.sleep = Math.max(0, Math.floor(Number(record.adventureState.sleep) || 0));
    return record.adventureState;
  }

  function adventureParty() {
    return selected.filter(uid => pokemonRecord(uid)).slice(0, 6);
  }

  function hasHealthyAdventureMon() {
    return adventureParty().some(uid => {
      const record = pokemonRecord(uid), state = adventureState(record);
      return state && state.hp > 0;
    });
  }

  function syncBattleHealth(source = battle) {
    if (!source || !ADVENTURE_MODES.has(source.mode)) return;
    (source.player || []).forEach(mon => {
      const record = pokemonRecord(mon.companionUid || mon.id);
      if (!record) return;
      const state = adventureState(record), max = maxHp(record);
      state.hp = Math.max(0, Math.min(max, Math.floor(Number(mon.hp) || 0)));
      state.status = mon.status || null;
      state.sleep = mon.status === "SLP" ? Math.max(0, Math.floor(Number(mon.sleep) || 0)) : 0;
    });
  }

  // Player monsters hydrate from their durable adventure state only in Journey/Safari/postgame.
  // Cup Arcade and Exhibition always instantiate healed, making Cup rounds self-contained.
  window.YSFlow?.on("battle:modelCreated", ({ mon, ref, side }) => {
    if (side !== "player") return;
    const record = pokemonRecord(mon.companionUid || ref);
    mon.variant = VARIANTS.has(record?.variant) ? record.variant : "";
    if (mon.variant === "shiny" && !mon.name.startsWith("★ ")) mon.name = `★ ${mon.name}`;
    if (mon.variant === "dark" && !mon.name.startsWith("DARK ")) mon.name = `DARK ${mon.name}`;
    if (ADVENTURE_MODES.has(launchMode)) {
      const state = adventureState(record);
      if (state) {
        mon.hp = Math.max(0, Math.min(mon.maxHp, state.hp));
        mon.status = state.status || null;
        mon.sleep = mon.status === "SLP" ? state.sleep : 0;
      }
    }
  }, 30);

  function rollSafariVariant() {
    // Shiny rate stays rare; corrupted forms are exclusive to the post-badge Dark Safari.
    if (Math.random() < 1 / 4096) return "shiny";
    if (currentSafariZone?.().id === "dark" && Math.random() < 1 / 128) return "dark";
    return "";
  }

  function applyEnemyVariant(config = {}) {
    if (!battle) return;
    battle.enemy.forEach((mon, index) => {
      const variant = index === 0 ? config.enemyVariant : "";
      mon.variant = VARIANTS.has(variant) ? variant : "";
      if (mon.variant === "shiny") mon.name = `★ ${SPECIES[mon.id].name}`;
      else if (mon.variant === "dark") mon.name = `DARK ${SPECIES[mon.id].name}`;
    });
  }

  window.YSFlow?.on("battle:beforeStart", context => {
    const mode = context.mode;
    if (ADVENTURE_MODES.has(mode)) {
      if (!selected.length) {
        window.PartyTray?.open?.();
        context.cancel("no-adventure-party");
        return;
      }
      if (!hasHealthyAdventureMon()) {
        window.PokeCenter?.open?.({ fainted:true });
        context.cancel("adventure-party-fainted");
        return;
      }
    }
    launchMode = mode;
  }, 70);

  window.YSFlow?.on("battle:started", ({ battle: startedBattle, mode, config }) => {
    if (!startedBattle || startedBattle !== battle) return;
    applyEnemyVariant(config);
    const firstHealthy = battle.player.findIndex(mon => mon.hp > 0);
    if (firstHealthy >= 0 && battle.mode !== "trainerDuo") {
      battle.pActive = firstHealthy;
      if (battle.slots) battle.slots.player = [firstHealthy];
    }
    updateBattleUI?.();
  }, 30);

  window.YSFlow?.on("battle:startFinished", () => { launchMode = null; }, -100);


  function startLegendaryBattle(id) {
    if (!save.eliteCompleted || !LEGENDARIES.includes(id) || save.owned.includes(id)) return;
    setTeamSize(6);
    startBattle("legendary", {
      enemyIds: [id],
      forcedLevel: 55,
      trainer: { name: SPECIES[id].name.toUpperCase(), sprite: "psychic" },
      levelBonus: 2
    });
  }
  window.startLegendaryBattle = startLegendaryBattle;

  // Persist caught variants, adventure damage/status, and post-badge progression.
  let pendingAdventureResult = null;
  window.YSFlow?.on("battle:beforeEnd", ({ battle: finished }) => {
    if (!finished || finished.over) return;
    const eggWasActive = !!(save.mewEgg?.awarded && !save.mewEgg?.hatched);
    const caught = finished.captured ? activeEnemy?.() : null;
    pendingAdventureResult = { finished, eggWasActive, caught, caughtVariant: caught?.variant || "" };
    syncBattleHealth(finished);
  }, 30);

  window.YSFlow?.on("battle:ended", ({ battle: finished }) => {
    const pending = pendingAdventureResult;
    pendingAdventureResult = null;
    if (!finished || !pending || pending.finished !== finished) return;
    const { eggWasActive, caught, caughtVariant } = pending;

    if (finished.captured && caught && VARIANTS.has(caughtVariant)) {
      const candidates = save.pokemon.filter(record => record.speciesId === caught.id);
      const record = candidates[candidates.length - 1];
      if (record) record.variant = caughtVariant;
    }

    save.adventureBattles = (Number(save.adventureBattles) || 0) + 1;
    let extraReward = "";
    if (save.cupsCompleted >= 8 && !save.owned.includes("mew") && !save.mewEgg?.awarded) {
      save.mewEgg = { awarded: true, progress: 0, hatched: false };
      extraReward = "PROFESSOR JOKE GIFT · MYSTERY EGG RECEIVED";
    } else if (eggWasActive && save.mewEgg && !save.mewEgg.hatched) {
      save.mewEgg.progress = Math.min(42, (Number(save.mewEgg.progress) || 0) + 1);
      if (save.mewEgg.progress >= 42) {
        save.mewEgg.hatched = true;
        if (!save.owned.includes("mew")) addOwned("mew", 5);
        extraReward = "THE MYSTERY EGG HATCHED · MEW JOINED YOUR BOX";
      }
    }
    writeSave();

    if (extraReward && els?.reward) {
      const row = document.createElement("strong");
      row.className = "reward-major v57-progression-reward";
      row.innerHTML = `<span class="reward-icon">✦</span><span>${extraReward}<small>${save.mewEgg?.hatched ? "A mythical partner is waiting in your collection." : "Complete 42 more battles to hatch it."}</small></span>`;
      els.reward.append(row);
    }
    renderPostgame?.();
  }, -10);

  function legendaryCaughtCount() { return LEGENDARIES.filter(id => save.owned.includes(id)).length; }
  function allLegendariesCaught() { return legendaryCaughtCount() === LEGENDARIES.length; }

  // Post-Elite panel rendering is owned by Journey; this module owns postgame state/markers.
  const legendaryPositions = {
    articuno: [31, 80, "Seafoam Islands"],
    zapdos: [72, 25, "Power Plant"],
    moltres: [14, 24, "Victory Road"],
    mewtwo: [64, 10, "Cerulean Cave"]
  };
  function addPostgameMarkers() {
    if (!save.eliteCompleted) return;
    const holder = document.getElementById("kanto-markers");
    if (!holder) return;
    LEGENDARIES.forEach(id => {
      if (save.owned.includes(id)) return;
      const [x,y,place] = legendaryPositions[id], button = document.createElement("button");
      button.type = "button"; button.className = "v57-legendary-marker"; button.style.left = `${x}%`; button.style.top = `${y}%`; button.dataset.legendary = id;
      button.setAttribute("aria-label", `${SPECIES[id].name} encounter at ${place}`); button.title = `${SPECIES[id].name} · ${place}`; button.textContent = "!";
      button.onclick = event => { event.stopPropagation(); startLegendaryBattle(id); }; holder.append(button);
    });
    if (allLegendariesCaught() && !save.mewtwoDefeated) {
      const [x,y,place] = legendaryPositions.mewtwo, button = document.createElement("button");
      button.type = "button"; button.className = "v57-legendary-marker mewtwo"; button.style.left = `${x}%`; button.style.top = `${y}%`;
      button.setAttribute("aria-label", `Mewtwo encounter at ${place}`); button.title = `Mewtwo · ${place}`; button.textContent = "M";
      button.onclick = event => { event.stopPropagation(); startMewtwoBattle(); }; holder.append(button);
    }
  }

  function renderPostgame() {
    if (!document.getElementById("cups-screen")?.hidden) {
      renderElitePanel(); addPostgameMarkers();
    }
  }

  // Variant treatment stays cosmetic; battle math is untouched.
  window.YSFlow?.on("battle:ui", () => {
    if (!battle) return;
    const player = activePlayer?.(), enemy = activeEnemy?.();
    const ps = document.getElementById("player-sprite"), es = document.getElementById("enemy-sprite");
    if (ps) ps.dataset.variant = player?.variant || "";
    if (es) es.dataset.variant = enemy?.variant || "";
    const en = document.getElementById("enemy-name");
    if (en && enemy?.variant) en.dataset.variant = enemy.variant;
  }, -10);

  // Party cards surface persistent adventure HP so field-item decisions are readable.
  window.YSFlow?.on("party:rendered", () => {
    document.querySelectorAll(".party-entry").forEach(entry => {
      const uid = entry.querySelector("[data-companion-id]")?.dataset.companionId;
      const record = pokemonRecord(uid); if (!record) return;
      const state = adventureState(record), max = maxHp(record);
      let chip = entry.querySelector(".v57-adventure-health");
      if (!chip) { chip = document.createElement("span"); chip.className = "v57-adventure-health"; entry.append(chip); }
      chip.textContent = `${state.hp}/${max} HP${state.status ? ` · ${state.status}` : ""}${record.variant === "shiny" ? " · ★ SHINY" : record.variant === "dark" ? " · DARK" : ""}`;
      chip.dataset.health = state.hp <= 0 ? "fainted" : state.hp / max <= .25 ? "hurt" : state.hp / max <= .5 ? "tired" : "healthy";
    });
  }, 10);

  // B2: BagSystem owns all Bag DOM. Mew egg progress is rendered by the
  // canonical Growth tab from save.mewEgg, so progression no longer observes
  // or decorates the Bag subtree directly.

  // Ensure a legacy 3-slot save re-enters the game in standard six-slot adventure mode.
  if (save.onboardingComplete && !battle) {
    setTeamSize(6);
    showCups();
  }
  writeSave();

  const adventureApi = {
    version: "5.8",
    syncBattleHealth,
    adventureState,
    startLegendaryBattle,
    allLegendariesCaught,
    rollSafariVariant,
    renderPostgame,
    addPostgameMarkers
  };
  window.YSAdventureV58 = adventureApi;
  window.YSAdventureV57 = adventureApi; // backward-compatible alias for older debug hooks
})();

