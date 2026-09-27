
"use strict";
(() => {
  const TRAINER_MODELS = {
    boy: {
      1: "rival1.png",
      2: "jr.trainerm.png",
      3: "cooltrainerm.png",
      4: "rival2.png",
      5: "rival3.png",
    },
    girl: {
      1: "lass.png",
      2: "jr.trainerf.png",
      3: "cooltrainerf.png",
      4: "beauty.png",
      5: "sabrina.png",
    }
  };
  const PALETTE_FILTERS = ["none", "hue-rotate(115deg) saturate(1.2)", "hue-rotate(235deg) saturate(1.15)"];
  const POKEMON_CHOICES = ["pikachu","charmander","snorlax"];

  function appearance() {
    const raw = save?.playerProfile?.appearance || {};
    return {
      kind: raw.kind === "pokemon" ? "pokemon" : "trainer",
      gender: raw.gender === "girl" ? "girl" : "boy",
      generation: Math.max(1, Math.min(5, Number(raw.generation) || 1)),
      palette: Math.max(0, Math.min(2, Number(raw.palette) || 0)),
      speciesId: POKEMON_CHOICES.includes(raw.speciesId) ? raw.speciesId : "pikachu"
    };
  }
  function trainerAsset(gender, generation) {
    const file = TRAINER_MODELS[gender]?.[generation] || TRAINER_MODELS.boy[1];
    return assetUrl(`./assets/trainers/${file}`);
  }
  function currentAsset() {
    const a = appearance();
    return a.kind === "pokemon" ? spriteUrl(a.speciesId) : trainerAsset(a.gender, a.generation);
  }
  function currentFilter() {
    const a = appearance();
    return a.kind === "trainer" ? PALETTE_FILTERS[a.palette] : "none";
  }
  function modelLabel(gender, generation) {
    return `GEN ${["","I","II","III","IV","V"][generation]} · ${gender === "girl" ? "GIRL" : "BOY"}`;
  }
  function setAppearance(next) {
    save.playerProfile ||= {first:"",middle:"",last:""};
    save.playerProfile.appearance = {...appearance(), ...next};
    writeSave();
    applyEverywhere();
  }
  function applyImage(img) {
    if (!img) return;
    img.src = currentAsset();
    img.style.filter = currentFilter();
    img.style.imageRendering = "pixelated";
    img.dataset.playerAvatar = "true";
  }
  function applyEverywhere() {
    const journey = document.getElementById("journey-avatar");
    if (journey) {
      journey.classList.add("custom-player-avatar");
      let img = journey.querySelector("img");
      if (!img) { img=document.createElement("img"); journey.replaceChildren(img); }
      applyImage(img);
      journey.dataset.avatarKind = appearance().kind;
    }
    applyImage(document.querySelector("#safari-b62-avatar img"));
    let top = document.querySelector(".trainer-identity .player-avatar-chip");
    const identity = document.querySelector(".trainer-identity");
    if (identity && !top) {
      top = document.createElement("img");
      top.className = "player-avatar-chip";
      identity.prepend(top);
    }
    applyImage(top);
  }

  window.PlayerAvatar = Object.freeze({TRAINER_MODELS,PALETTE_FILTERS,POKEMON_CHOICES,appearance,trainerAsset,currentAsset,currentFilter,modelLabel,setAppearance,applyEverywhere});
  window.YSFlow?.on("app:rendered",()=>setTimeout(applyEverywhere,0),250);
  window.YSFlow?.on("journey:rendered",()=>setTimeout(applyEverywhere,0),250);
  window.YSFlow?.on("nav:changed",()=>setTimeout(applyEverywhere,0),250);
  document.addEventListener("DOMContentLoaded",()=>setTimeout(applyEverywhere,50));
})();

