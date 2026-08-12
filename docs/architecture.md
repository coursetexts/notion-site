# Architecture

## Big picture

Coursetexts is a Next.js site with three content pillars:

1. **Notion-backed courses** — page content from Notion; social activity in Supabase  
2. **Degrees curricula** — hardcoded JSON outlines + links into curated courses  
3. **Community / profiles** — fully Supabase-backed

```mermaid
flowchart TB
  subgraph Client["Next.js app"]
    Pages["Pages / UI"]
    AuthCtx["AuthContext"]
  end

  subgraph Content["Content sources"]
    Notion["Notion API<br/>course pages + sitemap"]
    DegreesJSON["data/*-degrees-curriculum.json"]
    CuratedJSON["data/curated-courses/{slug}.json"]
  end

  subgraph Supabase["Supabase"]
    Auth["Auth (Google OAuth)"]
    DB["Postgres + RLS"]
  end

  Pages -->|"render course HTML"| Notion
  Pages -->|"degrees UI"| DegreesJSON
  Pages -->|"fallback / seed SoT"| CuratedJSON
  Pages -->|"activity, community, curated trees"| DB
  AuthCtx -->|"sign-in / session"| Auth
  Auth -->|"JWT"| Pages
  Auth -->|"trigger → profiles"| DB
```

## App surfaces

```mermaid
flowchart LR
  Home["/  Home + Notion"]
  Course["/[pageId]  Notion course"]
  All["/all-courses"]
  Degrees["/degrees"]
  Curated["/curated-course/{slug}"]
  Community["/community"]
  Profile["/profile  /profile/{userId}"]
  Users["/users"]
  Notebook["/notebook/{id}"]
  Signin["/signin  /auth/callback"]

  Degrees -->|"See curated course videos"| Curated
  Course -->|"comments / wall / bookmarks"| Profile
  Community --> Profile
  Profile --> Notebook
  Signin --> Profile
```

| Surface | Route(s) | Primary data |
|---------|----------|--------------|
| Notion courses | `/`, `/[pageId]`, `/all-courses`, `/c/*` | Notion + Supabase `courses` / activity |
| Degrees | `/degrees` | UG / grad JSON |
| Curated course | `/curated-course/[courseSlug]` | `curated_courses` / `curated_course_*` (+ JSON fallback) |
| Community | `/community` | `resources`, `knowledge_components`, comments/votes |
| Profile / social | `/profile`, `/profile/[userId]`, `/users` | profiles, follows, links, notebooks |
| Auth | `/signin`, `/auth/callback` | Supabase Auth |

## How a Notion course page uses the DB

Notion still owns the **content**. Supabase stores **people activity** keyed by Notion page id.

```mermaid
sequenceDiagram
  participant User
  participant Page as /[pageId]
  participant Notion
  participant SB as Supabase

  User->>Page: Open course
  Page->>Notion: Fetch page blocks
  Notion-->>Page: HTML / recordMap
  Page->>SB: Upsert courses row (notion_page_id)
  Page->>SB: Load comments, bookmarks, annotations, wall
  SB-->>Page: Activity + RLS
  User->>Page: Comment / bookmark / vote
  Page->>SB: Insert/update as auth.uid()
```

## Key conventions

- **Browser client** uses the anon key + user JWT only (`lib/supabase.ts`). RLS is the ACL.
- **`profiles.user_id`** is the auth uid everywhere (not `profiles.id`).
- **Notion courses** use `courses.notion_page_id` (text PK).  
- **Curated courses** use `curated_courses.slug`, with `curated_course_nodes`, `curated_course_videos`, `curated_course_resources`, `curated_course_notes`.
- **Service role** is for seed scripts only, never the browser.
