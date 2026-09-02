# Auth

## Google sign-in

```mermaid
sequenceDiagram
  participant User
  participant App as Next.js
  participant SB as Supabase Auth
  participant Google
  participant DB as Postgres

  User->>App: /signin → Sign in with Google
  App->>SB: signInWithOAuth({ provider: "google", redirectTo: /auth/callback })
  SB->>Google: OAuth redirect
  User->>Google: Approve
  Google->>SB: Callback
  SB->>DB: INSERT auth.users
  DB->>DB: trigger on_auth_user_created
  DB->>DB: handle_new_user() → INSERT profiles
  SB->>App: Redirect /auth/callback + session
  App->>App: AuthContext loads user + profile
  App->>User: Signed-in UI (/profile)
```

## Profile creation

```mermaid
flowchart LR
  A["auth.users INSERT"] --> B["handle_new_user()"]
  B --> C["profiles row"]
  C --> D["user_id = auth uid"]
  C --> E["display_name from Google meta"]
  C --> F["avatar_url, email"]
  C --> G["replies_last_read_at = now()"]
```

App code always joins social data with **`profiles.user_id`**, not `profiles.id`.

## What requires sign-in

Public without an account: home, official Notion courses (`/course/{pageId}`), degrees, catalog learning paths, course learning paths, Field Atlas, community pages.

Needs a session (or local-only until sign-in):

| Action | Signed in | Signed out |
|--------|-----------|------------|
| Comments, votes, annotations | Supabase | disabled |
| Course / path notes | `course_notes` / `learning_path_user_state` | `localStorage` |
| Create / edit own learning path | `learning_paths` | `sessionStorage` drafts |
| Save someone else’s path | `user_links` row pointing at `/learning-path/{slug}` | n/a |
| Bookmark a learning-path resource | `user_links` (resource URL or path + `node`/`resource` query) | n/a |
| Pin a course learning path | `learning_path_pins` | n/a |
| Upvote a learning-path resource | `learning_path_resource_votes` | n/a |
| Notebooks, follows, profile | Supabase | n/a |

## Dashboard setup (new project)

1. Enable **Google** provider (Client ID / Secret).
2. Under **URL configuration**, keep **Site URL** as the live app (`https://coursetexts.org` or preview). Then add **every** return URL you actually use under **Redirect URLs**. If localhost is missing, Google sign-in from `yarn dev` sends you to the Site URL instead.

   Allow at least:

   - `http://localhost:3000/auth/callback`
   - `http://127.0.0.1:3000/auth/callback`
   - `https://coursetexts.org/auth/callback`
   - `https://preview.coursetexts.org/auth/callback`

   The app always sets `redirectTo` to `{window.location.origin}/auth/callback`, so local tabs stay on localhost and deployed tabs stay on that host.
3. Google OAuth redirect: `https://<project-ref>.supabase.co/auth/v1/callback`.
4. Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Other auth

- **Preview password** (`/api/login` iron-session) is separate from Supabase — not a DB user.
- Seeds may create email users with the **service role** key (scripts only).
