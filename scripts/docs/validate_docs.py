"""validate-docs: check the documentation against STD-001..003 (frontmatter, IDs, relations, requirements, links, views).

    python scripts/docs/validate_docs.py [--root DIR] [--strict-trace] [--errors-only]

Exit status 1 when an error is found, 0 otherwise. Warnings: links annotated as historical, recorded gaps of the
approved standards (ADR-001 D8), a BOM, and requirements without a `verifies` edge until --strict-trace (PLAN-001 WI-08)."""
import argparse
import os
import re
import sys
from pathlib import Path, PurePosixPath
from urllib.parse import unquote

sys.path.insert(0, str(Path(__file__).resolve().parent))
import docslib as L  # noqa: E402
import generate_views  # noqa: E402
from docslib import as_list  # noqa: E402

FILENAME_ID = re.compile(r'^((?:FR|NFR|ARCH|RB|BRD|PRD|STD|PROC|PLAN|CAP|SRV)-\d{3,}(?:-\d{3,})?)-')
REQ_HEAD = re.compile(r'^#{1,6}\s+((?:FR|NFR)-\d{3,}(?:-\d{3,})?)\s+—')
SECRET = re.compile(r'postgres(?:ql)?://[^\s:@/<>*]+:(?!<|\*|password|PASSWORD|xxx|\$)[^\s@/]+@|BEGIN [A-Z ]*PRIVATE KEY|\bsk-[A-Za-z0-9]{20,}')
TRACE = re.compile(r'@trace\s+(\w+)\s+((?:[A-Z][\w-]*)(?:\s*,\s*[A-Z][\w-]*)*)')


def parts_of(rel):
    return PurePosixPath(rel).parts


# ------------------------------------------------------------------ registry
def check_registry(repo):
    r = repo.report
    seen_slug = set()
    for d in repo.domain_rows:
        code = d.get('code', '')
        where = 'registry/domains.yaml'
        if [x.get('code') for x in repo.domain_rows].count(code) > 1:
            r.error(where, 'registry', f'{code} is registered twice')
        if not re.match(r'^DOM-[A-Z]{2,6}$', code):
            r.error(where, 'registry', f'domain code {code!r} does not match DOM-<CODE>')
        slug = d.get('slug', '')
        if not slug or slug in seen_slug:
            r.error(where, 'registry', f'{code}: slug {slug!r} is empty or used twice')
        seen_slug.add(slug)
        if d.get('subdomain') not in L.SUBDOMAIN:
            r.error(where, 'registry', f"{code}: subdomain {d.get('subdomain')!r} is not core | supporting | generic")
        if d.get('role') not in L.ROLE:
            r.error(where, 'registry', f"{code}: role {d.get('role')!r} is not foundation | business | platform")
        for key in ('supersedes', 'superseded_by'):
            for t in as_list(d.get(key)):
                if t not in repo.domains:
                    r.error(where, 'registry', f'{code}: {key} {t} is not a registered domain')
        if d.get('status') == 'superseded' and not as_list(d.get('superseded_by')):
            r.error(where, 'registry', f'{code}: superseded without superseded_by')
        readme = repo.docs.get(f'docs/domains/{slug}/README.md')
        if not readme or readme.id != code:
            r.error(where, 'registry', f'{code}: no declaring docs/domains/{slug}/README.md with id {code}')
    seen = set()
    for s in repo.service_rows:
        sid, slug, where = s.get('id', ''), s.get('slug', ''), 'registry/services.yaml'
        if not re.match(r'^SRV-\d{3,}$', sid) or sid in seen:
            r.error(where, 'registry', f'service id {sid!r} does not match SRV-<nnn> or is used twice')
        seen.add(sid)
        doc = repo.docs.get(f'docs/services/{sid}-{slug}/SERVICE.md')
        if not doc or doc.id != sid:
            r.error(where, 'registry', f'{sid}: no declaring docs/services/{sid}-{slug}/SERVICE.md with id {sid}')
        if not s.get('deploy_unit'):
            r.error(where, 'registry', f'{sid}: deploy_unit is empty')
        for root in as_list(s.get('code_roots')):
            if not (repo.root / root).is_dir():
                r.error(where, 'registry', f'{sid}: code root {root} does not exist')


