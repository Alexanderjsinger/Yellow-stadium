from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

presentation = ROOT / 'src/presentation'
director = (presentation / 'battle-presentation-director.js').read_text()
move_effects = (presentation / 'move-effects.js').read_text()
battle_runtime = (presentation / 'battle-runtime.js').read_text()
stadium = (ROOT / 'src/battle/stadium-upgrade.js').read_text()
turns = (ROOT / 'src/battle/turns.js').read_text()
audio = (ROOT / 'src/audio/audio-manager.js').read_text()
api = (ROOT / 'src/api/yellow-stadium.js').read_text()

for required in [
    'Object.defineProperty(window, "BattlePresentationDirector"',
        'async function playMove',
    'sendOut(mon)',
    'withdraw(mon)',
    'prepare(actor, move)',
    'hitReaction(target, outcome = "hit")',
    'faint(mon)',
    'finish(victory)',
    'impactLabel(target, text)',
    'move(actor, move)',
    'miss(target)',
    'immune(target)',
    'result(target, result)',
    'status(text)',
    'ready()',
    'critical(actor, target, move)',
    'dodge(target, actor, move)',
    'capture(target, id, caught)',
    'cancel()',
]:
    assert required in director, f'canonical presentation director missing {required}'

# The director coordinates absorbed recipes; it never monkey-patches them.
assert 'AttackEffects.play =' not in director
assert '__YS_BATTLE_PRESENTATION_ORCHESTRATED__' not in director
assert re.search(r'window\.AttackEffects\?*\.cancel|window\.BattlePolish|window\.BattleFlow|window\.BattlePresentation\?|window\.BattleCinematics|window\.BattleAtmosphere', stadium) is None, 'battle engine still reaches into an old presentation generation'
assert 'window.BattlePresentationDirector' in stadium
assert 'window.BattlePresentationDirector?.ready()' in turns

# The abandoned v5.5 AudioContext remains absent from presentation recipes.
for forbidden in ['AudioContext', 'webkitAudioContext', 'AudioFX']:
    assert forbidden not in move_effects, f'absorbed move-effects runtime still owns audio: {forbidden}'
assert 'BattleDirectorV55?.AudioFX' not in audio
assert 'const Runtime = window.YSRuntime;' in audio

# Capture and atmosphere have distinct absorbed owners.
assert 'YSPresentationInternals.CaptureEffects=Object.freeze({capture})' in battle_runtime
assert 'BattleAtmosphere.capture=' not in battle_runtime
assert 'YSPresentationInternals.BattleAtmosphere=Object.freeze({render,aftermath})' in battle_runtime

# No non-presentation implementation module may call subordinate presentation
# services directly. BattlePresentationDirector is the single supported boundary.
legacy = [
    'BattlePresentation', 'AttackEffects', 'BattlePolish', 'BattleFlow',
    'BattleChoreography', 'MoveSourceEffects', 'SignatureEffects',
    'BattleCinematics', 'BattleAtmosphere', 'CaptureEffects',
]
failures=[]
for path in (ROOT / 'src').rglob('*.js'):
    if 'presentation' in path.parts:
        continue
    text=path.read_text()
    for name in legacy:
        pattern = rf'window\.{name}\b|(?<![A-Za-z0-9_$]){name}\.'
        if re.search(pattern, text):
            failures.append(f'{path.relative_to(ROOT)} -> {name}')
assert not failures, 'presentation boundary leaks:\n' + '\n'.join(failures)

assert 'get battle() { return window.BattlePresentationDirector || null; }' in api
print('PASS: C1/C3 canonical battle-presentation boundary')
