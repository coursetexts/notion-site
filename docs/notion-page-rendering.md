# How `components/NotionPage.tsx` works

At ~1,600 lines this is by far the largest and most surprising file in the repository, and
the one where changes break the site in ways that are hard to trace. Read this before
editing it.

## The core idea

The page content is a Notion document rendered by `react-notion-x`. We cannot change that
markup, and editors work in Notion rather than in code. So every coursetexts-specific
feature — the course-card grid, the search and department filter, the two-column course
layout, the feedback form — is implemented by **reaching into the rendered DOM after the
fact**, wrapping and rearranging nodes and mounting extra React roots into them.

That is unusual, and it is deliberate: it keeps the CMS purely Notion. The cost is that
this file is coupled to `react-notion-x`'s class names and to the exact shape of the Notion
pages, and that a lot of the logic runs in `useEffect` after paint.

## `pageClass`

Everything branches on a single string derived from the route:

| Path | `pageClass` |
| --- | --- |
| `/` | `notion-home` |
| `/about…` | `about-page` |
| `/why…` | `why-page` |
| `/process…` | `why-page process-page` |
| anything else | `course-page` |

It is applied to the rendered container and is the hook `styles/notion.css` keys all of its
layout rules on. **Renaming a value here means renaming it in `styles/notion.css` too**, or
the layout silently reverts to plain Notion styling.

Note the default: any page that is not one of the four known routes is treated as a course
page.

## DOM helpers

- `waitForElement(selector, timeout = 5000)` — resolves when a node appears, using a
  `MutationObserver` and rejecting after the timeout. Necessary because react-notion-x
  renders asynchronously and much of the content arrives after the first effect runs.
  Rejections are swallowed with a `console.warn`, so a missing element degrades to "the
  feature just isn't there" rather than a crash.
- `addReactComponentAtEndOfArticle(articleSelector, containerClassName, node)` — appends a
  container and mounts a React root in it, guarding against duplicate insertion by class
  name.
- `addReactComponentBeforeTitle(node)` — inserts before `.notion-title`.
- `addReactComponentAfterHeader(node)` — inserts after `.notion-header`.

Each of these calls `createRoot`, so each is an independent React tree. State does not flow
between them and the main component except through props captured at render time — which is
why the filter row is re-rendered explicitly (below).

## Home page: course cards, search and filters

1. **`wrapElementsBetweenBlanks()`** turns a flat Notion page into cards. Notion has no
   card primitive, so editors separate courses with blank lines; this walks
   `.notion-blank` elements and wraps everything between two of them in a
   `.custom-wrapper-class` div, stopping at a boundary link (`/about`, `/why`, `/process`,
   `/privacy-policy`, `/terms-of-service`) so the footer links are not swallowed into the
   last card. Each wrapper then gets a click handler navigating to the first link inside
   it, which is what makes the whole card clickable.

   This is the load-bearing assumption of the home page: **course cards are defined by
   blank lines in Notion.** An editor removing a blank line merges two courses into one
   card.

2. **Production-only removal.** Inside the same walk, a card whose text contains
   `adam cohen` is removed when `isProduction` — i.e. when
   `NEXT_PUBLIC_NOTION_PAGE_ID === NOTION_PRODUCTION_URL` from `lib/consts.ts`. That course
   is visible on preview and hidden on production. It is a content decision expressed in
   code; if that ever needs to change, this is the only place it lives.

3. **Department tags** are derived by matching the parenthesised part of each card's link
   text and taking the leading letters before the first digit — `(CHEM 163)` yields `CHEM`.
   The set is passed to `components/FilterRow.tsx`.

4. **`components/FilterRow.tsx`** is mounted into a container inserted before
   `.notion-callout` via its own `createRoot`, tracked in `filterRootRef`. Because it is a
   separate root, a second effect re-renders it whenever `searchValue`, `department` or
   `allDepartmentTags` change; the first effect only creates or tears down the root when
   `pageClass` changes. Unmounting is deferred inside `requestAnimationFrame` to avoid
   unmounting a root during a render pass.

5. **Filtering** hides non-matching `.custom-wrapper-class` cards by setting both
   `style.display` and a `hidden` class — both, because the CSS in `styles/notion.css` and
   inline styles have fought over this before.

## Course pages

- The content is reorganised into two columns: `.course-left-column` is created inside
  `.notion-page-content-inner` and every child except the `.content-table` is moved into
  it. This runs behind two `waitForElement` calls and is cancellable, because navigating
  away mid-wait would otherwise rearrange the next page.
- A `content-table` structure (`content-table-heading`, `content-table-tabs`,
  `content-table-rest`) is built from the page's own blocks; `components/ContentTable.module.css`
  styles it.
- `components/FeedbackForm.tsx` is appended at the end of the article, seeded with the page
  title from `getBlockTitle`. It posts to `/api/append-course-feedback`
  (`pages/api/append-course-feedback.js`).
- A back link is inserted before the title.

## Site-wide

- `components/UpdateNoticeBanner.tsx` is mounted after `.notion-header`.
- The `License` block at the bottom renders only on `notion-home`.
- A `page-tight-heading-gap` body class is toggled per page id to adjust heading spacing.
- Heavy blocks — `Code`, `Collection`, `Equation`, `Pdf`, `Modal` — are `next/dynamic`
  imports so they stay out of the initial bundle.

## If you are changing this file

- Prefer adding a rule to `styles/notion.css` over adding another DOM walk.
- Anything that queries the DOM must go through `waitForElement`; a direct
  `querySelector` in an effect will intermittently find nothing.
- Every insertion needs a duplicate guard. Effects re-run on navigation, and Notion pages
  re-render as data streams in.
- Test on both a course page and the home page, and on preview *and* production page ids —
  `isProduction` changes what renders.
- The commented-out `HeroButterflies` call sites are dead code kept on purpose; there is
  no live import of `components/HeroButterflies.tsx`.
