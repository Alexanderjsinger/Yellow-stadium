
"use strict";
(() => {
  const Runtime=window.YSRuntime;
  const icons = {
    "collection-tab": '<path d="M4 20v-2a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/>',
    "cups-tab": '<path d="M8 4h8v4a4 4 0 0 1-8 0V4Zm-3 1H3v2a4 4 0 0 0 4 4m12-6h2v2a4 4 0 0 1-4 4M12 12v5m-4 3h8m-6-3h4"/>',
    "trainer-tab": '<path d="M4 17V9l8-5 8 5v8M2 20h20M8 20v-7h8v7M6 9h12"/>',
    "safari-tab": '<path d="M3 12s3-5 7-5c2 0 3 2 2 4 3-2 7-1 9 2-3 5-8 7-13 5-3-1-5-3-5-6Zm7-5 1-3m1 0-1 3"/>',
    "pokedex-tab": '<path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4V4Zm4 0v16m4-11h4m-4 4h4"/>',
    "shop-tab": '<path d="M5 8h14l-1 12H6L5 8Zm3 0a4 4 0 0 1 8 0M9 12v1m6-1v1"/>'
  };
  const labels={"collection-tab":"Party","cups-tab":"Journey","trainer-tab":"Cups","safari-tab":"Safari","pokedex-tab":"Dex","shop-tab":"Bag"};
  Object.entries(icons).forEach(([id,path])=>{const button=document.getElementById(id);if(!button)return;button.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg><span>${labels[id]}</span>`;button.setAttribute('aria-label',labels[id]);});
  const guide=document.getElementById('joke-guide'),topbar=document.querySelector('.topbar');
  if(guide&&topbar){guide.className='professor-shortcut';guide.innerHTML='<span aria-hidden="true">?</span><b>Professor Joke</b>';guide.setAttribute('aria-label','Open Professor Joke guide');topbar.append(guide);}

  const rewardItems={
    fireStone:{name:'FIRE STONE',price:0,rewardOnly:true,description:'Use on Vulpix, Growlithe, or Eevee to trigger evolution.'},
    waterStone:{name:'WATER STONE',price:0,rewardOnly:true,description:'Use on Poliwhirl, Shellder, Staryu, or Eevee to trigger evolution.'},
    thunderStone:{name:'THUNDER STONE',price:0,rewardOnly:true,description:'Use on Pikachu or Eevee to trigger evolution.'},
    leafStone:{name:'LEAF STONE',price:0,rewardOnly:true,description:'Use on Gloom, Weepinbell, or Exeggcute to trigger evolution.'},
    moonStone:{name:'MOON STONE',price:0,rewardOnly:true,description:'Use on Nidorina, Nidorino, Clefairy, or Jigglypuff to trigger evolution.'}
  };
  Object.assign(ITEMS,rewardItems);Runtime.updateSave(current=>{Object.keys(rewardItems).forEach(id=>{current.inventory[id]=Math.max(0,Number(current.inventory[id])||0);});});
  const pools={
    journey:['moonStone','fireStone','waterStone','thunderStone','leafStone','charcoal','mysticWater','miracleSeed','magnet'],
    cups:['quickClaw','focusBand','leftovers','sitrusBerry','lumBerry','charcoal','mysticWater','miracleSeed','magnet'],
    safari:['oranBerry','sitrusBerry','lumBerry','leafStone','moonStone','waterStone']
  };
  window.YSFlow?.on('battle:ended',({battle:finished,victory:win})=>{
    if(!finished)return;const mode=finished.mode,leader=mode==='cup'&&finished.cupRound===2,captured=Boolean(finished.captured);
    const group=mode==='cup'?'journey':['trainer','trainerDuo','arcade'].includes(mode)?'cups':mode==='safari'?'safari':null;
    if(!group||(!win&&!captured))return;const chance=leader?1:(group==='cups'?0.45:0.55);if(Math.random()>chance)return;
    const pool=pools[group],id=pool[Math.floor(Math.random()*pool.length)];Runtime.updateSave(current=>{current.inventory[id]=(current.inventory[id]||0)+1;});finished.lootReward=id;
    const row=document.createElement('strong');row.className='loot-reward';row.innerHTML=`<span class="item-glyph" aria-hidden="true">${({pokeBall:'◉',greatBall:'◉',ultraBall:'◉',superBall:'◉',masterBall:'◉',potion:'✚',superPotion:'✚',fullHeal:'✦',revive:'✧',fireStone:'◆',waterStone:'◆',thunderStone:'◆',leafStone:'◆',moonStone:'◆'})[id]||'◆'}</span><span>ITEM FOUND · ${ITEMS[id].name}</span><small>×${Runtime.save.inventory[id]}</small>`;Runtime.element("reward").append(row);
  },10);
  window.MobileShell={rewardItems,pools};
})();

