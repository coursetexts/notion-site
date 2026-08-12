# Curated courses data

Each file in this folder is the **source of truth** for one curated-course
video syllabus (`/curated-course/{slug}`).

## File shape

`{slug}.json`:

```json
{
  "slug": "fluid-mechanics",
  "title": "Fluid Mechanics",
  "description": "One-paragraph course blurb.",
  "resources": [
    {
      "kind": "textbook",
      "title": "…",
      "linkOrSite": "Publisher or https://…",
      "description": "…"
    }
  ],
  "topics": [
    {
      "type": "topic",
      "title": "…",
      "description": "…",
      "videos": [
        {
          "title": "…",
          "channel": "…",
          "durationSeconds": 522,
          "url": "https://…",
          "annotation": "optional"
        }
      ],
      "children": [
        {
          "type": "subtopic",
          "title": "…",
          "children": [
            { "type": "concept", "title": "…" }
          ]
        }
      ]
    }
  ]
}
```

### `resources[].kind`

| kind | Left-nav section |
|------|------------------|
| `textbook` | Core Textbooks |
| `website` | Websites and Open Resources |
| `youtube` | Video Channels |

### `topics` tree

- `topic` → `subtopic` → `concept` → rows in `curated_course_nodes`
- Videos attach to any node via `videos[]` → `curated_course_videos`
- Parents do **not** inherit child videos
- Resources → `curated_course_resources`

## How to add another course

1. Copy `fluid-mechanics.json` → `{your-slug}.json`
2. Fill `slug` / `title` / `description` / `resources` / `topics`
3. Ensure a matching row exists in `curated_courses` (catalog seed or insert)
4. Load into Supabase:
   - **SQL Editor:** run / adapt `supabase/seeds/curated-courses/seed_fluid_mechanics_curated_course.sql` (self-contained schema + data), or
   - **Script:** `yarn seed:curated-courses -- --slug=your-slug` (needs service role)

## Fluid Mechanics

`fluid-mechanics.json` was exported from the previous hardcoded seed + degrees-page resources.  
Open at `/curated-course/fluid-mechanics`.
