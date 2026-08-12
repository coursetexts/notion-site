# Database

Fresh installs: apply SQL in [`supabase/migrations/new/`](../supabase/migrations/new/README.md) (prefer `000_complete_schema.sql`, which includes curated courses through `014`).

## Table groups

```mermaid
flowchart TB
  subgraph Identity
    auth_users["auth.users"]
    profiles["profiles"]
  end

  subgraph NotionActivity["Notion course activity"]
    courses["courses<br/>(PK notion_page_id)"]
    comments["comments"]
    bookmarks["bookmarks"]
    annotations["annotations"]
    wall["course_resources<br/>+ votes/comments/bookmarks"]
    wall_sub["community_wall_subscriptions"]
    progress["course_section_progress"]
  end

  subgraph Polymorphic
    votes["votes<br/>comment · annotation · resource · course_video"]
  end

  subgraph Social
    follows["follows"]
    links["user_links · link_tags"]
    interests["profile_interests"]
    personal["profile_personal_links"]
  end

  subgraph Notebooks
    notebooks["notebooks"]
    tabs["notebook_tabs"]
  end

  subgraph CommunityPage["/community"]
    resources["resources"]
    kc["knowledge_components"]
  end

  subgraph Curated["Curated courses"]
    cvc["curated_courses"]
    nodes["curated_course_nodes"]
    videos["curated_course_videos"]
    notes["curated_course_notes"]
    ccr["curated_course_resources"]
  end

  auth_users --> profiles
  auth_users --> comments
  auth_users --> bookmarks
  auth_users --> annotations
  auth_users --> votes
  auth_users --> notebooks
  auth_users --> notes
  courses --> comments
  courses --> bookmarks
  courses --> annotations
  courses --> wall
  courses --> wall_sub
  courses -.-> cvc
  cvc --> nodes
  nodes --> nodes
  nodes --> videos
  cvc --> ccr
  notebooks --> tabs
```

## Core ERD (identity + Notion activity)

```mermaid
erDiagram
  auth_users ||--|| profiles : "user_id"
  auth_users ||--o{ comments : ""
  auth_users ||--o{ bookmarks : ""
  auth_users ||--o{ annotations : ""
  auth_users ||--o{ votes : ""
  auth_users ||--o{ follows : "follower / following"
  auth_users ||--o{ course_section_progress : ""

  courses ||--o{ comments : "course_id"
  courses ||--o{ bookmarks : ""
  courses ||--o{ annotations : ""
  courses ||--o{ course_resources : ""
  courses ||--o{ community_wall_subscriptions : ""

  comments ||--o{ comments : "parent_comment_id"
  annotations ||--o{ annotations : "parent_annotation_id"

  auth_users {
    uuid id PK
  }

  profiles {
    uuid id PK
    uuid user_id UK
    text display_name
    text avatar_url
    text email
    int karma_score
    timestamptz replies_last_read_at
  }

  courses {
    text notion_page_id PK
    text name
    text url
  }

  comments {
    uuid id PK
    uuid user_id FK
    text course_id FK "nullable if community target"
    uuid parent_comment_id FK
    text body
    text target_type "resource for /community"
    uuid target_id
  }

  bookmarks {
    uuid id PK
    uuid user_id FK
    text course_id FK
  }

  annotations {
    uuid id PK
    uuid user_id FK
    text course_id FK
    text section_id
    uuid parent_annotation_id FK
    text body
  }

  votes {
    uuid id PK
    uuid user_id FK
    text target_type
    uuid target_id
    smallint value "1 or -1"
  }
```

## Community wall vs site community

Two different “resource” concepts:

| Table | Used by | Meaning |
|-------|---------|---------|
| `course_resources` (+ `_votes`, `_comments`, `_bookmarks`) | Course **Community Wall** on a Notion course page | Per-course posts |
| `resources` + `knowledge_components` | `/community` | Site-wide library + FTS (`search_community`) |
| `curated_course_resources` | `/curated-course/{slug}` Resources nav | Textbooks / websites / channels |

