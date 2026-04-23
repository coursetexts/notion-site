# Claude instructions for this repo

## Always push to Railway after shipping

Whenever you finish a task that commits and pushes to `main`, also deploy
to Railway at the end. Do not report the task as complete until Railway
has accepted the deploy.

Preferred path — let Railway auto-deploy from GitHub:
- If Railway's GitHub integration is wired to this repo's `main` branch,
  the push itself triggers the deploy. Confirm by running `railway status`
  or checking the dashboard, and surface any build failures to the user.

Manual path — when auto-deploy is off or the user asks for an explicit push:
- `railway up` from the repo root (requires `railway login` + `railway link`
  first; those are interactive and the user must run them — suggest
  `! railway login` / `! railway link` in the prompt so output lands in
  the session).

Notes:
- The production Railway project deploys this Next.js app. There is no
  `railway.json` / `railway.toml` checked in, so the link is
  per-machine — if `railway status` says "No linked project found",
  ask the user to run `! railway link` before attempting a deploy.
- Do not enable Railway auto-deploy yourself — that's a dashboard-only
  setting (Service → Settings → Source → Connect Repo).
