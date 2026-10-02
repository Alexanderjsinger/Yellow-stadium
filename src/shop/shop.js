"use strict";

let shopMode = "buy";
let shopSelectedId = null;
let shopQuantity = 1;
const SHOP_SELL_RATIO = .5;

function shopUnlocked(item) {
  return !!item && (!item.cups || save.cupsCompleted >= item.cups) && (!item.elite || save.eliteCompleted);
}

function shopAwardOnly(id, item) {
  return id === "masterBall" || !!item?.rewardOnly || Number(item?.price) <= 0;
}

function shopSellable(id, item) {
  return !!item && !shopAwardOnly(id, item) && Number(save.inventory?.[id] || 0) > 0;
}

function shopSellPrice(item) {
  return Math.max(0, Math.floor(Number(item?.price || 0) * SHOP_SELL_RATIO));
}

function shopItemIcon(id) {
  const file = window.YS_SOURCE_ITEM_ICONS?.[id];
  if (file) return `<img class="source-item-img" src="${assetUrl(`./assets/items/${file}`)}" alt="">`;
  return `<span aria-hidden="true">${({pokeBall:"◉",greatBall:"◉",ultraBall:"◉",superBall:"◉",potion:"✚",superPotion:"✚",fullHeal:"✦",revive:"✧"})[id] || "◆"}</span>`;
}

function shopCatalog() {
  return Object.entries(ITEMS).filter(([id, item]) => shopMode === "buy"
    ? !shopAwardOnly(id, item)
    : shopSellable(id, item));
}

function ensureShopSelection() {
  const catalog = shopCatalog();
  if (!catalog.some(([id]) => id === shopSelectedId)) shopSelectedId = catalog[0]?.[0] || null;
  shopQuantity = Math.max(1, Math.floor(Number(shopQuantity) || 1));
  const item = shopSelectedId ? ITEMS[shopSelectedId] : null;
  if (shopMode === "sell" && item) shopQuantity = Math.min(shopQuantity, Math.max(1, Number(save.inventory?.[shopSelectedId] || 0)));
  return { catalog, item };
}

function shopShelfCard(id, item) {
  const owned = Number(save.inventory?.[id] || 0);
  const selected = id === shopSelectedId;
  if (shopMode === "sell") {
    return `<button type="button" class="mart-shelf-item${selected ? " selected" : ""}" data-shop-select="${id}">
      <span class="mart-item-art">${shopItemIcon(id)}</span>
      <span><strong>${item.name}</strong><small>Store ● ${item.price} · You have ×${owned}</small></span>
      <b>SELL ● ${shopSellPrice(item)}</b>
    </button>`;
  }
  const unlocked = shopUnlocked(item);
  const lockCopy = item.elite ? "DEFEAT ELITE FOUR" : item.cups ? `COMPLETE ${item.cups} CUPS` : "LOCKED";
  return `<button type="button" class="mart-shelf-item${selected ? " selected" : ""}${unlocked ? "" : " locked"}" data-shop-select="${id}" ${unlocked ? "" : "disabled"}>
    <span class="mart-item-art">${shopItemIcon(id)}</span>
    <span><strong>${item.name}</strong><small>${unlocked ? `Owned ×${owned}` : lockCopy}</small></span>
    <b>${unlocked ? `● ${item.price}` : "LOCKED"}</b>
  </button>`;
}

function shopOrderCard(item) {
  if (!item || !shopSelectedId) {
    return `<article class="mart-order empty">
      <p class="eyebrow">${shopMode === "sell" ? "YOUR INVENTORY" : "ITEM SHELF"}</p>
      <h2>${shopMode === "sell" ? "Nothing to sell yet." : "No items available."}</h2>
      <p>${shopMode === "sell" ? "Items you can sell will appear here after you obtain them." : "Keep progressing through Kanto to unlock more supplies."}</p>
      ${shopMode === "sell" ? '<button type="button" class="primary-button" data-shop-mode="buy">GO TO BUY</button>' : ""}
    </article>`;
  }

  const owned = Number(save.inventory?.[shopSelectedId] || 0);
  const unit = shopMode === "buy" ? Number(item.price || 0) : shopSellPrice(item);
  const maxQty = shopMode === "sell"
    ? Math.max(1, owned)
    : Math.max(1, Math.min(99, unit > 0 ? Math.floor(Number(save.coins || 0) / unit) || 1 : 1));
  shopQuantity = Math.min(shopQuantity, maxQty);
  const total = unit * shopQuantity;
  const canConfirm = shopMode === "sell"
    ? owned >= shopQuantity && shopQuantity > 0
    : shopUnlocked(item) && Number(save.coins || 0) >= total && total > 0;
  const insufficient = shopMode === "buy" && Number(save.coins || 0) < total;

  return `<article class="mart-order" data-item="${shopSelectedId}">
    <div class="mart-order-art">${shopItemIcon(shopSelectedId)}</div>
    <div class="mart-order-copy">
      <p class="eyebrow">${shopMode === "buy" ? "BUY" : "SELL"} ${item.name}</p>
      <h2>${item.name}</h2>
      <p>${item.description || "Trainer equipment."}</p>
      <small>${shopMode === "buy" ? `● ${unit} each · You have ×${owned}` : `Store price ● ${item.price} · Sell price ● ${unit} each`}</small>
    </div>
    <div class="mart-stepper" aria-label="Quantity">
      <button type="button" data-shop-qty="-1" ${shopQuantity <= 1 ? "disabled" : ""}>−</button>
      <b>${shopQuantity}</b>
      <button type="button" data-shop-qty="1" ${shopQuantity >= maxQty ? "disabled" : ""}>+</button>
    </div>
    <div class="mart-total${insufficient ? " insufficient" : ""}">
      <span>TOTAL</span><strong>● ${total}</strong>
      ${shopMode === "buy" ? `<small>YOU HAVE ● ${save.coins}</small>` : ""}
    </div>
    <button type="button" class="primary-button mart-confirm" data-shop-confirm ${canConfirm ? "" : "disabled"}>
      ${shopMode === "buy" ? "CONFIRM PURCHASE" : "CONFIRM SALE"}
    </button>
  </article>`;
}

