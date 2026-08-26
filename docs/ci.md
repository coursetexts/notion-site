# Continuous integration

One workflow, `.github/workflows/build.yml`, on every push and pull request.

| Job | What it runs | Needs secrets |
| --- | --- | --- |
| `Lint` | `yarn test:lint` (eslint over `**/*.{ts,tsx}`) then `npx tsc --noEmit` | no |
| `Build` | `yarn build` (`next build`) | uses `NEXT_PUBLIC_NOTION_PAGE_ID`, with a fallback |

A `concurrency` group cancels a superseded run: `on: [push, pull_request]` means a push to
a branch with an open PR triggers the workflow twice, and there is no reason to pay for
both.

## Why fork pull requests used to fail

`next build` runs `getStaticProps`, which resolves and fetches the site's root Notion page.
Without a page id the build dies during page-data collection:

```
Error: Config error: missing required site config key "rootNotionPageId"
Error: Failed to collect page data for /404
```

The workflow supplied that id from `secrets.NEXT_PUBLIC_NOTION_PAGE_ID` — and GitHub
withholds secrets from `pull_request` runs triggered by a fork. Every PR opened from a
contributor's fork therefore failed, while pushes to in-repo branches passed. That is the
whole explanation for the repository's historical red X's; none of them were real build
breakages.

The fix is a fallback to the production root page id, which is not a secret: it is already
committed as `NOTION_PRODUCTION_URL` in `lib/consts.ts` and is a public Notion page. The
build step reads it out of that file rather than duplicating the literal in the workflow, so
there is one source of truth:

```bash
if [ -z "$NEXT_PUBLIC_NOTION_PAGE_ID" ]; then
  NEXT_PUBLIC_NOTION_PAGE_ID=$(sed -n "s/.*NOTION_PRODUCTION_URL *= *'\([^']*\)'.*/\1/p" lib/consts.ts)
fi
```

In-repo runs still use the secret, so pointing CI at a different page only requires changing
the secret. Changing the shape of that line in `lib/consts.ts` breaks the fallback — the
build then fails on fork PRs the same way it used to.

## What is deliberately not in CI

`yarn test:prettier` is part of `yarn test` locally but is **not** run in CI: about 30
files in the tree do not currently satisfy the prettier config, and turning the check on
would fail every build until they are reformatted. If you want it enforced, reformat first
in a separate commit, then add the step — do not add the step alone.

There are no unit tests in this repository. `Lint` plus a real `next build` against live
Notion data is the whole safety net, which does mean CI can go red because Notion's
unofficial API is having a bad day rather than because the code is wrong.
`getPageWithRetry` in `lib/notion-api.ts` retries up to six times to make that less common.

## Running the same checks locally

```
yarn test:lint
npx tsc --noEmit
NEXT_PUBLIC_NOTION_PAGE_ID=<page id> yarn build
```