# ------------------------------------------------------------------ one document
def check_doc(repo, doc):
    r, rel = repo.report, doc.rel
    m = FILENAME_ID.match(PurePosixPath(rel).name)
    if m and doc.id != m.group(1):
        r.error(rel, 'filename-id', f'file name starts with {m.group(1)} but the frontmatter id is {doc.id!r} (STD-002 R2)')
    if doc.bom:
        r.error(rel, 'bom', 'starts with a UTF-8 BOM, so a parser that needs --- at byte 0 does not see the frontmatter')
    if not doc.id:
        return
    i, t, fm = doc.id, doc.type, doc.fm
    st, dv = fm.get('status'), fm.get('delivery')
    if st and st not in L.STATUS:
        r.error(rel, 'status', f'status {st!r} is not in STD-001 R6')
    if dv and dv not in L.DELIVERY:
        r.error(rel, 'delivery', f'delivery {dv!r} is not in STD-001 R6')
    owner = fm.get('owner')
    if owner and owner != 'governance':
        if owner not in repo.domains:
            r.error(rel, 'owner', f'owner {owner} is not a registered domain')
        elif repo.domains[owner].get('status') == 'superseded':
            r.error(rel, 'owner', f'owner {owner} is a superseded domain')
        if t not in L.OWNED_TYPES:
            r.error(rel, 'owner', f'owned_by is not allowed from {t} (STD-002 R4)')
    rt = fm.get('runtime')
    if rt and rt not in repo.services:
        r.error(rel, 'runtime', f'runtime {rt} is not a registered service')
    p = parts_of(rel)
    if t == 'DOM':
        slug = repo.domains.get(i, {}).get('slug')
        if i not in repo.domains:
            r.error(rel, 'registry', f'{i} is not registered in registry/domains.yaml')
        elif p[-2:] != (slug, 'README.md'):
            r.error(rel, 'location', 'domain README must sit at docs/domains/<slug>/README.md matching the registry slug')
    elif t == 'SRV':
        slug = repo.services.get(i, {}).get('slug')
        if i not in repo.services:
            r.error(rel, 'registry', f'{i} is not registered in registry/services.yaml')
        elif p[-2:] != (f'{i}-{slug}', 'SERVICE.md'):
            r.error(rel, 'location', 'SERVICE.md must sit at docs/services/<SRV-ID>-<slug>/')
        for d in as_list(fm.get('hosts')):
            if d not in repo.domains:
                r.error(rel, 'service', f'hosts {d} is not a registered domain')
            elif repo.domains[d].get('status') == 'superseded':
                r.error(rel, 'service', f'hosts the superseded domain {d}')
        for f in as_list(fm.get('implements')):
            if L.id_type(f) != 'FEAT' or f not in repo.decl:
                r.error(rel, 'service', f'implements {f} is not a declared FEAT')
    elif t == 'SDD':
        n = i.split('-')[1]
        if not (len(p) == 4 and p[3] == 'design.md' and p[2].startswith(f'FEAT-{n}-')):
            r.error(rel, 'location', 'SDD-<f> must be design.md inside its FEAT-<f>-<slug> folder')
        if f'FEAT-{n}' not in repo.decl:
            r.error(rel, 'location', f'SDD refers to the undeclared FEAT-{n}')
    elif t == 'NFR' and i.count('-') == 1:
        if not rel.startswith('docs/architecture/requirements/'):
            r.error(rel, 'location', 'a system-level NFR sits in docs/architecture/requirements/ (STD-003 R1)')
    elif t in ('ARCH', 'RB') and not PurePosixPath(rel).name.startswith(i + '-'):
        r.error(rel, 'filename-id', f'file name must start with {i}')
    if t in ('FEAT', 'PART', 'FR', 'NFR', 'SDD') and not rel.startswith('docs/features/') and not (
            t == 'NFR' and i.count('-') == 1):
        r.error(rel, 'location', f'{t} files live in docs/features/ (STD-003 R6)')
    for key in ('legacy', 'relations'):
        v = fm.get(key)
        if v is not None and not isinstance(v, list if key == 'legacy' else dict):
            r.error(rel, 'frontmatter', f'{key} has the wrong shape')


