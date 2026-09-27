
"use strict";
/*
 * Stable V4 facade.
 * New features should prefer this API instead of reaching into implementation files directly.
 * Existing globals remain intact for backward compatibility with the golden-master build.
 */
(() => {
  const Runtime = window.YSRuntime;
  const api = {
    version: "V4-ui2-rc8",
    state: {
      get save() { return Runtime.save; },
      get selected() { return Runtime.selectedIds; },
      get battle() { return Runtime.battle; },
      snapshot: () => Runtime.snapshot(),
      load: loadSave,
      write: () => Runtime.persist(),
      update: (mutator, options) => Runtime.updateSave(mutator, options),
    },
    data: {
      species: SPECIES,
      moves: MOVES,
      items: ITEMS,
      cups: CUPS,
      eliteFour: ELITE_FOUR,
      trainers: TRAINERS,
    },
    battle: {
      get current() { return Runtime.battle; },
      start: startBattle,
      startTrainer,
      startCup,
      startElite,
      startMewtwo: startMewtwoBattle,
      useItem: useBattleItem,
      switchPlayer,
    },
    journey: {
      show: showCups,
      render: renderCups,
      startCup,
      startElite,
      startMewtwo: startMewtwoBattle,
    },
    safari: {
      show: showSafari,
      get runtime() { return window.YSB62Safari || null; },
    },
    party: {
      show: showCollection,
      render: renderRoster,
      setTeamSize,
      autoFillCaught: record => window.PartyAutoFill?.assignCaught?.(record) || false,
      get selected() { return Runtime.selectedIds; },
    },
    pokecenter: {
      open: options => window.PokeCenter?.open?.(options),
      healAll: () => window.PokeCenter?.healAll?.() || [],
      get needsCare() { return window.PokeCenter?.damagedCount?.() || 0; },
    },
    bag: {
      // `show` remains the historical Poké Mart alias for compatibility.
      show: showShop,
      open: () => window.BagSystem?.open?.(),
      render: () => window.BagSystem?.render?.(),
      renderShop,
      buy: buyItem,
      useBattleItem,
    },
    progression: {
      levelFor,
      xpProgress,
      experienceFor,
      expForLevel,
    },
    audio: {
      get manager() { return window.AudioManager || null; },
      start: () => window.AudioManager?.start?.(),
      toggle: () => window.AudioManager?.toggle?.(),
      setMuted: muted => window.AudioManager?.setMuted?.(muted),
      setScene: scene => window.AudioManager?.setScene?.(scene),
      get muted() { return !!window.AudioManager?.muted; },
      get state() { return window.AudioManager?.state || "unavailable"; },
    },
    presentation: {
      get battle() { return window.BattlePresentationDirector || null; },
      assetUrl,
      spriteUrl,
      setSprite,
      announce,
    },
  };
  Object.defineProperty(window, "YellowStadium", {
    value: Object.freeze(api),
    configurable: false,
    writable: false,
  });
})();
