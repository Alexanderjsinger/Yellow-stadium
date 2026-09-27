from pathlib import Path
root=Path(__file__).resolve().parents[1]
intro=(root/'src/onboarding/intro-guide.js').read_text()
save=(root/'src/core/save.js').read_text()
legacy=(root/'src/safari/legacy-safari.js').read_text()
b62=(root/'src/safari/safari-b62.js').read_text()
ret=(root/'src/battle/return.js').read_text()
css=(root/'src/styles/onboarding.css').read_text()

assert 'save.onboardingComplete=false; save.introComplete=false; save.tourComplete=false; save.introStage="field-demo"' in intro
assert 'function resumeFieldDemo()' in intro
assert 'startBattleImmediate("safari",config)' in intro
assert 'requestAnimationFrame(()=>requestAnimationFrame(launch))' in intro
assert 'save.onboardingComplete=true; save.introComplete=true; save.tourComplete=true; save.introStage="complete"' in intro
assert 'cleanupFieldDemoArtifacts();if(finished?.tutorialDemo)finishTutorialDemo();' in intro
assert 'document.getElementById("intro-battle-hint")?.remove?.()' in intro
assert 'pendingFieldDemo = parsed.introStage === "field-demo"' in save
assert 'if (pendingFieldDemo) result.onboardingComplete = false;' in save
assert 'tutorialFieldDemo' in legacy and 'tutorialFieldDemo' in b62
assert 'SafariLegacyRuntime.save.introStage === "field-demo"' in legacy
assert 'if(battle.tutorialDemo)' in ret
assert 'body.intro-field-demo #mode-nav' in css
assert 'body.intro-field-demo.safari-b62-active #safari-b62-app{pointer-events:none}' in css
# Old loose timer contract must stay gone.
assert 'setTimeout(()=>{\n      startBattle("safari",{enemyIds:["mankey"]' not in intro
print('Tutorial field-demo contract passed')
