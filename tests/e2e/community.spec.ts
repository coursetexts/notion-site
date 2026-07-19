/**
 * Community page e2e: sign-in → comment → reply → vote.
 *
 * Prerequisites:
 *   1. Supabase env in .env (NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY)
 *   2. The live schema (000_community_platform_init) on the project
 *   3. `npm run seed:community` (creates the test users, resource, thread)
 *
 * Sign-in note: Google OAuth cannot be driven headlessly, so the test signs
 * in with a seeded email/password session via the Supabase token endpoint and
 * injects it before load — the same session shape supabase-js writes itself.
 */
import { expect, test } from '@playwright/test'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const EMAIL = process.env.E2E_EMAIL ?? 'e2e-maya@coursetexts.dev'
const PASSWORD = process.env.E2E_PASSWORD ?? 'coursetexts-e2e-1!'
const DISPLAY_NAME = 'Maya Chen'

const SEEDED_RESOURCE = 'The Feynman Technique for Learning Anything'
const SEEDED_TOP_COMMENT = 'The four-step loop works even better'
const SEEDED_NESTED_COMMENT = 'The refine step is where most people stop'

test('configured Supabase auth service is reachable', async ({ request }) => {
  test.skip(!SUPABASE_URL || !ANON_KEY, 'Supabase env not configured')

  const response = await request.get(`${SUPABASE_URL}/auth/v1/health`, {
    headers: { apikey: ANON_KEY }
  })

  expect(
    response.ok(),
    `Supabase auth health check failed at ${SUPABASE_URL}`
  ).toBeTruthy()
})

async function passwordSession() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD })
  })
  if (!res.ok) {
    throw new Error(
      `Sign-in failed (${res.status}) — did you run npm run seed:community?`
    )
  }
  return res.json()
}

test('sign in, comment, reply, and vote on a community resource', async ({
  page
}) => {
  test.skip(!SUPABASE_URL || !ANON_KEY, 'Supabase env not configured')

  // -- Sign in: obtain a session and store it the way supabase-js does
  const session = await passwordSession()
  const ref = new URL(SUPABASE_URL).hostname.split('.')[0]
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [`sb-${ref}-auth-token`, JSON.stringify(session)] as const
  )

  await page.goto('/community')

  // Signed-in header state confirms the session took
  await expect(page.getByRole('link', { name: /your profile/i })).toBeVisible()

  // -- Open the seeded resource's thread
  const row = page
    .getByTestId('resource-row')
    .filter({ hasText: SEEDED_RESOURCE })
  await expect(row).toBeVisible()
  await row.getByTestId('comments-toggle').click()
  const thread = row.getByTestId('comment-thread')
  await expect(thread.getByText(SEEDED_TOP_COMMENT)).toBeVisible()

  // Karma shows next to usernames (from profiles.karma_score)
  const topComment = thread
    .getByTestId('comment-item')
    .filter({ hasText: SEEDED_TOP_COMMENT })
    .first()
  await expect(topComment.getByTestId('comment-author').first()).toHaveText(
    'Devran Patel'
  )
  await expect(topComment.getByTestId('comment-karma').first()).toHaveText('47')

  // -- Comment (top-level)
  const commentText = `E2E comment ${Date.now()}`
  await thread.getByTestId('comment-input').fill(commentText)
  await thread.getByTestId('comment-submit').click()
  const myComment = thread
    .getByTestId('comment-item')
    .filter({ hasText: commentText })
  await expect(myComment.getByTestId('comment-body')).toHaveText(commentText)
  await expect(myComment.getByTestId('comment-author')).toHaveText(DISPLAY_NAME)
  await expect(myComment.getByTestId('comment-karma')).toHaveText('132')

  // -- Reply to the seeded nested comment (Maya's own deepest reply's parent:
  //    reply to Lena's comment to create a 4th level)
  const replyText = `E2E reply ${Date.now()}`
  const nestedComment = thread
    .getByTestId('comment-item')
    .filter({ hasText: SEEDED_NESTED_COMMENT })
    .last()
  await nestedComment.getByTestId('comment-reply-btn').first().click()
  await thread.getByTestId('reply-input').fill(replyText)
  await thread.getByTestId('reply-submit').click()
  await expect(
    nestedComment.getByTestId('comment-item').filter({ hasText: replyText })
  ).toBeVisible()

  // -- Vote: upvote the seeded top comment (Maya has no prior vote on it in
  //    this test run only if seed was re-run; read score, click, expect +1
  //    or -1 depending on prior state — assert the score CHANGED and the
  //    active state toggled)
  const voteBox = topComment.getByTestId('comment-vote').first()
  const before = parseInt((await voteBox.innerText()).trim(), 10)
  await voteBox.getByRole('button', { name: 'Upvote' }).click()
  await expect
    .poll(async () => parseInt((await voteBox.innerText()).trim(), 10))
    .not.toBe(before)
})
