"use strict";

/* C3 battle runtime.
 * Recovered presentation generations are implementation details installed at
 * their historical script slots so startup/listener ordering remains stable.
 */

YSPresentationInstallers.BattlePresentation = () => {
  if (YSPresentationInternals.BattlePresentation) return YSPresentationInternals.BattlePresentation;
"use strict";
// Original presentation layer: perspective transforms, not a DS emulator.
(() => {
  const Runtime=window.YSRuntime;
  const world = document.getElementById('battle-world');
  const arena = document.getElementById('battle-arena');
  if (!world || !arena || !world.appendChild) return;
  for (const selector of ['.enemy-pad','.player-pad','#enemy-partner','#player-partner']) {
    const node = arena.querySelector(selector);
    if (node) world.appendChild(node);
  }
  // Sprites and names remain accessible; only the floor is decorative.
  world.removeAttribute('aria-hidden');
  world.querySelector('.battle-floor').setAttribute('aria-hidden','true');
  const button = document.getElementById('camera-toggle');
  const banner = document.getElementById('move-banner');
  const label = document.getElementById('impact-label');
  let dynamic = true, lastBattle = null;
  try { dynamic = localStorage.getItem('yellow-stadium-camera') !== 'fixed'; } catch {}
  const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  function reset() { arena.dataset.focus = 'wide'; banner.hidden = true; label.hidden = true; }
  function preference() {
    arena.dataset.camera = dynamic && !reduced() ? 'dynamic' : 'fixed';
    button.textContent = `CAMERA · ${dynamic && !reduced() ? 'DYNAMIC' : 'FIXED'}`;
    button.setAttribute('aria-pressed',String(dynamic && !reduced()));
  }
  button.onclick = () => { dynamic = !dynamic; try { localStorage.setItem('yellow-stadium-camera',dynamic ? 'dynamic' : 'fixed'); } catch {} preference(); reset(); };
  window.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change',preference);
  const palette = { FIRE:'#ff955d', WATER:'#69bdff', ELECTRIC:'#ffe36b', GRASS:'#8dea9e', ICE:'#a0edff', PSYCHIC:'#f4a0dc', GHOST:'#bb9aef', POISON:'#d9a1f0', GROUND:'#e4bd85', ROCK:'#dec69a', FIGHTING:'#ffb08c' };
  function cue(actor, move) {
    arena.dataset.focus = actor.side;
    arena.style.setProperty('--move-color',palette[move.type] || '#edf5ff');
    banner.textContent = `${actor.name}  /  ${move.name}`; banner.hidden = false; label.hidden = true;
  }
  function impact(target, text) {
    arena.dataset.focus = target.side === 'player' ? 'hit-player' : 'hit-enemy';
    label.dataset.side = target.side; label.textContent = text; label.hidden = false;
    if (!reduced() && label.animate) label.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:180});
  }
  function render() {
    if (!Runtime.battle?.slots) return;
    if (Runtime.battle !== lastBattle) { lastBattle = Runtime.battle; reset(); }
    arena.dataset.duo = String(Runtime.battle.mode === 'trainerDuo');
    arena.dataset.weather = Runtime.battle.weather;
    for (const side of ['player','enemy']) {
      const mon = side === 'player' ? activePlayer() : activeEnemy();
      const living = Runtime.battle[side].filter(p=>p.hp>0).length;
      const name = mon.ability.replace(/([A-Z])/g,' $1');
      document.getElementById(`${side}-battle-detail`).textContent = `${mon.types.join(' / ')} · ${name.toUpperCase()} · ${living}/${Runtime.battle[side].length} left`;
    }
    if (Runtime.battle.over || !Runtime.battle.locked) reset();
  }
  preference(); reset();
  YSPresentationInternals.BattlePresentation=Object.freeze({ cue, impact, render, reset });
})();
  return YSPresentationInternals.BattlePresentation;
};

