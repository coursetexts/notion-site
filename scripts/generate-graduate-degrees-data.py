#!/usr/bin/env python3
"""Generate data/graduate-degrees-curriculum.json from the source Excel workbook."""

from __future__ import annotations

import os
from pathlib import Path

from degrees_workbook import generate_degrees_curriculum

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_XLSX = Path(
    '/Users/eesha/Desktop/Courses Coursetexts/Graduate_Courses.xlsx'
)
OUT_PATH = ROOT / 'data' / 'graduate-degrees-curriculum.json'
SKIP_SHEETS = frozenset({'Top 50 Graduate Programs'})


def main() -> None:
    xlsx = Path(os.environ.get('GRADUATE_DEGREES_XLSX', str(DEFAULT_XLSX)))
    generate_degrees_curriculum(xlsx, OUT_PATH, extra_skip_sheets=SKIP_SHEETS)


if __name__ == '__main__':
    main()
