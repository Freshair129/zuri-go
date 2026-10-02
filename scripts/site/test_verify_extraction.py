"""Portability and honest-coverage checks for the extraction verifier."""
from pathlib import Path
from tempfile import TemporaryDirectory
import hashlib
import json
import unittest

from verify_extraction import verify_extraction


APP_ID = 'dashboard:354c0a91-d04c-431c-9fe5-06bc3f703be1'
PROJECT_ID = 'prj_8f3zf1qaZnRcAvWabOv1PWAPIABG'


class ExtractionVerificationTests(unittest.TestCase):
    def setUp(self):
        self.temp = TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.public_bytes = b'public immutable source'
        self.private_index = b'synthetic custody index'
        self.private_json = json.dumps({'password': 'synthetic-handover-value'}).encode()
        (self.root / 'apps/web').mkdir(parents=True)
        (self.root / 'apps/web/immutable.js').write_bytes(self.public_bytes)
        entries = [
            self.manifest_entry('apps/web/immutable.js', self.public_bytes, 'unchanged'),
            self.manifest_entry('.local/member-access/production/index.md', self.private_index, 'private-preserved'),
            self.manifest_entry('.local/member-access/production/member.json', self.private_json, 'private-preserved'),
        ]
        self.write_json('docs/migrations/source-manifest.json', {'sourceRoot': 'synthetic', 'files': entries})
        self.write_json('apps/web/protected-runtime.json', {'editablePaths': []})
        self.write_package()

    def manifest_entry(self, target, data, disposition):
        return {
            'source': target,
            'target': target.replace('/', '\\'),
            'sha256': hashlib.sha256(data).hexdigest(),
            'disposition': disposition,
        }

    def write_json(self, relative, value):
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(value), encoding='utf-8')

    def write_package(self):
        package = self.root / 'build/vercel'
        package.mkdir(parents=True, exist_ok=True)
        for number in range(61):
            (package / f'file-{number:03}.txt').write_text('synthetic deployment file', encoding='utf-8')
        self.write_json('apps/web/dist/data-app-build.json', {
            'snapshot': {'path': 'snapshot.json'},
            'html': {'sha256': 'synthetic-html-sha256'},
            'runtimeSha256': 'synthetic-runtime-sha256',
        })
        self.write_json('apps/web/dist/snapshot.json', {'id': APP_ID})
        self.write_json('build/vercel/.vercel/project.json', {'projectId': PROJECT_ID})

    def add_matching_private_inputs(self):
        (self.root / '.local/member-access/production').mkdir(parents=True)
        (self.root / '.local/member-access/production/index.md').write_bytes(self.private_index)
        (self.root / '.local/member-access/production/member.json').write_bytes(self.private_json)

    def test_missing_private_custody_is_not_run_and_fixture_does_not_write_report(self):
        report = verify_extraction(self.root)

        self.assertEqual('NOT_RUN', report['privateCustodyStatus'])
        self.assertEqual(0, report['privateCustodyInputsAvailable'])
        self.assertEqual(2, report['privateCustodyInputsUnavailable'])
        self.assertEqual('NOT_RUN', report['availableKnownSecretScanStatus'])
        self.assertEqual(1, report['unchangedSourceFilesChecked'])
        self.assertFalse((self.root / 'docs/migrations/verification/extraction.json').exists())

    def test_matching_private_inputs_are_hashed_and_scanned(self):
        self.add_matching_private_inputs()

        report = verify_extraction(self.root)

        self.assertEqual('PASS', report['privateCustodyStatus'])
        self.assertEqual(2, report['privateCustodyInputsAvailable'])
        self.assertEqual(0, report['privateCustodyInputsUnavailable'])
        self.assertEqual('PASS', report['availableKnownSecretScanStatus'])
        self.assertEqual(1, report['availableKnownSecretValuesChecked'])

    def test_mixed_private_availability_reports_partial_custody_and_scans_available_values(self):
        self.add_matching_private_inputs()
        (self.root / '.local/member-access/production/index.md').unlink()
        self.write_json('.local/config.json', {'sessionSecret': 'synthetic-local-session-secret'})

        report = verify_extraction(self.root)

        self.assertEqual('NOT_RUN', report['privateCustodyStatus'])
        self.assertEqual(1, report['privateCustodyInputsAvailable'])
        self.assertEqual(1, report['privateCustodyInputsUnavailable'])
        self.assertEqual('PASS', report['availableKnownSecretScanStatus'])
        self.assertEqual(2, report['availableKnownSecretValuesChecked'])

    def test_tampered_private_custody_input_fails_its_hash_check(self):
        self.add_matching_private_inputs()
        (self.root / '.local/member-access/production/index.md').write_bytes(b'tampered synthetic index')

        with self.assertRaisesRegex(AssertionError, r'index\.md'):
            verify_extraction(self.root)

    def test_known_secret_in_package_fails_without_disclosing_value(self):
        fake_secret = 'synthetic-config-secret-never-real'
        self.write_json('.local/config.json', {'sessionSecret': fake_secret})
        (self.root / 'build/vercel/file-000.txt').write_text(fake_secret, encoding='utf-8')

        with self.assertRaisesRegex(AssertionError, 'Private value in package') as error:
            verify_extraction(self.root)

        self.assertNotIn(fake_secret, str(error.exception))

    def test_public_immutable_tampering_fails_even_without_private_custody(self):
        (self.root / 'apps/web/immutable.js').write_bytes(b'changed public source')

        with self.assertRaisesRegex(AssertionError, 'immutable.js'):
            verify_extraction(self.root)


if __name__ == '__main__':
    unittest.main()
