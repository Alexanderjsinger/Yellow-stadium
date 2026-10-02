
"use strict";
(() => {
  if (window.__YS_INTERFACE_V42__) return;
  window.__YS_INTERFACE_V42__ = true;

  const Runtime = window.YSRuntime;
  const doc = document;
  const byId = id => doc.getElementById(id);
  const safe = fn => { try { return fn(); } catch (error) { console.warn("Interface V4.2", error); return null; } };

  const MODES = {
    "cups-screen": { key:"journey", label:"Journey", nav:"cups-tab", accent:"gold", gear:true, defaultGear:"party", defaultBag:"recovery", hint:"Prepare your team, review supplies and keep moving through Kanto." },
    "trainer-screen": { key:"cups", label:"Cups", nav:"trainer-tab", accent:"orange", gear:true, defaultGear:"bag", defaultBag:"held", hint:"Competition kit: held gear and recovery items matter most here." },
    "safari-screen": { key:"safari", label:"Safari", nav:"safari-tab", accent:"green", gear:true, defaultGear:"bag", defaultBag:"capture", hint:"Safari kit: check your Ball supply before wandering deeper." },
    "pokecenter-screen": { key:"center", label:"Center", nav:"pokecenter-tab", accent:"red", gear:false, defaultGear:null, defaultBag:null, hint:"Healing is free here." },
    "pokedex-screen": { key:"dex", label:"Dex", nav:"pokedex-tab", accent:"cyan", gear:false, defaultGear:null, defaultBag:null, hint:"Reference and collection progress." }
  };

  const ITEM_ICONS = Object.assign({
    pokeBall:"poke_ball.png", greatBall:"great_ball.png", ultraBall:"ultra_ball.png", superBall:"super_ball.png", masterBall:"master_ball.png",
    potion:"potion.png", superPotion:"potion.png", fullHeal:"full_heal.png", revive:"revive.png", rareCandy:"rare_candy.png",
    leftovers:"leftovers.png", quickClaw:"quick_claw.png", focusBand:"focus_band.png",
    fireStone:"fire_stone.png", waterStone:"water_stone.png", thunderStone:"thunder_stone.png", leafStone:"leaf_stone.png", moonStone:"moon_stone.png"
  }, window.YS_SOURCE_ITEM_ICONS || {});

  const BAG_GROUPS = {
    capture: { label:"CAPTURE", purpose:"Safari capture gear", items:["pokeBall","greatBall","ultraBall","superBall","masterBall"] },
    recovery: { label:"RECOVERY", purpose:"Field and battle recovery", items:["potion","superPotion","fullHeal","revive"] },
    growth: { label:"GROWTH", purpose:"Evolution and training", items:["moonStone","fireStone","waterStone","thunderStone","leafStone","rareCandy"] },
    held: { label:"HELD", purpose:"Passive battle equipment", items:[] }
  };

  const JOKES = {
    gymWin:["The badge was awarded. The excuses were not.","League officials described it as legally too much Pokémon.","The local gym insurance premium just went up."],
    gymLoss:["Turns out type charts are legally binding.","The rematch committee remains aggressively optimistic.","At least the dramatic exit had excellent pacing."],
    safariCatch:["A Safari guide quietly whispered, ‘nice.’","The wildlife paperwork is going to be unbearable.","Nature lost this round. Please remain humble."],
    safariMiss:["You ran home crying from sand in your eyes.","The Safari Zone has requested fewer emotional scenes.","Nature remains undefeated at being slippery."],
    cupWin:["Please report for the competition's completely fake drug test.","The confetti budget has once again been stretched beyond reason.","Stadium interns are still sweeping up the ego damage."],
    cupLoss:["The post-match interview was mostly heavy breathing.","The crowd respected the effort and booed fate itself.","Next time, try more winning. Analysts love that."],
    center:["Nurse Joy called it routine. The machine called it theater.","Modern medicine remains deeply overqualified for this task.","The recovery chime continues to carry the local economy."],
    generic:["Professor Joke insists this counts as field research.","Kanto remains alarmingly supportive of your nonsense.","A very serious announcer called it character development."]
  };

  const rand = list => list[Math.floor(Math.random() * list.length)] || "";
  const trainerName = () => Runtime.save?.playerProfile?.first?.trim?.() || "Trainer";
  const partyIds = () => window.JourneyController?.activePartyIds?.() || [];
  const partyRecord = uid => window.JourneyController?.recordForUid?.(uid) || Runtime.save?.pokemon?.find(mon => mon.uid === uid) || null;
  const leadName = () => { const uid = partyIds()[0]; return uid ? (safe(() => pokemonNameFor(uid)) || "their partner") : "their Pokémon"; };
  const currentGym = () => Runtime.save?.cupsCompleted < 8 ? CUPS?.[Runtime.save.cupsCompleted] || null : null;
  const nextAdventure = () => currentGym() ? `${currentGym().leader} · ${currentGym().badge} Gym` : !Runtime.save?.eliteCompleted ? "Indigo Plateau · Elite Four" : "Kanto Champion · Postgame";

  function normalizeNav() {
    const nav = byId("mode-nav"); if (!nav) return;
    const desired = ["cups-tab","trainer-tab","safari-tab","collection-tab","bag-tab","pokedex-tab"];
    const hidden = ["pokecenter-tab","shop-tab","settings-tab","joke-guide"];
    for (const id of hidden) {
      const node = byId(id); if (!node) continue;
      node.hidden = true; node.style.display = "none"; node.setAttribute("aria-hidden","true");
    }
    const labels = {"cups-tab":"JOURNEY","trainer-tab":"CUPS","safari-tab":"SAFARI","collection-tab":"PARTY","bag-tab":"BAG","pokedex-tab":"DEX"};
    desired.forEach(id => { const node = byId(id); if (!node) return; node.hidden=false; node.style.display=""; node.removeAttribute("aria-hidden"); node.textContent=labels[id]||node.textContent; nav.appendChild(node); });
    nav.style.gridTemplateColumns = "repeat(6,minmax(0,1fr))";
    nav.dataset.primaryCount = "6";
  }

  function tagScreens() {
    Object.entries(MODES).forEach(([id, mode]) => {
      const screen = byId(id); if (!screen) return;
      screen.dataset.mode = mode.key;
      screen.style.setProperty("--mode-accent-name", mode.accent);
      screen.classList.add("mode-screen", `mode-${mode.key}`);
      const heading = screen.querySelector(":scope > .screen-heading");
      if (heading) heading.classList.add("mode-masthead");
    });
  }

  function normalizePageOrder() {
    const journey = byId("cups-screen");
    if (journey) {
      const map = journey.querySelector(".kanto-scroll"), legend = journey.querySelector(".map-legend"), recap = byId("adventure-recap"), party = byId("journey-party-panel"), stop = byId("map-stop");
      if (map) {
        const heading = journey.querySelector(":scope > .screen-heading");
        if (heading && heading.nextElementSibling !== map) heading.after(map);
        if (legend && map.nextElementSibling !== legend) map.after(legend);
        if (recap && legend?.nextElementSibling !== recap) (legend || map).after(recap);
        if (party && recap?.nextElementSibling !== party) recap.after(party);
        if (stop && party?.nextElementSibling !== stop) party.after(stop);
      }
    }
    const cups = byId("trainer-screen");
    if (cups) {
      const run = cups.querySelector(".arcade-run-panel"), selector = byId("arcade-cup-grid");
      const heading = cups.querySelector(":scope > .screen-heading");
      if (run && heading && heading.nextElementSibling !== run) heading.after(run);
      if (selector && run && run.nextElementSibling !== selector) run.after(selector);
    }
  }

  function recordRecap(event) {
    if (!Runtime?.save || !event?.summary) return;
    const entry = { ...event, at:Date.now() };
    Runtime.updateSave(current => {
      current.lastAdventureRecap = entry;
      current.adventureLog = Array.isArray(current.adventureLog) ? current.adventureLog : [];
      current.adventureLog.unshift(entry);
      current.adventureLog = current.adventureLog.slice(0, 12);
    });
  }

  function defaultRecap() {
    const gym = currentGym();
    return {
      kind:"generic",
      summary:gym ? `${trainerName()} is crossing Kanto with ${leadName()} and preparing for ${gym.leader}'s ${gym.badge} Gym.` : `${trainerName()} has reached the late-game stretch of Kanto with ${leadName()} at their side.`,
      joke:rand(JOKES.generic)
    };
  }

  function recapData() { return Runtime.save?.lastAdventureRecap || defaultRecap(); }

  function ensureAdventureRecap() {
    const screen = byId("cups-screen"); if (!screen) return;
    let recap = byId("adventure-recap");
    if (!recap) { recap = doc.createElement("section"); recap.id = "adventure-recap"; recap.className = "adventure-recap"; }
    const data = recapData();
    recap.innerHTML = `<div class="adventure-recap-copy"><p class="eyebrow">ADVENTURE RECAP</p><h2>Last time on your journey…</h2><p>${data.summary}</p><blockquote><b>PROFESSOR JOKE'S NOTE</b>${data.joke || rand(JOKES.generic)}</blockquote></div><div class="adventure-recap-meta"><span>BADGES <b>${Runtime.save?.cupsCompleted || 0} / 8</b></span><span>NEXT <b>${nextAdventure()}</b></span></div>`;
    const legend = screen.querySelector(".map-legend"), map = screen.querySelector(".kanto-scroll");
    (legend || map)?.after(recap);
    const party = byId("journey-party-panel"); if (party) recap.after(party);
  }

  function removeDuplicateGymUI() {
    byId("journey-leader-spotlight")?.remove();
  }

  function gymBattleRecap(finished, victory) {
    const cup = CUPS?.[finished.cupIndex ?? Runtime.save?.cupsCompleted] || null; if (!cup) return;
    const round = Number(finished.cupRound ?? 0);
    const qualifier = CUP_ROUNDS?.[finished.cupIndex]?.[round];
    const finalRound = round >= 2;
    if (victory) {
      recordRecap({ kind:"gymWin", summary: finalRound ? `${trainerName()} defeated ${cup.leader} at the ${cup.badge} Gym with ${leadName()} leading the party.` : `${trainerName()} cleared ${qualifier?.name || "a Gym qualifier"} on the road to ${cup.leader}'s ${cup.badge} Gym.`, joke:rand(JOKES.gymWin) });
    } else {
      recordRecap({ kind:"gymLoss", summary: finalRound ? `${trainerName()} challenged ${cup.leader} for the ${cup.badge} Badge and got sent back to regroup.` : `${trainerName()} stumbled against ${qualifier?.name || "a Gym qualifier"} before reaching ${cup.leader}.`, joke:rand(JOKES.gymLoss) });
    }
  }

  function battleRecap(finished, victory) {
    if (!finished) return;
    if (finished.mode === "cup") return gymBattleRecap(finished, victory);
    if (finished.mode === "arcade") {
      const title = finished.arcadeStageTitle || ARCADE_CUPS?.[finished.arcadeCupIndex]?.name || "the Cup circuit";
      recordRecap({ kind:victory?"cupWin":"cupLoss", summary:victory ? `${trainerName()} cleared ${title} in the Cup circuit and kept the run alive.` : `${trainerName()} entered ${title} and watched the Cup run come apart under stadium lights.`, joke:rand(victory?JOKES.cupWin:JOKES.cupLoss) });
      return;
    }
    if (finished.mode === "safari") {
      const foe = finished.enemy?.[0]?.name || "a wild Pokémon";
      recordRecap({ kind:victory?"safariCatch":"safariMiss", summary:victory ? `${trainerName()} battled ${foe} in Safari and came out on top.` : `${trainerName()} tangled with ${foe} in Safari and retreated to regroup.`, joke:rand(victory?JOKES.safariCatch:JOKES.safariMiss) });
      return;
    }
    if (["elite","legendary","mewtwo"].includes(finished.mode)) {
      const foe = finished.trainer?.name || (finished.mode === "mewtwo" ? "Mewtwo" : "a legendary opponent");
      recordRecap({ kind:victory?"gymWin":"gymLoss", summary:victory ? `${trainerName()} overcame ${foe} and pushed deeper into Kanto's endgame.` : `${trainerName()} faced ${foe} and learned that legends hit extremely hard.`, joke:rand(victory?JOKES.gymWin:JOKES.gymLoss) });
    }
  }

  function itemIdsFor(group) {
    if (group !== "held") return BAG_GROUPS[group]?.items || [];
    const equipment = window.StadiumUpgrade?.equipment || {};
    return Object.keys(equipment).filter(id => (Runtime.save?.inventory?.[id] || 0) > 0 || ITEM_ICONS[id]);
  }

  function itemName(id) { return ITEMS?.[id]?.name || window.StadiumUpgrade?.equipment?.[id]?.name || id.replace(/([A-Z])/g," $1").toUpperCase(); }
  function itemDescription(id) { return ITEMS?.[id]?.description || window.StadiumUpgrade?.equipment?.[id]?.description || "Trainer equipment."; }

  function itemArt(id) {
    const file = ITEM_ICONS[id];
    if (file) return `<img class="source-item-img" src="${assetUrl(`./assets/items/${file}`)}" alt="">`;
    const initials = itemName(id).split(/\s+/).map(word => word[0]).join("").slice(0,2);
    return `<span class="purpose-item-glyph">${initials || "IT"}</span>`;
  }

  function itemAction(id, group) {
    const count = Runtime.save?.inventory?.[id] || 0;
    if (group === "capture") return { label:"SAFARI USE", enabled:false, run:null };
    if (group === "recovery") return { label:"USE", enabled:count>0 && !!window.ItemSystem?.useMedicine, run:()=>window.ItemSystem?.useMedicine?.(id) };
    if (group === "growth") {
      if (id === "rareCandy") return { label:"USE", enabled:count>0 && !!window.ItemSystem?.useCandy, run:()=>window.ItemSystem?.useCandy?.() };
      return { label:"USE", enabled:count>0 && !!window.ItemSystem?.useStone, run:()=>window.ItemSystem?.useStone?.(id) };
    }
    if (group === "held") return { label:"EQUIP", enabled:count>0 && !!window.ItemSystem?.equipHeld, run:()=>window.ItemSystem?.equipHeld?.(id) };
    return { label:"INFO", enabled:false, run:null };
  }

  function purposeLabel(group) {
    return ({capture:"SAFARI",recovery:"RECOVERY",growth:"GROWTH",held:"HELD GEAR"})[group] || "ITEM";
  }

  function renderItemCards(group) {
    const ids = itemIdsFor(group);
    if (!ids.length) return `<article class="utility-empty"><strong>No ${BAG_GROUPS[group]?.label?.toLowerCase() || "items"} yet.</strong><p>Keep progressing or visit the Poké Mart.</p></article>`;
    return ids.map(id => {
      const count = Runtime.save?.inventory?.[id] || 0, action = itemAction(id, group);
      return `<article class="utility-item" data-item="${id}"><span class="utility-item-art">${itemArt(id)}</span><div><small>${purposeLabel(group)}</small><strong>${itemName(id)}</strong><p>${itemDescription(id)}</p></div><div class="utility-item-side"><b>×${count}</b><button type="button" class="utility-item-action" data-item-action="${id}" ${action.enabled?"":"disabled"}>${action.label}</button></div></article>`;
    }).join("");
  }

  function partyCards() {
    const ids = partyIds();
    return Array.from({length:6},(_,index)=>{
      const uid = ids[index], record = uid ? partyRecord(uid) : null;
      if (!record || !SPECIES?.[record.speciesId]) return `<button type="button" class="utility-party-card empty" data-party-manage><span>${index+1}</span><strong>EMPTY SLOT</strong><small>Add a Pokémon</small></button>`;
      const state = safe(()=>window.YSAdventureV58?.adventureState?.(record)) || record.adventureState || {};
      const max = safe(()=>calculatedStats(record.speciesId,levelFor(uid)).hp) || state.hp || 1;
      const hp = Number.isFinite(state.hp) ? state.hp : max, pct=Math.max(0,Math.min(100,Math.round(hp/max*100)));
      return `<button type="button" class="utility-party-card" data-party-uid="${uid}"><span>${index+1}</span><img src="${assetUrl(SPECIES[record.speciesId].sprite)}" alt=""><strong>${safe(()=>pokemonNameFor(uid))||SPECIES[record.speciesId].name}</strong><small>L${safe(()=>levelFor(uid))||5}${state.status?` · ${state.status}`:""}</small><i><b style="width:${pct}%"></b></i></button>`;
    }).join("");
  }

  function gearStats() {
    const inventory = Runtime.save?.inventory || {};
    const total = Object.values(inventory).reduce((sum,value)=>sum+(Number(value)||0),0);
    return { total, party:partyIds().length, coins:Runtime.save?.coins || 0 };
  }

  function moduleContext(screenId) { return MODES[screenId] || MODES["cups-screen"]; }

  function ensureGearModule(screenId) {
    const screen = byId(screenId), mode = moduleContext(screenId); if (!screen || !mode.gear) return null;
    let module = screen.querySelector(`.trainer-gear[data-screen="${screenId}"]`);
    if (!module) {
      module = doc.createElement("section"); module.className="trainer-gear"; module.dataset.screen=screenId; module.dataset.open="false"; module.dataset.view=mode.defaultGear || "bag"; module.dataset.category=mode.defaultBag || "recovery";
      if (screenId === "pokecenter-screen") {
        const room=screen.querySelector(".pc-room"), footer=room?.querySelector(".pc-footer"); if (room && footer) room.insertBefore(module,footer); else (room||screen).appendChild(module);
      } else screen.appendChild(module);
    }
    return module;
  }

  function gearBody(module) {
    const screenId=module.dataset.screen, mode=moduleContext(screenId), stats=gearStats(), open=module.dataset.open==="true", view=module.dataset.view||mode.defaultGear||"bag", category=module.dataset.category||mode.defaultBag||"recovery";
    return `<div class="trainer-gear-summary"><div><p class="eyebrow">TRAINER GEAR</p><h2>Your field kit.</h2><p>${mode.hint}</p></div><div class="trainer-gear-stats"><span>BAG <b>${stats.total}</b></span><span>PARTY <b>${stats.party}/6</b></span><span>COINS <b>● ${stats.coins}</b></span></div></div><div class="trainer-gear-actions"><button type="button" data-gear-view="bag" aria-selected="${String(open&&view==="bag")}">BAG</button><button type="button" data-gear-view="party" aria-selected="${String(open&&view==="party")}">PARTY</button><button type="button" data-gear-view="mart" aria-selected="${String(open&&view==="mart")}">POKÉ MART</button></div><div class="trainer-gear-panel" ${open?"":"hidden"}>${view==="bag"?`<div class="utility-category-tabs">${Object.entries(BAG_GROUPS).map(([key,def])=>`<button type="button" data-bag-group="${key}" aria-selected="${String(category===key)}">${def.label}</button>`).join("")}</div><p class="utility-purpose">${BAG_GROUPS[category]?.purpose||"Trainer items"}</p><div class="utility-item-grid">${renderItemCards(category)}</div><div class="utility-footer"><button type="button" class="secondary-button" data-open-full-bag>OPEN FULL BAG</button></div>`:view==="party"?`<div class="utility-party-grid">${partyCards()}</div><div class="utility-footer"><button type="button" class="primary-button" data-party-manage>MANAGE PARTY <span>›</span></button></div>`:`<div class="utility-mart"><div><p class="eyebrow">POKÉ MART</p><h3>● ${stats.coins}</h3><p>Stock up on Balls, medicine and unlocked equipment.</p></div><button type="button" class="primary-button" data-open-shop>ENTER POKÉ MART <span>›</span></button></div>`}</div>`;
  }

  function bindGear(module) {
    module.querySelectorAll("[data-gear-view]").forEach(button=>button.addEventListener("click",()=>{
      const same=module.dataset.open==="true"&&module.dataset.view===button.dataset.gearView;
      module.dataset.open=String(!same); module.dataset.view=button.dataset.gearView; renderGear(module.dataset.screen);
    }));
    module.querySelectorAll("[data-bag-group]").forEach(button=>button.addEventListener("click",()=>{module.dataset.category=button.dataset.bagGroup;module.dataset.open="true";module.dataset.view="bag";renderGear(module.dataset.screen);}));
    module.querySelectorAll("[data-item-action]").forEach(button=>button.addEventListener("click",()=>{
      const id=button.dataset.itemAction, action=itemAction(id,module.dataset.category); if(!action.enabled||!action.run)return; action.run(); setTimeout(()=>renderGear(module.dataset.screen),80);
    }));
    module.querySelectorAll("[data-party-manage]").forEach(button=>button.addEventListener("click",()=>safe(()=>showCollection())));
    module.querySelectorAll("[data-party-uid]").forEach(button=>button.addEventListener("click",()=>safe(()=>window.PokemonDetails?.summary?.(button.dataset.partyUid))));
    module.querySelectorAll("[data-open-shop]").forEach(button=>button.addEventListener("click",()=>safe(()=>showShop())));
    module.querySelectorAll("[data-open-full-bag]").forEach(button=>button.addEventListener("click",()=>safe(()=>window.BagSystem?.open?.())));
  }

  function renderGear(screenId) {
    const module=ensureGearModule(screenId); if(!module)return; module.innerHTML=gearBody(module); bindGear(module);
  }

  function renderGearAll() { Object.keys(MODES).filter(id=>MODES[id].gear).forEach(renderGear); }

  function refineHeadings() {
    const copy = {
      "cups-screen":["KANTO JOURNEY","Your adventure across Kanto.","Travel the map, review what just happened, prepare your party and take on the next Gym."],
      "trainer-screen":["STADIUM CUPS","Enter the tournament circuit.","Choose a run, build a three-Pokémon team and survive every stage."],
      "safari-screen":["SAFARI FIELD","Explore. Discover. Catch.","Move through habitats with a partner at your side and build your collection."],
      "pokedex-screen":["KANTO POKÉDEX","Your field record.","Track what you have seen, caught and evolved across the original 151."],
    };
    Object.entries(copy).forEach(([id,[eyebrow,title,desc]])=>{
      const screen=byId(id), head=screen?.querySelector(":scope > .screen-heading > div:first-child"); if(!head)return;
      const e=head.querySelector(".eyebrow"),h=head.querySelector("h1"),p=head.querySelector(".rules-note"); if(e)e.textContent=eyebrow;if(h)h.textContent=title;if(p)p.textContent=desc;
    });
  }

  function refresh() {
    normalizeNav(); tagScreens(); removeDuplicateGymUI(); ensureAdventureRecap(); normalizePageOrder(); refineHeadings();
    byId("pokecenter-screen")?.querySelectorAll(".trainer-gear").forEach(node => node.remove());
    renderGearAll();
  }

  let lastSafariCatchAt = 0;
  let lastSafariCatchId = null;
  function logSafariCatch(name, id = null) {
    const now = Date.now();
    if (id && lastSafariCatchId === id && now - lastSafariCatchAt < 700) return;
    lastSafariCatchAt = now; lastSafariCatchId = id;
    recordRecap({kind:"safariCatch",speciesId:id,summary:`${trainerName()} encountered ${name||"a wild Pokémon"} in Safari and made the catch.`,joke:rand(JOKES.safariCatch)});
    setTimeout(refresh,0);
  }

  window.YSFlow?.on("battle:ended",({battle:finished,victory})=>{battleRecap(finished,victory);setTimeout(refresh,0);},-80);
  window.YSFlow?.on("pokemon:added",({id})=>{if(!Runtime.save?.onboardingComplete||Runtime.battle||!document.body.classList.contains("safari-b62-active"))return;logSafariCatch(SPECIES?.[id]?.name,id);},35);
  window.YSFlow?.on("safari:capture",({name,id})=>logSafariCatch(name,id),30);
  window.YSFlow?.on("safari:escape",({name})=>{recordRecap({kind:"safariMiss",summary:`${trainerName()} encountered ${name||"a wild Pokémon"} in Safari, missed the catch and watched it disappear into the habitat.`,joke:rand(JOKES.safariMiss)});setTimeout(refresh,0);},30);
  window.YSFlow?.on("safari:evade",({name})=>{recordRecap({kind:"safariMiss",summary:`${trainerName()} encountered ${name||"a wild Pokémon"} in Safari and decided discretion was the better part of survival.`,joke:rand(JOKES.safariMiss)});setTimeout(refresh,0);},30);
  window.YSFlow?.on("pokecenter:completed",()=>{recordRecap({kind:"center",summary:`${trainerName()} ran the whole party through the PokéCenter recovery machine and came out fully restored.`,joke:rand(JOKES.center)});setTimeout(refresh,0);},30);
  ["journey:rendered","party:rendered","trainer:shown","pokecenter:opened","shop:rendered","app:rendered","nav:changed"].forEach(event=>window.YSFlow?.on(event,()=>setTimeout(refresh,20),120));

  window.InterfaceV42 = Object.freeze({ refresh, renderGear, recapData, recordRecap });
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded",()=>setTimeout(refresh,40)); else setTimeout(refresh,40);
})();

