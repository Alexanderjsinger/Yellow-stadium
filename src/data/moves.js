
"use strict";

const MOVES = {
  thunderbolt: { name: "THUNDERBOLT", type: "ELECTRIC", category: "SPECIAL", power: 90, accuracy: 100, pp: 15, status: "PAR", chance: 10 },
  surf: { name: "SURF", type: "WATER", category: "SPECIAL", power: 90, accuracy: 100, pp: 15 },
  quickAttack: { name: "QUICK ATTACK", type: "NORMAL", category: "PHYSICAL", power: 40, accuracy: 100, pp: 30, priority: 1 },
  thunderWave: { name: "THUNDER WAVE", type: "ELECTRIC", category: "STATUS", power: 0, accuracy: 90, pp: 20, effect: "paralyze" },
  flamethrower: { name: "FLAMETHROWER", type: "FIRE", category: "SPECIAL", power: 90, accuracy: 100, pp: 15, status: "BRN", chance: 10 },
  slash: { name: "SLASH", type: "NORMAL", category: "PHYSICAL", power: 70, accuracy: 100, pp: 20, highCrit: true },
  earthquake: { name: "EARTHQUAKE", type: "GROUND", category: "PHYSICAL", power: 100, accuracy: 100, pp: 10 },
  fireSpin: { name: "FIRE SPIN", type: "FIRE", category: "SPECIAL", power: 35, accuracy: 85, pp: 15, trap: true },
  blizzard: { name: "BLIZZARD", type: "ICE", category: "SPECIAL", power: 110, accuracy: 70, pp: 5, status: "FRZ", chance: 10 },
  bodySlam: { name: "BODY SLAM", type: "NORMAL", category: "PHYSICAL", power: 85, accuracy: 100, pp: 15, status: "PAR", chance: 30 },
  rest: { name: "REST", type: "PSYCHIC", category: "STATUS", power: 0, accuracy: 100, pp: 5, effect: "rest" },
  razorLeaf: { name: "RAZOR LEAF", type: "GRASS", category: "PHYSICAL", power: 55, accuracy: 95, pp: 25, highCrit: true },
  sleepPowder: { name: "SLEEP POWDER", type: "GRASS", category: "STATUS", power: 0, accuracy: 75, pp: 15, effect: "sleep" },
  leechSeed: { name: "LEECH SEED", type: "GRASS", category: "STATUS", power: 0, accuracy: 90, pp: 10, effect: "seed" },
  psychic: { name: "PSYCHIC", type: "PSYCHIC", category: "SPECIAL", power: 90, accuracy: 100, pp: 10, effect: "specialDown", chance: 10 },
  hypnosis: { name: "HYPNOSIS", type: "PSYCHIC", category: "STATUS", power: 0, accuracy: 60, pp: 20, effect: "sleep" },
  nightShade: { name: "NIGHT SHADE", type: "GHOST", category: "SPECIAL", power: 1, accuracy: 100, pp: 15, fixed: "level" },
  recover: { name: "RECOVER", type: "NORMAL", category: "STATUS", power: 0, accuracy: 100, pp: 5, effect: "recover" },
  seismicToss: { name: "SEISMIC TOSS", type: "FIGHTING", category: "PHYSICAL", power: 1, accuracy: 100, pp: 20, fixed: "level" },
  hyperBeam: { name: "HYPER BEAM", type: "NORMAL", category: "SPECIAL", power: 150, accuracy: 90, pp: 5, effect: "recharge" },
  rockSlide: { name: "ROCK SLIDE", type: "ROCK", category: "PHYSICAL", power: 75, accuracy: 90, pp: 10, flinchChance: 30 },
  sing: { name: "SING", type: "NORMAL", category: "STATUS", power: 0, accuracy: 55, pp: 15, effect: "sleep" },
  pinMissile: { name: "PIN MISSILE", type: "BUG", category: "PHYSICAL", power: 25, accuracy: 95, pp: 20, multi: [2, 5] },
  doubleKick: { name: "DOUBLE KICK", type: "FIGHTING", category: "PHYSICAL", power: 30, accuracy: 100, pp: 30, multi: [2, 2] },
  agility: { name: "AGILITY", type: "PSYCHIC", category: "STATUS", power: 0, accuracy: 100, pp: 30, effect: "speedUp" }
  ,tackle: { name: "TACKLE", type: "NORMAL", category: "PHYSICAL", power: 40, accuracy: 100, pp: 35 }
  ,wingAttack: { name: "WING ATTACK", type: "FLYING", category: "PHYSICAL", power: 60, accuracy: 100, pp: 35 }
  ,sludgeBomb: { name: "SLUDGE BOMB", type: "POISON", category: "SPECIAL", power: 90, accuracy: 100, pp: 10, status: "PSN", chance: 30 }
  ,shadowBall: { name: "SHADOW BALL", type: "GHOST", category: "SPECIAL", power: 80, accuracy: 100, pp: 15, effect: "specialDown", chance: 20 }
  ,dragonClaw: { name: "DRAGON CLAW", type: "DRAGON", category: "PHYSICAL", power: 80, accuracy: 100, pp: 15 }
  ,iceBeam: { name: "ICE BEAM", type: "ICE", category: "SPECIAL", power: 90, accuracy: 100, pp: 10, status: "FRZ", chance: 10 }
  ,brickBreak: { name: "BRICK BREAK", type: "FIGHTING", category: "PHYSICAL", power: 75, accuracy: 100, pp: 15 }
  ,xScissor: { name: "X-SCISSOR", type: "BUG", category: "PHYSICAL", power: 80, accuracy: 100, pp: 15 }
};

