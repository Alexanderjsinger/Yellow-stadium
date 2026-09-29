
"use strict";

// Stadium remix rules: modern damage categories, curated level unlocks,
// Gen II/III-inspired equipment, abilities, weather and doubles.
(() => {
  const original = { writeSave };
  const statusMove = (name, type, effect, extra = {}) => ({ name, type, effect, category: "STATUS", power: 0, accuracy: 100, pp: 20, ...extra });
  Object.assign(MOVES, {
    protect: statusMove("PROTECT", "NORMAL", "protect", { priority: 4, pp: 10, self: true }),
    substitute: statusMove("SUBSTITUTE", "NORMAL", "substitute", { self: true, pp: 10 }),
    swordsDance: statusMove("SWORDS DANCE", "NORMAL", "attackUp", { self: true }),
    calmMind: statusMove("CALM MIND", "PSYCHIC", "calmMind", { self: true }),
    workUp: statusMove("WORK UP", "NORMAL", "workUp", { self: true, pp: 30 }),
    scald: { name: "SCALD", type: "WATER", category: "SPECIAL", power: 80, accuracy: 100, pp: 15, status: "BRN", chance: 30 },
    toxic: statusMove("TOXIC", "POISON", "toxic", { accuracy: 90, pp: 10 }),
    confuseRay: statusMove("CONFUSE RAY", "GHOST", "confuse", { pp: 10 }),
    reflect: statusMove("REFLECT", "PSYCHIC", "reflect", { self: true }),
    lightScreen: statusMove("LIGHT SCREEN", "PSYCHIC", "lightScreen", { self: true }),
    spikes: statusMove("SPIKES", "GROUND", "spikes", { field: true }),
    rainDance: statusMove("RAIN DANCE", "WATER", "rain", { self: true, pp: 5 }),
    sunnyDay: statusMove("SUNNY DAY", "FIRE", "sun", { self: true, pp: 5 }),
    sandstorm: statusMove("SANDSTORM", "ROCK", "sand", { self: true, pp: 10 }),
    helpingHand: statusMove("HELPING HAND", "NORMAL", "help", { ally: true, priority: 5 }),
    thunder: { name: "THUNDER", type: "ELECTRIC", category: "SPECIAL", power: 110, accuracy: 70, pp: 10, status: "PAR", chance: 30 },
    ember: { name: "EMBER", type: "FIRE", category: "SPECIAL", power: 40, accuracy: 100, pp: 25, status: "BRN", chance: 10 },
    waterGun: { name: "WATER GUN", type: "WATER", category: "SPECIAL", power: 40, accuracy: 100, pp: 25 },
    vineWhip: { name: "VINE WHIP", type: "GRASS", category: "PHYSICAL", power: 45, accuracy: 100, pp: 25 },
    thunderShock: { name: "THUNDER SHOCK", type: "ELECTRIC", category: "SPECIAL", power: 40, accuracy: 100, pp: 30, status: "PAR", chance: 10 },
    confusion: { name: "CONFUSION", type: "PSYCHIC", category: "SPECIAL", power: 50, accuracy: 100, pp: 25, confuseChance: 10 },
    bite: { name: "BITE", type: "DARK", category: "PHYSICAL", power: 60, accuracy: 100, pp: 25, flinchChance: 30 },
    struggle: { name: "STRUGGLE", type: "NORMAL", category: "PHYSICAL", power: 50, accuracy: 100, pp: 1, recoil: true }
  });
  for (const id of ["rest", "recover", "agility"]) MOVES[id].self = true;
  for (const id of ["surf", "earthquake"]) MOVES[id].spread = "all";
  for (const id of ["rockSlide", "blizzard"]) MOVES[id].spread = "enemies";
  TYPE_CHART.DARK = { PSYCHIC: 2, GHOST: 2, FIGHTING: .5, DARK: .5 };

  const equipment = {
    oranBerry: { name: "ORAN BERRY", price: 100, description: "Held: restores 10 HP at half health. Once per match." },
    sitrusBerry: { name: "SITRUS BERRY", price: 250, description: "Held: restores 25% HP at half health. Once per match." },
    lumBerry: { name: "LUM BERRY", price: 250, description: "Held: cures status and confusion once per match." },
    leftovers: { name: "LEFTOVERS", price: 650, description: "Held: restores 1/16 HP at the end of each turn." },
    quickClaw: { name: "QUICK CLAW", price: 450, description: "Held: 20% chance to move first within your priority bracket." },
    focusBand: { name: "FOCUS BAND", price: 500, description: "Held: 10% chance to survive a direct knockout at 1 HP." },
    charcoal: { name: "CHARCOAL", price: 300, boost: "FIRE", description: "Held: Fire attacks deal 20% more damage." },
    mysticWater: { name: "MYSTIC WATER", price: 300, boost: "WATER", description: "Held: Water attacks deal 20% more damage." },
    miracleSeed: { name: "MIRACLE SEED", price: 300, boost: "GRASS", description: "Held: Grass attacks deal 20% more damage." },
    magnet: { name: "MAGNET", price: 300, boost: "ELECTRIC", description: "Held: Electric attacks deal 20% more damage." }
  };
  Object.entries(equipment).forEach(([id, item]) => { ITEMS[id] = { ...item, held: true }; });
  const abilityDescriptions = {
    blaze: "Fire moves gain 50% power at one-third HP.", torrent: "Water moves gain 50% power at one-third HP.",
    overgrow: "Grass moves gain 50% power at one-third HP.", swarm: "Bug moves gain 50% power at one-third HP.",
    intimidate: "Lowers opposing active Pokémon's Attack when entering.", levitate: "Immune to Ground attacks and Spikes.",
    static: "Contact attackers have a 30% chance to become paralyzed.", poisonPoint: "Contact attackers have a 30% chance to be poisoned.",
    waterAbsorb: "Water attacks heal 25% HP instead of damaging.", voltAbsorb: "Electric attacks heal 25% HP instead of damaging.",
    flashFire: "Absorbs Fire attacks, then boosts Fire power by 50%.", thickFat: "Takes half damage from Fire and Ice.",
    chlorophyll: "Doubles Speed in sunshine.", swiftSwim: "Doubles Speed in rain.",
    compoundEyes: "Move accuracy increases by 30%.", guts: "Attack increases by 50% while statused; ignores burn's Attack penalty.",
    insomnia: "Cannot fall asleep.", immunity: "Cannot be poisoned.", limber: "Cannot be paralyzed.",
    innerFocus: "Cannot flinch.", shellArmor: "Cannot take critical hits.", keenEye: "Accuracy cannot be lowered.",
    pressure: "Opposing moves targeting this Pokémon use an extra PP.", naturalCure: "Status clears when switching out.",
    shedSkin: "One-third chance to clear status after each turn.", rockHead: "Does not take attack recoil.",
    ownTempo: "Cannot be confused.", synchronize: "Reflects burns, poison and paralysis back to the attacker."
  };
  const abilityGroups = {
    blaze: "charmander charmeleon charizard", torrent: "squirtle wartortle blastoise", overgrow: "bulbasaur ivysaur venusaur",
    static: "pikachu raichu voltorb electrode electabuzz", levitate: "gastly haunter gengar koffing weezing",
    intimidate: "ekans arbok growlithe arcanine gyarados tauros", waterAbsorb: "poliwag poliwhirl poliwrath lapras vaporeon",
    voltAbsorb: "jolteon", flashFire: "vulpix ninetales ponyta rapidash", thickFat: "seel dewgong snorlax",
    chlorophyll: "oddish gloom vileplume bellsprout weepinbell victreebel exeggcute exeggutor tangela",
    swiftSwim: "horsea seadra goldeen seaking magikarp omanyte omastar kabuto kabutops", compoundEyes: "butterfree venonat",
    guts: "rattata raticate machop machoke machamp", insomnia: "drowzee hypno", limber: "persian ditto",
    innerFocus: "zubat golbat abra kadabra alakazam dragonite", shellArmor: "shellder cloyster krabby kingler",
    pressure: "articuno zapdos moltres mewtwo", naturalCure: "chansey staryu starmie", shedSkin: "metapod kakuna dratini dragonair",
    rockHead: "geodude graveler golem onix cubone marowak rhyhorn rhydon aerodactyl", ownTempo: "slowpoke slowbro lickitung",
    synchronize: "mew", poisonPoint: "nidoranf nidorina nidoqueen nidoranm nidorino nidoking",
    swarm: "beedrill paras parasect scyther pinsir"
  };
  const abilityById = {};
  Object.entries(abilityGroups).forEach(([ability, ids]) => ids.split(" ").forEach(id => { abilityById[id] = ability; }));
  const abilityFor = id => abilityById[id] || "keenEye";
  const title = word => String(word).replace(/([A-Z])/g, " $1").toUpperCase();
  const basicMoves = { FIRE: "ember", WATER: "waterGun", GRASS: "vineWhip", ELECTRIC: "thunderShock", PSYCHIC: "confusion", FLYING: "wingAttack", GHOST: "nightShade", FIGHTING: "doubleKick", BUG: "pinMissile", POISON: "tackle", GROUND: "tackle", ROCK: "tackle", ICE: "waterGun", NORMAL: "tackle", DRAGON: "tackle" };
  const extraMoves = {
    WATER: ["rainDance", "protect", "helpingHand"], FIRE: ["sunnyDay", "confuseRay", "protect"],
    GRASS: ["sunnyDay", "leechSeed", "toxic"], ELECTRIC: ["thunder", "lightScreen", "rainDance"],
    PSYCHIC: ["calmMind", "reflect", "lightScreen"], GHOST: ["confuseRay", "substitute", "toxic"],
    ROCK: ["sandstorm", "spikes", "protect"], GROUND: ["sandstorm", "swordsDance", "substitute"],
    BUG: ["swordsDance", "substitute", "toxic"], POISON: ["toxic", "confuseRay", "substitute"],
    FLYING: ["agility", "substitute", "protect"], NORMAL: ["helpingHand", "substitute", "protect"],
    ICE: ["reflect", "rainDance", "protect"], FIGHTING: ["swordsDance", "protect", "substitute"], DRAGON: ["rainDance", "agility", "protect"]
  };
  const identityGroups = [
    ['bulbasaur ivysaur venusaur','DRAIN CONTROL',[['leechSeed',5],['sleepPowder',10],['razorLeaf',16]]],
    ['charmander charmeleon charizard','FIRE PRESSURE',[['ember',1],['sunnyDay',12],['slash',18],['flamethrower',28]]],
    ['squirtle wartortle blastoise','BULKY WATER',[['waterGun',1],['protect',10],['scald',18],['surf',28]]],
    ['caterpie metapod butterfree weedle kakuna beedrill','DISRUPTIVE BUG',[['pinMissile',7],['sleepPowder',12],['substitute',18]]],
    ['pidgey pidgeotto pidgeot spearow fearow farfetchd doduo dodrio','FAST FLIER',[['quickAttack',5],['wingAttack',10],['agility',18]]],
    ['rattata raticate meowth persian eevee','FAST SKIRMISHER',[['quickAttack',5],['bite',10],['workUp',16],['bodySlam',24]]],
    ['ekans arbok grimer muk koffing weezing','POISON ATTRITION',[['toxic',10],['sludgeBomb',18],['protect',24]]],
    ['pikachu raichu voltorb electrode electabuzz','ELECTRIC TEMPO',[['thunderShock',1],['thunderWave',8],['agility',16],['thunderbolt',24]]],
    ['sandshrew sandslash diglett dugtrio cubone marowak','GROUND SWEEPER',[['sandstorm',8],['slash',14],['swordsDance',20],['earthquake',28]]],
    ['nidoranf nidorina nidoqueen nidoranm nidorino nidoking','MIXED BREAKER',[['doubleKick',8],['sludgeBomb',16],['earthquake',26]]],
    ['clefairy clefable jigglypuff wigglytuff chansey','SUPPORT WALL',[['sing',6],['lightScreen',12],['bodySlam',20],['rest',28]]],
    ['vulpix ninetales growlithe arcanine ponyta rapidash magmar','FIRE CONTROL',[['ember',1],['confuseRay',10],['sunnyDay',16],['flamethrower',26]]],
    ['zubat golbat','EVASIVE DISRUPTOR',[['wingAttack',6],['confuseRay',12],['toxic',20]]],
    ['oddish gloom vileplume bellsprout weepinbell victreebel tangela','STATUS GARDEN',[['leechSeed',5],['sleepPowder',10],['razorLeaf',16],['toxic',24]]],
    ['paras parasect venonat venomoth','SPORE HUNTER',[['sleepPowder',8],['xScissor',16],['swordsDance',24]]],
    ['psyduck golduck slowpoke slowbro poliwag poliwhirl poliwrath','RAIN BRAWLER',[['waterGun',1],['confusion',8],['rainDance',14],['surf',24]]],
    ['abra kadabra alakazam drowzee hypno mrmime','PSYCHIC CONTROL',[['confusion',1],['reflect',10],['calmMind',16],['psychic',24]]],
    ['mankey primeape machop machoke machamp hitmonlee hitmonchan','PHYSICAL BREAKER',[['doubleKick',5],['workUp',12],['brickBreak',18],['swordsDance',26]]],
    ['tentacool tentacruel shellder cloyster krabby kingler','DEFENSIVE WATER',[['waterGun',1],['protect',8],['scald',16],['blizzard',28]]],
    ['geodude graveler golem onix rhyhorn rhydon','ROCK FORTRESS',[['rockSlide',8],['sandstorm',12],['protect',18],['earthquake',28]]],
    ['magnemite magneton','ELECTRIC WALL',[['thunderShock',1],['lightScreen',10],['thunderWave',16],['thunderbolt',24]]],
    ['seel dewgong lapras jynx','ICE WALL',[['iceBeam',10],['reflect',16],['rest',22],['blizzard',30]]],
    ['gastly haunter gengar','GHOST TRICKSTER',[['nightShade',1],['hypnosis',8],['confuseRay',14],['shadowBall',22]]],
    ['kangaskhan tauros snorlax','HEAVY BRAWLER',[['workUp',8],['bodySlam',14],['earthquake',24],['rest',30]]],
    ['horsea seadra goldeen seaking staryu starmie','SWIFT WATER',[['waterGun',1],['agility',10],['rainDance',16],['scald',22]]],
    ['scyther pinsir','BUG SWEEPER',[['xScissor',8],['swordsDance',14],['slash',20]]],
    ['omanyte omastar kabuto kabutops aerodactyl','ANCIENT ATTACKER',[['rockSlide',10],['sandstorm',16],['slash',22],['surf',28]]],
    ['articuno','ICE TEMPEST',[['reflect',10],['agility',16],['iceBeam',20],['blizzard',28]]],
    ['zapdos','THUNDER TEMPEST',[['lightScreen',10],['agility',16],['thunderbolt',20],['thunder',28]]],
    ['moltres','FIRE TEMPEST',[['agility',10],['sunnyDay',16],['fireSpin',20],['flamethrower',28]]],
    ['dratini dragonair dragonite','DRAGON SETUP',[['agility',8],['dragonClaw',16],['rainDance',22],['hyperBeam',32]]]
  ];
  const identities={};
  identityGroups.forEach(([ids,role,moves])=>ids.split(' ').forEach(id=>{identities[id]={role,moves};}));
  const identityFor=id=>identities[id]||{role:'ADAPTABLE',moves:[]};
  function learnset(id) {
    const mon = SPECIES[id];
    const entries = [[basicMoves[mon.types[0]] || "tackle", 1], ["tackle", 1], ...identityFor(id).moves];
    mon.moves.forEach((move, i) => entries.push([move, [10, 16, 22, 28][i]]));
    mon.types.flatMap(type => extraMoves[type] || []).forEach((move, i) => entries.push([move, 12 + i * 4]));
    // Stadium-specific unlock levels; existing equipped moves are retained.
    if (mon.types.includes('WATER') && !['magikarp','gyarados'].includes(id)) entries.push(['scald', 18]);
    if (mon.types.some(type => ['NORMAL','FIGHTING'].includes(type)) || STARTER_IDS.includes(id)) entries.push(['workUp', 12]);
    const levels = new Map();
    entries.forEach(([move, level]) => { if (MOVES[move]) levels.set(move, Math.min(level, levels.get(move) ?? 100)); });
    return [...levels].map(([id, level]) => ({ id, level })).sort((a, b) => a.level - b.level);
  }
  function unlockedMoves(ref, level = levelFor(ref)) {
    const record=pokemonRecord(ref),id=record?.speciesId||ref;
    return [...new Set([...learnset(id).filter(entry => entry.level <= level).map(entry => entry.id), ...((record?.legacyMoves||save.legacyMoves?.[id]||[]).filter(move => MOVES[move]))])];
  }
  function movesFor(ref, side, level) {
    const record=side==="player"?pokemonRecord(ref):null,id=record?.speciesId||ref;
    const available = side === "player" ? unlockedMoves(record?.uid||id, level) : learnset(id).filter(entry => entry.level <= level).map(entry => entry.id);
    const equipped = side === "player" ? (record?.moveSet || save.moveSets?.[id] || []) : [];
    if (equipped.length) return [...new Set(equipped.filter(move => available.includes(move)))].slice(0, 4);
    const unique = [...new Set(available)];
    const attacks = unique.filter(id => MOVES[id].power).sort((a, b) => MOVES[b].power - MOVES[a].power).slice(0, 2);
    const tactics = unique.filter(id => !MOVES[id].power).slice(-2);
    return [...new Set([...attacks, ...tactics, ...unique])].slice(0, 4);
  }
  function migrateTraining() {
    save.moveSets ||= {};
    save.heldItems ||= {};
    save.legacyMoves ||= {};
    if (!save.trainingVersion) {
      save.owned.forEach(id => { save.legacyMoves[id] = [...SPECIES[id].moves]; save.moveSets[id] = [...SPECIES[id].moves]; });
      save.pokemon.forEach(mon=>{mon.legacyMoves=[...SPECIES[mon.speciesId].moves];mon.moveSet=[...SPECIES[mon.speciesId].moves];});
      save.trainingVersion = 1;
    }
  }
  migrateTraining();
  window.YSFlow?.on("app:rendered", migrateTraining, 100);
  original.writeSave();

  function renderTraining() {
    const root = els["training-content"];
    root.replaceChildren();
    const note = document.createElement("p");
    note.textContent = "Stadium remix learnsets: level up to unlock moves, then choose up to four. Existing moves are preserved. Held berries refresh between matches; one owned item per equipped Pokémon.";
    root.append(note);
    const picker = document.createElement("select");
    picker.setAttribute("aria-label", "Pokémon to train");
    save.pokemon.forEach(mon => picker.add(new Option(`${pokemonNameFor(mon.uid)} · L${levelFor(mon.uid)}`, mon.uid)));
    root.append(picker);
    const panel = document.createElement("div"); root.append(panel);
    function draw() {
      const uid = picker.value,record=pokemonRecord(uid); if (!record) return; const id=record.speciesId;
      panel.replaceChildren();
      const info = document.createElement("p"); info.textContent = `${identityFor(id).role} · ${title(abilityFor(id))} — ${abilityDescriptions[abilityFor(id)]}`; panel.append(info);
      const held = document.createElement("select"); held.setAttribute("aria-label", "Held item");
      held.add(new Option("No held item", ""));
      Object.entries(equipment).forEach(([key, item]) => {
        const used = save.pokemon.filter(mon => mon.uid !== uid && mon.heldItem === key).length;
        if ((save.inventory[key] || 0) > used) held.add(new Option(item.name, key));
      });
      held.value = record.heldItem || "";
      held.onchange = () => { record.heldItem = held.value; writeSave(); draw(); };
      panel.append(held);
      const hint = document.createElement("p"); hint.textContent = equipment[held.value]?.description || "Buy held items in the Item Shop, then equip them here."; panel.append(hint);
      const list = document.createElement("div"); list.className = "learnset";
      const equipped = movesFor(uid, "player", levelFor(uid));
      const all = [...learnset(id)];
      unlockedMoves(uid).forEach(move => { if (!all.some(e => e.id === move)) all.push({ id: move, level: 1 }); });
      all.forEach(entry => {
        const move = MOVES[entry.id]; const unlocked = unlockedMoves(uid).includes(entry.id);
        const button = document.createElement("button"); button.type = "button";
        button.className = "training-move"; button.disabled = !unlocked;
        button.setAttribute("aria-pressed", String(equipped.includes(entry.id)));
        button.textContent = `${equipped.includes(entry.id) ? "✓ " : ""}${move.name} · ${move.power || move.effect} · ${unlocked ? move.type : "L" + entry.level}`;
        button.title = `${move.category} · ${move.accuracy}% accuracy · ${move.pp} PP`;
        button.onclick = () => {
          let next = [...equipped];
          if (next.includes(entry.id)) { if (next.length === 1) return; next = next.filter(key => key !== entry.id); }
          else if (next.length < 4) next.push(entry.id);
          else { hint.textContent = "Remove one equipped move first (maximum four)."; return; }
          record.moveSet = next; writeSave(); draw();
        };
        list.append(button);
      });
      panel.append(list);
    }
    picker.onchange = draw; draw();
  }
  window.YSFlow?.on("party:rendered", renderTraining, 40);
  window.YSFlow?.on("battle:modelCreated", ({ mon, side }) => {
    const id=mon.id,record=mon.companionUid?pokemonRecord(mon.companionUid):null;
    mon.side = side; mon.ability = abilityFor(id);
    mon.held = side === "player" ? record?.heldItem || "" : "";
    mon.moveIds = movesFor(record?.uid||id, side, mon.level);
    if (!mon.moveIds.length) mon.moveIds = ["tackle"];
    mon.pp = mon.moveIds.map(id => MOVES[id].pp);
    mon.substitute = 0; mon.confusion = 0; mon.toxicTurns = 0; mon.protectChain = 0;
  }, 50);

  const active = side => battle.slots?.[side]?.map(i => battle[side][i]).filter(mon => mon && mon.hp > 0) || [side === "player" ? activePlayer() : activeEnemy()];
  const opposite = side => side === "player" ? "enemy" : "player";
  const living = side => battle[side].filter(mon => mon.hp > 0);
  const isActive = mon => active(mon.side).includes(mon);
  const screenFor = mon => battle?.screens?.[mon.side] || {};
  const grounded = mon => !mon.types.includes("FLYING") && mon.ability !== "levitate";
  const heal = (mon, amount) => { mon.hp = Math.min(mon.maxHp, mon.hp + Math.max(1, Math.floor(amount))); };
  const statChange = (mon, stat, amount) => { mon.stages[stat] = Math.max(-6, Math.min(6, mon.stages[stat] + amount)); };
  const log = text => {
    announce(text);
    battle.log ||= []; battle.log.push(text); battle.log = battle.log.slice(-80);
    const item = document.createElement("li"); item.textContent = text;
    els["battle-log"].append(item);
    while (els["battle-log"].children.length > 80) els["battle-log"].firstChild.remove();
  };
  const presentation = () => window.BattlePresentationDirector;
  async function present(method, ...args) {
    const service = presentation(), fn = service?.[method];
    if (typeof fn !== "function") return;
    let timer;
    try {
      await Promise.race([
        Promise.resolve(fn.apply(service, args)),
        new Promise(resolve => { timer = setTimeout(resolve, 1400); })
      ]);
    } catch (error) {
      console.warn(`Presentation step ${method} failed; continuing battle.`, error);
    } finally { clearTimeout(timer); }
  }
  function syncLegacyActive(side) {
    if (!battle?.slots?.[side]) return;
    const key = side === "player" ? "pActive" : "eActive";
    const next = battle.slots[side].find(index => index >= 0 && battle[side][index]?.hp > 0);
    if (next !== undefined) battle[key] = next;
  }
  function syncLegacyActiveIndexes() { syncLegacyActive("player"); syncLegacyActive("enemy"); }
  async function say(text) { log(text); updateBattleUI(); await delay(presentation()?.delay(300) ?? 300); }
  function speed(mon) {
    let value = effectiveStat(mon, "speed");
    if ((mon.ability === "chlorophyll" && battle.weather === "sun") || (mon.ability === "swiftSwim" && battle.weather === "rain")) value *= 2;
    return value;
  }
  function immunity(mon, move) {
    if (move.id === "struggle" || move.recoil) return false;
    return (move.type === "GROUND" && mon.ability === "levitate") ||
      (move.type === "WATER" && mon.ability === "waterAbsorb") ||
      (move.type === "ELECTRIC" && mon.ability === "voltAbsorb") ||
      (move.type === "FIRE" && mon.ability === "flashFire") || effectiveness(move.type, mon) === 0;
  }
  function setStatus(mon, status, source = null) {
    if (!canInflictStatus(mon, status)) return false;
    mon.status = status;
    if (status === "SLP") mon.sleep = 2 + Math.floor(Math.random() * 3);
    if (status === "TOX") mon.toxicTurns = 0;
    if (source && mon.ability === "synchronize" && ["BRN", "PSN", "TOX", "PAR"].includes(status)) setStatus(source, status);
    return true;
  }
  function damage(attacker, defender, move, randomize = true, spread = false) {
    if (immunity(defender, move)) return { damage: 0, critical: false };
    if (move.fixed) return { damage: attacker.level, critical: false };
    const critical = randomize && defender.ability !== "shellArmor" && Math.random() < (move.highCrit ? .125 : 1 / 24);
    const special = move.category === "SPECIAL";
    const atkKey = special ? "specialAttack" : "attack", defKey = special ? "specialDefense" : "defense";
    let atk = attacker[atkKey] * stageMultiplier(critical ? Math.max(0, attacker.stages[atkKey]) : attacker.stages[atkKey]);
    const def = defender[defKey] * stageMultiplier(critical ? Math.min(0, defender.stages[defKey]) : defender.stages[defKey]);
    if (!special && attacker.status === "BRN" && attacker.ability !== "guts") atk *= .5;
    if (!special && attacker.status && attacker.ability === "guts") atk *= 1.5;
    let scale = (attacker.types.includes(move.type) ? 1.5 : 1) * (move.recoil ? 1 : effectiveness(move.type, defender));
    if (equipment[attacker.held]?.boost === move.type) scale *= 1.2;
    if (attacker.hp <= attacker.maxHp / 3 && { blaze: "FIRE", torrent: "WATER", overgrow: "GRASS", swarm: "BUG" }[attacker.ability] === move.type) scale *= 1.5;
    if (attacker.flashFire && move.type === "FIRE") scale *= 1.5;
    if (defender.ability === "thickFat" && ["FIRE", "ICE"].includes(move.type)) scale *= .5;
    if (["rain", "sun"].includes(battle?.weather) && ["WATER", "FIRE"].includes(move.type)) scale *= (battle.weather === "rain") === (move.type === "WATER") ? 1.5 : .5;
    if (!critical && screenFor(defender)[special ? "lightScreen" : "reflect"] > 0) scale *= battle.mode === "trainerDuo" ? 2 / 3 : .5;
    if (attacker.helped) scale *= 1.5;
    if (spread) scale *= .75;
    scale *= critical ? 1.5 : 1;
    scale *= randomize ? .85 + Math.random() * .15 : .925;
    scale *= 1.08; // v4.6: small symmetric damage lift to reduce low-level battle drag.
    const base = Math.floor(((2 * attacker.level / 5 + 2) * move.power * atk / Math.max(1, def)) / 50) + 2;
    return { damage: Math.max(1, Math.floor(base * scale)), critical };
  }
  estimateDamage = (a, d, move) => move.power ? damage(a, d, move, false).damage : 0;
  calculateDamage = (a, d, move) => damage(a, d, move);

  async function berry(mon) {
    if (mon.hp <= 0 || mon.usedBerry) return;
    if (["oranBerry", "sitrusBerry"].includes(mon.held) && mon.hp <= mon.maxHp / 2) {
      heal(mon, mon.held === "oranBerry" ? 10 : mon.maxHp / 4); mon.usedBerry = true;
      await say(`${mon.name}'s ${equipment[mon.held].name} restored HP!`);
    } else if (mon.held === "lumBerry" && (mon.status || mon.confusion)) {
      mon.status = null; mon.confusion = 0; mon.usedBerry = true;
      await say(`${mon.name}'s LUM BERRY cured it!`);
    }
  }
  function clearVolatile(mon) {
    mon.seeded = false; mon.trappedTurns = 0; mon.confusion = 0; mon.substitute = 0; mon.protectChain = 0; mon.toxicTurns = 0;
    mon.protected = false; mon.helped = false; mon.flinched = false; mon.recharge = false;
    Object.keys(mon.stages).forEach(key => { mon.stages[key] = 0; });
    if (mon.ability === "naturalCure") mon.status = null;
  }
  async function announceEncounterEntry(mon) {
    if (battle.encounter !== "boulderFinal" || mon.side !== "enemy" || mon.encounterAnnounced) return;
    const phase = battle.enemy.indexOf(mon);
    const script = [
      `${mon.name} opens Brock's plan: expect SANDSTORM to reshape the field.`,
      `${mon.name} begins the second phase: SPIKES will punish careless switching.`,
      `ACE MOMENT · ${mon.name} is Brock's last stand. It will attack hard and protect when pressured.`
    ][phase];
    if (!script) return;
    mon.encounterAnnounced = true;
    battle.encounterPhase = phase;
    battle.encounterEvents ||= [];
    battle.encounterEvents.push(encounters.boulderFinal.phases[phase]);
    if (mon.isAce) {
      battle.aceAnnounced = true;
      els["battle-screen"].classList.add("ace-moment");
      window.setTimeout(() => els["battle-screen"].classList.remove("ace-moment"), 750);
      presentation()?.impactLabel(mon, "BROCK'S ACE");
    }
    await say(script);
  }
  async function enter(mon) {
    if (!mon || mon.hp <= 0) return;
    await present("sendOut", mon);
    playCry(mon);
    await announceEncounterEntry(mon);
    const layers = battle.spikes[mon.side];
    if (layers && grounded(mon)) {
      mon.hp = Math.max(0, mon.hp - Math.max(1, Math.floor(mon.maxHp * [0, 1/8, 1/6, 1/4][layers])));
      await say(`${mon.name} was hurt by SPIKES!`);
    }
    if (mon.hp > 0 && mon.ability === "intimidate") {
      active(opposite(mon.side)).forEach(target => statChange(target, "attack", -1));
      await say(`${mon.name}'s INTIMIDATE lowered the opposing Attack!`);
    }
    await berry(mon);
  }
  async function fillSlots() {
    for (const side of ["player", "enemy"]) {
      for (let slot = 0; slot < battle.slots[side].length; slot++) {
        const current = battle[side][battle.slots[side][slot]];
        if (current?.hp > 0) continue;
        if (current && !current.faintAnnounced) { current.faintAnnounced = true; await present("faint", current); await say(`${current.name} fainted!`); }
        const next = battle[side].findIndex((mon, i) => mon.hp > 0 && !battle.slots[side].includes(i));
        battle.slots[side][slot] = next; syncLegacyActive(side);
        if (next >= 0) { await say(`${side === "player" ? "Go" : "Opponent sent out"}, ${battle[side][next].name}!`); await enter(battle[side][next]); if (battle[side][next].hp <= 0) slot--; }
      }
    }
    if (!living("player").length || !living("enemy").length) { endBattle(living("player").length > 0 && !living("enemy").length); return false; }
    return true;
  }
  const strategies = {
    rain: { label: "RAIN COMBOS", plan: "Sets rain, then chains fast Water attacks with accurate Thunder.", types: ["WATER", "ELECTRIC"], moves: ["rainDance", "thunder", "protect"] },
    sun: { label: "SUN OFFENSE", plan: "Uses sunlight to power Fire attacks and enable an early sweep.", types: ["FIRE", "GRASS"], moves: ["sunnyDay", "swordsDance", "protect"] },
    defense: { label: "SCREENS & RECOVERY", plan: "Builds screens, absorbs pressure and wins the long exchange.", types: ["PSYCHIC", "NORMAL", "ICE"], moves: ["reflect", "lightScreen", "recover"] },
    control: { label: "STATUS PRESSURE", plan: "Disrupts your rhythm with poison, confusion and decoys.", types: ["POISON", "GHOST", "GRASS"], moves: ["toxic", "confuseRay", "substitute"] },
    setup: { label: "SETUP SWEEPERS", plan: "Looks for one safe turn to boost, then attacks relentlessly.", types: ["FIGHTING", "BUG", "DRAGON"], moves: ["swordsDance", "calmMind", "agility"] },
    sand: { label: "HAZARDS & SWITCHES", plan: "Lays hazards, starts sand and punishes repeated switching.", types: ["GROUND", "ROCK"], moves: ["spikes", "sandstorm", "protect"] },
    brock: { label: "ROCK-SOLID DEFENSE", plan: "Brock fortifies the field, then outlasts reckless attacks.", types: ["ROCK", "GROUND", "FIGHTING"], moves: ["sandstorm", "spikes", "protect"] },
    misty: { label: "RAIN & SPEED", plan: "Misty accelerates in rain and keeps up constant Water pressure.", types: ["WATER", "ICE"], moves: ["rainDance", "scald", "agility"] },
    surge: { label: "PARALYSIS PRESSURE", plan: "Surge slows your team before delivering heavy Electric attacks.", types: ["ELECTRIC", "NORMAL"], moves: ["thunderWave", "lightScreen", "agility"] },
    erika: { label: "SLEEP & DRAIN", plan: "Erika disables threats, plants Leech Seed and drains them down.", types: ["GRASS", "POISON", "BUG"], moves: ["sleepPowder", "leechSeed", "toxic"] },
    koga: { label: "TOXIC TRAPS", plan: "Koga layers poison and hazards, then stalls for mounting damage.", types: ["POISON", "GHOST", "BUG"], moves: ["toxic", "spikes", "protect"] },
    sabrina: { label: "CALM MIND CONTROL", plan: "Sabrina shields her team and builds overwhelming special power.", types: ["PSYCHIC", "GHOST"], moves: ["reflect", "lightScreen", "calmMind"] },
    blaine: { label: "SUN-FUELED OFFENSE", plan: "Blaine starts the sun and turns every Fire attack into a threat.", types: ["FIRE", "NORMAL"], moves: ["sunnyDay", "workUp", "fireSpin"] },
    giovanni: { label: "GROUND DOMINANCE", plan: "Giovanni controls the field, then finishes with boosted Ground power.", types: ["GROUND", "ROCK", "POISON"], moves: ["spikes", "sandstorm", "swordsDance"] }
  };
  const encounters = {
    boulderFinal: {
      label: "BOULDER CUP FINAL",
      plan: "Geodude establishes sand, Rhyhorn punishes switches with Spikes, and Onix closes as Brock's ace.",
      counter: "Use Water or Grass pressure, limit switching after Spikes, and punish Protect turns.",
      defeatAdvice: "Brock's sand and Spikes controlled the match. Try Water or Grass damage, switch only when the matchup demands it, and use Protect turns to recover or set up.",
      phases: ["SAND FOUNDATION", "HAZARD PRESSURE", "ACE CLIMAX"]
    }
  };
  function strategyFor(trainer) {
    const name = trainer?.name || "";
    const mapped = { BLUE: "setup", "JESSIE & JAMES": "control", LASS: "defense", YOUNGSTER: "setup", COOLTRAINER: "rain", "BIRD KEEPER": "setup", SCIENTIST: "control", MISTY: "misty", SAILOR: "misty", "LT. SURGE": "surge", ENGINEER: "surge", ROCKER: "surge", ERIKA: "erika", BEAUTY: "erika", BROCK: "brock", HIKER: "brock", GIOVANNI: "giovanni", ROCKET: "giovanni", KOGA: "koga", TAMER: "koga", AGATHA: "control", CHANNELER: "control", BIKER: "koga", SABRINA: "sabrina", PSYCHIC: "sabrina", BLAINE: "blaine", BURGLAR: "blaine", "SUPER NERD": "blaine", LORELEI: "defense", BRUNO: "setup", LANCE: "setup", BLACKBELT: "setup" };
    return mapped[name] || shuffle(["rain", "sun", "defense", "control", "setup", "sand"])[0];
  }
  // Stadium challenge director: strategic trainer identities, streak tiers and optional rare events.
  const stadiumRecent = [];
  const STADIUM_SPECIALS = ["articuno", "zapdos", "moltres"];
  startTrainer = function (size) {
    if (selected.length !== size) return;
    const streak = save.trainerStreak || 0;
    const available = TRAINERS.filter(tr => !stadiumRecent.includes(tr.name));
    const trainer = shuffle(available.length ? available : TRAINERS)[0];
    stadiumRecent.push(trainer.name); if (stadiumRecent.length > 4) stadiumRecent.shift();
    const strategy = strategyFor(trainer);
    const signaturePools = {
      BLUE: ["pidgeot","alakazam","rhydon","arcanine","exeggutor","gyarados"],
      "JESSIE & JAMES": ["arbok","weezing","meowth","victreebel","lickitung","persian"]
    };
    const themed = Object.keys(SPECIES).filter(id => SPECIES[id].types.some(type => strategies[strategy].types.includes(type)));
    const pool = signaturePools[trainer.name] ? [...new Set([...signaturePools[trainer.name], ...themed])] : themed;
    // At later streaks, prefer coherent teams; keep the opponent close to the player's level.
    const ids = chooseDiverseTeam(pool.length >= size ? pool : Object.keys(SPECIES), size);
    const levelBonus = streak >= 10 ? 2 : streak >= 5 ? 1 : 0;
    const legendaryEvent = streak >= 5 && streak % 5 !== 0 && Math.random() < .075;
    if (legendaryEvent && window.confirm("A legendary challenger has appeared! Accept a bonus battle? Your Stadium streak is safe if you decline.")) {
      const id = shuffle(STADIUM_SPECIALS)[0];
      startBattle(size === 6 ? "trainerDuo" : "trainer", { enemyIds: [id, ...ids.filter(x => x !== id)].slice(0,size), trainer: { ...trainer, name: "LEGENDARY CHALLENGER" }, strategy, levelBonus, stadiumBonus: true });
      return;
    }
    startBattle(size === 6 ? "trainerDuo" : "trainer", { enemyIds: ids, trainer, strategy, levelBonus });
  };
  function configureStartedBattle({ battle: startedBattle, mode, config }) {
    if (!startedBattle || startedBattle !== battle) return;
    battle.encounter = config.encounter || null;
    battle.stadiumBonus = !!config.stadiumBonus;
    battle.slots = { player: mode === "trainerDuo" ? [0, 1] : [battle.pActive], enemy: mode === "trainerDuo" ? [0, 1] : [0] };
    battle.screens = { player: { reflect: 0, lightScreen: 0 }, enemy: { reflect: 0, lightScreen: 0 } };
    battle.spikes = { player: 0, enemy: 0 }; battle.weather = "clear"; battle.weatherTurns = 0;
    battle.orders = []; battle.commandSlot = 0; battle.log = []; battle.strategy = config.strategy || strategyFor(config.trainer);
    if (battle.encounter === "boulderFinal" && battle.enemy[2]) battle.enemy[2].isAce = true;
    els["battle-log"].replaceChildren();
    if (!["safari", "mewtwo", "legendary"].includes(mode)) battle.enemy.forEach((mon, i) => {
      if (battle.difficulty !== "casual") {
        mon.held = ["leftovers", "sitrusBerry", "lumBerry"][i % 3];
        const tactics = strategies[battle.strategy].moves.filter(id => MOVES[id]);
        const tactical = tactics[i % tactics.length];
        if (tactical && !mon.moveIds.includes(tactical)) mon.moveIds[mon.moveIds.length - 1] = tactical;
        mon.pp = mon.moveIds.map(id => MOVES[id].pp);
      }
    });
    const current = battle; battle.locked = true;
    void (async () => {
      await window.TrainerScenes?.intro(current);
      if (battle !== current) return;
      const style = strategies[battle.strategy];
      await say(`${battle.trainer?.name || "WILD ENCOUNTER"}${mode === "safari" ? "" : " · " + style.label + ". " + style.plan}`);
      for (const mon of [...active("player"), ...active("enemy")]) { if (battle !== current) return; await enter(mon); }
      if (battle !== current) return; battle.locked = false; updateBattleUI();
    })();
  }
  window.YSFlow?.on("battle:started", configureStartedBattle, 50);
  duoPartner = side => battle?.mode === "trainerDuo" ? active(side)[1] || null : null;

  function targetOptions(actor, move) {
    if (move.self) return [actor];
    if (move.ally) return active(actor.side).filter(mon => mon !== actor);
    return active(opposite(actor.side));
  }
  function targetsFor(actor, move, requested) {
    if (move.self) return [actor];
    if (move.spread === "all" && battle.mode === "trainerDuo") return [...active("player"), ...active("enemy")].filter(mon => mon !== actor);
    if (move.spread === "enemies" && battle.mode === "trainerDuo") return active(opposite(actor.side));
    const options = targetOptions(actor, move);
    return [options.includes(requested) ? requested : options[0]].filter(Boolean);
  }
  function actionScore(actor, move, target) {
    if (!target) return -1000;
    if (move.power) {
      const targets = targetsFor(actor, move, target);
      return targets.reduce((sum, mon) => {
        const hit = estimateDamage(actor, mon, move);
        return sum + (mon.side === actor.side ? -1.5 : 1) * (hit / mon.maxHp * 140 + (hit >= mon.hp ? 90 : 0));
      }, 0) * move.accuracy / 100;
    }
    const hp = actor.hp / actor.maxHp;
    switch (move.effect) {
      case "recover": case "rest": return hp < .4 ? 100 : hp < .7 ? 45 : -100;
      case "rain": case "sun": case "sand": return battle.weather === move.effect ? -80 : active(actor.side).some(mon => mon.types.includes(move.effect === "rain" ? "WATER" : move.effect === "sun" ? "FIRE" : "ROCK")) ? 60 : 5;
      case "protect": return actor.protectChain ? -70 : actor.seeded || actor.status === "TOX" ? -20 : hp < .5 ? 30 : 2;
      case "reflect": case "lightScreen": return screenFor(actor)[move.effect] ? -80 : 55;
      case "attackUp": return actor.stages.attack >= 2 || hp < .5 || !actor.moveIds.some(id => MOVES[id].category === "PHYSICAL") ? -60 : 65;
      case "calmMind": return actor.stages.specialAttack >= 2 || hp < .5 ? -60 : 65;
      case "workUp": return (actor.stages.attack >= 2 && actor.stages.specialAttack >= 2) || hp < .5 ? -60 : 60;
      case "speedUp": return actor.stages.speed || speed(actor) > speed(target) ? -50 : 45;
      case "spikes": return battle.spikes[opposite(actor.side)] >= 2 || living(opposite(actor.side)).length <= active(opposite(actor.side)).length ? -70 : 45;
      case "toxic": case "paralyze": case "sleep": return canInflictStatus(target, { toxic: "TOX", paralyze: "PAR", sleep: "SLP" }[move.effect]) && !target.substitute ? 55 : -100;
      case "confuse": return target.confusion || target.substitute || target.ability === "ownTempo" ? -80 : 40;
      case "seed": return target.seeded || target.types.includes("GRASS") || target.substitute ? -80 : 60;
      case "substitute": return actor.substitute || hp <= .5 ? -80 : 20;
      case "help": return active(actor.side).length > 1 ? 35 : -100;
      default: return 0;
    }
  }
  function strategyBias(actor, move, target) {
    if (actor.side !== "enemy") return 0;
    const style = battle.strategy;
    const moveId = Object.keys(MOVES).find(id => MOVES[id] === move);
    let score = strategies[style]?.moves.includes(moveId) ? 8 : 0;
    if (battle.encounter === "boulderFinal") {
      const phase = battle.enemy.indexOf(actor);
      if (phase === 0 && moveId === "sandstorm" && battle.weather !== "sand") score += 65;
      if (phase === 1 && moveId === "spikes" && battle.spikes.player === 0) score += 55;
      if (phase === 2) {
        if (move.power && ["ROCK", "GROUND"].includes(move.type)) score += 18;
        if (moveId === "protect" && actor.hp <= actor.maxHp * .55) score += 18;
      }
    }
    const weatherMove = { rain: "rainDance", misty: "rainDance", sun: "sunnyDay", blaine: "sunnyDay", sand: "sandstorm", brock: "sandstorm", giovanni: "sandstorm" }[style];
    if (moveId === weatherMove) score += battle.weather === move.effect ? -20 : 18;
    if (["defense", "sabrina"].includes(style) && ["reflect", "lightScreen", "recover", "rest"].includes(moveId)) score += 14;
    if (["control", "koga"].includes(style) && ["toxic", "confuseRay", "spikes", "substitute", "protect"].includes(moveId)) score += 14;
    if (style === "erika" && ["sleepPowder", "leechSeed", "toxic"].includes(moveId)) score += 18;
    if (style === "surge" && move.effect === "paralyze" && !target.status) score += 18;
    if (["setup", "giovanni", "sun", "blaine"].includes(style) && ["attackUp", "calmMind", "workUp", "speedUp"].includes(move.effect)) score += actor.hp > actor.maxHp * .6 ? 14 : -6;
    if (move.power) {
      if (["rain", "misty"].includes(style) && battle.weather === "rain" && ["WATER", "ELECTRIC"].includes(move.type)) score += 10;
      if (["sun", "blaine"].includes(style) && battle.weather === "sun" && move.type === "FIRE") score += 10;
      if (style === "surge" && target.status === "PAR" && move.type === "ELECTRIC") score += 8;
      if (["brock", "sand", "giovanni"].includes(style) && battle.weather === "sand" && ["ROCK", "GROUND"].includes(move.type)) score += 8;
    }
    return score;
  }
  function chooseAction(actor) {
    const options = [];
    actor.moveIds.forEach((id, index) => {
      if (actor.pp[index] <= 0) return;
      const move = MOVES[id];
      targetOptions(actor, move).forEach(target => options.push({ actor, type: "move", index, target, score: actionScore(actor, move, target) + strategyBias(actor, move, target) + Math.random() * 12 }));
    });
    if (!options.length) return { actor, type: "move", index: -1, target: active(opposite(actor.side))[0] };
    if (battle.difficulty === "casual" && Math.random() < .5) return shuffle(options)[0];
    options.sort((a, b) => b.score - a.score);
    if (battle.difficulty !== "casual" && actor.trappedTurns <= 0 && !actor.recharge && battle.turn - (actor.lastSwitch || -10) > 2) {
      const foe = active(opposite(actor.side))[0];
      const incoming = Math.max(...foe.moveIds.map(id => estimateDamage(foe, actor, MOVES[id])));
      const bench = battle[actor.side].filter(mon => mon.hp > 0 && !isActive(mon));
      const best = bench.sort((a, b) => matchupScore(b, foe) - matchupScore(a, foe))[0];
      const switchChance = battle.difficulty === "master" ? .5 : .3;
      if (best && incoming > actor.hp * .6 && matchupScore(best, foe) > matchupScore(actor, foe) + .5 && Math.random() < switchChance) return { actor, type: "switch", incoming: best };
    }
    return options[0];
  }
  async function applyTactic(actor, target, move) {
    const effect = move.effect;
    if (!move.self && !move.field && (target.protected || target.substitute)) { await say(`${target.name} blocked ${move.name}!`); return; }
    if (["rain", "sun", "sand"].includes(effect)) { battle.weather = effect; battle.weatherTurns = 5; await say(`${title(effect)} weather began for five turns!`); }
    else if (effect === "protect") {
      if (Math.random() < 1 / 3 ** actor.protectChain) { actor.protected = true; await say(`${actor.name} protected itself!`); } else await say("But it failed!");
      actor.protectChain++;
    } else if (effect === "substitute") {
      const cost = Math.max(1, Math.floor(actor.maxHp / 4));
      if (actor.substitute || actor.hp <= cost) await say("Not enough HP for a substitute!");
      else { actor.hp -= cost; actor.substitute = cost; await say(`${actor.name} made a substitute!`); }
    } else if (["reflect", "lightScreen"].includes(effect)) { battle.screens[actor.side][effect] = 5; await say(`${move.name} protects the team for five turns!`); }
    else if (effect === "spikes") { battle.spikes[opposite(actor.side)] = Math.min(3, battle.spikes[opposite(actor.side)] + 1); await say("SPIKES scattered across the opposing field!"); }
    else if (effect === "attackUp") { statChange(actor, "attack", 2); await say(`${actor.name}'s ATTACK sharply rose!`); }
    else if (effect === "calmMind") { statChange(actor, "specialAttack", 1); statChange(actor, "specialDefense", 1); await say(`${actor.name}'s SP. ATK and SP. DEF rose!`); }
    else if (effect === "workUp") { statChange(actor, "attack", 1); statChange(actor, "specialAttack", 1); await say(`${actor.name}'s ATTACK and SP. ATK rose!`); }
    else if (effect === "speedUp") { statChange(actor, "speed", 2); await say(`${actor.name}'s SPEED sharply rose!`); }
    else if (effect === "help") { target.helped = true; await say(`${actor.name} is helping ${target.name}!`); }
    else if (effect === "recover" || effect === "rest") {
      if (effect === "rest" && actor.ability === "insomnia") { await say("INSOMNIA prevents Rest!"); return; }
      heal(actor, effect === "rest" ? actor.maxHp : actor.maxHp / 2);
      if (effect === "rest") { actor.status = "SLP"; actor.sleep = 3; }
      await say(`${actor.name} restored its HP!`);
    } else if (effect === "confuse") {
      if (target.ability === "ownTempo" || target.confusion) await say("But it failed!");
      else { target.confusion = 2 + Math.floor(Math.random() * 3); await say(`${target.name} became confused!`); }
    } else if (effect === "seed") {
      if (target.types.includes("GRASS") || target.seeded) await say("But it failed!");
      else { target.seeded = true; await say(`${target.name} was seeded!`); }
    } else {
      const status = { toxic: "TOX", paralyze: "PAR", sleep: "SLP" }[effect];
      if (status && !(effect === "paralyze" && immunity(target, move)) && setStatus(target, status, actor)) await say(`${target.name}: ${status === "TOX" ? "badly poisoned" : statusMessage(target)}!`);
      else await say("But it failed!");
    }
    await berry(target);
  }
  async function performMove(action) {
    const { actor, index } = action;
    if (actor.hp <= 0 || !isActive(actor)) return;
    const move = index < 0 ? MOVES.struggle : MOVES[actor.moveIds[index]];
    if (!move || (index >= 0 && actor.pp[index] <= 0)) return;
    if (move.effect !== "protect") actor.protectChain = 0;
    if (actor.flinched && actor.ability !== "innerFocus") { await say(`${actor.name} flinched!`); return; }
    if (actor.recharge) { actor.recharge = false; await say(`${actor.name} must recharge!`); return; }
    if (actor.status === "SLP") { actor.sleep--; if (actor.sleep > 0) { await say(`${actor.name} is asleep.`); return; } actor.status = null; }
    if (actor.status === "FRZ") { if (move !== MOVES.scald && Math.random() >= .2) { await say(`${actor.name} is frozen!`); return; } actor.status = null; }
    if (actor.status === "PAR" && Math.random() < .25) { await say(`${actor.name} is fully paralyzed!`); return; }
    if (actor.confusion) {
      actor.confusion--;
      if (Math.random() < 1/3) { actor.hp = Math.max(0, actor.hp - Math.max(1, Math.floor(((2 * actor.level / 5 + 2) * 40 * effectiveStat(actor, "attack") / effectiveStat(actor, "defense")) / 50 + 2))); await say(`${actor.name} hurt itself in confusion!`); await berry(actor); return; }
    }
    const targets = targetsFor(actor, move, action.target);
    if (index >= 0) actor.pp[index] = Math.max(0, actor.pp[index] - 1 - (targets.some(mon => mon.side !== actor.side && mon.ability === "pressure") ? 1 : 0));
    await present("prepare", actor, move);
    presentation()?.cue(actor, move);
    if (presentation()?.move) await present("move", actor, move); else await say(`${actor.name} used ${move.name}!`);
    moveEffect(actor, move);
    for (const target of targets) {
      if (target.hp <= 0 || actor.hp <= 0) continue;
      let accuracy = move.accuracy * stageMultiplier(actor.stages.accuracy) * (actor.ability === "compoundEyes" ? 1.3 : 1);
      if (move.name === "THUNDER") accuracy = battle.weather === "rain" ? 100 : battle.weather === "sun" ? 50 : accuracy;
      if (!move.self && Math.random() * 100 >= accuracy) { await Promise.all([present("playMove", actor, target, move, "miss"), present("dodge", target, actor, move)]); presentation()?.impactLabel(target,'DODGED'); if (presentation()?.miss) await present("miss", target); else await say(`${target.name} dodged ${actor.name}'s attack!`); continue; }
      await present("playMove", actor, target, move);
      if (!move.power) { await present("hitReaction", target, "status"); await applyTactic(actor, target, move); continue; }
      if (target.protected) { presentation()?.impactLabel(target,'PROTECTED'); await say(`${target.name} protected itself!`); continue; }
      if (immunity(target, move)) {
        if (["waterAbsorb", "voltAbsorb"].includes(target.ability) && ((target.ability === "waterAbsorb" && move.type === "WATER") || (target.ability === "voltAbsorb" && move.type === "ELECTRIC"))) heal(target, target.maxHp / 4);
        if (target.ability === "flashFire" && move.type === "FIRE") target.flashFire = true;
        presentation()?.impactLabel(target,'IMMUNE'); if (presentation()?.immune) await present("immune", target); else await say(`${move.name} has no effect on ${target.name}!`); continue;
      }
      if (move === MOVES.brickBreak) { battle.screens[target.side].reflect = 0; battle.screens[target.side].lightScreen = 0; }
      const hits = move.multi ? move.multi[0] + Math.floor(Math.random() * (move.multi[1] - move.multi[0] + 1)) : 1;
      let total = 0, crit = false;
      const wasSubstitute = target.substitute > 0;
      for (let hit = 0; hit < hits && target.hp > 0; hit++) {
        const result = damage(actor, target, move, true, targets.length > 1); crit ||= result.critical;
        if (target.substitute > 0) { target.substitute = Math.max(0, target.substitute - result.damage); }
        else {
          let amount = result.damage;
          if (amount >= target.hp && target.held === "focusBand" && Math.random() < .1) { amount = target.hp - 1; await say(`${target.name}'s FOCUS BAND held on!`); }
          total += Math.min(target.hp, amount); target.hp = Math.max(0, target.hp - amount);
        }
      }
      if (crit) await present("critical", actor, target, move);
      else await present("hitReaction", target);
      hitEffect(target);
      if (!wasSubstitute) {
        actor.matchDamage = (actor.matchDamage || 0) + total;
        if (target.hp <= 0) { actor.matchKnockouts = (actor.matchKnockouts || 0) + 1; battle.lastKnockout = `${actor.name} defeated ${target.name} with ${move.name}`; }
      }
      const matchup = effectiveness(move.type, target);
      presentation()?.effectiveness(target, matchup);
      const resultText = `${wasSubstitute ? 'SUBSTITUTE HIT' : '−' + total + ' HP'}${crit ? ' · CRITICAL' : ''}${matchup > 1 ? ' · SUPER EFFECTIVE' : matchup < 1 ? ' · RESISTED' : ''}`;
      // Keep the technical result available to the battle log, but present the turn visually.
      battle.log ||= []; battle.log.push(`${target.name}: ${resultText}`); battle.log = battle.log.slice(-80);
      presentation()?.impactLabel(target, crit ? 'CRITICAL' : matchup > 1 ? 'SUPER EFFECTIVE' : matchup < 1 ? 'RESISTED' : 'HIT');
      updateBattleUI();
      if (presentation()?.result) await present("result", target,{crit,effect:matchup,hits,total,substitute:wasSubstitute}); else await say(`${target.name}: ${resultText}`);
      if (move === MOVES.scald && target.status === 'FRZ' && !wasSubstitute) { target.status = null; await say(`${target.name} thawed out!`); }
      if (target.hp > 0 && !wasSubstitute) {
        if (move.status && Math.random() * 100 < move.chance && setStatus(target, move.status, actor)) { const text = statusMessage(target); if (presentation()?.status) await present("status", text); else await say(text); }
        if (move.effect === "specialDown" && Math.random() * 100 < move.chance) { statChange(target, "specialDefense", -1); await say(`${target.name}'s SP. DEF fell!`); }
        if (move.confuseChance && Math.random() * 100 < move.confuseChance && target.ability !== "ownTempo") target.confusion = 3;
        if (move.trap) target.trappedTurns = 4;
        if (move.flinchChance && target.ability !== "innerFocus" && !battle.acted.includes(target) && Math.random() * 100 < move.flinchChance) target.flinched = true;
      }
      const contact = move.category === "PHYSICAL" && !["earthquake", "rockSlide", "razorLeaf", "pinMissile"].some(id => MOVES[id] === move);
      if (contact && !wasSubstitute && actor.hp > 0 && Math.random() < .3) {
        const status = { static: "PAR", poisonPoint: "PSN" }[target.ability];
        if (status && setStatus(actor, status)) await say(`${target.name}'s ${title(target.ability)} triggered!`);
      }
      await berry(target); await berry(actor);
    }
    if (move.recoil && actor.ability !== "rockHead") actor.hp = Math.max(0, actor.hp - Math.max(1, Math.floor(actor.maxHp / 4)));
    if (move.effect === "recharge") actor.recharge = true;
    actor.helped = false;
    presentation()?.reset();
  }
  async function performSwitch(action) {
    const { actor, incoming } = action;
    if (!isActive(actor) || actor.trappedTurns || incoming.hp <= 0 || isActive(incoming)) return;
    const slot = battle.slots[actor.side].indexOf(battle[actor.side].indexOf(actor));
    await present("withdraw", actor);
    clearVolatile(actor); battle.slots[actor.side][slot] = battle[actor.side].indexOf(incoming); syncLegacyActive(actor.side); incoming.lastSwitch = battle.turn;
    await say(`${actor.name}, return! Go, ${incoming.name}!`); await enter(incoming);
  }
  async function finishTurn() {
    for (const mon of [...active("player"), ...active("enemy")]) {
      const residual = [];
      if (mon.status === "TOX") mon.toxicTurns++;
      let chip = mon.status === "TOX" ? Math.floor(mon.maxHp * mon.toxicTurns / 16) : mon.status === "PSN" ? Math.floor(mon.maxHp / 8) : mon.status === "BRN" ? Math.floor(mon.maxHp / 16) : 0;
      if (mon.status && chip === 0 && ["TOX", "PSN", "BRN"].includes(mon.status)) chip = 1;
      if (chip) { mon.hp = Math.max(0, mon.hp - chip); residual.push(`${mon.status} −${chip}`); }
      if (mon.hp > 0 && mon.seeded) { const drain = Math.min(mon.hp, Math.max(1, Math.floor(mon.maxHp / 8))); mon.hp -= drain; const recipient = active(opposite(mon.side))[0]; if (recipient) heal(recipient, drain); residual.push(`LEECH SEED −${drain}`); }
      if (mon.hp > 0 && mon.trappedTurns) { const damage = Math.max(1, Math.floor(mon.maxHp / 8)); mon.hp = Math.max(0, mon.hp - damage); mon.trappedTurns--; residual.push(`VORTEX −${damage}`); }
      if (mon.hp > 0 && battle.weather === "sand" && !mon.types.some(type => ["ROCK", "GROUND", "STEEL"].includes(type))) { const damage = Math.max(1, Math.floor(mon.maxHp / 16)); mon.hp = Math.max(0, mon.hp - damage); residual.push(`SAND −${damage}`); }
      if (mon.hp > 0 && mon.held === "leftovers" && mon.hp < mon.maxHp) { const before = mon.hp; heal(mon, mon.maxHp / 16); residual.push(`LEFTOVERS +${mon.hp - before}`); }
      if (mon.hp > 0 && mon.status && mon.ability === "shedSkin" && Math.random() < 1/3) { mon.status = null; residual.push("SHED SKIN cured status"); }
      if (residual.length) await say(`${mon.name}: ${residual.join(" · ")}`);
      await berry(mon);
    }
    for (const side of ["player", "enemy"]) for (const key of ["reflect", "lightScreen"]) battle.screens[side][key] = Math.max(0, battle.screens[side][key] - 1);
    if (battle.weatherTurns && --battle.weatherTurns === 0) { battle.weather = "clear"; await say("The weather cleared."); }
    await fillSlots();
  }
  async function resolveOrders() {
    if (!battle || battle.locked || battle.over) return;
    const current = battle;
    battle.locked = true; battle.acted = []; updateBattleUI();
    try {
      const actions = [...battle.orders, ...active("enemy").map(chooseAction)];
      [...active("player"), ...active("enemy")].forEach(mon => { mon.protected = false; mon.flinched = false; mon.helped = false; });
      actions.forEach(action => { action.quick = action.actor.held === "quickClaw" && Math.random() < .2; action.tie = Math.random(); });
      const priority = action => action.type === "switch" ? 6 : action.type === "item" ? 6 : MOVES[action.actor.moveIds[action.index]]?.priority || 0;
      actions.sort((a, b) => priority(b) - priority(a) || Number(b.quick) - Number(a.quick) || speed(b.actor) - speed(a.actor) || b.tie - a.tie);
      for (const action of actions) {
        if (battle !== current || battle.over) return;
        if (action.actor.hp <= 0 || !isActive(action.actor)) continue;
        if (action.quick && action.type === "move") await say(`${action.actor.name}'s QUICK CLAW activated!`);
        if (action.type === "switch") await performSwitch(action);
        else if (action.type === "item") await performItem(action);
        else await performMove(action);
        if (battle.over) return;
        battle.acted.push(action.actor);
        // Replacements enter only after the full action queue; they cannot steal a fainted Pokémon's turn.
        if (!living("enemy").length || !living("player").length) { endBattle(living("player").length > 0); return; }
      }
      await finishTurn();
      if (battle !== current || battle.over) return;
      battle.turn++; battle.orders = []; battle.commandSlot = 0;
      log(battle.turn % 4 === 0 ? "The crowd is watching your next play!" : "Choose your next commands.");
    } catch (error) {
      console.error("Battle turn failed", error);
      if (battle === current) { battle.orders = []; battle.commandSlot = 0; announce("The turn was interrupted. Choose your next commands."); }
    } finally { if (battle === current) { presentation()?.cancel(); battle.locked = battle.over; updateBattleUI(); } }
  }
  function commanding() { return active("player")[battle.commandSlot || 0]; }
  function queue(order) {
    if (!battle || battle.locked || battle.over || order.actor !== commanding()) return;
    battle.orders.push(order); battle.commandSlot++;
    if (battle.orders.length >= active("player").length) void resolveOrders();
    else updateBattleUI();
  }
  takeTurn = function (index) { const actor = commanding(); if (actor) queue({ actor, index, type: "move", target: active("enemy")[0] }); };
  switchPlayer = function (index) {
    const actor = commanding(), incoming = battle?.player[index];
    if (!actor || !incoming || actor.trappedTurns || incoming.hp <= 0 || isActive(incoming) || battle.orders.some(order => order.incoming === incoming)) return;
    queue({ actor, incoming, type: "switch" });
  };
  renderMoves = function () {
    if (!battle?.slots) return;
    els.moves.replaceChildren();
    const actor = commanding() || active("player")[0]; if (!actor) return;
    const heading = document.createElement("p"); heading.className = "command-heading command-prompt";
    heading.innerHTML = `<span>What will ${actor.name} do?</span><small>${title(actor.ability)}${actor.held ? " · " + equipment[actor.held]?.name : ""}</small>`;
    heading.title = abilityDescriptions[actor.ability]; els.moves.append(heading);
    if (battle.orders.length && !battle.locked) {
      const undo = document.createElement("button"); undo.type = "button"; undo.className = "secondary-button"; undo.textContent = "UNDO PREVIOUS ORDER";
      undo.onclick = () => { battle.orders.pop(); battle.commandSlot = Math.max(0, battle.commandSlot - 1); updateBattleUI(); }; els.moves.append(undo);
    }
    const available = actor.moveIds.map((id, index) => ({ id, index }));
    if (actor.pp.every(pp => pp <= 0)) available.push({ id: "struggle", index: -1 });
    available.forEach(({ id, index }) => {
      const move = MOVES[id]; const wrapper = document.createElement("div"); wrapper.className = "move-choice";
      wrapper.dataset.moveId=id;wrapper.dataset.moveIndex=String(index);
      const options = targetOptions(actor, move);
      const target = document.createElement("select"); target.setAttribute("aria-label", `${move.name} target`);
      options.forEach(mon => target.add(new Option(`${mon.name} · ${mon.hp}/${mon.maxHp}`, String(options.indexOf(mon)))));
      target.disabled = battle.locked; target.hidden = move.self || move.field || !!move.spread || options.length <= 1;
      const button = document.createElement("button"); button.type = "button"; button.className = "move-button";
      button.disabled = battle.locked || battle.over;
      button.disabled ||= index >= 0 && actor.pp[index] <= 0;
      button.disabled ||= options.length === 0;
      button.innerHTML = `<span><span class="move-name">${move.name}</span><span class="move-type">${move.type} · ${move.category} · ${move.power || title(move.effect)}${move.spread && battle.mode === "trainerDuo" ? " · " + (move.spread === "all" ? "HITS ALL OTHERS" : "BOTH FOES") : ""}</span></span><span class="move-pp">${index < 0 ? "∞" : actor.pp[index] + "/" + move.pp}</span>`;
      button.onclick = () => queue({ actor, index, type: "move", target: options[Number(target.value) || 0] });
      const insight = document.createElement('span'); insight.className = 'move-insight';
      const describe = () => {
        const foe = options[Number(target.value) || 0];
        const factor = foe && move.power ? (immunity(foe, move) ? 0 : effectiveness(move.type, foe)) : null;
        insight.textContent = [move.self || move.field ? 'Self / field' : `${move.accuracy}% base accuracy`, move.priority ? `Priority +${move.priority}` : '', factor !== null ? `${factor}× vs ${foe.name}` : '', move.power && actor.types.includes(move.type) ? 'Same-type bonus' : '', move.status ? `${move.chance}% ${move.status === 'BRN' ? 'burn' : move.status === 'PAR' ? 'paralysis' : move.status}` : '', move.effect === 'workUp' ? '+1 Attack / +1 Sp. Atk' : ''].filter(Boolean).join(' · ');
      };
      target.onchange = describe; describe();
      wrapper.append(button, target, insight); els.moves.append(wrapper);
    });
  };
  renderTeamButtons = function () {
    if (!battle?.slots) return;
    const actor = commanding(); els["team-buttons"].replaceChildren();
    battle.player.forEach((mon, index) => {
      const button = document.createElement("button"); button.type = "button"; button.className = "team-button";
      button.disabled = !actor || battle.locked || isActive(mon) || mon.hp <= 0 || actor.trappedTurns > 0 || battle.orders.some(order => order.incoming === mon);
      button.innerHTML = `<span>${mon.name}<em>${isActive(mon) ? "ACTIVE" : "SWITCH IN"} · L${mon.level}</em></span><small>${mon.hp}/${mon.maxHp}</small>`;
      button.onclick = () => switchPlayer(index); els["team-buttons"].append(button);
    });
  };
  renderBattleItems = function () {
    if (!battle?.slots) return;
    const actor = commanding(); els["battle-items"].replaceChildren();
    Object.entries(ITEMS).filter(([, item]) => !item.held && item.battleUse !== false).forEach(([id, item]) => {
      if (!(save.inventory[id] > 0)) return;
      const button = document.createElement("button"); button.type = "button"; button.className = "item-button";
      const wild = ["safari", "mewtwo"].includes(battle.mode);
      const enemy = active("enemy")[0];
      button.disabled = battle.locked || !actor || (item.ball && (!wild || !enemy || (PRE_EVOLUTION[enemy.id] && battle.mode !== "mewtwo"))) ||
        (["potion", "superPotion"].includes(id) && actor.hp >= actor.maxHp) ||
        (id === "fullHeal" && !actor.status && !actor.confusion) || (id === "revive" && !battle.player.some(mon => mon.hp <= 0)) ||
        battle.orders.some(order => order.type === "item" && order.id === id && (save.inventory[id] || 0) < 2);
      button.textContent = `${item.name} ×${save.inventory[id]}`; button.onclick = () => useBattleItem(id); els["battle-items"].append(button);
    });
  };
  useBattleItem = function (id) {
    if (ITEMS[id]?.battleUse === false) { announce?.(`${ITEMS[id].name} can’t be used during battle.`); return; }
    const actor = commanding(); if (!canUseItem(actor, id)) return;
    const reserved = battle.orders.filter(order => order.type === 'item' && order.id === id).length;
    if (reserved >= save.inventory[id]) return;
    queue({ actor, id, type: "item" });
  };
  function canUseItem(actor, id) {
    if (!battle || battle.over || !actor || actor.hp <= 0 || !ITEMS[id] || ITEMS[id].held || ITEMS[id].battleUse === false || !(save.inventory[id] > 0)) return false;
    if (ITEMS[id].ball) {
      const target = active('enemy')[0];
      return ['safari','mewtwo','legendary'].includes(battle.mode) && !!target && (!PRE_EVOLUTION[target.id] || battle.mode !== 'safari');
    }
    if (id === 'revive') return battle.player.some(mon => mon.hp <= 0);
    if (id === 'fullHeal') return !!(actor.status || actor.confusion);
    return actor.hp < actor.maxHp;
  }
  async function performItem({ actor, id }) {
    if (!canUseItem(actor, id)) { await say('That item is no longer needed. It stayed in your bag.'); return; }
    const item = ITEMS[id];
    save.inventory[id]--; writeSave();
    if (item.ball) {
      const target = active("enemy")[0];
      await say(`You threw a ${item.name}!`);
      const caught = id === "masterBall" || Math.random() < safariCatchChance(target, item.ball);
      if (presentation()?.capture) await present("capture", target, id, caught);
      else for (let i = 0; i < 3; i++) { await say("Shake…"); }
      if (caught) {
        battle.captured = true; battle.caughtNew = !save.owned.includes(target.id); addOwned(target.id, target.level); endBattle(true);
      } else await say(`${target.name} broke free!`);
    } else if (id === "revive") {
      const target = battle.player.find(mon => mon.hp <= 0);
      if (target) { target.hp = Math.max(1, Math.floor(target.maxHp / 2)); target.status = null; target.faintAnnounced = false; clearVolatile(target); await say(`${target.name} was revived!`); }
    } else {
      if (id === "fullHeal") { actor.status = null; actor.confusion = 0; }
      else heal(actor, id === "superPotion" ? 70 : 40);
      await say(`${item.name} helped ${actor.name}!`);
    }
  }
  function statusReadout(mon) {
    if (!mon) return "";
    return [mon.status, mon.confusion ? "CONFUSED" : "", mon.substitute ? "SUB " + mon.substitute : "", mon.protected ? "PROTECTED" : "", ...Object.entries(mon.stages).filter(([, n]) => n).map(([key, n]) => `${key.replace("special", "Sp.")} ${n > 0 ? "+" : ""}${n}`)].filter(Boolean).join(" · ");
  }
  let hpAnimation;
  let displayedHp;
  let displayedMon;
  let hpTarget;
  function prepareBattleUI() {
    if (!battle?.slots) return;
    syncLegacyActiveIndexes();
  }
  function renderStadiumBattleUI() {
    if (!battle) return;
    const currentMon = activePlayer();
    if (window.requestAnimationFrame && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      if (displayedMon !== currentMon) {
        if (hpAnimation) window.cancelAnimationFrame(hpAnimation);
        displayedMon = currentMon; displayedHp = currentMon.hp; hpTarget = currentMon.hp;
      } else if (hpTarget !== currentMon.hp) {
        if (hpAnimation) window.cancelAnimationFrame(hpAnimation);
        const from = displayedHp, to = currentMon.hp, started = performance.now(); hpTarget = to;
        const tick = now => {
          if (displayedMon !== currentMon) return;
          const progress = Math.min(1, (now - started) / 420);
          displayedHp = Math.round(from + (to - from) * progress);
          els["player-hp"].textContent = displayedHp;
          if (progress < 1) hpAnimation = window.requestAnimationFrame(tick);
        };
        hpAnimation = window.requestAnimationFrame(tick);
      }
      els["player-hp"].textContent = displayedHp;
    }
    els["reset-save"].disabled = battle.locked && !battle.over;
    if (!battle.slots) return;
    els["player-status"].textContent = statusReadout(activePlayer()); els["enemy-status"].textContent = statusReadout(activeEnemy());
    for (const side of ["player", "enemy"]) {
      const mon = active(side)[1];
      if (mon) els[`${side}-partner-name`].textContent = `${mon.name} · ${mon.hp}/${mon.maxHp} HP · ${statusReadout(mon)}`;
      const image = els[`${side}-sprite`]; image.dataset.status = (side === "player" ? activePlayer() : activeEnemy()).status || "";
    }
    const cupStage = battle.mode === "cup" ? `JOURNEY ${battle.cupRound + 1}/3 · ${strategies[battle.strategy]?.label}` : battle.mode === "arcade" ? `${ARCADE_CUPS[battle.arcadeCupIndex].name} ${battle.arcadeStage + 1}/${ARCADE_CUPS[battle.arcadeCupIndex].stages.length} · ${battle.arcadeLabel}` : strategies[battle.strategy]?.label;
    const encounterPhase = encounters[battle.encounter]?.phases[battle.encounterPhase];
    els["field-readout"].textContent = [battle.mode === "trainerDuo" ? "DOUBLES · " + Math.min(battle.commandSlot + 1, 2) + "/2 COMMANDS" : "SINGLES", cupStage, encounterPhase, `${title(battle.weather)}${battle.weatherTurns ? " · " + battle.weatherTurns + " turns" : ""}`, ...["player", "enemy"].flatMap(side => [battle.spikes[side] ? `${side}: ${battle.spikes[side]} SPIKES` : "", ...Object.entries(battle.screens[side]).filter(([, turns]) => turns).map(([key, turns]) => `${side}: ${title(key)} ${turns}`)])].filter(Boolean).join(" | ");
    if (els["opponent-profile"] && strategies[battle.strategy]) {
      const profileLabel = els["opponent-profile"].querySelector("span");
      if (profileLabel) profileLabel.textContent = `${DIFFICULTIES[battle.difficulty]?.label || title(battle.difficulty)} · ${battle.trainer?.name || "WILD"} · ${strategies[battle.strategy].label}`;
      els["opponent-profile"].title = strategies[battle.strategy].plan;
    }
    presentation()?.render();
  }
  window.YSFlow?.on("battle:beforeUI", prepareBattleUI, 80);
  window.YSFlow?.on("battle:ui", renderStadiumBattleUI, 60);
  let movesBeforeBattleEnd = Object.create(null);
  window.YSFlow?.on("battle:beforeEnd", ({ battle: finished }) => {
    if (!finished) return;
    movesBeforeBattleEnd = Object.fromEntries(finished.player.map(mon => [mon.id, unlockedMoves(mon.id)]));
  }, 15);
  window.YSFlow?.on("battle:ended", ({ battle: finished, victory }) => {
    if (!finished) return;
    const encounter = encounters[finished.encounter];
    if (encounter) {
      if (!victory) els["result-copy"].textContent = encounter.defeatAdvice;
      const lesson = document.createElement("strong");
      lesson.className = "encounter-lesson";
      lesson.textContent = victory
        ? "STRATEGY MASTERED · You broke Brock's field control and overcame his ace."
        : `COACH'S NOTE · ${encounter.counter}`;
      els.reward.append(lesson);
    }
    finished.player.forEach(mon => {
      const learned = unlockedMoves(mon.id).filter(id => !(movesBeforeBattleEnd[mon.id] || []).includes(id));
      if (learned.length) { const text = document.createElement("strong"); text.textContent = `${mon.name} unlocked ${learned.map(id => MOVES[id].name).join(", ")} — equip in Party Training.`; els.reward.append(text); }
    });
    els["reset-save"].disabled = false;
    presentation()?.finish(victory);
    window.TrainerScenes?.outro(finished, victory);
  }, 0);
  // Presentation cries are owned by the unified AudioManager.
  function playCry(mon) { window.AudioManager?.cry?.(mon); }
  function spriteFor(mon) { return els[`${mon.side}${active(mon.side)[0] === mon ? "" : "-partner"}-sprite`]; }
  function moveEffect(mon, move) {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const sprite = spriteFor(mon); if (sprite?.animate) sprite.animate([{ transform: "translateX(0)" }, { transform: `translateX(${mon.side === "player" ? 18 : -18}px) scale(1.08)` }, { transform: "translateX(0)" }], { duration: 350 });

  }
  function hitEffect(mon) { if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return; const sprite = spriteFor(mon); if (sprite?.animate) sprite.animate([{ opacity: 1 }, { opacity: .15 }, { opacity: 1 }, { opacity: .15 }, { opacity: 1 }], { duration: 500 }); }

  // A small testing surface for deterministic mechanics and migration checks.
  window.StadiumUpgrade = { learnset, unlockedMoves, movesFor, identityFor, abilityFor, abilityDescriptions, equipment, strategies, encounters, strategyFor, damage, immunity, setStatus, clearVolatile, active, actionScore, strategyBias, chooseAction, performMove, performSwitch, finishTurn, fillSlots, resolveOrders, migrateTraining };
  window.AudioManager?.render?.(); renderApp(); registerAgentControls();
})();

