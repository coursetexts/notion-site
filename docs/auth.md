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

## Dashboard setup (new project)

1. Enable **Google** provider (Client ID / Secret).  
2. Site URL + redirect allowlist include `{origin}/auth/callback`.  
3. Google OAuth redirect: `https://<project-ref>.supabase.co/auth/v1/callback`.  
4. Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Other auth

- **Preview password** (`/api/login` iron-session) is separate from Supabase — not a DB user.
- Seeds may create email users with the **service role** key (scripts only).
