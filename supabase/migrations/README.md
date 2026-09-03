# Fresh Supabase database (final schema)

These SQL files recreate the **current** app schema for a brand-new Supabase project.
They collapse historical migrations into a clean final state (no drop/recreate churn).

Run them **in numeric order** in the Supabase SQL Editor (or via CLI). On an empty database, prefer **`000_complete_schema.sql` once** (includes `001`–`030`, `034`–`038`, and `040`, with commitment reminder columns). Do **not** also run `001`–`030` on the same empty database.

## 1. Create the project

1. Create a new Supabase project.
2. Copy **Project URL** and **anon public** key into your app env:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

3. For optional seed scripts only, also set:

```bash
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
COMMUNITY_SEED_PROJECT_REF=<project-ref>
CURATED_COURSES_SEED_PROJECT_REF=<project-ref>
LEARNING_PATHS_SEED_PROJECT_REF=<project-ref>
```

## 2. Auth (required for the site to work the same)

In Supabase Dashboard → **Authentication**:

1. Enable **Google** provider (Client ID / Secret from Google Cloud).
2. Under URL configuration:
   - **Site URL:** live origin (`https://coursetexts.org` or preview)
   - **Redirect URLs** (all of these; missing localhost is why local Google sign-in jumps to production):
     - `http://localhost:3000/auth/callback`
     - `http://127.0.0.1:3000/auth/callback`
     - `https://coursetexts.org/auth/callback`
     - `https://preview.coursetexts.org/auth/callback`
3. Confirm the Google OAuth redirect URI includes:
   `https://<project-ref>.supabase.co/auth/v1/callback`

The schema creates `public.handle_new_user` + trigger `on_auth_user_created` so each new `auth.users` row gets a `profiles` row automatically.

## 3. Apply SQL (in order)

### Naming queries in the SQL Editor

SQL cannot set the sidebar/tab label — that lives in the dashboard. Each file starts with `-- name: 00x_...` for copy/paste.

After you paste and **Run**:
1. Studio sometimes AI-renames the snippet from the SQL (may stay “Untitled query”).
2. To name it yourself: click the **⋮** next to “Saved” (or right‑click the query in PRIVATE) → **Rename** → paste the `-- name:` value (e.g. `002_profiles`).

For a named migration history instead of ad‑hoc snippets, use the Supabase CLI (`supabase db push`) against this folder’s files.

