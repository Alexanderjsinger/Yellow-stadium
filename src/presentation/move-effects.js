"use strict";

/* C3 move-effects runtime.
 * Recovered presentation generations are implementation details installed at
 * their historical script slots so startup/listener ordering remains stable.
 */

YSPresentationInstallers.AttackEffects = () => {
  if (YSPresentationInternals.AttackEffects) return YSPresentationInternals.AttackEffects;
"use strict";
// Move-specific procedural effects. No downloads, random battle rolls or save changes.
(() => {
  const Runtime=window.YSRuntime;
  const recipes = {
    thunderbolt:['bolt','#ffe34f',3], thunder:['storm','#fff19a',5], thunderShock:['spark','#ffee38',2], thunderWave:['electric-ring','#ffe968',4],
    flamethrower:['flame-stream','#ff6428',26], ember:['embers','#ff982c',7], fireSpin:['fire-vortex','#ff501f',24],
    surf:['wave','#36bfff',6], waterGun:['water-jet','#4bccff',14], scald:['steam-jet','#bcecff',22],
    iceBeam:['ice-ray','#92efff',9], blizzard:['snowstorm','#c7f8ff',32],
    razorLeaf:['leaves','#8ddd49',9], vineWhip:['vine','#58bf4e',2], leechSeed:['seeds','#acd94d',6], sleepPowder:['powder','#b6b8ff',24],
    psychic:['psychic-rings','#fb7cff',5], confusion:['confusion-swirl','#fbc0ff',3], hypnosis:['hypnotic-spiral','#eb98ff',8],
    nightShade:['shade','#9f62d4',7], shadowBall:['shadow-orb','#8d56e7',1], sludgeBomb:['sludge','#b86adc',9], toxic:['toxic-bubbles','#dd62b6',12], confuseRay:['confuse-ray','#ffe894',6],
    quickAttack:['dash','#f2fbff',7], tackle:['impact','#fff6c3',1], bodySlam:['slam','#ffd09a',3], struggle:['struggle','#ff9e96',5],
    slash:['claws','#fff6d6',3], dragonClaw:['dragon-claws','#74fbd0',4], xScissor:['cross','#b1fb6d',2], wingAttack:['wings','#e2faff',2],
    doubleKick:['kicks','#ffc18d',2], brickBreak:['break','#edb079',5], seismicToss:['toss','#ffb26c',1], bite:['jaws','#ded5e9',6],
    earthquake:['quake','#d2b381',7], rockSlide:['rocks','#b3a28d',8], pinMissile:['needles','#ceee84',5], hyperBeam:['hyper-beam','#fff0a7',1],
    rest:['sleep','#bcc8ff',3], sing:['notes','#ffc1ee',5], recover:['heal','#92ffc2',8],
    protect:['shield','#91ffd3',1], substitute:['decoy','#a0dca4',4], reflect:['reflect-wall','#ffbce9',3], lightScreen:['light-wall','#ffe8a0',5],
    swordsDance:['swords','#dce8ff',3], calmMind:['mind-aura','#fba9ff',6], workUp:['power-up','#ffad70',4], agility:['speed','#a9eaff',6], helpingHand:['help','#ffdd99',2],
    spikes:['spikes','#c6b7a4',6], rainDance:['rain','#79caff',35], sunnyDay:['sun','#ffe38c',12], sandstorm:['sand','#dfc68e',42]
  };
  const mix=(a,b,t)=>a+(b-a)*t, clamp=t=>Math.max(0,Math.min(1,t));
  function draw(c,id,t,a,b,w,h) {
    const [kind,color,count]=recipes[id];
    const p=clamp(t/.72), envelope=Math.min(1,t*8,(1-t)*6);
    const x=mix(a.x,b.x,p), y=mix(a.y,b.y,p), unit=Math.max(.55,Math.min(w/650,h/420));
    const r=n=>n*unit;
    c.save(); c.globalAlpha=Math.max(0,envelope); c.strokeStyle=color; c.fillStyle=color; c.lineCap='round'; c.lineJoin='round';
    function line(points,width=3,col=color) { c.strokeStyle=col;c.lineWidth=r(width);c.beginPath();points.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.stroke(); }
    function dot(px,py,size,col=color) { c.fillStyle=col;c.beginPath();c.arc(px,py,r(Math.max(.1,size)),0,Math.PI*2);c.fill(); }
    function ring(px,py,size,width=3,col=color) { c.strokeStyle=col;c.lineWidth=r(width);c.beginPath();c.ellipse(px,py,r(Math.max(1,size)),r(Math.max(1,size*.7)),0,0,Math.PI*2);c.stroke(); }
    function text(s,px,py,size=26) { c.fillStyle=color;c.font=`bold ${r(size)}px sans-serif`;c.textAlign='center';c.fillText(s,px,py); }
    function burst(px,py,n=9,size=32) { for(let i=0;i<n;i++){const v=i*Math.PI*2/n;line([[px+Math.cos(v)*r(size*.3),py+Math.sin(v)*r(size*.3)],[px+Math.cos(v)*r(size),py+Math.sin(v)*r(size)]],3);} }
    function bolt(from,to,n,seed=0) { const points=[];for(let i=0;i<=n;i++){const q=i/n;points.push([mix(from.x,to.x,q)+(i&&i<n?Math.sin(i*13+Math.floor(t*10)+seed)*r(19):0),mix(from.y,to.y,q)]);}line(points,7,color);line(points,2,'#fffdea'); }
    function crystal(px,py,size,angle=0) { c.save();c.translate(px,py);c.rotate(angle);line([[0,-r(size)],[r(size*.5),0],[0,r(size)],[-r(size*.5),0],[0,-r(size)]],2);c.restore(); }
    if(kind==='bolt'||kind==='storm'||kind==='spark') {
      for(let i=0;i<count;i++) { const from=kind==='storm'?{x:b.x+r((i-2)*28),y:0}:a;bolt(from,{x:mix(from.x,b.x,p),y:mix(from.y,b.y,p)},kind==='spark'?5:11,i*4); }
      if(t>.55)burst(b.x,b.y,12,35+10*Math.sin(t*15));
    } else if(kind==='electric-ring') { for(let i=0;i<count;i++)ring(x,y,12+i*10+Math.sin(t*14+i)*4,3); }
    else if(['flame-stream','embers','water-jet','steam-jet'].includes(kind)) {
      for(let i=0;i<count;i++) {const q=(t*1.7+i/count)%1;if(q>p)continue;const spread=kind==='embers'?16:8+q*16;const px=mix(a.x,b.x,q),py=mix(a.y,b.y,q)+Math.sin(i*7+t*12)*r(spread);dot(px,py,kind==='embers'?7:5+q*12,color);dot(px-r(2),py-r(3),kind==='water-jet'?3:3+q*5,kind.includes('flame')||kind==='embers'?'#ffe47b':'#e9fbff');if(kind==='steam-jet')ring(px,py-r(q*30),7+q*8,1,'#ffffff');}
    } else if(kind==='fire-vortex') {for(let i=0;i<count;i++){const angle=i/count*Math.PI*4+t*11;dot(b.x+Math.cos(angle)*r(40),b.y+r(40-i*3)+Math.sin(angle)*r(12),6,'#ff792a');dot(b.x+Math.cos(angle)*r(34),b.y+r(36-i*3),3,'#ffe375');}}
    else if(kind==='wave'){for(let j=0;j<count;j++){const pts=[];for(let i=0;i<=30;i++)pts.push([x+r((i-15)*7),y+r(j*7+Math.sin(i*.4-t*10+j*.3)*17)]);line(pts,j===0?5:9,j===0?'#edffff':color);}}
    else if(kind==='ice-ray'||kind==='hyper-beam'||kind==='confuse-ray') {line([[a.x,a.y],[x,y]],kind==='hyper-beam'?24:kind==='ice-ray'?9:4,color);line([[a.x,a.y],[x,y]],kind==='hyper-beam'?9:2,'#fff');for(let i=0;i<count;i++){const q=(t+i/count)%1;const px=mix(a.x,x,q),py=mix(a.y,y,q);if(kind==='ice-ray')crystal(px,py,10,t*4);else ring(px,py,10+Math.sin(t*8+i)*5,2);}if(t>.6)burst(b.x,b.y,12,45);}
    else if(kind==='snowstorm'||kind==='rocks'||kind==='rain'||kind==='sand') {for(let i=0;i<count;i++){const q=(t*1.3+i*.137)%1,px=kind==='rocks'?b.x+r(Math.sin(i*8)*55):((i*.173)%1)*w;const py=kind==='rocks'?mix(-30,b.y+25,q):q*h;if(kind==='snowstorm')crystal(px+Math.sin(q*5)*30,py,5+(i%4),t*4);else if(kind==='rocks')crystal(px,py,13+i%4,t+i);else if(kind==='rain')line([[px,py],[px-9,py+22]],2);else dot((px+t*300)%w,py,2+i%3);}}
    else if(kind==='leaves'||kind==='seeds'||kind==='needles'||kind==='powder') {for(let i=0;i<count;i++){const q=clamp((t-i*.018)*1.5);const px=mix(a.x,b.x,q),py=mix(a.y,b.y,q)+Math.sin(q*Math.PI)*r((i-count/2)*8);if(kind==='leaves'){c.save();c.translate(px,py);c.rotate(t*8+i);c.fillStyle=color;c.beginPath();c.ellipse(0,0,r(13),r(5),0,0,Math.PI*2);c.fill();c.restore();}else if(kind==='needles')line([[px,py],[px-r(17),py+r(10)]],3);else dot(px,py,kind==='seeds'?5:2+i%3);}if(kind==='seeds'&&t>.6)for(let i=0;i<5;i++)line([[b.x+r(i*10-20),b.y+20],[b.x+r(i*10-25),b.y-r(15)]],3);}
    else if(kind==='vine') {for(let j=0;j<2;j++){const pts=[];for(let i=0;i<=20;i++){const q=i/20;pts.push([mix(a.x,x,q),mix(a.y,y,q)+Math.sin(q*Math.PI*2+t*8+j*Math.PI)*r(22)*Math.sin(q*Math.PI)]);}line(pts,5);}}
    else if(['psychic-rings','confusion-swirl','hypnotic-spiral','mind-aura','electric-ring'].includes(kind)) {const center=kind==='mind-aura'?a:b;for(let j=0;j<count;j++){const size=12+j*9+Math.sin(t*9+j)*6;if(kind==='hypnotic-spiral'){const pts=[];for(let i=0;i<50;i++){const angle=i*.22+t*8;pts.push([center.x+Math.cos(angle)*r(i*.8),center.y+Math.sin(angle)*r(i*.6)]);}line(pts,2);break;}ring(center.x+(kind==='confusion-swirl'?Math.sin(t*8+j)*12:0),center.y,size,2);}}
    else if(kind==='shadow-orb'||kind==='sludge'||kind==='toxic-bubbles'||kind==='shade'){if(kind==='shadow-orb'){dot(x,y,24,'#392051');ring(x,y,29,5);for(let i=0;i<9;i++)dot(x+Math.cos(t*9+i)*r(30),y+Math.sin(t*9+i)*r(22),4);}else for(let i=0;i<count;i++){const q=(t+i/count)%1;dot(kind==='sludge'?mix(a.x,b.x,q):b.x+Math.sin(i*6+t)*r(35),kind==='sludge'?mix(a.y,b.y,q)-Math.sin(q*Math.PI)*r(60):b.y+r(35-q*90),kind==='shade'?14:5+i%6,kind==='shade'?'#4d286b':color);}}
    else if(['shield','reflect-wall','light-wall','decoy'].includes(kind)){const center=a;if(kind==='shield')for(let i=0;i<3;i++)ring(center.x,center.y,40+i*5,2);else if(kind==='decoy'){for(let i=0;i<count;i++)dot(center.x+Math.cos(i*2+t*8)*r(25),center.y+Math.sin(i*2+t*8)*r(20),14);text('SUB',center.x,center.y,18);}else {for(let j=0;j<count;j++){const dx=r((j-count/2)*12);line([[center.x-r(30)+dx,center.y-r(48)],[center.x+r(30)+dx,center.y-r(48)],[center.x+r(30)+dx,center.y+r(48)],[center.x-r(30)+dx,center.y+r(48)],[center.x-r(30)+dx,center.y-r(48)]],2);}}}
    else if(['sleep','notes','heal','swords','power-up','speed','help','sun','spikes'].includes(kind)) {for(let i=0;i<count;i++){const q=(t+i/count)%1,angle=i/count*Math.PI*2+t*2;const center=['notes','help'].includes(kind)?{x,y}:kind==='spikes'?b:a;const px=center.x+Math.cos(angle)*r(35),py=center.y-r(q*65);if(kind==='sleep')text('Z',px,py,17+i*5);else if(kind==='notes')text(i%2?'♫':'♪',px,py);else if(kind==='heal')text('+',px,py,23);else if(kind==='swords')line([[px,py+25],[px,py-22],[px-5,py-12],[px,py-22],[px+5,py-12],[px,py-22],[px,py+8],[px-9,py+8],[px+9,py+8]],3);else if(kind==='power-up')line([[px-5,py+10],[px,py],[px+5,py+10]],4);else if(kind==='speed')line([[px-r(25),py],[px+r(15),py]],2);else if(kind==='help')text('✦',px,py,32);else if(kind==='sun'){ring(w*.5,h*.23,35,4);line([[w*.5+Math.cos(angle)*r(45),h*.23+Math.sin(angle)*r(45)],[w*.5+Math.cos(angle)*r(65),h*.23+Math.sin(angle)*r(65)]],4);}else line([[px-6,b.y+30],[px,b.y+12],[px+6,b.y+30]],3);}}
    else if(kind==='quake'){for(let j=0;j<count;j++){const pts=[];for(let i=0;i<8;i++)pts.push([b.x+r((j-3)*20+i*8),b.y+r(30+i*4+Math.sin(i*8+j)*12*t)]);line(pts,3,'#543d29');}ring(b.x,b.y+25,20+t*100,4);}
    else if(kind==='jaws'){for(let j of [-1,1]){const pts=[];for(let i=0;i<13;i++)pts.push([b.x+r((i-6)*7),b.y+j*r(15+(i%2?12:0)+(1-p)*35)]);line(pts,5);}}
    else if(['claws','dragon-claws','cross','wings','kicks','break','toss','dash','impact','slam','struggle'].includes(kind)) {
      if(kind==='claws'||kind==='dragon-claws')for(let i=0;i<count;i++)line([[b.x-r(35)+i*r(14),b.y-r(40)],[b.x+r(15)+i*r(14)*p,b.y+r(35)*p]],kind==='dragon-claws'?7:4);
      else if(kind==='cross')for(let j of [-1,1])line([[b.x-r(36),b.y+j*r(36)],[b.x+r(36)*p,b.y-j*r(36)*p]],7);
      else if(kind==='wings')for(let j of [-1,1])for(let i=0;i<4;i++)line([[b.x,b.y],[b.x+j*r(15+i*10),b.y-r(35-i*7)]],4);
      else if(kind==='kicks'){for(let i=0;i<2;i++)if(t>i*.35) {ring(b.x+r(i?18:-18),b.y+r(i?14:-14),10+((t-i*.35)*30),5);text('✦',b.x+r(i?18:-18),b.y+r(i?14:-14),25);}}
      else if(kind==='toss'){const q=clamp(t*1.4);ring(b.x,b.y-Math.sin(q*Math.PI)*r(100),17,4);if(t>.7)burst(b.x,b.y,12,50);}
      else if(kind==='break'){for(let i=0;i<count;i++)crystal(b.x+r((i-2)*18*t),b.y+r(t*t*55),10,t*5+i);line([[b.x,b.y-60],[b.x,b.y+10]],7);}
      else {if(kind==='dash')for(let i=0;i<count;i++)line([[mix(a.x,b.x,t)-r(25),mix(a.y,b.y,t)+r(i*5-15)],[x,y+r(i*5-15)]],2);burst(b.x,b.y,kind==='slam'?14:kind==='struggle'?5:8,kind==='slam'?60:30);if(kind==='slam')ring(b.x,b.y+25,30+t*60,4);}
    }
    // Secondary impact layer: illuminated trails, debris and expanding shock rings.
    const element=['bolt','storm','spark','vine','flame-stream','embers','fire-vortex','wave','water-jet','steam-jet','ice-ray','snowstorm','hyper-beam'].includes(kind);
    if(element && t>.32){
      const q=clamp((t-.32)/.68),spread=12+q*64;
      c.globalAlpha=Math.max(0,envelope*(1-q)*.85);
      ring(b.x,b.y+12,spread,kind==='storm'?5:2);
      for(let i=0;i<18;i++){
        const angle=i*2.399,reach=spread*(.45+(i%5)*.16);
        const px=b.x+Math.cos(angle)*r(reach),py=b.y+Math.sin(angle)*r(reach*.8)+r(q*q*22);
        if(['bolt','storm','spark'].includes(kind))line([[b.x,b.y],[px-r(6),py+r(7)],[px+r(3),py],[px,py-r(9)]],i%3===0?2:1,i%2?'#fffbd2':color);
        else if(kind==='vine'){c.save();c.translate(px,py);c.rotate(angle+q*5);c.fillStyle=i%2?'#abf76e':color;c.fillRect(-r(4),-r(2),r(8),r(4));c.restore();}
        else dot(px,py,Math.max(1,(1-q)*(3+i%4)),i%3?'#fff3cf':color);
      }
    }
    c.restore();
  }
  let pending=null;
  function cancel(){ if(pending)pending(); }
  async function play(actor,target,move,outcome='hit') {
    const arena=document.getElementById('battle-arena');
    if(!arena || !arena.getBoundingClientRect || !window.requestAnimationFrame) return;
    const id=Object.keys(MOVES).find(key=>MOVES[key]===move);
    if(!recipes[id])return;
    cancel();
    const box=arena.getBoundingClientRect();
    if(!box.width || !box.height)return;
    const canvas=document.createElement('canvas');canvas.className='attack-canvas';canvas.setAttribute('aria-hidden','true');canvas.dataset.move=id;
    const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(box.width*dpr);canvas.height=Math.round(box.height*dpr);
    let c;try { c=canvas.getContext('2d'); } catch { return; } if(!c)return;
    c.scale(dpr,dpr);arena.append(canvas);
    const current=Runtime.battle, reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const baseDuration=['hyperBeam','thunder','surf','earthquake','fireSpin'].includes(id)?900:680;
    const duration=reduced?260:Math.round(baseDuration*(window.BattlePresentationDirector?.scale||YSPresentationInternals.BattlePolish?.scale||1));
    const point=mon=>{const first=StadiumUpgrade.active(mon.side)[0]===mon;const sprite=document.getElementById(`${mon.side}${first?'':'-partner'}-sprite`);const rect=sprite.getBoundingClientRect(),root=arena.getBoundingClientRect();return{x:rect.left-root.left+rect.width*.5,y:rect.top-root.top+rect.height*.48};};
    await new Promise(resolve=>{
      let frame,watchdog,done=false;
      const finish=()=>{if(done)return;done=true;window.cancelAnimationFrame(frame);clearTimeout(watchdog);canvas.remove();if(pending===finish)pending=null;resolve();};pending=finish;
      const started=performance.now();
      const tick=now=>{try{if(Runtime.battle!==current || document.hidden){finish();return;}const t=clamp((now-started)/duration);c.clearRect(0,0,box.width,box.height);const a=point(actor),b=point(target);if(outcome==='miss'){b.x+=target.side==='enemy'?-65:65;b.y-=40;}draw(c,id,reduced ? .65 : t,a,b,box.width,box.height);if(t>=1)finish();else frame=window.requestAnimationFrame(tick);}catch{finish();}};
      watchdog=setTimeout(finish,duration+250);frame=window.requestAnimationFrame(tick);
    });
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
  YSPresentationInternals.AttackEffects=Object.freeze({recipes,draw,play,cancel});
})();
  return YSPresentationInternals.AttackEffects;
};

YSPresentationInstallers.BattleChoreography = () => {
  if (YSPresentationInternals.BattleChoreography) return YSPresentationInternals.BattleChoreography;
"use strict";
/* v4.4 move choreography layer. Presentation only: never reads/writes damage, accuracy or RNG. */
(() => {
  const arena=document.getElementById('battle-arena');
  if(!arena||!YSPresentationInternals.AttackEffects)return;
  const wait=ms=>window.BattlePresentationDirector?.wait?.(ms)||YSPresentationInternals.BattlePolish?.wait?.(ms)||new Promise(r=>setTimeout(r,ms));
  const scale=()=>window.BattlePresentationDirector?.scale||YSPresentationInternals.BattlePolish?.scale||1;
  const reduced=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const active=mon=>window.StadiumUpgrade?.active?.(mon.side)||[];
  const sprite=mon=>document.getElementById(`${mon.side}${active(mon)[0]===mon?'':'-partner'}-sprite`);
  const moveId=move=>Object.keys(window.MOVES||{}).find(k=>MOVES[k]===move)||'';
  const familyFor=(move,id)=>{
    if(['thunderbolt','thunder','thunderShock','thunderWave'].includes(id)||move.type==='ELECTRIC')return'electric';
    if(move.type==='FIRE')return'fire'; if(move.type==='WATER')return'water'; if(move.type==='ICE')return'ice';
    if(move.type==='GRASS'||move.type==='BUG')return'nature'; if(move.type==='PSYCHIC')return'psychic';
    if(['GHOST','DARK','POISON'].includes(move.type))return'spectral'; if(['ROCK','GROUND'].includes(move.type))return'earth';
    if(move.type==='FLYING')return'wind'; if(move.category==='PHYSICAL')return'contact';
    if(!move.power)return'status'; return'energy';
  };
  const signature={
    tackle:{motion:'lunge',asset:'impact.png',freeze:45},quickAttack:{motion:'dash',asset:'impact.png',freeze:35},bodySlam:{motion:'slam',asset:'slam_hit.png',freeze:70},
    thunderbolt:{motion:'charge',asset:'spark_h.png',scene:'storm',beats:3,freeze:70},thunder:{motion:'charge',asset:'spark_h.png',scene:'storm',beats:3,freeze:95},
    flamethrower:{motion:'charge',asset:'wisp_fire.png',scene:'heat'},ember:{motion:'charge',asset:'wisp_fire.png'},
    surf:{motion:'brace',asset:'splash.png',scene:'flood',freeze:65},waterGun:{motion:'brace',asset:'splash.png'},
    iceBeam:{motion:'charge',asset:'ice_crystals_0.png',scene:'frost',freeze:60},blizzard:{motion:'brace',asset:'ice_crystals_0.png',scene:'frost'},
    psychic:{motion:'focus',scene:'psychic',freeze:60},confusion:{motion:'focus',scene:'psychic'},
    razorLeaf:{motion:'brace',asset:'razor_leaf.png'},rockSlide:{motion:'brace',asset:'rocks.png',freeze:65},earthquake:{motion:'brace',scene:'quake',freeze:80},
    slash:{motion:'lunge',asset:'claw_slash_2.png',freeze:55},dragonClaw:{motion:'lunge',asset:'claw_slash_2.png',freeze:60},wingAttack:{motion:'dash',asset:'air_wave.png'},
    sing:{motion:'focus',asset:'music_notes_2.png'},hyperBeam:{motion:'charge',scene:'beam',freeze:100}
  };
  const defaults={contact:{motion:'lunge',asset:'impact.png',freeze:42},electric:{motion:'charge',asset:'spark_h.png',scene:'storm'},fire:{motion:'charge',asset:'wisp_fire.png'},water:{motion:'brace',asset:'splash.png'},ice:{motion:'charge',asset:'ice_crystals_0.png'},nature:{motion:'brace',asset:'razor_leaf.png'},psychic:{motion:'focus',scene:'psychic'},spectral:{motion:'focus',scene:'spectral'},earth:{motion:'brace',asset:'rocks.png'},wind:{motion:'dash',asset:'air_wave.png'},status:{motion:'focus'},energy:{motion:'charge'}};
  async function anim(node,frames,duration,easing='ease-out'){
    if(!node?.animate||reduced())return;let a;try{a=node.animate(frames,{duration:duration*scale(),easing,fill:'both'});await a.finished;}catch{}finally{a?.cancel();}
  }
  async function motion(mon,kind){
    const n=sprite(mon);if(!n)return;const d=mon.side==='player'?1:-1;
    const frames={
      lunge:[{transform:'translate(0,0) scale(1)'},{transform:`translate(${-9*d}px,2px) scale(.96)`,offset:.35},{transform:`translate(${28*d}px,-3px) scale(1.08)`,offset:.78},{transform:'translate(0,0) scale(1)'}],
      dash:[{transform:'translate(0,0)',filter:'blur(0)',opacity:1},{transform:`translate(${-12*d}px,0)`,offset:.2},{transform:`translate(${62*d}px,-6px)`,filter:'blur(2px)',opacity:.5,offset:.62},{transform:'translate(0,0)',filter:'blur(0)',opacity:1}],
      slam:[{transform:'translateY(0) scale(1)'},{transform:'translateY(-20px) scale(1.08)',offset:.45},{transform:`translate(${18*d}px,8px) scale(1.12)`,offset:.82},{transform:'translate(0,0) scale(1)'}],
      charge:[{transform:'translateY(0) scale(1)',filter:'brightness(1)'},{transform:'translateY(-5px) scale(1.07)',filter:'brightness(1.8) drop-shadow(0 0 10px white)',offset:.72},{transform:'translateY(0) scale(1)',filter:'brightness(1)'}],
      focus:[{transform:'scale(1)',filter:'brightness(1)'},{transform:'scale(1.055)',filter:'brightness(1.45) saturate(1.35)',offset:.5},{transform:'scale(1)',filter:'brightness(1)'}],
      brace:[{transform:'translateY(0) scale(1)'},{transform:'translateY(3px) scale(.98,1.03)',offset:.48},{transform:'translateY(-3px) scale(1.03)',offset:.78},{transform:'translateY(0) scale(1)'}]
    }[kind]||[];
    await anim(n,frames,kind==='dash'?220:kind==='lunge'?190:260,'cubic-bezier(.2,.75,.2,1)');
  }
  function punctuation(target,file){
    if(!file||reduced())return;const n=sprite(target);if(!n)return;const a=document.createElement('img');a.className='classic-fx-punctuation';a.src=assetUrl(`./assets/battle-fx/${file}`);a.alt='';a.setAttribute('aria-hidden','true');n.parentElement.append(a);setTimeout(()=>a.remove(),420*scale());
  }
  async function scene(name,on){
    if(!name)return;if(on){arena.dataset.moveScene=name;await wait((name==='storm'||name==='psychic'?85:45)*scale());}else{await wait(45*scale());delete arena.dataset.moveScene;}
  }
  async function pre(actor,target,move,id,recipe){
    arena.dataset.moveFamily=familyFor(move,id);arena.dataset.moveId=id;
    await scene(recipe.scene,true);
    await motion(actor,recipe.motion);
    if(recipe.beats&&!reduced()){
      for(let i=0;i<recipe.beats;i++){arena.dataset.beat=String(i+1);await wait(48*scale());}
      delete arena.dataset.beat;
    }
  }
  async function post(target,recipe){
    punctuation(target,recipe.asset);
    if(recipe.freeze&&!reduced())await wait(recipe.freeze*scale());
    await scene(recipe.scene,false);
    delete arena.dataset.moveFamily;delete arena.dataset.moveId;delete arena.dataset.beat;
  }
  async function play(next,actor,target,move,outcome='hit'){
    const id=moveId(move),family=familyFor(move,id),recipe={...defaults[family],...(signature[id]||{})};
    try{await pre(actor,target,move,id,recipe);await next(actor,target,move,outcome);if(outcome!=='miss')await post(target,recipe);else await scene(recipe.scene,false);}
    finally{delete arena.dataset.moveFamily;delete arena.dataset.moveId;delete arena.dataset.beat;delete arena.dataset.moveScene;}
  }
  YSPresentationInternals.BattleChoreography=Object.freeze({familyFor,signature,defaults,play});
})();
  return YSPresentationInternals.BattleChoreography;
};

YSPresentationInstallers.MoveSourceEffects = () => {
  if (YSPresentationInternals.MoveSourceEffects) return YSPresentationInternals.MoveSourceEffects;
"use strict";
/* v5.1 battle-effects director: presentation only. Uses source-derived Gen III sprites. */
(()=>{const Runtime=window.YSRuntime;
 const arena=document.getElementById('battle-arena'); if(!arena||!YSPresentationInternals.AttackEffects)return;
 const wait=ms=>window.BattlePresentationDirector?.wait?.(ms)||YSPresentationInternals.BattlePolish?.wait?.(ms)||new Promise(r=>setTimeout(r,ms));
 const scale=()=>window.BattlePresentationDirector?.scale||YSPresentationInternals.BattlePolish?.scale||1, reduced=()=>matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const active=m=>window.StadiumUpgrade?.active?.(m.side)||[];
 const sprite=m=>document.getElementById(`${m.side}${active(m)[0]===m?'':'-partner'}-sprite`);
 const idFor=m=>Object.keys(window.MOVES||{}).find(k=>MOVES[k]===m)||'';
 const A='assets/battle-fx-v51/';
 const spec={
  tackle:{kind:'contact',fx:['impact_2.png','circle_impact.png']},quickAttack:{kind:'dash',fx:['movement_waves.png','impact_2.png']},bodySlam:{kind:'slam',fx:['impact_3.png','flying_dirt.png']},
  slash:{kind:'contact',fx:['slash.png','claw_slash.png']},dragonClaw:{kind:'contact',fx:['claw_slash.png','scratch_2.png']},xScissor:{kind:'contact',fx:['slash.png','slash.png']},
  doubleKick:{kind:'kick',fx:['humanoid_foot.png','impact_2.png']},brickBreak:{kind:'contact',fx:['red_fist.png','punch_impact.png']},seismicToss:{kind:'slam',fx:['monster_foot.png','impact_3.png']},wingAttack:{kind:'dash',fx:['air_wave_2.png','whirlwind_lines.png']},pinMissile:{kind:'projectile',fx:['scratch.png']},
  thunderbolt:{kind:'special',fx:['lightning.png','shock_3.png']},thunderWave:{kind:'status',fx:['shock_3.png']},flamethrower:{kind:'special',fx:['fire.png','fire_plume.png']},fireSpin:{kind:'special',fx:['spinning_fire.png','fire.png']},
  surf:{kind:'special',fx:['water_column.png','water_impact.png']},iceBeam:{kind:'special',fx:['ice_crystals_1.png','ice_spikes.png']},blizzard:{kind:'special',fx:['ice_crystals_1.png','ice_spikes.png']},
  razorLeaf:{kind:'projectile',fx:['razor_leaf.png','leaf.png']},sleepPowder:{kind:'status',fx:['poison_powder.png']},leechSeed:{kind:'projectile',fx:['leaf.png','vine.png']},
  psychic:{kind:'special',fx:['spiral.png','gold_stars.png']},hypnosis:{kind:'status',fx:['spiral.png']},nightShade:{kind:'special',fx:['ghostly_spirit.png','black_smoke.png']},shadowBall:{kind:'special',fx:['ghostly_spirit.png','black_smoke.png']},sludgeBomb:{kind:'special',fx:['poison_bubble.png','poison_powder.png']},
  rockSlide:{kind:'special',fx:['rocks.png','flat_rock.png']},earthquake:{kind:'ground',fx:['flying_dirt.png','dirt_mound.png']},hyperBeam:{kind:'beam',fx:['yellow_star.png','explosion_3.png']},
  sing:{kind:'status',fx:['music_notes.png']},rest:{kind:'self',fx:['snore_z.png','z.png']},recover:{kind:'self',fx:['gold_stars.png']},agility:{kind:'self',fx:['movement_waves.png']}
 };
 function layer(){let n=arena.querySelector('.v51-fx-layer');if(!n){n=document.createElement('div');n.className='v51-fx-layer';arena.append(n);}return n;}
 async function anim(n,frames,duration=330,easing='cubic-bezier(.2,.75,.2,1)'){if(!n?.animate||reduced())return;let a;try{a=n.animate(frames,{duration:duration*scale(),easing,fill:'both'});await a.finished;}catch{}finally{a?.cancel();}}
 function pos(mon){const n=sprite(mon),ar=arena.getBoundingClientRect(),r=n?.getBoundingClientRect();return r?{x:r.left-ar.left+r.width/2,y:r.top-ar.top+r.height/2}:{x:ar.width/2,y:ar.height/2};}
 function fx(file,mon,cls='impact'){const p=pos(mon),n=document.createElement('img');n.src=A+file;n.alt='';n.className=`v51-source-fx ${cls}`;n.style.left=p.x+'px';n.style.top=p.y+'px';layer().append(n);return n;}
 async function pop(file,mon,cls='impact',delay=0){if(delay)await wait(delay*scale());const n=fx(file,mon,cls);await anim(n,[{opacity:0,transform:'translate(-50%,-50%) scale(.2) rotate(-12deg)'},{opacity:1,transform:'translate(-50%,-50%) scale(1.18) rotate(3deg)',offset:.28},{opacity:1,transform:'translate(-50%,-50%) scale(.92)',offset:.7},{opacity:0,transform:'translate(-50%,-50%) scale(1.15)'}],330);n.remove();}
 async function travel(file,actor,target,delay=0){if(delay)await wait(delay*scale());const a=pos(actor),b=pos(target),n=fx(file,actor,'travel');n.style.left=a.x+'px';n.style.top=a.y+'px';await anim(n,[{left:a.x+'px',top:a.y+'px',opacity:.25,transform:'translate(-50%,-50%) scale(.5) rotate(-20deg)'},{opacity:1,offset:.18},{left:b.x+'px',top:b.y+'px',opacity:1,transform:'translate(-50%,-50%) scale(1.1) rotate(25deg)',offset:.86},{left:b.x+'px',top:b.y+'px',opacity:0,transform:'translate(-50%,-50%) scale(1.5) rotate(40deg)'}],390);n.remove();}
 async function physical(actor,target,kind,files){const n=sprite(actor),d=actor.side==='player'?1:-1;if(n){const dist=kind==='dash'?74:kind==='slam'?42:kind==='kick'?48:55;await anim(n,[{transform:'translate(0,0) scale(1)'},{transform:`translate(${-10*d}px,3px) scale(.95)`,offset:.22},{transform:`translate(${dist*d}px,${kind==='slam'?-15:-4}px) scale(1.08)`,offset:.62},{transform:`translate(${dist*.72*d}px,4px) scale(1.02)`,offset:.72},{transform:'translate(0,0) scale(1)'}],kind==='dash'?245:330);}
  await Promise.all(files.map((f,i)=>pop(f,target,i?'secondary':'impact',i*42)));
 }
 async function sourcePass(actor,target,move,outcome){if(outcome==='miss'||outcome==='immune')return;const id=idFor(move),r=spec[id];if(!r)return;arena.dataset.v51Move=id;arena.dataset.v51Kind=r.kind;
  try{if(['contact','dash','slam','kick'].includes(r.kind))await physical(actor,target,r.kind,r.fx);else if(r.kind==='projectile'){for(let i=0;i<r.fx.length;i++)await travel(r.fx[i],actor,target,i*25);}else if(r.kind==='ground'){await Promise.all(r.fx.map((f,i)=>pop(f,target,'ground',i*45)));}else if(r.kind==='self'){await Promise.all(r.fx.map((f,i)=>pop(f,actor,'status',i*80)));}else{await Promise.all(r.fx.map((f,i)=>i?pop(f,target,r.kind,i*55):travel(f,actor,target)));}}
  finally{delete arena.dataset.v51Move;delete arena.dataset.v51Kind;}
 }
 async function play(next,actor,target,move,outcome='hit'){
  const id=idFor(move),r=spec[id],physicalOnly=r&&['contact','dash','slam','kick'].includes(r.kind);
  arena.classList.toggle('v51-hide-procedural',!!physicalOnly);
  try{if(physicalOnly)await sourcePass(actor,target,move,outcome);else await Promise.all([next(actor,target,move,outcome),sourcePass(actor,target,move,outcome)]);}finally{arena.classList.remove('v51-hide-procedural');}
 }
 // Outcome reactions: readable, short, and visually distinct.
 const statusFiles={BRN:['fire.png','fire_plume.png'],PAR:['shock_3.png','lightning.png'],PSN:['poison_bubble.png','poison_powder.png'],TOX:['poison_bubble.png','poison_powder.png'],SLP:['snore_z.png','z.png'],FRZ:['ice_crystals_1.png','ice_spikes.png']};
 function findMon(text){if(!Runtime.battle)return null;const t=String(text).toUpperCase();return [...(Runtime.battle.player||[]),...(Runtime.battle.enemy||[])].find(m=>t.includes(m.name.toUpperCase()))||null;}
 window.YSFlow?.on('presentation:status',async({text})=>{const m=findMon(text),code=m?.status,files=statusFiles[code];if(m&&files)await Promise.all(files.map((f,i)=>pop(f,m,'reaction',i*65)));},20);
 window.YSFlow?.on('presentation:beforeFaint',async({mon})=>{const n=sprite(mon);if(n&&!reduced()){await anim(n,[{filter:'brightness(1)',transform:'translateY(0) scale(1)'},{filter:'grayscale(.7) brightness(.65)',transform:'translateY(5px) scale(.96)',offset:.35},{filter:'grayscale(1) brightness(1.8)',transform:'translateY(15px) scale(.82)',opacity:.75,offset:.62}],260,'ease-in');}},20);
 YSPresentationInternals.MoveSourceEffects=Object.freeze({spec,sourcePass,play});
})();
  return YSPresentationInternals.MoveSourceEffects;
};

YSPresentationInstallers.SignatureEffects = () => {
  if (YSPresentationInternals.SignatureEffects) return YSPresentationInternals.SignatureEffects;
"use strict";
(()=>{
 const arena=document.getElementById('battle-arena'); if(!arena||!YSPresentationInternals.AttackEffects)return;
 const wait=ms=>YSPresentationInternals.BattlePolish?.wait?.(ms)||new Promise(r=>setTimeout(r,ms));
 const active=m=>window.StadiumUpgrade?.active?.(m.side)||[];
 const spr=m=>document.getElementById(`${m.side}${active(m)[0]===m?'':'-partner'}-sprite`);
 const moveId=m=>Object.keys(window.MOVES||{}).find(k=>MOVES[k]===m)||'';
 const pos=m=>{const ar=arena.getBoundingClientRect(),r=spr(m)?.getBoundingClientRect();return r?{x:r.left-ar.left+r.width/2,y:r.top-ar.top+r.height/2}:{x:ar.width/2,y:ar.height/2}};
 const reduced=()=>matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 function layer(){let n=arena.querySelector('.v55-signature-layer');if(!n){n=document.createElement('div');n.className='v55-signature-layer';arena.append(n)}return n}
 async function animate(n,k,d=400,e='ease-out'){if(!n?.animate||reduced())return;const a=n.animate(k,{duration:d,easing:e,fill:'both'});try{await a.finished}catch{}finally{a.cancel()}}
 function el(cls){const n=document.createElement('i');n.className=cls;layer().append(n);return n}
 async function beam(a,b){const p=pos(a),q=pos(b),dx=q.x-p.x,dy=q.y-p.y,n=el('v55-beam');n.style.left=p.x+'px';n.style.top=p.y+'px';n.style.width=Math.hypot(dx,dy)+'px';n.style.rotate=Math.atan2(dy,dx)+'rad';await animate(n,[{opacity:0,scale:'0 1'},{opacity:1,scale:'1 1',offset:.25},{opacity:1,filter:'brightness(2)',offset:.65},{opacity:0}],520);n.remove()}
 async function rings(target,count=3){const p=pos(target);for(let i=0;i<count;i++){const n=el('v55-ring');n.style.left=p.x+'px';n.style.top=p.y+'px';animate(n,[{opacity:0,scale:.2},{opacity:1,scale:1,offset:.25},{opacity:0,scale:2.8}],420);await wait(70)}await wait(260);layer().querySelectorAll('.v55-ring').forEach(n=>n.remove())}
 async function signature(id,a,t){
  if(id==='hyperBeam'){const p=pos(a),c=el('v55-charge');c.style.left=p.x+'px';c.style.top=p.y+'px';await animate(c,[{opacity:0,scale:.3},{opacity:1,scale:1.15},{opacity:.8,scale:.75}],380);c.remove();await beam(a,t);arena.classList.add('v55-heavy-hit');setTimeout(()=>arena.classList.remove('v55-heavy-hit'),360)}
  else if(id==='surf'){const w=el('v55-wave');await animate(w,[{translate:'0 100%',opacity:0},{translate:'0 10%',opacity:1,offset:.35},{translate:'0 -38%',opacity:.9,offset:.72},{translate:'0 -70%',opacity:0}],650,'cubic-bezier(.2,.7,.2,1)');w.remove()}
  else if(id==='psychic'||id==='hypnosis'){const p=pos(t),n=el('v55-psychic');n.style.left=p.x+'px';n.style.top=p.y+'px';await animate(n,[{opacity:0,scale:.3,rotate:'0deg'},{opacity:1,scale:1,rotate:'120deg',offset:.35},{opacity:.8,scale:.72,rotate:'260deg',offset:.7},{opacity:0,scale:1.5,rotate:'420deg'}],620);n.remove()}
  else if(id==='thunderbolt'){await rings(t,3);arena.classList.add('v55-heavy-hit');setTimeout(()=>arena.classList.remove('v55-heavy-hit'),360)}
  else if(id==='earthquake'){const n=el('v55-ground-crack');await animate(n,[{opacity:0,scale:.2},{opacity:1,scale:1.05,offset:.3},{opacity:.9,scale:1,offset:.75},{opacity:0}],600);n.remove();arena.classList.add('v55-heavy-hit');setTimeout(()=>arena.classList.remove('v55-heavy-hit'),360)}
  else if(id==='recover'||id==='rest'){const p=pos(a);for(let i=0;i<5;i++){const n=el('v55-heal');n.textContent=id==='rest'?'✦':'+';n.style.left=(p.x+(i-2)*16)+'px';n.style.top=(p.y+22)+'px';animate(n,[{opacity:0,translate:'0 12px'},{opacity:1,offset:.25},{opacity:0,translate:`${(i-2)*4}px -55px`}],560);await wait(45)}await wait(300);layer().querySelectorAll('.v55-heal').forEach(n=>n.remove())}
  else if(id==='blizzard'||id==='iceBeam'){await rings(t,id==='blizzard'?4:2)}
  else if(id==='fireSpin'){await rings(t,4)}
  else if(id==='seismicToss'||id==='bodySlam'||id==='rockSlide'){arena.classList.add('v55-heavy-hit');setTimeout(()=>arena.classList.remove('v55-heavy-hit'),360)}
 }
 // Signature choreography only. Audio ownership lives in AudioManager.
 window.YSFlow?.on('presentation:result',({result})=>{if(result?.crit){arena.classList.add('v55-critical-hit');setTimeout(()=>arena.classList.remove('v55-critical-hit'),600);}},15);
 // Audit matrix exposed for regression checks: every live move has a visual family and an audio route.
 const matrix={};Object.entries(window.MOVES||{}).forEach(([id,m])=>{const v=YSPresentationInternals.MoveSourceEffects?.spec?.[id];matrix[id]={name:m.name,visual:v?.kind||'core',signature:['hyperBeam','surf','psychic','hypnosis','thunderbolt','earthquake','recover','rest','blizzard','iceBeam','fireSpin','seismicToss','bodySlam','rockSlide'].includes(id),audio:m.type||m.category}});
 YSPresentationInternals.SignatureEffects=Object.freeze({matrix,signature});
})();
  return YSPresentationInternals.SignatureEffects;
};

YSPresentationInstallers.AttackEffects();
