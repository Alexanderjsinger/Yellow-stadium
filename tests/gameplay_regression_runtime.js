"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { createHarness, loadCore, ROOT } = require("./helpers/runtime_harness");
const fixtures = JSON.parse(fs.readFileSync(path.join(ROOT,"tests/fixtures/gameplay-fixtures.json"),"utf8"));

function loadBattleBasics(h){
  h.load("src/battle/model.js");
  h.load("src/battle/start.js");
  h.load("src/battle/ai.js");
  h.load("src/battle/damage-status.js");
  h.load("src/battle/experience-evolution.js");
  return h;
}

function loadOnboarding(h){ h.load("src/onboarding/core.js"); return h; }

function prepareSinglePokemon(h, species="pikachu", level=50){
  h.run(`
    save = loadSave();
    save.onboardingComplete = true;
    save.introComplete = true;
    save.owned = [];
    save.pokemon = [];
    save.activePartyInstanceIds = [];
    save.adventurePartyInstanceIds = [];
  `);
  loadOnboarding(h);
  h.run(`addOwned(${JSON.stringify(species)}, ${Number(level)}); selected = [save.pokemon[0].uid]; save.activePartyInstanceIds=[...selected]; save.adventurePartyInstanceIds=[...selected]; writeSave();`);
}

async function testOnboardingAndSaveReload(){
  const h=loadCore(createHarness({seed:fixtures.rng_seed}));
  h.load("src/battle/model.js");
  loadOnboarding(h);
  h.run(`chooseStarter("pikachu"); hatchEgg(0); hatchEgg(1); finishOnboarding();`);
  const state=h.json(`({
    complete:save.onboardingComplete,
    introComplete:save.introComplete,
    owned:save.owned,
    pokemon:save.pokemon.map(x=>({uid:x.uid,speciesId:x.speciesId})),
    selected:[...selected],
    active:[...save.activePartyInstanceIds],
    adventure:[...save.adventurePartyInstanceIds],
    pending:[...save.pendingEggs],
    hatched:[...save.hatchedEggs]
  })`);
  assert.strictEqual(state.complete,true,"onboarding did not complete");
  assert.strictEqual(state.introComplete,true,"intro completion not persisted");
  assert.strictEqual(state.pokemon.length,3,"starter + two eggs should create three Pokémon records");
  assert.strictEqual(new Set(state.pokemon.map(x=>x.uid)).size,3,"Pokémon instance IDs must stay unique");
  assert.deepStrictEqual(state.selected,state.active,"selected party diverged from persisted active party");
  assert.deepStrictEqual(state.active,state.adventure,"new-game adventure party should mirror active party");
  assert.deepStrictEqual(state.pending,[],"pending eggs should clear after onboarding");
  assert.deepStrictEqual(state.hatched,[],"hatched egg slots should clear after onboarding");

  const before=h.json(`save`);
  h.run(`save = loadSave(); selected = save.activePartyInstanceIds.slice();`);
  const after=h.json(`save`);
  assert.strictEqual(after.version,9,"save schema changed during reload");
  assert.deepStrictEqual(after.owned,before.owned,"owned species changed across save/reload");
  assert.deepStrictEqual(after.activePartyInstanceIds,before.activePartyInstanceIds,"party instance IDs changed across save/reload");
  assert.strictEqual(after.onboardingComplete,true,"onboarding flag lost across save/reload");
  return {owned:after.owned,party:after.activePartyInstanceIds};
}

