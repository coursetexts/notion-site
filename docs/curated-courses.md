# Curated courses

Curated courses are **not** Notion pages. They are syllabus + video libraries linked from the Degrees page.

## End-to-end flow

```mermaid
flowchart TB
  subgraph Degrees["Degrees page"]
    UG["undergraduate-degrees-curriculum.json"]
    Grad["graduate-degrees-curriculum.json"]
    UI["/degrees UI"]
    UG --> UI
    Grad --> UI
  end

  subgraph Slug["Slug"]
    Name["course.name"]
    Fn["getCuratedCourseSlug()"]
    Path["/curated-course/{slug}"]
    Name --> Fn --> Path
  end

  UI -->|"See curated course videos"| Path

  subgraph Data["Content"]
    JSON["data/curated-courses/{slug}.json<br/>source of truth"]
    Catalog["seed_curated_course_video_courses.sql<br/>slug + title only"]
    Full["seed_fluid_mechanics_curated_course.sql<br/>or yarn seed:curated-courses"]
  end

  subgraph DB["Supabase"]
    CVC["curated_courses"]
    Nodes["curated_course_nodes"]
    Vids["curated_course_videos"]
    Res["curated_course_resources"]
    Notes["curated_course_notes"]
  end

  Catalog --> CVC
  JSON --> Full
  Full --> CVC
  Full --> Nodes
  Full --> Vids
  Full --> Res

  Path --> Page["CuratedCourse component"]
  Page --> Load["curated-course-db"]
  Load --> CVC
  Load --> Nodes
  Load --> Vids
  Load --> Res
  Load -.->|"fallback if empty<br/>fluid-mechanics only"| JSON
```

## Tables

| Table | Purpose |
|-------|---------|
| `curated_courses` | One row per slug |
| `curated_course_nodes` | Syllabus tree |
| `curated_course_videos` | Videos on a node |
| `curated_course_resources` | Textbooks / websites / channels |
| `curated_course_notes` | Per-user notes |

## Left-nav page sections

```mermaid
flowchart TB
  Nav["Left panel"]
  Rec["Recommended Syllabus<br/>→ overview page"]
  Tree["Topic / subtopic / concept tree"]
  Res["Resources"]
  TB["Core Textbooks"]
  Web["Websites and Open Resources"]
  YT["Video Channels"]

  Nav --> Rec
  Nav --> Tree
  Nav --> Res
  Res --> TB
  Res --> Web
  Res --> YT
```

- **Recommended Syllabus** — selectable section (course blurb + topic list); does **not** wrap the tree.  
- **Topic tree** — loads curated videos in the main panel.  
- **Resources** — from `curated_course_resources` (or degrees JSON fallback).

## JSON shape

See [`data/curated-courses/README.md`](../data/curated-courses/README.md).

```text
{slug}.json
  slug, title, description
  resources[]     kind: textbook | website | youtube
  topics[]        type: topic → subtopic → concept
    videos[]      ordered curated clips per node
```

## Filling another course

1. Add `data/curated-courses/{slug}.json` (copy Fluid Mechanics).  
2. Ensure catalog row exists (`curated_courses` — degrees catalog seed covers most names).  
3. Load tree:
   - **SQL Editor:** `seed_fluid_mechanics_curated_course.sql` is the template (self-contained: rename/fix/create + data), or  
   - `yarn seed:curated-courses -- --slug={slug}` (needs service role).  
4. Open `/curated-course/{slug}`.

## Fluid Mechanics (reference)

| Piece | Location |
|-------|----------|
| JSON SoT | `data/curated-courses/fluid-mechanics.json` |
| SQL seed | `supabase/migrations/new/seed_fluid_mechanics_curated_course.sql` |
| Route | `/curated-course/fluid-mechanics` |
| Degrees link | Engineering degrees → Fluid Mechanics → “See curated course videos” |

The Fluid Mechanics SQL seed is **self-contained**: it renames legacy `course_video_*` tables if needed, repairs bad names like `curated_courses_course`, ensures schema, then upserts the full tree.
