
"use strict";
(() => {
  const Runtime=window.YSRuntime;
  const scene=document.getElementById('trainer-scene');
  const button=document.getElementById('scene-continue');
  const quotes={
    BROCK:['My team will turn the arena itself against you. Show me you can break our formation!','You read my strategy and broke through it. You earned the Boulder Badge.','The sand and Spikes dictated the match. Bring Water or Grass pressure, switch with purpose, and strike when Protect leaves an opening.'],
    MISTY:['Let’s see how your team handles the tide!','You made quite a splash! The Cascade Badge is yours.','Keep training. I’ll be waiting for a rematch!'],
    'LT. SURGE':['Ready for an electrifying battle?','Now that’s power! Take the Thunder Badge.','Your team needs a little more charge. Try again!'],
    ERIKA:['A calm mind can bring out remarkable strength.','A beautiful battle. Please accept the Rainbow Badge.','Let your team grow, then visit again.'],
    KOGA:['Can you see through my strategy?','You have overcome my tricks. Take the Soul Badge.','Strength alone cannot overcome every challenge.'],
    SABRINA:['Your next decision will decide this battle.','You surprised me. The Marsh Badge belongs to you.','Consider your next move carefully.'],
    BLAINE:['Let’s turn up the heat!','A blazing performance! You earned the Volcano Badge.','Keep that spark alive and return stronger.'],
    GIOVANNI:['Show me what your journey has taught you.','You have proven yourself. Take the Earth Badge.','You still have much to learn. Return when you are ready.']
  };
  const encounterPlans={
    boulderFinal:{
      plan:'Geodude summons sand, Rhyhorn lays Spikes, and Onix closes as Brock’s ace.',
      counter:'Water and Grass attacks crack his defense. Avoid extra switches after Spikes and use Protect turns to recover or set up.'
    }
  };
  let finish=null;
  const supported=b=>['cup','trainer','trainerDuo','elite','arcade'].includes(b.mode);
  const badgeSymbols=['◆','●','ϟ','✿','☠','◉','▲','◇'];
  function badge(node,index){node.style.removeProperty('background-image');node.style.removeProperty('background-position');node.classList.add(`badge-${index}`);node.textContent=badgeSymbols[index]||'◆';node.setAttribute('role','img');node.setAttribute('aria-label',`${CUPS[index].badge} Badge`);}
  function drawPips(node,count){
    if(!node)return;
    node.replaceChildren(...Array.from({length:Math.min(6,Math.max(1,count||1))},()=>document.createElement('i')));
  }
  function show(b,victory){
    const intro=victory===undefined,name=b.trainer?.name||'TRAINER';
    scene.dataset.phase=intro?'intro':victory?'win':'loss';
    const cupStage=b.mode==='cup'?(b.cupRound===2?'LEADER BATTLE':`BATTLE ${(b.cupRound||0)+1} OF 3`):'';
    document.getElementById('scene-kicker').textContent=intro?(b.mode==='cup'?`${CUPS[b.cupIndex].badge} JOURNEY · ${cupStage}`:b.mode==='arcade'?`${ARCADE_CUPS[b.arcadeCupIndex].name} · STAGE ${b.arcadeStage+1}/${ARCADE_CUPS[b.arcadeCupIndex].stages.length} · ${b.arcadeLabel}`:b.mode==='elite'?'POKÉMON LEAGUE':'TRAINER CHALLENGE'):'MATCH COMPLETE';
    document.getElementById('scene-title').textContent=intro?`YOU  VS  ${name}`:victory?`You defeated ${name}!`:`${name} wins the match!`;
    const foeName=document.getElementById('scene-foe-name');if(foeName)foeName.textContent=name.toUpperCase();
    drawPips(document.getElementById('scene-player-pips'),b.player?.length||Runtime.save?.party?.length||3);
    drawPips(document.getElementById('scene-foe-pips'),b.enemy?.length||b.trainer?.team?.length||3);
    const sprite=document.getElementById('scene-trainer');sprite.src=assetUrl(`./assets/trainers/${b.trainer?.sprite||'youngster'}.png`);sprite.alt=name;
    const leader=b.mode==='cup'&&b.cupRound===2,lines=leader?quotes[name]:null;
    const qualifierIntro=b.mode==='cup'&&!leader?`You will not reach ${CUPS[b.cupIndex].leader} without getting through my team first!`:null;
    document.getElementById('scene-quote').textContent=b.mode==='arcade'&&intro?(b.encounterText||`${b.arcadeStageTitle}. Clear the stage to keep your Cup run alive.`):lines?lines[intro?0:victory?1:2]:intro?(qualifierIntro||'Our eyes have met. Let’s see what your Pokémon can do!'):victory?'You and your Pokémon make a great team. The next challenger is waiting!':'A good battle! Train your team and challenge me again.';
    const plan=intro&&encounterPlans[b.encounter];
    const planNode=document.getElementById('scene-plan');planNode.hidden=!plan;
    if(plan){document.getElementById('scene-plan-copy').textContent=plan.plan;document.getElementById('scene-counter-copy').textContent=plan.counter;}
    const icon=document.getElementById('scene-badge');icon.hidden=intro||!victory||!leader;if(!icon.hidden)badge(icon,b.cupIndex);
    button.textContent=intro?'LET’S BATTLE ▸':'VIEW REWARDS ▸';scene.hidden=false;button.focus();
  }
  button.onclick=()=>finish?.();
  scene.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();finish?.();}if(event.key==='Tab'){event.preventDefault();button.focus();}});
  async function intro(b){
    if(!supported(b))return;
    show(b);
    window.YSFlow?.emit("presentation:trainerIntro", { battle: b });
    await new Promise(resolve=>{
      let ended=false;const done=()=>{if(ended)return;ended=true;scene.hidden=true;if(finish===done)finish=null;resolve();};finish=done;
      // Short automatic intro; the button or Escape skips it immediately.
      void delay(window.BattlePresentationDirector?.delay(2000)??YSPresentationInternals.BattlePolish?.delay(2000)??2000).then(done);
    });
  }
  function outro(b,victory){
    if(!supported(b))return;
    Runtime.element('result-modal').hidden=true;show(b,victory);
    finish=()=>{scene.hidden=true;finish=null;Runtime.element('result-modal').hidden=false;Runtime.element('continue-button').focus();};
  }
  window.TrainerScenes={intro,outro,badge,finish:()=>finish?.()};
})();

