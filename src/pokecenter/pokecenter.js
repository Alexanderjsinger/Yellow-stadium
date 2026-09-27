
"use strict";
(() => {
  const Runtime = window.YSRuntime;
  const byId = id => document.getElementById(id);
  const ADVENTURE_MODES = new Set(["cup", "safari", "elite", "legendary", "mewtwo"]);
  const state = {
    phase: "idle",
    playing: false,
    forced: false,
    healed: false,
    meter: 0,
    attempts: 0,
    streak: 0,
    position: 0,
    targetLeft: 39,
    targetWidth: 20,
    startedAt: 0,
    duration: 980,
    raf: 0,
  };

  function partyIds() {
    if (window.PartyAutoFill?.partyIds) return window.PartyAutoFill.partyIds();
    const source = Runtime.save?.adventurePartyInstanceIds?.length
      ? Runtime.save.adventurePartyInstanceIds
      : Runtime.save?.activePartyInstanceIds?.length
        ? Runtime.save.activePartyInstanceIds
        : Runtime.selectedIds;
    return [...new Set((source || []).filter(uid => pokemonRecord(uid)))].slice(0, 6);
  }
  function maxHp(record) { return calculatedStats(record.speciesId, levelFor(record.uid)).hp; }
  function health(record) {
    if (!record) return null;
    if (window.YSAdventureV58?.adventureState) return window.YSAdventureV58.adventureState(record);
    const max = maxHp(record);
    record.adventureState ||= { hp:max, status:null, sleep:0 };
    return record.adventureState;
  }
  function needsHealing(record) {
    const s = health(record), max = maxHp(record);
    return !!s && (s.hp < max || s.status || s.sleep > 0);
  }
  function damagedCount() { return partyIds().map(uid => pokemonRecord(uid)).filter(Boolean).filter(needsHealing).length; }
  function allPartyFainted() {
    const ids = partyIds();
    return ids.length > 0 && ids.every(uid => (health(pokemonRecord(uid))?.hp || 0) <= 0);
  }
  function healAll() {
    const healed = [];
    partyIds().forEach(uid => {
      const record = pokemonRecord(uid); if (!record) return;
      const s = health(record);
      s.hp = maxHp(record);
      s.status = null;
      s.sleep = 0;
      healed.push(uid);
    });
    Runtime.persist();
    window.PartyTray?.render?.();
    window.JourneyController?.renderPartyPanel?.();
    window.YSFlow?.emit("pokecenter:healed", { party:[...healed] });
    return healed;
  }

  function navIcon() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3h8v5h5v8h-5v5H8v-5H3V8h5V3Z"/></svg><span>Center</span>';
  }
  function ensureNavButton() {
    const nav = byId("mode-nav"); if (!nav) return null;
    let button = byId("pokecenter-tab");
    if (!button) {
      button = document.createElement("button");
      button.id = "pokecenter-tab";
      button.className = "nav-button";
      button.type = "button";
      button.innerHTML = navIcon();
      button.setAttribute("aria-label", "PokéCenter");
      button.addEventListener("click", event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        open();
      });
      nav.insertBefore(button, byId("pokedex-tab") || byId("bag-tab") || null);
    }
    nav.style.gridTemplateColumns = "repeat(5,minmax(0,1fr))";
    return button;
  }

  function ensureScreen() {
    let screen = byId("pokecenter-screen");
    if (screen) return screen;
    screen = document.createElement("section");
    screen.id = "pokecenter-screen";
    screen.className = "screen pokecenter-screen";
    screen.hidden = true;
    screen.innerHTML = `
      <div class="pc-room" aria-labelledby="pc-title">
        <header class="pc-room-header">
          <div class="pc-sign" aria-hidden="true"><i></i><i></i></div>
          <div>
            <p class="eyebrow">POKÉCENTER</p>
            <h1 id="pc-title">Heal your party.</h1>
            <p id="pc-copy">Free care for your whole team. Place the Poké Balls on the recovery table, then sync the machine.</p>
          </div>
          <span class="pc-free">FREE</span>
        </header>

        <section class="pc-service-counter" aria-label="PokéCenter healing machine">
          <div class="pc-machine-back">
            <div class="pc-machine-lights" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
            <div class="pc-machine-screen"><small>RECOVERY SYSTEM</small><strong id="pc-machine-readout">READY</strong></div>
          </div>
          <div id="pc-ball-table" class="pc-ball-table" aria-label="Party Poké Ball recovery table"></div>
          <div class="pc-counter-front"><span>POKÉMON RECOVERY UNIT</span><b>+</b></div>
        </section>

        <section class="pc-care-card">
          <div class="pc-care-copy">
            <p class="eyebrow">CARE DESK</p>
            <h2 id="pc-greeting">Welcome, Trainer.</h2>
            <p id="pc-status">Tap Heal Party whenever you want a full HP and status reset.</p>
          </div>
          <button id="pc-start" class="primary-button pc-heal-button" type="button">HEAL PARTY <span>›</span></button>
        </section>

        <section id="pc-game" class="pc-game" aria-label="Healing Sync timing game" hidden>
          <div class="pc-game-head">
            <div><p class="eyebrow">HEALING SYNC</p><h2>Time the pulse.</h2></div>
            <b id="pc-attempts">0 HITS</b>
          </div>
          <p id="pc-prompt">Tap the bar when the moving Poké Ball reaches the green recovery zone.</p>
          <div class="pc-meter-wrap">
            <span><b>HEALING</b><strong id="pc-meter-label">0%</strong></span>
            <div class="pc-heal-meter"><i id="pc-heal-fill" style="width:0%"></i></div>
          </div>
          <button id="pc-timing-stage" class="pc-timing-stage" type="button" aria-label="Tap to time the healing pulse" disabled>
            <span class="pc-track">
              <i id="pc-target" class="pc-target"></i>
              <i id="pc-perfect" class="pc-perfect"></i>
              <i id="pc-pulse" class="pc-pulse" style="left:0%"><span></span></i>
            </span>
            <span id="pc-rating" class="pc-rating" aria-live="polite"></span>
          </button>
        </section>

        <footer class="pc-footer">
          <p id="pc-footer-copy">Healing restores HP and cures all status ailments.</p>
          <button id="pc-back" class="secondary-button" type="button">BACK TO JOURNEY</button>
        </footer>
      </div>`;
    (byId("app-content") || document.querySelector(".shell"))?.appendChild(screen);
    byId("pc-start")?.addEventListener("click", start);
    byId("pc-timing-stage")?.addEventListener("click", sync);
    byId("pc-back")?.addEventListener("click", backToJourney);
    return screen;
  }

  function ballMarkup(uid, index) {
    const record = uid ? pokemonRecord(uid) : null;
    if (!record) return `<article class="pc-cradle empty" data-slot="${index}"><span class="pc-indent"></span><small>EMPTY</small></article>`;
    const s = health(record), max = maxHp(record);
    const status = s.hp <= 0 ? "FAINTED" : s.status ? s.status : `${s.hp}/${max} HP`;
    return `<article class="pc-cradle occupied" data-slot="${index}" data-uid="${uid}">
      <span class="pc-indent"><i class="pc-ball" aria-hidden="true"><b></b></i></span>
      <strong>${pokemonNameFor(uid)}</strong><small>${status}</small>
    </article>`;
  }
  function renderTable({ loaded = false } = {}) {
    const table = byId("pc-ball-table"); if (!table) return;
    const ids = partyIds();
    table.innerHTML = Array.from({length:6}, (_, i) => ballMarkup(ids[i], i)).join("");
    table.classList.toggle("loaded", loaded);
    if (loaded) table.querySelectorAll(".pc-cradle.occupied").forEach((slot, i) => {
      slot.style.setProperty("--pc-delay", `${i * 80}ms`);
      slot.classList.add("loading");
    });
  }

  function stopLoop() {
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = 0;
    state.playing = false;
  }
  function setMeter(value) {
    state.meter = Math.max(0, Math.min(100, value));
    const fill = byId("pc-heal-fill"), label = byId("pc-meter-label");
    if (fill) fill.style.width = `${state.meter}%`;
    if (label) label.textContent = `${Math.round(state.meter)}%`;
  }
  function randomizeTarget() {
    state.targetWidth = Math.max(13, 21 - Math.floor(state.attempts / 2));
    state.targetLeft = 8 + Math.random() * (84 - state.targetWidth);
    const target = byId("pc-target"), perfect = byId("pc-perfect");
    if (target) { target.style.left = `${state.targetLeft}%`; target.style.width = `${state.targetWidth}%`; }
    if (perfect) {
      const pw = state.targetWidth * .34;
      perfect.style.left = `${state.targetLeft + (state.targetWidth - pw) / 2}%`;
      perfect.style.width = `${pw}%`;
    }
  }
  function tick(now) {
    if (!state.playing) return;
    const phase = ((now - state.startedAt) / state.duration) % 2;
    state.position = (phase <= 1 ? phase : 2 - phase) * 100;
    const pulse = byId("pc-pulse"); if (pulse) pulse.style.left = `${state.position}%`;
    state.raf = requestAnimationFrame(tick);
  }
  function beginAttempt() {
    randomizeTarget();
    state.startedAt = performance.now();
    state.duration = Math.max(620, 980 - state.attempts * 32);
    state.playing = true;
    byId("pc-timing-stage").disabled = false;
    byId("pc-rating").textContent = "";
    state.raf = requestAnimationFrame(tick);
  }

  function playChime() {
    window.AudioManager?.chime?.("pokecenter");
  }

  function start() {
    if (state.phase === "loading" || state.phase === "playing" || state.phase === "cinematic") return;
    const ids = partyIds();
    if (!ids.length) { byId("pc-status").textContent = "You do not have any Pokémon in your active party."; return; }
    void window.AudioManager?.unlock?.();
    stopLoop();
    state.phase = "loading"; state.healed = false; state.meter = 0; state.attempts = 0; state.streak = 0;
    setMeter(0);
    renderTable({loaded:true});
    byId("pc-start").disabled = true;
    byId("pc-start").innerHTML = "LOADING PARTY…";
    byId("pc-back").hidden = state.forced;
    byId("pc-machine-readout").textContent = "LOADING";
    byId("pc-status").textContent = "Poké Balls locked into the recovery table.";
    byId("pc-game").hidden = true;
    const room = byId("pokecenter-screen"); room?.classList.add("pc-loading");
    window.YSFlow?.emit("pokecenter:sessionStarted", { party:[...ids], forced:state.forced });
    setTimeout(() => {
      if (byId("pokecenter-screen")?.hidden) return;
      room?.classList.remove("pc-loading");
      state.phase = "playing";
      byId("pc-game").hidden = false;
      byId("pc-start").hidden = true;
      byId("pc-machine-readout").textContent = "SYNC";
      byId("pc-prompt").textContent = "Tap when the moving Poké Ball crosses the green recovery zone. Better timing fills the meter faster.";
      window.scrollTo({top:0,behavior:"smooth"});
      beginAttempt();
    }, 720);
  }

  function sync() {
    if (!state.playing || state.phase !== "playing") return;
    stopLoop(); state.phase = "rating";
    const left = state.targetLeft, right = left + state.targetWidth, center = left + state.targetWidth/2;
    const inside = state.position >= left && state.position <= right;
    const perfectBand = state.targetWidth * .17;
    const distanceFromCenter = Math.abs(state.position - center);
    const edgeDistance = state.position < left ? left - state.position : state.position > right ? state.position - right : 0;
    let rating, gain;
    if (distanceFromCenter <= perfectBand) { rating = "PERFECT!"; gain = 30; state.streak += 1; }
    else if (inside) { rating = "GOOD!"; gain = 22; state.streak += 1; }
    else if (edgeDistance <= 8) { rating = "CLOSE"; gain = 13; state.streak = 0; }
    else { rating = "MISS"; gain = 7; state.streak = 0; }
    if (state.streak >= 2 && rating !== "MISS") gain += 3;
    state.attempts += 1;
    setMeter(state.meter + gain);
    const ratingEl = byId("pc-rating");
    if (ratingEl) { ratingEl.textContent = `${rating} +${gain}%`; ratingEl.dataset.rating = rating.toLowerCase().replace("!",""); }
    byId("pc-attempts").textContent = `${state.attempts} ${state.attempts === 1 ? "HIT" : "HITS"}`;
    byId("pc-machine-readout").textContent = rating.replace("!","");
    document.querySelector(".pc-machine-lights")?.classList.add("ping");
    setTimeout(()=>document.querySelector(".pc-machine-lights")?.classList.remove("ping"),180);
    if (navigator.vibrate) navigator.vibrate(rating === "PERFECT!" ? [16,22,16] : rating === "MISS" ? 9 : 15);
    if (state.meter >= 100) { setTimeout(complete, 300); return; }
    byId("pc-timing-stage").disabled = true;
    setTimeout(() => {
      if (byId("pokecenter-screen")?.hidden) return;
      state.phase = "playing";
      beginAttempt();
    }, 330);
  }

  function complete() {
    stopLoop();
    state.phase = "cinematic";
    state.healed = false;
    setMeter(100);
    byId("pc-timing-stage").disabled = true;
    byId("pc-machine-readout").textContent = "HEALING";
    byId("pc-rating").textContent = "RECOVERY COMPLETE";
    byId("pc-rating").dataset.rating = "healed";
    byId("pc-prompt").textContent = "Recovery energy synchronized. Restoring your Pokémon…";
    const screen = byId("pokecenter-screen");
    screen?.classList.add("pc-healing-cinematic");
    playChime();
    if (navigator.vibrate) navigator.vibrate([20,35,20,35,45]);
    setTimeout(() => {
      healAll();
      state.phase = "complete"; state.healed = true; state.forced = false;
      renderTable({loaded:true});
      screen?.classList.remove("pc-healing-cinematic");
      screen?.classList.add("pc-healed");
      byId("pc-machine-readout").textContent = "ALL BETTER";
      byId("pc-status").textContent = "Your entire party is fully restored. HP and all status ailments have been cleared.";
      byId("pc-prompt").textContent = "Treatment complete. Your team is ready to head back out.";
      byId("pc-start").hidden = false;
      byId("pc-start").disabled = false;
      byId("pc-start").innerHTML = "HEAL AGAIN <span>›</span>";
      byId("pc-back").hidden = false;
      byId("pc-footer-copy").textContent = "Party fully restored · No charge";
      window.YSFlow?.emit("pokecenter:completed", { attempts:state.attempts, party:partyIds() });
    }, 1900);
  }

  function resetView() {
    stopLoop();
    state.phase = "idle"; state.healed = false; state.meter = 0; state.attempts = 0; state.streak = 0;
    const screen = byId("pokecenter-screen");
    screen?.classList.remove("pc-loading","pc-healing-cinematic","pc-healed");
    renderTable({loaded:false});
    setMeter(0);
    byId("pc-game").hidden = true;
    byId("pc-start").hidden = false;
    byId("pc-start").disabled = false;
    byId("pc-start").innerHTML = "HEAL PARTY <span>›</span>";
    byId("pc-back").hidden = state.forced;
    byId("pc-machine-readout").textContent = "READY";
    byId("pc-rating").textContent = "";
    byId("pc-attempts").textContent = "0 HITS";
    byId("pc-footer-copy").textContent = "Healing restores HP and cures all status ailments.";
    const hurt = damagedCount();
    if (state.forced) {
      byId("pc-greeting").textContent = "You fainted.";
      byId("pc-status").textContent = "Your party was brought here safely. Heal your team before returning to the Journey.";
      byId("pc-copy").textContent = "A full party wipe returns you directly to the PokéCenter. Recovery is always free.";
    } else {
      byId("pc-greeting").textContent = "Welcome, Trainer.";
      byId("pc-status").textContent = hurt ? `${hurt} teammate${hurt === 1 ? " needs" : "s need"} care. Full-health Pokémon will join the recovery cycle too.` : "Your team is healthy, but you can run the recovery cycle anytime.";
      byId("pc-copy").textContent = "Free care for your whole team. Place the Poké Balls on the recovery table, then sync the machine.";
    }
  }

  function open(options = {}) {
    if (!Runtime?.save?.onboardingComplete) return;
    if (Runtime.battle && !Runtime.battle.over && !options.fainted) return;
    ensureNavButton(); ensureScreen(); stopLoop();
    state.forced = options.fainted === true;
    Runtime.clearFinishedBattle();
    const result = byId("result-modal"); if (result) result.hidden = true;
    if (typeof hideMainScreens === "function") hideMainScreens();
    const screen = byId("pokecenter-screen"); screen.hidden = false;
    document.body.classList.add("pokecenter-active");
    if (typeof setActiveNav === "function") setActiveNav("pokecenter-tab");
    const title = byId("app-title"); if (title) title.textContent = "PokéCenter";
    resetView();
    window.scrollTo({top:0,behavior:"auto"});
    window.YSFlow?.emit("pokecenter:opened", { fainted:state.forced, hurt:damagedCount() });
  }
  function backToJourney() {
    if (state.forced && !state.healed) return;
    stopLoop();
    document.body.classList.remove("pokecenter-active");
    window.JourneyController?.show?.() || showCups();
  }

  window.YSFlow?.on("screens:hidden", () => {
    const screen = byId("pokecenter-screen"); if (screen) screen.hidden = true;
    document.body.classList.remove("pokecenter-active"); stopLoop();
  }, 40);
  window.YSFlow?.on("nav:changed", ({id}) => {
    if (id !== "pokecenter-tab") return;
    const title = byId("app-title"); if (title) title.textContent = "PokéCenter";
  }, 110);
  window.YSFlow?.on("battle:ended", ({battle:finished, victory}) => {
    if (!finished || finished.tutorialDemo || victory || !ADVENTURE_MODES.has(finished.mode) || !allPartyFainted()) return;
    setTimeout(() => open({fainted:true}), 0);
  }, -100);

  const api = Object.freeze({
    open, start, sync, healAll, partyIds, damagedCount, allPartyFainted,
    get state(){ return {...state}; }
  });
  window.PokeCenter = api;
  ensureNavButton(); ensureScreen(); renderTable({loaded:false});
})();

