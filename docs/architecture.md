# Architecture

This site renders a Notion workspace as coursetexts.org. It is a fork of
[nextjs-notion-starter-kit](https://github.com/transitive-bullshit/nextjs-notion-starter-kit);
the upstream half of `readme.md` still describes the generic kit. This document covers how
*this* deployment is put together and which files carry the coursetexts-specific
behaviour.

## Request flow

```
browser ──► middleware.ts            optional password gate (preview site only)
              │
              ▼
        pages/[pageId].tsx           getStaticProps → resolveNotionPage()
              │
        lib/resolve-notion-page.ts   slug/pageId → Notion page id → recordMap
              │  lib/notion.ts → lib/notion-api.ts (notion-client, with retry)
              │  lib/acl.ts (404s for pages outside the configured site)
              ▼
        components/NotionPage.tsx    react-notion-x render + the coursetexts overlay
```

Configuration is a single object: `site.config.ts`, validated and typed by
`lib/site-config.ts`, read everywhere through `lib/config.ts` and
`lib/get-config-value.ts`. Environment variables override the file —
`NEXT_PUBLIC_NOTION_PAGE_ID` replaces `rootNotionPageId`, and
`NEXT_PUBLIC_SITE_CONFIG` can replace any subset as JSON. That is how one codebase serves
two sites: production (coursetexts.org, professor-approved pages only) and preview
(preview.coursetexts.org, everything) differ only by environment.

`lib/consts.ts` holds `NOTION_PRODUCTION_URL`, the production root page id. Comparing it
against `NEXT_PUBLIC_NOTION_PAGE_ID` is how `components/NotionPage.tsx` knows at runtime
whether it is rendering production or preview.

## Notion access — `lib/`

| File | Role |
| --- | --- |
| `lib/notion-api.ts` | The `notion-client` instance, plus `getPageWithRetry` (up to 6 attempts — Notion's unofficial API is flaky under build load, and returns 403 outright to some datacenter IPs; see [ci.md](ci.md)) and `getPages` for batches |
| `lib/notion.ts` | `getPage` and `search`, the two calls the app actually makes |
| `lib/resolve-notion-page.ts` | Turns a URL path into a page: pretty slug → canonical page id → `recordMap` |
| `lib/get-canonical-page-id.ts`, `lib/map-page-url.ts` | Pretty-URL generation (`getCanonicalPageId`, `mapPageUrl`, `getCanonicalPageUrl`) |
| `lib/get-site-map.ts` | `getSiteMap` — walks the root page to enumerate every child, used by `pages/sitemap.xml.tsx` and `pages/feed.tsx` |
| `lib/acl.ts` | `pageAcl` — returns a 404 rather than rendering a page that does not belong to the configured site |
| `lib/map-image-url.ts`, `lib/preview-images.ts` | Notion image URL rewriting, and blurred LQIP placeholders (`getPreviewImageMap`, memoised) |
| `lib/search-notion.ts` | Memoised search used by the CMD+K palette |
| `lib/db.ts` | Keyv cache — Redis when `isRedisEnabled`, otherwise in-memory. Preview images are the main thing it holds |
| `lib/get-page-tweet.ts`, `lib/oembed.ts`, `lib/link-icons.ts` | Embedded tweets, oEmbed resolution, and the link-icon mapping (`LINK_ICON_METADATA`, `TOKEN_TO_ICON_KEY`) |
| `lib/get-social-image-url.ts` | URL for the generated OG image served by `pages/api/social-image.tsx` |
| `lib/types.ts`, `lib/site-config.ts` | `PageProps`, `SiteMap`, `SiteConfig`, `NavigationLink` |
| `lib/use-dark-mode.ts`, `lib/bootstrap-client.ts` | Dark mode hook and client bootstrap |

## Auth and the preview gate

The preview site is password-protected; production is not.

- `middleware.ts` runs on every path except `api`, `_next/static`, `_next/image`,
  `favicon.ico`, `signin` and `logo.svg`. When `PASSWORD_PROTECT === 'true'` it requires an
  iron-session cookie and otherwise redirects to `/signin`, preserving the original path in
  `?redirect=`. When the variable is anything else the middleware is a pass-through — this
  is a deployment-level switch, not a per-user one.
- `lib/session-config.ts` and `lib/session.ts` wrap iron-session. `lib/session.ts` throws
  at import time if `SESSION_SECRET` is unset, so a misconfigured deploy fails immediately
  rather than serving an unprotected preview.
- `pages/signin.tsx`, `pages/api/login.ts` and `pages/api/logout.ts` are the login flow;
  the password comes from `PREVIEW_PASSWORD`.

## Pages

| Route | File |
| --- | --- |
| `/` | `pages/index.tsx` — the root Notion page |
| `/<slug>` | `pages/[pageId].tsx` — every other Notion page, statically generated with revalidation |
| `/feed` | `pages/feed.tsx` — RSS built from `getSiteMap` |
| `/sitemap.xml`, `/robots.txt` | `pages/sitemap.xml.tsx`, `pages/robots.txt.tsx` |
| `/privacy-policy`, `/terms-of-service` | `pages/privacy-policy.tsx`, `pages/terms-of-service.tsx` — hand-written, not Notion-backed |
| `/signin` | `pages/signin.tsx` |
| `/404`, error | `pages/404.tsx`, `pages/_error.tsx` |
| `/c/chem-163`, `/c/physics-285a` | `pages/c/chem-163.tsx`, `pages/c/physics-285a.tsx` — hard-coded redirects to the Notion slugs those courses ended up with, kept so old shared links keep working |

`pages/_app.tsx` and `pages/_document.tsx` are the shell.

## API routes

| Route | File | Purpose |
| --- | --- | --- |
| `/api/search-notion` | `pages/api/search-notion.ts` | Backs CMD+K search |
| `/api/notion-page-info` | `pages/api/notion-page-info.tsx` | Page title/icon lookup for link previews |
| `/api/social-image` | `pages/api/social-image.tsx` | Generated Open Graph images |
| `/api/login`, `/api/logout` | `pages/api/login.ts`, `pages/api/logout.ts` | Preview-site session |
| `/api/append-to-sheet` | `pages/api/append-to-sheet.js` | Writes form submissions to a Google Sheet (`SPREADSHEET_ID`, `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`) |
| `/api/append-course-feedback` | `pages/api/append-course-feedback.js` | Course feedback from `components/FeedbackForm.tsx` — `{ courseName, name, email, comment }` |

## Components

`components/NotionPage.tsx` is the centre of gravity and has its own document:
[notion-page-rendering.md](notion-page-rendering.md).

| File | Role |
| --- | --- |
| `components/FilterRow.tsx` | Search box and department filter injected into the home page |
| `components/FeedbackForm.tsx` | Per-course feedback form appended to course pages |
| `components/NotionPageHeader.tsx` | Site header, navigation from `site.config.ts` |
| `components/Footer.tsx`, `components/PageSocial.tsx`, `components/custom-icons.tsx` | Footer, social links, and the hand-rolled Discord/X/GitHub icons |
| `components/UpdateNotice.tsx`, `components/UpdateNoticeBanner.tsx` | The dismissible site-wide notice |
| `components/PageActions.tsx`, `components/GitHubShareButton.tsx`, `components/PageAside.tsx` | Upstream extras, mostly unused here |
| `components/ErrorPage.tsx`, `components/Page404.tsx`, `components/Loading.tsx`, `components/LoadingIcon.tsx` | Error and loading states |
| `components/PageHead.tsx` | `<head>` metadata |
| `components/HeroButterflies.tsx` | A decorative hero effect, currently disabled — every call site in `components/NotionPage.tsx` is commented out |
| `components/styles.module.css`, `components/PageSocial.module.css`, `components/ContentTable.module.css` | Component-scoped styles |

## Styles

- `styles/global.css` — site-wide base.
- `styles/notion.css` — the large one: overrides for react-notion-x's markup, plus every
  layout rule keyed on the `pageClass` values described in
  [notion-page-rendering.md](notion-page-rendering.md) (`notion-home`, `course-page`,
  `about-page`, `why-page`, `process-page`). Changing a class name in
  `components/NotionPage.tsx` without changing it here silently drops the styling.
- `styles/prism-theme.css` — code block highlighting.

## Build and deploy

`next.config.js`, `postcss.config.js`, `tsconfig.json`, `.eslintrc.json` are standard.
`packages/notion-client-7.1.6.tgz` is a vendored tarball — the dependency is pinned to a
local build, so a fresh `yarn install` needs that file present.

Deployment targets have shifted over time (Vercel, Render, Railway); the current Railway
setup and its environment variables are in [railway.md](railway.md), and the deployment
history is in `readme.md`. CI is documented in [ci.md](ci.md).
