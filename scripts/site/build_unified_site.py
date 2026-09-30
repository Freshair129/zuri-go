"""Package the verified Mission Control build and Metrics Map as one static site."""
from hashlib import sha256
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import json
import re

ROOT = Path(__file__).resolve().parents[2]
APPS = ROOT / 'apps'
APP_ID = 'dashboard:354c0a91-d04c-431c-9fe5-06bc3f703be1'


def digest(data):
    return sha256(data).hexdigest()


def within(root, relative):
    path = (root / relative).resolve()
    if not path.is_relative_to(root.resolve()) or path == root.resolve():
        raise ValueError(f'Path outside package: {relative}')
    return path


def app_files(dist):
    manifest_data = (dist / 'data-app-build.json').read_bytes()
    manifest = json.loads(manifest_data)
    if manifest['kind'] != 'separate-data-v1' or manifest['html']['path'] != 'index.html':
        raise ValueError('Expected verified separate-data build')
    files = {'data-app-build.json': manifest_data}
    for name in ('html', 'snapshot'):
        entry = manifest[name]
        data = within(dist, entry['path']).read_bytes()
        if digest(data) != entry['sha256'] or len(data) != entry['bytes']:
            raise ValueError(f'Build manifest mismatch: {name}')
        files[entry['path']] = data
    snapshot = json.loads(files[manifest['snapshot']['path']])
    if snapshot['id'] != APP_ID or snapshot['buildStatus'] not in ('updating', 'complete'):
        raise ValueError('Unexpected app identity or unfinished source')
    return files


class References(HTMLParser):
    def __init__(self):
        super().__init__()
        self.assets = set()

    def handle_starttag(self, tag, pairs):
        attrs = dict(pairs)
        ref = attrs.get('src') if tag == 'img' else attrs.get('href')
        if ref and (tag in ('img', 'link') or (tag == 'a' and ref.startswith('gvm/'))):
            self.assets.add(ref)


def metrics_files(source):
    html = source.read_text(encoding='utf-8')
    html = html.replace('../../assets/logos/zuri-wordmark.svg', 'assets/logos/zuri-wordmark.svg')
    html = html.replace('campaign-mission-control/dist/index.html?view=1&amp;tab=', '/?view=1&amp;tab=')
    if '127.0.0.1:4319' in html or '127.0.0.1:4321' in html:
        raise ValueError('Local preview link in deployable guide')
    files = {'metrics/index.html': html.encode('utf-8')}
    refs = References()
    refs.feed(html)
    queue = list(refs.assets)
    while queue:
        ref = queue.pop()
        if urlsplit(ref).scheme or ref.startswith(('/', '#')):
            raise ValueError(f'Expected bundled guide asset: {ref}')
        relative = unquote(urlsplit(ref).path)
        target = within(Path('metrics'), relative).relative_to(Path('metrics').resolve()).as_posix()
        key = 'metrics/' + target
        if key in files:
            continue
        origin = ROOT / target if target == 'assets/logos/zuri-wordmark.svg' else within(source.parent, target)
        if not (target.startswith('assets/') or target.startswith('gvm/')):
            raise ValueError(f'Unapproved asset: {target}')
        files[key] = origin.read_bytes()
        if origin.suffix == '.css':
            for dependency in re.findall(r'url\([\"\']?([^\"\')]+)', files[key].decode('utf-8')):
                if urlsplit(dependency).scheme:
                    raise ValueError('Guide fonts must be bundled')
                queue.append((Path(target).parent / dependency).as_posix())
    for license_file in (source.parent / 'assets/fonts').glob('*-OFL.txt'):
        files['metrics/assets/fonts/' + license_file.name] = license_file.read_bytes()
    return files


def write_package(output, files):
    previous = output / 'site-build.json'
    old = json.loads(previous.read_text(encoding='utf-8'))['files'] if previous.exists() else {}
    for name in old:
        within(output, name)
    existing = {p.relative_to(output).as_posix() for p in output.rglob('*') if p.is_file()} if output.exists() else set()
    unexpected = existing - set(old) - {'site-build.json'}
    if unexpected:
        raise ValueError(f'Refusing package with untracked files: {sorted(unexpected)}')
    for name, data in files.items():
        path = within(output, name)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
    for name in set(old) - set(files):
        within(output, name).unlink(missing_ok=True)
    manifest = {'version': 1, 'appId': APP_ID, 'files': {name: digest(data) for name, data in sorted(files.items())}}
    previous.write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    for name, expected in manifest['files'].items():
        if digest(within(output, name).read_bytes()) != expected:
            raise ValueError(f'Packaged hash mismatch: {name}')
    return manifest


def main():
    files = app_files(APPS / 'web/dist')
    files.update(metrics_files(APPS / 'metrics/index.html'))
    manifest = write_package(ROOT / 'build/site', files)
    print(json.dumps({'files': len(files), 'bytes': sum(map(len, files.values())), 'appId': manifest['appId']}))


if __name__ == '__main__':
    main()
