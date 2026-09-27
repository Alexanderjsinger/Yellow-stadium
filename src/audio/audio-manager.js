"use strict";

/* D1 unified audio owner.
 * One AudioContext, one master bus, and one mute/unlock lifecycle for music,
 * battle SFX, crowd noise, cries, UI cues, and PokéCenter audio.
 */
(() => {
  const Runtime = window.YSRuntime;
  const AC = window.AudioContext || window.webkitAudioContext;
  const tracks = {
    menu: {
      bpm: 112,
      lead: [72,null,76,null,79,76,74,null,72,null,69,71,72,null,67,null,72,null,76,79,81,79,76,null,74,null,71,72,69,null,67,null],
      bass: [48,null,48,null,43,null,43,null,45,null,45,null,47,null,47,null,48,null,48,null,45,null,45,null,43,null,47,null,48,null,48,null]
    },
    battle: {
      bpm: 156,
      lead: [76,79,81,79,83,81,79,76,74,76,79,81,79,76,74,71,76,79,84,83,81,79,76,79,81,83,86,84,83,81,79,76],
      bass: [40,40,43,40,45,45,43,40,38,38,41,43,45,43,41,38,40,40,43,45,47,45,43,40,45,45,47,48,47,45,43,40]
    }
  };

  let context = null;
  let master = null;
  let musicBus = null;
  let effectsBus = null;
  let uiBus = null;
  let compressor = null;
  let musicTimer = null;
  let percussion = null;
  let nextStepAt = 0;
  let step = 0;
  let scene = "menu";
  let unlocked = false;
  let resumePromise = null;
  let muted = false;
  let lastStatus = { key: "", at: 0 };
  const active = new Map();

  try { muted = localStorage.getItem(MUSIC_KEY) === "true"; } catch { muted = false; }

  const button = () => document.getElementById("music-toggle");
  const frequency = midi => 440 * 2 ** ((midi - 69) / 12);

  function createGraph() {
    if (!AC || context) return context;
    try {
      context = new AC();
      master = context.createGain();
      musicBus = context.createGain();
      effectsBus = context.createGain();
      uiBus = context.createGain();
      compressor = context.createDynamicsCompressor();

      master.gain.setValueAtTime(muted ? .0001 : 1, context.currentTime);
      musicBus.gain.value = .78;
      effectsBus.gain.value = 1;
      uiBus.gain.value = .9;
      compressor.threshold.value = -16;
      compressor.ratio.value = 3;

      musicBus.connect(master);
      effectsBus.connect(master);
      uiBus.connect(master);
      master.connect(compressor).connect(context.destination);

      // Preserve the RC8 music-space effect, but keep it off the SFX/UI buses.
      const echo = context.createDelay(.5);
      const feedback = context.createGain();
      const wet = context.createGain();
      echo.delayTime.value = .17;
      feedback.gain.value = .2;
      wet.gain.value = .16;
      musicBus.connect(echo);
      echo.connect(feedback).connect(echo);
      echo.connect(wet).connect(master);

      percussion = context.createBuffer(1, Math.ceil(context.sampleRate * .12), context.sampleRate);
      const samples = percussion.getChannelData(0);
      let seed = 417;
      for (let i = 0; i < samples.length; i++) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        samples[i] = (seed / 2147483648 - 1) * (1 - i / samples.length);
      }

      context.addEventListener?.("statechange", () => {
        if (context?.state === "closed") {
          context = master = musicBus = effectsBus = uiBus = compressor = percussion = null;
          unlocked = false;
          if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
        }
      });
    } catch {
      context = master = musicBus = effectsBus = uiBus = compressor = percussion = null;
    }
    return context;
  }

  function bus(name = "effects") {
    if (name === "music") return musicBus;
    if (name === "ui") return uiBus;
    return effectsBus;
  }

  function ready() {
    return !!(context && unlocked && context.state === "running" && !muted && !document.hidden);
  }

  function connect(node, channel = "effects") {
    if (!ready()) return false;
    const target = bus(channel);
    if (!target) return false;
    node.connect(target);
    return true;
  }

  function track(node, stopAt, channel = "effects") {
    active.set(node, channel);
    node.onended = () => active.delete(node);
    if (stopAt != null) {
      try { node.stop(stopAt); } catch {}
    }
  }

  function stopChannel(channel) {
    for (const [node, owner] of [...active]) {
      if (owner !== channel) continue;
      try { node.stop(); } catch {}
      active.delete(node);
    }
  }

  function stopEffects() {
    for (const channel of ["effects", "ui"]) stopChannel(channel);
  }

  async function unlock() {
    if (muted || document.hidden) return false;
    const c = createGraph();
    if (!c) return false;
    if (c.state === "running") {
      unlocked = true;
      ensureMusicTimer();
      scheduleMusic();
      return true;
    }
    if (resumePromise) return resumePromise;
    resumePromise = c.resume()
      .then(() => {
        unlocked = c.state === "running";
        if (unlocked) {
          ensureMusicTimer();
          nextStepAt = Math.max(nextStepAt, c.currentTime + .04);
          scheduleMusic();
        }
        return unlocked;
      })
      .catch(() => false)
      .finally(() => { resumePromise = null; });
    return resumePromise;
  }

  function toneHz(f = 220, d = .08, type = "square", gain = .12, end = f, delay = 0, channel = "effects") {
    if (!ready()) return null;
    const c = context;
    const oscillator = c.createOscillator();
    const envelope = c.createGain();
    const now = c.currentTime + Math.max(0, delay);
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(35, f), now);
    if (end && end !== f) oscillator.frequency.exponentialRampToValueAtTime(Math.max(35, end), now + d);
    envelope.gain.setValueAtTime(.0001, now);
    envelope.gain.exponentialRampToValueAtTime(Math.max(.001, gain), now + .008);
    envelope.gain.exponentialRampToValueAtTime(.0001, now + d);
    oscillator.connect(envelope);
    if (!connect(envelope, channel)) return null;
    oscillator.start(now);
    track(oscillator, now + d + .025, channel);
    return oscillator;
  }

  function toneMidi(midi, time, duration, type, volume) {
    if (!ready() || midi == null) return null;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency(midi), time);
    envelope.gain.setValueAtTime(.0001, time);
    envelope.gain.exponentialRampToValueAtTime(volume, time + .012);
    envelope.gain.setValueAtTime(volume, Math.max(time + .014, time + duration * .68));
    envelope.gain.exponentialRampToValueAtTime(.0001, time + duration);
    oscillator.connect(envelope);
    if (!connect(envelope, "music")) return null;
    oscillator.start(time);
    track(oscillator, time + duration + .025, "music");
    return oscillator;
  }

  function noise(duration = .08, gain = .1, delay = 0, channel = "effects", shaped = true) {
    if (!ready()) return null;
    const c = context;
    const length = Math.max(1, Math.floor(c.sampleRate * duration));
    const buffer = c.createBuffer(1, length, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      const envelope = shaped ? (1 - i / length) : 1;
      data[i] = (Math.random() * 2 - 1) * envelope;
    }
    const source = c.createBufferSource();
    const gainNode = c.createGain();
    const now = c.currentTime + Math.max(0, delay);
    source.buffer = buffer;
    gainNode.gain.setValueAtTime(Math.max(.0001, gain), now);
    gainNode.gain.exponentialRampToValueAtTime(.0001, now + duration);
    source.connect(gainNode);
    if (!connect(gainNode, channel)) return null;
    source.start(now);
    track(source, now + duration + .02, channel);
    return source;
  }

  function drum(time, accent) {
    if (!ready()) return;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(accent ? 115 : 82, time);
    oscillator.frequency.exponentialRampToValueAtTime(46, time + .08);
    envelope.gain.setValueAtTime(accent ? .09 : .045, time);
    envelope.gain.exponentialRampToValueAtTime(.0001, time + .09);
    oscillator.connect(envelope);
    if (!connect(envelope, "music")) return;
    oscillator.start(time);
    track(oscillator, time + .1, "music");
  }

  function scheduleMusic() {
    if (!ready()) return;
    const trackDef = tracks[scene];
    const currentBattle = Runtime?.battle;
    const tense = scene === "battle" && currentBattle && !currentBattle.over && currentBattle.player?.some(mon => mon.hp > 0 && mon.hp <= mon.maxHp / 4);
    const duration = 60 / (trackDef.bpm + (tense ? 6 : 0)) / 2;
    if (nextStepAt < context.currentTime - .3) nextStepAt = context.currentTime + .03;
    while (nextStepAt < context.currentTime + .18) {
      const index = step % trackDef.lead.length;
      const section = Math.floor(step / 32) % 4;
      const variation = scene === "battle" ? [0,0,12,0][section] : 0;
      const melody = trackDef.lead[index];
      toneMidi(melody == null ? null : melody + variation, nextStepAt, duration * .76, "triangle", scene === "battle" ? .06 : .038);
      toneMidi(trackDef.bass[index % trackDef.bass.length], nextStepAt, duration * .92, "triangle", scene === "battle" ? .052 : .035);
      const root = (scene === "battle" ? [52,48,55,50] : [60,57,53,55])[Math.floor(step / 8) % 4];
      const chord = scene === "battle" ? [0,3,7,12] : [0,4,7,12];
      toneMidi(root + chord[step % 4] + 12, nextStepAt, duration * .55, "sine", section === 2 ? .023 : .014);
      if (step % 8 === 0) [0, scene === "battle" ? 3 : 4, 7].forEach(interval => toneMidi(root + interval, nextStepAt, duration * 7.5, "sine", .012));
      if (scene === "battle") {
        if (step % 8 === 0 || step % 8 === 4 || section === 3 && step % 8 === 7) drum(nextStepAt, true);
        if (percussion) {
          const source = context.createBufferSource();
          const filter = context.createBiquadFilter();
          const gain = context.createGain();
          source.buffer = percussion;
          filter.type = step % 4 === 2 ? "bandpass" : "highpass";
          filter.frequency.value = step % 4 === 2 ? 1500 : 6500;
          gain.gain.setValueAtTime(step % 4 === 2 ? .035 : .013, nextStepAt);
          gain.gain.exponentialRampToValueAtTime(.0001, nextStepAt + .09);
          source.connect(filter).connect(gain);
          if (connect(gain, "music")) {
            source.start(nextStepAt);
            track(source, nextStepAt + .1, "music");
          }
        }
      } else if (step % 8 === 0) drum(nextStepAt, false);
      nextStepAt += duration;
      step += 1;
    }
  }

  function ensureMusicTimer() {
    if (!musicTimer) musicTimer = window.setInterval(scheduleMusic, 50);
  }

  async function start() {
    render();
    if (muted) return false;
    return unlock();
  }

  function setScene(nextScene) {
    if (!tracks[nextScene] || nextScene === scene) return;
    scene = nextScene;
    step = 0;
    if (context) {
      nextStepAt = context.currentTime + .08;
      scheduleMusic();
    }
  }

  function render() {
    const target = button();
    if (!target) return;
    target.setAttribute("aria-pressed", String(muted));
    target.setAttribute("aria-label", muted ? "Turn sound on" : "Mute sound");
    target.querySelector("span") && (target.querySelector("span").textContent = muted ? "♩" : "♪");
    target.querySelector("b") && (target.querySelector("b").textContent = muted ? "SOUND OFF" : "SOUND ON");
  }

  async function setMuted(next) {
    muted = !!next;
    try { localStorage.setItem(MUSIC_KEY, String(muted)); } catch {}
    if (master && context) {
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setTargetAtTime(muted ? .0001 : 1, context.currentTime, .02);
    }
    if (muted) {
      stopEffects();
      window.speechSynthesis?.cancel?.();
    } else {
      await unlock();
    }
    render();
    window.YSFlow?.emit("audio:muted", { muted });
    return muted;
  }

  async function toggle() { return setMuted(!muted); }

  const family = {
    contact: () => { noise(.05,.11); toneHz(95,.07,"square",.11,65); },
    dash: () => { toneHz(520,.08,"sawtooth",.07,190); noise(.035,.06,.05); },
    slam: () => { noise(.12,.15); toneHz(72,.16,"square",.14,44); },
    kick: () => { toneHz(125,.06,"square",.1,80); noise(.05,.09); },
    electric: () => { for (let i=0;i<4;i++) toneHz(520+i*190,.045,"square",.06,Math.max(35,520+i*190+(i%2?-250:300)),i*.045); },
    fire: () => { noise(.2,.075); toneHz(150,.18,"sawtooth",.065,370); },
    water: () => { noise(.22,.06); toneHz(220,.24,"sine",.07,110); },
    ice: () => { [880,1175,1480].forEach((f,i)=>toneHz(f,.12,"sine",.05,Math.max(35,f-f*.25),i*.035)); },
    psychic: () => { toneHz(180,.32,"sine",.07,700); toneHz(640,.28,"sine",.04,340,.04); },
    ghost: () => { toneHz(130,.35,"sine",.07,65); toneHz(390,.25,"triangle",.04,210,.05); },
    ground: () => { noise(.28,.12); toneHz(58,.28,"square",.12,40); },
    status: () => { toneHz(620,.1,"sine",.05,800); toneHz(820,.12,"sine",.04,700,.08); },
    beam: () => { toneHz(160,.18,"sawtooth",.07,860); toneHz(900,.32,"square",.06,500,.15); noise(.12,.1,.18); }
  };

  const typeVoices = new Set(["ELECTRIC","FIRE","WATER","GRASS","ICE","PSYCHIC","GHOST","POISON","GROUND","ROCK","FIGHTING","BUG","FLYING","DRAGON","DARK","NORMAL"]);

  function move(moveDef) {
    if (!moveDef || !ready()) return;
    const id = Object.keys(window.MOVES || {}).find(key => MOVES[key] === moveDef) || "";
    const type = moveDef.type;
    if (id === "hyperBeam") return family.beam();
    if (["tackle","slash","dragonClaw","xScissor","brickBreak","seismicToss"].includes(id)) return family.contact();
    if (id === "quickAttack" || id === "wingAttack") return family.dash();
    if (id === "bodySlam" || id === "rockSlide") return family.slam();
    if (id === "doubleKick") return family.kick();
    if (type === "ELECTRIC") return family.electric();
    if (type === "FIRE") return family.fire();
    if (type === "WATER") return family.water();
    if (type === "ICE") return family.ice();
    if (type === "PSYCHIC") return family.psychic();
    if (type === "GHOST" || type === "POISON") return family.ghost();
    if (type === "GROUND" || type === "ROCK") return family.ground();
    return moveDef.category === "STATUS" ? family.status() : family.contact();
  }

  function event(name) {
    if (!ready()) return;
    if (name === "send") { toneHz(330,.12,"square",.07,760); toneHz(880,.1,"sine",.045,1140,.08); }
    else if (name === "withdraw") toneHz(720,.16,"sine",.018,280);
    else if (name === "hit") { noise(.1,.11); toneHz(115,.09,"square",.07,70); }
    else if (name === "critical") { noise(.16,.16); toneHz(190,.08,"square",.12,690); toneHz(880,.15,"sawtooth",.1,440,.055); }
    else if (name === "dodge") { toneHz(560,.12,"sine",.05,240); toneHz(330,.08,"sine",.03,210,.08); }
    else if (name === "faint") { toneHz(300,.16,"square",.065,140); toneHz(170,.24,"triangle",.06,80,.12); }
    else if (name === "victory") [523,659,784,1047].forEach((note,i)=>toneHz(note,.18,"square",.055,note,i*.105));
    else if (name === "defeat") [330,294,220].forEach((note,i)=>toneHz(note,.28,"triangle",.05,note*.9,i*.145));
    else if (name === "lowHp") { toneHz(392,.09,"square",.012,392); toneHz(330,.1,"square",.01,330,.12); }
  }

  function status(code) {
    const now = performance.now();
    const key = String(code || "");
    if (key === lastStatus.key && now - lastStatus.at < 450) return;
    lastStatus = { key, at: now };
    ({BRN:family.fire,PAR:family.electric,PSN:family.ghost,TOX:family.ghost,SLP:family.status,FRZ:family.ice}[key] || family.status)();
  }

  function capture(ok) {
    if (!ready()) return;
    toneHz(ok ? 660 : 330,.1,"square",.055,ok ? 880 : 210);
    if (ok) toneHz(880,.16,"square",.055,1100,.1);
  }

  function cry(mon) {
    if (!ready() || !mon) return;
    const dex = window.SPECIES?.[mon.id]?.dex || 1;
    const pitch = 100 + (dex % 43) * 12;
    toneHz(pitch,.23,"sawtooth",.045,Math.max(35,pitch*.55));
  }

  function cheer(big = false) {
    if (!ready()) return;
    const duration = big ? 1.3 : .65;
    const c = context;
    const buffer = c.createBuffer(1, Math.floor(c.sampleRate * duration), c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i=0;i<data.length;i++) data[i] = (Math.random()*2-1) * Math.sin(Math.PI*i/data.length);
    const source = c.createBufferSource();
    const filter = c.createBiquadFilter();
    const gain = c.createGain();
    source.buffer = buffer;
    filter.type = "bandpass";
    filter.frequency.value = 850;
    filter.Q.value = .5;
    gain.gain.value = big ? .045 : .025;
    source.connect(filter).connect(gain);
    if (!connect(gain, "effects")) return;
    source.start();
    track(source, c.currentTime + duration + .02, "effects");
  }

  function chime(name = "ui") {
    if (!ready()) return;
    if (name === "pokecenter") {
      [659.25,783.99,987.77,783.99,1046.50].forEach((f,i)=>toneHz(f,.19,i===4?"sine":"triangle",.075,f,.03+i*.13,"ui"));
      return;
    }
    toneHz(660,.08,"sine",.04,880,0,"ui");
  }

  function stop() {
    if (musicTimer) { window.clearInterval(musicTimer); musicTimer = null; }
    for (const node of [...active.keys()]) {
      try { node.stop(); } catch {}
    }
    active.clear();
  }

  ["pointerdown","touchend","keydown"].forEach(type => document.addEventListener(type, () => { void unlock(); }, { passive:true, capture:true }));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopEffects();
      window.speechSynthesis?.cancel?.();
      if (context?.state === "running") void context.suspend().catch(()=>{});
    }
  });

  window.YSFlow?.on("presentation:status", ({text}) => {
    let mon = null;
    const current = Runtime?.battle;
    if (current) {
      const upper = String(text).toUpperCase();
      mon = [...(current.player || []), ...(current.enemy || [])].find(x => upper.includes(String(x.name).toUpperCase()));
    }
    if (mon?.status) status(mon.status);
  }, 30);
  window.YSFlow?.on("presentation:capture", ({caught}) => capture(!!caught), 30);

  const api = Object.freeze({
    start, unlock, toggle, setMuted, setScene, render, stop,
    move, event, status, capture, cry, cheer, chime,
    tone: toneHz, noise,
    hasTypeVoice: type => typeVoices.has(type),
    get muted() { return muted; },
    get state() { return context?.state || "uninitialized"; },
    get unlocked() { return unlocked; },
    get scene() { return scene; },
    get contextCount() { return context ? 1 : 0; }
  });
  Object.defineProperty(window, "AudioManager", { value: api, configurable:false, writable:false });
  render();
})();
