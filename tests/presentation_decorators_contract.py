from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
P = ROOT / 'src/presentation'
manifest = json.loads((ROOT/'manifest.json').read_text())
paths = [e['path'] for e in manifest['scripts']]
by_index = {e['index']: e['path'] for e in manifest['scripts']}

assert 'src/presentation/battle-decorators.js' in paths
assert by_index[45] == 'src/presentation/battle-decorators.js', 'decorator runtime must occupy historical StadiumShow slot'

retired = [
 'src/presentation/stadium-show.js',
 'src/presentation/battle-clarity.js',
 'src/presentation/battle-environments.js',
 'src/presentation/battle-readout.js',
 'src/presentation/battle-refinement.js',
 'src/presentation/polish-v62.js',
]
for path in retired:
    assert path not in paths, f'superseded decorator implementation remains in manifest: {path}'
    assert not (ROOT/path).exists(), f'superseded decorator file remains in canonical source: {path}'

runtime=(P/'battle-decorators.js').read_text()
for name in ['StadiumShow','BattleClarity','BattleEnvironments','BattleReadout','BattleRefinement','PolishV62']:
    assert f'YSPresentationInstallers.{name} = () =>' in runtime, f'decorator runtime missing installer {name}'
assert runtime.rstrip().endswith('YSPresentationInstallers.StadiumShow();'), 'StadiumShow historical activation changed'

expected = {
 52: ('src/presentation/activation/decorator-battle-clarity.js','BattleClarity'),
 55: ('src/presentation/activation/decorator-battle-environments.js','BattleEnvironments'),
 58: ('src/presentation/activation/decorator-battle-readout.js','BattleReadout'),
 62: ('src/presentation/activation/decorator-battle-refinement.js','BattleRefinement'),
 78: ('src/presentation/activation/decorator-polish-v62.js','PolishV62'),
}
for index,(path,name) in expected.items():
    assert by_index[index] == path, f'historical decorator slot {index} changed'
    text=(ROOT/path).read_text()
    assert len(text) < 220, f'decorator activation shim grew implementation logic: {path}'
    assert text.count('YSPresentationInstallers.') == 1, f'decorator activation shim must do one thing: {path}'
    assert f'YSPresentationInstallers.{name}();' in text
    assert 'window.' not in text

# Decorators may register lifecycle listeners, but they must not bypass the
# canonical battle director to reach a subordinate presentation generation.
assert 'YSPresentationInternals.BattlePolish?.scale' not in runtime
assert 'version: "C4"' in (P/'battle-presentation-director.js').read_text()

print('PASS: C4 event-driven presentation decorators absorbed into one runtime')
