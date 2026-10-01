"""Tests of next-id, validate-docs and generate-views on small fixture trees (scripts/docs/tests/fixtures/valid)."""
import contextlib
import io
import shutil
import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import docslib as L  # noqa: E402
import generate_views as G  # noqa: E402
import next_id as N  # noqa: E402
import validate_docs as V  # noqa: E402

FIXTURE = Path(__file__).resolve().parent / 'fixtures' / 'valid'
TRACE = '@' + 'trace'     # written apart so the repository scan does not read this file's strings as annotations


class Tree:
    """A throw-away copy of the valid fixture that a test then damages."""
    def __init__(self, case):
        tmp = TemporaryDirectory()
        case.addCleanup(tmp.cleanup)
        self.root = Path(tmp.name) / 'repo'
        shutil.copytree(FIXTURE, self.root)

    def read(self, rel):
        return (self.root / rel).read_bytes().decode('utf-8')

    def write(self, rel, text):
        p = self.root / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(text.encode('utf-8'))

    def edit(self, rel, old, new):
        text = self.read(rel)
        assert old in text, f'{old!r} not in {rel}'
        self.write(rel, text.replace(old, new, 1))

    def remove(self, rel):
        (self.root / rel).unlink()

    def validate(self, **kw):
        return V.validate(self.root, **kw).report

    def views(self):
        return G.check(L.load_repo(self.root))

    def next_id(self, *args):
        return N.next_id(L.load_repo(self.root), *args)


def run(main, argv):
    out, err = io.StringIO(), io.StringIO()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
        code = main(argv)
    return code, out.getvalue(), err.getvalue()


class ParserTests(unittest.TestCase):
    def test_frontmatter_scalars_lists_maps(self):
        fm, body = L.parse_frontmatter(
            '---\nid: FEAT-001\ntitle: "A: quoted # title"  # comment\nlegacy: [A-1, "B-2"]\nrelations:\n  depends_on: [X-1, Y-2]\n'
            '  decided_by: []\nparticipants:\n  - domain: DOM-A\n    part: FEAT-001-P01\n  - domain: DOM-B\n'
            '    part: FEAT-001-P02\nhosts:\n  - DOM-A\n# note\n---\n# Body\n')
        self.assertEqual(fm['id'], 'FEAT-001')
        self.assertEqual(fm['title'], 'A: quoted # title')
        self.assertEqual(fm['legacy'], ['A-1', 'B-2'])
        self.assertEqual(fm['relations'], {'depends_on': ['X-1', 'Y-2'], 'decided_by': []})
        self.assertEqual(fm['participants'], [{'domain': 'DOM-A', 'part': 'FEAT-001-P01'}, {'domain': 'DOM-B', 'part': 'FEAT-001-P02'}])
        self.assertEqual(fm['hosts'], ['DOM-A'])
        self.assertEqual(body, '# Body\n')

    def test_frontmatter_handles_crlf_bom_and_absence(self):
        fm, _ = L.parse_frontmatter('﻿---\r\nid: STD-004\r\nstatus: approved\r\n---\r\ntext')
        self.assertEqual(fm['id'], 'STD-004')
        self.assertEqual(L.parse_frontmatter('# no frontmatter\n')[0], None)

    def test_id_grammar(self):
        for i, t in [('FEAT-012', 'FEAT'), ('FEAT-012-P01', 'PART'), ('FR-010-018', 'FR'), ('NFR-010-001', 'NFR'),
                     ('NFR-007', 'NFR'), ('AC-010-018-07', 'AC'), ('TC-010-001', 'TC'), ('SDD-010', 'SDD'), ('DOM-TSK', 'DOM'),
                     ('ADR-004', 'ADR'), ('PLAN-003', 'PLAN')]:
            self.assertEqual(L.id_type(i), t, i)
        for i in ['FEAT-12', 'FR-10-18', 'ADR-ONE', 'FEAT-012-P1', 'SRV-web', 'DOM-X']:
            self.assertIsNone(L.id_type(i), i)

    def test_relation_line_and_slug(self):
        self.assertEqual(L.parse_relation_line('decided_by: ADR-004; supersedes: ADR-009, ADR-010'),
                         [('decided_by', ['ADR-004']), ('supersedes', ['ADR-009', 'ADR-010'])])
        self.assertEqual(L.slugify('ADR-001 — Keep the fixture small'), 'adr-001--keep-the-fixture-small')
        self.assertEqual(L.slugify('Design gaps decided (2026-10-01)'), 'design-gaps-decided-2026-10-01')
        self.assertEqual(L.slugify('ข้อกำหนด Guest'), 'ข้อกำหนด-guest')

    def test_registry_parser(self):
        reg = L.parse_registry('# c\ndomains:\n  - code: DOM-A\n    slug: a\n    supersedes: [DOM-B]\n  - code: DOM-B\n    name: "B # x"\n')
        self.assertEqual(reg['domains'], [{'code': 'DOM-A', 'slug': 'a', 'supersedes': ['DOM-B']}, {'code': 'DOM-B', 'name': 'B # x'}])