YSPresentationInstallers.BattlePolish = () => {
  if (YSPresentationInternals.BattlePolish) return YSPresentationInternals.BattlePolish;
"use strict";
// Battle choreography, event audio and user-controlled pacing. Mechanics never
// depend on this layer, so reduced-motion and blocked audio remain fully playable.
(() => {
  const Runtime=window.YSRuntime;
  const speedKey = "yellow-stadium-battle-speed";
  const speeds = [
    { id: "quick", label: "QUICK", delay: .5, animation: .65 },
    { id: "classic", label: "CLASSIC", delay: .84, animation: .92 },
    { id: "cinematic", label: "CINEMATIC", delay: 1.12, animation: 1.08 }
  ];
  let speed = "classic";
  try { speed = localStorage.getItem(speedKey) || "classic"; } catch { speed = "classic"; }
  if (!speeds.some(entry => entry.id === speed)) speed = "classic";
  const setting = () => speeds.find(entry => entry.id === speed);
  const reduced = () => !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const audio = () => window.AudioManager;
  const wait = ms => new Promise(resolve => setTimeout(resolve, reduced() ? 0 : Math.max(0, ms)));
  const sprite = mon => {
    if (!mon) return null;
    const active = window.StadiumUpgrade?.active?.(mon.side) || [];
    return document.getElementById(`${mon.side}${active[0] === mon ? "" : "-partner"}-sprite`);
  };
  async function animate(node, frames, options) {
    if (!node?.animate || reduced()) return;
    let animation;
    try { animation = node.animate(frames, { fill: "both", ...options }); await animation.finished; } catch { /* A new scene may cancel an old animation. */ }
    finally { animation?.cancel(); }
  }

  function moveSound(actor, move) { audio()?.move?.(move); }
  function eventSound(event) { audio()?.event?.(event); }

  async function sendOut(mon) {
    const node = sprite(mon); if (!node) return;
    eventSound("send");
    const pad = node.closest(".sprite-pad") || node.parentElement;
    const ball = document.createElement("span"); ball.className = `sendout-ball ${mon.side}`; ball.setAttribute("aria-hidden", "true"); pad?.append(ball);
    await Promise.all([
      animate(ball, [{ transform: "translate(-45px,-55px) rotate(0) scale(.4)", opacity: 0 }, { transform: "translate(0,0) rotate(540deg) scale(1)", opacity: 1, offset: .72 }, { transform: "scale(2.2)", opacity: 0 }], { duration: 430 * setting().animation, easing: "cubic-bezier(.2,.7,.2,1)" }),
      animate(node, [{ transform: "scale(.05)", opacity: 0, filter: "brightness(4)" }, { transform: "scale(1.14)", opacity: 1, filter: "brightness(1.7)", offset: .7 }, { transform: "scale(1)", opacity: 1, filter: "brightness(1)" }], { duration: 520 * setting().animation, easing: "ease-out", delay: 180 * setting().animation })
    ]);
    ball.remove(); node.style.removeProperty("transform"); node.style.removeProperty("opacity"); node.style.removeProperty("filter");
  }
  async function withdraw(mon) {
    const node = sprite(mon); if (!node) return;
    eventSound("withdraw");
    await animate(node, [{ transform: "scale(1)", opacity: 1 }, { transform: "scale(.08)", opacity: 0, filter: "brightness(3)" }], { duration: 260 * setting().animation, easing: "ease-in" });
    node.style.removeProperty("transform"); node.style.removeProperty("opacity"); node.style.removeProperty("filter");
  }
  async function prepare(mon, move) {
    const node = sprite(mon); if (!node) return;
    moveSound(mon, move);
    const direction = mon.side === "player" ? 1 : -1;
    const frames = move.category === "PHYSICAL"
      ? [{ transform: "translateX(0) scale(1)" }, { transform: `translateX(${-10 * direction}px) scale(.96)`, offset: .45 }, { transform: `translateX(${24 * direction}px) scale(1.08)` }]
      : [{ transform: "translateY(0) scale(1)", filter: "brightness(1)" }, { transform: "translateY(-7px) scale(1.06)", filter: `brightness(1.6) drop-shadow(0 0 12px ${audio()?.hasTypeVoice?.(move.type) ? "#fff" : "#ffd65a"})` }, { transform: "translateY(0) scale(1)", filter: "brightness(1)" }];
    await animate(node, frames, { duration: 260 * setting().animation, easing: "ease-out" });
    node.style.removeProperty("transform"); node.style.removeProperty("filter");
  }
  async function impact(mon, outcome = "hit") {
    const node = sprite(mon); if (!node) return;
    if (outcome !== "miss" && outcome !== "critical") eventSound("hit");
    if (outcome === "critical") eventSound("critical");
    const direction = mon.side === "player" ? -1 : 1;
    await animate(node, outcome === "miss"
      ? [{ transform: "translateX(0)" }, { transform: `translateX(${18 * direction}px)` }, { transform: "translateX(0)" }]
      : outcome === "critical"
        ? [{ transform: "translate(0,0) scale(1)", filter: "brightness(1) contrast(1)" }, { transform: `translate(${28 * direction}px,-5px) scale(.92) rotate(${5 * direction}deg)`, filter: "brightness(3.2) contrast(1.5)", offset:.28 }, { transform: `translate(${-13 * direction}px,3px) scale(1.06) rotate(${-3 * direction}deg)`, filter: "brightness(.35) contrast(1.4)", offset:.58 }, { transform: `translate(${5 * direction}px,0) scale(.98)`, filter: "brightness(1.35)", offset:.78 }, { transform: "translate(0,0) scale(1)", filter: "brightness(1) contrast(1)" }]
      : [{ transform: "translateX(0)", filter: "brightness(1)" }, { transform: `translateX(${14 * direction}px)`, filter: "brightness(2)" }, { transform: `translateX(${-7 * direction}px)`, filter: "brightness(.55)" }, { transform: "translateX(0)", filter: "brightness(1)" }],
      { duration: (outcome === "miss" ? 260 : outcome === "critical" ? 470 : 340) * setting().animation, easing: outcome === "critical" ? "cubic-bezier(.12,.8,.2,1)" : "ease-out" });
    node.style.removeProperty("transform"); node.style.removeProperty("filter");
  }
  async function faint(mon) {
    const node = sprite(mon); if (!node) return;
    await window.YSFlow?.emitAsync("presentation:beforeFaint", { mon });
    eventSound("faint");
    await animate(node, [{ transform: "translateY(0) rotate(0)", opacity: 1 }, { transform: `translateY(48px) rotate(${mon.side === "player" ? -8 : 8}deg)`, opacity: 0 }], { duration: 520 * setting().animation, easing: "ease-in" });
    node.style.removeProperty("transform"); node.style.removeProperty("opacity");
  }

  let lowHpTimer;
  function render() {
    if (!Runtime.battle) return;
    const current = Runtime.battle;
    if (!current) return;
    for (const side of ["player", "enemy"]) {
      const holder = document.getElementById(`${side}-team-pips`); if (!holder) continue;
      holder.replaceChildren(...current[side].map((mon, index) => {
        const pip = document.createElement("i"); pip.className = mon.hp <= 0 ? "fainted" : current.slots?.[side]?.includes(index) ? "active" : "ready";
        pip.title = `${mon.name}: ${Math.max(0, mon.hp)}/${mon.maxHp} HP`; return pip;
      }));
    }
    const mon = current.player?.[current.pActive];
    const low = mon && mon.hp > 0 && mon.hp <= mon.maxHp * .25 && !current.over && !audio()?.muted;
    if (low && !lowHpTimer) lowHpTimer = setInterval(() => audio()?.event?.("lowHp"), 1200);
    if (!low && lowHpTimer) { clearInterval(lowHpTimer); lowHpTimer = null; }
  }
  function finish(victory) { if (lowHpTimer) { clearInterval(lowHpTimer); lowHpTimer = null; } eventSound(victory ? "victory" : "defeat"); }
  function setSpeed(next) {
    speed = next; try { localStorage.setItem(speedKey, speed); } catch {}
    const button = document.getElementById("battle-speed"); if (button) button.textContent = `SPEED · ${setting().label}`;
  }
  const speedButton = document.getElementById("battle-speed");
  if (speedButton) {
    speedButton.onclick = () => setSpeed(speeds[(speeds.findIndex(entry => entry.id === speed) + 1) % speeds.length].id);
    setSpeed(speed);
  }
  document.addEventListener("visibilitychange", () => { if (document.hidden && lowHpTimer) { clearInterval(lowHpTimer); lowHpTimer = null; } });
  YSPresentationInternals.BattlePolish = Object.freeze({ get speed() { return speed; }, get scale() { return setting().animation; }, delay: ms => Math.round(ms * setting().delay), wait, sendOut, withdraw, prepare, impact, faint, moveSound, eventSound, finish, render, setSpeed });
})();
  return YSPresentationInternals.BattlePolish;
};