const CURATED_SPECIES = {
  pikachu: { dex:25, name:"PIKACHU", stats:[35,55,40,50,50,90], types:["ELECTRIC"], moves:["thunderbolt","surf","thunderWave","quickAttack"], growth:"mediumFast", baseExp:112, nature:["TIMID","speed","attack"], evs:[0,0,0,252,4,252] },
  charizard: { dex:6, name:"CHARIZARD", stats:[78,84,78,109,85,100], types:["FIRE","FLYING"], moves:["flamethrower","slash","earthquake","fireSpin"], growth:"mediumSlow", baseExp:267, nature:["TIMID","speed","attack"], evs:[0,0,0,252,4,252] },
  blastoise: { dex:9, name:"BLASTOISE", stats:[79,83,100,85,105,78], types:["WATER"], moves:["surf","blizzard","bodySlam","rest"], growth:"mediumSlow", baseExp:265, nature:["MODEST","specialAttack","attack"], evs:[252,0,4,252,0,0] },
  venusaur: { dex:3, name:"VENUSAUR", stats:[80,82,83,100,100,80], types:["GRASS","POISON"], moves:["razorLeaf","sleepPowder","bodySlam","leechSeed"], growth:"mediumSlow", baseExp:263, nature:["MODEST","specialAttack","attack"], evs:[252,0,4,252,0,0] },
  gengar: { dex:94, name:"GENGAR", stats:[60,65,60,130,75,110], types:["GHOST","POISON"], moves:["psychic","thunderbolt","hypnosis","nightShade"], growth:"mediumSlow", baseExp:250, nature:["TIMID","speed","attack"], evs:[0,0,0,252,4,252] },
  alakazam: { dex:65, name:"ALAKAZAM", stats:[55,50,45,135,95,120], types:["PSYCHIC"], moves:["psychic","recover","thunderWave","seismicToss"], growth:"mediumSlow", baseExp:250, nature:["TIMID","speed","attack"], evs:[0,0,0,252,4,252] },
  snorlax: { dex:143, name:"SNORLAX", stats:[160,110,65,65,110,30], types:["NORMAL"], moves:["bodySlam","hyperBeam","earthquake","rest"], growth:"slow", baseExp:189, nature:["ADAMANT","attack","specialAttack"], evs:[252,252,0,0,4,0] },
  lapras: { dex:131, name:"LAPRAS", stats:[130,85,80,85,95,60], types:["WATER","ICE"], moves:["blizzard","surf","thunderbolt","sing"], growth:"slow", baseExp:187, nature:["MODEST","specialAttack","attack"], evs:[252,0,0,252,4,0] },
  rhydon: { dex:112, name:"RHYDON", stats:[105,130,120,45,45,40], types:["GROUND","ROCK"], moves:["earthquake","rockSlide","bodySlam","hyperBeam"], growth:"slow", baseExp:170, nature:["ADAMANT","attack","specialAttack"], evs:[252,252,0,0,4,0] },
  jolteon: { dex:135, name:"JOLTEON", stats:[65,65,60,110,95,130], types:["ELECTRIC"], moves:["thunderbolt","pinMissile","doubleKick","thunderWave"], growth:"mediumFast", baseExp:184, nature:["TIMID","speed","attack"], evs:[0,0,0,252,4,252] },
  dragonite: { dex:149, name:"DRAGONITE", stats:[91,134,95,100,100,80], types:["DRAGON","FLYING"], moves:["blizzard","thunderbolt","hyperBeam","agility"], growth:"slow", baseExp:300, nature:["ADAMANT","attack","specialAttack"], evs:[4,252,0,0,0,252], unlock:1 },
  mewtwo: { dex:150, name:"MEWTWO", stats:[106,110,90,154,90,130], types:["PSYCHIC"], moves:["psychic","recover","blizzard","thunderbolt"], growth:"slow", baseExp:340, nature:["TIMID","speed","attack"], evs:[0,0,0,252,4,252], unlock:3 }
};

