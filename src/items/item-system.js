
"use strict";
(() => {
  const STONES = {
    fireStone:{vulpix:'ninetales',growlithe:'arcanine',eevee:'flareon'},
    waterStone:{poliwhirl:'poliwrath',shellder:'cloyster',staryu:'starmie',eevee:'vaporeon'},
    thunderStone:{pikachu:'raichu',eevee:'jolteon'},
    leafStone:{gloom:'vileplume',weepinbell:'victreebel',exeggcute:'exeggutor'},
    moonStone:{nidorina:'nidoqueen',nidorino:'nidoking',clefairy:'clefable',jigglypuff:'wigglytuff'}
  };
  const medicine = new Set(['potion','superPotion','fullHeal','revive']);
  const balls = new Set(['pokeBall','greatBall','ultraBall','superBall','masterBall']);
  const heldIds = () => Object.keys(window.StadiumUpgrade?.equipment || {}).filter(id => ITEMS[id]?.held);

  // Evolution stones are field items, never battle medicine. Rare Candy is also field-only.
  Object.keys(STONES).forEach(id => { if(ITEMS[id]) Object.assign(ITEMS[id],{fieldUse:'evolution',battleUse:false}); });
  ITEMS.rareCandy ||= {name:'RARE CANDY',price:0,rewardOnly:true,fieldUse:'level',battleUse:false,description:'Raises one Pokémon by one level.'};
  save.inventory.rareCandy = Math.max(0, Number(save.inventory.rareCandy)||0);
  writeSave();

  // Battle eligibility is enforced by the battle engine through ITEMS[id].battleUse.
  // This module owns field actions only; it does not patch battle commands.

  const modal=document.createElement('div'); modal.className='modal item-use-modal'; modal.hidden=true;
  modal.innerHTML='<section class="item-use-card" role="dialog" aria-modal="true" aria-labelledby="item-use-title"><button type="button" class="item-use-close" aria-label="Close">×</button><div class="item-use-content"></div></section>';
  document.body.append(modal); const content=modal.querySelector('.item-use-content');
  const close=()=>{modal.hidden=true;}; modal.querySelector('.item-use-close').onclick=close; modal.onclick=e=>{if(e.target===modal)close();};
  function open(title,copy){content.replaceChildren(); const h=document.createElement('h2');h.id='item-use-title';h.textContent=title;const p=document.createElement('p');p.textContent=copy;content.append(h,p);modal.hidden=false;}
  function option(record,label,run){const b=document.createElement('button');b.type='button';b.className='item-use-option';const img=document.createElement('img');setSprite(img,record.speciesId);img.alt='';const span=document.createElement('span');span.innerHTML=`<strong>${pokemonNameFor(record.uid)}</strong><small>Lv ${levelFor(record.uid)} · ${label}</small>`;b.append(img,span);b.onclick=run;content.append(b);}

  function useStone(id){
    const rules=STONES[id], compatible=save.pokemon.filter(r=>rules[r.speciesId]);
    open(ITEMS[id].name, compatible.length?'Choose a Pokémon to evolve. The stone is consumed only after evolution.':'No Pokémon in your collection can use this stone right now.');
    compatible.forEach(record=>option(record,`→ ${SPECIES[rules[record.speciesId]].name}`,()=>{close();window.PokemonDetails?.evolution(record.uid,null,rules[record.speciesId]);}));
  }
  function useCandy(){
    const eligible=save.pokemon.filter(r=>levelFor(r.uid)<100);
    open('RARE CANDY',eligible.length?'Choose a Pokémon. Its level will increase by one.':'Every Pokémon in your collection is already level 100.');
    eligible.forEach(record=>option(record,'+1 level',()=>{
      if(!(save.inventory.rareCandy>0)) return close();
      const before=levelFor(record.uid), next=Math.min(100,before+1); save.inventory.rareCandy--;
      record.xp=expForLevel(record.speciesId,next); writeSave();
      processEvolutions?.([{id:record.speciesId,uid:record.uid,before,after:next}]); writeSave(); close();
      renderRoster(); window.PartyTray?.render?.(); window.BagSystem?.render?.();
      if(save.growthQueue?.length) window.PokemonDetails?.nextGrowth?.();
    }));
  }

  function maxHp(record){ return calculatedStats(record.speciesId,levelFor(record.uid)).hp; }
  function stateFor(record){
    const max=maxHp(record);
    record.adventureState ||= {hp:max,status:null,sleep:0};
    if(!Number.isFinite(record.adventureState.hp)) record.adventureState.hp=max;
    record.adventureState.hp=Math.max(0,Math.min(max,Math.floor(record.adventureState.hp)));
    return {state:record.adventureState,max};
  }
  function useMedicine(id){
    const compatible=save.pokemon.filter(record=>{
      const {state,max}=stateFor(record);
      if(id==='revive') return state.hp<=0;
      if(id==='fullHeal') return !!state.status;
      return state.hp>0&&state.hp<max;
    });
    open(ITEMS[id].name,compatible.length?'Choose a Pokémon. Adventure HP and status carry between Journey and Safari battles.':'No Pokémon needs this item right now.');
    compatible.forEach(record=>{
      const {state,max}=stateFor(record);
      const label=id==='revive'?`FAINTED · restore ${Math.max(1,Math.floor(max/2))}/${max} HP`:id==='fullHeal'?`${state.status||'STATUS'} · cure`:`${state.hp}/${max} HP`;
      option(record,label,()=>{
        if(!(save.inventory[id]>0)) return close();
        save.inventory[id]--;
        if(id==='revive'){state.hp=Math.max(1,Math.floor(max/2));state.status=null;state.sleep=0;}
        else if(id==='fullHeal'){state.status=null;state.sleep=0;}
        else state.hp=Math.min(max,state.hp+(id==='superPotion'?70:40));
        writeSave(); close(); renderRoster(); window.PartyTray?.render?.(); window.BagSystem?.render?.();
      });
    });
  }
  function equipHeld(id){
    const available=(save.inventory[id]||0)-save.pokemon.filter(r=>r.heldItem===id).length;
    open(ITEMS[id].name,available>0?'Choose a Pokémon to hold this item. Held items are not consumed after battle.':'Every copy of this held item is already equipped.');
    if(available<=0)return;
    save.pokemon.forEach(record=>option(record,record.heldItem?`Replace ${ITEMS[record.heldItem]?.name||'held item'}`:'Hold item',()=>{record.heldItem=id;writeSave();close();renderRoster();window.PartyTray?.render?.();window.BagSystem?.render?.();}));
  }
  function actionFor(id){
    if(STONES[id]) return ['USE',()=>useStone(id)];
    if(id==='rareCandy') return ['USE',useCandy];
    if(ITEMS[id]?.held) return ['EQUIP',()=>equipHeld(id)];
    if(balls.has(id)) return ['BATTLE ONLY',null];
    if(medicine.has(id)) return ['USE',()=>useMedicine(id)];
    return [ITEMS[id]?.rewardOnly?'KEY / REWARD':'INFO',null];
  }

  // Field actions are exposed to the canonical Bag renderer. ItemSystem does not
  // own Bag DOM, navigation, tab state, or rendering.
  // Fix an older per-species lookup: level-based evolution readiness must use the individual Pokémon instance.
  // The stone path above bypasses level gates entirely, matching Kanto stone evolution rules.
  window.ItemSystem=Object.freeze({stones:STONES,useStone,useCandy,useMedicine,equipHeld,actionFor});
})();

