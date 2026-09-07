"""Integration checks against actual Git objects and ZIP payloads."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import zipfile

SCRIPT = Path(__file__).with_name('export_listing.py')


class ExportTest(unittest.TestCase):
    def test_committed_source_and_explicit_exclusions(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            def git(*args):
                return subprocess.check_output(['git', '-C', str(root), *args], stderr=subprocess.PIPE)
            git('init')
            (root / 'main.py').write_text('print("committed")\n')
            (root / 'LICENSE').write_text('Example license\n')
            (root / 'font.ttf').write_text('opaque even if ASCII')
            (root / 'empty.expected').write_bytes(b'')
            (root / 'bad.py').write_bytes(b'\x00\xff')
            (root / 'large.json').write_text(' ' * (1024 * 1024 + 1))
            (root / '.env').write_text('LOCAL_SETTING=fixture\n')
            (root / 'model.json').write_text('version https://git-lfs.github.com/spec/v1\n')
            (root / 'link.py').symlink_to('main.py')
            git('add', '.')
            git('-c', 'user.name=Fixture', '-c', 'user.email=fixture' + chr(64) + 'example.invalid',
                '-c', 'commit.gpgsign=false', 'commit', '-m', 'fixture')
            commit = git('rev-parse', 'HEAD').decode().strip()
            (root / 'main.py').write_text('uncommitted content\n')
            (root / 'private.txt').write_text('untracked content\n')
            def run(output):
                return subprocess.run([sys.executable, str(SCRIPT), '--output', str(output)],
                                      cwd=root, capture_output=True)
            first, second = root / 'one.zip', root / 'two.zip'
            self.assertEqual(run(first).returncode, 0)
            self.assertEqual(run(second).returncode, 0)
            original = first.read_bytes()
            self.assertEqual(original, second.read_bytes())
            self.assertNotEqual(run(first).returncode, 0)
            self.assertEqual(original, first.read_bytes())
            with zipfile.ZipFile(first) as archive:
                self.assertEqual(set(archive.namelist()),
                                 {'source/main.py', 'source/LICENSE', 'listing-manifest.json'})
                self.assertEqual(archive.read('source/main.py'), b'print("committed")\n')
                manifest = json.loads(archive.read('listing-manifest.json'))
                self.assertEqual(manifest['commit'], commit)
                self.assertEqual(len(manifest['excluded']), 7)
                self.assertIn({'path': 'large.json', 'reason': 'oversized-text'}, manifest['excluded'])
                for item in manifest['included']:
                    data = archive.read('source/' + item['path'])
                    self.assertEqual(item['sha256'], hashlib.sha256(data).hexdigest())


if __name__ == '__main__':
    unittest.main()
