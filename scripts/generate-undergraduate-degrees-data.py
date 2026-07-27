#!/usr/bin/env python3
"""Generate data/undergraduate-degrees-curriculum.json from the source Excel workbook."""

from __future__ import annotations

import os
from pathlib import Path

from degrees_workbook import generate_degrees_curriculum

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_XLSX = Path(
    '/Users/eesha/Desktop/Courses Coursetexts/Common_Undergraduate_Degrees_Curriculum.xlsx'
)
OUT_PATH = ROOT / 'data' / 'undergraduate-degrees-curriculum.json'


def main() -> None:
    xlsx = Path(os.environ.get('UNDERGRAD_DEGREES_XLSX', str(DEFAULT_XLSX)))
    generate_degrees_curriculum(xlsx, OUT_PATH)


if __name__ == '__main__':
    main()
