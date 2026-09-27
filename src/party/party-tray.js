
"use strict";
(() => {
  const nav = document.getElementById("mode-nav");
  const tray = document.createElement("section");
  tray.id = "party-tray"; tray.className = "party-tray"; tray.hidden = true;
  tray.setAttribute("aria-label", "Current party");
  nav.after(tray);

  const modal = document.createElement("div");
  modal.id = "quick-party-modal"; modal.className = "modal quick-party-modal"; modal.hidden = true;
  modal.innerHTML = `<section class="quick-party-card" role="dialog" aria-modal="true" aria-labelledby="quick-party-title">
    <header><div><p class="eyebrow">TEAM MANAGEMENT</p><h2 id="quick-party-title">Choose your party.</h2></div><button id="quick-party-close" type="button" aria-label="Close party editor">×</button></header>
    <div class="quick-party-size" aria-label="Party size"><span>FORMAT</span><button type="button" data-size="3">3v3</button><button type="button" data-size="6">6v6</button></div>
    <div id="quick-party-current" class="quick-party-current"></div>
    <div class="preset-heading"><strong>PRESET PARTIES</strong><small>Save up to three teams.</small></div>
    <div id="party-presets" class="party-presets"></div>
    <div class="preset-heading"><strong>YOUR POKÉMON</strong><small>Use ADD or REMOVE to change your team.</small></div>
    <div id="quick-party-owned" class="quick-party-owned"></div>
    <footer><span id="quick-party-note"></span><button id="quick-party-done" class="primary-button" type="button">DONE</button></footer>
  </section>`;
  document.body.append(modal);
  const current = modal.querySelector("#quick-party-current"), owned = modal.querySelector("#quick-party-owned"), presets = modal.querySelector("#party-presets");
  const note = modal.querySelector("#quick-party-note");

  function sync() {
    save.activePartyInstanceIds = [...selected];
    save.partyPresetInstanceIds = (save.partyPresetInstanceIds || []).slice(0, 3);
    writeSave();
  }
  function partyButton(uid, index, compact = false) {
    const record = pokemonRecord(uid); if (!record) return document.createElement("button");
    const id = record.speciesId;
    const button = document.createElement("button"); button.type = "button";
    button.dataset.pokemonId = id;
    button.dataset.companionId = uid;
    button.className = compact ? "tray-mon" : `quick-mon${selected.includes(uid) ? " selected" : ""}`;
    const mon = SPECIES[id];
    button.innerHTML = `<img alt=""><span><strong>${index !== null ? `${index + 1}. ` : ""}${pokemonNameFor(uid)}</strong><small>L${levelFor(uid)} · ${mon.types.join("/")}</small></span>`;
    setSprite(button.querySelector("img"), id);
    return button;
  }
  function renderTray() {
    const visible = save.onboardingComplete && !battle && !nav.hidden;
    tray.hidden = !visible; if (!visible) { window.YSFlow?.emit("party-tray:rendered", { visible: false }); return; }
    tray.style.setProperty("--party-slots", selectionLimit);
    tray.replaceChildren();
    const label = document.createElement("button"); label.type = "button"; label.className = "party-tray-label";
    label.innerHTML = `<span>CURRENT PARTY</span><strong>${selected.length}/${selectionLimit}</strong><small>EDIT OR USE PRESET ›</small>`; label.onclick = open;
    tray.append(label);
    const team = document.createElement("div"); team.className = "party-tray-team";
    selected.forEach((uid, index) => { const button = partyButton(uid, index, true); button.setAttribute("aria-label", `View ${pokemonNameFor(uid)} details`); button.onclick = () => window.PokemonDetails?.summary(uid); team.append(button); });
    for (let i = selected.length; i < selectionLimit; i++) { const empty = document.createElement("button"); empty.type="button"; empty.className="tray-mon empty"; empty.innerHTML=`<b>+</b><span>EMPTY SLOT</span>`; empty.onclick=open; team.append(empty); }
    tray.append(team);
    window.YSFlow?.emit("party-tray:rendered", { visible: true });
  }
  function renderEditor() {
    modal.style.setProperty("--party-slots", selectionLimit);
    current.replaceChildren();
    for(let i=0;i<selectionLimit;i++) {
      const uid=selected[i];
      if(uid){const card=document.createElement("div");card.className="quick-party-slot";const button=partyButton(uid,i);button.title=`View ${pokemonNameFor(uid)} details`;button.setAttribute("aria-label",`View ${pokemonNameFor(uid)} details`);button.onclick=()=>window.PokemonDetails?.summary(uid);const remove=document.createElement("button");remove.type="button";remove.className="quick-party-remove";remove.textContent="REMOVE";remove.setAttribute("aria-label",`Remove ${pokemonNameFor(uid)} from party`);remove.onclick=()=>{selected.splice(i,1);sync();renderEditor();renderTray();renderRoster();};card.append(button,remove);current.append(card);}
      else {const slot=document.createElement("div");slot.className="quick-mon empty";slot.innerHTML=`<b>+</b><span>SLOT ${i+1}</span>`;current.append(slot);}
    }
    modal.querySelectorAll("[data-size]").forEach(button=>{const size=Number(button.dataset.size);button.classList.toggle("active",size===selectionLimit);button.disabled=size===6&&save.pokemon.length<6;});
    presets.replaceChildren();
    for(let i=0;i<3;i++){
      const team=(save.partyPresetInstanceIds||[])[i]||[]; const card=document.createElement("article");
      card.innerHTML=`<div><strong>PRESET ${i+1}</strong><span>${team.length?team.map(pokemonNameFor).join(" · "):"EMPTY"}</span></div><button type="button" data-use ${team.length?"":"disabled"}>USE</button><button type="button" data-save ${selected.length===selectionLimit?"":"disabled"}>SAVE</button>`;
      card.querySelector("[data-use]").onclick=()=>{selected=team.filter(uid=>pokemonRecord(uid)).slice(0,6);selectionLimit=selected.length>3?6:3;sync();renderEditor();renderTray();renderRoster();};
      card.querySelector("[data-save]").onclick=()=>{save.partyPresetInstanceIds||=[];save.partyPresetInstanceIds[i]=[...selected];sync();renderEditor();};
      presets.append(card);
    }
    owned.replaceChildren();
    save.pokemon.forEach(record=>{const uid=record.uid,button=partyButton(uid,null);const index=selected.indexOf(uid);button.setAttribute("aria-pressed",String(index>=0));button.setAttribute("aria-label",`${index>=0?"Remove":"Add"} ${pokemonNameFor(uid)} ${index>=0?"from":"to"} party`);button.insertAdjacentHTML("beforeend",`<b class="quick-party-action">${index>=0?"✓ REMOVE":"+ ADD"}</b>`);button.disabled=index<0&&selected.length>=selectionLimit;button.onclick=()=>{const at=selected.indexOf(uid);if(at>=0)selected.splice(at,1);else if(selected.length<selectionLimit)selected.push(uid);sync();renderEditor();renderTray();renderRoster();};owned.append(button);});
    note.textContent=selected.length===selectionLimit?`${selected.map(pokemonNameFor).join(" · ")} ready.`:`Choose ${selectionLimit-selected.length} more Pokémon.`;
  }
  function open(){ if(battle)return; renderEditor(); modal.hidden=false; document.body.classList.add("party-editor-open"); modal.querySelector("#quick-party-close").focus(); }
  function close(){ modal.hidden=true; document.body.classList.remove("party-editor-open"); renderTray(); if(!document.getElementById("cups-screen").hidden)renderCups(); }
  modal.querySelector("#quick-party-close").onclick=close; modal.querySelector("#quick-party-done").onclick=close;
  modal.onclick=event=>{if(event.target===modal)close();};
  modal.addEventListener("keydown",event=>{if(event.key==="Escape")close();});
  modal.querySelectorAll("[data-size]").forEach(button=>button.onclick=()=>{setTeamSize(Number(button.dataset.size));renderEditor();renderTray();});
  window.PartyTray={render:renderTray,open,close};
  renderTray();
})();

