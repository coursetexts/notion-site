#!/usr/bin/env python3
"""Apply course document URLs from the mastersheet to degree curriculum JSON."""

from __future__ import annotations

import json
import os
import re
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_XLSX = Path(
    '/Users/eesha/Desktop/Courses Coursetexts/Mastersheet/courses.xlsx'
)
CURRICULUM_PATHS = (
    ROOT / 'data' / 'undergraduate-degrees-curriculum.json',
    ROOT / 'data' / 'graduate-degrees-curriculum.json',
)

# JSON course names that differ from the mastersheet "Course Name" column.
COURSE_NAME_ALIASES: dict[str, str] = {
    'calculus': 'calculus (repeated)',
}


def normalize_name(name: str) -> str:
    return re.sub(r'\s+', ' ', name.strip().lower())


def load_course_urls(xlsx_path: Path) -> dict[str, str]:
    workbook = openpyxl.load_workbook(xlsx_path, read_only=True, data_only=True)
    worksheet = workbook['Course Freqencies']

    urls_by_name: dict[str, str] = {}
    for row in worksheet.iter_rows(min_row=2, values_only=True):
        raw_name = row[0]
        raw_url = row[1] if len(row) > 1 else None
        if not raw_name:
            continue

        name = str(raw_name).strip()
        url = str(raw_url).strip() if raw_url else ''
        if not url:
            continue

        urls_by_name[normalize_name(name)] = url

    workbook.close()
    return urls_by_name


def resolve_course_url(course_name: str, urls_by_name: dict[str, str]) -> str | None:
    normalized = normalize_name(course_name)
    if normalized in urls_by_name:
        return urls_by_name[normalized]

    alias = COURSE_NAME_ALIASES.get(normalized)
    if alias and alias in urls_by_name:
        return urls_by_name[alias]

    return None


def apply_urls_to_curriculum(path: Path, urls_by_name: dict[str, str]) -> dict[str, int]:
    data = json.loads(path.read_text(encoding='utf-8'))

    stats = {
        'course_entries': 0,
        'updated': 0,
        'missing': 0,
    }
    missing_names: set[str] = set()

    for degree in data.get('degrees', []):
        for course in degree.get('courses', []):
            stats['course_entries'] += 1
            url = resolve_course_url(course.get('name', ''), urls_by_name)
            if url:
                course['documentUrl'] = url
                stats['updated'] += 1
            else:
                course.pop('documentUrl', None)
                stats['missing'] += 1
                missing_names.add(course.get('name', ''))

    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    stats['missing_names'] = sorted(missing_names)
    return stats


def main() -> None:
    xlsx_path = Path(os.environ.get('COURSE_MASTERSHEET_XLSX', str(DEFAULT_XLSX)))
    urls_by_name = load_course_urls(xlsx_path)

    for curriculum_path in CURRICULUM_PATHS:
        stats = apply_urls_to_curriculum(curriculum_path, urls_by_name)
        print(f'{curriculum_path.name}:')
        print(f'  course entries: {stats["course_entries"]}')
        print(f'  updated: {stats["updated"]}')
        print(f'  missing: {stats["missing"]}')
        if stats['missing_names']:
            print(f'  missing names: {", ".join(stats["missing_names"])}')


if __name__ == '__main__':
    main()
