"""@trace verifies AC-015-001-02: packaged hosted router must load, but preview stays local-only."""
from pathlib import Path
from tempfile import TemporaryDirectory
from shutil import copy2
import json
import re
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parents[2]


class PreviewPackageTests(unittest.TestCase):
    def test_server_import_closure_and_private_exclusion_in_synthetic_package(self):
        with TemporaryDirectory() as tmp:
            root = Path(tmp)
            paths = [ROOT / 'scripts/deploy/build_cloud.py', ROOT / 'scripts/deploy/project.json',
                     ROOT / 'apps/api/package.json', ROOT / 'apps/api/package-lock.json']
            paths += list((ROOT / 'apps/api').glob('*.mjs'))
            paths += list((ROOT / 'apps/api/visual-marketing').glob('*.mjs'))
            paths += list((ROOT / 'apps/web/src/content').rglob('*.mjs'))
            for source in paths:
                target = root / source.relative_to(ROOT)
                target.parent.mkdir(parents=True, exist_ok=True)
                copy2(source, target)
            site = root / 'build/hosted-site'
            site.mkdir(parents=True)
            (site / 'index.html').write_text('<html>SYNTHETIC QA ONLY</html>')
            (site / 'site-build.json').write_text(json.dumps({'files': ['index.html']}))
            (root / '.local').mkdir()
            (root / '.local/config.json').write_text('{"private":"QA-MUST-NOT-PACKAGE"}')
            subprocess.run([sys.executable, str(root / 'scripts/deploy/build_cloud.py')],
                           cwd=root, check=True, capture_output=True)
            out = root / 'build/vercel'
            for module in out.rglob('*.mjs'):
                imports = re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''', module.read_text(encoding='utf-8'))
                for reference in imports:
                    self.assertTrue((module.parent / reference).is_file(), f'{module.relative_to(out)} -> {reference}')
            self.assertFalse((out / '.local').exists())
            self.assertFalse((out / 'apps/api/test').exists())


if __name__ == '__main__':
    unittest.main()