const TYPE_MOVES = {
  NORMAL: ["bodySlam", "quickAttack"], FIGHTING: ["brickBreak", "seismicToss"],
  FLYING: ["wingAttack", "quickAttack"], POISON: ["sludgeBomb", "bodySlam"],
  GROUND: ["earthquake", "rockSlide"], ROCK: ["rockSlide", "earthquake"],
  BUG: ["xScissor", "pinMissile"], GHOST: ["shadowBall", "nightShade"],
  FIRE: ["flamethrower", "fireSpin"], WATER: ["surf", "iceBeam"],
  GRASS: ["razorLeaf", "sleepPowder"], ELECTRIC: ["thunderbolt", "thunderWave"],
  PSYCHIC: ["psychic", "recover"], ICE: ["iceBeam", "blizzard"],
  DRAGON: ["dragonClaw", "agility"]
};

function defaultMoves(raw) {
  const pool = raw.types.flatMap(type => TYPE_MOVES[type] || []);
  pool.push(raw.stats[1] >= raw.stats[3] ? "slash" : "psychic", "bodySlam", "rest", "tackle");
  return [...new Set(pool)].slice(0, 4);
}

const SPECIES = Object.fromEntries((window.GEN1_SPECIES || []).map(raw => [raw.id, {
  ...raw,
  moves: defaultMoves(raw),
  nature: ["HARDY", null, null],
  evs: [84, 84, 84, 84, 84, 84]
}]));
Object.entries(CURATED_SPECIES).forEach(([id, curated]) => {
  SPECIES[id] = { ...SPECIES[id], ...curated, catchRate: SPECIES[id]?.catchRate || 45, sprite: SPECIES[id]?.sprite || id };
});

const STARTER_IDS = ["charmander", "squirtle", "bulbasaur", "pikachu"];
const EGG_POOL = [
  ...STARTER_IDS,"caterpie","weedle","pidgey","rattata","spearow","ekans","sandshrew","nidoranf","nidoranm","clefairy","vulpix","jigglypuff","zubat","oddish","paras","venonat","diglett","meowth","psyduck","mankey","growlithe","poliwag","abra","machop","bellsprout","tentacool","geodude","ponyta","slowpoke","magnemite","farfetchd","doduo","seel","grimer","shellder","gastly","onix","drowzee","krabby","voltorb","exeggcute","cubone","koffing","rhyhorn","chansey","tangela","kangaskhan","horsea","goldeen","staryu","mrmime","scyther","jynx","electabuzz","magmar","pinsir","tauros","magikarp","lapras","eevee","omanyte","kabuto","aerodactyl","snorlax","dratini"
];