class ValidateTests(unittest.TestCase):
    def setUp(self):
        self.t = Tree(self)

    def errors(self, **kw):
        return self.t.validate(**kw).codes('error')

    def test_fixture_is_clean(self):
        rep = self.t.validate()
        self.assertEqual(rep.items, [])
        self.assertEqual(run(V.main, ['--root', str(self.t.root)])[0], 0)

    def test_exit_status_is_one_with_errors(self):
        self.t.edit('docs/features/FEAT-001-alpha/feature.md', 'status: approved', 'status: fine')
        code, out, _ = run(V.main, ['--root', str(self.t.root)])
        self.assertEqual(code, 1)
        self.assertIn('[status]', out)

    def test_duplicate_declaration(self):
        self.t.write('docs/architecture/other.md', '---\nid: ADR-009\n---\n# x\n')
        self.t.write('docs/architecture/more.md', '---\nid: ADR-009\n---\n# y\n')
        self.assertIn('duplicate', self.errors())
        self.t.edit('docs/architecture/decisions.md', '**Status:** approved.', '### ADR-009 — again\n')
        self.assertIn('duplicate', self.errors())

    def test_vocabularies(self):
        self.t.edit('docs/features/FEAT-001-alpha/feature.md', 'delivery: implemented', 'delivery: shipped')
        self.t.edit('docs/features/FEAT-002-beta/feature.md', 'status: approved', 'status: signed')
        codes = self.errors()
        self.assertIn('delivery', codes)
        self.assertIn('status', codes)

    def test_id_grammar_and_filename(self):
        self.t.write('docs/architecture/ARCH-001-x.md', '---\nid: ARCH-002\n---\n# x\n')
        self.t.write('docs/architecture/bad.md', '---\nid: FEAT-12\n---\n# x\n')
        codes = self.errors()
        self.assertIn('filename-id', codes)
        self.assertIn('id-grammar', codes)

    def test_relations(self):
        fr = 'docs/features/FEAT-001-alpha/requirements/FR-001-001-alpha-rule.md'
        self.t.edit(fr, 'decided_by: [ADR-001]', 'decided_by: [ADR-001]\n  likes: [FEAT-002]\n  part_of: [FEAT-001]\n  owned_by: [DOM-AAA]'
                    '\n  depends_on: [FEAT-002]\n  relates_to: [ADR-077]\n  verifies: [FR-002-001]')
        rep = self.t.validate()
        msgs = ' | '.join(m for _, _, c, m in rep.errors)
        self.assertIn("relation 'likes' is not in STD-002 R4", msgs)
        self.assertIn('part_of is never written', msgs)
        self.assertIn('owned_by is never written', msgs)
        self.assertIn('depends_on is not allowed from FR', msgs)
        self.assertIn('relates_to ADR-077 does not resolve', msgs)
        self.assertIn('verifies is not allowed from FR', msgs)

    def test_heading_relations_resolve(self):
        self.t.edit('docs/architecture/decisions.md', 'relates_to: FEAT-001', 'relates_to: FEAT-404; supersedes: FEAT-001')
        rep = self.t.validate()
        self.assertIn('relation-dangling', rep.codes('error'))
        self.assertIn('relation-type', rep.codes('error'))

    def test_supersedes_of_a_live_artifact_warns(self):
        self.t.edit('docs/features/FEAT-002-beta/feature.md', 'depends_on: [FEAT-001]', 'supersedes: [FEAT-001]')
        self.assertIn('supersedes-live', self.t.validate().codes('warning'))

    def test_owner_rules(self):
        self.t.edit('docs/features/FEAT-001-alpha/feature.md', 'owner: DOM-AAA', 'owner: DOM-ZZZ')
        self.t.edit('docs/features/FEAT-002-beta/parts/P02-beta.md', 'owner: DOM-BBB', 'owner: DOM-OLD')
        msgs = ' | '.join(m for _, _, c, m in self.t.validate().errors)
        self.assertIn('DOM-ZZZ is not a registered domain', msgs)
        self.assertIn('DOM-OLD is a superseded domain', msgs)

    def test_registry_checks(self):
        self.t.remove('docs/domains/beta/README.md')
        self.t.edit('registry/services.yaml', 'code_roots: [src]', 'code_roots: [nowhere]')
        self.t.edit('registry/domains.yaml', 'subdomain: core', 'subdomain: central')
        msgs = ' | '.join(m for _, _, c, m in self.t.validate().errors)
        self.assertIn('no declaring docs/domains/beta/README.md', msgs)
        self.assertIn('code root nowhere does not exist', msgs)
        self.assertIn("subdomain 'central'", msgs)

    def test_feature_folder_needs_feature_md(self):
        self.t.write('docs/features/FEAT-003-gamma/notes.md', '# notes\n')
        self.assertIn('feature-folder', self.errors())

    def test_feature_location_and_participants(self):
        self.t.edit('docs/features/FEAT-002-beta/feature.md', '  - domain: DOM-BBB\n    part: FEAT-002-P02\n    role: Beta side\n', '')
        codes = self.errors()
        self.assertIn('participants', codes)
        self.t.write('docs/features/FEAT-001-alpha/parts/P01-x.md', '---\nid: FEAT-001-P01\nowner: DOM-AAA\n---\n# x\n')
        self.assertIn('location', self.errors())

    def test_part_owner_must_match_participant(self):
        self.t.edit('docs/features/FEAT-002-beta/parts/P02-beta.md', 'owner: DOM-BBB', 'owner: DOM-AAA')
        msgs = ' | '.join(m for _, _, c, m in self.t.validate().errors)
        self.assertIn('part FEAT-002-P02 is owned by DOM-AAA, not DOM-BBB', msgs)
        self.assertIn('owner DOM-BBB differs from the owner of FEAT-002-P02', msgs)

    def test_requirement_of_cross_domain_feature_names_part(self):
        self.t.edit('docs/features/FEAT-002-beta/requirements/FR-002-001-beta-rule.md', 'part: FEAT-002-P02\nowner: DOM-BBB\n', '')
        self.assertIn('part', self.errors())

    def test_requirement_file_rules(self):
        base = 'docs/features/FEAT-001-alpha/requirements/FR-001-001-alpha-rule.md'
        self.t.write('docs/features/FEAT-001-alpha/requirements/FR-001-002-two.md',
                     '---\nid: FR-001-002\ndelivery: declared\n---\n# FR-001-002 — two\n\nThe system SHALL do one thing.\n\n'
                     '## Acceptance criteria\n- AC-001-002-01 — Given a, when b, then c.\n\n# FR-001-003 — hidden second requirement\n')
        self.assertIn('one-per-file', self.errors())
        self.t.write('docs/features/FEAT-001-alpha/requirements/FR-001-002-two.md',
                     '---\nid: FR-001-002\ndelivery: declared\n---\n# FR-001-002 — two\n\nThe system does one thing.\n')
        codes = self.errors()
        self.assertIn('ac', codes)
        self.assertIn('shall', codes)
        self.t.edit(base, 'AC-001-001-02', 'AC-001-001-04')
        msgs = ' | '.join(m for _, _, c, m in self.t.validate().errors)
        self.assertIn('AC-001-001-04 is out of sequence', msgs)
        self.t.write('docs/features/FEAT-001-alpha/requirements/loose.md', '# no id\n')
        self.assertIn('requirement', self.errors())

    def test_nfr_rules(self):
        nfr = 'docs/features/FEAT-002-beta/requirements/NFR-002-001-beta-speed.md'
        self.t.edit(nfr, '## Measurement\n- A timed read of one record, recorded in the verification file.\n',
                    '## Acceptance criteria\n- AC-002-001-01 — Given a, when b, then c.\n\n## Measurement\n')
        codes = self.errors()
        self.assertIn('ac', codes)
        self.assertIn('measurement', codes)

    def test_system_nfr_location(self):
        self.t.write('docs/architecture/NFR-001-x.md', '---\nid: NFR-001\ndelivery: declared\n---\n# NFR-001 — x\n\nThe system SHALL x.\n\n## Measurement\n- m\n')
        self.assertIn('location', self.errors())
        self.t.remove('docs/architecture/NFR-001-x.md')
        self.t.write('docs/architecture/requirements/NFR-001-x.md', '---\nid: NFR-001\ndelivery: declared\n---\n# NFR-001 — x\n\nThe system SHALL x.\n\n## Measurement\n- m\n')
        self.assertEqual(self.errors(), [])

    def test_links(self):
        self.t.edit('docs/features/FEAT-001-alpha/feature.md', '## Requirement index',
                    '[gone](missing.md) [bad anchor](../FEAT-002-beta/design.md#nope) [case](../FEAT-002-beta/Design.md)\n\n## Requirement index')
        rep = self.t.validate()
        self.assertEqual(rep.codes('error').count('link'), 2)
        self.assertEqual(rep.codes('error').count('anchor'), 1)

    def test_historical_link_is_a_warning(self):
        self.t.edit('docs/features/FEAT-001-alpha/feature.md', '## Requirement index',
                    'See [old](../../old.md) *(historical link: not carried over)*, and [other](../../other.md).\n\n## Requirement index')
        rep = self.t.validate()
        self.assertEqual(rep.codes('warning'), ['link-historical'])
        self.assertEqual(rep.codes('error'), ['link'])

    def test_crosswalk(self):
        self.t.write('registry/crosswalk/T.csv', 'legacy_id,new_id,disposition,note\nOLD-1,FEAT-001,moved,docs/old.md -> docs/nowhere.md\n'
                     'OLD-2,FEAT-404,moved,\n,FEAT-001,moved,\n')
        msgs = ' | '.join(m for _, _, c, m in self.t.validate().errors)
        self.assertIn('docs/nowhere.md, which does not exist', msgs)
        self.assertIn('OLD-2 -> FEAT-404 does not resolve', msgs)
        self.assertIn('empty legacy_id', msgs)
        self.t.write('registry/crosswalk/T.csv', 'legacy_id,new_id,disposition,note\nOLD-1,FEAT-002,renamed,\n')
        self.assertIn("legacy OLD-1 maps to ['FEAT-002']", ' | '.join(m for _, _, c, m in self.t.validate().errors))
        self.t.write('registry/crosswalk/T.csv', 'legacy_id,new_id,disposition,note\n')
        self.assertIn('legacy OLD-1 is not in the crosswalk', ' | '.join(m for _, _, c, m in self.t.validate().errors))

    def test_unverified_requirement_is_a_warning_until_strict(self):
        self.t.remove('docs/features/FEAT-002-beta/verification.md')
        self.t.remove('src/a.test.mjs')
        self.assertEqual(self.t.validate().codes('warning'), ['fr-unverified'])
        self.assertEqual(self.errors(), [])
        self.assertEqual(self.errors(strict_trace=True), ['fr-unverified'])

    def test_live_feature_needs_verified_requirements(self):
        self.t.remove('docs/features/FEAT-002-beta/verification.md')
        self.t.remove('src/a.test.mjs')
        self.t.edit('docs/features/FEAT-002-beta/feature.md', 'delivery: implemented', 'delivery: live')
        self.assertIn('live-unverified', self.errors())
        self.t.edit('docs/features/FEAT-001-alpha/feature.md', 'delivery: implemented', 'delivery: live')
        self.t.remove('docs/features/FEAT-001-alpha/requirements/FR-001-001-alpha-rule.md')
        self.assertIn('live', self.errors())

    def test_code_trace_is_the_other_verifies_source(self):
        self.t.remove('docs/features/FEAT-002-beta/verification.md')
        self.assertEqual(self.t.validate().items, [])          # src/a.test.mjs still verifies the acceptance criterion
        self.t.write('src/b.mjs', f'// {TRACE} implements FR-404, NFR-002-001\n// {TRACE} likes FR-002-001\n// {TRACE} verifies ADR-001\n')
        msgs = ' | '.join(m for _, _, c, m in self.t.validate().errors)
        self.assertIn('FR-404 does not resolve', msgs)
        self.assertIn("relation 'likes'", msgs)
        self.assertIn('verifies is not allowed to ADR', msgs)

    def test_test_case_rules(self):
        v = 'docs/features/FEAT-002-beta/verification.md'
        self.t.edit(v, 'Test: `src/a.test.mjs`', 'Test: `src/missing.test.mjs`')
        self.assertIn('test file src/missing.test.mjs does not exist', ' | '.join(m for _, _, c, m in self.t.validate().errors))
        self.t.edit(v, 'Test: `src/missing.test.mjs`\n', '\n### TC-002-002 — nothing bound\n')
        msgs = ' | '.join(m for _, _, c, m in self.t.validate().errors)
        self.assertIn('TC-002-001 is bound to no test file', msgs)
        self.assertIn('TC-002-002 has no "Relations: verifies', msgs)
        self.t.write('docs/architecture/tc.md', '### TC-002-003 — stray\nRelations: verifies: FR-002-001\nTest: `src/a.test.mjs`\n')
        self.assertIn('must be declared in verification.md', ' | '.join(m for _, _, c, m in self.t.validate().errors))

    def test_recorded_gaps_are_warnings_inside_the_standards_only(self):
        self.t.write('docs/governance/standards/STD-001-x.md', '---\nid: STD-001\nstatus: approved\nrelations:\n  depends_on: [STD-002, ADR-100]\n---\n# x\n')
        self.t.write('docs/governance/standards/STD-002-y.md', '﻿---\nid: STD-002\nstatus: approved\n---\n# y\n')
        rep = self.t.validate()
        self.assertEqual(rep.errors, [])
        self.assertEqual(sorted(set(rep.codes('warning'))), ['bom', 'relation-dangling', 'relation-type'])
        self.assertTrue(all('recorded gap, ADR-001 D8' in m for _, _, _, m in rep.warnings))
        self.t.write('docs/architecture/STD-003-z.md', '﻿---\nid: STD-003\nrelations:\n  depends_on: [STD-002]\n---\n# z\n')
        self.assertEqual(sorted(set(self.errors())), ['bom', 'relation-type'])

    def test_credential_like_values(self):
        self.t.write('docs/architecture/notes.md', '# n\npostgresql://app:s3cretvalue@db.example.com/zuri\npostgresql://user:<password>@host/db\n')
        msgs = [m for _, _, c, m in self.t.validate().errors if c == 'private']
        self.assertEqual(len(msgs), 1)

    def test_views_drift_is_an_error(self):
        self.t.edit('docs/README.md', '| DOM-AAA | implemented | `features/FEAT-001-alpha/` |', '| DOM-BBB | building | `features/FEAT-001-alpha/` |')
        self.assertIn('view-drift', self.errors())