YSPresentationInstallers.BattleAtmosphere = () => {
  if (YSPresentationInternals.BattleAtmosphere) return YSPresentationInternals.BattleAtmosphere;
"use strict";
// Cosmetic effects never consume battle RNG or change damage/capture probabilities.
(() => {
  const Runtime=window.YSRuntime;
  const arena=document.getElementById('battle-arena');
  const layer=document.createElement('div');layer.className='arena-atmosphere';layer.setAttribute('aria-hidden','true');arena.append(layer);
  const weather=document.createElement('div');weather.className='weather-particles';layer.append(weather);
  for(let i=0;i<28;i++){const p=document.createElement('i');p.style.setProperty('--x',`${(i*37)%100}%`);p.style.setProperty('--delay',`${-i*.19}s`);weather.append(p);}
  let current=null,marks=[];
  function render(){
    if(!Runtime.battle)return;
    if(current!==Runtime.battle){marks.forEach(m=>m.node.remove());marks=[];current=Runtime.battle;}
    layer.dataset.weather=Runtime.battle.weather||'clear';
    marks=marks.filter(m=>{if(Runtime.battle.turn-m.turn>=4){m.node.remove();return false;}return true;});
    for(const side of ['player','enemy'])for(let slot=0;slot<2;slot++){
      const img=document.getElementById(`${side}${slot?'-partner':''}-sprite`);
      const mon=Runtime.battle[side]?.[Runtime.battle.slots?.[side]?.[slot]];
      if(!img)continue;
      const health=!mon?'healthy':mon.hp<=0?'fainted':mon.hp/mon.maxHp<=.25?'hurt':mon.hp/mon.maxHp<=.5?'tired':'healthy';
      img.dataset.health=health;
      img.title=mon?`${mon.name}: ${health==='healthy'?'ready to battle':health}`:'';
      img.parentElement.dataset.health=health;
    }
  }
  window.YSFlow?.on('battle:ui',render,10);
  function aftermath(target,move){
    if(!Runtime.battle||!move.power||move.power<60||target.protected||StadiumUpgrade.immunity(target,move))return;
    const kind={FIRE:'scorch',WATER:'puddle',ICE:'frost',GROUND:'cracks',ROCK:'cracks',ELECTRIC:'sparks',GRASS:'leaves'}[move.type];
    if(!kind)return;
    const node=document.createElement('div');node.className=`arena-scar ${kind}`;
    node.style.left=target.side==='enemy'?'67%':'24%';node.style.top=target.side==='enemy'?'53%':'86%';
    layer.append(node);marks.push({node,turn:Runtime.battle.turn});
    if(marks.length>6)marks.shift().node.remove();
  }
  const info=document.getElementById('command-pane-info');
  if(info){const button=document.createElement('button');button.type='button';button.id='battle-music-toggle';const sync=()=>{const muted=document.getElementById('music-toggle').getAttribute('aria-pressed')==='true';button.textContent=muted?'MUSIC · OFF':'MUSIC · ON';button.setAttribute('aria-pressed',String(!muted));};button.addEventListener('click',async()=>{await window.AudioManager?.toggle?.();sync();});info.prepend(button);sync();new MutationObserver(sync).observe(document.getElementById('music-toggle'),{attributes:true,attributeFilter:['aria-pressed']});}
  YSPresentationInternals.BattleAtmosphere=Object.freeze({render,aftermath});
})();
  return YSPresentationInternals.BattleAtmosphere;
};