const ITEMS = {
  pokeBall: { name: "POKÉ BALL", price: 100, ball: 1, description: "Catch weakened wild Pokémon in Safari mode." },
  greatBall: { name: "GREAT BALL", price: 250, ball: 1.5, cups: 2, description: "A stronger ball unlocked after the Cascade Cup." },
  ultraBall: { name: "ULTRA BALL", price: 500, ball: 2, cups: 4, description: "A high-performance ball unlocked after the Rainbow Cup." },
  superBall: { name: "SUPER BALL", price: 800, ball: 2.6, cups: 6, description: "A premium Stadium ball unlocked after the Marsh Cup." },
  masterBall: { name: "MASTER BALL", price: 0, ball: 99, elite: true, description: "The ultimate ball. Awarded for defeating the Elite Four." },
  potion: { name: "POTION", price: 60, description: "Restore 40 HP to your active Pokémon." },
  superPotion: { name: "SUPER POTION", price: 150, description: "Restore 70 HP to your active Pokémon." },
  fullHeal: { name: "FULL HEAL", price: 180, description: "Clear any status condition." },
  revive: { name: "REVIVE", price: 300, description: "Revive one fainted teammate at half HP." }
};

const CUPS = [
  { badge: "BOULDER", mark: "◆", leader: "BROCK", sprite: "brock", types: ["ROCK","GROUND"], team: ["geodude","rhyhorn","onix"] },
  { badge: "CASCADE", mark: "◒", leader: "MISTY", sprite: "misty", types: ["WATER"], team: ["staryu","psyduck","starmie"] },
  { badge: "THUNDER", mark: "ϟ", leader: "LT. SURGE", sprite: "lt.surge", types: ["ELECTRIC"], team: ["voltorb","pikachu","raichu"] },
  { badge: "RAINBOW", mark: "✿", leader: "ERIKA", sprite: "erika", types: ["GRASS","POISON"], team: ["tangela","weepinbell","vileplume"] },
  { badge: "SOUL", mark: "◎", leader: "KOGA", sprite: "koga", types: ["POISON"], team: ["koffing","muk","weezing"] },
  { badge: "MARSH", mark: "◉", leader: "SABRINA", sprite: "sabrina", types: ["PSYCHIC"], team: ["kadabra","mrmime","alakazam"] },
  { badge: "VOLCANO", mark: "▲", leader: "BLAINE", sprite: "blaine", types: ["FIRE"], team: ["ponyta","rapidash","arcanine"] },
  { badge: "EARTH", mark: "⬢", leader: "GIOVANNI", sprite: "giovanni", types: ["GROUND"], team: ["dugtrio","nidoqueen","rhydon"] }
];

const CUP_ROUNDS = [
  [{ name:"HIKER", sprite:"hiker", team:["geodude","sandshrew","machop"], strategy:"brock" }, { name:"JR. TRAINER", sprite:"jr.trainerm", team:["rhyhorn","diglett","onix"], strategy:"brock" }],
  [{ name:"SWIMMER", sprite:"swimmer", team:["poliwag","goldeen","shellder"], strategy:"misty" }, { name:"SAILOR", sprite:"sailor", team:["tentacool","horsea","wartortle"], strategy:"misty" }],
  [{ name:"ENGINEER", sprite:"engineer", team:["magnemite","voltorb","pikachu"], strategy:"surge" }, { name:"ROCKER", sprite:"rocker", team:["electabuzz","magneton","raichu"], strategy:"surge" }],
  [{ name:"BEAUTY", sprite:"beauty", team:["oddish","bellsprout","paras"], strategy:"erika" }, { name:"JR. TRAINER", sprite:"jr.trainerf", team:["gloom","weepinbell","tangela"], strategy:"erika" }],
  [{ name:"BIKER", sprite:"biker", team:["koffing","grimer","zubat"], strategy:"koga" }, { name:"TAMER", sprite:"tamer", team:["arbok","golbat","muk"], strategy:"koga" }],
  [{ name:"PSYCHIC", sprite:"psychic", team:["abra","drowzee","slowpoke"], strategy:"sabrina" }, { name:"CHANNELER", sprite:"channeler", team:["kadabra","haunter","hypno"], strategy:"sabrina" }],
  [{ name:"BURGLAR", sprite:"burglar", team:["vulpix","growlithe","ponyta"], strategy:"blaine" }, { name:"SUPER NERD", sprite:"supernerd", team:["magmar","rapidash","ninetales"], strategy:"blaine" }],
  [{ name:"ROCKET", sprite:"rocket", team:["sandshrew","nidorino","cubone"], strategy:"giovanni" }, { name:"COOLTRAINER", sprite:"cooltrainerm", team:["dugtrio","nidoking","marowak"], strategy:"giovanni" }]
];

