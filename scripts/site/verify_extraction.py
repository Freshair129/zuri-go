"""Verify standalone ownership, relocation paths and the public/private package boundary."""
from pathlib import Path
import argparse
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[2]


def verify_extraction(root=ROOT):
    root = Path(root)
    manifest = json.loads((root / 'docs/migrations/source-manifest.json').read_text(encoding='utf-8'))
    editable = json.loads((root / 'apps/web/protected-runtime.json').read_text(encoding='utf-8'))['editablePaths']
    checked = 0
    private_available = 0
    private_unavailable = 0
    for entry in manifest['files']:
        target = entry['target'].replace('\\', '/')
        authored = target.startswith('apps/web/') and any(target[9:].startswith(p) if p.endswith('/') else target[9:] == p for p in editable)
        if not authored and target.startswith(('apps/web/', 'assets/', '.local/member-access/')):
            path = root / target
            is_private_custody = target.startswith('.local/member-access/') and entry.get('disposition') == 'private-preserved'
            if is_private_custody and not path.is_file():
                private_unavailable += 1
                continue
            data = path.read_bytes()
            assert hashlib.sha256(data).hexdigest() == entry['sha256'], target
            checked += 1
            if is_private_custody:
                private_available += 1

    for folder in ['apps/api', 'scripts', 'tests']:
        for path in (root / folder).rglob('*'):
            if not path.is_file() or any(p in path.parts for p in ['node_modules', '__pycache__']):
                continue
            if path.suffix not in ['.mjs', '.py', '.ps1']:
                continue
            text = path.read_text(encoding='utf-8')
            if path.resolve() != Path(__file__).resolve():
                assert not re.search(r'D:[/\\]zuri-brand-kit|output/draft/', text, re.I), str(path)

    secrets = []

    def add_secret(value):
        if isinstance(value, str) and value and value not in secrets:
            secrets.append(value)

    for name in ['config.json', 'cloud-config.json']:
        path = root / '.local' / name
        if path.exists():
            config = json.loads(path.read_text(encoding='utf-8-sig'))
            for key in ['adminUrl', 'databaseUrl', 'sessionSecret', 'passwordHash']:
                add_secret(config.get(key))
    for path in (root / '.local/member-access/production').glob('*.json'):
        add_secret(json.loads(path.read_text(encoding='utf-8'))['password'])

    count = 0
    for path in (root / 'build/vercel').rglob('*'):
        if not path.is_file() or any(p in path.parts for p in ['node_modules', '.vercel']):
            continue
        relative = path.relative_to(root / 'build/vercel')
        assert '.local' not in relative.parts and not path.name.startswith('.env'), str(relative)
        assert path.name not in ['provision-members.mjs', 'setup-local.mjs', 'migrate.mjs', 'backfill-workboard.mjs'], str(relative)
        data = path.read_bytes()
        assert all(secret.encode('utf-8') not in data for secret in secrets), 'Private value in package'
        count += 1
    # 46 files at extraction + viewer.mjs, audience.mjs, teams.mjs and shared/visibility.mjs (FEAT-011 P1)
    # + tasks.mjs, projects.mjs, campaign-tasks.mjs and shared/task-rules.mjs (FEAT-010 P2)
    # + meeting-commit.mjs (PLAN-002 WI-09).
    # + six allowlisted FEAT-014 Visual Marketing modules. Operator migrations remain excluded.
    assert count == 61, count
    build = json.loads((root / 'apps/web/dist/data-app-build.json').read_text())
    snapshot = json.loads((root / 'apps/web/dist' / build['snapshot']['path']).read_text(encoding='utf-8'))
    assert snapshot['id'] == 'dashboard:354c0a91-d04c-431c-9fe5-06bc3f703be1'
    project = json.loads((root / 'build/vercel/.vercel/project.json').read_text())
    assert project['projectId'] == 'prj_8f3zf1qaZnRcAvWabOv1PWAPIABG'
    report = {
        'unchangedSourceFilesChecked': checked,
        'deployFiles': count,
        'privateCustodyStatus': 'NOT_RUN' if private_unavailable else 'PASS',
        'privateCustodyInputsAvailable': private_available,
        'privateCustodyInputsUnavailable': private_unavailable,
        'availableKnownSecretScanStatus': 'PASS' if secrets else 'NOT_RUN',
        'availableKnownSecretValuesChecked': len(secrets),
        'standalonePaths': True,
        'appId': snapshot['id'],
        'projectId': project['projectId'],
        'htmlSha256': build['html']['sha256'],
        'runtimeSha256': build['runtimeSha256'],
    }
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT)
    parser.add_argument('--no-write', action='store_true', help='print the result without updating extraction evidence')
    args = parser.parse_args()
    report = verify_extraction(args.root)
    if not args.no_write:
        out = args.root / 'docs/migrations/verification'
        out.mkdir(parents=True, exist_ok=True)
        (out / 'extraction.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report))


if __name__ == '__main__':
    main()