# ------------------------------------------------------------------ features, parts, requirements
def check_features(repo):
    r = repo.report
    fdir = repo.root / 'docs' / 'features'
    for d in sorted(fdir.iterdir()) if fdir.is_dir() else []:
        if d.is_dir() and not (d / 'feature.md').is_file():
            r.error(f'docs/features/{d.name}', 'feature-folder', 'feature folder without feature.md (STD-003 R3)')
    for rel, doc in sorted(repo.docs.items()):
        if doc.type == 'FEAT':
            check_feature(repo, doc)
        elif doc.type == 'PART':
            check_part(repo, doc)
        elif doc.type in ('FR', 'NFR'):
            check_requirement(repo, doc)
    for rel, doc in sorted(repo.docs.items()):
        p = parts_of(rel)
        if len(p) >= 5 and p[1] == 'features' and p[3] == 'requirements' and doc.type not in ('FR', 'NFR'):
            r.error(rel, 'requirement', 'a file in requirements/ declares no FR or NFR id (STD-003 R3)')
        if len(p) >= 5 and p[1] == 'features' and p[3] == 'parts' and doc.type != 'PART':
            r.error(rel, 'location', 'a file in parts/ declares no feature-part id (STD-003 R3)')


def check_feature(repo, doc):
    r, rel, fm, i = repo.report, doc.rel, doc.fm, doc.id
    p = parts_of(rel)
    if not (len(p) == 4 and p[2].startswith(i + '-') and p[3] == 'feature.md' and re.match(r'^FEAT-\d{3,}-[a-z0-9-]+$', p[2])):
        r.error(rel, 'location', 'feature.md must sit at docs/features/<FEAT-ID>-<slug>/feature.md')
    if not fm.get('owner'):
        r.error(rel, 'owner', 'FEAT without owner (STD-002 R8.5)')
    if fm.get('type') not in ('domain-feature', 'cross-domain-feature'):
        r.error(rel, 'feature', f"type {fm.get('type')!r} is not domain-feature | cross-domain-feature")
    if not fm.get('runtime'):
        r.error(rel, 'runtime', 'FEAT without runtime (STD-001 R4)')
    plist = fm.get('participants')
    if fm.get('type') == 'cross-domain-feature':
        if not isinstance(plist, list) or len(plist) < 2 or not all(isinstance(x, dict) for x in plist):
            r.error(rel, 'participants', 'a cross-domain feature needs >= 2 participants naming a domain and a part (STD-002 R8.8)')
            plist = []
        for x in plist:
            part = x.get('part')
            if x.get('domain') not in repo.domains:
                r.error(rel, 'participants', f"participant domain {x.get('domain')} is not registered")
            if part not in repo.decl or L.id_type(part) != 'PART' or not str(part).startswith(i + '-'):
                r.error(rel, 'participants', f'participant part {part} has no part file of {i}')
            elif repo.docs[repo.decl[part]].get('owner') != x.get('domain'):
                r.error(rel, 'participants', f"part {part} is owned by {repo.docs[repo.decl[part]].get('owner')}, not {x.get('domain')}")
        if plist and not any(x.get('domain') == fm.get('owner') for x in plist):
            r.error(rel, 'participants', 'the feature owner must own one of the parts')
    elif plist:
        r.error(rel, 'participants', 'participants belong to a cross-domain feature only')
    folder = f'docs/features/{p[2]}/' if len(p) > 2 else ''
    for rel2, d2 in repo.docs.items():
        if d2.type == 'PART' and rel2.startswith(folder) and fm.get('type') != 'cross-domain-feature':
            r.error(rel2, 'location', 'parts exist only for a cross-domain feature (STD-003 R3)')
        elif d2.type == 'PART' and rel2.startswith(folder) and d2.id not in {x.get('part') for x in plist}:
            r.error(rel2, 'participants', f'{d2.id} is not listed in the participants of {i}')
    if fm.get('delivery') == 'live':
        if not any(k.startswith(folder + 'requirements/') for k in repo.docs):
            r.error(rel, 'live', 'delivery live without FR/AC/TC files (STD-001 R7)')


def check_part(repo, doc):
    r, rel, i = repo.report, doc.rel, doc.id
    p = parts_of(rel)
    feat = '-'.join(i.split('-')[:2])
    if not (len(p) == 5 and p[1] == 'features' and p[2].startswith(feat + '-') and p[3] == 'parts'
            and p[4].startswith(i.split('-')[-1] + '-')):
        r.error(rel, 'location', 'part must sit at docs/features/<FEAT-ID>-<slug>/parts/<Pnn>-<slug>.md')
    if not doc.get('owner'):
        r.error(rel, 'owner', 'part without owner (STD-002 R8.5)')
    if feat not in repo.decl:
        r.error(rel, 'location', f'part of the undeclared {feat}')


