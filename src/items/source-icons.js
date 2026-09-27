
(()=>{
const A='assets/items/';
const icons={pokeBall:'poke_ball.png',greatBall:'great_ball.png',ultraBall:'ultra_ball.png',superBall:'super_ball.png',masterBall:'master_ball.png',potion:'potion.png',superPotion:'potion.png',fullHeal:'full_heal.png',revive:'revive.png',rareCandy:'rare_candy.png',leftovers:'leftovers.png',quickClaw:'quick_claw.png',focusBand:'focus_band.png',fireStone:'fire_stone.png',waterStone:'water_stone.png',thunderStone:'thunder_stone.png',leafStone:'leaf_stone.png',moonStone:'moon_stone.png'};
const names={}; Object.entries(icons).forEach(([k,v])=>names[(window.ITEMS?.[k]?.name||k).toUpperCase()]=v);
Object.assign(names,{'POKÉ BALL':'poke_ball.png','POKE BALL':'poke_ball.png','GREAT BALL':'great_ball.png','ULTRA BALL':'ultra_ball.png','SUPER BALL':'super_ball.png','MASTER BALL':'master_ball.png','POTION':'potion.png','SUPER POTION':'potion.png','FULL HEAL':'full_heal.png','REVIVE':'revive.png','RARE CANDY':'rare_candy.png','LEFTOVERS':'leftovers.png','QUICK CLAW':'quick_claw.png','FOCUS BAND':'focus_band.png','FIRE STONE':'fire_stone.png','WATER STONE':'water_stone.png','THUNDER STONE':'thunder_stone.png','LEAF STONE':'leaf_stone.png','MOON STONE':'moon_stone.png'});
function infer(el){const card=el.closest('.item-card,.shop-card,.loot-reward,.reward-major,.reward-item,.battle-item,[data-item]')||el.parentElement; const id=card?.dataset?.item||card?.dataset?.id; if(id&&icons[id])return icons[id]; const t=(card?.textContent||'').toUpperCase(); return Object.entries(names).find(([n])=>t.includes(n))?.[1];}
function img(file,cls='source-item-img'){return `<img class="${cls}" src="${A+file}" alt="">`;}
function upgrade(root=document){
 root.querySelectorAll?.('.item-icon,.item-glyph,.reward-icon').forEach(el=>{if(el.querySelector('img'))return; const f=infer(el); if(f){el.innerHTML=img(f);el.classList.add('source-backed');}});
 // Main Bag cards in the bundled UI use item-icon but can be rebuilt repeatedly; infer from card text.
 root.querySelectorAll?.('.bag-grid > *, .battle-items > *').forEach(card=>{const icon=card.querySelector?.('.item-icon,.item-glyph');if(!icon||icon.querySelector('img'))return;const f=infer(icon);if(f)icon.innerHTML=img(f);});
}
const mo=new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1)upgrade(n)})));
function start(){upgrade();mo.observe(document.body,{childList:true,subtree:true});}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
window.YS_SOURCE_ITEM_ICONS=icons;
})();

