
"use strict";
(() => {
  const Runtime = window.YSRuntime;
  const byId = id => document.getElementById(id);
  const safe = fn => { try { return fn(); } catch (error) { console.warn("Journey controller", error); return null; } };

  function activePartyIds() {
    if (!Runtime?.save) return [];
    const source = Array.isArray(Runtime.save.adventurePartyInstanceIds) && Runtime.save.adventurePartyInstanceIds.length
      ? Runtime.save.adventurePartyInstanceIds
      : Array.isArray(Runtime.save.activePartyInstanceIds) && Runtime.save.activePartyInstanceIds.length
        ? Runtime.save.activePartyInstanceIds
        : Runtime.selectedIds.length
          ? Runtime.selectedIds
          : Array.isArray(Runtime.save.pokemon) ? Runtime.save.pokemon.map(mon => mon.uid) : [];
    return [...new Set(source.filter(uid => safe(() => pokemonRecord(uid))))].slice(0, 6);
  }

  function recordForUid(uid) {
    if (!Runtime?.save || !Array.isArray(Runtime.save.pokemon)) return null;
    return Runtime.save.pokemon.find(mon => mon.uid === uid) || null;
  }

  function renderPartyPanel() {
    const cups = byId("cups-screen");
    if (!cups) return;
    let panel = byId("journey-party-panel");
    if (!panel) {
      panel = document.createElement("section");
      panel.id = "journey-party-panel";
      panel.innerHTML = '<div class="journey-party-head"><div><p class="eyebrow">YOUR PARTY</p><h2>Travel with your team.</h2><p class="rules-note">Journey and party management now live together. Manage your six-slot adventure team here, then continue into Gyms or Safari.</p></div><div class="journey-party-actions"><button id="journey-manage-party" class="primary-button" type="button">MANAGE PARTY</button><button id="journey-open-safari" class="secondary-button" type="button">SAFARI FIELD</button></div></div><div id="journey-party-slots"></div>';
      const anchor = cups.querySelector(".kanto-scroll") || cups.firstElementChild;
      cups.insertBefore(panel, anchor);
      panel.querySelector("#journey-manage-party")?.addEventListener("click", () => safe(() => showCollection()));
      panel.querySelector("#journey-open-safari")?.addEventListener("click", () => byId("safari-tab")?.click());
    }
    const slots = panel.querySelector("#journey-party-slots");
    if (!slots) return;
    slots.replaceChildren();
    const ids = activePartyIds();
    for (let i = 0; i < 6; i += 1) {
      const uid = ids[i];
      const record = uid ? recordForUid(uid) : null;
      const card = document.createElement("button");
      card.type = "button";
      card.className = `journey-party-slot${record ? " filled" : ""}`;
      if (record && typeof SPECIES !== "undefined" && SPECIES[record.speciesId]) {
        const mon = SPECIES[record.speciesId];
        const level = safe(() => typeof levelFor === "function" ? levelFor(uid) : 5) || 5;
        card.innerHTML = `<span class="slot-index">${i + 1}</span><img alt=""><strong>${typeof pokemonNameFor === "function" ? pokemonNameFor(uid) : mon.name}</strong><small>L${level} · ${mon.types.join(" · ")}</small>`;
        const img = card.querySelector("img");
        if (img && typeof setSprite === "function") safe(() => setSprite(img, record.speciesId));
        card.addEventListener("click", () => safe(() => window.PokemonDetails?.summary?.(uid)));
      } else {
        card.innerHTML = `<span class="slot-index">${i + 1}</span><span class="journey-party-plus">+</span><strong>EMPTY SLOT</strong><small>Add a Pokémon</small>`;
        card.addEventListener("click", () => safe(() => showCollection()));
      }
      slots.append(card);
    }
  }

  function ensureCollectionReturn() {
    const heading = document.querySelector("#select-screen .screen-heading > div");
    if (!heading || byId("back-to-journey")) return;
    const button = document.createElement("button");
    button.id = "back-to-journey";
    button.type = "button";
    button.className = "secondary-button";
    button.textContent = "RETURN TO JOURNEY";
    button.addEventListener("click", show);
    heading.append(button);
  }

  function leaderPreviewData() {
    if (!Runtime?.save) return null;
    if (Runtime.save.cupsCompleted < 8 && typeof CUPS !== "undefined") {
      const cup = CUPS[Runtime.save.cupsCompleted];
      if (!cup) return null;
      return {
        eyebrow: "CURRENT GYM LEADER",
        title: `${cup.leader} · ${cup.badge} GYM`,
        copy: `You are currently challenging the ${cup.badge.toLowerCase()} badge. Build your party, scout the matchup, and head into ${cup.leader}'s arena when you're ready.`,
        tags: cup.types || [],
        sprite: safe(() => assetUrl(`./assets/trainers/${cup.sprite}.png`)),
        footer: Runtime.selectedIds.length === 3 ? "3-POKÉMON CUP TEAM READY" : "SELECT A 3-POKÉMON CUP TEAM",
        action: () => Runtime.selectedIds.length === 3 ? startCup(Runtime.save.cupsCompleted) : showCollection(),
        actionLabel: Runtime.selectedIds.length === 3 ? `CHALLENGE ${cup.leader}` : "SELECT CUP TEAM"
      };
    }
    if (!Runtime.save.eliteCompleted && typeof ELITE_FOUR !== "undefined") {
      const member = ELITE_FOUR[Runtime.save.eliteProgress] || ELITE_FOUR[0];
      return {
        eyebrow: "INDIGO PLATEAU",
        title: `${member.name} · ELITE FOUR`,
        copy: "All eight badges earned. The next challenge is at the Indigo Plateau.",
        tags: ["ELITE", "FOUR"],
        sprite: safe(() => assetUrl(`./assets/trainers/${member.sprite}.png`)),
        footer: Runtime.selectedIds.length === 3 ? "READY FOR THE ELITE FOUR" : "SELECT A 3-POKÉMON CUP TEAM",
        action: () => Runtime.selectedIds.length === 3 ? startElite() : showCollection(),
        actionLabel: Runtime.selectedIds.length === 3 ? `BATTLE ${member.name}` : "SELECT CUP TEAM"
      };
    }
    return null;
  }

  function ensureLeaderSpotlight() {
    const screen = byId("cups-screen");
    if (!screen) return null;
    let panel = byId("journey-leader-spotlight");
    if (!panel) {
      panel = document.createElement("section");
      panel.id = "journey-leader-spotlight";
      panel.className = "journey-leader-spotlight";
      const help = screen.querySelector(".map-help");
      if (help) help.before(panel); else screen.appendChild(panel);
    }
    return panel;
  }

  function renderLeaderSpotlight() {
    const panel = ensureLeaderSpotlight();
    const data = leaderPreviewData();
    if (!panel) return;
    if (!data) { panel.hidden = true; return; }
    panel.hidden = false;
    panel.innerHTML = `
      <div class="journey-leader-copy">
        <p class="eyebrow">${data.eyebrow}</p>
        <h2>${data.title}</h2>
        <p>${data.copy}</p>
        <div class="journey-leader-tags">${(data.tags || []).map(tag => `<span>${tag}</span>`).join("")}</div>
        <div class="journey-leader-actions">
          <button id="journey-spotlight-action" class="primary-button" type="button">${data.actionLabel} <span aria-hidden="true">›</span></button>
          <button id="journey-spotlight-party" class="secondary-button" type="button">MANAGE PARTY</button>
        </div>
      </div>
      <div class="journey-leader-figure">
        ${data.sprite ? `<img src="${data.sprite}" alt="${data.title}">` : ""}
        <b>${data.footer}</b>
      </div>`;
    panel.querySelector("#journey-spotlight-action")?.addEventListener("click", () => safe(() => data.action()));
    panel.querySelector("#journey-spotlight-party")?.addEventListener("click", () => safe(() => showCollection()));
  }

  function render() {
    renderPartyPanel();
    byId("journey-leader-spotlight")?.remove();
    window.YSAdventureV58?.renderPostgame?.();
  }

  function show() {
    if (!Runtime?.save?.onboardingComplete || Runtime.battle) return;
    safe(() => showCups());
    renderPartyPanel();
  }

  function init() {
    ensureCollectionReturn();
    window.BagSystem?.init?.();
    render();
    if (byId("bag-screen") && !byId("bag-screen").hidden) window.BagSystem?.render?.();
    if (Runtime?.save?.onboardingComplete && !Runtime.battle) show();
  }

  window.YSFlow?.on("app:rendered", () => {
    if (Runtime?.save?.onboardingComplete && !Runtime.battle) show();
  }, 50);
  window.YSFlow?.on("journey:rendered", render, 20);
  window.YSFlow?.on("party:shown", () => {
    ensureCollectionReturn();
    safe(() => setActiveNav("cups-tab"));
  }, 20);
  window.YSFlow?.on("party:rendered", () => {
    ensureCollectionReturn();
    renderPartyPanel();
  }, 10);

  window.JourneyController = Object.freeze({ init, show, render, renderLeaderSpotlight, activePartyIds, recordForUid, renderPartyPanel, ensureCollectionReturn });
  init();
})();