def section(body, title):
    """Text of the '## title' section (up to the next '## ' heading), or None."""
    m = re.search(rf'^##\s+{re.escape(title)}\s*$', body, re.M)
    if not m:
        return None
    rest = body[m.end():]
    n = re.search(r'^##\s', rest, re.M)
    return rest[:n.start()] if n else rest


def check_requirement(repo, doc):
    r, rel, fm, i, t = repo.report, doc.rel, doc.fm, doc.id, doc.type
    num = i.split('-')[1]
    p = parts_of(rel)
    system = t == 'NFR' and i.count('-') == 1
    if not system and not (len(p) == 5 and p[1] == 'features' and p[2].startswith(f'FEAT-{num}-') and p[3] == 'requirements'
                           and p[4].startswith(i + '-')):
        r.error(rel, 'location', 'requirement must sit at docs/features/FEAT-<f>-<slug>/requirements/<ID>-<slug>.md')
    others = {m.group(1) for line in doc.body.splitlines() for m in [REQ_HEAD.match(line)] if m} - {i}
    if others:
        r.error(rel, 'one-per-file', f'one requirement per file (STD-003 R3): also declares {sorted(others)}')
    feat = repo.docs.get(repo.decl.get(f'FEAT-{num}', ''))
    part = fm.get('part')
    if part:
        if part not in repo.decl or L.id_type(part) != 'PART' or not part.startswith(f'FEAT-{num}-P'):
            r.error(rel, 'part', f'part {part} does not resolve within FEAT-{num}')
        elif fm.get('owner') and repo.docs[repo.decl[part]].get('owner') != fm.get('owner'):
            r.error(rel, 'part', f"owner {fm.get('owner')} differs from the owner of {part}")
        if feat and feat.get('type') != 'cross-domain-feature':
            r.error(rel, 'part', 'part is for requirements of a cross-domain feature')
    elif feat and feat.get('type') == 'cross-domain-feature':
        r.error(rel, 'part', f'a requirement of the cross-domain feature FEAT-{num} names its part')
    if not system and feat is None:
        r.error(rel, 'location', f'requirement of the undeclared FEAT-{num}')
    items = [m.group(1) for _, line in L.unfenced_lines(doc.body) for m in [L.AC_ITEM.match(line)] if m]
    if t == 'NFR':
        if items:
            r.error(rel, 'ac', 'AC IDs belong to an FR only (STD-002 R1); an NFR carries a ## Measurement')
        meas = section(doc.body, 'Measurement')
        if meas is None or not meas.strip():
            r.error(rel, 'measurement', 'an NFR has a non-empty "## Measurement" section (STD-001 R7)')
    else:
        if not items:
            r.error(rel, 'ac', 'an FR has at least one acceptance criterion (STD-001 R5)')
        for n, ac in enumerate(items, 1):
            if L.id_type(ac) != 'AC':
                r.error(rel, 'ac', f'{ac} does not match AC-<f>-<fr>-<nn> (STD-002 R1)')
            elif ac != f'AC-{i.split("-", 1)[1]}-{n:02d}':
                r.error(rel, 'ac', f'acceptance criterion {ac} is out of sequence (expected AC-{i.split("-", 1)[1]}-{n:02d})')
    if not re.search(r'\bSHALL\b', doc.body):
        r.error(rel, 'shall', 'the requirement statement has no SHALL')


# ------------------------------------------------------------------ relations and traceability
def code_traces(repo):
    """[(code file, relation, [ids])] from `@trace <relation> <ID>, <ID>` tags in code."""
    out = []
    for rel, p in L.walk(repo.root, L.CODE_EXT):
        try:
            if p.stat().st_size > 2_000_000:
                continue
            text = L.read_text(p)
        except (OSError, UnicodeDecodeError):
            continue
        if '@trace' not in text:
            continue
        for m in TRACE.finditer(text):
            out.append((rel, m.group(1), [x.strip() for x in m.group(2).split(',')]))
    return out


