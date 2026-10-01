"""generate-views: compare the hand-maintained indexes with the metadata they are views of (STD-003 R2).

    python scripts/docs/generate_views.py [--check] [--root DIR]

Views checked: the doc-map block of docs/README.md (features, domains, services) and the feature-index block of every
docs/domains/<slug>/README.md (classification, owned features, participating parts, hosting services). Sources are
feature.md and part frontmatter, registry/domains.yaml, registry/services.yaml and SERVICE.md.

Only --check exists. A --write mode would have to rewrite the blocks in full, and those blocks hold approved authored text
that no metadata holds (release notes in Delivery cells, requirement tables, the DOM-WRK paragraph); --write refuses.
Exit status 1 when a view has drifted."""
import argparse
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import docslib as L  # noqa: E402


def block(text, name):
    m = re.search(rf'<!-- BEGIN GENERATED: {re.escape(name)} -->(.*?)<!-- END GENERATED', text, re.S)
    return m.group(1) if m else None


def cells(line):
    return [c.strip() for c in line.strip().strip('|').split('|')]


def tables(lines):
    """[(header names lowercased, [row cells])] for each pipe table in lines."""
    out, cur = [], None
    for l in lines:
        if l.lstrip().startswith('|'):
            if cur is None:
                cur = [cells(l)]
            elif not re.match(r'^\|\s*:?-', l.strip()):
                cur.append(cells(l))
        elif cur is not None:
            out.append(cur)
            cur = None
    if cur is not None:
        out.append(cur)
    return [([h.lower() for h in t[0]], t[1:]) for t in out]


def first_word(cell):
    m = re.match(r'[\w-]+', re.sub(r'[*_`]', '', cell))
    return m.group(0).lower() if m else ''


def derive(repo):
    """-> (features {id: doc}, owned {domain: [FEAT ids]}, parts {domain: [(FEAT id, part id)]}, hosts {domain: [SRV ids]})"""
    feats = repo.feature_docs()
    owned = {c: [] for c in repo.domains}
    parts = {c: [] for c in repo.domains}
    for i, d in sorted(feats.items()):
        owned.setdefault(d.get('owner'), []).append(i)
        for x in L.as_list(d.get('participants')) if isinstance(d.get('participants'), list) else []:
            if isinstance(x, dict) and x.get('domain') != d.get('owner'):
                parts.setdefault(x.get('domain'), []).append((i, x.get('part')))
    hosts = {c: [] for c in repo.domains}
    for doc in repo.docs.values():
        if doc.type == 'SRV':
            for c in L.as_list(doc.get('hosts')):
                hosts.setdefault(c, []).append(doc.id)
    return feats, owned, parts, {c: sorted(v) for c, v in hosts.items()}


def set_diff(listed, derived):
    return f'lists {sorted(listed)} but the metadata gives {sorted(derived)}'