```mermaid
erDiagram
  courses ||--o{ course_resources : "wall"
  course_resources ||--o{ course_resource_votes : ""
  course_resources ||--o{ course_resource_comments : ""
  course_resources ||--o{ course_resource_bookmarks : ""

  resources ||--o{ comments : "target_type=resource"
  resources ||--o{ votes : "target_type=resource"

  curated_courses ||--o{ curated_course_resources : ""
```

## Curated course ERD

```mermaid
erDiagram
  courses |o--o| curated_courses : "optional notion_page_id"
  curated_courses ||--o{ curated_course_nodes : ""
  curated_course_nodes ||--o{ curated_course_nodes : "parent_id"
  curated_course_nodes ||--o{ curated_course_videos : ""
  curated_courses ||--o{ curated_course_resources : ""
  auth_users ||--o{ curated_course_notes : ""
  curated_course_videos ||--o{ votes : "target_type=course_video"

  curated_courses {
    uuid id PK
    text slug UK
    text title
    text description
    text notion_page_id FK
  }

  curated_course_nodes {
    uuid id PK
    uuid course_id FK
    uuid parent_id FK
    enum node_type "topic subtopic concept"
    text title
    int sort_order
  }

  curated_course_videos {
    uuid id PK
    uuid node_id FK
    int sort_order
    text title
    text channel
    int duration_seconds
    text url
  }

  curated_course_resources {
    uuid id PK
    uuid course_id FK
    enum kind "textbook website youtube"
    text title
    text link_or_site
    int sort_order
  }

  curated_course_notes {
    uuid id PK
    uuid user_id FK
    text node_id
    text course_slug
    jsonb content
  }
```

### Table name map (current)

| Table | Role |
|-------|------|
| `curated_courses` | Catalog row per slug (`fluid-mechanics`, …) |
| `curated_course_nodes` | Syllabus tree (topic / subtopic / concept) |
| `curated_course_videos` | Ordered videos on a node |
| `curated_course_resources` | Textbooks / websites / channels |
| `curated_course_notes` | Per-user TipTap notes |

> Do **not** confuse with Community Wall `course_resources`, or legacy names `course_video_*` / `curated_courses_course`. Repair scripts: `015_rename_course_video_to_curated.sql`, `016_fix_curated_table_names.sql`.

Votes still use polymorphic `target_type = 'course_video'` (string discriminant, not a table name).

## Social + notebooks

```mermaid
erDiagram
  auth_users ||--o{ notebooks : ""
  notebooks ||--o{ notebook_tabs : ""
  auth_users ||--o{ follows : ""
  auth_users ||--o{ user_links : ""
  auth_users ||--o{ link_tags : ""
  user_links ||--o{ user_link_tags : ""
  link_tags ||--o{ user_link_tags : ""
  auth_users ||--o{ profile_interests : ""
  auth_users ||--o{ profile_personal_links : ""

  notebooks {
    uuid id PK
    uuid user_id FK
    text title
    text description
    boolean published
  }

  notebook_tabs {
    uuid id PK
    uuid notebook_id FK
    text title
    jsonb content
    int sort_order
  }
```

## RPCs

| Function | Purpose |
|----------|---------|
| `handle_new_user()` | Trigger: create `profiles` on signup |
| `list_users_directory(...)` | `/users` pagination + interest filter |
| `search_community(q, max)` | FTS over `resources` + `knowledge_components` |
| `delete_*_votes()` | Clean polymorphic votes on delete |

## RLS pattern (summary)

- **Public read** for social content (profiles, comments, curated courses, published notebooks).
- **Owner write** (`auth.uid() = user_id` / author columns).
- **Courses** (Notion refs): anyone can insert/update (no PII; created on first visit).
- **Curated video tree**: public read; any authenticated user can mutate (curation left open).
- **`user_links.is_private`**: filtered in app code, not RLS.