def edges(repo):
    """[(source id or 'CODE', source type, relation, target, where)]"""
    out = []
    for rel, doc in repo.docs.items():
        if doc.id and isinstance(doc.get('relations'), dict):
            for name, targets in doc.get('relations').items():
                out += [(doc.id, doc.type, name, tg, rel) for tg in as_list(targets)]
    for h in repo.heads:
        for name, targets in h.relations:
            out += [(h.id, L.id_type(h.id), name, tg, h.rel) for tg in targets]
    for rel, name, targets in code_traces(repo):
        out += [(rel, 'CODE', name, tg, rel) for tg in targets]
    return out


def check_relations(repo):
    r, known = repo.report, repo.known
    es = edges(repo)
    for src, st, name, tg, where in es:
        who = f'{src}: ' if st != 'CODE' else '@trace: '
        if name in L.NOT_WRITTEN:
            r.error(where, 'relation-name', f'{who}{name} is never written ({L.NOT_WRITTEN[name]}, STD-002 R4/R5)')
            continue
        if name not in L.WRITTEN:
            r.error(where, 'relation-name', f'{who}relation {name!r} is not in STD-002 R4')
            continue
        if tg not in known:
            r.error(where, 'relation-dangling', f'{who}{name} {tg} does not resolve')
            continue
        sa, ta = L.WRITTEN[name]
        tt = L.id_type(tg) or ('DOM' if tg in repo.domains else 'SRV' if tg in repo.services else None)
        if sa == 'same':
            if st != tt:
                r.error(where, 'relation-type', f'{who}{name} stays within one type ({src} -> {tg})')
            else:
                td = repo.docs.get(repo.decl.get(tg, ''))
                gone = td is not None and (td.get('status') in ('superseded', 'retired') or td.get('delivery') == 'retired')
                if td is not None and not gone:
                    r.warn(where, 'supersedes-live', f'{who}supersedes {tg}, which is neither superseded nor retired')
            continue
        if sa is not None and st not in sa:
            r.error(where, 'relation-type', f'{who}{name} is not allowed from {st} ({src} -> {tg})')
        if ta is not None and tt not in ta:
            r.error(where, 'relation-type', f'{who}{name} is not allowed to {tt} ({src} -> {tg})')
    return es


def check_traceability(repo, es, strict):
    r = repo.report
    verified = set()
    for src, st, name, tg, where in es:
        if name == 'verifies':
            verified.add(tg)
            if L.id_type(tg) == 'AC':
                verified.add('FR-' + tg.split('-', 1)[1].rsplit('-', 1)[0])
    for h in repo.heads:
        if L.id_type(h.id) != 'TC':
            continue
        p = parts_of(h.rel)
        if not (len(p) == 4 and p[1] == 'features' and p[3] == 'verification.md' and p[2].startswith(f'FEAT-{h.id.split("-")[1]}-')):
            r.error(h.rel, 'tc', f'{h.id} must be declared in verification.md of its feature (STD-003 R3)')
        if not any(n == 'verifies' for n, _ in h.relations):
            r.error(h.rel, 'tc', f'{h.id} has no "Relations: verifies: ..." line')
        if not h.tests:
            r.error(h.rel, 'tc', f'{h.id} is bound to no test file (a "Test: `path`" line)')
        for t in h.tests:
            path = re.split(r'::|#|:\d', t)[0]
            if not repo.exists_exact(repo.root / path):
                r.error(h.rel, 'tc', f'{h.id}: test file {path} does not exist')
    feats = repo.feature_docs()
    for rel, doc in sorted(repo.docs.items()):
        if doc.type != 'FR' or doc.get('delivery') not in ('implemented', 'live') or doc.id in verified:
            continue
        feat = feats.get('FEAT-' + doc.id.split('-')[1])
        if feat is not None and feat.get('delivery') == 'live':
            r.error(rel, 'live-unverified', f'{doc.id} has no verifies edge, but its feature is live (STD-001 R7)')
        elif strict:
            r.error(rel, 'fr-unverified', f'{doc.id} is {doc.get("delivery")} without a verifies edge (STD-002 R8.6)')
        else:
            r.warn(rel, 'fr-unverified', f'{doc.id} is {doc.get("delivery")} without a verifies edge (STD-002 R8.6; PLAN-001 WI-08)')