YSPresentationInstallers.BattleCinematics = () => {
  if (YSPresentationInternals.BattleCinematics) return YSPresentationInternals.BattleCinematics;
"use strict";
// Short combat punctuation inspired by later handheld entries. This layer never
// changes accuracy, damage or turn order; it only makes existing outcomes readable.
(() => {
  const Runtime=window.YSRuntime;
  const arena=document.getElementById('battle-arena');
  if(!arena)return;
  const layer=document.createElement('div');layer.className='cinematic-layer';layer.hidden=true;layer.setAttribute('aria-hidden','true');
  layer.innerHTML='<i class="cinematic-flash"></i><i class="cinematic-slash one"></i><i class="cinematic-slash two"></i><b class="cinematic-word"></b>';
  arena.append(layer);
  const reduced=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const wait=ms=>window.BattlePresentationDirector?.wait?.(ms)||YSPresentationInternals.BattlePolish?.wait?.(ms)||new Promise(resolve=>setTimeout(resolve,ms));
  function sprite(mon){const active=window.StadiumUpgrade?.active?.(mon.side)||[];return document.getElementById(`${mon.side}${active[0]===mon?'':'-partner'}-sprite`);}
  async function animate(node,frames,options){if(!node?.animate||reduced())return;let animation;try{animation=node.animate(frames,{fill:'both',...options});await animation.finished;}catch{}finally{animation?.cancel();}}
  function haptic(kind='critical'){
    try{if(navigator.vibrate)navigator.vibrate(kind==='critical'?[24,18,46]:12);}catch{}
    try{for(const pad of navigator.getGamepads?.()||[]){const actuator=pad?.vibrationActuator||pad?.hapticActuators?.[0];if(actuator?.playEffect)void actuator.playEffect('dual-rumble',{duration:kind==='critical'?120:55,strongMagnitude:kind==='critical'?0.9:0.25,weakMagnitude:kind==='critical'?0.55:0.18}).catch(()=>{});else actuator?.pulse?.(kind==='critical'?0.85:0.2,kind==='critical'?120:55);}}catch{}
  }
  function word(text,tone){const node=layer.querySelector('.cinematic-word');node.textContent=text;node.dataset.tone=tone;}
  function crowd(kind){const stand=document.querySelector('.stadium-broadcast');if(!stand||!Runtime.battle||!['trainer','trainerDuo','cup','elite','arcade'].includes(Runtime.battle.mode))return;const text=stand.querySelector('p');if(text)text.textContent=kind==='critical'?'The crowd erupts at the crushing hit!':'The crowd roars for the clean evasive move!';document.querySelector('.crowd')?.classList.add('cheering');setTimeout(()=>document.querySelector('.crowd')?.classList.remove('cheering'),900);}
  async function dodge(target){
    const node=sprite(target),direction=target.side==='player'?-1:1;word('DODGED!','dodge');layer.hidden=false;layer.dataset.scene='dodge';window.BattlePresentationDirector?.eventSound?.('dodge')||YSPresentationInternals.BattlePolish?.eventSound?.('dodge');crowd('dodge');
    await Promise.all([animate(node,[{transform:'translate(0,0) scale(1)',filter:'blur(0)',opacity:1},{transform:`translate(${34*direction}px,-13px) scale(.94)`,filter:'blur(1px)',opacity:.48,offset:.24},{transform:`translate(${48*direction}px,-17px) scale(1.02)`,filter:'blur(0)',opacity:1,offset:.52},{transform:`translate(${28*direction}px,-8px) scale(1)`,offset:.76},{transform:'translate(0,0) scale(1)'}],{duration:420*(window.BattlePresentationDirector?.scale||YSPresentationInternals.BattlePolish?.scale||1),easing:'cubic-bezier(.2,.75,.2,1)'}),wait(420*(window.BattlePresentationDirector?.scale||YSPresentationInternals.BattlePolish?.scale||1))]);
    node?.style.removeProperty('transform');node?.style.removeProperty('filter');node?.style.removeProperty('opacity');layer.hidden=true;delete layer.dataset.scene;
  }
  async function critical(actor,target,move){
    const side=target.side==='player'?'player':'enemy';word('CRITICAL HIT!','critical');layer.hidden=false;layer.dataset.scene='critical';arena.dataset.cinematic=`critical-${side}`;arena.dataset.focus=`critical-${side}`;haptic('critical');crowd('critical');
    // A tiny freeze before recoil makes the impact readable without extending a turn.
    await wait(58*(window.BattlePresentationDirector?.scale||YSPresentationInternals.BattlePolish?.scale||1));
    await Promise.all([YSPresentationInternals.BattlePolish?.impact(target,'critical'),animate(layer,[{opacity:0},{opacity:1,offset:.12},{opacity:1,offset:.7},{opacity:0}],{duration:500*(window.BattlePresentationDirector?.scale||YSPresentationInternals.BattlePolish?.scale||1),easing:'ease-out'})]);
    layer.hidden=true;delete layer.dataset.scene;delete arena.dataset.cinematic;arena.dataset.focus=target.side==='player'?'hit-player':'hit-enemy';
  }
  function effectiveness(target,factor){
    if(!factor||factor===1)return;arena.dataset.effectiveness=factor>1?'super':'resisted';const node=sprite(target);if(factor>1&&!reduced())void animate(node,[{filter:'saturate(1)'},{filter:'saturate(1.8) drop-shadow(0 0 8px #fff)'},{filter:'saturate(1)'}],{duration:260,easing:'ease-out'});setTimeout(()=>delete arena.dataset.effectiveness,420);
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden){layer.hidden=true;delete arena.dataset.cinematic;delete layer.dataset.scene;}});
  YSPresentationInternals.BattleCinematics=Object.freeze({critical,dodge,effectiveness,haptic});
})();
  return YSPresentationInternals.BattleCinematics;
};

