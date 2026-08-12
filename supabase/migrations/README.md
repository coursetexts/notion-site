# Fresh Supabase database (final schema)

These SQL files recreate the **current** app schema for a brand-new Supabase project.
They collapse historical migrations `001`–`028` into a clean final state (no drop/recreate churn).

Run them **in numeric order** in the Supabase SQL Editor (or via CLI). Do **not** also run the old `supabase/migrations/*.sql` files on the same empty database.

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
```

## 2. Auth (required for the site to work the same)

In Supabase Dashboard → **Authentication**:

1. Enable **Google** provider (Client ID / Secret from Google Cloud).
2. Under URL configuration, allow your app origins and redirect:
   - Site URL: your app origin (e.g. `http://localhost:3000`)
   - Redirect URLs: `{origin}/auth/callback` (and production equivalents)
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
| `008_course_community_wall.sql` | per-course wall resources |
| `009_notebooks.sql` | notebooks + tabs |
| `010_profile_interests_and_links.sql` | interests, personal links, `list_users_directory` |
| `011_community_wall_subscriptions.sql` | wall feed subscriptions |
| `012_community_resources_and_search.sql` | site `/community` + `search_community` |
| `013_curated_courses.sql` | `curated_courses` + nodes + videos + notes |
| `014_curated_course_resources.sql` | `curated_course_resources` |
| `015_rename_course_video_to_curated.sql` | **existing DBs only:** `course_video_*` → `curated_*` |
| `016_fix_curated_table_names.sql` | **existing DBs only:** fix `curated_courses_course` / FKs |

**Fresh project:** paste `000_complete_schema.sql` once (includes `001`–`014`). Skip `015`/`016` unless you already had old table names.

## 4. Optional seeds

```bash
yarn seed:curated-courses                  # loads data/curated-courses/fluid-mechanics.json
yarn seed:curated-courses -- --slug=slug   # any JSON file in that folder
yarn seed:community
```

Needs `SUPABASE_SERVICE_ROLE_KEY` + `CURATED_COURSES_SEED_PROJECT_REF`.

**SQL Editor (no service role):**

1. `seed_curated_course_video_courses.sql` — catalog rows in `curated_courses` (all degrees course names)  
2. `seed_fluid_mechanics_curated_course.sql` — **self-contained** Fluid Mechanics load (schema repair + full tree / videos / resources)

Canonical content: `data/curated-courses/` — see [docs/curated-courses.md](../../docs/curated-courses.md).

### Expected curated table names

| Correct | Not these |
|---------|-----------|
| `curated_courses` | `course_video_courses`, `curated_courses_course` |
| `curated_course_nodes` | `course_video_nodes` |
| `curated_course_videos` | `course_videos` |
| `curated_course_notes` | `course_video_notes`, `curated_courses_notes` |
| `curated_course_resources` | (distinct from Community Wall `course_resources`) |

## 5. Smoke checklist after swap

- [ ] Google sign-in → row appears in `profiles`
- [ ] Open a Notion course page → row in `courses`; comment / bookmark / annotation work
- [ ] `/community` search + resource comments/votes
- [ ] Course Community Wall post / vote / subscribe
- [ ] Profile: notebooks, interests, personal links, bookmarked links
- [ ] `/users` directory loads
- [ ] `/curated-course/fluid-mechanics` loads from DB (syllabus + resources)

## Notes

- No Storage buckets, Edge Functions, Realtime publications, or custom Postgres roles are required.
- App uses the **anon** key + user JWT only; RLS is the access control.
- `profiles.user_id` is the auth uid everywhere (not `profiles.id`).
- Privacy for `user_links.is_private` is enforced in the app, not RLS (public SELECT remains, matching production).
- Votes for curated clips still use `votes.target_type = 'course_video'` (polymorphic label, not a table name).
