
"use strict";
/*
 * C4 canonical battle-presentation boundary.
 *
 * Battle mechanics call this director only. Recovered presentation generations are private recipe/services registered in a
 * global lexical registry. Only this director is public across the subsystem
 * boundary; mechanics never reach into recipe implementations directly.
 */
(() => {
  const Runtime = window.YSRuntime;
  const effects = YSPresentationInternals.AttackEffects;
  if (!effects) return;

  const flow = YSPresentationInternals.BattleFlow;
  const polish = YSPresentationInternals.BattlePolish;
  const camera = YSPresentationInternals.BattlePresentation;
  const choreography = YSPresentationInternals.BattleChoreography;
  const sourceEffects = YSPresentationInternals.MoveSourceEffects;
  const signatures = YSPresentationInternals.SignatureEffects;
  const cinematics = YSPresentationInternals.BattleCinematics;
  const atmosphere = YSPresentationInternals.BattleAtmosphere;
  const captureChoreography = YSPresentationInternals.CaptureEffects;
  const corePlay = effects.play.bind(effects);
  const moveId = move => Object.keys(window.MOVES || {}).find(key => MOVES[key] === move) || "";
  const settle = (value, timeout = 1600) => {
    if (!value || typeof value.then !== "function") return Promise.resolve(value);
    return Promise.race([
      Promise.resolve(value).catch(error => { console.warn("Battle presentation failed open", error); }),
      new Promise(resolve => setTimeout(resolve, timeout)),
    ]);
  };

  const choreographyPass = (actor, target, move, outcome) =>
    choreography?.play ? choreography.play(corePlay, actor, target, move, outcome) : corePlay(actor, target, move, outcome);

  const sourceEffectsPass = (actor, target, move, outcome) =>
    sourceEffects?.play ? sourceEffects.play(choreographyPass, actor, target, move, outcome) : choreographyPass(actor, target, move, outcome);

  async function playMove(actor, target, move, outcome = "hit") {
    const id = moveId(move);
    const battleRef = Runtime?.battle || null;
    const signatureRun = signatures?.signature ? signatures.signature(id, actor, target) : Promise.resolve();
    const visualRun = (async () => {
      await sourceEffectsPass(actor, target, move, outcome);
      if ((!Runtime || Runtime.battle === battleRef) && outcome !== "miss" && outcome !== "immune") {
        atmosphere?.aftermath?.(target, move);
      }
    })();
    await settle(Promise.all([visualRun, signatureRun]), 2200);
  }

  const api = {
    version: "C4",

    // Timing / pacing. Kept here so consumers no longer depend on BattlePolish.
    get speed() { return polish?.speed || "classic"; },
    get scale() { return polish?.scale || 1; },
    delay(ms) { return polish?.delay?.(ms) ?? ms; },
    wait(ms) { return settle(polish?.wait?.(ms) ?? new Promise(resolve => setTimeout(resolve, ms)), Math.max(800, ms + 600)); },
    setSpeed(next) { return polish?.setSpeed?.(next); },

    // Battle lifecycle presentation.
    sendOut(mon) { return settle(polish?.sendOut?.(mon)); },
    withdraw(mon) { return settle(polish?.withdraw?.(mon)); },
    prepare(actor, move) { return settle(polish?.prepare?.(actor, move)); },
    hitReaction(target, outcome = "hit") { return settle(polish?.impact?.(target, outcome)); },
    faint(mon) { return settle(polish?.faint?.(mon)); },
    finish(victory) { return settle(polish?.finish?.(victory)); },
    eventSound(name) { return polish?.eventSound?.(name); },

    // Camera / readable battle framing.
    cue(actor, move) { return camera?.cue?.(actor, move); },
    impactLabel(target, text) { return camera?.impact?.(target, text); },
    reset() { camera?.reset?.(); },
    render() { camera?.render?.(); polish?.render?.(); },
    cancel() { effects.cancel?.(); camera?.reset?.(); },

    // Turn grammar / announcer.
    move(actor, move) { return flow?.move?.(actor, move); },
    miss(target) { return flow?.miss?.(target); },
    immune(target) { return flow?.immune?.(target); },
    result(target, result) { return flow?.result?.(target, result); },
    status(text) { return flow?.status?.(text); },
    ready() { return flow?.ready?.(); },

    // Move pipeline and outcome punctuation.
    playMove,
    dodge(target, actor, move) { return settle(cinematics?.dodge?.(target, actor, move)); },
    critical(actor, target, move) { return settle(cinematics?.critical?.(actor, target, move) ?? polish?.impact?.(target, "critical")); },
    effectiveness(target, factor) { return settle(cinematics?.effectiveness?.(target, factor)); },
    capture(target, id, caught) { return settle(captureChoreography?.capture?.(target, id, caught), 2400); },

    // Exposed for architecture/debug tooling, not battle mechanics.
    matrix: signatures?.matrix || Object.freeze({}),
  };

  Object.defineProperty(window, "BattlePresentationDirector", {
    value: Object.freeze(api),
    configurable: false,
    writable: false,
  });
})();
