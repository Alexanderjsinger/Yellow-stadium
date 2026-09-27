from pathlib import Path
import json, re

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT/'manifest.json').read_text())
paths = [e['path'] for e in manifest['scripts']]
by_index = {e['index']:e['path'] for e in manifest['scripts']}

assert by_index[9] == 'src/audio/audio-manager.js', 'AudioManager must own the historical music slot'
assert by_index[72] == 'src/audio/retired-audio-v56-slot.js', 'retired v5.6 slot moved unexpectedly'
assert 'src/audio/music-legacy.js' not in paths
assert 'src/audio/audio-v56.js' not in paths
assert not (ROOT/'src/audio/music-legacy.js').exists()
assert not (ROOT/'src/audio/audio-v56.js').exists()

manager = (ROOT/'src/audio/audio-manager.js').read_text()
retired = (ROOT/'src/audio/retired-audio-v56-slot.js').read_text()
assert 'Object.defineProperty(window, "AudioManager"' in manager
for symbol in ['function unlock()', 'function setMuted(', 'function setScene(', 'function move(', 'function event(', 'function capture(', 'function cry(', 'function cheer(', 'function chime(']:
    assert symbol in manager, f'AudioManager missing {symbol}'
assert 'new AC()' in manager, 'AudioManager no longer owns context creation'
assert 'YSAudioV56' not in manager
assert 'AudioContext' not in retired and 'new ' not in retired

# There must be exactly one Web Audio context owner in canonical source.
context_files=[]
for entry in manifest['scripts']:
    path=ROOT/entry['path']
    if path.name == 'assets-inline.js':
        continue
    text=path.read_text()
    if re.search(r'\b(?:AudioContext|webkitAudioContext)\b', text):
        context_files.append(entry['path'])
assert context_files == ['src/audio/audio-manager.js'], f'multiple AudioContext owners remain: {context_files}'

# Old audio facade and old music object may not leak back into subsystem code.
for entry in manifest['scripts']:
    path=ROOT/entry['path']
    if path.name == 'assets-inline.js':
        continue
    text=path.read_text()
    assert 'YSAudioV56' not in text, f'legacy YSAudioV56 reference remains: {entry["path"]}'
    if entry['path'] != 'src/ui/app-shell.js':
        assert not re.search(r'\bmusic\.(?:start|toggle|setScene|render)\b', text), f'legacy music facade call remains: {entry["path"]}'

for path in [
    'src/presentation/battle-runtime.js',
    'src/presentation/battle-decorators.js',
    'src/pokecenter/pokecenter.js',
    'src/battle/stadium-upgrade.js',
    'src/battle/start.js',
    'src/battle/return.js',
]:
    text=(ROOT/path).read_text()
    assert 'AudioManager' in text, f'{path} is not routed through AudioManager'

api=(ROOT/'src/api/yellow-stadium.js').read_text()
assert 'audio:' in api and 'AudioManager' in api, 'stable facade does not expose unified audio boundary'
print('PASS: D1 unified AudioManager owns all Web Audio playback/lifecycle')