class NextIdTests(unittest.TestCase):
    def setUp(self):
        self.t = Tree(self)

    def test_standalone_types(self):
        self.assertEqual(self.t.next_id('ADR'), 'ADR-002')
        self.assertEqual(self.t.next_id('feat'), 'FEAT-003')
        self.assertEqual(self.t.next_id('SRV'), 'SRV-002')
        self.assertEqual(self.t.next_id('PLAN'), 'PLAN-001')
        self.assertEqual(self.t.next_id('NFR'), 'NFR-001')

    def test_feature_scoped_types(self):
        self.assertEqual(self.t.next_id('FR', '1'), 'FR-001-002')
        self.assertEqual(self.t.next_id('FR', 'FEAT-002'), 'FR-002-002')
        self.assertEqual(self.t.next_id('NFR', '002'), 'NFR-002-002')
        self.assertEqual(self.t.next_id('TC', '2'), 'TC-002-002')
        self.assertEqual(self.t.next_id('TC', '1'), 'TC-001-001')
        self.assertEqual(self.t.next_id('PART', 'FEAT-002'), 'FEAT-002-P03')
        self.assertEqual(self.t.next_id('PART', 'FEAT-001'), 'FEAT-001-P01')
        self.assertEqual(self.t.next_id('AC', 'FR-001-001'), 'AC-001-001-03')

    def test_a_retired_number_is_never_reused(self):
        self.t.edit('docs/features/FEAT-001-alpha/requirements/FR-001-001-alpha-rule.md', 'delivery: declared', 'delivery: retired')
        self.assertEqual(self.t.next_id('FR', '1'), 'FR-001-002')
        self.t.edit('docs/features/FEAT-002-beta/feature.md', 'status: approved', 'status: approved\nlegacy: [ADR-009, FR-002-005]')
        self.assertEqual(self.t.next_id('ADR'), 'ADR-010')
        self.assertEqual(self.t.next_id('FR', '2'), 'FR-002-006')
        self.t.write('registry/crosswalk/T.csv', 'legacy_id,new_id,disposition,note\nOLD-1,FEAT-007,moved,\n')
        self.assertEqual(self.t.next_id('FEAT'), 'FEAT-008')

    def test_refusals(self):
        for args in [('SDD',), ('DOM',), ('FR', '77'), ('FR',), ('FR', 'x'), ('AC', 'FR-001-099'), ('ADR', '5'), ('WIDGET',)]:
            with self.assertRaises(N.Refusal, msg=str(args)):
                self.t.next_id(*args)

    def test_cli(self):
        self.assertEqual(run(N.main, ['--root', str(self.t.root), 'FR', '2'])[:2], (0, 'FR-002-002\n'))
        code, out, err = run(N.main, ['--root', str(self.t.root), 'SDD'])
        self.assertEqual((code, out), (2, ''))
        self.assertIn('next-id:', err)


