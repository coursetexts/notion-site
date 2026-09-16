# Coursetexts

Open library of university courses, plus **Paths by Coursetexts** for community learning paths. Production: [coursetexts.org](https://coursetexts.org). Preview: [preview.coursetexts.org](https://preview.coursetexts.org).

This Next.js app has two product surfaces on one deploy:

- **Coursetexts** — `/`, `/all-courses`, `/course/{pageId}` (Notion professor courses)
- **Paths** — everything under `/paths/*` (learning paths, profiles, degrees, community, Field Atlas). Canonical helpers in `lib/paths-routes.ts`; legacy bare URLs redirect into `/paths/…`.

Degree syllabi and community/research paths share `learning_paths` and `/paths/learning-path/{slug}`. Official Notion courses are still a separate CMS; a later pass will migrate those onto learning paths too ([docs](./docs/architecture.md#future-official-notion-courses)).

## Product docs

| Doc                                                  | What’s inside                                                                                          |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| [docs/README.md](./docs/README.md)                   | Index                                                                                                  |
| [Architecture](./docs/architecture.md)               | Product split, routes, user flows, Notion + Supabase |
| [Routes & gaps](./docs/gaps.md)                      | Unbuilt routes, partial features, orphaned APIs |
| [Database](./docs/database.md)                       | Schema groups, ERDs, RLS                                                                               |
| [Auth](./docs/auth.md)                               | Google OAuth → profiles. Return to the gated page after sign-in.                                       |
| [Community learning paths](./docs/learning-paths.md) | `/paths/learning-path/{slug}`. Publish only with 1 resource + why per topic. Visitors see public vs collab; outline edits are owner-only. **Export Context** copies an LLM prompt of the path. |
| [Course learning paths](./docs/curated-courses.md)   | `/paths/learning-path/{slug}`                                                                                |
| [Knowledge](./docs/knowledge.md)                     | Profile Concepts tab, finish celebration, duration + enjoyment %, shared graph (daily LLM job is off) |
| [Migrations](./supabase/migrations/README.md)        | Fresh Supabase setup and seeds                                                                         |

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

Google sign-in returns to `{current origin}/auth/callback` (localhost while you `yarn dev`, the live host in production). In Supabase → Authentication → URL configuration, add `http://localhost:3000/auth/callback` to **Redirect URLs** or local sign-in will bounce to the Site URL. See [docs/auth.md](./docs/auth.md).

Optional seeds (service role, never the production project):

```bash
yarn seed:learning-paths
yarn seed:curated-courses
yarn seed:community
```

## Deploy

`preview.coursetexts.org` and `coursetexts.org` both deploy `main` with different env vars. Notion public pages are the CMS for professor courses; Vercel rebuilds often enough to pick up Notion edits. The `coursetexts/notion-site` GitHub repo is the contractor-facing copy; production deploys from the private clone.

Notion page rendering still uses [react-notion-x](https://github.com/NotionX/react-notion-x) (`site.config.ts`, `styles/notion.css`). Preview images, Redis caching, and dark mode work as in the upstream [nextjs-notion-starter-kit](https://github.com/transitive-bullshit/nextjs-notion-starter-kit).
