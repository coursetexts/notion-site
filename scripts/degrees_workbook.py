"""Parse numbered degree sheets from Coursetexts curriculum Excel workbooks."""

from __future__ import annotations

import json
import re
import unicodedata
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
NS_MAP = {'m': NS}
NEW_COURSE_STYLE = '56'
RESOURCE_LABEL = re.compile(r'^(Textbook|Website|YouTube)\s+\d+', re.I)
DEFAULT_SKIP_SHEETS = frozenset({'Index', 'Jobs & Specializations', 'Repeated Courses'})


def sheet_order_number(sheet_name: str) -> int | None:
    match = re.match(r'^(\d+)\.', sheet_name.strip())
    return int(match.group(1)) if match else None


def should_skip_sheet(sheet_name: str, extra_skip: frozenset[str]) -> bool:
    if sheet_name in DEFAULT_SKIP_SHEETS or sheet_name in extra_skip:
        return True
    normalized = sheet_name.strip().lower()
    if 'jobs' in normalized and 'special' in normalized:
        return True
    if 'repeated' in normalized and 'course' in normalized:
        return True
    return sheet_order_number(sheet_name) is None


def load_preserved_degrees(out_path: Path) -> dict[int, dict[str, str]]:
    if not out_path.exists():
        return {}

    data = json.loads(out_path.read_text(encoding='utf-8'))
    preserved: dict[int, dict[str, str]] = {}
    for index, degree in enumerate(data.get('degrees', []), start=1):
        preserved[index] = {
            'id': degree['id'],
            'name': degree['name'],
            'shortName': degree['shortName'],
        }
    return preserved


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


def load_shared_strings(z: zipfile.ZipFile) -> list[str]:
    if 'xl/sharedStrings.xml' not in z.namelist():
        return []

    root = ET.fromstring(z.read('xl/sharedStrings.xml'))
    strings: list[str] = []
    for si in root.findall('m:si', NS_MAP):
        texts: list[str] = []
        for tnode in si.iter(f'{{{NS}}}t'):
            if tnode.text:
                texts.append(tnode.text)
        strings.append(''.join(texts))
    return strings


def read_cell(c: ET.Element, shared_strings: list[str]) -> dict[str, str]:
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
        if t == 's' and val.isdigit():
            index = int(val)
            val = shared_strings[index] if 0 <= index < len(shared_strings) else ''
    return {'v': val or '', 's': c.get('s', '')}


def read_sheet(
    z: zipfile.ZipFile, path: str, shared_strings: list[str]
) -> dict[int, dict[str, dict[str, str]]]:
    root = ET.fromstring(z.read(path))
    rows: dict[int, dict[str, dict[str, str]]] = {}
    for row in root.findall('.//m:sheetData/m:row', NS_MAP):
        rnum = int(row.get('r'))
        rows[rnum] = {}
        for c in row.findall('m:c', NS_MAP):
            col = re.match(r'([A-Z]+)', c.get('r', ''))
            if not col:
                continue
            rows[rnum][col.group(1)] = read_cell(c, shared_strings)
    return rows


def parse_schools_offering(rows: dict[int, dict[str, dict[str, str]]]) -> list[dict]:
    """School name (H) and requirements URL (J); ignores rank (G) and notes (K)."""
    schools: list[dict] = []
    for r in sorted(rows.keys()):
        school = rows[r].get('H', {}).get('v', '').strip()
        requirements_url = rows[r].get('J', {}).get('v', '').strip()
        if not school or school.lower() == 'school':
            continue
        if not requirements_url:
            continue
        schools.append({'name': school, 'requirementsUrl': requirements_url})
    return schools


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


def generate_degrees_curriculum(
    xlsx: Path,
    out_path: Path,
    *,
    extra_skip_sheets: frozenset[str] = frozenset(),
) -> None:
    if not xlsx.exists():
        raise SystemExit(f'Workbook not found: {xlsx}')

    preserved_by_order = load_preserved_degrees(out_path)

    with zipfile.ZipFile(xlsx) as z:
        shared_strings = load_shared_strings(z)
        rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        rid_to_target = {rel.get('Id'): rel.get('Target', '').lstrip('/') for rel in rels}
        wb = ET.fromstring(z.read('xl/workbook.xml'))
        sheets: list[tuple[str, str]] = []
        for sheet in wb.findall('.//m:sheet', NS_MAP):
            sheets.append(
                (
                    sheet.get('name', ''),
                    sheet.get(
                        '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id',
                        '',
                    ),
                )
            )

        degrees: list[dict] = []
        resource_course_count = 0
        for sheet_name, rid in sheets:
            if not rid or should_skip_sheet(sheet_name, extra_skip_sheets):
                continue

            rows = read_sheet(z, rid_to_target[rid], shared_strings)
            title_cell = rows.get(1, {}).get('A', {}).get('v', '')
            short_name = re.sub(r'^\d+\.\s*', '', sheet_name).strip()
            degree_name = parse_degree_title(title_cell) if title_cell else short_name
            courses = parse_degree_sheet(rows)
            schools_offering = parse_schools_offering(rows)
            resource_course_count += sum(1 for course in courses if 'resources' in course)

            sheet_order = sheet_order_number(sheet_name)
            preserved = preserved_by_order.get(sheet_order) if sheet_order else None
            if preserved:
                degree_id = preserved['id']
                degree_name = preserved['name']
                short_name = preserved['shortName']
            else:
                degree_id = slugify(short_name)

            degree_entry: dict = {
                'id': degree_id,
                'name': degree_name,
                'shortName': short_name,
                'courses': courses,
            }
            if schools_offering:
                degree_entry['schoolsOffering'] = schools_offering

            degrees.append(degree_entry)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps({'degrees': degrees}, ensure_ascii=False, indent=2) + '\n',
        encoding='utf-8',
    )
    course_count = sum(len(degree['courses']) for degree in degrees)
    print(
        f'Wrote {len(degrees)} degrees, {course_count} courses, '
        f'{resource_course_count} courses with resources → {out_path}'
    )