class ViewsTests(unittest.TestCase):
    def setUp(self):
        self.t = Tree(self)

    def messages(self):
        return ' | '.join(f'{w}: {m}' for w, m in self.t.views())

    def test_fixture_has_no_drift(self):
        self.assertEqual(self.t.views(), [])
        self.assertEqual(run(G.main, ['--root', str(self.t.root)])[0], 0)

    def test_doc_map_drift(self):
        self.t.edit('docs/README.md', '| Alpha feature | DOM-AAA | implemented |', '| Alpha | DOM-BBB | building |')
        self.t.edit('docs/README.md', '| core / business | FEAT-001, FEAT-002 |', '| core / platform | FEAT-001 |')
        self.t.edit('docs/README.md', 'Main deploy, started', 'Main deploy elsewhere, started')
        msgs = self.messages()
        for part in ["FEAT-001: feature is 'Alpha'", "owner is 'DOM-BBB'", "delivery is 'building'", "classification is 'core / platform'",
                     'DOM-AAA: features lists', 'SRV-001: deploy unit differs']:
            self.assertIn(part, msgs)

    def test_missing_feature_row(self):
        self.t.edit('docs/README.md', '| [FEAT-002](features/FEAT-002-beta/feature.md) | Beta feature | DOM-AAA | implemented | `features/FEAT-002-beta/` |\n', '')
        self.assertIn('features table lists', self.messages())

    def test_domain_readme_drift(self):
        a = 'docs/domains/alpha/README.md'
        self.t.edit(a, '| [FEAT-001](../../features/FEAT-001-alpha/feature.md) | Alpha feature | implemented |\n', '')
        self.t.edit(a, 'subdomain `core`', 'subdomain `generic`')
        self.t.edit(a, '| implemented — a note', '| building — a note')
        self.t.edit(a, '[SRV-001](../../services/SRV-001-main/SERVICE.md)', 'SRV-001')
        msgs = self.messages()
        self.assertIn("owned features lists ['FEAT-002']", msgs)
        self.assertIn('classification differs from registry', msgs)
        self.assertIn("FEAT-002: delivery is 'building'", msgs)
        self.assertIn('services lists []', msgs)

    def test_participation_drift(self):
        b = 'docs/domains/beta/README.md'
        self.t.edit(b, '[FEAT-002-P02](../../features/FEAT-002-beta/parts/P02-beta.md)', 'FEAT-002-P01')
        self.t.edit(b, '[FR-002-001](../../features/FEAT-002-beta/requirements/FR-002-001-beta-rule.md)', '[FR-002-001](../x.md)')
        msgs = self.messages()
        self.assertIn('participating parts lists', msgs)
        self.assertIn('FR-002-001 links to ../x.md', msgs)

    def test_block_missing(self):
        self.t.write('docs/domains/old/README.md', '---\nid: DOM-OLD\nstatus: superseded\n---\n# DOM-OLD\n')
        self.assertIn('no "BEGIN GENERATED: feature-index" block', self.messages())

    def test_superseded_domain_must_say_so(self):
        self.t.edit('docs/domains/old/README.md', 'superseded; was', 'live; was')
        self.assertIn('classification should say the domain is superseded', self.messages())

    def test_write_is_refused_and_changes_nothing(self):
        before = {p.name: p.read_bytes() for p in (self.t.root / 'docs').rglob('*.md')}
        code, out, err = run(G.main, ['--root', str(self.t.root), '--write'])
        self.assertEqual((code, out), (2, ''))
        self.assertIn('not implemented', err)
        self.assertEqual(before, {p.name: p.read_bytes() for p in (self.t.root / 'docs').rglob('*.md')})

    def test_cli_exit_status_on_drift(self):
        self.t.edit('docs/README.md', 'Alpha feature | DOM-AAA', 'Alpha feature | DOM-BBB')
        code, out, _ = run(G.main, ['--root', str(self.t.root), '--check'])
        self.assertEqual(code, 1)
        self.assertIn('DRIFT', out)


if __name__ == '__main__':
    unittest.main()
