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
  const count = id => Math.max(0, Number(save?.inventory?.[id]) || 0);

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
    if (key === "record") renderRecord(target); else renderItems(target, key);
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
    bag.querySelectorAll("[data-bag-tab]").forEach(button => button.addEventListener("click", () => setTab(button.dataset.bagTab)));
    byId("bag-tab")?.addEventListener("click", open);
    byId("bag-shop-link")?.addEventListener("click", showShop);
    return bag;
  }

  window.BagSystem = Object.freeze({ init, open, render, setTab, count, defs: BAG_DEFS });
  init();
})();
