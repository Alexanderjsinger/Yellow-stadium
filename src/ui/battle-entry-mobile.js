
"use strict";
(() => {
  const Runtime=window.YSRuntime;
  const byId=id=>document.getElementById(id);
  const screen=byId('battle-screen'), area=screen.querySelector('.command-area');
  const tabs=document.createElement('div');tabs.className='battle-command-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Battle commands');
  const panes={};let currentTab='fight',lastBattle=null;
  const labels={fight:'FIGHT',bag:'BAG',team:'PARTY',info:'RUN'};
  for(const key of Object.keys(labels)){
    const b=document.createElement('button');b.type='button';b.id=`command-tab-${key}`;b.textContent=labels[key];b.setAttribute('role','tab');b.setAttribute('aria-controls',`command-pane-${key}`);b.onclick=()=>selectTab(key);tabs.append(b);
    const p=document.createElement('section');p.id=`command-pane-${key}`;p.className='command-pane';p.setAttribute('role','tabpanel');p.setAttribute('aria-labelledby',b.id);p.tabIndex=0;panes[key]=p;
  }
  panes.fight.append(byId('moves'));panes.bag.append(byId('battle-items'));panes.team.append(byId('team-buttons'));
  panes.info.append(byId('field-readout'),screen.querySelector('.battle-history'),screen.querySelector('.camera-controls'));
  const moveHelp=document.createElement('div');moveHelp.className='battle-move-help';panes.info.append(moveHelp);
  const broadcast=screen.querySelector('.stadium-broadcast');if(broadcast)panes.info.append(broadcast);
  area.replaceChildren(...Object.values(panes));area.after(tabs);
  const emptyBag=document.createElement('p');emptyBag.textContent='Your bag is empty. Buy supplies in the Item Shop.';panes.bag.append(emptyBag);
  function selectTab(key){currentTab=key;for(const [name,p] of Object.entries(panes)){p.hidden=name!==key;const b=byId(`command-tab-${name}`);b.setAttribute('aria-selected',String(name===key));b.tabIndex=name===key?0:-1;}}
  tabs.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const keys=Object.keys(labels),i=keys.indexOf(currentTab);selectTab(keys[(i+(e.key==='ArrowRight'?1:3))%4]);byId(`command-tab-${currentTab}`).focus();});
  function decorateBattleParty(){const root=byId('team-buttons'),b=Runtime.battle;if(!root||!b?.player)return;[...root.querySelectorAll('.team-button')].forEach((button,index)=>{const mon=b.player[index];if(!mon)return;let img=button.querySelector('img.ui5-team-sprite');if(!img){img=document.createElement('img');img.className='ui5-team-sprite';img.alt=mon.name||'Pokémon';button.prepend(img);}try{setSprite(img,mon.id);}catch{}if(mon.hp<=0)button.dataset.fainted='true';else delete button.dataset.fainted;});}
  function renderBattle(){const active=!!Runtime.battle;document.body.classList.toggle('mobile-battle',active);if(!active)return;screen.dataset.duo=String(Runtime.battle.mode==='trainerDuo');screen.dataset.ui4Mode=Runtime.battle.mode||'trainer';if(lastBattle!==Runtime.battle){lastBattle=Runtime.battle;selectTab('fight');}
    emptyBag.hidden=byId('battle-items').children.length>0;decorateBattleParty();
    const title={safari:'WILD ENCOUNTER',cup:'GYM BATTLE',arcade:'CUP BATTLE',elite:'ELITE FOUR',mewtwo:'FINAL BATTLE',legendary:'LEGENDARY BATTLE',trainer:'RIVAL BATTLE',trainerDuo:'RIVAL BATTLE'}[Runtime.battle.mode]||'BATTLE';
    const match=byId('match-type');if(match){match.dataset.engineLabel=match.textContent;match.textContent=title;}
    for(const choice of byId('moves').querySelectorAll('.move-choice')){const move=MOVES[choice.dataset.moveId];if(move){choice.dataset.type=String(move.type||'normal').toLowerCase();choice.querySelector('.move-button')?.setAttribute('data-type',String(move.type||'normal').toLowerCase());}}
    const actor=StadiumUpgrade.active('player')[Runtime.battle.commandSlot||0]||StadiumUpgrade.active('player')[0];
    moveHelp.replaceChildren();if(actor)actor.moveIds.forEach(id=>{const d=document.createElement('details'),s=document.createElement('summary'),p=document.createElement('p');s.textContent=MOVES[id].name;p.textContent=PokemonDetails.describe(MOVES[id]);d.append(s,p);moveHelp.append(d);});
  }
  window.YSFlow?.on('battle:ui',renderBattle,30);
  // Preserve the actual command nodes and their handlers; tabs only change visibility.
  for(const key of ['bag','team'])panes[key].addEventListener('click',e=>{if(e.target.closest('button')&&!e.target.closest('button').disabled)selectTab('fight');});
  byId('continue-button').addEventListener('click',renderBattle);
  selectTab('fight');

  const ready=document.createElement('div');ready.id='mode-ready';ready.className='modal mode-ready';ready.hidden=true;
  ready.innerHTML='<section class="ready-card" role="dialog" aria-modal="true" aria-labelledby="ready-title"><header><div><p class="eyebrow" id="ready-mode"></p><h2 id="ready-title">Ready?</h2></div><button type="button" id="ready-close" aria-label="Go back">×</button></header><div class="ready-body"><p id="ready-description"></p><div id="ready-team"></div><button type="button" id="ready-edit" class="secondary-button">EDIT PARTY / PRESETS</button><label class="ready-difficulty">Difficulty<select id="ready-difficulty"><option value="casual">Casual</option><option value="stadium">Stadium</option><option value="master">Master</option></select></label><p id="ready-status" role="status"></p></div><footer><button type="button" id="ready-go" class="primary-button">LET’S GO</button></footer></section>';
  document.body.append(ready);let launch=null,required=3,starting=false,returnFocus=null;
  function readyTeam(){if(ready.hidden)return;const team=byId('ready-team');team.replaceChildren();Runtime.selectedIds.slice(0,required).forEach(uid=>{const record=pokemonRecord(uid),id=record.speciesId,card=document.createElement('div'),img=document.createElement('img'),name=document.createElement('span');img.alt='';setSprite(img,id);name.textContent=`${pokemonNameFor(uid)} · L${levelFor(uid)}`;card.append(img,name);team.append(card);});
    for(let i=Runtime.selectedIds.length;i<required;i++){const card=document.createElement('div');card.textContent=`+ Slot ${i+1}`;team.append(card);}
    const complete=Runtime.selectedIds.length===required;byId('ready-status').textContent=complete?`${required} Pokémon ready. First Pokémon leads.`:`Choose ${required} Pokémon for this match (${Runtime.selectedIds.length} selected).`;byId('ready-go').disabled=!complete;byId('ready-difficulty').value=Runtime.save.difficulty;
  }
  function dismiss(){ready.hidden=true;launch=null;document.body.classList.remove('ready-open');returnFocus?.focus?.();}
  function prepare(run,size,title,description='Review your party, choose a difficulty, then enter.'){if(Runtime.battle)return;clearTimeout(safariAggressionTimer);if(byId('mode-nav').hidden&&Runtime.save.onboardingComplete){byId('mode-nav').hidden=false;showCups();}required=size;setTeamSize(size);returnFocus=document.activeElement;launch=run;byId('ready-mode').textContent=title;byId('ready-description').textContent=description;const safariReady=title.includes('SAFARI');const difficultyRow=byId('ready-difficulty')?.closest('.ready-difficulty');if(difficultyRow)difficultyRow.hidden=safariReady;ready.hidden=false;document.body.classList.add('ready-open');readyTeam();byId('ready-close').focus();}
  byId('ready-close').onclick=dismiss;ready.onclick=e=>{if(e.target===ready)dismiss();};
  ready.onkeydown=e=>{if(e.key==='Escape'){dismiss();return;}if(e.key==='Tab'){const focus=[...ready.querySelectorAll('button:not(:disabled),select')],a=focus[0],z=focus[focus.length-1];if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus();}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus();}}};
  byId('ready-edit').onclick=()=>PartyTray.open();
  byId('ready-difficulty').onchange=e=>{Runtime.updateSave(current=>{current.difficulty=e.target.value;});renderDifficulty();};
  byId('ready-go').onclick=()=>{if(Runtime.selectedIds.length!==required||!launch)return;const run=launch;dismiss();starting=true;try{run();}finally{starting=false;}renderBattle();};
  window.YSFlow?.on('party-tray:rendered',readyTeam,30);
  function interceptStart(mode='trainer',config={},startNow){if(starting||['cup','safari','elite','mewtwo','legendary'].includes(mode))return false;prepare(()=>startNow(mode,config),mode==='trainerDuo'?6:3,mode==='arcade'?`${ARCADE_CUPS[config.arcadeCupIndex].name} · ${config.arcadeStageTitle}`:mode==='trainerDuo'?'EXHIBITION · DOUBLES':'EXHIBITION · SINGLES');return true;}
  function prepareTrainerMode(size){prepare(()=>startTrainer(size),size,size===6?'CUP ARCADE · 6v6 DOUBLES':'CUP ARCADE · 3v3 SINGLES');}
  // Replace mode-entry labels and avoid redirecting to the roster for an incomplete party.
  for(const [id,size] of [['prepare-singles',3],['prepare-duos',6]]){const node=byId(id);node.firstChild.textContent=size===3?'PLAY SINGLES ':'PLAY DOUBLES ';}
  function syncTrainerLabels(){byId('prepare-singles').firstChild.textContent='PLAY SINGLES ';byId('prepare-duos').firstChild.textContent=Runtime.save.pokemon.length<6?`NEED ${6-Runtime.save.pokemon.length} MORE POKÉMON `:'PLAY DOUBLES ';}
  window.YSFlow?.on('trainer:shown',syncTrainerLabels,20);
  // Existing navigation callbacks retain function references; capture mode taps deliberately.
  byId('trainer-tab').addEventListener('click',e=>{e.stopImmediatePropagation();showTrainer();},{capture:true});
  byId('safari-tab').addEventListener('click',e=>{e.stopImmediatePropagation();showSafari();},{capture:true});
  byId('map-stop').addEventListener('click',e=>{const gymButton=e.target.closest('.ui2-gym-action');if(!gymButton)return;const marker=document.querySelector('.map-marker[aria-pressed="true"]');const index=Number(marker?.dataset.stop);if(index<8&&index<=Runtime.save.cupsCompleted){e.stopImmediatePropagation();if(Runtime.selectedIds.length)startCup(index);else window.PartyTray?.open?.();}},{capture:true});
  byId('elite-panel').addEventListener('click',e=>{const button=e.target.closest('button');if(!button||Runtime.save.cupsCompleted<8||button.dataset.legendary)return;e.stopImmediatePropagation();if(!Runtime.save.eliteCompleted)startElite();else if(['articuno','zapdos','moltres'].every(id=>Runtime.save.owned.includes(id)))startMewtwoBattle();},{capture:true});
  window.YSFlow?.on('screens:hidden',()=>document.body.classList.toggle('mobile-battle',!!Runtime.battle),20);
  function canStartSafariEncounter(){return ready.hidden&&byId('quick-party-modal').hidden;}
  const api={prepare,dismiss,selectTab,renderBattle,confirm:()=>byId('ready-go').click(),interceptStart,prepareTrainer:prepareTrainerMode,canStartSafariEncounter,get starting(){return starting;}};
  window.BattleEntryUX=api;
  window.MobileUX=api;
})();