const ARCADE_CUPS = [
  {
    id:"poke", name:"POKÉ CUP", icon:"◉", boss:"GIOVANNI", bossSprite:"giovanni", prize:"FOCUS BAND", unlock:0,
    description:"A fast five-stage run through Kanto's back roads. Friendly faces quickly give way to Team Rocket.",
    stages:[
      { title:"ROUTE 1 SCRAMBLE", label:"TRAINER", trainer:{name:"YOUNGSTER",sprite:"youngster"}, team:["rattata","pidgey","caterpie"], strategy:"setup" },
      { title:"MAGIKARP IN THE ROAD", label:"ODDBALL", trainer:{name:"CONFUSED FISHERMAN",sprite:"fisher"}, team:["magikarp"], strategy:"rain", encounterText:"A Magikarp is lying in the middle of the road. Nobody knows how it got here." },
      { title:"ROCKET AMBUSH", label:"TRAINER", trainer:{name:"TEAM ROCKET",sprite:"rocket"}, team:["ekans","zubat","meowth"], strategy:"control" },
      { title:"STATIC IN THE SKY", label:"LEGENDARY", trainer:{name:"LEGENDARY CHALLENGER",sprite:"birdkeeper"}, randomTeam:["zapdos","articuno","moltres"], strategy:"surge", encounterText:"The arena lights fail. A legendary cry tears through the dark." },
      { title:"ROCKET BOSS", label:"BOSS", trainer:{name:"GIOVANNI",sprite:"giovanni"}, team:["persian","nidoking","rhydon"], strategy:"giovanni", levelBonus:1, boss:true }
    ]
  },
  {
    id:"great", name:"GREAT CUP", icon:"◎", boss:"BLUE", bossSprite:"rival3", prize:"LEFTOVERS", unlock:1,
    description:"A stranger, tougher circuit where roadblocks and rival trainers interrupt the bracket.",
    stages:[
      { title:"CELADON SHOWDOWN", label:"TRAINER", trainer:{name:"BEAUTY",sprite:"beauty"}, team:["persian","clefable","vileplume"], strategy:"erika" },
      { title:"BIG ASS SNORLAX", label:"ODDBALL", trainer:{name:"SLEEPING ROADBLOCK",sprite:"fisher"}, team:["snorlax"], strategy:"defense", levelBonus:2, encounterText:"A truly enormous Snorlax is asleep across the entire road. The flute is missing." },
      { title:"DOUBLE TROUBLE", label:"TRAINER", trainer:{name:"JESSIE & JAMES",sprite:"jessiejames"}, team:["arbok","weezing","persian"], strategy:"control" },
      { title:"LEGENDARY INTERRUPTION", label:"LEGENDARY", trainer:{name:"LEGENDARY CHALLENGER",sprite:"birdkeeper"}, randomTeam:["articuno","moltres","zapdos"], strategy:"rain", levelBonus:1, encounterText:"The bracket has been interrupted by an uninvited legendary Pokémon." },
      { title:"RIVAL BOSS", label:"BOSS", trainer:{name:"BLUE",sprite:"rival3"}, team:["pidgeot","alakazam","blastoise"], strategy:"setup", levelBonus:2, boss:true }
    ]
  },
  {
    id:"ultra", name:"ULTRA CUP", icon:"⬢", boss:"EVIL PROFESSOR OAK", bossSprite:"prof.oak", prize:"QUICK CLAW", unlock:2,
    description:"The rules collapse in Kanto's wildest arcade run. Fossils, champions and psychic monsters stand between you and the final boss.",
    stages:[
      { title:"VETERAN WALL", label:"TRAINER", trainer:{name:"COOLTRAINER",sprite:"cooltrainerm"}, team:["dragonair","lapras","machamp"], strategy:"setup", levelBonus:2 },
      { title:"FOSSIL PANIC", label:"ODDBALL", trainer:{name:"SUPER NERD",sprite:"supernerd"}, team:["aerodactyl","kabutops","omastar"], strategy:"sand", levelBonus:2, encounterText:"Someone pressed every fossil restoration button at once." },
      { title:"THE THREE BIRDS", label:"LEGENDARY", trainer:{name:"LEGENDARY GAUNTLET",sprite:"birdkeeper"}, team:["articuno","zapdos","moltres"], strategy:"rain", levelBonus:3 },
      { title:"MEWTWO BREAKS IN", label:"SECRET BOSS", trainer:{name:"MEWTWO",sprite:"psychic"}, team:["mewtwo"], strategy:"sabrina", levelBonus:5, encounterText:"This was not on the fight card. Mewtwo has entered the arena." },
      { title:"THE BAD PROFESSOR", label:"FINAL BOSS", trainer:{name:"EVIL PROFESSOR OAK",sprite:"prof.oak"}, team:["tauros","alakazam","dragonite"], strategy:"control", levelBonus:4, boss:true, encounterText:"Professor Oak has stopped pretending this was research." }
    ]
  }
];

