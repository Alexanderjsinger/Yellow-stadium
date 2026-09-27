from pathlib import Path
from collections import Counter
import json

ROOT = Path(__file__).resolve().parents[1]
live = json.loads((ROOT / "public/asset-manifest.json").read_text())
archive = json.loads((ROOT / "golden/asset-manifest.rc8.json").read_text())
by_group = Counter(); by_mime = Counter(); rows=[]
for key, meta in live.items():
    rel=meta['path']; parts=Path(rel).parts
    group=parts[1] if len(parts)>1 and parts[0]=='assets' else parts[0]
    by_group[group]+=1; by_mime[meta['mime']]+=1; rows.append({'key':key,'path':rel,**meta})
rows.sort(key=lambda x:x['bytes'],reverse=True)
pruned=sorted(set(archive)-set(live))
report={
  'recovered_asset_count':len(archive),
  'asset_count':len(rows),
  'pruned_asset_count':len(pruned),
  'decoded_bytes':sum(x['bytes'] for x in rows),
  'pruned_bytes':sum(archive[k]['bytes'] for k in pruned),
  'by_group':dict(by_group.most_common()),'by_mime':dict(by_mime.most_common()),
  'largest':rows[:25], 'pruned':pruned,
}
(ROOT/'reports/asset-inventory.json').write_text(json.dumps(report,indent=2)+'\n')
lines=['# Asset inventory — E2','',f"- Recovered RC8 assets: **{len(archive)}**",f"- Live deploy assets: **{len(rows)}**",f"- Safely pruned assets: **{len(pruned)}** ({report['pruned_bytes']:,} bytes)",f"- Live physical asset bytes: **{report['decoded_bytes']:,}**",'', '## Live groups','']
for name,count in report['by_group'].items(): lines.append(f'- `{name}`: {count}')
lines += ['', '## Largest live assets','']
for row in rows[:15]: lines.append(f"- `{row['path']}` — {row['bytes']:,} bytes")
(ROOT/'reports/asset-inventory.md').write_text('\n'.join(lines)+'\n')
print('wrote reports/asset-inventory.json')
print('wrote reports/asset-inventory.md')
print(json.dumps({k:report[k] for k in ['recovered_asset_count','asset_count','pruned_asset_count','decoded_bytes','pruned_bytes']},indent=2))
