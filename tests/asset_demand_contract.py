from pathlib import Path
import hashlib, json, re

ROOT = Path(__file__).resolve().parents[1]
failures=[]
def expect(condition,message):
    if not condition: failures.append(message)

archive=json.loads((ROOT/'golden/asset-manifest.rc8.json').read_text())
live=json.loads((ROOT/'public/asset-manifest.json').read_text())
groups=json.loads((ROOT/'public/asset-groups.json').read_text())
report=json.loads((ROOT/'reports/e2-asset-demand.json').read_text())

expect(len(archive)==806, f"RC8 archive should retain 806 assets, got {len(archive)}")
expect(len(live)==450, f"E2 deploy should contain 450 reachable assets, got {len(live)}")
expect(report['pruned_asset_count']==356, f"E2 expected 356 safe prunes, got {report['pruned_asset_count']}")
expect(report['pruned_asset_bytes']==143283, f"E2 prune byte total drift: {report['pruned_asset_bytes']}")
expect(sum(v['bytes'] for v in live.values())==13405715, "E2 live asset byte total drift")

pruned_prefixes=("./assets/gen1/","./assets/rs/","./assets/front/","./assets/back/","./assets/ui/","./assets/badges/")
source_text='\n'.join(p.read_text(errors='ignore') for p in (ROOT/'src').rglob('*') if p.is_file() and p.suffix in {'.js','.css','.html'})
for prefix in pruned_prefixes:
    expect(prefix not in source_text, f"source still references pruned legacy family {prefix}")
for key in archive:
    if key.startswith(pruned_prefixes):
        expect(key not in live, f"pruned legacy asset still deployed: {key}")
        expect(not (ROOT/'public'/archive[key]['path']).exists(), f"pruned legacy bytes still present: {key}")

# Every physical live asset must be listed and exact; no orphan payloads.
physical=[]
for p in sorted((ROOT/'public/assets').rglob('*')):
    if p.is_file(): physical.append('assets/'+p.relative_to(ROOT/'public/assets').as_posix())
manifest_paths=sorted(v['path'] for v in live.values())
expect(set(physical)==set(manifest_paths), "public/assets contains orphan or missing files relative to live manifest")
for key,meta in live.items():
    raw=(ROOT/'public'/meta['path']).read_bytes()
    expect(hashlib.sha256(raw).hexdigest()==meta['sha256'], f"live asset hash drift: {key}")

# Preload groups must be small and may not accidentally reintroduce heavyweight startup art.
heavy={"./assets/maps/kanto.png","./assets/maps/kanto-journey-v36.png","./assets/stadium/arena.png"}
for name,paths in groups.items():
    expect(paths, f"empty preload group: {name}")
    for path in paths:
        expect(path in live, f"preload group {name} references missing asset {path}")
        expect(path not in heavy, f"heavy scenic asset must remain demand-only, not preloaded: {path}")
    total=sum(live[p]['bytes'] for p in paths if p in live)
    expect(total < 100_000, f"preload group {name} is too heavy: {total} bytes")

assets=(ROOT/'src/presentation/assets.js').read_text()
expect('const AssetDemand = (() =>' in assets, "private AssetDemand manager missing")
expect('window.AssetDemand' not in assets, "AssetDemand should remain private")
expect('battle:modelCreated' in assets and 'battle:beforeStart' in assets, "battle demand hooks missing")
expect('nav:changed' in assets, "screen-aware nav preloads missing")

intro=(ROOT/'src/onboarding/intro-guide.js').read_text()
head=intro.split('let replay',1)[0]
expect('./assets/maps/kanto.png' not in head, "cinematic map is still assigned eagerly at module initialization")
expect('./assets/stadium/arena.png' not in head, "cinematic stadium is still assigned eagerly at module initialization")
expect('AssetDemand.assignImage(overlay.querySelector(".cinema-map")' in intro, "cinematic map demand assignment missing")
expect('AssetDemand.assignImage(overlay.querySelector(".cinema-stadium")' in intro, "cinematic stadium demand assignment missing")

template=(ROOT/'src/template.html').read_text()
expect('data-demand-src="./assets/maps/kanto-journey-v36.png"' in template, "Journey map should be source-less until Journey renders")
expect(not re.search(r'(?<!data-demand-)src="\./assets/maps/kanto-journey-v36\.png"', template), "Journey map is still eager in template")
kanto=(ROOT/'src/journey/kanto-map.js').read_text()
expect("AssetDemand.assignImage(mapArt,mapArt.dataset.demandSrc" in kanto, "Journey map demand assignment missing")

# Dist should mirror the pruned tree and carry the demand metadata.
expect((ROOT/'dist/asset-groups.json').exists(), "dist asset-groups.json missing")
dist_files=[p for p in (ROOT/'dist/assets').rglob('*') if p.is_file()]
expect(len(dist_files)==450, f"dist should contain 450 asset files, got {len(dist_files)}")

if failures:
    print('E2 ASSET DEMAND CONTRACT FAILURES')
    for f in failures: print('-',f)
    raise SystemExit(1)
print('PASS: E2 prunes unreachable legacy art and keeps heavyweight scenery demand-only')
