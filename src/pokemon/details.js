
"use strict";
(() => {
  const U = StadiumUpgrade;
  const effects = {protect:'Blocks most attacks this turn. Repeated use becomes less reliable.',substitute:'Spends one-quarter HP to create a decoy that absorbs attacks.',attackUp:'Raises Attack by two stages.',calmMind:'Raises Special Attack and Special Defense by one stage.',workUp:'Raises Attack and Special Attack by one stage.',speedUp:'Raises Speed by two stages.',rain:'Rain for five turns: boosts Water and weakens Fire.',sun:'Sun for five turns: boosts Fire and weakens Water.',sand:'Sandstorm for five turns damages Pokémon without sand immunity.',reflect:'Reduces physical damage to your team for five turns.',lightScreen:'Reduces special damage to your team for five turns.',spikes:'Damages grounded opponents when they switch in. Stacks up to three layers.',recover:'Restores half of maximum HP.',rest:'Fully heals the user and puts it to sleep.',toxic:'Badly poisons the target; damage grows each turn.',paralyze:'May prevent actions and reduces Speed.',sleep:'Puts the target to sleep.',confuse:'Confuses the target; it may hurt itself.',seed:'Drains the target’s HP each turn.',help:'Boosts your partner’s next attack.',recharge:'Requires a recharge turn after use.',specialDown:'May lower Special Defense.'};
  const STONE_RULES = EVOLUTION_STONE_RULES;
  function describe(m){return [effects[m.effect]||(m.power?`${m.category==='PHYSICAL'?'Physical':'Special'} attack · ${m.power} power.`:'A status move.'),m.status?`${m.chance}% chance to inflict ${m.status}.`:'',m.trap?'Traps and damages the target over several turns.':'',m.multi?'Hits multiple times.':'',m.recoil?'Deals recoil damage to the user.':'',`${m.accuracy}% base accuracy · ${m.pp} PP`].filter(Boolean).join(' ');}
  function init(){
    save.pokemonNotes=save.pokemonNotes&&typeof save.pokemonNotes==='object'&&!Array.isArray(save.pokemonNotes)?save.pokemonNotes:{};
    save.pausedEvolutions=save.pausedEvolutions&&typeof save.pausedEvolutions==='object'&&!Array.isArray(save.pausedEvolutions)?save.pausedEvolutions:{};
    save.growthQueue=Array.isArray(save.growthQueue)?save.growthQueue.filter(e=>e&&SPECIES[e.id]&&['move','evolve'].includes(e.kind)&&(e.kind!=='move'||MOVES[e.move])):[];
  }
  init();
  const notes=ref=>{init();const record=pokemonRecord(ref);if(record){record.notes=record.notes&&typeof record.notes==='object'&&!Array.isArray(record.notes)?record.notes:{};return record.notes;}const id=speciesIdFor(ref);save.pokedexNotes=save.pokedexNotes&&typeof save.pokedexNotes==='object'&&!Array.isArray(save.pokedexNotes)?save.pokedexNotes:{};const n=save.pokedexNotes[id];if(!n||typeof n!=='object'||Array.isArray(n))save.pokedexNotes[id]={};return save.pokedexNotes[id];};
  const pretty=s=>String(s).replace(/([A-Z])/g,' $1').toUpperCase();
  const modal=document.createElement('div');modal.className='modal pokemon-detail-modal';modal.hidden=true;
  modal.innerHTML='<section class="pokemon-detail-card" role="dialog" aria-modal="true" aria-labelledby="pokemon-detail-title"><button class="detail-close" aria-label="Close Pokémon details" type="button">×</button><div class="detail-content"></div></section>';
  document.body.append(modal);const root=modal.querySelector('.detail-content');let focusBefore;
  function close(){modal.hidden=true;document.body.classList.remove('details-open');focusBefore?.focus?.();}
  function open(){focusBefore=document.activeElement;modal.hidden=false;document.body.classList.add('details-open');root.replaceChildren();modal.querySelector('button').focus();}
  modal.querySelector('button').onclick=close;modal.onclick=e=>{if(e.target===modal)close();};modal.onkeydown=e=>{if(e.key==='Escape')close();if(e.key==='Tab'){const all=[...modal.querySelectorAll('button:not(:disabled),input,select,textarea')];const a=all[0],z=all[all.length-1];if(!a)return;if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus();}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus();}}};
  function el(tag,text,cls){const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;}
  function appendAction(parent,text,run,disabled=false){const b=el('button',text,'detail-action');b.type='button';b.disabled=disabled;b.onclick=run;parent.append(b);return b;}
  function action(text,run,disabled=false){return appendAction(root,text,run,disabled);}
  function portrait(id,parent=root){const img=document.createElement('img');img.className='detail-portrait';img.alt=SPECIES[id].name;setSprite(img,id);parent.append(img);return img;}
  function title(text){const h=el('h2',text);h.id='pokemon-detail-title';root.append(h);}
  function panel(name){const section=el('section','','detail-panel');section.append(el('h3',name));root.append(section);return section;}
  function noteEditor(ref,parent){const n=notes(ref),label=el('label','Trainer notes','detail-notes');const area=document.createElement('textarea');area.maxLength=280;area.rows=3;area.placeholder='Record a strategy, memory, or training goal…';area.value=n.memo||'';label.append(area);parent.append(label);appendAction(parent,'SAVE NOTES',()=>{n.memo=area.value.trim();writeSave();pokemonRecord(ref)?summary(ref):inspect(speciesIdFor(ref));});}
  function heldEditor(ref,parent){
    const record=pokemonRecord(ref),id=record.speciesId;
    const select=document.createElement('select');select.setAttribute('aria-label',`Held item for ${SPECIES[id].name}`);select.add(new Option('No held item',''));
    Object.entries(U.equipment).forEach(([key,item])=>{const used=save.pokemon.filter(mon=>mon.uid!==record.uid&&mon.heldItem===key).length;if((save.inventory[key]||0)>used)select.add(new Option(`${item.name} · ×${save.inventory[key]||0}`,key));});
    select.value=record.heldItem||'';select.onchange=()=>{record.heldItem=select.value;writeSave();summary(record.uid);};parent.append(select,el('p',U.equipment[select.value]?.description||'Choose one owned item. Held items return after each match.','detail-hint'));
  }
  function evolutionStatus(ref,parent){
    const record=pokemonRecord(ref),id=record.speciesId;
    const rule=EVOLUTIONS[id];if(!rule){parent.append(el('p','This Pokémon is fully evolved.'));return;}
    const stoneRule=STONE_RULES[id],paused=Boolean(record.evolutionPaused);
    if(stoneRule){
      parent.append(el('p','Use an evolution stone when you are ready. Evolution never happens automatically.','detail-hint'));
      Object.entries(stoneRule.targets).forEach(([to,stone])=>{const count=save.inventory[stone]||0;appendAction(parent,`USE ${ITEMS[stone]?.name||pretty(stone)} → ${SPECIES[to].name} · ×${count}`,()=>evolution(record.uid,null,to),count<1||Boolean(battle&&!battle.over));});
    } else {
      const ready=levelFor(id)>=rule[1];parent.append(el('p',ready?`Ready to evolve into ${(Array.isArray(rule[0])?rule[0]:[rule[0]]).map(x=>SPECIES[x].name).join(' / ')}.`:`Reaches its next evolution at level ${rule[1]}.`));
      appendAction(parent,paused?'RESUME EVOLUTION':'PAUSE EVOLUTION',()=>{record.evolutionPaused=!paused;if(!record.evolutionPaused&&ready&&!save.growthQueue.some(e=>e.kind==='evolve'&&e.uid===record.uid))save.growthQueue.push({kind:'evolve',uid:record.uid,id});if(record.evolutionPaused)save.growthQueue=save.growthQueue.filter(e=>!(e.kind==='evolve'&&e.uid===record.uid));writeSave();summary(record.uid);});
      if(ready&&!paused)appendAction(parent,'EVOLVE NOW',()=>evolution(record.uid));
    }
  }
  function summary(ref){
    const record=pokemonRecord(ref);if(!record)return inspect(speciesIdFor(ref));const id=record.speciesId;open();const n=notes(record.uid),mon=SPECIES[id],stats=calculatedStats(id,levelFor(record.uid));
    const hero=el('header','','detail-hero');portrait(id,hero);const copy=el('div');const h=el('h2',n.nickname||mon.name);h.id='pokemon-detail-title';copy.append(h,el('p',`${mon.name} · #${String(mon.dex).padStart(3,'0')} · Level ${levelFor(record.uid)} · ${mon.types.join(' / ')}`));hero.append(copy);root.append(hero);
    const picker=document.createElement('select');picker.className='detail-switcher';picker.setAttribute('aria-label','Switch Pokémon summary');save.pokemon.forEach(entry=>picker.add(new Option(`${pokemonNameFor(entry.uid)} · L${levelFor(entry.uid)}`,entry.uid)));picker.value=record.uid;picker.onchange=()=>summary(picker.value);root.append(picker);
    const identity=panel('PROFILE');const label=el('label','Nickname');const input=document.createElement('input');input.maxLength=20;input.value=n.nickname||'';label.append(input);identity.append(label);appendAction(identity,'SAVE NICKNAME',()=>{n.nickname=input.value.trim();writeSave();summary(record.uid);});
    identity.append(el('p',`Battle role: ${U.identityFor(id).role}`),el('p',`Ability: ${pretty(U.abilityFor(id))}`),el('p',U.abilityDescriptions[U.abilityFor(id)]),el('p',`Origin: ${n.origin||'Joined before detailed records began'} · Matches: ${n.matches||0} · Wins: ${n.wins||0} · Knockouts: ${n.knockouts||0}`));noteEditor(id,identity);
    const training=panel('STATS & TRAINING');const grid=el('dl','','detail-stats');Object.entries(stats).forEach(([key,value])=>{grid.append(el('dt',pretty(key)),el('dd',String(value)));});training.append(grid);const xp=xpProgress(record.uid);training.append(el('p',levelFor(record.uid)===100?'Maximum level':`Experience: ${Math.floor(xp.current)} / ${xp.needed} to the next level`));
    const held=panel('HELD ITEM');heldEditor(record.uid,held);
    const moves=panel('MOVES');U.movesFor(record.uid,'player',levelFor(record.uid)).forEach(key=>{const move=el('div','','detail-move');move.append(el('strong',MOVES[key].name),el('p',describe(MOVES[key])));moves.append(move);});if(!battle)appendAction(moves,'EDIT MOVESET',()=>{close();PartyTray.close();showCollection();document.getElementById('party-workshop').open=true;const picker=document.querySelector('#training-content select');picker.value=record.uid;picker.dispatchEvent(new Event('change'));document.getElementById('party-workshop').scrollIntoView?.({block:'start'});});
    const evo=panel('EVOLUTION');evolutionStatus(record.uid,evo);
  }
  function inspect(id){
    if(!save.seen.includes(id)&&!save.owned.includes(id))return;const owned=save.pokemon.filter(mon=>mon.speciesId===id);if(owned.length)return summary(owned[0].uid);open();const mon=SPECIES[id],caught=save.caughtSpecies?.includes(id);const hero=el('header','','detail-hero observed');portrait(id,hero);const copy=el('div');const h=el('h2',mon.name);h.id='pokemon-detail-title';copy.append(h,el('p',`#${String(mon.dex).padStart(3,'0')} · ${caught?'CAUGHT · FORMER FORM':'OBSERVED'} · ${mon.types.join(' / ')}`));hero.append(copy);root.append(hero);
    const info=panel('POKÉDEX FIELD NOTES');info.append(el('p',caught?`${mon.name} is registered as caught. If it evolved, its individual moves, item, notes and battle history now belong to its evolved form.`:`${mon.name} has been observed in battle, but has not yet been caught. Catch it in Safari to unlock its personal stats, moves, equipment and evolution controls.`));const base=el('dl','','detail-stats');['HP','ATTACK','DEFENSE','SP. ATK','SP. DEF','SPEED'].forEach((label,i)=>base.append(el('dt',label),el('dd',String(mon.stats[i]))));info.append(base);if(!caught)noteEditor(id,info);
  }
  window.YSFlow?.on('pokemon:added',({id,record})=>{if(record?.speciesId===id)record.notes.origin=battle?(['safari','mewtwo','legendary'].includes(battle.mode)?'Caught in '+(battle.mode==='safari'?'Safari':'Mewtwo encounter'):'Evolution'):save.pokemon.length===1?'First partner':'Mystery Egg';},20);
  function removeEvent(e){const index=save.growthQueue.findIndex(x=>x===e||(x.kind===e.kind&&x.uid===e.uid&&x.id===e.id&&x.move===e.move));if(index>=0)save.growthQueue.splice(index,1);writeSave();}
  function transformPokemon(ref,to){
    const record=pokemonRecord(ref);if(!record||!SPECIES[to])return false;const id=record.speciesId;
    init();const level=levelFor(record.uid),progress=xpProgress(record.uid),sourceNotes={...(record.notes||{})};
    const equipped=[...(record.moveSet||U.movesFor(record.uid,'player',level))];
    const inherited=[...new Set([...(record.legacyMoves||[]),...equipped])];
    transformPokemonRecord(record.uid,to);
    save.seen=[...new Set([...(save.seen||[]),id,to])];
    save.caughtSpecies=[...new Set([...(save.caughtSpecies||save.owned),id,to])];
    const floor=expForLevel(to,level),ceiling=level<100?expForLevel(to,level+1):floor;
    record.xp=level>=100?floor:Math.min(ceiling-1,Math.floor(floor+(ceiling-floor)*(progress.needed?progress.current/progress.needed:0)));
    record.moveSet=equipped;record.legacyMoves=inherited;record.notes={...sourceNotes,evolutionHistory:[...new Set([...(sourceNotes.evolutionHistory||[]),id])]};record.evolutionHistory=[...new Set([...(record.evolutionHistory||[]),id])];record.evolutionPaused=false;
    save.owned=[...new Set(save.pokemon.map(mon=>mon.speciesId))];
    save.growthQueue=(save.growthQueue||[]).map(entry=>entry.uid===record.uid?{...entry,id:to}:entry);
    return true;
  }
  function repairLegacyEvolutionDuplicates(){let repaired=false;for(const target of [...save.pokemon]){const to=target.speciesId,from=PRE_EVOLUTION[to],source=save.pokemon.find(mon=>mon.speciesId===from);if(source&&target.notes?.origin===`Evolved from ${SPECIES[from].name}`){source.notes={...target.notes,...source.notes};save.pokemon=save.pokemon.filter(mon=>mon.uid!==target.uid);save.owned=save.owned.filter(id=>id!==to);transformPokemon(source.uid,to);repaired=true;}}if(repaired)writeSave();return repaired;}
  function evolution(ref,event,target=null){
    const record=pokemonRecord(ref);if(!record||battle&&!battle.over)return;const id=record.speciesId,rule=EVOLUTIONS[id],stoneRule=STONE_RULES[id];if(!rule)return;const choices=target?[target]:(Array.isArray(rule[0])?rule[0]:[rule[0]]);if(!stoneRule&&levelFor(record.uid)<rule[1])return;if(target&&stoneRule&&!(save.inventory[stoneRule.targets[target]]>0))return;
    open();portrait(id);title(`What? ${SPECIES[id].name} is evolving!`);root.append(el('p','Choose an evolution, or keep your Pokémon as it is. You can evolve later from its character menu.'));
    choices.forEach(to=>{const stone=stoneRule?.targets[to];appendAction(root,`EVOLVE INTO ${SPECIES[to].name}${stone?` · ${ITEMS[stone]?.name||pretty(stone)}`:''}`,()=>{if(stone){if(!(save.inventory[stone]>0))return;save.inventory[stone]-=1;}if(event){const index=save.growthQueue.findIndex(x=>x===event||(x.kind===event.kind&&x.uid===event.uid&&x.id===event.id));if(index>=0)save.growthQueue.splice(index,1);}if(!transformPokemon(record.uid,to))return;writeSave();root.replaceChildren();const img=portrait(to);img.classList.add('evolution-reveal');title(`${SPECIES[to].name}!`);root.append(el('p',`${SPECIES[id].name} evolved into ${SPECIES[to].name}! Its original form remains registered in your Pokédex.`));window.BattlePresentationDirector?.eventSound('victory');action('CONTINUE',nextGrowth);});});
    action('NOT NOW',()=>{if(event)removeEvent(event);nextGrowth();});
  }
  function nextGrowth(){init();const e=save.growthQueue[0];if(!e){close();renderRoster();PartyTray.render();return;}const record=pokemonRecord(e.uid||e.id);if(!record||(e.kind==='evolve'&&record.evolutionPaused)){removeEvent(e);nextGrowth();return;}const id=record.speciesId;if(e.kind==='evolve'){evolution(record.uid,e);return;}open();portrait(id);title(`${pokemonNameFor(record.uid)} learned ${MOVES[e.move].name}!`);root.append(el('p',describe(MOVES[e.move])));const equipped=U.movesFor(record.uid,'player',levelFor(record.uid));function equip(index){const next=[...equipped];if(index===null)next.push(e.move);else next[index]=e.move;record.moveSet=[...new Set(next)].slice(0,4);removeEvent(e);nextGrowth();}if(equipped.includes(e.move))action('KEEP EQUIPPED',()=>{removeEvent(e);nextGrowth();});else if(equipped.length<4)action('ADD TO MOVESET',()=>equip(null));else{root.append(el('p','Choose a move to replace:'));equipped.forEach((key,i)=>action(`REPLACE ${MOVES[key].name}`,()=>equip(i)));}action('KEEP CURRENT MOVES',()=>{removeEvent(e);nextGrowth();});root.append(el('p','Unlocked moves remain available in Party Training.'));}
  let endSnapshot=null;
  window.YSFlow?.on('battle:beforeEnd',({battle:finished})=>{
    if(!finished||finished.over)return;
    endSnapshot={battle:finished,before:Object.fromEntries(finished.player.map(m=>{const ref=m.companionUid||m.id;return[ref,{moves:U.unlockedMoves(ref)}];}))};
  },40);
  window.YSFlow?.on('battle:ended',({battle:finished,victory:win})=>{
    if(!finished)return;
    const before=endSnapshot?.battle===finished?endSnapshot.before:{};endSnapshot=null;init();const learned=[];
    finished.player.forEach(m=>{const ref=m.companionUid||m.id,n=notes(ref);n.matches=(Number(n.matches)||0)+1;n.wins=(Number(n.wins)||0)+(win?1:0);n.knockouts=(Number(n.knockouts)||0)+(m.matchKnockouts||0);U.unlockedMoves(ref).filter(x=>!(before[ref]?.moves||[]).includes(x)).forEach(move=>{save.growthQueue.unshift({kind:'move',uid:m.companionUid,id:m.id,move});learned.push(MOVES[move].name);});});
    const mvp=[...finished.player].sort((a,b)=>(b.matchKnockouts||0)-(a.matchKnockouts||0)||(b.matchDamage||0)-(a.matchDamage||0))[0],mvpRef=mvp.companionUid||mvp.id;
    const recap=el('section','','match-recap');recap.append(el('h3','MATCH RECAP'),el('p',`${win?'Victory':'Defeat'} · ${finished.turn} turns`),el('p',mvp.matchDamage?`MVP: ${pokemonNameFor(mvpRef)} · ${mvp.matchKnockouts||0} knockouts · ${mvp.matchDamage} damage`:'No direct damage recorded.'),el('p',finished.lastKnockout?`Last knockout: ${finished.lastKnockout}`:'No direct knockout recorded.'));if(learned.length)recap.append(el('p','New moves: '+learned.join(', ')));els.reward.append(recap);if(save.growthQueue.length){const b=el('button','REVIEW NEW MOVES & EVOLUTIONS','detail-action');b.onclick=nextGrowth;els.reward.append(b);}writeSave();
  },30);
  window.YSFlow?.on('battle:moves',()=>{if(!battle?.slots)return;const actor=U.active('player')[battle.commandSlot||0]||U.active('player')[0];if(!actor)return;document.querySelectorAll('#moves .move-choice').forEach((node,i)=>{const move=MOVES[actor.moveIds[i]]||MOVES.struggle;if(node.querySelector('.move-explanation'))return;const details=el('details','','move-explanation');details.append(el('summary','MOVE DETAILS'),el('p',describe(move)));node.append(details);});},20);
  function summaryAccess(){const workshop=document.getElementById('party-workshop');let bar=document.getElementById('pokemon-summary-access');if(!bar){bar=el('div','','summary-access');bar.id='pokemon-summary-access';workshop.before(bar);}bar.replaceChildren();bar.append(el('p','Tap any Pokémon card for stats, notes, held items and evolution controls.'));if(save.growthQueue.length){const review=el('button','REVIEW GROWTH','detail-action');review.onclick=nextGrowth;bar.append(review);}}
  window.YSFlow?.on('party:rendered',summaryAccess,20);
  document.getElementById('continue-button').addEventListener('click',()=>{if(!battle&&save.growthQueue?.length)nextGrowth();});
  if(repairLegacyEvolutionDuplicates())renderRoster();window.PokemonDetails={summary,inspect,describe,nextGrowth,evolution,transformPokemon,stoneRules:STONE_RULES};summaryAccess();PartyTray.render();
})();

