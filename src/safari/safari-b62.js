
(() => {
  const Runtime=window.YSRuntime;
  if (window.__YS_B62_SAFARI__) return;
  window.__YS_B62_SAFARI__ = true;
  const byId = id => document.getElementById(id);
  const W = 10, H = 7;
  const BALLS = ['pokeBall','greatBall','ultraBall','superBall','masterBall'];
  const PASSABLE = new Set(['.','=','s','f','d']);
  const ROOM_NAMES = {
    woodland:['South Gate','Fern Grove','Creek Crossing','Old Clearing'],
    coast:['Shore Gate','Tide Pools','Reed Marsh','Bluewater Point'],
    ridge:['Ash Trail','Crater Edge','Stone Pass','Ember Basin'],
    preserve:['Preserve Gate','Long Grass','Ancient Pond','Hidden Meadow'],
    dark:['Twilight Gate','Haunted Thicket','Blackwater','Ruined Shrine']
  };
  const BASE_LAYOUTS = [
    [
      'TTTT=TTTTT',
      'T..f=....T',
      'T..==.TT.T',
      '=...=....=',
      'T.T.=..f.T',
      'T...===..T',
      'TTTT=TTTTT'
    ],
    [
      'TTTT=TTTTT',
      'T....=...T',
      'T.T..=f..T',
      '=....==..=',
      'T..TT.=..T',
      'T.f...=..T',
      'TTTT=TTTTT'
    ],
    [
      'TTTT=TTTTT',
      'T..f.=...T',
      'T....=TT.T',
      '=..===...=',
      'T..=....fT',
      'T..=.....T',
      'TTTT=TTTTT'
    ],
    [
      'TTTT=TTTTT',
      'T...==...T',
      'T.f.=..T.T',
      '=...===..=',
      'T.T..=...T',
      'T....=f..T',
      'TTTT=TTTTT'
    ]
  ];
  const state = window.YSB62Safari = window.YSB62Safari || {
    zone:'woodland', room:0, player:{x:4,y:5}, previous:{x:4,y:5}, steps:0, visited:{woodland:[true,false,false,false]}, rooms:{}, encounter:null, followerUid:Runtime?.save?.safariFollowerUid||null, message:'Move one tile at a time. Wild Pokémon stay in habitat cover unless an aggressive one spots you.'
  };
  function safe(fn){try{return fn();}catch(error){console.warn('B62 Safari',error);return null;}}
  function currentZoneDef(){return typeof SAFARI_ZONES==='undefined'?null:SAFARI_ZONES.find(z=>z.id===state.zone)||SAFARI_ZONES[0];}
  function unlockedZone(zone){return Runtime?.save && Runtime.save.cupsCompleted>=zone.unlock;}
  function zoneClass(){return `zone-${state.zone}`;}
  function layoutFor(room){
    let rows=BASE_LAYOUTS[room].map(row=>row.split(''));
    if(state.zone==='coast'){
      const water=[[1,4],[1,5],[2,4],[2,5],[4,1],[5,1],[5,2]]; water.forEach(([y,x])=>{if(rows[y][x]==='.')rows[y][x]='~';});
      rows=rows.map(r=>r.map(c=>c==='f'?'s':c));
    } else if(state.zone==='ridge'){
      rows=rows.map(r=>r.map(c=>c==='T'?'#':c==='f'?'#':c));
    } else if(state.zone==='preserve'){
      [[2,1],[2,2],[4,7],[5,7]].forEach(([y,x])=>{if(rows[y][x]==='.')rows[y][x]='~';});
    } else if(state.zone==='dark'){
      rows=rows.map(r=>r.map(c=>c==='.'||c==='f'?'d':c==='T'?'#':c));
      [[1,7],[2,7],[4,2]].forEach(([y,x])=>{if(rows[y][x]==='d')rows[y][x]='~';});
    }
    return rows.map(row=>row.join(''));
  }
  function exitsFor(room){return [
    {e:1,s:2}, {w:0,s:3}, {n:0,e:3}, {n:1,w:2}
  ][room]||{};}
  function exitSymbolAt(x,y){
    const ex=exitsFor(state.room);
    if(y===0&&x===4&&Number.isInteger(ex.n))return '↑';
    if(y===H-1&&x===4&&Number.isInteger(ex.s))return '↓';
    if(x===0&&y===3&&Number.isInteger(ex.w))return '←';
    if(x===W-1&&y===3&&Number.isInteger(ex.e))return '→';
    return '';
  }
  function tileAt(x,y){const rows=layoutFor(state.room);return rows[y]?.[x]||'T';}
  function passable(x,y){return x>=0&&x<W&&y>=0&&y<H&&PASSABLE.has(tileAt(x,y));}
  function tileClass(code){return ({'.':'grass','=':'path','s':'sand','~':'water','T':'tree','#':'rock','f':'flower','d':'dark'})[code]||'grass';}
  function roomKey(){return `${state.zone}:${state.room}`;}
  function poolForZone(){
    if(typeof activeSafariZone!=='undefined') activeSafariZone=state.zone;
    if(typeof safariSpeciesPool==='function') return safariSpeciesPool();
    return Object.keys(SPECIES||{});
  }
  function aggressiveFor(id){const mon=SPECIES[id];return !!mon && (["FIGHTING","DRAGON","POISON","GHOST"].some(t=>mon.types.includes(t)) || mon.stats[1]+mon.stats[5]>185 || Math.random()<.22);}
  function habitatTile(x,y){const code=tileAt(x,y);return code!=="="&&PASSABLE.has(code)&&!exitSymbolAt(x,y);}
  function randomOpenCell(occupied=new Set()){
    const cells=[];
    for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(habitatTile(x,y)&&!(x===state.player.x&&y===state.player.y)&&!occupied.has(`${x},${y}`))cells.push({x,y});
    return cells[Math.floor(Math.random()*cells.length)]||{x:3,y:3};
  }
  function partyInstanceIds(){
    const source=(Runtime.save?.adventurePartyInstanceIds?.length?Runtime.save.adventurePartyInstanceIds:Runtime.save?.activePartyInstanceIds?.length?Runtime.save.activePartyInstanceIds:Runtime.selectedIds.length?Runtime.selectedIds:(Runtime.save?.pokemon||[]).map(mon=>mon.uid));
    return [...new Set(source||[])].filter(uid=>(Runtime.save?.pokemon||[]).some(mon=>mon.uid===uid)).slice(0,6);
  }
  function followerUid(){const ids=partyInstanceIds();if(!ids.length)return null;if(!ids.includes(state.followerUid))state.followerUid=ids[0];return state.followerUid;}
  function followerRecord(){const uid=followerUid();return uid?(Runtime.save?.pokemon||[]).find(mon=>mon.uid===uid)||null:null;}
  function ensureRoom(){
    state.rooms[state.zone] ||= {};
    if(state.rooms[state.zone][state.room]) return state.rooms[state.zone][state.room];
    const pool=poolForZone();
    const uncaught=pool.filter(id=>!(Runtime.save.caughtSpecies||Runtime.save.owned||[]).includes(id));
    const source=uncaught.length>=4?uncaught:pool;
    const picks=typeof shuffle==='function'?shuffle(source).slice(0,4):source.slice(0,4);
    const occupied=new Set();
    const entities=picks.map((id,index)=>{
      const cell=randomOpenCell(occupied);occupied.add(`${cell.x},${cell.y}`);safe(()=>markSeen([id]));
      return {key:`${Date.now()}-${index}-${id}`,id,x:cell.x,y:cell.y,aggressive:aggressiveFor(id),anger:0};
    });
    const room={entities}; state.rooms[state.zone][state.room]=room; safe(()=>Runtime.persist()); return room;
  }
  function mount(){
    const screen=byId('safari-screen');if(!screen)return null;
    let app=byId('safari-b62-app');
    if(app)return app;
    app=document.createElement('section');app.id='safari-b62-app';app.innerHTML=`
      <header class="safari-b62-top">
        <div class="safari-b62-topline"><div><p class="eyebrow">SAFARI EXPERIMENT</p><h1>Explore the habitat.</h1><p>Each habitat is a larger area made of single-screen rooms. Move one tile per step, stalk calm Pokémon, or stay ahead of aggressive ones.</p></div><span class="safari-b62-badge">VERSION B62</span></div>
        <div id="safari-b62-zones" class="safari-b62-zones" aria-label="Safari environments"></div>
      </header>
      <div class="safari-b62-hud"><div class="safari-b62-location"><strong id="safari-b62-roomname"></strong><small id="safari-b62-roommeta"></small></div><div id="safari-b62-roommap" class="safari-b62-roommap" aria-label="Environment rooms"></div></div>
      <div id="safari-b62-world" class="safari-b62-world" aria-label="Top-down Safari room">
        <div id="safari-b62-grid" class="safari-b62-grid"></div>
        <div id="safari-b62-follower" class="safari-b62-follower" aria-label="Following Pokémon" hidden><img alt=""></div>
        <div id="safari-b62-avatar" class="safari-b62-avatar" aria-label="Trainer"><img src="${assetUrl('./assets/journey-v50/player_icon_red.png')}" alt="Trainer"></div>
        <div id="safari-b62-encounter" class="safari-b62-encounter" hidden></div>
      </div>
      <div id="safari-b62-message" class="safari-b62-message" aria-live="polite"></div>
      <div class="safari-b62-controls">
        <div class="safari-b62-dpad" aria-label="Movement controls"><button class="safari-b62-dir up" data-move="0,-1" type="button" aria-label="Move north">↑</button><button class="safari-b62-dir left" data-move="-1,0" type="button" aria-label="Move west">←</button><span class="safari-b62-dpad-core" aria-hidden="true"></span><button class="safari-b62-dir right" data-move="1,0" type="button" aria-label="Move east">→</button><button class="safari-b62-dir down" data-move="0,1" type="button" aria-label="Move south">↓</button></div>
        <div class="safari-b62-actions"><button id="safari-b62-follower-button" type="button" class="secondary-button">FOLLOWER</button><small>Tap a nearby Pokémon to engage it. Your selected partner follows behind you.</small></div>
      </div>
      <div id="safari-b62-follower-picker" class="safari-b62-follower-picker" hidden></div>
      <div class="safari-b62-lower"><span>Wild Pokémon stay in <b>habitat cover</b>.</span><span><b>!</b> appears only when an aggressive Pokémon spots you.</span><span id="safari-b62-ballcount"></span></div>`;
    screen.appendChild(app);
    app.querySelectorAll('[data-move]').forEach(btn=>btn.addEventListener('click',()=>{const [dx,dy]=btn.dataset.move.split(',').map(Number);move(dx,dy);}));
    byId('safari-b62-follower-button').addEventListener('click',openFollowerPicker);
    byId('safari-b62-follower').addEventListener('click',openFollowerPicker);
    return app;
  }
  function renderFollowerPicker(){
    const picker=byId('safari-b62-follower-picker');if(!picker)return;const ids=partyInstanceIds();const active=followerUid();
    picker.innerHTML=`<div class="safari-b62-follower-picker-head"><div><p class="eyebrow">SAFARI PARTNER</p><strong>Choose who follows you.</strong><small>This changes the overworld follower only; it does not reorder your battle party.</small></div><button id="safari-b62-follower-close" type="button" aria-label="Close follower selector">×</button></div><div class="safari-b62-follower-options"></div>`;
    const root=picker.querySelector('.safari-b62-follower-options');
    ids.forEach(uid=>{const record=(Runtime.save.pokemon||[]).find(mon=>mon.uid===uid);if(!record)return;const mon=SPECIES[record.speciesId];const button=document.createElement('button');button.type='button';button.className='safari-b62-follower-option';button.setAttribute('aria-pressed',String(uid===active));button.innerHTML=`<img alt=""><span><strong>${typeof pokemonNameFor==='function'?pokemonNameFor(uid):mon.name}</strong><small>${uid===active?'FOLLOWING NOW':mon.types.join(' · ')}</small></span>`;safe(()=>setSprite(button.querySelector('img'),record.speciesId));button.addEventListener('click',()=>{state.followerUid=uid;safe(()=>Runtime.updateSave(current=>{current.safariFollowerUid=uid;}));picker.hidden=true;message(`${typeof pokemonNameFor==='function'?pokemonNameFor(uid):mon.name} is now following you.`,'good');render();});root.appendChild(button);});
    picker.querySelector('#safari-b62-follower-close')?.addEventListener('click',()=>{picker.hidden=true;updateControls();});
  }
  function openFollowerPicker(){if(state.encounter)return;const picker=byId('safari-b62-follower-picker');if(!picker)return;renderFollowerPicker();picker.hidden=false;updateControls();}
  function renderFollower(){const follower=byId('safari-b62-follower');if(!follower)return;const record=followerRecord();if(!record){follower.hidden=true;return;}const img=follower.querySelector('img');follower.hidden=false;safe(()=>setSprite(img,record.speciesId));const px=state.previous?.x,py=state.previous?.y;if(Number.isInteger(px)&&Number.isInteger(py)&&passable(px,py)&&(px!==state.player.x||py!==state.player.y))position(follower,px,py);else position(follower,state.player.x,state.player.y);follower.setAttribute('aria-label',`${typeof pokemonNameFor==='function'?pokemonNameFor(record.uid):SPECIES[record.speciesId].name} following`);const button=byId('safari-b62-follower-button');if(button)button.textContent=`FOLLOWER · ${typeof pokemonNameFor==='function'?pokemonNameFor(record.uid):SPECIES[record.speciesId].name}`;}
  function renderZones(){
    const root=byId('safari-b62-zones');if(!root)return;root.replaceChildren();
    (SAFARI_ZONES||[]).forEach(zone=>{const btn=document.createElement('button');btn.type='button';btn.className='safari-b62-zone';btn.disabled=!unlockedZone(zone);btn.setAttribute('aria-pressed',String(zone.id===state.zone));btn.textContent=btn.disabled?`${zone.name} · ${zone.unlock} badges`:zone.name;btn.addEventListener('click',()=>switchZone(zone.id));root.appendChild(btn);});
  }
  function switchZone(id){const zone=SAFARI_ZONES.find(z=>z.id===id);if(!zone||!unlockedZone(zone))return;state.zone=id;if(typeof activeSafariZone!=='undefined')activeSafariZone=id;state.room=0;state.player={x:4,y:5};state.previous={...state.player};state.visited[id] ||= [true,false,false,false];state.visited[id][0]=true;state.encounter=null;message(`Entered ${zone.name}. Find a path through the four-room habitat.`);render();}
  function renderRoomMap(){const root=byId('safari-b62-roommap');if(!root)return;root.replaceChildren();for(let i=0;i<4;i++){const el=document.createElement('i');el.textContent=i+1;if(state.visited[state.zone]?.[i])el.classList.add('visited');if(i===state.room)el.classList.add('current');root.appendChild(el);}}
  function position(node,x,y){node.style.left=`${((x+.5)/W)*100}%`;node.style.top=`${((y+.5)/H)*100}%`;}
  function renderGrid(){
    const grid=byId('safari-b62-grid');const world=byId('safari-b62-world');if(!grid||!world)return;grid.replaceChildren();world.querySelectorAll('.safari-b62-mon').forEach(n=>n.remove());
    const rows=layoutFor(state.room);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const code=rows[y][x];const tile=document.createElement('button');tile.type='button';tile.className=`safari-b62-tile ${tileClass(code)}${PASSABLE.has(code)?' passable':''}`;tile.disabled=!PASSABLE.has(code);const exit=exitSymbolAt(x,y);if(exit){tile.classList.add('exit');tile.dataset.exit=exit;}tile.dataset.x=x;tile.dataset.y=y;if(PASSABLE.has(code))tile.addEventListener('click',()=>{const dist=Math.abs(state.player.x-x)+Math.abs(state.player.y-y);if(dist===1)move(x-state.player.x,y-state.player.y);});grid.appendChild(tile);}
    const room=ensureRoom();room.entities.forEach(entity=>{const btn=document.createElement('button');btn.type='button';btn.className=`safari-b62-mon${entity.aggressive?' aggressive':''}${entity.chasing?' chasing':''}`;btn.dataset.entity=entity.key;btn.setAttribute('aria-label',`${SPECIES[entity.id].name}${entity.chasing?' charging':''}`);btn.innerHTML=`<img alt="${SPECIES[entity.id].name}"><span>${SPECIES[entity.id].name}</span>`;safe(()=>setSprite(btn.querySelector('img'),entity.id));const dist=Math.abs(state.player.x-entity.x)+Math.abs(state.player.y-entity.y);if(dist<=1)btn.classList.add('nearby');btn.addEventListener('click',()=>{if(dist<=1)openEncounter(entity,'approach');else message(`${SPECIES[entity.id].name} is too far away. Move closer.`);});position(btn,entity.x,entity.y);world.appendChild(btn);});
    renderFollower();
    position(byId('safari-b62-avatar'),state.player.x,state.player.y);
  }
  function canExit(dx,dy){const ex=exitsFor(state.room);if(dx===0&&dy<0&&state.player.y===0&&state.player.x===4&&Number.isInteger(ex.n))return ['n',ex.n];if(dx===0&&dy>0&&state.player.y===H-1&&state.player.x===4&&Number.isInteger(ex.s))return ['s',ex.s];if(dx<0&&dy===0&&state.player.x===0&&state.player.y===3&&Number.isInteger(ex.w))return ['w',ex.w];if(dx>0&&dy===0&&state.player.x===W-1&&state.player.y===3&&Number.isInteger(ex.e))return ['e',ex.e];return null;}
  function canStep(dx,dy){if(state.encounter)return false;const exit=canExit(dx,dy);if(exit)return true;return passable(state.player.x+dx,state.player.y+dy);}
  function updateControls(){const pickerOpen=byId('safari-b62-follower-picker')&&!byId('safari-b62-follower-picker').hidden;document.querySelectorAll('#safari-b62-app [data-move]').forEach(btn=>{const [dx,dy]=btn.dataset.move.split(',').map(Number);btn.disabled=pickerOpen||!canStep(dx,dy);});const followerButton=byId('safari-b62-follower-button');if(followerButton)followerButton.disabled=!!state.encounter;}
  function transition(direction,next){state.room=next;state.visited[state.zone]||=[false,false,false,false];state.visited[state.zone][next]=true;if(direction==='n')state.player={x:4,y:H-1};if(direction==='s')state.player={x:4,y:0};if(direction==='w')state.player={x:W-1,y:3};if(direction==='e')state.player={x:0,y:3};state.previous={...state.player};message(`Entered ${ROOM_NAMES[state.zone]?.[next]||'a new room'}.`);render();}
  function occupied(entity,x,y){return entity.x===x&&entity.y===y;}
  function attemptEntityMove(entity,dx,dy,entities,allowPath=false){const nx=entity.x+dx,ny=entity.y+dy;if(!passable(nx,ny))return false;if(!allowPath&&!habitatTile(nx,ny))return false;if(exitSymbolAt(nx,ny))return false;if(entities.some(other=>other!==entity&&occupied(other,nx,ny)))return false;entity.x=nx;entity.y=ny;return true;}
  function clearSight(entity){const dx=state.player.x-entity.x,dy=state.player.y-entity.y,dist=Math.abs(dx)+Math.abs(dy);if(dist>4)return false;if(dist<=2)return true;if(dx!==0&&dy!==0)return false;const sx=Math.sign(dx),sy=Math.sign(dy);let x=entity.x+sx,y=entity.y+sy;while(x!==state.player.x||y!==state.player.y){if(!passable(x,y))return false;x+=sx;y+=sy;}return true;}
  function moveEntities(){const entities=ensureRoom().entities;for(const e of entities){if(e.aggressive&&clearSight(e)){e.chasing=true;e.chaseTurns=3;}else if(e.chasing){e.chaseTurns=(e.chaseTurns||1)-1;if(e.chaseTurns<=0)e.chasing=false;}if(e.chasing){const options=[];const dx=Math.sign(state.player.x-e.x),dy=Math.sign(state.player.y-e.y);if(Math.abs(state.player.x-e.x)>=Math.abs(state.player.y-e.y)){if(dx)options.push([dx,0]);if(dy)options.push([0,dy]);}else{if(dy)options.push([0,dy]);if(dx)options.push([dx,0]);}for(const [mx,my] of options)if(attemptEntityMove(e,mx,my,entities,true))break;}else if(Math.random()<.28){const dirs=typeof shuffle==='function'?shuffle([[1,0],[-1,0],[0,1],[0,-1]]):[[1,0],[-1,0],[0,1],[0,-1]];for(const [mx,my] of dirs)if(attemptEntityMove(e,mx,my,entities,false))break;}}
  }
  function entityAtPlayer(){return ensureRoom().entities.find(e=>e.x===state.player.x&&e.y===state.player.y)||null;}
  function nearbyEntity(){return ensureRoom().entities.map(e=>({e,d:Math.abs(state.player.x-e.x)+Math.abs(state.player.y-e.y)})).filter(x=>x.d===1).sort((a,b)=>Number(b.e.aggressive)-Number(a.e.aggressive))[0]?.e||null;}
  function threatMessage(){const threats=ensureRoom().entities.filter(e=>e.chasing).map(e=>({e,d:Math.abs(state.player.x-e.x)+Math.abs(state.player.y-e.y)})).sort((a,b)=>a.d-b.d);if(threats[0]){const name=SPECIES[threats[0].e.id].name;message(`! ${name} spotted you and darted out of the grass. Keep moving or prepare to evade.`, 'alert');return;}const near=nearbyEntity();if(near)message(`${SPECIES[near.id].name} is beside you. Tap it to approach.`);else message('Follow the path or step into habitat cover to approach wild Pokémon.');}
  function move(dx,dy){if(state.encounter)return;const exit=canExit(dx,dy);if(exit){transition(exit[0],exit[1]);return;}const nx=state.player.x+dx,ny=state.player.y+dy;if(!passable(nx,ny)){message('That terrain blocks the path.');return;}state.previous={...state.player};state.player={x:nx,y:ny};state.steps++;moveEntities();const collision=entityAtPlayer();if(collision){render();setTimeout(()=>openEncounter(collision,collision.aggressive?'charge':'contact'),80);return;}if(state.steps%10===0&&ensureRoom().entities.length<3)spawnOne();render();threatMessage();}
  function spawnOne(){const room=ensureRoom();const pool=poolForZone();const existing=new Set(room.entities.map(e=>e.id));const candidates=pool.filter(id=>!existing.has(id));if(!candidates.length)return;const id=candidates[Math.floor(Math.random()*candidates.length)];const occupiedSet=new Set(room.entities.map(e=>`${e.x},${e.y}`));const cell=randomOpenCell(occupiedSet);room.entities.push({key:`${Date.now()}-${id}`,id,x:cell.x,y:cell.y,aggressive:aggressiveFor(id),anger:0});safe(()=>markSeen([id]));}
  function message(text,tone=''){state.message=text;const el=byId('safari-b62-message');if(el){el.textContent=text;el.className=`safari-b62-message${tone?' '+tone:''}`;}}
  function itemArtMarkup(id){const sheets={pokeBall:'poke',greatBall:'great',ultraBall:'ultra',masterBall:'master'};if(sheets[id])return `<span class="safari-gba-ball-sheet ${id}" style="background-image:url('${assetUrl(`./assets/balls/${sheets[id]}.png`)}')" aria-hidden="true"></span>`;const itemPath=id==='superBall'?'super_ball.png':'poke_ball.png';return `<img class="safari-gba-ball-item" src="${assetUrl(`./assets/items/${itemPath}`)}" alt="" aria-hidden="true">`;}
  function encounterLevel(){return typeof safariEncounterLevel==='function'?safariEncounterLevel():Math.max(5,(Runtime.save.cupsCompleted||0)*7+5);}
  function directCatchChance(entity,ballId){const item=ITEMS[ballId]||{ball:1};const rate=SPECIES[entity.id]?.catchRate||45;let chance=(rate/255)*.62*(item.ball||1);chance*=entity.aggressive?.82:1.18;if(PRE_EVOLUTION?.[entity.id])chance*=.68;return Math.max(.08,Math.min(ballId==='masterBall'?1:.9,chance));}
  function openEncounter(entity,source){if(!entity||state.encounter)return;if(!Runtime.selectedIds.length){message('Add at least one Pokémon to your Party before entering the Safari.','alert');return;}state.encounter={key:entity.key,source};renderEncounter();updateControls();}
  function closeEncounter(){state.encounter=null;const layer=byId('safari-b62-encounter');if(layer)layer.hidden=true;updateControls();render();threatMessage();}
  function renderEncounter(){const layer=byId('safari-b62-encounter');if(!layer||!state.encounter)return;const entity=ensureRoom().entities.find(e=>e.key===state.encounter.key);if(!entity){state.encounter=null;layer.hidden=true;return;}const mon=SPECIES[entity.id];const evoOnly=!!PRE_EVOLUTION?.[entity.id];layer.hidden=false;layer.innerHTML=`<div class="safari-b62-encounter-card"><img id="safari-b62-encounter-sprite" alt="${mon.name}"><div class="safari-b62-encounter-copy"><span class="safari-b62-temper${entity.aggressive?' aggressive':''}">${entity.aggressive?'AGGRESSIVE':'CALM'} · Lv ${encounterLevel()}</span><h2>${mon.name}</h2><p id="safari-b62-encounter-note">${evoOnly?`This evolved form is observation-only in Safari. Catch ${SPECIES[PRE_EVOLUTION[entity.id]]?.name||'its earlier form'} and evolve it.`:entity.aggressive?'It has closed the distance. Throw a ball now or evade back one tile.':'You reached it quietly. Choose a ball or back away.'}</p></div><div class="safari-b62-balls">${BALLS.map(id=>`<button class="safari-b62-ball" data-ball="${id}" type="button" ${(Runtime.save.inventory?.[id]||0)<=0||evoOnly?'disabled':''}>${itemArtMarkup(id)}<span>${ITEMS[id]?.name||id}</span><b>×${Runtime.save.inventory?.[id]||0}</b></button>`).join('')}</div><div class="safari-b62-encounter-actions"><button id="safari-b62-observe" class="secondary-button" type="button">${entity.aggressive?'EVADE':'BACK AWAY'}</button><button id="safari-b62-battle" class="secondary-button" type="button">BATTLE INSTEAD</button></div></div>`;safe(()=>setSprite(byId('safari-b62-encounter-sprite'),entity.id));layer.querySelectorAll('[data-ball]').forEach(btn=>btn.addEventListener('click',()=>throwBall(entity,btn.dataset.ball)));byId('safari-b62-observe').addEventListener('click',()=>evade(entity));byId('safari-b62-battle').addEventListener('click',()=>{removeEntity(entity.key);state.encounter=null;safe(()=>startSafariEncounter(entity.id));});}
  async function throwBall(entity,ballId){if((Runtime.save.inventory?.[ballId]||0)<=0)return;safe(()=>Runtime.updateSave(current=>{current.inventory[ballId]-=1;}));const layer=byId('safari-b62-encounter');const fx=document.createElement('div');fx.className='safari-b62-throwfx';fx.innerHTML=itemArtMarkup(ballId);layer.appendChild(fx);const note=byId('safari-b62-encounter-note');if(note)note.textContent=`You threw a ${ITEMS[ballId].name}…`;await new Promise(r=>setTimeout(r,650));const success=Math.random()<directCatchChance(entity,ballId);const flash=document.createElement('div');flash.className='safari-b62-catchflash';layer.appendChild(flash);setTimeout(()=>{fx.remove();flash.remove();},580);if(success){const level=encounterLevel();const isNew=safe(()=>addOwned(entity.id,level));const caughtRecord=Runtime.save.pokemon?.[Runtime.save.pokemon.length-1]||null;const autoParty=window.PartyAutoFill?.assignCaught?.(caughtRecord)===true;safe(()=>Runtime.persist());removeEntity(entity.key);window.YSFlow?.emit('safari:capture',{id:entity.id,name:SPECIES[entity.id].name,ballId,autoParty,isNew});if(note)note.textContent=`Click! ${SPECIES[entity.id].name} was caught${autoParty?' and joined your party':isNew?' and was added to your collection':' and was sent to your Box'}.`;message(`${SPECIES[entity.id].name} caught${autoParty?' · PARTY SLOT FILLED':''}!`,'good');await new Promise(r=>setTimeout(r,850));closeEncounter();return;}entity.anger=(entity.anger||0)+1;if(note)note.textContent=`It broke free! ${entity.aggressive?'It is still pressing toward you.':'It may flee if you hesitate.'}`;if(!entity.aggressive&&Math.random()<.35){window.YSFlow?.emit('safari:escape',{id:entity.id,name:SPECIES[entity.id].name,ballId});removeEntity(entity.key);message(`${SPECIES[entity.id].name} broke free and disappeared into the habitat.`,'alert');await new Promise(r=>setTimeout(r,650));closeEncounter();return;}renderBallCounts();renderEncounter();}
  function evade(entity){state.player={...state.previous};entity.anger=Math.max(0,(entity.anger||0)-1);state.encounter=null;byId('safari-b62-encounter').hidden=true;window.YSFlow?.emit('safari:evade',{id:entity.id,name:SPECIES[entity.id].name,aggressive:entity.aggressive});message(entity.aggressive?`You slipped away from ${SPECIES[entity.id].name}. Keep moving.`:`You backed away quietly.`);render();}
  function removeEntity(key){const room=ensureRoom();room.entities=room.entities.filter(e=>e.key!==key);}
  function interactNearby(){if(state.encounter)return;const near=nearbyEntity();if(near)openEncounter(near,'look');else threatMessage();}
  function renderBallCounts(){const total=BALLS.reduce((sum,id)=>sum+(Runtime.save.inventory?.[id]||0),0);const el=byId('safari-b62-ballcount');if(el)el.innerHTML=`BALLS <b>×${total}</b>`;}
  function refineSafariHierarchy(){const screen=byId('safari-screen'),app=byId('safari-b62-app');if(!screen||!app)return;const gear=screen.querySelector('.trainer-gear[data-screen="safari-screen"]');if(!gear)return;if(app.nextElementSibling!==gear)app.after(gear);if(gear.dataset.open!=='false')gear.dataset.open='false';const panel=gear.querySelector('.trainer-gear-panel');if(panel&&!panel.hidden)panel.hidden=true;gear.querySelectorAll('[data-gear-view]').forEach(btn=>{if(btn.getAttribute('aria-selected')!=='false')btn.setAttribute('aria-selected','false');});}
  function render(){const app=mount();if(!app)return;document.body.classList.add('safari-b62-active');refineSafariHierarchy();const zone=currentZoneDef();const names=ROOM_NAMES[state.zone]||ROOM_NAMES.woodland;byId('safari-b62-roomname').textContent=`${zone?.name||'Safari'} · ${names[state.room]}`;byId('safari-b62-roommeta').textContent=`ROOM ${state.room+1}/4 · STEP ${state.steps} · ${zone?.min||1}–${zone?.max||20} WILD LEVELS`;renderZones();renderRoomMap();renderGrid();renderBallCounts();message(state.message||'Explore the habitat.');if(state.encounter)renderEncounter();else byId('safari-b62-encounter').hidden=true;if(!byId('safari-b62-follower-picker')?.hidden)renderFollowerPicker();updateControls();}
  function showB62(){const tutorialFieldDemo=Runtime?.save?.introStage==='field-demo'&&Runtime.save.introComplete!==true;if((!Runtime?.save?.onboardingComplete&&!tutorialFieldDemo)||Runtime.battle)return;safe(()=>setTeamSize(6));safe(()=>hideMainScreens());const screen=byId('safari-screen');if(!screen)return;screen.hidden=false;safe(()=>setActiveNav('safari-tab'));document.body.classList.add('safari-b62-active');if(typeof activeSafariZone!=='undefined')activeSafariZone=state.zone;if(!unlockedZone(currentZoneDef()))switchZone((SAFARI_ZONES.find(unlockedZone)||SAFARI_ZONES[0]).id);ensureRoom();render();window.scrollTo({top:0,behavior:'smooth'});}
  window.YSFlow?.on('screens:hidden',()=>document.body.classList.remove('safari-b62-active'),30);
  const controller=Object.freeze({open:showB62,render,move,interact:interactNearby,openEncounter,switchZone,chooseFollower:openFollowerPicker,state});
  window.SafariController=controller;
  window.YSB62Safari=controller;
  document.addEventListener('keydown',event=>{if(byId('safari-screen')?.hidden||state.encounter||!byId('safari-b62-follower-picker')?.hidden||/INPUT|TEXTAREA|SELECT/.test(event.target?.tagName||''))return;const map={ArrowUp:[0,-1],w:[0,-1],W:[0,-1],ArrowDown:[0,1],s:[0,1],S:[0,1],ArrowLeft:[-1,0],a:[-1,0],A:[-1,0],ArrowRight:[1,0],d:[1,0],D:[1,0]};const dir=map[event.key];if(dir){event.preventDefault();move(...dir);}});
})();

