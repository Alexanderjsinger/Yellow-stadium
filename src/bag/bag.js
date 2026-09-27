"use strict";
(() => {
  const doc = document;
  const byId = id => doc.getElementById(id);
  const safe = fn => { try { return fn(); } catch (error) { console.warn("Bag", error); return null; } };

  const BAG_DEFS = Object.freeze({
    balls: {
      label: "CAPTURE", icon: "◉", tone: "ball",
      items: [
        ["pokeBall", { name: "POKÉ BALL", description: "Catch weakened wild Pokémon in Safari mode." }],
        ["greatBall", { name: "GREAT BALL", description: "A stronger ball unlocked after the Cascade Cup." }],
        ["ultraBall", { name: "ULTRA BALL", description: "A high-performance ball unlocked after the Rainbow Cup." }],
        ["superBall", { name: "SUPER BALL", description: "A premium Stadium ball unlocked after the Marsh Cup." }],
        ["masterBall", { name: "MASTER BALL", description: "Awarded for defeating the Elite Four." }]
      ]
    },
    healing: {
      label: "RECOVERY", icon: "✚", tone: "healing",
      items: [
        ["potion", { name: "POTION", description: "Restore HP during battle." }],
        ["superPotion", { name: "SUPER POTION", description: "A stronger restorative item." }],
        ["fullHeal", { name: "FULL HEAL", description: "Clear a status condition." }],
        ["revive", { name: "REVIVE", description: "Revive a fainted teammate." }]
      ]
    },
    evo: {
      label: "GROWTH", icon: "◆", tone: "evo",
      items: [
        ["rareCandy", { name: "RARE CANDY", description: "Raises one Pokémon by one level." }],
        ["moonStone", { name: "MOON STONE", description: "Used for select evolution lines." }],
        ["fireStone", { name: "FIRE STONE", description: "Used for fire-based evolutions." }],
        ["waterStone", { name: "WATER STONE", description: "Used for water-based evolutions." }],
        ["thunderStone", { name: "THUNDER STONE", description: "Used for electric evolutions." }],
        ["leafStone", { name: "LEAF STONE", description: "Used for grass evolutions." }]
      ]
    },
    held: { label: "HELD", icon: "◈", tone: "boost", items: [] },
    record: { label: "RECORD", icon: "★", tone: "record", items: [] }
  });

  const screen = () => byId("bag-screen");
  const root = () => byId("bag-panel-root");
  const detail = () => byId("bag-detail-panel");
  const count = id => Math.max(0, Number(save?.inventory?.[id]) || 0);
  let selectedItemId = null;

  function activeTab() {
    const bag = screen();
    return BAG_DEFS[bag?.dataset.activeTab] ? bag.dataset.activeTab : "balls";
  }

  function setTab(key) {
    const bag = screen();
    if (!bag || !BAG_DEFS[key]) return false;
    bag.dataset.activeTab = key;
    render();
    return true;
  }

  function makeEmptyCard(title, copy) {
    const card = doc.createElement("article");
    card.className = "bag-card empty-state";
    card.innerHTML = `<span class="item-icon" data-empty="true">…</span><div><strong>${title}</strong><p>${copy}</p></div>`;
    return card;
  }

  function ensureDetail() {
    const bag = screen(), target = root();
    if (!bag || !target) return null;
    let panel = detail();
    if (!panel) {
      panel = doc.createElement("section");
      panel.id = "bag-detail-panel";
      panel.className = "bag-detail-panel";
      target.after(panel);
    }
    return panel;
  }

  function itemIconMarkup(id, tone, icon) {
    const file = window.YS_SOURCE_ITEM_ICONS?.[id];
    return file ? `<span class="item-icon ${tone} source-backed"><img class="source-item-img" src="${assetUrl(`./assets/items/${file}`)}" alt=""></span>` : `<span class="item-icon ${tone}">${icon}</span>`;
  }

  function showDetail(id, item, tone, icon) {
    const panel = ensureDetail(); if (!panel) return;
    selectedItemId = id;
    root()?.querySelectorAll(".bag-card[data-item]").forEach(card => card.classList.toggle("selected", card.dataset.item === id));
    const [label, run] = window.ItemSystem?.actionFor?.(id) || [ITEMS[id]?.rewardOnly ? "KEY / REWARD" : "INFO", null];
    panel.hidden = false;
    panel.innerHTML = `<header><span>ITEM INFO</span><b>×${count(id)}</b></header><div class="bag-detail-body">${itemIconMarkup(id,tone,icon)}<div><p class="bag-detail-kicker">${item.name}</p><h2>${item.name}</h2><p>${item.description || ITEMS[id]?.description || "Trainer item."}</p></div></div><div class="bag-detail-actions"><button type="button" class="primary-button bag-detail-use" ${!run || count(id)<=0 ? "disabled" : ""}>${label}</button></div>`;
    const action = panel.querySelector(".bag-detail-use");
    if (run && count(id) > 0) action.onclick = () => run();
  }

  function appendFieldAction(card, id) {
    const [label, run] = window.ItemSystem?.actionFor?.(id) || [ITEMS[id]?.rewardOnly ? "KEY / REWARD" : "INFO", null];
    const button = doc.createElement("button");
    button.type = "button";
    button.className = "bag-use-action";
    button.textContent = label;
    button.disabled = !run || count(id) <= 0;
    if (run) button.addEventListener("click", event => {
      event.stopPropagation();
      run();
    });
    card.appendChild(button);
  }

  function makeItemCard(id, item, tone, icon) {
    const card = doc.createElement("article");
    card.className = "bag-card";
    card.dataset.item = id;

    const iconEl = doc.createElement("span");
    iconEl.className = `item-icon ${tone}`;
    const file = window.YS_SOURCE_ITEM_ICONS?.[id];
    if (file) {
      iconEl.classList.add("source-backed");
      iconEl.innerHTML = `<img class="source-item-img" src="${assetUrl(`./assets/items/${file}`)}" alt="">`;
    } else {
      iconEl.textContent = icon;
    }

    const body = doc.createElement("div");
    const name = doc.createElement("strong");
    name.textContent = item.name;
    const description = doc.createElement("p");
    description.textContent = item.description;
    const quantity = doc.createElement("b");
    quantity.className = "bag-count";
    quantity.textContent = `× ${count(id)}`;
    body.append(name, description);
    card.append(iconEl, body, quantity);
    appendFieldAction(card, id);
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `${item.name}, quantity ${count(id)}. Show item details.`);
    const choose = event => { if (event?.target?.closest?.(".bag-use-action")) return; showDetail(id, item, tone, icon); };
    card.addEventListener("click", choose);
    card.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); showDetail(id, item, tone, icon); } });
    return card;
  }

  function renderRecord(target) {
    const summary = doc.createElement("article");
    summary.className = "bag-record";
    summary.innerHTML = `<h2>TRAINER RECORD</h2><p>${save.cupsCompleted}/8 badges · ${save.wins} wins · ${save.losses} losses · Best Stadium streak: ${save.bestTrainerStreak}</p>`;
    target.appendChild(summary);

    CUPS.forEach((cup, index) => {
      const earned = index < save.cupsCompleted;
      const card = doc.createElement("article");
      card.className = `bag-card badge-entry${earned ? " earned" : ""}`;
      const badge = doc.createElement("span");
      badge.className = "item-icon record";
      badge.textContent = cup.mark || "★";
      const body = doc.createElement("div");
      body.innerHTML = `<strong>${cup.badge} BADGE</strong><p>${cup.leader} · ${earned ? "Earned — Cup cleared" : "Not yet earned"}</p>`;
      card.append(badge, body);
      if (earned) {
        const replay = doc.createElement("button");
        replay.type = "button";
        replay.className = "secondary-button";
        replay.textContent = "REPLAY ›";
        replay.addEventListener("click", () => {
          showCups();
          safe(() => window.KantoMap?.inspect?.(index, true));
        });
        card.appendChild(replay);
      }
      target.appendChild(card);
    });
  }

  function appendMewEgg(target) {
    if (!save.mewEgg?.awarded || save.mewEgg.hatched) return;
    const progress = Math.max(0, Math.min(42, Number(save.mewEgg.progress) || 0));
    const card = doc.createElement("article");
    card.className = "bag-card v57-mew-egg-card";
    card.innerHTML = `<span class="item-icon" aria-hidden="true">◌</span><div><strong>MYSTERY EGG</strong><p>Professor Joke's gift. Complete battles to hatch the mythical Pokémon inside.</p><footer><span>${progress} / 42 BATTLES</span><progress max="42" value="${progress}"></progress></footer></div>`;
    target.prepend(card);
  }

  function renderItems(target, key) {
    const def = BAG_DEFS[key];
    const itemSource = key === "held"
      ? Object.entries(window.StadiumUpgrade?.equipment || {})
      : def.items;
    const visible = itemSource.filter(([id]) => count(id) > 0);
    visible.forEach(([id, item]) => target.appendChild(makeItemCard(id, item, def.tone, def.icon)));
    if (key === "evo") appendMewEgg(target);
    const preferred = visible.find(([id]) => id === selectedItemId) || visible[0];
    if (preferred) showDetail(preferred[0], preferred[1], def.tone, def.icon);
    else if (detail()) detail().hidden = true;
    if (!visible.length && !(key === "evo" && save.mewEgg?.awarded && !save.mewEgg.hatched)) {
      target.appendChild(makeEmptyCard("NONE STORED YET", `You do not have any ${def.label.toLowerCase()} items yet. Visit the Poké Mart or keep progressing through Kanto.`));
    }
  }

  function render() {
    const bag = screen();
    const target = root();
    if (!bag || !target) return false;
    const key = activeTab();
    target.replaceChildren();
    bag.querySelectorAll("[data-bag-tab]").forEach(button => button.setAttribute("aria-selected", String(button.dataset.bagTab === key)));
    if (key === "record") { renderRecord(target); if (detail()) detail().hidden = true; } else renderItems(target, key);
    window.YSFlow?.emit("bag:rendered", { tab: key });
    return true;
  }

  function open(event) {
    event?.preventDefault?.();
    if (!save.onboardingComplete || battle) return false;
    hideMainScreens();
    const bag = screen();
    if (!bag) return false;
    bag.hidden = false;
    setActiveNav("bag-tab");
    render();
    return true;
  }

  function init() {
    const bag = screen();
    if (!bag || bag.dataset.bagOwner === "canonical") return bag;
    bag.dataset.bagOwner = "canonical";
    bag.dataset.activeTab ||= "balls";
    if (!bag.querySelector(".bag-intro-copy")) {
      const intro = doc.createElement("p");
      intro.className = "bag-intro-copy";
      intro.textContent = "Use items, manage your bag, and give items to your Pokémon.";
      bag.querySelector(".screen-heading")?.after(intro);
    }
    ensureDetail();
    bag.querySelectorAll("[data-bag-tab]").forEach(button => {
      const def = BAG_DEFS[button.dataset.bagTab];
      if (def && !button.querySelector(".bag-tab-icon")) button.innerHTML = `<span class="bag-tab-icon" aria-hidden="true">${def.icon}</span><span>${def.label}</span>`;
      button.addEventListener("click", () => setTab(button.dataset.bagTab));
    });
    byId("bag-tab")?.addEventListener("click", open);
    byId("bag-shop-link")?.addEventListener("click", showShop);
    return bag;
  }

  window.BagSystem = Object.freeze({ init, open, render, setTab, count, defs: BAG_DEFS });
  init();
})();
