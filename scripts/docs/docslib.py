"""Shared model of the documentation tooling: frontmatter, ID grammar (STD-002 R1), registry, declarations, links.

Everything is read from the working tree; nothing depends on git history. Used by next_id.py, validate_docs.py and
generate_views.py."""
import csv
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EXCLUDE_DIRS = {'node_modules', 'build', '.local', '.git', 'dist', '__pycache__', '.vercel', '.venv', 'venv'}
SKIP_PREFIXES = ('scripts/docs/tests/fixtures',)
ARTIFACT_DIRS = ('docs/features', 'docs/domains', 'docs/services', 'docs/architecture', 'docs/operations', 'docs/product',
                 'docs/governance')
CODE_EXT = ('.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.py', '.sql', '.ps1')

STANDALONE = ['FEAT', 'CAP', 'ADR', 'BR', 'SEC', 'API', 'EVT', 'CMP', 'SRV', 'RB', 'ARCH', 'BRD', 'PRD', 'STD', 'PROC', 'PLAN']
PATTERNS = [
    ('PART', re.compile(r'^FEAT-\d{3,}-P\d{2}$')),
    ('SDD', re.compile(r'^SDD-\d{3,}$')),
    ('FR', re.compile(r'^FR-\d{3,}-\d{3,}$')),
    ('NFR', re.compile(r'^NFR-(\d{3,}-\d{3,}|\d{3,})$')),
    ('AC', re.compile(r'^AC-\d{3,}-\d{3,}-\d{2,}$')),
    ('TC', re.compile(r'^TC-\d{3,}-\d{3,}$')),
    ('DOM', re.compile(r'^DOM-[A-Z]{2,6}$')),
] + [(t, re.compile(rf'^{t}-\d{{3,}}$')) for t in STANDALONE]

# STD-002 R4. Relations a document may write -> (allowed source types, allowed target types); None = any.
# 'same' = source and target type must be equal. part_of, owned_by, runtime and participates_in are inferred or metadata.
WRITTEN = {
    'depends_on': ({'FEAT', 'PART'}, {'FEAT', 'PART', 'API', 'EVT'}),
    'decided_by': (None, {'ADR'}),
    'specified_by': ({'FR', 'PART'}, {'SDD', 'API', 'EVT'}),
    'implements': ({'CMP', 'CODE'}, {'FR', 'NFR', 'API', 'EVT'}),
    'verifies': ({'TC', 'CODE'}, {'FR', 'AC', 'NFR'}),
    'exposes': ({'CMP', 'SRV', 'CODE'}, {'API', 'EVT'}),
    'consumes': ({'CMP', 'SRV', 'CODE'}, {'API', 'EVT'}),
    'derived_from': ({'FR', 'NFR'}, {'BRD', 'PRD', 'BR', 'FR'}),
    'supersedes': ('same', 'same'),
    'relates_to': (None, None),
}
NOT_WRITTEN = {'part_of': 'inferred from the ID', 'participates_in': 'derived from the part owners',
               'owned_by': 'written as owner:', 'runtime': 'written as runtime:'}
STATUS = {'draft', 'proposed', 'approved', 'superseded', 'retired'}
DELIVERY = {'declared', 'building', 'implemented', 'live', 'retired'}
SUBDOMAIN = {'core', 'supporting', 'generic'}
ROLE = {'foundation', 'business', 'platform'}
OWNED_TYPES = {'FEAT', 'PART', 'FR', 'API', 'EVT', 'CMP', 'ADR', 'BR'}


def console():
    """Never fail on a character the console cannot encode (Windows code pages)."""
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, 'reconfigure'):
            stream.reconfigure(errors='backslashreplace')


def as_list(v):
    return v if isinstance(v, list) else [v] if isinstance(v, str) and v else []


def id_type(i):
    for t, rx in PATTERNS:
        if rx.match(i or ''):
            return t
    return None


# ------------------------------------------------------------------ findings
# Recorded gaps of the approved standards (ADR-001 D8), reported as warnings so the tool can gate CI today.
GAP_PREFIXES = ('docs/governance/standards/', 'docs/governance/procedures/')


