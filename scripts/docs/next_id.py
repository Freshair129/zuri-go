"""next-id: print the next free artifact ID (STD-002 R1 allocation: max + 1, a retired number is never reused).

    python scripts/docs/next_id.py FEAT                 FEAT-013
    python scripts/docs/next_id.py ADR                  ADR-005          (also CAP BR SEC API EVT CMP SRV RB ARCH BRD PRD STD PROC PLAN)
    python scripts/docs/next_id.py NFR                  NFR-nnn          (system level)
    python scripts/docs/next_id.py FR 10                FR-010-024       (feature number, 10 or 010 or FEAT-010)
    python scripts/docs/next_id.py NFR 10               NFR-010-003
    python scripts/docs/next_id.py TC 10                TC-010-001
    python scripts/docs/next_id.py PART FEAT-010        FEAT-010-P03
    python scripts/docs/next_id.py AC FR-010-018        AC-010-018-08

A number counts as used when anything declares it (a file, a heading, an acceptance criterion, registry/), a crosswalk row
or a `legacy:` list names it, so a retired artifact, which stays in place, keeps its number. Reads the working tree: run it
on the up-to-date main branch."""
import argparse
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import docslib as L  # noqa: E402

NEEDS_FEATURE = ('FR', 'NFR', 'TC', 'PART', 'AC')


class Refusal(Exception):
    pass


def used_ids(repo):
    used = set(repo.decl) | set(repo.domains) | set(repo.services)
    for row in repo.crosswalk:
        used |= {(row.get('legacy_id') or '').strip(), (row.get('new_id') or '').strip()}
    for doc in repo.docs.values():
        used |= set(L.as_list(doc.get('legacy')))
    for h in repo.heads:
        used |= set(h.legacy)
    return used


def feature_number(arg):
    m = re.fullmatch(r'(?:FEAT-)?(\d{1,})', arg or '')
    if not m:
        raise Refusal(f'{arg!r} is not a feature number (10, 010 or FEAT-010)')
    return f'{int(m.group(1)):03d}'


def highest(used, regex):
    nums = [int(m.group(1)) for i in used for m in [re.fullmatch(regex, i)] if m]
    return max(nums, default=0)


def next_id(repo, kind, arg=None):
    kind, used = kind.upper(), used_ids(repo)
    if kind == 'SDD':
        raise Refusal('SDD-<f> takes the number of its feature; there is nothing to allocate')
    if kind == 'DOM':
        raise Refusal('a domain code is chosen, not counted: register DOM-<CODE> in registry/domains.yaml (STD-003 R7)')
    if kind in L.STANDALONE or (kind == 'NFR' and arg is None):
        if arg is not None:
            raise Refusal(f'{kind} takes no argument')
        n = highest(used, rf'{kind}-(\d{{3,}})') + 1
        return f'{kind}-{n:03d}'
    if kind not in NEEDS_FEATURE:
        raise Refusal(f'unknown type {kind!r}; known: ' + ' '.join(sorted(set(L.STANDALONE) | set(NEEDS_FEATURE))))
    if kind == 'AC':
        m = re.fullmatch(r'FR-(\d{3,})-(\d{3,})', arg or '')
        if not m or arg not in repo.decl:
            raise Refusal(f'AC needs an existing FR, e.g. FR-010-018 ({arg!r} is not declared)')
        n = highest(used, rf'AC-{m.group(1)}-{m.group(2)}-(\d{{2,}})') + 1
        return f'AC-{m.group(1)}-{m.group(2)}-{n:02d}'
    f = feature_number(arg)
    if f'FEAT-{f}' not in repo.decl:
        raise Refusal(f'FEAT-{f} is not declared')
    if kind == 'PART':
        return f'FEAT-{f}-P{highest(used, rf"FEAT-{f}-P(\d{{2}})") + 1:02d}'
    return f'{kind}-{f}-{highest(used, rf"{kind}-{f}-(\d{{3,}})") + 1:03d}'


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('type')
    ap.add_argument('parent', nargs='?', help='feature number (FR, NFR, TC), FEAT-<f> (PART) or FR-<f>-<n> (AC)')
    ap.add_argument('--root', default=str(L.ROOT))
    args = ap.parse_args(argv)
    L.console()
    try:
        print(next_id(L.load_repo(args.root), args.type, args.parent))
    except Refusal as e:
        print(f'next-id: {e}', file=sys.stderr)
        return 2
    return 0


if __name__ == '__main__':
    sys.exit(main())