# ------------------------------------------------------------------ crosswalk
def check_crosswalk(repo):
    r, known = repo.report, repo.known
    by_legacy = {}
    for row in repo.crosswalk:
        where = row['_file']
        legacy, new = (row.get('legacy_id') or '').strip(), (row.get('new_id') or '').strip()
        if not legacy:
            r.error(where, 'crosswalk', 'a row has an empty legacy_id')
        by_legacy.setdefault(legacy, set()).add(new)
        if new and new not in known:
            r.error(where, 'crosswalk', f'{legacy} -> {new} does not resolve')
        m = re.match(r'^(\S+) -> ([^\s;]+)', row.get('note') or '')
        if m and row.get('disposition') in ('moved', 'renamed') and m.group(2).startswith(('docs/', 'registry/')):
            if not repo.exists_exact(repo.root / m.group(2)):
                r.error(where, 'crosswalk', f'{legacy}: moved to {m.group(2)}, which does not exist')
    for rel, doc in repo.docs.items():
        for lg in as_list(doc.get('legacy')) if doc.id else []:
            if lg not in by_legacy:
                r.error(rel, 'crosswalk', f'legacy {lg} is not in the crosswalk')
            elif doc.id not in by_legacy[lg]:
                r.error(rel, 'crosswalk', f'legacy {lg} maps to {sorted(by_legacy[lg])} in the crosswalk, not {doc.id}')


# ------------------------------------------------------------------ links
def check_links(repo):
    r = repo.report
    cache, total = {}, 0
    for rel, p in L.walk(repo.root, ('.md',)):
        text = L.read_text(p)
        for n, target, tail in L.iter_links(text):
            if L.is_external(target):
                continue
            path, frag = L.split_target(target)
            total += 1
            dest = p if not path else Path(os.path.normpath(p.parent / unquote(path)))
            if not repo.exists_exact(dest):
                msg = f'line {n}: link {target} does not resolve'
                if L.HISTORICAL.match(tail):
                    r.warn(rel, 'link-historical', msg + ' (annotated as a historical link)')
                else:
                    r.error(rel, 'link', msg)
                continue
            if frag and dest.suffix == '.md' and dest.is_file():
                if dest not in cache:
                    cache[dest] = L.anchors_of(L.read_text(dest))
                if unquote(frag).lower() not in cache[dest]:
                    r.error(rel, 'anchor', f'line {n}: link {target} names a heading that does not exist')
    repo.link_count = total


def check_private(repo):
    for rel, p in L.walk(repo.root / 'docs', ('.md',)):
        for n, line in enumerate(L.read_text(p).splitlines(), 1):
            if SECRET.search(line):
                repo.report.error(f'docs/{rel}', 'private', f'line {n}: a credential-like value must not be written in documents')


# ------------------------------------------------------------------ views
def check_views(repo):
    for where, msg in generate_views.check(repo):
        repo.report.error(where, 'view-drift', msg)


# ------------------------------------------------------------------ driver
def validate(root=L.ROOT, strict_trace=False):
    repo = L.load_repo(root)
    repo.link_count = 0
    check_registry(repo)
    for doc in sorted(repo.docs.values(), key=lambda d: d.rel):
        check_doc(repo, doc)
    check_features(repo)
    es = check_relations(repo)
    check_traceability(repo, es, strict_trace)
    check_crosswalk(repo)
    check_links(repo)
    check_private(repo)
    check_views(repo)
    return repo


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--root', default=str(L.ROOT))
    ap.add_argument('--strict-trace', action='store_true', help='a requirement without a verifies edge is an error')
    ap.add_argument('--errors-only', action='store_true', help='do not print warnings')
    args = ap.parse_args(argv)
    L.console()
    repo = validate(args.root, args.strict_trace)
    rep = repo.report
    kinds = {}
    for _, _, code, _ in rep.warnings:
        kinds[code] = kinds.get(code, 0) + 1
    print(f'validate-docs: {len(repo.docs)} documents, {len(repo.decl)} declared ids, {len(repo.domains)} domains, '
          f'{len(repo.services)} services, {len(repo.crosswalk)} crosswalk rows, {repo.link_count} relative links')
    for level, where, code, msg in rep.items:
        if level == 'error' or not args.errors_only:
            print(f'{level.upper():7} [{code}] {where}: {msg}')
    print(f'\n{len(rep.errors)} error(s), {len(rep.warnings)} warning(s)' + (
        ' (' + ', '.join(f'{n} {k}' for k, n in sorted(kinds.items())) + ')' if kinds else ''))
    return 1 if rep.errors else 0


if __name__ == '__main__':
    sys.exit(main())
