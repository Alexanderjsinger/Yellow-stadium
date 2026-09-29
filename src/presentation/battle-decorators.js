"use strict";

/* C4 presentation decorators.
 * Event-driven battle chrome and interface decoration are physically absorbed
 * here. Installers preserve their historical RC8 listener-registration order
 * without keeping six competing implementation files.
 */

YSPresentationInstallers.StadiumShow = () => {
  if (YSPresentationInternals.StadiumShow) return YSPresentationInternals.StadiumShow;

"use strict";
(() => {
  const Runtime=window.YSRuntime;
  const isStadium = () => !!Runtime.battle && ['trainer','trainerDuo','arcade'].includes(Runtime.battle.mode);
  const screen = document.getElementById('battle-screen');
  const arena = document.getElementById('battle-arena');
  arena.style.setProperty('--stadium-art', `url("${assetUrl('./assets/stadium/arena.png')}")`);
  const crowd = screen.querySelector('.crowd');
  const broadcast = document.createElement('div'); broadcast.className = 'stadium-broadcast'; broadcast.hidden = true;
  broadcast.innerHTML = '<span class="broadcast-tag">LIVE · STADIUM RADIO</span><p role="status">Welcome to Kanto Stadium!</p><button type="button" aria-pressed="false">VOICE OFF</button>';
  screen.querySelector('.arena-wrap').after(broadcast);
  const line = broadcast.querySelector('p'), voiceButton = broadcast.querySelector('button');
  let voice = false, lastBattle = null, lastTurn = 0, cheerTimer, lastCheer = 0;
  try { voice = localStorage.getItem('yellow-stadium-voice') === 'on'; } catch {}
  const muted = () => !!window.AudioManager?.muted;
  function voiceState() { voiceButton.textContent = voice ? 'VOICE ON' : 'VOICE OFF'; voiceButton.setAttribute('aria-pressed', String(voice)); }
  voiceButton.disabled = !window.speechSynthesis; voiceButton.title = window.speechSynthesis ? 'Optional spoken Stadium commentary' : 'Spoken commentary is unavailable in this browser';
  voiceButton.onclick = () => { voice = !voice; try { localStorage.setItem('yellow-stadium-voice',voice?'on':'off'); } catch {} voiceState(); if (voice) speak(line.textContent); else window.speechSynthesis?.cancel(); };
  voiceState();
  function speak(text) {
    if (!voice || muted() || document.hidden || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text); utterance.rate = 1.08; utterance.pitch = .85; utterance.volume = .75;
    window.speechSynthesis.speak(utterance);
  }
  function cheer(big = false) {
    crowd.classList.remove('cheering'); void crowd.offsetWidth; crowd.classList.add('cheering');
    clearTimeout(cheerTimer); cheerTimer = setTimeout(() => crowd.classList.remove('cheering'), 1800);
    if (muted() || document.hidden || Date.now() - lastCheer < 1200) return;
    lastCheer = Date.now();
    window.AudioManager?.cheer?.(big);
  }
  function comment(text, excite=false) { if(!isStadium())return; line.textContent=text; speak(text); if(excite)cheer(true); }
  const spectators=['lass','youngster','gentleman','beauty','sailor','hiker'];
  const fans=document.createElement('div'); fans.className='stadium-fans'; fans.setAttribute('aria-hidden','true');
  for(let i=0;i<32;i++){const img=document.createElement('img');img.src=assetUrl(`./assets/trainers/${spectators[i%spectators.length]}.png`);img.alt='';img.style.setProperty('--fan-delay',`${-(i%7)*.13}s`);fans.append(img);}
  crowd.append(fans);
  window.YSFlow?.on('battle:announced',({text})=>{if(!isStadium())return;
    if(/SUPER EFFECTIVE/.test(text)) comment('That hits the weakness! The crowd is on its feet!',true);
    else if(/CRITICAL/.test(text)) comment('A critical hit! What a turning point!',true);
    else if(/fainted/.test(text)) comment('Down it goes! Who will step up next?',true);
    else if(/missed/.test(text)) comment('Just wide! That could change the match!');
    else if(/no effect/.test(text)) comment('No effect! A clever defensive matchup!');
    else if(/used /.test(text)) comment(text.replace(/!$/,'')+' — here it comes!');
    else if(/return!/.test(text)) comment('A switch! The trainer has something in mind!');
  },10);
  window.YSFlow?.on('battle:ui',()=>{const enabled=isStadium();screen.classList.toggle('stadium-match',enabled);broadcast.hidden=!enabled;
    if(!enabled){window.speechSynthesis?.cancel();return;}
    if(lastBattle!==Runtime.battle){lastBattle=Runtime.battle;lastTurn=0;const opening=Runtime.battle.mode==='arcade'?`Welcome to the ${ARCADE_CUPS[Runtime.battle.arcadeCupIndex].name}! Stage ${Runtime.battle.arcadeStage+1}: ${Runtime.battle.arcadeStageTitle}.`:`Welcome to Kanto Stadium! You face ${Runtime.battle.trainer?.name||'a new challenger'}!`;comment(opening,true);}
    if(!Runtime.battle.locked&&!Runtime.battle.over&&lastTurn!==Runtime.battle.turn){lastTurn=Runtime.battle.turn;const p=Runtime.battle.player.filter(m=>m.hp>0).length,e=Runtime.battle.enemy.filter(m=>m.hp>0).length;
      if(Runtime.battle.turn>1)comment(p===1&&e===1?'One Pokémon each! This is the final showdown!':p<e?'The home side needs a comeback. What will they try?':p>e?'The home side has the advantage. Can they finish it?':'Neither side is giving an inch!');
    }
  }, 4);
  window.YSFlow?.on('battle:ended',({battle:finished,victory})=>{if(!finished||!['trainer','trainerDuo','arcade'].includes(finished.mode))return;const arcade=finished.mode==='arcade';comment(victory?'The match is decided! What a victory for the home team!':arcade?'The Cup run is over! Regroup and come back swinging!':'The challenger takes it! Train up and return to the Stadium!',true);}, 5);
  // The existing continue handler calls the original function, so also clean up on its click.
  document.getElementById('continue-button').addEventListener('click',()=>window.speechSynthesis?.cancel());
  document.getElementById('music-toggle').addEventListener('click',()=>{if(muted())window.speechSynthesis?.cancel();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)window.speechSynthesis?.cancel();});
  window.YSFlow?.on('presentation:trainerIntro',({battle:b})=>{if(['trainer','trainerDuo'].includes(b.mode)){document.getElementById('scene-kicker').textContent='KANTO EXHIBITION';document.getElementById('scene-quote').textContent='The lights are on and the crowd is ready. Let’s give them a match to remember!';}},20);
})();


  YSPresentationInternals.StadiumShow = Object.freeze({ installed: true });
  return YSPresentationInternals.StadiumShow;
};

