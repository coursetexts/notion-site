# Coursetexts documentation

Architecture and data docs for this repo. Diagrams use [Mermaid](https://mermaid.js.org/) (GitHub, VS Code, or Notion).

| Doc                                                        | What’s inside                                                                                                                                                                        |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Architecture](./architecture.md)                          | Surfaces, data sources, request flow. `/all-courses` title toggle, `/community` explainers, `/reports` (open while testing), future Notion-course migrate, unbuilt job/life atlases. |
| [Database](./database.md)                                  | Supabase schema groups + ER diagrams                                                                                                                                                 |
| [Auth](./auth.md)                                          | Google OAuth → profiles                                                                                                                                                              |
| [Community / research learning paths](./learning-paths.md) | Goal-based paths at `/learning-path/{slug}`. Private → public/collab needs 2 resources + a real why on every topic.                                                                  |
| [Course learning paths](./curated-courses.md)              | Degree syllabi at `/learning-path/{slug}` (`kind=course`). Not Notion professor courses.                                                                                             |
| [Knowledge](./knowledge.md)                                | Profile Knowledge tab, finish celebration, duration + enjoyment %, shared graph. Daily LLM cron exists but is **disabled**.                                                          |
| [Migrations (SQL)](../supabase/migrations/README.md)       | Fresh DB setup / seed order                                                                                                                                                          |

> `SUPABASE_AUTH_AND_DATA.md` is a pointer only. Prefer this folder.
