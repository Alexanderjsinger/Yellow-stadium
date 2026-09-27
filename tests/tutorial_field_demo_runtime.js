"use strict";
const assert=require("assert");
const {createHarness,loadCore}=require("./helpers/runtime_harness");

const h=loadCore(createHarness());
const repaired=h.json(`(()=>{
  const broken={...save,onboardingComplete:true,introComplete:false,introStage:'field-demo',tourComplete:false};
  const r=loadSave(broken);
  return {onboardingComplete:r.onboardingComplete,introComplete:r.introComplete,introStage:r.introStage,tourComplete:r.tourComplete};
})()`);
assert.strictEqual(repaired.onboardingComplete,false,"broken field-demo save should relock normal app");
assert.strictEqual(repaired.introComplete,false,"broken field-demo save must remain incomplete");
assert.strictEqual(repaired.introStage,"field-demo","field-demo stage should survive migration");
assert.strictEqual(repaired.tourComplete,false,"field demo migration should not invent completion");

const legacy=h.json(`(()=>{
  const old={...save,onboardingComplete:true,introComplete:undefined,introStage:'complete',tourComplete:true};
  const r=loadSave(old);
  return {onboardingComplete:r.onboardingComplete,introComplete:r.introComplete,introStage:r.introStage};
})()`);
assert.strictEqual(legacy.onboardingComplete,true,"legacy completed onboarding should remain unlocked");
assert.strictEqual(legacy.introComplete,true,"legacy completed onboarding should migrate to intro complete");
console.log("Tutorial field-demo runtime migration passed",JSON.stringify({repaired,legacy}));