YSPresentationInstallers.BattleClarity = () => {
  if (YSPresentationInternals.BattleClarity) return YSPresentationInternals.BattleClarity;

"use strict";
// Makes the existing battle depth visible without changing battle outcomes.
(() => {
  const Runtime=window.YSRuntime;
  const U=window.StadiumUpgrade, byId=id=>document.getElementById(id);
  const arena=byId('battle-arena'), screen=byId('battle-screen');
  const strip=document.createElement('div');strip.id='condition-strip';strip.className='condition-strip';strip.setAttribute('aria-label','Current battle conditions');arena.prepend(strip);
  const callout=document.createElement('div');callout.id='battle-callout';callout.className='battle-callout';callout.hidden=true;callout.setAttribute('role','status');callout.setAttribute('aria-live','polite');arena.append(callout);
  let calloutTimer,lastMessage='';
  const title=value=>String(value||'').replace(/([A-Z])/g,' $1').trim().toUpperCase();
  const statNames={attack:'ATK',defense:'DEF',specialAttack:'SP. ATK',specialDefense:'SP. DEF',speed:'SPEED',accuracy:'ACC'};
  function chip(label,value,tone=''){
    const el=document.createElement('span');el.className=`condition-chip ${tone}`;el.innerHTML=`<b>${label}</b>${value?`<small>${value}</small>`:''}`;return el;
  }
  function monConditions(mon,prefix){
    if(!mon)return[];const out=[];
    if(mon.seeded)out.push(chip(`${prefix} SEEDED`,'drains HP','danger'));
    if(mon.confusion)out.push(chip(`${prefix} CONFUSED`,`${mon.confusion} turns`,'danger'));
    if(mon.trappedTurns)out.push(chip(`${prefix} TRAPPED`,`${mon.trappedTurns} turns`,'danger'));
    Object.entries(mon.stages||{}).filter(([,n])=>n).forEach(([key,n])=>out.push(chip(`${prefix} ${statNames[key]||title(key)}`,`${n>0?'+':''}${n}`,n>0?'good':'danger')));
    return out;
  }
  function renderConditions(){
    if(!Runtime.battle||Runtime.battle.over){strip.replaceChildren();return;}
    const weather=title(Runtime.battle.weather||'clear');
    const nodes=[chip(`TURN ${Runtime.battle.turn}`,'','turn'),chip(weather,Runtime.battle.weatherTurns?`${Runtime.battle.weatherTurns} turns`:'field',Runtime.battle.weather==='clear'?'':Runtime.battle.weather)];
    for(const side of ['player','enemy']){
      const prefix=side==='player'?'YOU':'FOE';
      nodes.push(...monConditions(U.active(side)[0],prefix));
      if(Runtime.battle.spikes?.[side])nodes.push(chip(`${prefix} SPIKES`,`${Runtime.battle.spikes[side]} layer${Runtime.battle.spikes[side]===1?'':'s'}`,'danger'));
      Object.entries(Runtime.battle.screens?.[side]||{}).filter(([,turns])=>turns).forEach(([key,turns])=>nodes.push(chip(`${prefix} ${title(key)}`,`${turns} turns`,'good')));
    }
    strip.replaceChildren(...nodes.slice(0,7));
    if(nodes.length>7)strip.append(chip(`+${nodes.length-7}`,'more'));
  }
  function descriptionFor(text){
    const normalized=text.toUpperCase();
    for(const [key,description] of Object.entries(U.abilityDescriptions||{}))if(normalized.includes(title(key)))return description;
    for(const item of Object.values(U.equipment||{}))if(normalized.includes(item.name.toUpperCase()))return item.description;
    if(normalized.includes('SUPER EFFECTIVE'))return 'The move’s type has an advantage against this Pokémon.';
    if(normalized.includes('NO EFFECT')||normalized.includes('IMMUNE'))return 'The target’s type or ability completely blocked the move.';
    if(normalized.includes('CRITICAL'))return 'A critical hit dealt increased damage.';
    return '';
  }
  function showCallout(text){
    const detail=descriptionFor(text);if(!detail)return;
    clearTimeout(calloutTimer);callout.replaceChildren();
    const strong=document.createElement('strong'),small=document.createElement('small');strong.textContent=text;small.textContent=detail;callout.append(strong,small);callout.hidden=false;
    calloutTimer=setTimeout(()=>{callout.hidden=true;},Math.round(2400*(window.BattlePresentationDirector?.scale||1)));
  }
  new MutationObserver(()=>{const text=byId('message').textContent.trim();if(text&&text!==lastMessage){lastMessage=text;if(/triggered|berry|leftovers|focus band|super effective|critical|no effect|immune/i.test(text))showCallout(text);}}).observe(byId('message'),{childList:true,subtree:true,characterData:true});

  function currentActor(){return U.active('player')[Runtime.battle?.commandSlot||0]||U.active('player')[0];}
  function moveVerdict(actor,move,target){
    if(!target||!move.power)return move.field?'FIELD':move.self?'SELF':'STATUS';
    if(U.immunity(target,move))return'IMMUNE';
    const factor=effectiveness(move.type,target);return factor>1?'SUPER EFFECTIVE':factor<1?'RESISTED':'NORMAL DAMAGE';
  }
  function highlight(choice){
    screen.querySelectorAll('.target-focus').forEach(node=>node.classList.remove('target-focus'));
    if(!Runtime.battle||!choice)return;
    const select=choice.querySelector('select'),actor=currentActor(),moveId=actor?.moveIds[[...byId('moves').querySelectorAll('.move-choice')].indexOf(choice)],move=MOVES[moveId];
    if(move?.self){byId('player-panel').classList.add('target-focus');return;}
    const name=select&&!select.hidden?select.options[select.selectedIndex]?.text.split(' · ')[0]:U.active('enemy')[0]?.name;
    const targets=U.active('enemy');const index=targets.findIndex(mon=>mon.name===name);
    (index===1?byId('enemy-partner'):byId('enemy-panel')).classList.add('target-focus');
  }
  function decorateMoves(){
    if(!Runtime.battle?.slots)return;const actor=currentActor(),choices=[...byId('moves').querySelectorAll('.move-choice')];
    choices.forEach((choice,index)=>{
      const move=MOVES[actor.moveIds[index]]||MOVES.struggle,select=choice.querySelector('select'),button=choice.querySelector('.move-button');if(!button||button.querySelector('.move-verdict'))return;
      const target=()=>{const options=move.self?[actor]:U.active('enemy');return options[Number(select?.value)||0]||options[0];};
      const verdict=document.createElement('em');verdict.className='move-verdict';
      const refresh=()=>{verdict.textContent=moveVerdict(actor,move,target());verdict.dataset.result=verdict.textContent.toLowerCase().replaceAll(' ','-');button.setAttribute('aria-description',PokemonDetails.describe(move));highlight(choice);};
      button.append(verdict);button.title=PokemonDetails.describe(move);button.addEventListener('focus',()=>highlight(choice));button.addEventListener('pointerenter',()=>highlight(choice));select?.addEventListener('change',refresh);refresh();
      if(select&&!select.hidden){const label=document.createElement('label');label.className='target-label';label.textContent='TARGET';select.before(label);}
    });
  }
  window.YSFlow?.on('battle:moves',decorateMoves,10);
  window.YSFlow?.on('battle:ui',renderConditions,20);

  const cities=['Cerulean City','Vermilion City','Celadon City','Fuchsia City','Saffron City','Cinnabar Island','Viridian City','Indigo Plateau'];
  function journeyCard(finished,win){
    const reward=byId('reward');if(!reward||reward.querySelector('.journey-next'))return;
    const card=document.createElement('section');card.className='journey-next';
    let eyebrow='WHAT CHANGED',heading=win?'Victory recorded':'Regroup and return',copy='Your Pokémon kept the experience they earned.';
    if(finished.mode==='cup'&&win&&finished.cupRound<2){const remain=2-finished.cupRound;eyebrow='JOURNEY CONTINUES';heading=`Next battle: Round ${finished.cupRound+2} of 3`;copy=`${remain===1?'The Gym Leader stands':`One challenger and the Gym Leader stand`} between you and the ${CUPS[finished.cupIndex].badge} Badge.`;byId('continue-button').innerHTML='NEXT JOURNEY BATTLE <span>›</span>';}
    else if(finished.mode==='cup'&&win){const next=finished.cupIndex+1;eyebrow=`${CUPS[finished.cupIndex].badge} GYM COMPLETE`;heading=next<8?`Next destination: ${cities[finished.cupIndex]}`:'The Elite Four are unlocked';copy=next<8?`${CUPS[next].leader} awaits at the ${CUPS[next].badge} Gym.`:'Your eight badges open the road to Indigo Plateau.';byId('continue-button').innerHTML='VIEW KANTO MAP <span>›</span>';}
    else if(finished.mode==='arcade'){
      const cup=ARCADE_CUPS[finished.arcadeCupIndex],complete=Boolean(finished.arcadeCupComplete);
      eyebrow=complete?`${cup.name} COMPLETE`:win?'CUP RUN CONTINUES':'CUP RUN ENDED';
      heading=complete?`${cup.boss} defeated`:win?`Stage ${finished.arcadeStage+1} cleared`:'Back to Stage 1';
      copy=complete?`You conquered all ${cup.stages.length} stages and earned the ${cup.prize}.`:win?`${cup.stages[finished.arcadeNextStage]?.title||'The boss'} is waiting next.`:`${cup.boss} keeps the Cup. Rebuild your party and begin another run.`;
      byId('continue-button').innerHTML=complete||!win?'BACK TO CUPS <span>›</span>':'NEXT STAGE <span>›</span>';
    }
    else if(['trainer','trainerDuo'].includes(finished.mode)){eyebrow='STADIUM RECORD';heading=win?`${Runtime.save.trainerStreak}-win streak`:'Streak reset';copy=win?'Keep the run alive for larger milestone prizes.':'Adjust your party and challenge another classic trainer.';byId('continue-button').innerHTML='BACK TO STADIUM <span>›</span>';}
    else if(finished.mode==='safari'){eyebrow='SAFARI REPORT';heading=finished.captured?'A new partner joins you':'The expedition continues';copy=finished.captured?'Review the new Pokémon in Party and choose its moves.':'Explore again or prepare a different catching team.';byId('continue-button').innerHTML='RETURN TO SAFARI <span>›</span>';}
    const k=document.createElement('p'),h=document.createElement('h3'),p=document.createElement('p');k.className='eyebrow';k.textContent=eyebrow;h.textContent=heading;p.textContent=copy;card.append(k,h,p);
    if(finished.mode==='cup'&&win&&finished.cupRound===2&&[1,4,8].includes(Runtime.save.cupsCompleted)){const joke=document.createElement('blockquote');joke.innerHTML=`<b>PROFESSOR JOKE</b> “${Runtime.save.cupsCompleted===1?'One badge down. The road gets wetter from here—Misty has a pool.':Runtime.save.cupsCompleted===4?'Halfway there. Your Pokémon are beginning to look alarmingly competent.':'Eight badges! I always believed in you, excluding several specific moments.'}”`;card.append(joke);}
    reward.append(card);
  }
  window.YSFlow?.on('battle:ended',({battle:finished,victory:win})=>{if(finished)journeyCard(finished,win);},20);
  const resultCard=byId('result-modal').querySelector('.modal-card');const close=document.createElement('button');close.type='button';close.className='result-close';close.setAttribute('aria-label','Continue and close results');close.textContent='×';close.onclick=()=>byId('continue-button').click();resultCard.prepend(close);
})();


  YSPresentationInternals.BattleClarity = Object.freeze({ installed: true });
  return YSPresentationInternals.BattleClarity;
};

