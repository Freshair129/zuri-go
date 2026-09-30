"""Verify standalone ownership, relocation paths and the public/private package boundary."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[2]
manifest = json.loads((ROOT / 'docs/migrations/source-manifest.json').read_text(encoding='utf-8'))
editable = json.loads((ROOT / 'apps/web/protected-runtime.json').read_text(encoding='utf-8'))['editablePaths']
checked = 0
for entry in manifest['files']:
    target = entry['target'].replace('\\', '/')
    authored = target.startswith('apps/web/') and any(target[9:].startswith(p) if p.endswith('/') else target[9:] == p for p in editable)
    if not authored and target.startswith(('apps/web/', 'assets/', '.local/member-access/')):
        data = (ROOT / target).read_bytes()
        assert hashlib.sha256(data).hexdigest() == entry['sha256'], target
        checked += 1
for folder in ['apps/api', 'scripts', 'tests']:
    for path in (ROOT / folder).rglob('*'):
        if not path.is_file() or any(p in path.parts for p in ['node_modules', '__pycache__']):
            continue
        if path.suffix not in ['.mjs', '.py', '.ps1']:
            continue
        text = path.read_text(encoding='utf-8')
        if path != Path(__file__).resolve():
            assert not re.search(r'D:[/\\]zuri-brand-kit|output/draft/', text, re.I), str(path)

secrets = []
for name in ['config.json', 'cloud-config.json']:
    path = ROOT / '.local' / name
    if path.exists():
        config = json.loads(path.read_text(encoding='utf-8-sig'))
        secrets.extend(config[k] for k in ['adminUrl', 'databaseUrl', 'sessionSecret', 'passwordHash'] if config.get(k))
for path in (ROOT / '.local/member-access/production').glob('*.json'):
    secrets.append(json.loads(path.read_text(encoding='utf-8'))['password'])
count = 0
for path in (ROOT / 'build/vercel').rglob('*'):
    if not path.is_file() or any(p in path.parts for p in ['node_modules', '.vercel']):
        continue
    relative = path.relative_to(ROOT / 'build/vercel')
    assert '.local' not in relative.parts and not path.name.startswith('.env'), str(relative)
    assert path.name not in ['provision-members.mjs', 'setup-local.mjs', 'migrate.mjs'], str(relative)
    data = path.read_bytes()
    assert all(secret.encode() not in data for secret in secrets), 'Private value in package'
    count += 1
assert count == 46, count
build = json.loads((ROOT / 'apps/web/dist/data-app-build.json').read_text())
snapshot = json.loads((ROOT / 'apps/web/dist' / build['snapshot']['path']).read_text(encoding='utf-8'))
assert snapshot['id'] == 'dashboard:354c0a91-d04c-431c-9fe5-06bc3f703be1'
project = json.loads((ROOT / 'build/vercel/.vercel/project.json').read_text())
assert project['projectId'] == 'prj_8f3zf1qaZnRcAvWabOv1PWAPIABG'
report = {'unchangedSourceFilesChecked': checked, 'deployFiles': count, 'secretsExcluded': True, 'standalonePaths': True, 'appId': snapshot['id'], 'projectId': project['projectId'], 'htmlSha256': build['html']['sha256'], 'runtimeSha256': build['runtimeSha256']}
out = ROOT / 'docs/migrations/verification'
out.mkdir(parents=True, exist_ok=True)
(out / 'extraction.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report))
