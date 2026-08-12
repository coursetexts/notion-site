# Coursetexts documentation

Architecture and data docs for this repo. Diagrams use [Mermaid](https://mermaid.js.org/) (render in GitHub, VS Code, or Notion).

| Doc | What’s inside |
|-----|----------------|
| [Architecture](./architecture.md) | App surfaces, data sources, request flow |
| [Database](./database.md) | Supabase schema groups + ER diagrams |
| [Auth](./auth.md) | Google OAuth → profiles |
| [Curated courses](./curated-courses.md) | Degrees → `/curated-course/{slug}` → `curated_*` tables |
| [Migrations (SQL)](../supabase/migrations/new/README.md) | Fresh DB setup / seed order |

> Older notes in `SUPABASE_AUTH_AND_DATA.md` are outdated (pre–`notion_page_id` PK and curated courses). Prefer this folder.