| File | What it creates |
|------|-----------------|
| `001_extensions_and_enums.sql` | `pgcrypto`, enums |
| `002_profiles.sql` | profiles + signup trigger |
| `003_courses_activity.sql` | courses, comments, bookmarks, annotations |
| `004_votes.sql` | polymorphic votes + cleanup triggers |
| `005_follows.sql` | follows + public profile/bookmark reads |
| `006_user_links.sql` | link tags, user links, M2M |
| `007_course_section_progress.sql` | section completion / bookmarks |
| `008_course_community_wall.sql` | per-course wall resources (legacy UI; tables still used by profile feed) |
| `009_notebooks.sql` | notebooks + tabs |
| `010_profile_interests_and_links.sql` | interests, personal links, `list_users_directory` |
| `011_community_wall_subscriptions.sql` | wall feed subscriptions |
| `012_community_resources_and_search.sql` | `/community-resources` + `search_community` |
| `013_curated_courses.sql` | `curated_courses` + nodes + videos + notes |
| `014_curated_course_resources.sql` | `curated_course_resources` |
| `015_rename_course_video_to_curated.sql` | **existing DBs only:** `course_video_*` → `curated_*` |
| `016_fix_curated_table_names.sql` | **existing DBs only:** fix `curated_courses_course` / FKs |
| `017_curated_course_links.sql` | Per-topic tests and slides (`curated_course_links`) |
| `018_resource_concept_tree.sql` | `resources.concept_tree` + curated-course origin |
| `019_curated_course_pins.sql` | Per-user pinned course learning paths |
| `020_learning_paths.sql` | Catalog + user learning paths, notes, resources, node status |
| `021_course_notes.sql` | Per-user TipTap notes for Notion courses |
| `022_learning_path_privacy.sql` | `learning_paths.is_private` + public-read policy |
| `023_learning_path_kind.sql` | `learning_paths.kind` (`community` \| `research`) |
| `024_course_notes_topic.sql` | `course_notes.topic_id` (one doc per TOC tab) |
| `025_curated_course_node_resources.sql` | Unified per-node resource list; copies videos/links |
| `026_learning_paths_public_research_goal.sql` | Index for Field Atlas lookup by public research `goal` |
| `027_unify_learning_paths.sql` | `kind=course`, `visibility`, `learning_path_pins`, copy notes/pins from curated. Does **not** move official Notion courses onto `learning_paths` (future work). |
| `028_learning_path_resource_votes.sql` | Upvotes on public/collaborative learning-path resource lists |
| `029_learning_path_is_filled.sql` | `learning_paths.is_filled` for course syllabi that have a real topic tree |
| `030_learning_path_commitments.sql` | Per-user committed flags on Learning tab items |
| `034_activity_feed_events.sql` | Suggestion accepted/declined status + `learning_path_progress_events` for the profile feed |
| `035_user_knowledge_topics.sql` | Profile Knowledge tab: unique completed topics gained from finished learning paths |
| `036_knowledge_graph.sql` | Site-wide `knowledge_topics` + `knowledge_topic_edges`. Structural ingest on finish; daily Gemini linking is **implemented but disabled** |
| `037_content_reports.sql` | User reports for discussions, comments, learning paths, and uploaded resources. `/reports` dashboard (open while testing) |
| `038_learning_path_ratings.sql` | Topic and path/course enjoyment % (0–100) plus learner-entered duration after marking explored / finishing |
| `039_learning_path_ratings_percent.sql` | **Existing DBs only:** widen `learning_path_ratings.rating` from 1–5 to 0–100 if `038` already ran |
| `040_learning_path_outline_owner_only.sql` | Community/research outline (`data`) is owner-only; catalog course syllabus JSON stays writable for signed-in users |
| `041_learning_path_commitment_reminders.sql` | Creates `learning_path_commitments` if missing, then optional reminder cadence. Commit without a reminder is allowed; a reminder requires a commitment. UI only; sending is not built yet |

**Fresh project:** paste `000_complete_schema.sql` once (includes `001`–`014`, `017`–`030`, `034`–`038`, `040`, and commitment reminder columns). Skip `015`/`016` unless you already had old table names.

Existing projects that already ran through `037` should apply `038` (do not re-run `000`). If `038` already ran with a 1–5 rating check, apply `039`. Apply `040` so collaborative paths cannot rewrite the outline. Apply `041` for Learn-tab commitments + reminder cadence (`041` creates the table if `030` was never applied).

## 4. Optional seeds

```bash
yarn seed:curated-courses                  # loads JSON into curated_* then learning_paths
yarn seed:curated-courses -- --slug=slug   # any JSON file in that folder
yarn migrate:course-learning-paths         # copy all curated_* syllabi into learning_paths.data
yarn seed:community
yarn seed:learning-paths                   # six catalog paths (Spanish, transformers, rom-com, tree house, dinner, guitar)
```

Needs `SUPABASE_SERVICE_ROLE_KEY` + the matching `*_SEED_PROJECT_REF`.
Learning paths accept `LEARNING_PATHS_SEED_PROJECT_REF` or `COMMUNITY_SEED_PROJECT_REF`.

**SQL Editor (no service role):** curated seeds live in [`../seeds/curated-courses/`](../seeds/curated-courses/):

1. `seed_curated_course_video_courses.sql` — catalog rows in `curated_courses` (all degrees course names)
2. `seed_fluid_mechanics_curated_course.sql` — **self-contained** Fluid Mechanics load
3. Other `seed_*_curated_course.sql` files — syllabus trees (data only)

