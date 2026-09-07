# Source-only listing export

The repository includes assets that the listing QC scanner cannot inspect.
Create the delivery ZIP from a reviewed, committed revision:

```sh
python3 scripts/export_listing.py --ref HEAD --output /tmp/source-listing.zip
python3 scripts/test_export_listing.py
```

Run from the repository root. The destination must not already exist. Commit
intended changes first: the exporter reads Git objects, so working-tree edits,
untracked files, credentials in local environment files, and history are absent.

The ZIP contains `source/` and `listing-manifest.json`. The manifest records the
resolved commit, each included file's SHA-256 and size, and every excluded path
with a reason. Output is deterministic for the same commit and exporter.
Only recognized UTF-8 source/text formats up to 1 MiB per file are included. Binary content, unknown
formats, environment files, generated distributions, symlinks, submodules and
unresolved Git LFS pointers are excluded. Empty binary-format files are excluded
too. No excluded asset is certified as clean or encoded into the delivery.

This is a source review artifact, **not a runnable application distribution**.
Fonts, icons, videos, model weights, databases, binary test fixtures and build
wrappers remain in the repository for normal development and builds. Source-only
recipients need those separately to run affected builds or tests. Review the
manifest and agree on this scope before delivery; if a complete runnable archive
is required, the opaque assets need a separate supported review process.

Scan the actual generated ZIP and rerun listing QC against that artifact.
This exporter does not detect or redact secrets, grant a QC pass, change the
provider's score, or sanitize Git history. A listing that automatically downloads
the full GitHub archive must be switched to this source artifact; simply adding
this script does not change that download. A prior listing must be refreshed
from the sanitized revision rather than rescanned from its old cached archive.
