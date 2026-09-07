#!/usr/bin/env python3
"""Export committed, inspectable source for listing QC; never certify secrets."""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import subprocess
import tempfile
import zipfile


TEXT_SUFFIXES = set("""
.bat .c .cc .cpp .css .csv .entitlements .example .h .html .in .ini
.ipynb .iss .java .js .json .jsx .kt .kts .lock .md .mjs .mts .plist
.pro .properties .ps1 .psm1 .py .rb .rs .rst .sh .spec .sql .svg
.swift .toml .ts .tsx .txt .vbs .xml .yaml .yml
""".split())
TEXT_NAMES = {
    '.gitignore', '.gitattributes', '.gcloudignore', '.dockerignore',
    '.npmrc', '.nvmrc', 'Dockerfile', 'Makefile', 'LICENSE',
    'LICENSE_DEJAVU', 'NOTICE', 'VERSION', 'gradlew',
}


def git(*args):
    return subprocess.check_output(['git', *args], stderr=subprocess.PIPE)


def exclusion(path, mode):
    parts = PurePosixPath(path).parts
    if mode not in ('100644', '100755'):
        return 'symlink-or-submodule'
    if any(p in {'.git', 'node_modules', '.venv', '__pycache__', 'dist'} for p in parts):
        return 'generated-or-local-state'
    name = parts[-1]
    if name == '.env' or (name.startswith('.env.') and not name.endswith('.example')):
        return 'environment-configuration'
    if name not in TEXT_NAMES and PurePosixPath(name).suffix.lower() not in TEXT_SUFFIXES:
        return 'unsupported-format'
    return None


def write_member(archive, path, data, mode=0o644):
    info = zipfile.ZipInfo(path, date_time=(1980, 1, 1, 0, 0, 0))
    info.create_system = 3
    info.external_attr = (0o100000 | mode) << 16
    info.compress_type = zipfile.ZIP_DEFLATED
    archive.writestr(info, data)


def export(ref, output):
    # Resolve once; working-tree edits, untracked files and Git history are absent.
    commit = git('rev-parse', '--verify', '--end-of-options', ref + '^{commit}').decode().strip()
    entries = git('ls-tree', '-r', '-z', '--full-tree', commit).split(b'\0')
    manifest = {
        'schema': 'source-listing/v1', 'commit': commit,
        'scope': 'Committed UTF-8 source only; not a runnable distribution or a secret-scan certification.',
        'included': [], 'excluded': [],
    }
    output = Path(output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    # An exclusive final create prevents accidentally overwriting an earlier artifact.
    with tempfile.TemporaryFile() as temporary:
        with zipfile.ZipFile(temporary, 'w') as archive:
            for entry in entries:
                if not entry:
                    continue
                header, raw_path = entry.split(b'\t', 1)
                mode, kind, oid = header.decode().split()
                path = raw_path.decode('utf-8')
                if path.startswith('/') or any(p in ('', '.', '..') for p in path.split('/')):
                    raise ValueError('Unsafe repository path')
                reason = exclusion(path, mode)
                data = None
                if reason is None:
                    data = git('cat-file', 'blob', oid)
                    try:
                        value = data.decode('utf-8')
                        if any(ord(c) < 32 and c not in '\n\r\t' for c in value):
                            reason = 'binary-content'
                        elif len(data) > 1024 * 1024:
                            reason = 'oversized-text'
                        elif value.startswith('version https://git-lfs.github.com/spec/v1\n'):
                            reason = 'unresolved-lfs-pointer'
                    except UnicodeDecodeError:
                        reason = 'non-utf8-content'
                if reason:
                    manifest['excluded'].append({'path': path, 'reason': reason})
                    continue
                write_member(archive, 'source/' + path, data, int(mode, 8) & 0o777)
                manifest['included'].append({
                    'path': path, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(),
                })
            write_member(archive, 'listing-manifest.json',
                         (json.dumps(manifest, indent=2, sort_keys=True) + '\n').encode())
        temporary.seek(0)
        with output.open('xb') as destination:
            while chunk := temporary.read(1024 * 1024):
                destination.write(chunk)
    return manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ref', default='HEAD', help='Committed revision (default: HEAD)')
    parser.add_argument('--output', required=True, help='New ZIP path; must not already exist')
    args = parser.parse_args()
    result = export(args.ref, args.output)
    print(json.dumps({'commit': result['commit'], 'included': len(result['included']),
                      'excluded': len(result['excluded']), 'output': str(Path(args.output).resolve())}))


if __name__ == '__main__':
    main()
