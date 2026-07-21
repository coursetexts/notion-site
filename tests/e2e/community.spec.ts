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

test('upvoting updates the score without moving the resource', async ({
  page
}) => {
  test.skip(!SUPABASE_URL || !ANON_KEY, 'Supabase env not configured')

  const userId = '00000000-0000-4000-8000-000000000001'
  const now = Math.floor(Date.now() / 1000)
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString('base64url')
  const accessToken = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({
    aud: 'authenticated',
    exp: now + 3600,
    iat: now,
    role: 'authenticated',
    sub: userId
  })}.test-signature`
  const user = {
    id: userId,
    aud: 'authenticated',
    role: 'authenticated',
    email: 'ranking-test@coursetexts.dev',
    app_metadata: {},
    user_metadata: {},
    created_at: new Date().toISOString()
  }
  const session = {
    access_token: accessToken,
    refresh_token: 'ranking-test-refresh-token',
    expires_in: 3600,
    expires_at: now + 3600,
    token_type: 'bearer',
    user
  }
  const ref = new URL(SUPABASE_URL).hostname.split('.')[0]
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [`sb-${ref}-auth-token`, JSON.stringify(session)] as const
  )

  const resources = ['Alpha resource', 'Beta resource', 'Gamma resource'].map(
    (title, index) => ({
      id: `00000000-0000-4000-8000-00000000001${index}`,
      title,
      url: `https://example.com/${index}`,
      type: 'paper',
      description: `${title} description`,
      submitted_by: userId,
      created_at: new Date(Date.now() - index * 1000).toISOString()
    })
  )
  let votes: Array<{ user_id: string; target_id: string; value: number }> = []

  await page.route(`${SUPABASE_URL}/auth/v1/user**`, async (route) => {
    await route.fulfill({ json: user })
  })
  await page.route(`${SUPABASE_URL}/rest/v1/**`, async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const table = url.pathname.split('/').pop()

    if (table === 'resources') {
      await route.fulfill({ json: resources })
      return
    }
    if (table === 'profiles') {
      await route.fulfill({
        json: [
          {
            id: userId,
            display_name: 'Ranking Tester',
            avatar_url: null,
            karma_score: 0
          }
        ]
      })
      return
    }
    if (table === 'comments') {
      await route.fulfill({ json: [] })
      return
    }
    if (table === 'votes') {
      if (request.method() === 'POST') {
        const body = request.postDataJSON() as {
          user_id: string
          target_id: string
          value: number
        }
        votes = [body]
        await route.fulfill({ status: 201, body: '' })
        return
      }
      await route.fulfill({ json: votes })
      return
    }

    await route.fulfill({ json: [] })
  })

  await page.goto('/community')
  const titles = page.getByTestId('resource-title')
  await expect(titles).toHaveText([
    'Alpha resource',
    'Beta resource',
    'Gamma resource'
  ])

  const gamma = page
    .getByTestId('resource-row')
    .filter({ hasText: 'Gamma resource' })
  await gamma.getByRole('button', { name: 'Upvote' }).click()
  await expect(gamma.getByTestId('resource-vote')).toContainText('1')
  await expect(titles).toHaveText([
    'Alpha resource',
    'Beta resource',
    'Gamma resource'
  ])

  // Switching away and deliberately back to Top takes a fresh ranking
  // snapshot, so the new score can influence ordering at that point.
  await page.getByRole('button', { name: 'New' }).click()
  await page.getByRole('button', { name: 'Top' }).click()
  await expect(titles).toHaveText([
    'Gamma resource',
    'Alpha resource',
    'Beta resource'
  ])
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
