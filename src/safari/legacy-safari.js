const SafariLegacyRuntime = window.YSRuntime;
const SAFARI_ZONES = [
  { id:"woodland", name:"Woodland Trail", unlock:0, min:3, max:18, levelBonus:1, types:["GRASS","BUG","NORMAL"], note:"Gentle paths · wild Pokémon scale to your team +1" },
  { id:"coast", name:"Coastal Route", unlock:2, min:12, max:34, levelBonus:1, types:["WATER","FLYING","ICE"], note:"Unlocked after Misty · new coastal encounters" },
  { id:"ridge", name:"Volcanic Ridge", unlock:4, min:24, max:52, levelBonus:2, types:["FIRE","ROCK","GROUND","FIGHTING"], note:"Unlocked after Gym 4 · rugged high-level encounters" },
  { id:"preserve", name:"Champion's Preserve", unlock:6, min:36, max:70, levelBonus:3, types:["DRAGON","PSYCHIC","ELECTRIC","NORMAL"], note:"Unlocked after Gym 6 · rare late-Kanto encounters" },
  { id:"dark", name:"Dark Safari", unlock:8, min:46, max:88, levelBonus:4, types:["GHOST","PSYCHIC","POISON","DARK"], note:"Unlocked after all eight badges · extremely rare corrupted variants can appear" }
];
let activeSafariZone = "woodland";
function currentSafariZone() { return SAFARI_ZONES.find(z => z.id === activeSafariZone && SafariLegacyRuntime.save.cupsCompleted >= z.unlock) || SAFARI_ZONES[0]; }
function safariSpeciesPool() {
  const zone = currentSafariZone();
  const legends = new Set(["articuno","zapdos","moltres","mew"]);
  const eligible = Object.keys(SPECIES).filter(id => id !== "mewtwo" && SPECIES[id].types.some(t => zone.types.includes(t)) && (!PRE_EVOLUTION[id] || SafariLegacyRuntime.save.cupsCompleted >= 6) && (!legends.has(id) || zone.id === "preserve"));
  return eligible.length ? eligible : Object.keys(SPECIES).filter(id => id !== "mewtwo" && !legends.has(id));
}
function safariEncounterLevel() {
  const zone = currentSafariZone();
  const average = Math.round(SafariLegacyRuntime.selectedIds.reduce((sum, uid) => sum + levelFor(uid), 0) / Math.max(1, SafariLegacyRuntime.selectedIds.length));
  // Safari difficulty comes from the habitat, never the global difficulty setting.
  // Keep the encounter readable and fair: the selected team's average + the zone threat bonus,
  // bounded by that habitat's intended progression band.
  return Math.max(zone.min, Math.min(zone.max, average + zone.levelBonus));
}
function renderSafariZonePicker() {
  let picker = document.getElementById("safari-zone-picker");
  if (!picker) { picker = document.createElement("div"); picker.id = "safari-zone-picker"; picker.className = "safari-zone-picker"; SafariLegacyRuntime.element("safari-field").before(picker); }
  picker.replaceChildren();
  SAFARI_ZONES.forEach(zone => {
    const unlocked = SafariLegacyRuntime.save.cupsCompleted >= zone.unlock;
    const button = document.createElement("button"); button.type = "button";
    button.className = "safari-zone-button" + (currentSafariZone().id === zone.id ? " selected" : "");
    button.disabled = !unlocked;
    button.textContent = unlocked ? zone.name : `${zone.name} · ${zone.unlock} badges`;
    button.setAttribute("aria-pressed", String(currentSafariZone().id === zone.id));
    button.addEventListener("click", () => { activeSafariZone = zone.id; renderSafariField(); });
    picker.appendChild(button);
  });
}
function showSafari() {
  if (window.SafariController?.open) return window.SafariController.open();
  if (!SafariLegacyRuntime.save.onboardingComplete || SafariLegacyRuntime.battle) return;
  setTeamSize(6);
  hideMainScreens();
  SafariLegacyRuntime.element("safari-screen").hidden = false;
  setActiveNav("safari-tab");
  renderSafariField();
}

function renderSafariField() {
  if (window.SafariController?.render) return window.SafariController.render();
  if (safariAggressionTimer) window.clearTimeout(safariAggressionTimer);
  renderSafariZonePicker();
  const zone = currentSafariZone();
  const pool = safariSpeciesPool();
  const uncaught = pool.filter(id => !SafariLegacyRuntime.save.owned.includes(id));
  const picks = shuffle(uncaught.length >= 6 ? uncaught : pool).slice(0, 6);
  const positions = [[18,31],[42,22],[70,31],[29,65],[55,60],[79,69]];
  SafariLegacyRuntime.element("safari-team-warning").hidden = SafariLegacyRuntime.selectedIds.length >= 1;
  SafariLegacyRuntime.element("safari-tier-copy").textContent = `${zone.name} · TEAM +${zone.levelBonus} · Lv ${zone.min}–${zone.max}. ${zone.note}. Select a Pokémon to approach.`;
  SafariLegacyRuntime.element("safari-field").innerHTML = "";
  let charging = null;
  picks.forEach((id, index) => {
    markSeen([id]);
    const mon = SPECIES[id];
    const aggressive = ["FIGHTING","DRAGON","POISON"].some(type => mon.types.includes(type)) || mon.stats[1] + mon.stats[5] > 185 || Math.random() < .22;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `safari-mon${aggressive ? " aggressive" : ""}`;
    button.style.left = `${positions[index][0]}%`;
    button.style.top = `${positions[index][1]}%`;
    button.innerHTML = `<img alt="${mon.name}"><span>${aggressive ? "! " : ""}${mon.name}</span>`;
    setSprite(button.querySelector("img"), id);
    button.addEventListener("click", () => startSafariEncounter(id));
    SafariLegacyRuntime.element("safari-field").appendChild(button);
    if (aggressive && !charging) charging = id;
  });
  SafariLegacyRuntime.persist();
  if (charging && SafariLegacyRuntime.selectedIds.length >= 1) safariAggressionTimer = window.setTimeout(() => {
    if (!SafariLegacyRuntime.battle && !SafariLegacyRuntime.element("safari-screen").hidden) startSafariEncounter(charging);
  }, 9000);
}

function startSafariEncounter(id) {
  if (window.BattleEntryUX?.canStartSafariEncounter && !window.BattleEntryUX.canStartSafariEncounter()) return;
  if (SafariLegacyRuntime.selectedIds.length < 1 || SafariLegacyRuntime.selectedIds.length > 6 || !SPECIES[id]) {
    SafariLegacyRuntime.element("safari-team-warning").hidden = false;
    return;
  }
  const enemyVariant = window.YSAdventureV58?.rollSafariVariant?.() || "";
  startBattle("safari", { enemyIds: [id], forcedLevel: safariEncounterLevel(), enemyVariant });
}

