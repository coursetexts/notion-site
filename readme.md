# Coursetexts

Open library of university courses and community learning paths. Production: [coursetexts.org](https://coursetexts.org). Preview: [preview.coursetexts.org](https://preview.coursetexts.org).

This Next.js app renders **Notion** professor courses at `/course/{pageId}` and a **Supabase**-backed social layer (auth, comments, notes, learning paths). Degree syllabi and community/research paths already share `learning_paths` and `/learning-path/{slug}`. Official Notion courses are still a separate CMS; a later pass will migrate those onto learning paths too ([docs](./docs/architecture.md#future-official-notion-courses)).

## Product docs

| Doc | What’s inside |
|-----|----------------|
| [docs/README.md](./docs/README.md) | Index |
| [Architecture](./docs/architecture.md) | Routes, home, how pages talk to Notion + Supabase |
| [Database](./docs/database.md) | Schema groups, ERDs, RLS |
| [Auth](./docs/auth.md) | Google OAuth → profiles |
| [Community learning paths](./docs/learning-paths.md) | `/learning-path/{slug}` |
| [Course learning paths](./docs/curated-courses.md) | `/learning-path/{slug}` |
| [Migrations](./supabase/migrations/README.md) | Fresh Supabase setup and seeds |

## Local setup

Node >= 20, then:

```bash
yarn
cp .env.example .env
yarn dev
```

Minimum env:

```bash
NEXT_PUBLIC_NOTION_PAGE_ID=…
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=…
```

Google sign-in and a matching redirect `{origin}/auth/callback` are required for comments, notes, and owned paths. See [docs/auth.md](./docs/auth.md).

Optional seeds (service role, never the production project):

```bash
yarn seed:learning-paths
yarn seed:curated-courses
yarn seed:community
```

## Deploy

`preview.coursetexts.org` and `coursetexts.org` both deploy `main` with different env vars. Notion public pages are the CMS for professor courses; Vercel rebuilds often enough to pick up Notion edits. The `coursetexts/notion-site` GitHub repo is the contractor-facing copy; production deploys from the private clone.

Notion page rendering still uses [react-notion-x](https://github.com/NotionX/react-notion-x) (`site.config.ts`, `styles/notion.css`). Preview images, Redis caching, and dark mode work as in the upstream [nextjs-notion-starter-kit](https://github.com/transitive-bullshit/nextjs-notion-starter-kit).
