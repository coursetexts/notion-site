# Routes and flows not wired yet

What is **live** vs **partial**, **404**, or **orphaned API** in the current codebase. See [architecture — Route catalog](./architecture.md#route-catalog) for the full live list.

## URLs that 404

| URL | Notes |
| --- | ----- |
| `/feed.xml` | RSS metadata references this URL, but only `/feed` exists. Subscribers using `/feed.xml` get 404. |
| Bare root slugs (e.g. `/some-course-name`) | Not a route. Use `/course/{slug}` for Notion courses or `/learning-path/{slug}` for syllabi/paths. Only `/about`, `/process`, and `/why` are valid root Notion overrides. |
| Former legacy paths (`/undergraduate-degrees`, `/human-knowledge-atlas`, `/curated-course/*`, `/course-learning-path/*`, `/course-videos`, `/c/*`, `/research-field-atlas`, `/notebook/*`) | Removed. Link to `/degrees`, `/field-atlas`, `/learning-path/{slug}`, or `/course/{slug}` directly. |

## Product features: UI exists, backend incomplete

| Feature | Where | Gap |
| ------- | ----- | --- |
| **Learning streaks** | Profile Learning cards | `lib/profile-learning-streaks.ts` mocks a few titles; real streak tracking not built. |
| **Profile Updates** | profile Feed | Needs migration `050_profile_updates.sql` applied in Supabase for posts, likes, and comments. |
| **Commitment reminders** | Profile **Notify** tag, `learning_path_commitments` | Cadence saves to DB; **no notification delivery** (email/push). |
| **Karma score** | `profiles.karma_score` | `lib/karma.ts` is a deliberate no-op; votes work but score never updates. |
| **Knowledge graph daily cron** | `pages/api/cron/rebuild-knowledge-graph.ts` | Disabled unless `KNOWLEDGE_GRAPH_CRON_ENABLED=true`; `vercel.json` has no cron schedule. |
| **LLM topic clustering** | `lib/knowledge-graph-llm.ts` | Schema defined; not wired to `/knowledge-graph` (exact label match only). |
| **Curated videos (syllabus paths)** | `CourseLearningPathVideoList` | Empty state: “Curated videos coming soon”. |
| **Empty syllabus stubs** | Course learning path Overview / nav | “Syllabus topics coming soon” for unfilled `kind=course` rows. |
| **Reports dashboard access** | `/reports` | `REPORTS_DASHBOARD_OPEN = true` in `lib/content-reports.ts` — **anyone can view** while testing. Flip to false to require `coursetexts.info@gmail.com`. |
| **Private path invites / join requests** | Learning path hero, profile Feed | Email stored; **no invitation email sent**. Owner must invite manually in app. |

## API routes: implemented but not connected to UI

| Route | Status | Notes |
| ----- | ------ | ----- |
| `/api/notion-page-info` | Active, unused | No client callers found. |
| `/api/logout` | Active, unused | Clears preview iron-session; no UI button calls it. |
| `/api/social-image` | Active, bypassed | Serves static PNG; `getSocialImageUrl()` uses `/images/og-preview.png` directly. |
| `/api/knowledge-graph` | **410 Gone** | Disabled; `/knowledge-graph` reads bundled `data/knowledge-graph.json`. |
| `/api/cron/rebuild-knowledge-graph` | Disabled by default | Returns `{ disabled: true }` unless env flag set. |

## API routes: wired and live

| Route | Method | Used by |
| ----- | ------ | ------- |
| `/api/login` | POST | Preview password gate when `PASSWORD_PROTECT=true` |
| `/api/course-toc` | POST | Header pin-nav Continue on Notion courses |
| `/api/fill-learning-path` | POST | **Fill out this path for me** on `/learning-path/new` (needs `GEMINI_API_KEY`) |
| `/api/search-notion` | POST | Notion in-page search |
| `/api/knowledge-graph/ingest` | POST | After finishing a public path (signed-in) |

## Stale static pages (legal)

`pages/privacy-policy.tsx` and `pages/terms-of-service.tsx` still link to old About URLs (`/why`, hardcoded Notion paths). Header About menu uses `/manifesto`, `/about`, `/process`.

## Abandoned experiments (removed from repo)

| Item | Status |
| ---- | ------ |
| `/db-course/{slug}` Supabase course mirror | Removed. If you applied migration `046`, run `047_revert_official_course_content.sql`. |
| `yarn sync:notion-courses` | Script removed. |
| Legacy redirect routes | Removed. Use canonical URLs only. |
| Google Sheets APIs + legacy footer/feedback UI | Removed (`/api/append-to-sheet`, `/api/append-course-feedback`, `Footer`, `FeedbackForm`). |
| Course chat API + panel | Removed (`/api/course-chat`, `CourseChatPanel`). |
| Legacy Community Wall + standalone notebooks | Removed (`CommunityWall`, `/notebook/{id}`, `course_resources*`, `notebooks*`). Run `048_drop_community_wall_and_notebooks.sql` if those tables exist. |

## Future (documented, not started)

- **Official Notion courses on `learning_paths`** — still Notion-only at `/course/{pageId}`. See [architecture — Future](./architecture.md#future-official-notion-courses).