Canonical content: `data/curated-courses/` — see [docs/curated-courses.md](../../docs/curated-courses.md).  
Community paths: [docs/learning-paths.md](../../docs/learning-paths.md).

### Expected curated table names

| Correct | Not these |
|---------|-----------|
| `curated_courses` | `course_video_courses`, `curated_courses_course` |
| `curated_course_nodes` | `course_video_nodes` |
| `curated_course_videos` | `course_videos` |
| `curated_course_notes` | `course_video_notes`, `curated_courses_notes` |
| `curated_course_resources` | (distinct from Community Wall `course_resources`) |
| `curated_course_node_resources` | — |

## 5. Smoke checklist after swap

- [ ] Google sign-in → row appears in `profiles`
- [ ] Open a Notion course page → row in `courses`; comment / bookmark / discussion (`annotations`) / notes work
- [ ] `/community-resources` search + resource comments/votes
- [ ] Profile: notebooks, interests, personal links, bookmarked links, feed
- [ ] `/users` directory loads
- [ ] `/learning-path/fluid-mechanics` loads the syllabus UI from `learning_paths`
- [ ] `/learning-paths` and home community grid show catalog paths (not empty course placeholders)
- [ ] Create a path while signed in → row in `learning_paths`; notes persist in `learning_path_user_state`
- [ ] Owned path visibility: Private / Public / Collaborative
- [ ] Collaborative path: visitor does **not** see Edit this node / Add to path; owner still does. Apply `040_learning_path_outline_owner_only.sql`.
- [ ] Community/research path: **Export Context** copies current step + numbered outline (mark and title on one line) + whys + goal
- [ ] Field Atlas → new path with `kind=research`
- [ ] Pin a course learning path → row in `learning_path_pins`
- [ ] Public/collaborative path: signed-in upvote on a resource (grey arrow) does not change sequence
- [ ] `/all-courses` **courses** view: second grid lists only `kind=course` rows with `is_filled` (not title-only stubs); degrees promo → `/degrees`
- [ ] `/all-courses?view=learning-paths`: public community + research only (`listNonCourseLearningPaths`); no `kind=course`; atlas callouts; empty search opens create modal
- [ ] `/community`: two explainers (path schema + vote/order diagram); collab CTA → `/community-resources`
- [ ] Profile Learning tab: filters **Courses** (official Notion or `kind=course`), **Learning paths** (`community`+`research`), **Committed**; Commit tag writes `learning_path_commitments`; **Notify** stores a reminder cadence (`041`, which also creates the table if `030` never ran); muted **% complete** tag sits left of Commit
- [ ] Profile Knowledge tab: topic list (graph view hidden); finishing a public path upserts catalog topics/structural edges. Daily Gemini cron is **off** ([docs/knowledge.md](../../docs/knowledge.md))
- [ ] `/reports` loads (open while testing). Hover a discussion/comment/resource and send a reason; flag next to the date on a learning-path hero. Row appears on `/reports`. Apply `037_content_reports.sql` first.
- [ ] Mark a topic explored → enter duration + enjoyment %. Finish the path/course → same for the whole map. Apply `038_learning_path_ratings.sql` (and `039` if `038` already ran with 1–5 stars).

## Notes

- No Storage buckets, Edge Functions, Realtime publications, or custom Postgres roles are required.
- App uses the **anon** key + user JWT only; RLS is the access control.
- `profiles.user_id` is the auth uid everywhere (not `profiles.id`).
- Privacy for `user_links.is_private` is enforced in the app, not RLS (public SELECT remains, matching production).
- Votes for curated clips still use `votes.target_type = 'course_video'` (polymorphic label, not a table name).
- The in-course Community Wall TOC tab was removed; `course_resources*` tables remain for older posts and the profile feed.