# ------------------------------------------------------------------ docs/README.md
def check_doc_map(repo, out):
    where = 'docs/README.md'
    p = repo.root / where
    b = block(L.read_text(p), 'doc-map') if p.is_file() else None
    if b is None:
        out.append((where, 'no "BEGIN GENERATED: doc-map" block'))
        return
    feats, owned, _, _ = derive(repo)
    sections, cur = {}, None
    for l in b.splitlines():
        if l.startswith('## '):
            cur = l[3:].strip()
            sections[cur] = []
        elif cur:
            sections[cur].append(l)
    # Features
    rows = {}
    for head, body in tables(sections.get('Features', [])):
        for c in body:
            m = re.match(r'\[(FEAT-\d{3,})\]\(([^)]*)\)', c[0])
            if m:
                rows[m.group(1)] = (m.group(2), c, head)
    if set(rows) != set(feats):
        out.append((where, 'features table ' + set_diff(rows, feats)))
    for i, (link, c, head) in rows.items():
        d = feats.get(i)
        if d is None:
            continue
        want = {'feature': d.get('title'), 'owner': d.get('owner'), 'delivery': d.get('delivery')}
        for key, v in want.items():
            if key in head and c[head.index(key)] != v:
                out.append((where, f'{i}: {key} is {c[head.index(key)]!r}, feature.md says {v!r}'))
        if link != d.rel[len('docs/'):]:
            out.append((where, f'{i}: links to {link}, the file is {d.rel[len("docs/"):]}'))
    # Domains
    rows = {}
    for head, body in tables(sections.get('Domains', [])):
        for c in body:
            m = re.match(r'\[(DOM-[A-Z]+)\]\(([^)]*)\)', c[0])
            if m:
                rows[m.group(1)] = (m.group(2), c, head)
    live = {c for c, d in repo.domains.items() if d.get('status') != 'superseded'}
    if set(rows) != live:
        out.append((where, 'domains table ' + set_diff(rows, live)))
    for code, (link, c, head) in rows.items():
        d = repo.domains.get(code)
        if d is None:
            continue
        if link != f"domains/{d.get('slug')}/README.md":
            out.append((where, f"{code}: links to {link}, the README is domains/{d.get('slug')}/README.md"))
        if 'domain' in head and c[head.index('domain')] != d.get('name'):
            out.append((where, f"{code}: name is {c[head.index('domain')]!r}, registry says {d.get('name')!r}"))
        want = f"{d.get('subdomain')} / {d.get('role')}"
        for h in head:
            if h.startswith('subdomain') and c[head.index(h)] != want:
                out.append((where, f'{code}: classification is {c[head.index(h)]!r}, registry says {want!r}'))
        if 'features' in head:
            listed = set(re.findall(r'FEAT-\d{3,}', c[head.index('features')]))
            if listed != set(owned.get(code, [])):
                out.append((where, f'{code}: features ' + set_diff(listed, owned.get(code, []))))
    # Services
    rows = {}
    for head, body in tables(sections.get('Services', [])):
        for c in body:
            m = re.match(r'\[(SRV-\d{3,})\]\(([^)]*)\)', c[0])
            if m:
                rows[m.group(1)] = (m.group(2), c, head)
    if set(rows) != set(repo.services):
        out.append((where, 'services table ' + set_diff(rows, repo.services)))
    for sid, (link, c, head) in rows.items():
        s = repo.services.get(sid)
        if s is None:
            continue
        if link != f"services/{sid}-{s.get('slug')}/SERVICE.md":
            out.append((where, f'{sid}: links to {link}'))
        if 'service' in head and c[head.index('service')] != s.get('name'):
            out.append((where, f"{sid}: name is {c[head.index('service')]!r}, registry says {s.get('name')!r}"))
        if 'deploy unit' in head and c[head.index('deploy unit')].replace('`', '') != (s.get('deploy_unit') or '').replace('`', ''):
            out.append((where, f'{sid}: deploy unit differs from registry/services.yaml'))


# ------------------------------------------------------------------ domain READMEs
def sections_of(b):
    """Split a feature-index block into {bold heading: lines} (a heading line starts with **Name**)."""
    out, cur = {}, None
    for l in b.splitlines():
        m = re.match(r'\*\*([^*]+)\*\*', l)
        if m:
            cur = m.group(1).strip()
            out[cur] = [l]
        elif cur:
            out[cur].append(l)
    return out