YSPresentationInstallers.BattleFlow = () => {
  if (YSPresentationInternals.BattleFlow) return YSPresentationInternals.BattleFlow;
"use strict";
/* Presentation-only battle director. Mechanics remain in the existing engine. */
(() => {
  const screen=document.getElementById('battle-screen'), message=document.getElementById('message');
  if(!screen||!message)return;
  const announcer=message.closest('.announcer');
  const cues=document.createElement('div');cues.className='battle-cues';cues.setAttribute('aria-live','polite');message.after(cues);
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  function phase(name){screen.dataset.phase=name||'';}
  function clear(){cues.replaceChildren();}
  function cue(text,tone='info',life=720){
    const el=document.createElement('span');el.className='battle-cue';el.dataset.tone=tone;el.textContent=text;cues.append(el);
    if(life)setTimeout(()=>el.remove(),life);return el;
  }
  function line(text){message.textContent=text;}
  async function move(actor,move){clear();phase('anticipation');line(`${actor.name} used ${move.name}!`);await wait(reduced()?60:150);phase('action');}
  async function miss(target){await window.YSFlow?.emitAsync('presentation:miss',{target});phase('reaction');cue('DODGED','miss');line(`${target.name} dodged the attack!`);await wait(reduced()?80:300);}
  async function immune(target){phase('information');cue('NO EFFECT','immune');line(`${target.name} is unaffected.`);await wait(reduced()?80:300);}
  async function result(target,{crit=false,effect=1,hits=1,total=0,substitute=false}={}){
    await window.YSFlow?.emitAsync('presentation:result',{target,result:{crit,effect,hits,total,substitute}});
    phase('information');clear();
    if(crit)cue('CRITICAL HIT','critical',900);
    if(effect>1)cue('SUPER EFFECTIVE','super',900); else if(effect>0&&effect<1)cue('NOT VERY EFFECTIVE','resist',900);
    if(hits>1)cue(`${hits} HITS`,'info',900);
    if(target.hp<=0)cue('KNOCKOUT','ko',1000);
    line(substitute?`${target.name}'s substitute took the hit!`:target.hp<=0?`${target.name} is down!`:`${target.name} took the hit.`);
    await wait(reduced()?90:(crit||effect!==1?430:260));phase('recovery');
  }
  async function status(text){await window.YSFlow?.emitAsync('presentation:status',{text});phase('information');cue('STATUS','status',850);line(text);await wait(reduced()?80:320);phase('recovery');}
  function ready(){clear();phase('ready');}
  YSPresentationInternals.BattleFlow=Object.freeze({phase,clear,cue,line,move,miss,immune,result,status,ready});
})();
  return YSPresentationInternals.BattleFlow;
};

