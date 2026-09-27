from pathlib import Path
import json, re

ROOT = Path(__file__).resolve().parents[1]
P = ROOT / 'src/presentation'
manifest = json.loads((ROOT/'manifest.json').read_text())
paths = [e['path'] for e in manifest['scripts']]

# Ten recovered implementation generations are physically absorbed into two
# durable modules. Historical slots remain as tiny activation shims only.
assert 'src/presentation/battle-runtime.js' in paths
assert 'src/presentation/move-effects.js' in paths
assert 'src/presentation/battle-presentation-director.js' in paths

retired = [
 'src/presentation/battle-presentation.js',
 'src/presentation/attack-effects.js',
 'src/presentation/battle-polish.js',
 'src/presentation/battle-atmosphere.js',
 'src/presentation/battle-cinematics.js',
 'src/presentation/battle-flow.js',
 'src/presentation/battle-choreography-v44.js',
 'src/presentation/capture-v47.js',
 'src/presentation/battle-effects-v51.js',
 'src/presentation/battle-director-v55.js',
]
for path in retired:
    assert path not in paths, f'superseded presentation implementation remains in manifest: {path}'
    assert not (ROOT/path).exists(), f'superseded implementation file remains in canonical source: {path}'

runtime=(P/'battle-runtime.js').read_text()
move=(P/'move-effects.js').read_text()
director=(P/'battle-presentation-director.js').read_text()
assets=(P/'assets.js').read_text()

for name in ['BattlePresentation','BattlePolish','BattleAtmosphere','BattleCinematics','BattleFlow','CaptureEffects']:
    assert f'YSPresentationInstallers.{name} = () =>' in runtime, f'battle runtime missing installer {name}'
for name in ['AttackEffects','BattleChoreography','MoveSourceEffects','SignatureEffects']:
    assert f'YSPresentationInstallers.{name} = () =>' in move, f'move-effects runtime missing installer {name}'

# Keep historical execution ordering with tiny, declarative activation slots.
activation_names = ['battle-atmosphere.js','battle-choreography.js','battle-cinematics.js','battle-flow.js','battle-polish.js','capture-effects.js','signature-effects.js','source-effects.js']
activation = [P/'activation'/name for name in activation_names]
assert all(path.exists() for path in activation), 'a C3 activation shim is missing'
for path in activation:
    text=path.read_text()
    assert len(text) < 240, f'activation shim grew implementation logic: {path.name}'
    assert text.count('YSPresentationInstallers.') == 1, f'activation shim must do one thing: {path.name}'
    assert 'window.' not in text, f'activation shim leaked public state: {path.name}'

# Version numbers no longer identify runtime service ownership.
combined='\n'.join([runtime,move,director,assets])
for name in ['BattleEffectsV51','BattleDirectorV55','BattleCaptureV47']:
    assert name not in combined, f'versioned runtime service survived absorption: {name}'
assert 'version: "C' in director, 'canonical director lost phase version marker'

# Registry remains private and initialization API cannot cross subsystem boundaries.
assert 'const YSPresentationInstallers = Object.create(null);' in assets
for path in (ROOT/'src').rglob('*.js'):
    if 'presentation' in path.parts:
        continue
    assert 'YSPresentationInstallers' not in path.read_text(), f'installer registry leaked outside presentation: {path.relative_to(ROOT)}'

print('PASS: C3 presentation implementations absorbed into durable runtimes')