YSPresentationInstallers.BattleEnvironments = () => {
  if (YSPresentationInternals.BattleEnvironments) return YSPresentationInternals.BattleEnvironments;

"use strict";
(() => {
  const Runtime=window.YSRuntime;
  const arena=document.getElementById('battle-arena');
  if(!arena)return;
  const locations={
    stadium:'KANTO STADIUM',grasslands:'KANTO GRASSLANDS',ice:'SEAFOAM ICE FIELD',road:'KANTO ROUTE',magma:'VOLCANIC CALDERA',desert:'DESERT BADLANDS',jungle:'SAFARI JUNGLE',windy:'WINDSWEPT HIGHLANDS',beach:'KANTO COAST',"candy-store":'CELADON CANDY PLAZA'
  };
  const cupArenas=['desert','beach','road','grasslands','jungle','windy','magma','desert'];
  const eliteArenas=['ice','desert','windy','windy'];
  const candySpecies=new Set(['clefairy','clefable','jigglypuff','wigglytuff','meowth','persian','eevee','chansey','lickitung']);
  const label=document.createElement('div');label.className='arena-location';label.setAttribute('aria-live','polite');arena.append(label);
  let lastBattle=null;
  function safariArena(mon){
    if(candySpecies.has(mon?.id))return 'candy-store';
    const types=mon?.types||[];
    if(types.includes('ICE'))return 'ice';
    if(types.includes('FIRE'))return 'magma';
    if(types.includes('WATER'))return 'beach';
    if(types.some(type=>['GROUND','ROCK'].includes(type)))return 'desert';
    if(types.some(type=>['GRASS','BUG','POISON'].includes(type)))return 'jungle';
    if(types.includes('FLYING'))return 'windy';
    return (SPECIES[mon?.id]?.dex||0)%2?'road':'grasslands';
  }
  function choose(b){
    if(['trainer','trainerDuo','arcade'].includes(b.mode))return 'stadium';
    if(b.mode==='cup')return cupArenas[b.cupIndex]||'grasslands';
    if(b.mode==='elite')return eliteArenas[b.eliteIndex]||'windy';
    if(b.mode==='mewtwo')return 'ice';
    if(b.mode==='safari')return safariArena(b.enemy?.[0]);
    return 'road';
  }
  function render(){
    if(!Runtime.battle)return;
    if(lastBattle!==Runtime.battle){lastBattle=Runtime.battle;Runtime.battle.arenaEnvironment=choose(Runtime.battle);}
    const environment=Runtime.battle.arenaEnvironment||choose(Runtime.battle);
    arena.dataset.environment=environment;
    label.textContent=locations[environment]||'KANTO BATTLEFIELD';
    const readout=document.getElementById('field-readout');
    if(readout&&readout.textContent&&!readout.textContent.includes('ARENA ·'))readout.textContent+=` | ARENA · ${locations[environment]||'KANTO'}`;
  }
  window.YSFlow?.on("battle:ui", render, 5);
})();


  YSPresentationInternals.BattleEnvironments = Object.freeze({ installed: true });
  return YSPresentationInternals.BattleEnvironments;
};