YSPresentationInstallers.CaptureEffects = () => {
  if (YSPresentationInternals.CaptureEffects) return YSPresentationInternals.CaptureEffects;
"use strict";
/* v4.7 — capture choreography translated from supplied FireRed battle_anim_special/pokeball logic. */
(()=>{const Runtime=window.YSRuntime;
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const scale=()=>window.BattlePresentationDirector?.scale||YSPresentationInternals.BattlePolish?.scale||1;
  async function motion(node,frames,duration,easing='ease-in-out'){
    if(!node?.animate||document.hidden){await wait(Math.min(80,duration));return;}
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let a,t;try{a=node.animate(frames,{duration:reduced?80:duration*scale(),fill:'forwards',easing});await Promise.race([a.finished,new Promise(r=>t=setTimeout(r,duration*scale()+250))]);}catch{}finally{clearTimeout(t);a?.cancel();}
  }
  function ballId(id){return ({pokeBall:'pokeBall',greatBall:'greatBall',ultraBall:'ultraBall',masterBall:'masterBall',safariBall:'safariBall',premierBall:'premierBall'})[id]||'pokeBall';}
  async function capture(target,id,caught){
    const ref=Runtime.battle, arena=document.getElementById('battle-arena'), mon=document.getElementById('enemy-sprite');
    if(!arena||!mon)return;
    const ball=document.createElement('div'); ball.className='capture-ball'; ball.dataset.ball=ballId(id); ball.setAttribute('role','status');ball.setAttribute('aria-label',`${id==='masterBall'?'Master Ball':'Poké Ball'} thrown`);arena.append(ball);
    const oldOpacity=mon.style.opacity, oldTransform=mon.style.transform, oldFilter=mon.style.filter;
    try{
      // FireRed: trainer throw -> horizontal arc -> ball opens at target.
      await motion(ball,[{left:'16%',top:'84%',transform:'scale(.7) rotate(-120deg)'},{left:'43%',top:'17%',transform:'scale(1.08) rotate(210deg)',offset:.52},{left:'69%',top:'45%',transform:'scale(1) rotate(520deg)'}],620,'cubic-bezier(.22,.7,.25,1)');
      ball.style.left='69%';ball.style.top='45%';ball.classList.add('ball-open');
      await wait(90*scale());
      // FireRed: target flashes, shrinks and is pulled upward into the open ball.
      await motion(mon,[{filter:'brightness(1)',transform:oldTransform||'scale(1)',opacity:1},{filter:'brightness(4)',transform:'translateY(-8px) scale(.72)',opacity:.9,offset:.35},{filter:'brightness(7)',transform:'translateY(-24px) scale(.05)',opacity:0}],300,'ease-in');
      mon.style.opacity='0';ball.classList.remove('ball-open');
      // FireRed: close -> fall -> diminishing bounces.
      await motion(ball,[{top:'45%',transform:'translateY(0) rotate(0)'},{top:'66%',transform:'translateY(0) rotate(95deg)'}],230,'ease-in');
      ball.style.top='66%';
      for(const [h,d] of [[-25,170],[-14,135],[-7,105]]){
        await motion(ball,[{transform:'translateY(0) rotate(0)'},{transform:`translateY(${h}px) rotate(55deg)`,offset:.5},{transform:'translateY(0) rotate(95deg)'}],d,'ease-out');
      }
      ball.classList.add('ball-landed');
      await wait(280*scale());
      // A successful Gen III capture resolves after three shakes. Failed captures break earlier.
      const shakes=caught?3:(target?.hp/Math.max(1,target?.maxHp||1)<.35?2:1);
      for(let i=0;i<shakes;i++){
        if((Runtime.battle)!==ref)return;
        ball.setAttribute('aria-label',`Capture shake ${i+1}`);
        await motion(ball,[{transform:'translateX(0) rotate(0)'},{transform:'translateX(-6px) rotate(-18deg)',offset:.3},{transform:'translateX(6px) rotate(18deg)',offset:.7},{transform:'translateX(0) rotate(0)'}],360,'ease-in-out');
        await wait(180*scale());
      }
      if(caught){
        ball.classList.add('caught');ball.setAttribute('aria-label','Pokémon caught');
        await motion(ball,[{transform:'scale(1)'},{transform:'scale(1.14)',offset:.35},{transform:'scale(1)'}],360,'ease-out');
        await wait(260*scale());
      }else{
        // Breakout: ball opens and the target expands back onto the field.
        ball.classList.add('ball-open','escaped');ball.setAttribute('aria-label','Pokémon escaped');
        mon.style.opacity='1';
        await motion(mon,[{filter:'brightness(6)',transform:'translateY(-22px) scale(.05)',opacity:.15},{filter:'brightness(2)',transform:'translateY(-8px) scale(.75)',opacity:.8,offset:.55},{filter:oldFilter||'none',transform:oldTransform||'scale(1)',opacity:1}],300,'ease-out');
        await motion(ball,[{transform:'scale(1)',opacity:1},{transform:'scale(1.8)',opacity:0}],220,'ease-out');
      }
    }finally{
      mon.style.opacity=oldOpacity;mon.style.transform=oldTransform;mon.style.filter=oldFilter;ball.remove();
      await window.YSFlow?.emitAsync("presentation:capture", { target, id, caught });
    }
  }
  YSPresentationInternals.CaptureEffects=Object.freeze({capture});
})();
  return YSPresentationInternals.CaptureEffects;
};

YSPresentationInstallers.BattlePresentation();