async function testDamageAndTurnDeterminism(){
  const h=loadBattleBasics(loadCore(createHarness({seed:fixtures.rng_seed})));
  prepareSinglePokemon(h,"pikachu",fixtures.damage.level);
  h.setSeed(fixtures.rng_seed);
  const sample=h.json(`(()=>{
    const a=createMon(save.pokemon[0].uid,"player",${fixtures.damage.level});
    const d=createMon(${JSON.stringify(fixtures.damage.defender)},"enemy",${fixtures.damage.level});
    const r=calculateDamage(a,d,MOVES[${JSON.stringify(fixtures.damage.move)}]);
    return {damage:r.damage,critical:r.critical,attackerHp:a.maxHp,defenderHp:d.maxHp};
  })()`);
  assert.strictEqual(sample.damage,fixtures.damage.expected_damage,"seeded Thunderbolt damage drifted");
  assert.strictEqual(sample.critical,fixtures.damage.expected_critical,"seeded critical result drifted");

  h.load("src/battle/faint-end-turn.js");
  h.load("src/battle/turns.js");
  h.run(`
    battle={
      player:[createMon(save.pokemon[0].uid,"player",50)], enemy:[createMon("squirtle","enemy",50)],
      mode:"trainer",difficulty:"stadium",profile:AI_PROFILES.rookie,pActive:0,eActive:0,turn:1,locked:false,over:false,
      participants:new Set([0]),aiSwitchCooldown:0,lastPlayerMove:null,actedThisTurn:[]
    };
  `);
  h.setSeed(fixtures.rng_seed);
  h.run(`function endBattle(victory){ battle.over=true; battle.victory=victory; }`);
  await h.run(`takeTurn(3)`);
  const turn=h.json(`({turn:battle.turn,locked:battle.locked,playerHp:battle.player[0].hp,enemyHp:battle.enemy[0].hp,playerPp:battle.player[0].pp[0],over:battle.over,lastMove:battle.lastPlayerMove?.name})`);
  assert.strictEqual(turn.turn,2,"deterministic battle turn did not advance");
  assert.strictEqual(turn.locked,false,"battle remained locked after turn");
  assert.strictEqual(turn.over,false,"reference turn unexpectedly ended battle");
  assert.strictEqual(turn.playerPp,15,"Thunderbolt PP should remain untouched in the reference Quick Attack turn");
  assert.strictEqual(turn.lastMove,"QUICK ATTACK","player move tracking drifted");
  assert.strictEqual(turn.enemyHp,fixtures.turn.enemy_hp,"seeded enemy HP outcome drifted");
  assert.strictEqual(turn.playerHp,fixtures.turn.player_hp,"seeded player HP outcome drifted");
  return {damage:sample,turn};
}

async function testSwitchSlotSynchronization(){
  const h=loadBattleBasics(loadCore(createHarness({seed:fixtures.rng_seed})));
  prepareSinglePokemon(h,"pikachu",30);
  h.run(`
    addOwned("bulbasaur",30);
    selected=[save.pokemon[0].uid,save.pokemon[1].uid];
    save.activePartyInstanceIds=[...selected];
    battle={
      player:[createMon(save.pokemon[0].uid,"player",30),createMon(save.pokemon[1].uid,"player",30)],
      enemy:[createMon("squirtle","enemy",30),createMon("charmander","enemy",30)],
      mode:"trainer",difficulty:"stadium",profile:AI_PROFILES.rookie,pActive:0,eActive:0,turn:1,locked:false,over:false,
      participants:new Set([0]),aiSwitchCooldown:0,lastPlayerMove:null,actedThisTurn:[],slots:{player:[0],enemy:[0]}
    };
    announce=()=>{}; updateBattleUI=()=>{}; delay=async()=>{}; enemyUtilityResponse=async()=>{battle.locked=false;};
  `);
  h.load("src/battle/switch.js");
  await h.run(`switchPlayer(1)`);
  let state=h.json(`({pActive:battle.pActive,slot:battle.slots.player[0],locked:battle.locked})`);
  assert.strictEqual(state.pActive,1,"manual switch did not update legacy active index");
  assert.strictEqual(state.slot,1,"manual switch did not update Stadium slot index");
  assert.strictEqual(state.locked,false,"manual switch did not return battle control");

  h.load("src/battle/faint-end-turn.js");
  h.run(`
    battle.pActive=0; battle.slots.player=[0]; battle.player[0].hp=0; battle.player[1].hp=Math.max(1,battle.player[1].hp);
    endBattle=v=>{battle.over=true;battle.victory=v;};
  `);
  await h.run(`faintAndAdvance("player")`);
  state=h.json(`({pActive:battle.pActive,slot:battle.slots.player[0],over:battle.over})`);
  assert.strictEqual(state.pActive,1,"faint replacement did not update legacy active index");
  assert.strictEqual(state.slot,1,"faint replacement did not update Stadium slot index");
  assert.strictEqual(state.over,false,"faint replacement incorrectly ended a battle with a healthy reserve");
  return state;
}

