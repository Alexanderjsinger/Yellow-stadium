
"use strict";
(() => {
  const overlay = document.createElement("div");
  overlay.id = "joke-intro"; overlay.className = "joke-intro"; overlay.hidden = true;
  overlay.innerHTML = `<section class="intro-cinematic" aria-label="Yellow Stadium opening cinematic">
      <img class="cinema-map" alt="Kanto region from above"><img class="cinema-stadium" alt="Kanto Stadium beneath the evening lights">
      <div class="cinema-vignette"></div><div class="cinema-title"><span>A NEW TRAINER ARRIVES</span><h1>YELLOW<br>STADIUM</h1><p>The road to Kanto begins.</p><button id="cinema-start" class="primary-button" type="button">BEGIN</button></div>
      <button id="cinema-skip" class="cinema-skip" type="button">SKIP CINEMATIC</button>
    </section>
    <section class="joke-guide-panel" aria-label="Professor Joke intro and tour" hidden>
      <header><span class="guide-progress">PROFESSOR JOKE · TRAINER ORIENTATION</span><button id="guide-close" type="button" aria-label="Close guide">×</button></header>
      <div class="guide-stage"><div class="guide-professor"><img alt="Professor Joke"><strong>PROFESSOR JOKE</strong></div><div id="guide-content" class="guide-content"></div></div>
      <nav id="guide-tour-tabs" class="guide-tour-tabs" aria-label="Game tour" hidden></nav>
      <footer><div id="guide-actions" class="guide-actions"></div></footer>
    </section>`;
  document.body.append(overlay);

  const cinema = overlay.querySelector(".intro-cinematic"), panel = overlay.querySelector(".joke-guide-panel");
  const content = overlay.querySelector("#guide-content"), actions = overlay.querySelector("#guide-actions"), tourTabs = overlay.querySelector("#guide-tour-tabs");
  const closeButton = overlay.querySelector("#guide-close");

  let replay = false, pendingName = null, starterChoice = null;
  let pendingAppearance = null;
  const firstName = () => save.playerProfile?.first || "Trainer";
  const fullName = profile => [profile.first, profile.middle ? `${profile.middle}.` : "", profile.last].filter(Boolean).join(" ");
  const button = (label, run, primary = false) => {
    const node = document.createElement("button"); node.type = "button"; node.textContent = label; node.className = primary ? "primary-button" : "guide-choice"; node.onclick = run; actions.append(node); return node;
  };
  function persistStage(stage) { save.introStage = stage; writeSave(); }
  function showPanel() {
    cinema.hidden = true; panel.hidden = false; overlay.dataset.phase = "guide"; actions.replaceChildren(); tourTabs.hidden = true;
    AssetDemand.assignImage(panel.querySelector(".guide-professor img"), "./assets/trainers/prof.oak.png", { priority: "high" });
    AssetDemand.preloadGroup("intro-ui", "low");
  }
  function dialogue(speaker, text, next, label = "CONTINUE") {
    showPanel(); content.className = `guide-content ${speaker === "PLAYER" ? "player-line" : ""}`; content.replaceChildren();
    const name = document.createElement("span"); name.className = "dialogue-speaker"; name.textContent = speaker;
    const copy = document.createElement("p"); copy.textContent = text; content.append(name, copy);
    actions.replaceChildren(); if (next) button(label, next, true);
  }
  function startCinematic() {
    AssetDemand.assignImage(overlay.querySelector(".cinema-map"), "./assets/maps/kanto.png", { priority: "high" });
    AssetDemand.assignImage(overlay.querySelector(".cinema-stadium"), "./assets/stadium/arena.png", { priority: "high" });
    replay = false; closeButton.hidden = true; overlay.hidden = false; cinema.hidden = false; panel.hidden = true; overlay.dataset.phase = "cinematic";
    document.body.classList.add("intro-open"); cinema.classList.remove("playing"); void cinema.offsetWidth; cinema.classList.add("playing");
    persistStage("cinematic");
  }
  function startStory() {
    persistStage("name");
    dialogue("PROFESSOR JOKE", "Hello there, traveler! My name is Professor Joke. And you are…?", nameForm, "ENTER YOUR NAME");
  }
  function nameForm() {
    showPanel(); content.className = "guide-content name-step"; content.innerHTML = `<span class="dialogue-speaker">TRAINER REGISTRATION</span><h2>Enter your name.</h2>
      <form id="trainer-name-form"><label>FIRST<input name="first" maxlength="18" required></label><label>MIDDLE INITIAL<input name="middle" maxlength="1"></label><label>LAST<input name="last" maxlength="22" required></label></form>`;
    const fields = content.querySelector("form").elements;
    fields.first.value = save.playerProfile?.first || "Butt"; fields.middle.value = save.playerProfile?.middle || "A"; fields.last.value = save.playerProfile?.last || "Hole";
    actions.replaceChildren(); button("CONTINUE", () => {
      const form = content.querySelector("form"), data = new FormData(form);
      pendingName = { first: String(data.get("first") || "Butt").trim().slice(0,18) || "Butt", middle: String(data.get("middle") || "A").trim().slice(0,1).toUpperCase(), last: String(data.get("last") || "Hole").trim().slice(0,22) || "Hole" };
      confirmName();
    }, true);
  }
  function confirmName() {
    dialogue("PROFESSOR JOKE", `So your name is ${fullName(pendingName)}?`, null);
    button("YES, THAT’S ME", acceptName, true); button("LET ME FIX THAT", nameForm);
  }
  function acceptName() {
    save.playerProfile = {...save.playerProfile, ...pendingName}; writeSave(); renderRecord();
    persistStage("appearance");
    dialogue("PROFESSOR JOKE", "Forgive me, I spent yesterday afternoon staring into the sun and I forgot to wear sunscreen, so I’m having a little trouble seeing what you look like. How would you describe yourself?", appearanceMode, "DESCRIBE YOURSELF");
  }

  function appearanceMode() {
    showPanel(); content.className = "guide-content appearance-step";
    content.innerHTML = `<span class="dialogue-speaker">TRAINER APPEARANCE</span><h2>How would you describe yourself?</h2><div class="appearance-mode-grid"></div><p class="appearance-note">This only changes your player model. Your adventure, starter choices and battle rules stay the same.</p>`;
    const grid=content.querySelector(".appearance-mode-grid"); actions.replaceChildren();
    [
      ["boy","BOY","Choose a trainer style from Generations I–V."],
      ["girl","GIRL","Choose a trainer style from Generations I–V."],
      ["pokemon","POKÉMON","Look, I said my vision was bad. Commit to the bit."],
    ].forEach(([id,label,copy])=>{
      const card=document.createElement("button"); card.type="button"; card.className="appearance-mode-card"; card.innerHTML=`<strong>${label}</strong><small>${copy}</small>`;
      card.onclick=()=>id==="pokemon"?pokemonAppearance():generationSelect(id); grid.append(card);
    });
  }

  function generationSelect(gender) {
    showPanel(); content.className="guide-content appearance-step"; content.innerHTML=`<span class="dialogue-speaker">${gender.toUpperCase()} · TRAINER MODEL</span><h2>Pick a generation.</h2><div class="generation-grid"></div>`;
    const grid=content.querySelector(".generation-grid"); actions.replaceChildren();
    for(let generation=1;generation<=5;generation++){
      const card=document.createElement("button"); card.type="button"; card.className="generation-card";
      card.innerHTML=`<img alt=""><strong>GEN ${["","I","II","III","IV","V"][generation]}</strong><small>${gender.toUpperCase()}</small>`;
      const img=card.querySelector("img"); img.src=window.PlayerAvatar?.trainerAsset?.(gender,generation)||assetUrl("./assets/journey-v50/player_icon_red.png");
      card.onclick=()=>paletteSelect({kind:"trainer",gender,generation,palette:0}); grid.append(card);
    }
    button("BACK", appearanceMode);
  }

  function paletteSelect(base) {
    pendingAppearance=base; showPanel(); content.className="guide-content appearance-step";
    content.innerHTML=`<span class="dialogue-speaker">COLOR VARIANT</span><h2>Pick a color.</h2><div class="palette-grid"></div>`;
    const grid=content.querySelector(".palette-grid"); actions.replaceChildren();
    [0,1,2].forEach(palette=>{
      const card=document.createElement("button"); card.type="button"; card.className="palette-card";
      const img=document.createElement("img"); img.alt="Trainer color option"; img.src=window.PlayerAvatar?.trainerAsset?.(base.gender,base.generation)||assetUrl("./assets/journey-v50/player_icon_red.png"); img.style.filter=window.PlayerAvatar?.PALETTE_FILTERS?.[palette]||"none";
      const label=document.createElement("strong"); label.textContent=["CLASSIC","FIELD","NIGHT"][palette]; card.append(img,label); card.onclick=()=>saveAppearance({...base,palette}); grid.append(card);
    });
    button("BACK",()=>generationSelect(base.gender));
  }

  function pokemonAppearance() {
    showPanel(); content.className="guide-content appearance-step";
    content.innerHTML=`<span class="dialogue-speaker">POKÉMON PLAYER</span><h2>Apparently you are a Pokémon.</h2><div class="pokemon-avatar-grid"></div>`;
    const grid=content.querySelector(".pokemon-avatar-grid"); actions.replaceChildren();
    ["pikachu","charmander","snorlax"].forEach(id=>{
      const card=document.createElement("button"); card.type="button"; card.className="pokemon-avatar-card"; card.innerHTML=`<img alt=""><strong>${SPECIES[id].name}</strong><small>PLAY AS ${SPECIES[id].name.toUpperCase()}</small>`; setSprite(card.querySelector("img"),id); card.onclick=()=>saveAppearance({kind:"pokemon",speciesId:id}); grid.append(card);
    });
    button("BACK",appearanceMode);
  }

  function saveAppearance(next) {
    window.PlayerAvatar?.setAppearance?.(next);
    save.playerProfile.appearance={...(save.playerProfile.appearance||{}),...next}; writeSave();
    const a=save.playerProfile.appearance;
    const label=a.kind==="pokemon"?SPECIES[a.speciesId]?.name:`Gen ${["","I","II","III","IV","V"][a.generation]} ${a.gender}`;
    dialogue("PROFESSOR JOKE", `Got it. ${label}. Crystal clear now. My retinas remain unconvinced, but we’re making progress.`, tragedy);
  }

  function tragedy() { persistStage("story"); dialogue("PROFESSOR JOKE", "You see, my entire family perished during a backyard barbecue when I was barely able to stand. The wild Pokémon in our town took me in and raised me as one of their own.", mercy); }
  function mercy() { dialogue("PROFESSOR JOKE", "So to this day, I’ve dedicated my life and mind to understanding them… and why they showed me mercy.", silence); }
  function silence() { dialogue("PLAYER", "…", master); }
  function master() { dialogue("PROFESSOR JOKE", "No matter! You look like a Pokémon Trainer. Wait—maybe even a Pokémon Master?!", fart); }
  function fart() { dialogue("PLAYER", "*farts*", suspicion); }
  function suspicion() {
    dialogue("PROFESSOR JOKE", "Excellent! It’s exactly what I suspected. You’re training to become a Pokémon Master—is that right?", null);
    button("SURE", offer, true); button("WHAT ARE YOU SMOKING, OLD MAN?", offer);
  }
  function offer() { dialogue("PROFESSOR JOKE", `Ha-HA! This is impeccable. You see, ${firstName()}, I have a few Pokémon I was going to donate to the local school. You should take one and see if you can master its abilities.`, starterSelect, "CHOOSE A POKÉMON"); }
  function starterSelect() {
    persistStage("starter"); showPanel(); content.className = "guide-content starter-step"; content.innerHTML = `<span class="dialogue-speaker">CHOOSE YOUR PARTNER</span><h2>Who will join you?</h2><div class="guide-starters"></div>`;
    const holder = content.querySelector(".guide-starters"); actions.replaceChildren();
    STARTER_IDS.forEach(id => { const mon = SPECIES[id], card = document.createElement("button"); card.type="button"; card.innerHTML=`<img alt=""><strong>${mon.name}</strong><small>${mon.types.join(" · ")}</small>`; setSprite(card.querySelector("img"),id); card.onclick=()=>confirmStarter(id); holder.append(card); });
  }
  function confirmStarter(id) {
    starterChoice = id; dialogue("PROFESSOR JOKE", `Choose ${SPECIES[id].name} as your first partner?`, null);
    button("THAT’S THE ONE", acceptStarter, true); button("KEEP LOOKING", starterSelect);
  }
  function acceptStarter() {
    if (!save.owned.length) chooseStarter(starterChoice);
    starterChoice=save.pokemon?.[0]?.speciesId||starterChoice||save.owned?.[0];
    persistStage("eggs");
    dialogue("PROFESSOR JOKE", `Aww, man… ${SPECIES[starterChoice].name} was my favorite. Whatever! It’s yours now.`, eggs);
  }
  function eggs() { dialogue("PROFESSOR JOKE", "My bag is pretty heavy, too. Take these two eggs and see if they hatch Pokémon—or at least make a nice breakfast.", eggHatchStep, "RECEIVE TWO MYSTERY EGGS"); }

  function eggHatchStep() {
    if (save.pendingEggs.length !== 2) { save.pendingEggs=chooseEggs(); save.hatchedEggs=[]; writeSave(); }
    showPanel(); content.className="guide-content egg-intro-step"; content.innerHTML=`<span class="dialogue-speaker">MYSTERY EGGS</span><h2>Give them a tap.</h2><div class="intro-egg-grid"></div><p class="appearance-note">You’ll start the Tour with a three-Pokémon team.</p>`;
    const grid=content.querySelector(".intro-egg-grid"); actions.replaceChildren();
    save.pendingEggs.forEach((id,index)=>{
      const hatched=save.hatchedEggs.includes(index); const card=document.createElement("button"); card.type="button"; card.className=`intro-egg${hatched?" hatched":""}`;
      card.innerHTML=hatched?`<img alt=""><strong>${SPECIES[id].name}</strong>`:`<span class="egg-shape" aria-hidden="true"></span><strong>TAP TO HATCH</strong>`;
      if(hatched)setSprite(card.querySelector("img"),id); else card.onclick=()=>{hatchEgg(index); eggHatchStep();}; grid.append(card);
    });
    if(save.hatchedEggs.length===2) button("START TOUR",tourIntro,true);
  }

  function tourIntro() { persistStage("tour"); dialogue("PROFESSOR JOKE", "The road ahead is dark and full of terrors, but with that Pokémon beside you, you should be fine. Let me give you a quick Tour before I make off to Kanto Elementary.", () => showTour(0), "START TOUR"); }

  const tour = [
    {label:"JOURNEY",title:"Journey is home.",text:"The Kanto map is your campaign hub. Tap cities to challenge Gyms, visit services and follow the next objective.",preview:"journey"},
    {label:"CUPS",title:"Cups are arcade runs.",text:"Build a three-Pokémon squad, clear staged opponents and survive the boss at the end of each Cup.",preview:"cups"},
    {label:"PARTY",title:"Your team travels with you.",text:"Manage six persistent Pokémon, inspect HP and status, change your follower and prepare before a run.",preview:"party"},
    {label:"BAG",title:"Your Bag has a job.",text:"Capture, Recovery, Growth and Held items stay organized by purpose. Use them where they matter.",preview:"bag"},
    {label:"CENTER",title:"Healing is a place—and a break.",text:"PokéCenters restore HP and status for free after a quick timing game. A full wipe sends you there automatically.",preview:"center"},
    {label:"SAFARI",title:"Safari is exploration.",text:"Wild Pokémon live in the habitat. Aggressive ones can spot you, leave the grass and force an encounter. Which is exactly what we’re about to test.",preview:"safari"},
  ];

  function tourPreview(kind) {
    const sprite=id=>`<img src="${spriteUrl(id)}" alt="">`;
    if(kind==="journey") return `<div class="tour-preview tour-map"><div class="tour-map-land"><i></i><i></i><i></i><i></i><span>PALLET</span><b>CERULEAN!</b></div><div class="tour-preview-footer"><strong>NEXT: MISTY</strong><small>Center · Mart · Gym</small></div></div>`;
    if(kind==="cups") return `<div class="tour-preview tour-cups"><b>POKÉ CUP</b><div><span>1</span><span>2</span><span>3</span><span class="boss">BOSS</span></div><small>Pick 3 · Heal between stages · Win the run</small></div>`;
    if(kind==="party") return `<div class="tour-preview tour-party">${save.pokemon.slice(0,3).map(mon=>`<div>${sprite(mon.speciesId)}<span><b>${SPECIES[mon.speciesId].name}</b><small>Lv.5</small><i></i></span></div>`).join("")}<div class="tour-empty">+</div><div class="tour-empty">+</div><div class="tour-empty">+</div></div>`;
    if(kind==="bag") return `<div class="tour-preview tour-bag"><div class="tour-bag-tabs"><b>CAPTURE</b><span>RECOVERY</span><span>GROWTH</span><span>HELD</span></div><div class="tour-bag-row"><img src="${assetUrl('./assets/items/poke_ball.png')}" alt=""><strong>Poké Ball</strong><em>× ${save.inventory.pokeBall||5}</em></div><div class="tour-bag-row"><img src="${assetUrl('./assets/items/potion.png')}" alt=""><strong>Potion</strong><em>× ${save.inventory.potion||3}</em></div></div>`;
    if(kind==="center") return `<div class="tour-preview tour-center"><div class="tour-counter"><span>✚</span><b>POKÉCENTER</b></div><div class="tour-machine">◉ ◉ ◉ ○ ○ ○</div><div class="tour-meter"><i></i></div><small>Time your taps · Heal entire party</small></div>`;
    return `<div class="tour-preview tour-safari"><div class="tour-grass"></div><div class="tour-path"></div><div class="tour-player">▲</div><div class="tour-wild">${sprite('mankey')}<b>!</b></div><small>AGGRESSIVE POKÉMON SPOTTED YOU</small></div>`;
  }

  function showTour(index) {
    showPanel(); const step=tour[index]; content.className="guide-content tour-step"; content.innerHTML=`<span class="dialogue-speaker">TOUR ${index+1} / ${tour.length}</span><h2>${step.title}</h2><p>${step.text}</p>${tourPreview(step.preview)}`;
    tourTabs.hidden=false;tourTabs.replaceChildren(...tour.map((item,i)=>{const node=document.createElement("span");node.textContent=item.label;node.className=i===index?"active":i<index?"complete":"";return node;}));
    requestAnimationFrame(()=>tourTabs.querySelector(".active")?.scrollIntoView({behavior:"smooth",inline:"center",block:"nearest"}));
    actions.replaceChildren();
    if(index>0)button("BACK",()=>showTour(index-1));
    button(index===tour.length-1?"START FIELD TEST":"NEXT",index===tour.length-1?beginFieldDemo:()=>showTour(index+1),true);
  }

  function prepareTourParty() {
    selected=save.pokemon.slice(0,6).map(mon=>mon.uid); selectionLimit=6;
    save.activePartyInstanceIds=[...selected]; save.adventurePartyInstanceIds=[...selected];
    save.pendingEggs=[]; save.hatchedEggs=[]; save.inventory.pokeBall=Math.max(8,save.inventory.pokeBall||0); save.inventory.potion=Math.max(3,save.inventory.potion||0);
    save.onboardingComplete=true; save.introComplete=false; save.introStage="field-demo"; writeSave();
  }

  function showAggroToast() {
    let toast=document.getElementById("intro-aggression-toast");
    if(!toast){toast=document.createElement("div");toast.id="intro-aggression-toast";toast.className="intro-aggression-toast";document.body.append(toast);}
    toast.innerHTML=`<strong>!</strong><span>AGGRESSIVE MANKEY SPOTTED YOU</span>`; toast.hidden=false; setTimeout(()=>toast.hidden=true,1100);
  }

  function beginFieldDemo() {
    prepareTourParty(); overlay.hidden=true; document.body.classList.remove("intro-open");
    renderApp(); showSafari(); window.PlayerAvatar?.applyEverywhere?.(); showAggroToast();
    setTimeout(()=>{
      startBattle("safari",{enemyIds:["mankey"],forcedLevel:3,tutorialDemo:true});
    },900);
  }

  function finishTutorialDemo() {
    save.introComplete=true; save.tourComplete=true; save.introStage="complete"; writeSave();
  }

  function replayGuide() { if (battle) return; replay=true; overlay.hidden=false; document.body.classList.add("intro-open"); closeButton.hidden=false; showTour(0); }
  function closeGuide() { if (!replay) return; overlay.hidden=true; document.body.classList.remove("intro-open"); }
  overlay.querySelector("#cinema-start").onclick=startStory; overlay.querySelector("#cinema-skip").onclick=startStory; closeButton.onclick=closeGuide;
  document.getElementById("joke-guide").onclick=replayGuide;
  overlay.addEventListener("keydown",event=>{if(event.key==="Escape"&&replay)closeGuide();});
  window.YSFlow?.on("battle:started",({battle:started})=>{
    if(!started?.tutorialDemo)return;
    const consoleEl=document.querySelector("#battle-screen .battle-console");
    let hint=document.getElementById("intro-battle-hint");
    if(!hint&&consoleEl){hint=document.createElement("div");hint.id="intro-battle-hint";hint.className="intro-battle-hint";consoleEl.prepend(hint);}
    if(hint)hint.innerHTML=`<strong>FIELD TEST</strong><span>Capture the aggressive ${activeEnemy().name} with BAG → POKÉ BALL, or defeat it in battle.</span>`;
  },160);
  window.YSFlow?.on("battle:ended",({battle:finished})=>{if(finished?.tutorialDemo)finishTutorialDemo();},-250);
  window.YSFlow?.on("app:rendered", () => {
    if(!save.introComplete && !save.onboardingComplete && !save.owned.length) startCinematic();
  }, 80);

  window.IntroGuide={startCinematic,startStory,replayGuide,beginFieldDemo,showTour,eggHatchStep,appearanceMode};
  if(!save.introComplete && !save.onboardingComplete && !save.owned.length) startCinematic();
  else if(!save.introComplete && !save.onboardingComplete && save.owned.length){ overlay.hidden=false;document.body.classList.add("intro-open");closeButton.hidden=true; if(save.hatchedEggs?.length===2)tourIntro(); else eggHatchStep(); }
})();