YSPresentationInstallers.BattleReadout = () => {
  if (YSPresentationInternals.BattleReadout) return YSPresentationInternals.BattleReadout;

"use strict";
(() => {
  const Runtime=window.YSRuntime;
  const U=window.StadiumUpgrade,byId=id=>document.getElementById(id),screen=byId('battle-screen');
  const top=document.createElement('header');top.className='battle-top';
  top.append(screen.querySelector('.match-strip'),screen.querySelector('.arena-location'),byId('condition-strip'));screen.prepend(top);
  const info=byId('command-pane-info'),dialog=document.createElement('dialog');dialog.id='battle-details';dialog.setAttribute('aria-labelledby','battle-details-title');
  dialog.innerHTML='<header><h2 id="battle-details-title">Battle details</h2><button type="button" aria-label="Close battle details">×</button></header><div class="battle-details-body"></div>';
  const detailsBody=dialog.querySelector('.battle-details-body');detailsBody.append(...info.childNodes);document.body.append(dialog);
  let returnFocus;
  function close(){dialog.close();if(returnFocus?.isConnected)returnFocus.focus();}
  dialog.querySelector('header button').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});dialog.onclick=e=>{if(e.target===dialog)close();};
  function openDetails(logOnly=false){returnFocus=document.activeElement;dialog.showModal();const history=dialog.querySelector('.battle-history');history.open=logOnly;if(logOnly)history.scrollIntoView?.({block:'start'});}
  const logButton=document.createElement('button');logButton.type='button';logButton.className='battle-log-button';logButton.textContent='Log';logButton.setAttribute('aria-label','Open battle log');logButton.onclick=()=>openDetails(true);screen.querySelector('.announcer').append(logButton);
  const detailButton=document.createElement('button');detailButton.type='button';detailButton.className='battle-details-button';detailButton.textContent='Move details & field info';detailButton.onclick=()=>openDetails();byId('command-pane-fight').append(detailButton);
  const enemyMeta=document.createElement('div');enemyMeta.className='battle-enemy-meta';byId('enemy-name').closest('.status-card').append(enemyMeta);
  byId('command-tab-info').textContent='RUN';byId('command-tab-info').setAttribute('aria-label','Run or forfeit');
  const retreat=byId('battle-retreat');info.append(retreat);const explanation=document.createElement('p');info.prepend(explanation);screen.querySelector('.battle-exit-actions')?.remove();
  const pretty=value=>String(value||'').replace(/([A-Z])/g,' $1').trim();
  const effects={toxic:'Badly poisons',paralyze:'Paralyzes target',sleep:'Puts target to sleep',seed:'Drains HP each turn',recover:'Restores half HP',rest:'Restores HP; falls asleep',protect:'Blocks attacks this turn',substitute:'Trades HP for a decoy',attackUp:'Attack +2',calmMind:'Sp. Atk / Sp. Def +1',workUp:'Attack / Sp. Atk +1',speedUp:'Speed +2',rain:'Rain for 5 turns',sun:'Sun for 5 turns',sand:'Sand for 5 turns',reflect:'Physical shield · 5 turns',lightScreen:'Special shield · 5 turns',spikes:'Adds entry damage',confuse:'Confuses target',help:'Boosts ally this turn'};
  function accuracy(actor,move){let n=move.accuracy*stageMultiplier(actor.stages.accuracy)*(actor.ability==='compoundEyes'?1.3:1);if(move.name==='THUNDER')n=Runtime.battle.weather==='rain'?100:Runtime.battle.weather==='sun'?50:n;return Math.max(0,Math.min(100,n));}
  function assess(actor,target,move,pp){
    const acc=accuracy(actor,move);if(pp<=0)return {text:'No PP left',score:0,accuracy:acc};
    if(move.power||move.fixed){
      const factor=U.immunity(target,move)?0:move.recoil||move.fixed?1:effectiveness(move.type,target);
      const n=move.fixed?0:actor.stages[move.category==='SPECIAL'?'specialAttack':'attack'];
      const stat=move.category==='SPECIAL'?'SpA':'Atk';
      const modifier=n?`${n<0?'Weakened':'Boosted'} ${stat} ${n>0?'+':''}${n}`:factor===0?'No effect':factor>1?'Super effective':factor<1?'Resisted':'Normal damage';
      const estimate=target?U.damage(actor,target,move,false,Boolean(move.spread&&Runtime.battle.mode==='trainerDuo')).damage:0;
      const hits=move.multi?(move.multi[0]+move.multi[1])/2:1;
      return {text:`${factor}× · ${modifier}`,score:estimate*hits*acc/100,accuracy:acc};
    }
    const status={toxic:'TOX',paralyze:'PAR',sleep:'SLP'}[move.effect];
    const blocked=status&&target&&!canInflictStatus(target,status)||move.effect==='seed'&&(target?.seeded||target?.types.includes('GRASS'))||move.effect==='recover'&&actor.hp===actor.maxHp;
    return {text:blocked?'No effect now':effects[move.effect]||pretty(move.effect)||'Status move',score:0,accuracy:acc};
  }
  function decorate(){
    if(!Runtime.battle?.slots)return;const actor=U.active('player')[Runtime.battle.commandSlot||0]||U.active('player')[0];if(!actor)return;
    const choices=[...byId('moves').querySelectorAll('.move-choice')];
    function refresh(){
      let best=null;
      choices.forEach(choice=>{
        const move=MOVES[choice.dataset.moveId],index=Number(choice.dataset.moveIndex),select=choice.querySelector('select'),button=choice.querySelector('.move-button');
        const targets=move.self?[actor]:move.ally?U.active('player').filter(mon=>mon!==actor):U.active('enemy');
        const target=targets[Number(select.value)||0]||targets[0]||actor;
        const result=assess(actor,target,move,index<0?Infinity:actor.pp[index]);
        const line=button.querySelector('.move-verdict');line.textContent=result.text;line.title=result.text;
        button.classList.remove('highest-damage');button.setAttribute('aria-description',`${result.text}. ${result.accuracy}% accuracy. ${PokemonDetails.describe(move)}`);
        if(result.score>0&&(!best||result.score>best.score||result.score===best.score&&result.accuracy>best.accuracy))best={button,...result};
      });
      if(best&&Runtime.battle.mode!=='trainerDuo'){best.button.classList.add('highest-damage');best.button.setAttribute('aria-description','Highest expected damage. '+best.button.getAttribute('aria-description'));}
      detailButton.textContent=best&&Runtime.battle.mode!=='trainerDuo'?'Gold border: highest expected damage · Details':'Move details & field info';
    }
    choices.forEach(choice=>choice.querySelector('select').addEventListener('change',refresh));refresh();
  }
  window.YSFlow?.on("battle:moves", decorate, 5);
  window.YSFlow?.on("battle:ui", () => {
    if(!Runtime.battle)return;
    const wild=Runtime.battle.mode==='safari';
    retreat.textContent=wild?'RUN FROM ENCOUNTER':'FORFEIT MATCH';
    retreat.disabled=Runtime.battle.locked||Runtime.battle.over;
    explanation.textContent=wild?'Leave this encounter without rewards.':'Forfeit this match without rewards. An active Cup run will end. You will be asked to confirm.';
    const enemy=U.active('enemy')[0];
    enemyMeta.textContent=enemy?`${Math.ceil(enemy.hp/enemy.maxHp*100)}% HP · ${enemy.types.join(' / ')} · ${pretty(enemy.ability)}`:'';
    enemyMeta.title=enemyMeta.textContent;
  }, 5);
  byId('continue-button').addEventListener('click',()=>{if(dialog.open)close();});
})();


  YSPresentationInternals.BattleReadout = Object.freeze({ installed: true });
  return YSPresentationInternals.BattleReadout;
};