async function testJourneyGymAndCupProgression(){
  const h=loadBattleBasics(loadCore(createHarness({seed:fixtures.rng_seed})));
  prepareSinglePokemon(h,"pikachu",30);
  h.run(`
    window.__battleStarts=[];
    startBattle=(mode,config)=>window.__battleStarts.push({mode,config});
  `);
  h.load("src/journey/journey.js");
  h.run(`startCupRound(${fixtures.journey.gym_index},${fixtures.journey.boss_round});`);
  const launch=h.json(`window.__battleStarts[0]`);
  assert.strictEqual(launch.mode,"cup","Journey gym did not launch Cup battle mode");
  assert.strictEqual(launch.config.cupIndex,fixtures.journey.gym_index,"wrong gym index launched");
  assert.strictEqual(launch.config.cupRound,fixtures.journey.boss_round,"wrong gym round launched");
  assert.strictEqual(launch.config.enemyIds.length,3,"Pewter boss reference team should contain three opponents");

  // Restore the engine start symbol for helpers used by the result pipeline.
  h.load("src/battle/start.js");
  h.load("src/battle/experience-evolution.js");
  h.load("src/battle/end.js");
  h.run(`
    save.coins=300; save.cupsCompleted=0; save.wins=0; save.losses=0; save.streak=0; save.sharedExp=true;
    battle={
      player:[createMon(save.pokemon[0].uid,"player",30)], enemy:[createMon("onix","enemy",15)],
      mode:"cup",difficulty:"stadium",profile:AI_PROFILES.rookie,pActive:0,eActive:0,turn:3,locked:false,over:false,
      participants:new Set([0]),captured:false,cupIndex:${fixtures.journey.gym_index},cupRound:${fixtures.journey.boss_round},trainer:CUP_ROUNDS[0][2]
    };
    endBattle(true);
  `);
  const state=h.json(`({cupsCompleted:save.cupsCompleted,coins:save.coins,wins:save.wins,losses:save.losses,streak:save.streak,over:battle.over,victory:battle.victory,resultTitle:els["result-title"].textContent})`);
  assert.strictEqual(state.cupsCompleted,fixtures.journey.expected_badges_after_win,"Gym badge progression drifted");
  assert.strictEqual(state.coins,300+fixtures.journey.expected_coin_gain,"Gym coin reward drifted");
  assert.strictEqual(state.wins,1,"Journey victory record drifted");
  assert.strictEqual(state.over,true,"finished Journey battle not marked over");
  assert.strictEqual(state.victory,true,"Journey battle victory flag missing");
  assert.strictEqual(state.resultTitle,"VICTORY!","Journey result UI state drifted");
  return {launch,state};
}

async function testSafariCapture(){
  const h=loadBattleBasics(loadCore(createHarness({seed:fixtures.rng_seed})));
  prepareSinglePokemon(h,"pikachu",12);
  loadOnboarding(h);
  h.run(`
    window.PartyAutoFill={assignCaught:()=>false};
    function endBattle(victory){ battle.over=true; battle.victory=victory; window.__captureEnded=victory; }
    save.inventory.masterBall=1;
    battle={
      player:[createMon(save.pokemon[0].uid,"player",12)],enemy:[createMon(${JSON.stringify(fixtures.safari.species)},"enemy",${fixtures.safari.level})],
      mode:"safari",difficulty:"stadium",profile:AI_PROFILES.rookie,pActive:0,eActive:0,turn:1,locked:false,over:false,
      participants:new Set([0]),captured:false,actedThisTurn:[]
    };
  `);
  h.load("src/battle/items-capture.js");
  await h.run(`useBattleItem(${JSON.stringify(fixtures.safari.ball)})`);
  const state=h.json(`({captured:battle.captured,victory:battle.victory,ended:window.__captureEnded,balls:save.inventory.masterBall,owned:save.owned,pokemon:save.pokemon.map(x=>x.speciesId),caughtNew:battle.caughtNew})`);
  assert.strictEqual(state.captured,true,"Master Ball Safari capture failed");
  assert.strictEqual(state.ended,true,"capture did not end battle as victory");
  assert.strictEqual(state.balls,0,"capture ball was not consumed exactly once");
  assert(state.owned.includes(fixtures.safari.species),"captured species missing from owned list");
  assert(state.pokemon.includes(fixtures.safari.species),"captured Pokémon instance missing");
  assert.strictEqual(state.caughtNew,true,"first capture should be marked new");
  return state;
}

