
function renderShop() {
  renderRecord();
  els["shop-grid"].innerHTML = "";
  Object.entries(ITEMS).forEach(([id, item]) => {
    const unlocked = (!item.cups || save.cupsCompleted >= item.cups) && (!item.elite || save.eliteCompleted);
    const awardOnly = id === "masterBall" || item.rewardOnly;
    const card = document.createElement("article");
    card.className = `shop-card${unlocked ? "" : " locked"}`;
    card.dataset.item = id;
    const lockCopy = item.elite ? "DEFEAT THE ELITE FOUR" : item.cups ? `COMPLETE ${item.cups} CUPS` : "";
    const awardCopy = id === "masterBall" ? "CHAMPION PRIZE" : "BATTLE REWARD";
    const file = window.YS_SOURCE_ITEM_ICONS?.[id];
    const iconMarkup = file
      ? `<span class="item-icon source-backed" aria-hidden="true"><img class="source-item-img" src="${assetUrl(`./assets/items/${file}`)}" alt=""></span>`
      : `<span class="item-icon" aria-hidden="true">${({pokeBall:"◉",greatBall:"◉",ultraBall:"◉",superBall:"◉",masterBall:"◉",potion:"✚",superPotion:"✚",fullHeal:"✦",revive:"✧"})[id] || "◆"}</span>`;
    card.innerHTML = `${iconMarkup}<h3>${item.name} <small>×${save.inventory[id] || 0}</small></h3><p>${unlocked ? item.description : lockCopy}</p><footer><span>${awardOnly ? awardCopy : `● ${item.price}`}</span><button type="button" ${!unlocked || awardOnly || save.coins < item.price ? "disabled" : ""}>${awardOnly ? (id === "masterBall" ? "AWARDED" : "FIND IN BATTLE") : unlocked ? "BUY" : "LOCKED"}</button></footer>`;
    if (!awardOnly) card.querySelector("button").addEventListener("click", () => buyItem(id));
    els["shop-grid"].appendChild(card);
  });
  window.YSFlow?.emit("shop:rendered");
}

function buyItem(id) {
  const item = ITEMS[id];
  const unlocked = item && (!item.cups || save.cupsCompleted >= item.cups) && (!item.elite || save.eliteCompleted);
  if (!item || !unlocked || id === "masterBall" || item.rewardOnly || save.coins < item.price) return;
  save.coins -= item.price;
  save.inventory[id] = (save.inventory[id] || 0) + 1;
  writeSave();
  renderShop();
}

