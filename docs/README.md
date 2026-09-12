# Coursetexts documentation

Architecture and data docs for this repo. Diagrams use [Mermaid](https://mermaid.js.org/) (GitHub, VS Code, or Notion).

| Doc                                                        | What’s inside                                                                                                                                                                        |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Architecture](./architecture.md)                          | Surfaces, route catalog, user flows, how pages talk to Notion + Supabase |
| [Routes & gaps](./gaps.md)                                 | **404 routes, partial features, orphaned APIs**, and what is not wired yet |
| [Database](./database.md)                                  | Supabase schema groups + ER diagrams |
| [Auth](./auth.md)                                          | Google OAuth → profiles. After sign-in, return to the page/section that gated you.                                                                                                   |
| [Community / research learning paths](./learning-paths.md) | Goal-based paths at `/learning-path/{slug}`. Outline: **Overview**, then the accordion topic tree. Private → public/collab needs 1 resource + a real why on every topic. Hero shows Public / Open to suggestions / Private · Published; **•••** is Report for visitors (owners get Delete / visibility / Invite editors). Owners: **Invite editors** on any visibility. Private paths: **Request to join**. Open to suggestions: dotted suggestion cards, owner **Accept**. Inline title/why + **Edit path** (inline add under/after). People sidebar: collaborators then savers. **Context** opens a dialog with an LLM prompt of the current step and outline. Topic threads are **Discussions**. |
| [Course learning paths](./curated-courses.md)              | Degree syllabi at `/learning-path/{slug}` (`kind=course`). Outline: **Overview**, then the syllabus tree. **Commit & Remind Me** on Overview. Not Notion professor courses. |
| [Knowledge](./knowledge.md)                                | `/knowledge-graph` snapshot, profile Knowledge tab (list), finish celebration, duration + enjoyment %, shared catalog + path occurrences. Profile graph is hidden. Daily LLM cron exists but is **disabled**. Partial/unwired features: [gaps.md](./gaps.md). |
| [Migrations (SQL)](../supabase/migrations/README.md)       | Fresh DB setup / seed order                                                                                                                                                          |

> `SUPABASE_AUTH_AND_DATA.md` is a pointer only. Prefer this folder.
