
"use strict";
(() => {
  const Runtime = window.YSRuntime;
  if (window.__YS_UI2_FINAL__) return;
  window.__YS_UI2_FINAL__ = true;

  const doc = document;
  const byId = id => doc.getElementById(id);
  const safe = fn => { try { return fn(); } catch (error) { console.warn("UI2", error); return null; } };

  const NAV = [
    ["cups-tab", "⌁", "JOURNEY"],
    ["trainer-tab", "♛", "CUPS"],
    ["safari-tab", "✦", "SAFARI"],
    ["collection-tab", "●", "PARTY"],
    ["bag-tab", "▤", "BAG"],
    ["pokedex-tab", "▣", "DEX"],
  ];

  function normalizeNav() {
    const nav = byId("mode-nav");
    if (!nav) return;
    for (const id of ["pokecenter-tab","shop-tab","settings-tab","joke-guide"]) {
      const node = byId(id);
      if (!node) continue;
      node.hidden = true;
      node.style.display = "none";
      node.setAttribute("aria-hidden", "true");
    }
    for (const [id, icon, label] of NAV) {
      const node = byId(id);
      if (!node) continue;
      node.hidden = false;
      node.style.display = "";
      node.removeAttribute("aria-hidden");
      node.dataset.ui2 = label.toLowerCase();
      if (!node.querySelector(".ui2-nav-icon")) node.innerHTML = `<span class="ui2-nav-icon" aria-hidden="true">${icon}</span><span class="ui2-nav-label">${label}</span>`;
      nav.appendChild(node);
    }
    nav.dataset.primaryCount = "6";
  }

  function decorateTopbar() {
    const top = doc.querySelector(".topbar");
    if (!top || top.dataset.ui2 === "true") return;
    top.dataset.ui2 = "true";
    const brand = top.querySelector(".brand");
    if (brand) {
      brand.classList.add("ui2-brand");
      brand.innerHTML = `<span class="brand-mark" aria-hidden="true"></span><span><b>YELLOW</b><em>STADIUM</em></span>`;
    }
    const identity = top.querySelector(".trainer-identity");
    if (identity) identity.classList.add("ui2-trainer-chip");
  }

  function serviceButton(label, cls, action) {
    const button = doc.createElement("button");
    button.type = "button";
    button.className = `secondary-button ${cls}`;
    button.innerHTML = label;
    button.addEventListener("click", action);
    return button;
  }

  function openPallet() {
    const panel = byId("map-stop");
    if (!panel) return;
    doc.querySelectorAll("#kanto-markers .map-marker").forEach(b => b.setAttribute("aria-pressed", "false"));
    const avatar = byId("journey-avatar");
    if (avatar) { avatar.style.left = "20%"; avatar.style.top = "72%"; }
    panel.style.setProperty("--gym-accent", "#f0b34b");
    panel.style.setProperty("--gym-wash", "#2f5139");
    panel.replaceChildren();

    const art = doc.createElement("div");
    art.className = "ui2-location-art ui2-pallet-art";
    art.innerHTML = `<span>⌂</span><small>HOME BASE</small>`;
    const text = doc.createElement("div");
    text.className = "ui2-location-copy";
    text.innerHTML = `<p class="v50-gym-kicker">KANTO · HOME BASE</p><h2>Pallet Town</h2><p class="stop-note">Your journey starts here. Use Pallet as a reliable service hub between adventures.</p><div class="ui2-location-chips"><span>HOME</span><span>TRAINER SERVICES</span><span>ROUTE 1</span></div>`;
    panel.append(art, text);

    const services = doc.createElement("div");
    services.className = "ui2-city-services ui2-pallet-services";
    services.innerHTML = `<p class="ui2-service-label">TOWN SERVICES</p>`;
    const actions = doc.createElement("div");
    actions.className = "ui2-service-actions";
    actions.append(
      serviceButton("✚ POKÉCENTER", "ui2-center-action", () => window.PokeCenter?.open?.()),
      serviceButton("▣ POKÉ MART", "ui2-mart-action", () => typeof showShop === "function" && showShop()),
      serviceButton("● MANAGE PARTY", "ui2-party-action", () => byId("collection-tab")?.click()),
    );
    services.append(actions);
    panel.append(services);
    panel.scrollIntoView?.({block:"nearest",behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
  }

  function ensureJourneyShell() {
    const screen = byId("cups-screen");
    const scroll = screen?.querySelector(".kanto-scroll");
    const map = byId("kanto-map");
    if (!screen || !scroll || !map) return;

    let banner = byId("ui2-map-banner");
    if (!banner) {
      banner = doc.createElement("section");
      banner.id = "ui2-map-banner";
      banner.className = "ui2-map-banner";
      banner.innerHTML = `<div><p class="eyebrow">KANTO REGION</p><h1>Your adventure continues.</h1><p>Tap an unlocked city to challenge its Gym, heal at the PokéCenter or stock up at the Poké Mart.</p></div><div class="ui2-map-key"><span><i class="next"></i>NEXT</span><span><i class="done"></i>CLEARED</span><span><i class="locked"></i>LOCKED</span></div>`;
    }
    if (scroll.firstElementChild !== banner) scroll.prepend(banner);

    const help = screen.querySelector(".map-help");
    if (help) help.textContent = "Cities are your travel menu. Pallet Town is your home-service hub; unlocked cities provide local services and Gym access.";

    let pallet = byId("ui2-pallet-node");
    if (!pallet) {
      pallet = doc.createElement("button");
      pallet.id = "ui2-pallet-node";
      pallet.type = "button";
      pallet.className = "ui2-service-map-node pallet";
      pallet.style.left = "20%";
      pallet.style.top = "72%";
      pallet.setAttribute("aria-label", "Pallet Town. Open town services.");
      pallet.innerHTML = `<span>⌂</span><b>PALLET</b>`;
      pallet.addEventListener("click", openPallet);
      map.append(pallet);
    }

    // Keep the map readable: only the current destination gets a full city label on mobile.
    map.querySelectorAll(".v50-city-label").forEach(label => {
      label.classList.toggle("ui2-minor-label", !label.classList.contains("current"));
    });
  }

  function decorateJourneyPanel() {
    const panel = byId("map-stop");
    if (!panel) return;
    panel.classList.add("ui2-destination-panel");
    panel.dataset.ui1Panel = "objective";
    const recap=byId("adventure-recap"); if(recap) recap.dataset.ui1Panel="recap";
    const party=byId("journey-party-panel"); if(party) party.dataset.ui1Panel="party";
    const banner=byId("ui2-map-banner"); if(banner) banner.dataset.ui1="map-panel";
    if (!panel.querySelector(".ui2-service-actions") && panel.children.length) {
      // Elite Four / legacy panels still receive utility services once the route is unlocked.
      const selected = doc.querySelector("#kanto-markers .map-marker[aria-pressed='true']");
      const stop = Number(selected?.dataset.stop);
      if (Number.isFinite(stop) && stop < 8 && stop <= (Runtime.save?.cupsCompleted ?? 0)) {
        const services = doc.createElement("div");
        services.className = "ui2-city-services";
        services.innerHTML = `<p class="ui2-service-label">CITY SERVICES</p>`;
        const actions = doc.createElement("div"); actions.className = "ui2-service-actions";
        actions.append(
          serviceButton("✚ POKÉCENTER", "ui2-center-action", () => window.PokeCenter?.open?.()),
          serviceButton("▣ POKÉ MART", "ui2-mart-action", () => typeof showShop === "function" && showShop()),
        );
        services.append(actions); panel.append(services);
      }
    }
  }

  function decorateHeadings() {
    const configs = [
      ["cups-screen","JOURNEY","KANTO REGION"],
      ["trainer-screen","CUPS","STADIUM CIRCUIT"],
      ["safari-screen","SAFARI","FIELD EXPEDITION"],
      ["select-screen","PARTY","YOUR PARTY"],
      ["bag-screen","BAG","BAG"],
      ["pokedex-screen","DEX","KANTO POKÉDEX"],
      ["shop-screen","MART","POKÉ MART"],
      ["pokecenter-screen","CENTER","POKÉCENTER"],
    ];
    configs.forEach(([id,key,kicker]) => {
      const screen = byId(id); if (!screen) return;
      screen.dataset.ui2Page = key.toLowerCase();
      const heading = screen.querySelector(":scope > .screen-heading");
      if (heading) {
        heading.classList.add("ui2-screen-heading");
        const eyebrow = heading.querySelector(".eyebrow"); if (eyebrow) eyebrow.textContent = kicker;
      }
    });
  }

  function decorateBattle() {
    const battle = byId("battle-screen");
    if (!battle) return;
    battle.classList.add("ui2-battle");
    const strip = battle.querySelector(".match-strip");
    if (strip) strip.classList.add("ui2-match-strip");
    const message = byId("message");
    if (message?.parentElement) message.parentElement.classList.add("ui2-dialogue-box");
  }

  function refresh() {
    doc.body.classList.add("yellow-ui2", "ys-facelift-v1");
    normalizeNav();
    decorateTopbar();
    ensureJourneyShell();
    decorateJourneyPanel();
    decorateHeadings();
    decorateBattle();
  }

  window.YSFlow?.on("app:rendered", () => setTimeout(refresh, 0), 200);
  window.YSFlow?.on("journey:rendered", () => setTimeout(refresh, 0), 200);
  window.YSFlow?.on("nav:changed", () => setTimeout(refresh, 0), 100);
  window.YSFlow?.on("battle:started", () => setTimeout(refresh, 0), 100);
  window.YSFlow?.on("battle:ui", () => decorateBattle(), -100);
  window.UI2 = Object.freeze({refresh,openPallet});
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", () => setTimeout(refresh, 50));
  else setTimeout(refresh, 50);
})();