const ELITE_FOUR = [
  { name: "LORELEI", sprite: "lorelei", team: ["dewgong","cloyster","lapras"] },
  { name: "BRUNO", sprite: "bruno", team: ["onix","hitmonchan","machamp"] },
  { name: "AGATHA", sprite: "agatha", team: ["golbat","haunter","gengar"] },
  { name: "LANCE", sprite: "lance", team: ["gyarados","dragonair","dragonite"] }
];

const TRAINERS = [
  ["BLUE","rival3"],["JESSIE & JAMES","jessiejames"],["BROCK","brock"],["MISTY","misty"],
  ["LT. SURGE","lt.surge"],["ERIKA","erika"],["KOGA","koga"],["SABRINA","sabrina"],
  ["BLAINE","blaine"],["GIOVANNI","giovanni"],["LORELEI","lorelei"],["BRUNO","bruno"],["AGATHA","agatha"],["LANCE","lance"],
  ["LASS","lass"],["YOUNGSTER","youngster"],["HIKER","hiker"],["COOLTRAINER","cooltrainerm"],
  ["CHANNELER","channeler"],["BLACKBELT","blackbelt"],["BEAUTY","beauty"],["BIKER","biker"],
  ["BIRD KEEPER","birdkeeper"],["PSYCHIC","psychic"],["SAILOR","sailor"],["SCIENTIST","scientist"]
].map(([name, sprite]) => ({ name, sprite }));

const EVOLUTIONS = {
  bulbasaur:["ivysaur",16],ivysaur:["venusaur",32],charmander:["charmeleon",16],charmeleon:["charizard",36],squirtle:["wartortle",16],wartortle:["blastoise",36],
  caterpie:["metapod",7],metapod:["butterfree",10],weedle:["kakuna",7],kakuna:["beedrill",10],pidgey:["pidgeotto",18],pidgeotto:["pidgeot",36],rattata:["raticate",20],spearow:["fearow",20],ekans:["arbok",22],pikachu:["raichu",25],sandshrew:["sandslash",22],
  nidoranf:["nidorina",16],nidorina:["nidoqueen",25],nidoranm:["nidorino",16],nidorino:["nidoking",25],clefairy:["clefable",25],vulpix:["ninetales",25],jigglypuff:["wigglytuff",25],zubat:["golbat",22],oddish:["gloom",21],gloom:["vileplume",30],paras:["parasect",24],venonat:["venomoth",31],diglett:["dugtrio",26],meowth:["persian",28],psyduck:["golduck",33],mankey:["primeape",28],growlithe:["arcanine",32],
  poliwag:["poliwhirl",25],poliwhirl:["poliwrath",35],abra:["kadabra",16],kadabra:["alakazam",36],machop:["machoke",28],machoke:["machamp",36],bellsprout:["weepinbell",21],weepinbell:["victreebel",30],tentacool:["tentacruel",30],geodude:["graveler",25],graveler:["golem",36],ponyta:["rapidash",40],slowpoke:["slowbro",37],magnemite:["magneton",30],doduo:["dodrio",31],seel:["dewgong",34],grimer:["muk",38],shellder:["cloyster",30],gastly:["haunter",25],haunter:["gengar",36],drowzee:["hypno",26],krabby:["kingler",28],voltorb:["electrode",30],exeggcute:["exeggutor",30],cubone:["marowak",28],koffing:["weezing",35],rhyhorn:["rhydon",42],horsea:["seadra",32],goldeen:["seaking",33],staryu:["starmie",30],magikarp:["gyarados",20],eevee:[["vaporeon","jolteon","flareon"],25],omanyte:["omastar",40],kabuto:["kabutops",40],dratini:["dragonair",30],dragonair:["dragonite",55]
};
const PRE_EVOLUTION = {};
Object.entries(EVOLUTIONS).forEach(([from, [to]]) => (Array.isArray(to) ? to : [to]).forEach(id => { PRE_EVOLUTION[id] = from; }));