def check_domain(repo, code, feats, owned, parts, hosts, out):
    d = repo.domains[code]
    where = f"docs/domains/{d.get('slug')}/README.md"
    doc = repo.docs.get(where)
    b = block(doc.text, 'feature-index') if doc else None
    if b is None:
        out.append((where, 'no "BEGIN GENERATED: feature-index" block'))
        return
    sec = sections_of(b)
    superseded = d.get('status') == 'superseded'
    cls = ' '.join(sec.get('Classification', []))
    if superseded:
        if 'superseded' not in cls:
            out.append((where, 'classification should say the domain is superseded'))
    else:
        m = re.search(r'subdomain `(\w+)` · role `(\w+)`', cls)
        if not m or (m.group(1), m.group(2)) != (d.get('subdomain'), d.get('role')):
            out.append((where, f"classification differs from registry ({d.get('subdomain')} / {d.get('role')})"))
    # owned features
    lines = sec.get('Owned features', [])
    listed = {}
    for head, body in tables(lines):
        for c in body:
            m = re.search(r'FEAT-\d{3,}\b', c[0])
            if m:
                listed[m.group(0)] = first_word(c[head.index('delivery')]) if 'delivery' in head else None
    if set(listed) != set(owned.get(code, [])):
        out.append((where, 'owned features ' + set_diff(listed, owned.get(code, []))))
    for i, dv in listed.items():
        if i in feats and dv is not None and dv != feats[i].get('delivery'):
            out.append((where, f"{i}: delivery is {dv!r}, feature.md says {feats[i].get('delivery')!r}"))
    # participating parts
    lines = sec.get('Participating cross-domain features', [])
    listed = {}
    for head, body in tables(lines):
        for c in body:
            pm = re.search(r'FEAT-\d{3,}-P\d{2}', c[head.index('part')]) if 'part' in head else None
            fm = re.search(r'FEAT-\d{3,}\b', c[0])
            if fm and pm:
                listed[(fm.group(0), pm.group(0))] = first_word(c[head.index('delivery')]) if 'delivery' in head else None
    want = {tuple(x) for x in parts.get(code, [])}
    if set(listed) != want:
        out.append((where, 'participating parts ' + set_diff([f'{a}/{b_}' for a, b_ in listed], [f'{a}/{b_}' for a, b_ in want])))
    for (f, pt), dv in listed.items():
        pd = repo.docs.get(repo.decl.get(pt, ''))
        if pd is not None and dv is not None and dv != pd.get('delivery'):
            out.append((where, f"{pt}: delivery is {dv!r}, the part says {pd.get('delivery')!r}"))
    # hosting services
    got = set(re.findall(r'\[(SRV-\d{3,})\]', ' '.join(sec.get('Services that host it', []))))
    if got != set(hosts.get(code, [])):
        out.append((where, 'services ' + set_diff(got, hosts.get(code, []))))
    # requirement links in the block must name the requirement they point at
    for m in re.finditer(r'\[((?:FR|NFR)-\d{3,}(?:-\d{3,})?)\]\(([^)]*)\)', b):
        rid, link = m.group(1), m.group(2)
        if rid not in repo.decl:
            out.append((where, f'{rid} is not a declared requirement'))
        elif not Path(link.split('#')[0]).name.startswith(rid + '-'):
            out.append((where, f'{rid} links to {link}'))


def check(repo):
    """-> [(file, message)] for every view that differs from its metadata."""
    out = []
    check_doc_map(repo, out)
    feats, owned, parts, hosts = derive(repo)
    for code in sorted(repo.domains):
        check_domain(repo, code, feats, owned, parts, hosts, out)
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--root', default=str(L.ROOT))
    ap.add_argument('--check', action='store_true', help='report drift (the default and the only mode)')
    ap.add_argument('--write', action='store_true', help='not implemented: it would rewrite approved authored text')
    args = ap.parse_args(argv)
    L.console()
    if args.write:
        print('generate-views --write is not implemented: the doc-map and feature-index blocks contain approved authored text '
              '(release notes in cells, requirement tables, the DOM-WRK paragraph) that no metadata holds, and a rewrite would '
              'remove it. Use --check and edit the blocks by hand.', file=sys.stderr)
        return 2
    repo = L.load_repo(args.root)
    drift = check(repo)
    for where, msg in drift:
        print(f'DRIFT   {where}: {msg}')
    print(f'generate-views --check: {len(repo.domains) + 1} views, {len(drift)} drift finding(s)')
    return 1 if drift else 0


if __name__ == '__main__':
    sys.exit(main())
