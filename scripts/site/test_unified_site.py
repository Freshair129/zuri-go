"""Reject damaged builds and unintended files before packaging for publication."""
from pathlib import Path
from tempfile import TemporaryDirectory
import json
import re
import base64
import unittest

from build_unified_site import APP_ID, app_files, digest, metrics_files, verify_hosted_services, write_package


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

    def test_metrics_package_omits_local_emar_launcher_and_preserves_site_nav(self):
        source = self.root / 'metrics.html'
        source.write_text('''<nav class="site-nav" aria-label="เมนูเว็บไซต์"><a href="/?view=1&amp;tab=overview">Overview</a><a href="/?view=1&amp;tab=meeting-task-manager">Tasks</a><a href="#overview" data-site-section="guide">Metrics</a><a href="#metrics-graph" data-site-section="graph">Graph</a></nav><nav id="services-nav" aria-label="บริการ"><a href="http://localhost:8788/" target="_blank" rel="noopener noreferrer">Emar (local)</a></nav><script id="services-origin-gate">if(location.origin==='http://127.0.0.1:4319')show();</script>''', encoding='utf-8')
        packaged = metrics_files(source, hosted=True)['metrics/index.html'].decode('utf-8')

        self.assertNotIn('id="services-nav"', packaged)
        self.assertNotIn('services-origin-gate', packaged)
        self.assertNotIn('localhost:8788', packaged)
        self.assertNotIn('127.0.0.1:4319', packaged)
        nav = packaged.split('aria-label="เมนูเว็บไซต์"', 1)[1].split('</nav>', 1)[0]
        self.assertEqual(
            ['/?view=1&amp;tab=overview', '/?view=1&amp;tab=meeting-task-manager', '#overview', '#metrics-graph'],
            re.findall(r'<a\b[^>]*href="([^"]+)"', nav),
        )

    def test_local_metrics_keeps_launcher_and_origin_gate(self):
        source = self.root / 'metrics.html'
        html = '''<nav id="services-nav" hidden><a href="http://localhost:8788/" target="_blank" rel="noopener noreferrer">Emar (local)</a></nav><script id="services-origin-gate">if(location.origin==='http://127.0.0.1:4319')show();</script>'''
        source.write_text(html, encoding='utf-8')
        self.assertEqual(metrics_files(source)['metrics/index.html'].decode('utf-8'), html)

    def test_hosted_metrics_rejects_missing_or_duplicate_local_blocks(self):
        source = self.root / 'metrics.html'
        nav = '<nav id="services-nav"></nav>'
        gate = '<script id="services-origin-gate"></script>'
        for html in [nav, gate, nav + nav + gate, nav + gate + gate]:
            with self.subTest(html=html):
                source.write_text(html, encoding='utf-8')
                with self.assertRaisesRegex(ValueError, 'Expected one local-only'):
                    metrics_files(source, hosted=True)

    def test_hosted_package_rejects_launcher_in_plain_or_encoded_scripts(self):
        for marker in ['http://localhost:8788/', 'Emar (local)', 'http://127.0.0.1:4319', 'services-origin-gate']:
            encoded = base64.b64encode(marker.encode()).decode()
            for html in [marker, f'<script src="data:text/javascript;charset=utf-8;base64,{encoded}"></script>']:
                with self.subTest(marker=marker, encoded=html != marker):
                    with self.assertRaisesRegex(ValueError, 'Local Emar launcher'):
                        verify_hosted_services({'index.html': html.encode()})
        verify_hosted_services({'index.html': b'<nav>Existing navigation</nav>'})

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
