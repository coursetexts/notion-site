#!/usr/bin/env python3
"""Generate data/undergraduate-degrees-curriculum.json from the source Excel workbook."""

from __future__ import annotations

import json
import re
import unicodedata
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_XLSX = Path(
    '/Users/eesha/Desktop/Courses Coursetexts/Common_Undergraduate_Degrees_Curriculum.xlsx'
)
OUT_PATH = ROOT / 'data' / 'undergraduate-degrees-curriculum.json'
NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
NS_MAP = {'m': NS}
NEW_COURSE_STYLE = '56'
RESOURCE_LABEL = re.compile(r'^(Textbook|Website|YouTube)\s+\d+', re.I)
SKIP_SHEETS = frozenset({'Index', 'Jobs & Specializations'})


def should_skip_sheet(sheet_name: str) -> bool:
    if sheet_name in SKIP_SHEETS:
        return True
    normalized = sheet_name.strip().lower()
    return 'jobs' in normalized and 'special' in normalized


def slugify(text: str) -> str:
    text = re.sub(r'^\d+\.\s*', '', text).strip().lower()
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii')
    text = re.sub(r'[^a-z0-9]+', '-', text).strip('-')
    return text or 'degree'


def parse_degree_title(cell: str) -> str:
    return re.sub(r'\s*-\s*Curriculum.*$', '', cell, flags=re.I).strip()


def is_topic_row(b_val: str) -> bool:
    return bool(re.match(r'^\s+\d+\.', b_val))


def normalize_resource_kind(label: str) -> str:
    kind = label.strip().lower()
    if kind == 'youtube':
        return 'youtube'
    if kind == 'website':
        return 'website'
    return 'textbook'


def read_cell(c: ET.Element) -> dict[str, str]:
    t = c.get('t')
    if t == 'inlineStr':
        is_elem = c.find('m:is', NS_MAP)
        texts: list[str] = []
        if is_elem is not None:
            for tnode in is_elem.iter(f'{{{NS}}}t'):
                if tnode.text:
                    texts.append(tnode.text)
        val = ''.join(texts)
    else:
        v = c.find('m:v', NS_MAP)
        val = v.text if v is not None else ''
    return {'v': val or '', 's': c.get('s', '')}


def read_sheet(z: zipfile.ZipFile, path: str) -> dict[int, dict[str, dict[str, str]]]:
    root = ET.fromstring(z.read(path))
    rows: dict[int, dict[str, dict[str, str]]] = {}
    for row in root.findall('.//m:sheetData/m:row', NS_MAP):
        rnum = int(row.get('r'))
        rows[rnum] = {}
        for c in row.findall('m:c', NS_MAP):
            col = re.match(r'([A-Z]+)', c.get('r', ''))
            if not col:
                continue
            rows[rnum][col.group(1)] = read_cell(c)
    return rows


def parse_resource_row(rows: dict[int, dict[str, dict[str, str]]], r: int, b: str) -> dict:
    title = rows[r].get('C', {}).get('v', '').strip()
    link_or_site = rows[r].get('D', {}).get('v', '').strip()
    description = rows[r].get('E', {}).get('v', '').strip()
    kind_label = RESOURCE_LABEL.match(b.strip())
    kind = normalize_resource_kind(kind_label.group(1) if kind_label else 'textbook')

    return {
        'kind': kind,
        'title': title,
        'linkOrSite': link_or_site,
        'description': description,
    }


def parse_degree_sheet(rows: dict[int, dict[str, dict[str, str]]]) -> list[dict]:
    courses: list[dict] = []
    current: dict | None = None
    in_resources = False

    for r in sorted(rows.keys()):
        if r < 5:
            continue

        a = rows[r].get('A', {}).get('v', '').strip()
        b_cell = rows[r].get('B', {})
        b_raw = b_cell.get('v', '')
        b = b_raw.strip()

        if not b:
            continue

        if b == 'Recommended Resources':
            in_resources = True
            continue

        if in_resources and RESOURCE_LABEL.match(b):
            if current is not None:
                current['resources'].append(parse_resource_row(rows, r, b))
            continue

        if is_topic_row(b_raw):
            in_resources = False
            if current is not None:
                topic = re.sub(r'^\s+\d+\.\s*', '', b_raw).strip()
                current['topics'].append(topic)
            continue

        if a or rows[r].get('C', {}).get('v', '').strip():
            in_resources = False
            if current is not None:
                courses.append(current)

            c_type = rows[r].get('C', {}).get('v', '').strip()
            year = rows[r].get('D', {}).get('v', '').strip()
            desc = rows[r].get('E', {}).get('v', '').strip()
            is_new = b_cell.get('s') == NEW_COURSE_STYLE

            try:
                num = int(float(a)) if a else len(courses) + 1
            except ValueError:
                num = len(courses) + 1

            current = {
                'number': num,
                'name': b,
                'type': c_type,
                'year': year,
                'description': desc,
                'isNew': is_new,
                'topics': [],
                'resources': [],
            }

    if current is not None:
        courses.append(current)

    for course in courses:
        if not course['resources']:
            del course['resources']

    return courses


def main() -> None:
    xlsx = Path(__import__('os').environ.get('UNDERGRAD_DEGREES_XLSX', str(DEFAULT_XLSX)))
    if not xlsx.exists():
        raise SystemExit(f'Workbook not found: {xlsx}')

    with zipfile.ZipFile(xlsx) as z:
        rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        rid_to_target = {rel.get('Id'): rel.get('Target', '').lstrip('/') for rel in rels}
        wb = ET.fromstring(z.read('xl/workbook.xml'))
        sheets: list[tuple[str, str]] = []
        for s in wb.findall('.//m:sheet', NS_MAP):
            sheets.append(
                (
                    s.get('name', ''),
                    s.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id', ''),
                )
            )

        degrees: list[dict] = []
        resource_course_count = 0
        for sheet_name, rid in sheets:
            if not rid or should_skip_sheet(sheet_name):
                continue

            rows = read_sheet(z, rid_to_target[rid])
            title_cell = rows.get(1, {}).get('A', {}).get('v', '')
            short_name = re.sub(r'^\d+\.\s*', '', sheet_name).strip()
            degree_name = parse_degree_title(title_cell) if title_cell else short_name
            courses = parse_degree_sheet(rows)
            resource_course_count += sum(1 for c in courses if 'resources' in c)

            degrees.append(
                {
                    'id': slugify(short_name),
                    'name': degree_name,
                    'shortName': short_name,
                    'courses': courses,
                }
            )

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(
        json.dumps({'degrees': degrees}, ensure_ascii=False, indent=2) + '\n',
        encoding='utf-8',
    )
    course_count = sum(len(d['courses']) for d in degrees)
    print(
        f'Wrote {len(degrees)} degrees, {course_count} courses, '
        f'{resource_course_count} courses with resources → {OUT_PATH}'
    )


if __name__ == '__main__':
    main()
