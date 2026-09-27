/*
 * C3 private battle-presentation registries.
 *
 * This is a global lexical binding shared by the recovered classic-script slots,
 * but it is intentionally not attached to window. Only the canonical public
 * BattlePresentationDirector crosses the subsystem boundary.
 */
const YSPresentationInternals = Object.create(null);
const YSPresentationInstallers = Object.create(null);

function assetUrl(path) { return window.STADIUM_ASSETS?.[path] || path; }

const ASSET_DEMAND_GROUPS = Object.freeze({
  "intro-ui": Object.freeze([
    "./assets/trainers/prof.oak.png",
    "./assets/gen3/front/pikachu.png",
    "./assets/gen3/front/charmander.png",
    "./assets/gen3/front/squirtle.png",
    "./assets/gen3/front/bulbasaur.png",
  ]),
  "journey-ui": Object.freeze([
    "./assets/journey-v50/player_icon_red.png",
    "./assets/journey-v50/gym_sign.png",
    "./assets/journey-v50/leader_brock_front_pic.png",
    "./assets/journey-v50/leader_misty_front_pic.png",
    "./assets/journey-v50/leader_lt_surge_front_pic.png",
    "./assets/journey-v50/leader_erika_front_pic.png",
    "./assets/journey-v50/leader_koga_front_pic.png",
    "./assets/journey-v50/leader_sabrina_front_pic.png",
    "./assets/journey-v50/leader_blaine_front_pic.png",
    "./assets/journey-v50/leader_giovanni_front_pic.png",
  ]),
  "safari-ui": Object.freeze([
    "./assets/journey-v50/player_icon_red.png",
    "./assets/balls/poke.png",
    "./assets/balls/great.png",
    "./assets/balls/ultra.png",
    "./assets/balls/master.png",
    "./assets/items/poke_ball.png",
    "./assets/items/super_ball.png",
  ]),
  "battle-ui": Object.freeze([
    "./assets/balls/poke.png",
    "./assets/balls/great.png",
    "./assets/balls/ultra.png",
    "./assets/balls/master.png",
    "./assets/balls/safari.png",
    "./assets/balls/premier.png",
  ]),
});

/*
 * E2 demand loader.
 * Heavy scenic art is deliberately NOT in preload groups. It is assigned only
 * when its owning screen actually becomes active. Small recurrent UI art may be
 * warmed ahead of a transition. Browser cache remains the source of truth.
 */
const AssetDemand = (() => {
  const pending = new Map();
  const warmed = new Set();
  const normalize = path => assetUrl(path);

  function preload(path, priority = "auto") {
    const url = normalize(path);
    if (!url || warmed.has(url)) return Promise.resolve(url);
    if (pending.has(url)) return pending.get(url);
    if (typeof Image === "undefined") return Promise.resolve(url);
    const promise = new Promise(resolve => {
      const img = new Image();
      img.decoding = "async";
      try { img.fetchPriority = priority; } catch {}
      const finish = () => { warmed.add(url); pending.delete(url); resolve(url); };
      img.onload = finish;
      img.onerror = finish;
      img.src = url;
      if (img.complete) finish();
    });
    pending.set(url, promise);
    return promise;
  }

  function preloadGroup(name, priority = "low") {
    return Promise.all((ASSET_DEMAND_GROUPS[name] || []).map(path => preload(path, priority)));
  }

  function assignImage(image, path, { priority = "auto", loading = null } = {}) {
    if (!image) return null;
    const url = normalize(path);
    image.decoding = "async";
    if (loading) image.loading = loading;
    try { image.fetchPriority = priority; } catch {}
    if (image.getAttribute("src") !== url) image.src = url;
    warmed.add(url);
    return url;
  }

  function warmBattleMon(mon) {
    if (!mon?.id) return;
    preload(spriteUrl(mon.id, mon.side === "player"), "high");
  }

  // Small screen-specific assets are warmed just ahead of use.
  window.YSFlow?.on("nav:changed", ({ id }) => {
    if (id === "cups-tab") preloadGroup("journey-ui");
    else if (id === "safari-tab") preloadGroup("safari-ui");
  }, 90);
  window.YSFlow?.on("battle:beforeStart", ({ mode }) => {
    preloadGroup("battle-ui", "low");
    if (["trainer", "trainerDuo", "arcade"].includes(mode)) preload("./assets/stadium/arena.png", "high");
  }, 90);
  window.YSFlow?.on("battle:modelCreated", ({ mon }) => warmBattleMon(mon), 90);

  return Object.freeze({ groups: ASSET_DEMAND_GROUPS, preload, preloadGroup, assignImage, warmBattleMon });
})();

function spriteUrl(id, back = false) {
  const side = back ? "back" : "front";
  return assetUrl(`./assets/gen3/${side}/${id}.png`);
}

function setSprite(image, id, back = false) {
  const key = `${id}:${back ? "back" : "front"}`;
  const loaded = image.dataset.spriteKey === key && image.complete && image.naturalWidth > 0;
  if (loaded || image.dataset.spriteLoading === key) return;

  const request = String((Number(image.dataset.spriteRequest) || 0) + 1);
  // Retry the same color artwork; never silently switch to monochrome art.
  const candidates = [spriteUrl(id, back), spriteUrl(id, back)];
  let candidate = 0;

  image.dataset.spriteRequest = request;
  image.dataset.spriteLoading = key;
  delete image.dataset.spriteKey;
  image.onload = () => {
    if (image.dataset.spriteRequest !== request) return;
    image.dataset.spriteKey = key;
    delete image.dataset.spriteLoading;
    image.onload = null;
    image.onerror = null;
  };
  image.onerror = () => {
    if (image.dataset.spriteRequest !== request) return;
    candidate += 1;
    if (candidate < candidates.length) {
      image.src = candidates[candidate];
      return;
    }
    delete image.dataset.spriteLoading;
    delete image.dataset.spriteKey;
    image.onload = null;
    image.onerror = null;
    image.removeAttribute("src");
  };
  image.src = candidates[candidate];
}
