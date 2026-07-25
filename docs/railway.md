# Railway Deployment

This repo now deploys cleanly on Railway from Node `18.x`.

## Current Railway Project

- Project: `coursetexts-notion`
- Service: `web`
- Production domain: `https://web-production-2ed17.up.railway.app`
- Preview domain: `https://web-preview-2f4d.up.railway.app`

## Required Environment Variables

These are required for the main site to build and boot:

- `NEXT_PUBLIC_NOTION_PAGE_ID`
- `SESSION_SECRET`

These are optional, but currently used in this repo:

- `NEXT_PUBLIC_NOTION_PAGE_ID_PREVIEW`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `NEXT_PUBLIC_SITE_CONFIG`
- `PASSWORD_PROTECT`
- `PREVIEW_PASSWORD`
- `SPREADSHEET_ID`
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `REDIS_HOST`
- `REDIS_PASSWORD`
- `REDIS_USER`
- `REDIS_NAMESPACE`
- `NEXT_PUBLIC_FATHOM_ID`
- `NEXT_PUBLIC_POSTHOG_ID`
- `TWITTER_ACCESS_TOKEN`

## Why Railway Was Failing

Two separate issues blocked deploys:

1. Railway was resolving Node 16 from the repo's old engine range, but the current Notion dependency graph requires Node 18.
2. The current Notion client returns blocks in a nested wrapper shape (`entry.value.value`) that `react-notion-x` does not handle directly.

There was also a build-time Notion rate limit caused by fetching the same page set once for `getStaticPaths` and again for `getStaticProps`.

## Fixes Landed In The Repo

- `package.json` now pins Node to `18.x`
- `lib/notion-api.ts` normalizes nested Notion block wrappers before the renderer sees them
- `lib/resolve-notion-page.ts` reuses `siteMap.pageMap` during SSG to avoid duplicate Notion fetches
- `.gitignore` excludes large local artifacts that break upload-based deploys

## Preview Environment

The preview site can point at a different Notion root page by setting:

- `NEXT_PUBLIC_NOTION_PAGE_ID`
- `VERCEL_ENV=preview`

If preview needs different site metadata or page overrides than production, set `NEXT_PUBLIC_SITE_CONFIG` to a JSON object. Example:

```json
{
  "domain": "preview.coursetexts.org",
  "pageUrlOverrides": {
    "/why": "https://www.notion.so/snaz/Coursetexts-is-open-sourcing-the-frontiers-of-knowledge-14d19a13312a80aba903d49ab333bd38",
    "/process": "https://www.notion.so/snaz/Process-23b19a13312a8045a30bfc70e968ba51"
  }
}
```

This is useful when production-only routes like `/about` should not be inherited by preview.

## GitHub-Driven Deploys

For automatic deploys from GitHub:

1. Keep the Railway service connected to `coursetexts/notion-site`
2. Keep `main` as the production branch
3. Store Railway env vars in the service, not in the repo
4. Push fixes to `origin/main`

## DNS Notes

Railway supports apex/root domains by asking DNS providers to flatten a CNAME target. Cloudflare supports this with CNAME flattening.

For `coursetexts.org`, keep the custom domain attached in Railway and point the apex at the Railway target through Cloudflare instead of Squarespace DNS.