function bindShop() {
  const root = els["shop-grid"];
  root.querySelectorAll("[data-shop-mode]").forEach(button => button.addEventListener("click", () => {
    shopMode = button.dataset.shopMode;
    shopSelectedId = null;
    shopQuantity = 1;
    renderShop();
  }));
  root.querySelectorAll("[data-shop-select]").forEach(button => button.addEventListener("click", () => {
    shopSelectedId = button.dataset.shopSelect;
    shopQuantity = 1;
    renderShop();
  }));
  root.querySelectorAll("[data-shop-qty]").forEach(button => button.addEventListener("click", () => {
    shopQuantity = Math.max(1, shopQuantity + Number(button.dataset.shopQty || 0));
    renderShop();
  }));
  root.querySelector("[data-shop-confirm]")?.addEventListener("click", () => {
    if (shopMode === "buy") buyItem(shopSelectedId, shopQuantity);
    else sellItem(shopSelectedId, shopQuantity);
  });
}

function renderShop() {
  renderRecord();
  const root = els["shop-grid"];
  if (!root) return;
  const { catalog, item } = ensureShopSelection();
  root.innerHTML = `
    <section class="mart-shell" data-mode="${shopMode}">
      <header class="mart-counter">
        <div>
          <p class="eyebrow">POKÉ MART · BUY / SELL</p>
          <h1>${shopMode === "buy" ? "Stock up for your journey." : "Sell what you do not need."}</h1>
          <p>${shopMode === "buy" ? "Choose an item, set a quantity, then confirm your purchase." : "Sellable items return 50% of their store price, rounded down."}</p>
        </div>
        <div class="shop-balance" aria-label="${save.coins} coins"><span>●</span><b>${save.coins}</b></div>
      </header>
      <div class="mart-tabs" role="tablist" aria-label="Poké Mart mode">
        <button type="button" role="tab" data-shop-mode="buy" aria-selected="${shopMode === "buy"}">BUY</button>
        <button type="button" role="tab" data-shop-mode="sell" aria-selected="${shopMode === "sell"}">SELL</button>
      </div>
      <section class="mart-shelf" aria-label="${shopMode === "buy" ? "Item shelf" : "Your inventory"}">
        <header><strong>${shopMode === "buy" ? "ITEM SHELF" : "YOUR INVENTORY"}</strong><small>${shopMode === "buy" ? "SCROLL FOR MORE ›" : "TAP AN ITEM TO SELL"}</small></header>
        <div class="mart-shelf-scroll">${catalog.map(([id, entry]) => shopShelfCard(id, entry)).join("") || '<p class="mart-empty-copy">Nothing available here yet.</p>'}</div>
      </section>
      ${shopOrderCard(item)}
    </section>`;
  bindShop();
  window.YSFlow?.emit("shop:rendered", { mode: shopMode, selectedId: shopSelectedId, quantity: shopQuantity });
}

function buyItem(id, quantity = 1) {
  const item = ITEMS[id];
  const qty = Math.max(1, Math.min(99, Math.floor(Number(quantity) || 1)));
  const total = Number(item?.price || 0) * qty;
  if (!item || !shopUnlocked(item) || shopAwardOnly(id, item) || total <= 0 || save.coins < total) return false;
  save.coins -= total;
  save.inventory[id] = Number(save.inventory[id] || 0) + qty;
  writeSave();
  shopSelectedId = id;
  shopQuantity = 1;
  renderShop();
  return true;
}

function sellItem(id, quantity = 1) {
  const item = ITEMS[id];
  const owned = Number(save.inventory?.[id] || 0);
  const qty = Math.max(1, Math.min(owned, Math.floor(Number(quantity) || 1)));
  const unit = shopSellPrice(item);
  if (!shopSellable(id, item) || owned < qty || unit <= 0) return false;
  save.inventory[id] = owned - qty;
  save.coins += unit * qty;
  writeSave();
  shopSelectedId = save.inventory[id] > 0 ? id : null;
  shopQuantity = 1;
  renderShop();
  return true;
}
