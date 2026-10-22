"""Shared writer for curated-course SQL seeds."""
import json
import uuid
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "supabase/seeds/curated-courses"


def sql_str(s):
    return "'" + s.replace("'", "''") + "'"


def write_seed(slug, title, desc, course_id, tag, units, file_slug):
    if not units:
        raise SystemExit(f"refusing empty seed for {slug}")
    rows = []
    json_topics = []
    n_topics = n_subs = n_concepts = 0
    for ti, (tt, td, subs) in enumerate(units):
        tid = str(uuid.uuid4())
        n_topics += 1
        rows.append((tid, course_id, None, "topic", tt, td, ti))
        jsubs = []
        for si, (st, sd, concepts) in enumerate(subs):
            sid = str(uuid.uuid4())
            n_subs += 1
            rows.append((sid, course_id, tid, "subtopic", st, sd, si))
            jconcepts = []
            for ci, ct in enumerate(concepts):
                cid = str(uuid.uuid4())
                n_concepts += 1
                rows.append((cid, course_id, sid, "concept", ct, None, ci))
                jconcepts.append({"id": cid, "type": "concept", "title": ct})
            jsub = {"id": sid, "type": "subtopic", "title": st, "children": jconcepts}
            if sd is not None:
                jsub["description"] = sd
            jsubs.append(jsub)
        json_topics.append({"id": tid, "type": "topic", "title": tt, "description": td, "children": jsubs})
    payload = json.dumps(
        {"slug": slug, "title": title, "description": desc, "topics": json_topics, "dbBacked": True},
        ensure_ascii=False,
    )
    chunks = []
    buf = []
    for row in rows:
        buf.append(row)
        if len(buf) == 40:
            chunks.append(buf)
            buf = []
    if buf:
        chunks.append(buf)

    out = []
    out.append(f"-- name: seed_{file_slug}_curated_course")
    out.append("-- =============================================================================")
    out.append(f"-- {title} curated course seed (data only)")
    out.append("-- Assumes curated_courses / curated_course_nodes already exist.")
    out.append(f"-- Source: {title} syllabus (no videos/resources).")
    out.append("-- Also upserts learning_paths (kind = course) so the syllabus is filled.")
    out.append("-- Node inserts are chunked so the SQL editor can parse them.")
    out.append("-- =============================================================================")
    out.append("")
    out.append(f"delete from public.curated_courses where slug = '{slug}';")
    out.append("")
    out.append("insert into public.curated_courses (id, slug, title, description)")
    out.append(f"values ({sql_str(course_id)}, {sql_str(slug)}, {sql_str(title)}, {sql_str(desc)});")
    out.append("")
    out.append("-- Syllabus nodes (topic -> subtopic -> concept)")
    for chunk in chunks:
        out.append("insert into public.curated_course_nodes (id, course_id, parent_id, node_type, title, description, sort_order)")
        out.append("values")
        lines = []
        for nid, cid, parent, ntype, title_, desc_, sort in chunk:
            parent_sql = "null" if parent is None else sql_str(parent)
            desc_sql = "null" if desc_ is None else sql_str(desc_)
            lines.append(
                f"  ({sql_str(nid)}, {sql_str(cid)}, {parent_sql}, {sql_str(ntype)}::public.curated_course_node_type, {sql_str(title_)}, {desc_sql}, {sort})"
            )
        out.append(",\n".join(lines) + ";")
        out.append("")
    total = n_topics + n_subs + n_concepts
    out.append(f"-- {n_topics} topics, {n_subs} subtopics, {n_concepts} concepts ({total} nodes), 0 videos, 0 resources")
    out.append("")
    dollar = f"${tag}$"
    out.append("insert into public.learning_paths (")
    out.append("  slug, owner_id, title, goal, summary, data, is_catalog, is_private, kind, visibility")
    out.append(")")
    out.append("select")
    out.append(f"  {sql_str(slug)},")
    out.append("  null,")
    out.append(f"  {sql_str(title)},")
    out.append(f"  {sql_str(title)},")
    out.append(f"  {sql_str(desc)},")
    out.append(f"  {dollar}{payload}{dollar}::jsonb,")
    out.append("  true,")
    out.append("  false,")
    out.append("  'course',")
    out.append("  'public'")
    out.append("where not exists (")
    out.append(f"  select 1 from public.learning_paths where slug = {sql_str(slug)}")
    out.append(");")
    out.append("")
    out.append("update public.learning_paths")
    out.append("set")
    out.append(f"  title = {sql_str(title)},")
    out.append(f"  goal = {sql_str(title)},")
    out.append(f"  summary = {sql_str(desc)},")
    out.append(f"  data = {dollar}{payload}{dollar}::jsonb,")
    out.append("  is_catalog = true,")
    out.append("  is_private = false,")
    out.append("  owner_id = null,")
    out.append("  kind = 'course',")
    out.append("  visibility = 'public',")
    out.append("  updated_at = now()")
    out.append(f"where slug = {sql_str(slug)}")
    out.append("  and (kind is null or kind = 'course');")
    out.append("")
    path = OUT / f"seed_{file_slug}_curated_course.sql"
    path.write_text("\n".join(out))
    text = path.read_text()
    print(f"{path.name} {n_topics} {n_subs} {n_concepts} {total} tag {tag} dollars {text.count(dollar)}")