async function testArcadeCupProgression(){
  const h=loadBattleBasics(loadCore(createHarness({seed:fixtures.rng_seed})));
  prepareSinglePokemon(h,"pikachu",35);
  h.load("src/battle/experience-evolution.js");
  h.load("src/battle/end.js");
  const before=h.json(`({coins:save.coins,focusBand:save.inventory.focusBand||0})`);
  h.run(`
    save.arcadeCupClears=[false,false,false]; save.arcadeCupProgress=[0,0,0]; save.sharedExp=true; ITEMS.focusBand ||= {name:"FOCUS BAND"}; ITEMS.leftovers ||= {name:"LEFTOVERS"}; ITEMS.quickClaw ||= {name:"QUICK CLAW"};
    battle={player:[createMon(save.pokemon[0].uid,"player",35)],enemy:[createMon("rattata","enemy",20)],mode:"arcade",difficulty:"stadium",profile:AI_PROFILES.rookie,pActive:0,eActive:0,turn:1,locked:false,over:false,participants:new Set([0]),captured:false,arcadeCupIndex:0,arcadeStage:ARCADE_CUPS[0].stages.length-1,arcadeStageTitle:ARCADE_CUPS[0].stages.at(-1).title};
    endBattle(true);
  `);
  const after=h.json(`({cleared:save.arcadeCupClears[0],progress:save.arcadeCupProgress[0],focusBand:save.inventory.focusBand||0,coins:save.coins,complete:battle.arcadeCupComplete})`);
  assert.strictEqual(after.cleared,true,"Poké Cup clear flag drifted");
  assert.strictEqual(after.progress,0,"cleared arcade Cup should reset stage progress");
  assert.strictEqual(after.focusBand,before.focusBand+1,"first Poké Cup clear should award Focus Band");
  assert.strictEqual(after.complete,true,"arcade completion flag missing");
  assert(after.coins>before.coins,"arcade boss victory should award coins");
  return after;
}

async function testPokeCenterHealing(){
  const h=loadBattleBasics(loadCore(createHarness({seed:fixtures.rng_seed})));
  prepareSinglePokemon(h,"pikachu",20);
  h.run(`
    const record=save.pokemon[0];
    const max=calculatedStats(record.speciesId,levelFor(record.uid)).hp;
    record.adventureState={hp:1,status:"PSN",sleep:2};
    window.PartyAutoFill={partyIds:()=>[record.uid]};
    window.PartyTray={render(){}};
    window.JourneyController={renderPartyPanel(){},show(){}};
  `);
  h.load("src/pokecenter/pokecenter.js");
  const before=h.json(`({hurt:window.PokeCenter.damagedCount(),fainted:window.PokeCenter.allPartyFainted(),state:save.pokemon[0].adventureState})`);
  assert.strictEqual(before.hurt,1,"damaged party member was not detected");
  const healed=await h.run(`window.PokeCenter.healAll()`);
  const after=h.json(`({hurt:window.PokeCenter.damagedCount(),fainted:window.PokeCenter.allPartyFainted(),state:save.pokemon[0].adventureState,max:calculatedStats(save.pokemon[0].speciesId,levelFor(save.pokemon[0].uid)).hp})`);
  assert.strictEqual(Array.from(healed).length,1,"PokéCenter should heal exactly one active party member");
  assert.strictEqual(after.hurt,0,"PokéCenter did not clear damaged state");
  assert.strictEqual(after.state.hp,after.max,"PokéCenter did not restore max HP");
  assert.strictEqual(after.state.status,null,"PokéCenter did not clear status");
  assert.strictEqual(after.state.sleep,0,"PokéCenter did not clear sleep counter");
  return {before,after};
}

(async()=>{
  const results={
    onboarding_save:await testOnboardingAndSaveReload(),
    battle:await testDamageAndTurnDeterminism(),
    switch_sync:await testSwitchSlotSynchronization(),
    journey_gym:await testJourneyGymAndCupProgression(),
    safari:await testSafariCapture(),
    arcade:await testArcadeCupProgression(),
    pokecenter:await testPokeCenterHealing(),
  };
  const reportPath=path.join(ROOT,"reports/f1-gameplay-regression.json");
  fs.writeFileSync(reportPath,JSON.stringify({seed:fixtures.rng_seed,results},null,2)+"\n");
  console.log("PASS: F1 deterministic gameplay regressions (onboarding/save, battle, switch sync, Journey/Gym, Safari, Cups, PokéCenter)");
})().catch(error=>{ console.error(error); process.exit(1); });