YSPresentationInstallers.BattleRefinement = () => {
  if (YSPresentationInternals.BattleRefinement) return YSPresentationInternals.BattleRefinement;

"use strict";
(() => {
  const Runtime=window.YSRuntime;
  /* Damage tuning is applied inside the active engine in index.html. */

  /* Routine information stays in the dialogue rail. Status/capture-scale moments may briefly use the arena. */
  const arena=document.getElementById('battle-arena');
  function actionWord(text){if(!arena||!text)return;const el=document.createElement('b');el.className='battle-action-word';el.textContent=text;arena.append(el);setTimeout(()=>el.remove(),780);}
  window.YSFlow?.on('presentation:status',({text})=>{
    const t=String(text||'');
    const short=/sleep|asleep/i.test(t)?'SLEEPING…':/confus/i.test(t)?'CONFUSED…':/paraly/i.test(t)?'PARALYZED!':/poison/i.test(t)?'POISONED!':/burn/i.test(t)?'BURNED!':/frozen|freeze/i.test(t)?'FROZEN!':'';
    if(short)actionWord(short);
  },10);
})();


  YSPresentationInternals.BattleRefinement = Object.freeze({ installed: true });
  return YSPresentationInternals.BattleRefinement;
};

YSPresentationInstallers.PolishV62 = () => {
  if (YSPresentationInternals.PolishV62) return YSPresentationInternals.PolishV62;

"use strict";
(() => {
  const Runtime=window.YSRuntime;
  const doc = document;
  const byId = id => doc.getElementById(id);

  function artTypeFor(id) {
    if (!id) return ["ball", "pokeBall"];
    if (["pokeBall", "greatBall", "ultraBall", "superBall", "masterBall"].includes(id)) return ["ball", id];
    if (id === "potion") return ["heal", "potion"];
    if (id === "superPotion") return ["heal", "superPotion"];
    if (id === "fullHeal") return ["fullHeal", "fullHeal"];
    if (id === "revive") return ["revive", "revive"];
    if (/stone/i.test(id)) return ["evo", "evo"];
    if (id && id.startsWith("x")) return ["boost", "boost"];
    return ["boost", "boost"];
  }

  function createItemArt(id) {
    const [tone, variant] = artTypeFor(id);
    const span = doc.createElement("span");
    span.className = `ys-item-art ${tone} ${variant}`;
    span.setAttribute("aria-hidden", "true");
    if (variant === "masterBall") {
      const mark = doc.createElement("i");
      mark.textContent = "M";
      span.appendChild(mark);
    }
    return span;
  }

  function idFromText(text) {
    if (!text) return null;
    const t = String(text).toUpperCase();
    if (t.includes("MASTER BALL")) return "masterBall";
    if (t.includes("SUPER BALL")) return "superBall";
    if (t.includes("ULTRA BALL")) return "ultraBall";
    if (t.includes("GREAT BALL")) return "greatBall";
    if (t.includes("POKÉ BALL") || t.includes("POKE BALL")) return "pokeBall";
    if (t.includes("SUPER POTION")) return "superPotion";
    if (t.includes("POTION")) return "potion";
    if (t.includes("FULL HEAL")) return "fullHeal";
    if (t.includes("REVIVE")) return "revive";
    return null;
  }

  function decorateStaticItemIcons(root = doc) {
    root.querySelectorAll(".item-icon").forEach(icon => {
      if (icon.dataset.ysArtApplied === "true" || icon.querySelector("img") || icon.classList.contains("source-backed")) return;
      const id = icon.closest("[data-item]")?.dataset.item || idFromText(icon.closest(".bag-card,.shop-card")?.textContent || icon.textContent);
      icon.textContent = "";
      icon.appendChild(createItemArt(id));
      icon.dataset.ysArtApplied = "true";
    });
  }

  function decorateBattleItemButtons(root = doc) {
    root.querySelectorAll(".battle-items .item-button").forEach(button => {
      if (button.dataset.ysArtApplied === "true") return;
      const raw = button.textContent.replace(/\s+/g, " ").trim();
      const id = idFromText(raw);
      const countNode = button.querySelector("b");
      const count = countNode ? countNode.textContent : "";
      const copy = doc.createElement("span");
      copy.className = "ys-item-button-copy";
      const title = doc.createElement("strong");
      title.textContent = id && typeof ITEMS !== "undefined" && ITEMS[id] ? ITEMS[id].name : raw.replace(count, "").trim();
      const desc = doc.createElement("span");
      desc.textContent = id && typeof ITEMS !== "undefined" && ITEMS[id] ? ITEMS[id].description : "";
      copy.append(title, desc);
      button.textContent = "";
      button.appendChild(createItemArt(id));
      button.appendChild(copy);
      if (count) {
        const badge = doc.createElement("b");
        badge.textContent = count;
        button.appendChild(badge);
      }
      button.dataset.ysArtApplied = "true";
    });
  }

  function spawnCaptureAnimation(id) {
    const anchor = byId("battle-arena") || doc.querySelector(".battle-arena, .arena, #battle-screen");
    if (!anchor) return null;
    const node = doc.createElement("div");
    node.className = "capture-ball throwing";
    node.dataset.ball = id;
    node.appendChild(createItemArt(id));
    anchor.appendChild(node);
    const burst = doc.createElement("div");
    burst.className = "capture-burst";
    anchor.appendChild(burst);
    setTimeout(() => node.classList.add("shake1"), 760);
    setTimeout(() => { node.classList.remove("shake1"); node.classList.add("shake2"); }, 1040);
    setTimeout(() => { node.classList.remove("shake2"); node.classList.add("shake3"); }, 1320);
    return { node, burst };
  }

  function finalizeCaptureAnimation(handle, captured) {
    if (!handle?.node) return;
    handle.burst?.remove();
    handle.node.classList.remove("throwing", "shake1", "shake2", "shake3");
    handle.node.classList.add(captured ? "caught" : "escaped");
    if (!captured) {
      const burst = doc.createElement("div");
      burst.className = "capture-burst";
      handle.node.appendChild(burst);
      setTimeout(() => burst.remove(), 580);
    }
    setTimeout(() => handle.node?.remove(), captured ? 1200 : 700);
  }

  function applyResponsiveFixes() {
    decorateStaticItemIcons();
    decorateBattleItemButtons();
  }

  let captureHandle = null;
  window.YSFlow?.on("shop:rendered", () => decorateStaticItemIcons(byId("shop-grid") || doc), 10);
  window.YSFlow?.on("bag:rendered", () => decorateStaticItemIcons(byId("bag-screen") || doc), 10);
  window.YSFlow?.on("party:shown", () => setTimeout(applyResponsiveFixes, 0), 5);
  window.YSFlow?.on("battle:ui", () => decorateBattleItemButtons(byId("battle-screen") || doc), 10);
  window.YSFlow?.on("battle:item:before", ({ id, item }) => {
    if (item?.ball && Runtime.battle) captureHandle = spawnCaptureAnimation(id);
  }, 20);
  window.YSFlow?.on("battle:item:after", ({ captured }) => {
    if (!captureHandle) return;
    const handle = captureHandle;
    captureHandle = null;
    setTimeout(() => finalizeCaptureAnimation(handle, !!captured), 900);
  }, 20);
  applyResponsiveFixes();
  setTimeout(applyResponsiveFixes, 60);
})();


  YSPresentationInternals.PolishV62 = Object.freeze({ installed: true });
  return YSPresentationInternals.PolishV62;
};

// Preserve the original Stadium broadcast registration slot.
YSPresentationInstallers.StadiumShow();