def known_gap(where, code, msg=''):
    if where.startswith(GAP_PREFIXES):
        if code == 'relation-type':
            return 'ADR-001 D8(f)'
        if code == 'relation-dangling' and 'ADR-100' in msg:
            return 'ADR-001 D8(a)'
        if code == 'bom':
            return 'ADR-001 D8(g)'
    return None


class Report:
    def __init__(self):
        self.items = []     # (level, where, code, message)

    def add(self, level, where, code, msg):
        gap = known_gap(where, code, msg) if level == 'error' else None
        if gap:
            level, msg = 'warning', f'{msg} [recorded gap, {gap}]'
        self.items.append((level, where, code, msg))

    def error(self, where, code, msg):
        self.add('error', where, code, msg)

    def warn(self, where, code, msg):
        self.add('warning', where, code, msg)

    @property
    def errors(self):
        return [i for i in self.items if i[0] == 'error']

    @property
    def warnings(self):
        return [i for i in self.items if i[0] == 'warning']

    def codes(self, level=None):
        return [i[2] for i in self.items if level in (None, i[0])]


# ------------------------------------------------------------------ frontmatter and registry (minimal YAML)
FM_RE = re.compile(r'\A---[ \t]*\r?\n(.*?)\r?\n---[ \t]*(?:\r?\n|\Z)', re.S)


def strip_comment(v):
    q = None
    for i, ch in enumerate(v):
        if q:
            q = None if ch == q else q
        elif ch in '"\'' and (i == 0 or v[i - 1] in ' \t[,'):
            q = ch
        elif ch == '#' and (i == 0 or v[i - 1] in ' \t'):
            return v[:i].rstrip()
    return v


def split_flow(s):
    out, cur, q = [], '', None
    for ch in s:
        if q:
            q = None if ch == q else q
            cur += ch
        elif ch in '"\'':
            q = ch
            cur += ch
        elif ch == ',':
            out.append(cur)
            cur = ''
        else:
            cur += ch
    return out + [cur] if cur.strip() else out


def scalar(v):
    v = strip_comment(v).strip()
    if len(v) >= 2 and v[0] == v[-1] and v[0] in '"\'':
        return v[1:-1]
    if v.startswith('[') and v.endswith(']'):
        return [scalar(x) for x in split_flow(v[1:-1])]
    return v


def parse_block(block):
    rows = [l for l in block if l.strip() and not l.lstrip().startswith('#')]
    if not rows:
        return {}
    if rows[0].lstrip().startswith('- '):
        items = []
        for l in rows:
            s = l.strip()
            if s.startswith('- '):
                s = s[2:]
                k, sep, v = s.partition(':')
                items.append({k.strip(): scalar(v)} if sep and (not v or v[:1] == ' ') else scalar(s))
            elif items and isinstance(items[-1], dict):
                k, _, v = s.partition(':')
                items[-1][k.strip()] = scalar(v)
        return items
    out = {}
    for l in rows:
        k, _, v = l.strip().partition(':')
        out[k.strip()] = scalar(v)
    return out


def parse_frontmatter(text):
    """-> (dict | None, body). Scalars, flow lists, one nested map, block lists of scalars or maps."""
    text = text.lstrip('﻿')
    m = FM_RE.match(text)
    if not m:
        return None, text
    lines, data, i = m.group(1).splitlines(), {}, 0
    while i < len(lines):
        line = lines[i]
        i += 1
        if not line.strip() or line[0] in ' \t#':
            continue
        key, sep, val = line.partition(':')
        if not sep:
            continue
        if strip_comment(val).strip():
            data[key.strip()] = scalar(val)
            continue
        block = []
        while i < len(lines) and (not lines[i].strip() or lines[i][0] in ' \t#'):
            block.append(lines[i])
            i += 1
        data[key.strip()] = parse_block(block)
    return data, text[m.end():]


def parse_registry(text):
    """registry/*.yaml: top-level keys each holding a list of flat maps -> {key: [dict, ...]}."""
    out, key, cur = {}, None, None
    for line in text.splitlines():
        s = line.strip()
        if not s or s.startswith('#'):
            continue
        if not line[0].isspace():
            key, cur = line.partition(':')[0].strip(), None
            out[key] = []
            continue
        if s.startswith('- '):
            cur = {}
            out.setdefault(key, []).append(cur)
            s = s[2:]
        k, _, v = s.partition(':')
        if cur is not None:
            cur[k.strip()] = scalar(v)
    return out


