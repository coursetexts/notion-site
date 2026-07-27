# Claude Fable remediation report

Date: 2026-07-27
Branch: `new-community-redesign`
Starting revision: `55d738f`

## Executive status

The repository-level security, reliability, voting, catalog, CI, and Degrees
issues from the audit have been implemented and verified on
`new-community-redesign`. This remediation has not been deployed or applied to
the production Supabase project.

Two launch blockers remain:

1. The production seed accounts and 71 synthetic resources still need to be
   deleted. The exact cleanup migration is prepared, but it must be previewed
   and run in the signed-in Supabase dashboard with explicit approval.
2. Hudson's resource/comment approval flow and the proposed knowledge-component
   relationship model are not implemented. These require a moderator identity,
   review-queue behavior, and a product decision about what anonymous users,
   submitters, professors, and moderators may see.

## Finding-by-finding disposition

| Finding | Status | Remediation and evidence |
| --- | --- | --- |
| P0-1 committed E2E passwords and live seeded accounts | Code fixed; production cleanup pending | Removed every default password from `scripts/seed-community.mjs` and `tests/e2e/community.spec.ts`. Seeding now requires explicit passwords, a matching disposable project ref, and refuses production project `agxbxmvtbjigvfvhtxic`. The guard was exercised and exited before any network mutation. `/signin` only renders the preview-password form when `PASSWORD_PROTECT=true`; Vercel Production and Preview do not currently define that flag. `supabase/live/004_remove_community_seed_data.sql` previews and deletes the exact E2E/seed identities and dependent content. It has not been run. |
| P0-2 missing live baseline schema | Prepared; live diff pending | Added `supabase/live/000_community_platform_init.sql` for the live `profiles`, `resources`, `knowledge_components`, `comments`, and `votes` baseline, including types, indexes, RLS, and auth trigger. Existing `supabase/live/002_community_search.sql` supplies `search_community`. The baseline is a reconstruction from the app and observable live API, not yet a dashboard-generated schema dump; policies still require a signed-in live diff. |
| P1-1 uncapped upstream Notion loop | Fixed and build-tested | The raw Notion client is always called with `fetchMissingBlocks:false`; only the local ten-pass recovery loop runs. It now stops immediately when a pass makes no progress. The full build fetched the root page's missing blocks in two passes and completed all 219 pages. |
| P1-2 stale pnpm lock | Fixed and install-tested | Yarn 1.22.22 is declared as the package manager. `pnpm-lock.yaml` and `package-lock.json` are removed; `yarn.lock` is the sole lockfile. `yarn install --frozen-lockfile` passed. |
| P1-3 synthetic production feed and UI mocks | Code fixed; production cleanup pending | Removed `MOCK_RESOURCES`, the course-wall dummy module, home/course-grid fabricated cards, and random fallback shuffling. Empty or failed data sources now render explicit empty/error states. The 71 live rows remain until the prepared cleanup is approved and run. |
| P1-4 approval/moderation and knowledge-component relationships | Not implemented; launch blocker | No claim of completion. The existing direct-write model remains. A migration alone is insufficient: the team must name moderator accounts and approve pending-item visibility, review actions, notifications, comment rules, and the relationship taxonomy from the crowdsourcing document. |
| P2 voting rollback/races/accessibility | Fixed and regression-tested | Resource, course-wall, and comment votes optimistically update, roll back on any failed write, display an alert, reconcile the server score, and disable both controls while a write is in flight. Per-target sequence guards prevent stale responses. Search-only hits are inserted into local state before reconciliation. Vote scores announce through `aria-live=polite`. The mocked Playwright test covers all six transitions, rank stability, failed-write rollback, and an intentionally delayed request. |
| P2 Notion/catalog robustness | Fixed and build-tested | Non-retryable errors throw immediately; chunk limits are finite, positive, floored, and capped at 1000; Retry-After is honored up to a defensive five-minute ceiling; school aliases normalize UBC and MIT. Fabricated courses and build-time randomness are removed. |
| P2 CI/API/hygiene | Fixed and verified | Actions use checkout/setup-node v4 and only push-build `main` while PRs use `pull_request`. Missing course-chat configuration returns a stable 503 `COURSE_CHAT_DISABLED`, verified locally. Node 20 and Supabase/OpenAI env expectations are documented. Python bytecode, TypeScript build info, Playwright output, and caches are ignored; tracked artifacts are removed. |
| P2 mutating E2E hazard | Fixed | The mutation test skips unless `E2E_ALLOW_MUTATIONS=true`, every credential is present, and `E2E_PROJECT_REF` exactly matches the URL. Brittle fixed karma assertions are removed. |
| P2 Degrees accessibility/history | Fixed and browser-tested | Removed the nested link inside a button, implemented ArrowLeft/ArrowRight/Home/End tab navigation, changed level/search routing from replace to push, and added a semantic page H1. Browser verification confirmed the level switch creates `?level=graduate`, Back restores Undergraduate, and ArrowRight selects the Websites tab/panel. |
| P3 degree IDs, aliases, heading, Notion env validation | Fixed and verified | Lowercased the two mixed-case IDs and their section references. Route enumeration reports 100 unique routes, zero mixed-case IDs, and zero duplicates. Added the H1, school aliases, and chunk validation noted above. |