const DIFFICULTIES = {
  casual: { label: "CASUAL", levelOffset: -2, intelligence: 0 },
  stadium: { label: "STADIUM", levelOffset: 0, intelligence: 1 },
  master: { label: "MASTER", levelOffset: 2, intelligence: 2 }
};

const AI_PROFILES = {
  rookie: { label: "ROOKIE · IMPULSIVE", damage: 1, status: 1, switching: 0 },
  aggressor: { label: "ACE TRAINER · PRESSURE", damage: 1.22, status: .72, switching: .85 },
  tactician: { label: "COOLTRAINER · ADAPTIVE", damage: 1, status: 1, switching: 1.18 },
  controller: { label: "CHANNELER · CONTROL", damage: .88, status: 1.38, switching: 1.05 },
  master: { label: "STADIUM MASTER · PREDICTIVE", damage: 1.12, status: 1.12, switching: 1.35 }
};

const TYPE_CHART = {
  NORMAL: { ROCK:.5, GHOST:0 },
  FIGHTING: { NORMAL:2, ICE:2, ROCK:2, POISON:.5, FLYING:.5, PSYCHIC:.5, BUG:.5, GHOST:0 },
  FLYING: { FIGHTING:2, BUG:2, GRASS:2, ROCK:.5, ELECTRIC:.5 },
  POISON: { GRASS:2, POISON:.5, GROUND:.5, ROCK:.5, GHOST:.5 },
  GROUND: { POISON:2, ROCK:2, FIRE:2, ELECTRIC:2, BUG:.5, GRASS:.5, FLYING:0 },
  ROCK: { FLYING:2, BUG:2, FIRE:2, ICE:2, FIGHTING:.5, GROUND:.5 },
  BUG: { GRASS:2, PSYCHIC:2, POISON:.5, FIRE:.5, FIGHTING:.5, FLYING:.5, GHOST:.5 },
  GHOST: { GHOST:2, PSYCHIC:2, NORMAL:0 },
  FIRE: { BUG:2, GRASS:2, ICE:2, FIRE:.5, WATER:.5, ROCK:.5, DRAGON:.5 },
  WATER: { FIRE:2, GROUND:2, ROCK:2, WATER:.5, GRASS:.5, DRAGON:.5 },
  GRASS: { WATER:2, GROUND:2, ROCK:2, FIRE:.5, GRASS:.5, POISON:.5, FLYING:.5, BUG:.5, DRAGON:.5 },
  ELECTRIC: { WATER:2, FLYING:2, ELECTRIC:.5, GRASS:.5, DRAGON:.5, GROUND:0 },
  PSYCHIC: { FIGHTING:2, POISON:2, PSYCHIC:.5 },
  ICE: { GRASS:2, GROUND:2, FLYING:2, DRAGON:2, FIRE:.5, WATER:.5, ICE:.5 },
  DRAGON: { DRAGON:2 }
};