# ------------------------------------------------------------------ markdown helpers
FENCE = re.compile(r'^\s*(```|~~~)')
HEAD_DECL = re.compile(r'^#{2,4}\s+((?:ADR|BR|SEC|API|EVT)-\d{3,}|TC-\d{3,}-\d{3,})\s+—\s*(.*?)\s*$')
AC_ITEM = re.compile(r'^\s{0,3}[-*]\s+(AC-[\w-]+)\s+—')
INLINE = re.compile(r'(!?\[[^\]]*\]\()([^)\s]+)((?:\s+"[^"]*")?\))')
REFDEF = re.compile(r'^\s*\[[^\]]+\]:\s*(\S+)')
HISTORICAL = re.compile(r'^\s*\*?\(historical link')


def unfenced_lines(text):
    """-> [(line number, line)] outside fenced code."""
    out, inside = [], False
    for n, line in enumerate(text.splitlines(), 1):
        if FENCE.match(line):
            inside = not inside
        elif not inside:
            out.append((n, line))
    return out


def parse_relation_line(s):
    """'a: X, Y; b: Z' -> [('a', ['X', 'Y']), ('b', ['Z'])]"""
    out = []
    for part in s.split(';'):
        name, _, vals = part.partition(':')
        if name.strip():
            out.append((name.strip(), [v.strip() for v in vals.split(',') if v.strip()]))
    return out


def slugify(heading):
    s = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', heading).strip().lower()
    return re.sub(r'[^\w฀-๿\s-]', '', s).replace(' ', '-')


def anchors_of(text):
    out, seen = set(), {}
    for _, line in unfenced_lines(text):
        m = re.match(r'^#{1,6}\s+(.*?)\s*#*\s*$', line)
        if m:
            s = slugify(m.group(1))
            n = seen.get(s, 0)
            out.add(s if n == 0 else f'{s}-{n}')
            seen[s] = n + 1
    out.update(a.lower() for a in re.findall(r'<a\s[^>]*?(?:id|name)="([^"]+)"', text))
    return out


# ------------------------------------------------------------------ repository model
class Doc:
    def __init__(self, rel, text):
        self.rel = rel
        self.text = text
        self.bom = text.startswith('﻿')
        self.fm, self.body = parse_frontmatter(text)
        self.id = (self.fm or {}).get('id') if isinstance((self.fm or {}).get('id'), str) else None
        self.type = id_type(self.id) if self.id else None

    def get(self, key, default=None):
        return (self.fm or {}).get(key, default)


class Head:
    """A heading-declared artifact (ADR, TC, BR, SEC, API, EVT) with the lines of its block."""
    def __init__(self, id, rel, line, title, block):
        self.id, self.rel, self.line, self.title = id, rel, line, title
        self.relations, self.tests, self.legacy = [], [], []
        for l in block:
            if l.startswith('Relations:'):
                self.relations = parse_relation_line(l[10:])
            elif l.startswith('Legacy:'):
                self.legacy = [v.strip() for v in l[7:].split(',') if v.strip()]
            elif l.startswith('Test:'):
                self.tests = re.findall(r'`([^`]+)`', l[5:])


def read_text(path):
    return Path(path).read_bytes().decode('utf-8')


def walk(root, suffixes):
    """Yield (relative posix path, absolute Path) of files with a suffix, pruning EXCLUDE_DIRS and fixture trees."""
    root = Path(root)
    for dirpath, dirs, files in os.walk(root):
        dirs[:] = sorted(d for d in dirs if d not in EXCLUDE_DIRS
                         and not (Path(dirpath) / d).relative_to(root).as_posix().startswith(SKIP_PREFIXES))
        for f in sorted(files):
            if f.endswith(suffixes):
                p = Path(dirpath) / f
                yield p.relative_to(root).as_posix(), p