## Production inventory and protected actions

Read-only inspection of the production project confirmed:

- 3 E2E identities: Maya, Devran, and Lena.
- 9 `seed-bot` identities.
- 70 `https://example.edu/seed/*` resources.
- 1 seeded Feynman resource authored by Maya.
- 71 total visible community resources, all attributable to seed data.

The cleanup migration targets:

- the three exact E2E email addresses;
- the `seed-bot+%@example.com` identities and fixed seed UUID namespace;
- resources authored by those profiles or using the exact seed URL prefix;
- comments/replies and votes attached to those resources/comments;
- knowledge components created by those profiles;
- the matching profile and Auth rows.

It ends with verification counts that must all be zero. No deletion has been
performed. Before execution, compare the preview result to the inventory and
obtain explicit approval.

## Environment audit

Vercel project: `coursetexts/coursetexts-auth-test`

- Production: `SESSION_SECRET`, `NEXT_PUBLIC_NOTION_PAGE_ID`,
  `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` exist.
- Preview: the same four variables exist.
- Development: no variables are configured.
- `OPENAI_API_KEY` is absent, so course chat will intentionally return 503.
- `PASSWORD_PROTECT`, `PREVIEW_PASSWORD`, and `NOTION_PAGE_CHUNK_LIMIT` are
  absent from Production and Preview.
- Vercel protects pulled values with placeholders, so a local developer cannot
  bootstrap from the current Development scope. Do not commit pulled secrets.

## Verification evidence

- `yarn install --frozen-lockfile`: passed.
- `npx tsc --noEmit --incremental false`: passed.
- `yarn test:lint`: zero errors; 13 pre-existing hook warnings in untouched
  files.
- Targeted Prettier checks for every changed JS/TS/TSX/JSON/CSS/YAML file:
  passed.
- `git diff --check`: passed.
- Mocked community Playwright regression: 1 passed in 3.2 seconds.
- Full `yarn build`: passed in 209 seconds; 219 static pages generated.
- Degree route enumeration: 100 unique routes, 0 mixed-case IDs, 0 duplicates.
- Local `/api/course-chat` without a key: HTTP 503 with
  `COURSE_CHAT_DISABLED`.
- Local browser: Community error state renders without fake data; sign-in has
  Google only; Degrees H1/history/resource-tab keyboard flow passed.
- Production seeding guard: refused the known production project before making
  a request.

The repository-wide `yarn test:prettier` command still reports 31 pre-existing
unformatted files outside this change set. They were not reformatted because
doing so would add unrelated churn.

## Recommended review order for Claude Fable

1. Inspect `scripts/seed-community.mjs`, `tests/e2e/community.spec.ts`, and
   `supabase/live/004_remove_community_seed_data.sql` for target safety.
2. Review `lib/notion-api.ts` for the upstream-loop bypass and retry behavior.
3. Review the three vote implementations together: `pages/community.tsx`,
   `components/CommunityWall.tsx`, and `components/CommunityComments.tsx`.
4. Confirm that deleted mock/fallback files and lockfiles should remain deleted.
5. Review the Degrees DOM and keyboard changes.
6. Treat moderation and knowledge-component relationships as open product work,
   not completed engineering.
7. After approval, commit/push the code, deploy a Preview build, run the live
   schema/policy diff, and only then execute the seed cleanup with confirmation.
