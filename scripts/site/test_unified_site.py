"""Reject damaged builds and unintended files before packaging for publication."""
from pathlib import Path
from tempfile import TemporaryDirectory
import json
import unittest

from build_unified_site import APP_ID, app_files, digest, write_package


class PackagingTests(unittest.TestCase):
    def setUp(self):
        self.temp = TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.html = b'<html>reviewed app</html>'
        self.snapshot = json.dumps({'id': APP_ID, 'buildStatus': 'complete'}).encode()
        self.manifest = {'kind': 'separate-data-v1'}
        for key, name, data in [('html', 'index.html', self.html), ('snapshot', 'snapshot.json', self.snapshot)]:
            (self.root / name).write_bytes(data)
            self.manifest[key] = {'path': name, 'sha256': digest(data), 'bytes': len(data)}
        self.save_manifest()

    def save_manifest(self):
        (self.root / 'data-app-build.json').write_text(json.dumps(self.manifest))

    def test_copy_verified_bytes_only(self):
        (self.root / 'private-backup.json').write_text('not for publication')
        files = app_files(self.root)
        self.assertEqual(files['index.html'], self.html)
        self.assertNotIn('private-backup.json', files)

    def test_reject_modified_html(self):
        (self.root / 'index.html').write_bytes(self.html + b'<script>unexpected</script>')
        with self.assertRaisesRegex(ValueError, 'manifest mismatch'):
            app_files(self.root)

    def test_reject_manifest_path_escape(self):
        self.manifest['snapshot']['path'] = '../outside.json'
        self.save_manifest()
        with self.assertRaisesRegex(ValueError, 'outside package'):
            app_files(self.root)

    def test_preserve_untracked_output(self):
        output = self.root / 'site'
        output.mkdir()
        private = output / 'private-backup.json'
        private.write_text('preserve')
        with self.assertRaisesRegex(ValueError, 'untracked files'):
            write_package(output, {'index.html': self.html})
        self.assertEqual(private.read_text(), 'preserve')

    def test_rebuild_removes_only_previous_generated_files(self):
        output = self.root / 'site'
        write_package(output, {'index.html': self.html, 'snapshot.old.json': self.snapshot})
        write_package(output, {'index.html': self.html, 'snapshot.new.json': self.snapshot})
        self.assertFalse((output / 'snapshot.old.json').exists())
        self.assertEqual((output / 'snapshot.new.json').read_bytes(), self.snapshot)


if __name__ == '__main__':
    unittest.main()