class Repo:
    def __init__(self, root=ROOT):
        self.root = Path(root)
        self.report = Report()
        self.docs, self.decl, self.heads, self.acs = {}, {}, [], {}
        self.domains, self.services, self.crosswalk = {}, {}, []
        self._dircache = {}
        self._load_registry()
        self._load_docs()

    # -- registry
    def _registry(self, name, key):
        p = self.root / 'registry' / name
        if not p.is_file():
            self.report.error(f'registry/{name}', 'registry', 'file is missing')
            return []
        return parse_registry(read_text(p)).get(key, [])

    def _load_registry(self):
        self.domain_rows = self._registry('domains.yaml', 'domains')
        self.service_rows = self._registry('services.yaml', 'services')
        for d in self.domain_rows:
            self.domains.setdefault(d.get('code', ''), d)
        for s in self.service_rows:
            self.services.setdefault(s.get('id', ''), s)
        p = self.root / 'registry' / 'crosswalk'
        for f in sorted(p.glob('*.csv')) if p.is_dir() else []:
            with open(f, encoding='utf-8', newline='') as fh:
                for row in csv.DictReader(fh):
                    row['_file'] = f'registry/crosswalk/{f.name}'
                    self.crosswalk.append(row)

    # -- documents and declarations
    def _declare(self, i, rel):
        if i in self.decl:
            self.report.error(rel, 'duplicate', f'{i} is declared twice (also {self.decl[i]})')
        else:
            self.decl[i] = rel

    def _load_docs(self):
        for rel, p in walk(self.root / 'docs', ('.md',)):
            rel = f'docs/{rel}'
            if not rel.startswith(ARTIFACT_DIRS):
                continue
            doc = Doc(rel, read_text(p))
            self.docs[rel] = doc
            if doc.id:
                if doc.type is None:
                    self.report.error(rel, 'id-grammar', f'id {doc.id!r} does not match STD-002 R1')
                self._declare(doc.id, rel)
            lines = unfenced_lines(doc.body)
            for idx, (n, line) in enumerate(lines):
                m = HEAD_DECL.match(line)
                if m:
                    block = []
                    for _, nxt in lines[idx + 1:]:
                        if not nxt.strip() or nxt.startswith('#'):
                            break
                        block.append(nxt)
                    h = Head(m.group(1), rel, n, m.group(2), block)
                    self.heads.append(h)
                    self._declare(h.id, rel)
                elif doc.type in ('FR',):
                    a = AC_ITEM.match(line)
                    if a:
                        self.acs.setdefault(rel, []).append(a.group(1))
        for rel, ids in self.acs.items():
            for i in ids:
                if id_type(i) == 'AC':
                    self._declare(i, rel)

    @property
    def known(self):
        return set(self.decl) | set(self.domains) | set(self.services)

    def feature_docs(self):
        return {d.id: d for d in self.docs.values() if d.type == 'FEAT'}

    def exists_exact(self, abs_path):
        """Existence with the exact case of every path component (GitHub paths are case-sensitive)."""
        cache = self._dircache
        try:
            rel = Path(os.path.normpath(abs_path)).relative_to(self.root)
        except ValueError:
            return Path(abs_path).exists()
        cur = self.root
        for part in rel.parts:
            if cur not in cache:
                try:
                    cache[cur] = set(os.listdir(cur))
                except OSError:
                    return False
            if part not in cache[cur]:
                return False
            cur = cur / part
        return True


def load_repo(root=ROOT):
    return Repo(root)


# ------------------------------------------------------------------ links
def is_external(t):
    """A scheme (http:, mailto:, C:) or a site-absolute path; fragments of the same file are internal."""
    return bool(re.match(r'^[A-Za-z][A-Za-z0-9+.-]*:', t)) or t.startswith('/')


def iter_links(text):
    """Yield (line number, target, text after the link) for links outside fenced code."""
    for n, line in unfenced_lines(text):
        for m in INLINE.finditer(line):
            yield n, m.group(2), line[m.end():m.end() + 60]
        m = REFDEF.match(line)
        if m:
            yield n, m.group(1), line[m.end():m.end() + 60]


def split_target(t):
    m = re.match(r'^([^#?]*)([?][^#]*)?(#.*)?$', t)
    return m.group(1), (m.group(3) or '')[1:]
