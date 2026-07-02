/**
 * Seed the community platform with 3 users, one resource, and a nested
 * comment thread — for local dev and the Playwright e2e test.
 *
 * Targets the LIVE schema (000_community_platform_init):
 *   profiles(id = auth uid, karma_score), resources, comments, votes.
 *
 * Requires (in .env or the environment):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (Dashboard → Settings → API — keep secret!)
 *
 * Usage: node scripts/seed-community.mjs
 * Idempotent: re-running resets the seeded thread and votes.
 */
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.'
  )
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const SEED_USERS = [
  {
    email: 'e2e-maya@coursetexts.dev',
    password: 'coursetexts-e2e-1!',
    display_name: 'Maya Chen',
    karma_score: 132
  },
  {
    email: 'e2e-devran@coursetexts.dev',
    password: 'coursetexts-e2e-2!',
    display_name: 'Devran Patel',
    karma_score: 47
  },
  {
    email: 'e2e-lena@coursetexts.dev',
    password: 'coursetexts-e2e-3!',
    display_name: 'Lena Hofmann',
    karma_score: 8
  }
]

const RESOURCE = {
  title: 'The Feynman Technique for Learning Anything',
  description:
    'A simple four-step method for understanding hard ideas: pick a concept, explain it plainly, find the gaps, and refine.',
  url: 'https://fs.blog/feynman-technique/',
  type: 'paper',
  status: 'approved'
}

async function findOrCreateUser({ email, password }) {
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })
  if (created?.user) return created.user
  if (!/already|exists|registered/i.test(error?.message ?? '')) throw error
  // Already exists — look it up.
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const user = data?.users?.find((u) => u.email === email)
  if (!user) throw new Error(`User ${email} exists but was not found`)
  return user
}

async function main() {
  // 1. Users + profiles. profiles.id IS the auth uid; the signup trigger
  //    creates the row, we then set display name + karma (display values only)
  const users = []
  for (const seed of SEED_USERS) {
    const user = await findOrCreateUser(seed)
    const { error } = await admin.from('profiles').upsert(
      {
        id: user.id,
        display_name: seed.display_name,
        email: seed.email,
        karma_score: seed.karma_score
      },
      { onConflict: 'id' }
    )
    if (error) throw error
    users.push({ ...seed, id: user.id })
    console.log(`user ok: ${seed.display_name} <${seed.email}>`)
  }
  const [maya, devran, lena] = users

  // 2. Resource (find-or-create by title so re-runs don't duplicate)
  let resource
  {
    const { data: existing } = await admin
      .from('resources')
      .select('id')
      .eq('title', RESOURCE.title)
      .maybeSingle()
    if (existing) {
      resource = existing
    } else {
      const { data, error } = await admin
        .from('resources')
        .insert({ ...RESOURCE, submitted_by: maya.id })
        .select('id')
        .single()
      if (error) throw error
      resource = data
    }
    console.log(`resource ok: ${RESOURCE.title} (${resource.id})`)
  }

  // 3. Reset the seeded thread (comment deletion cascades votes via trigger)
  {
    const { error } = await admin
      .from('comments')
      .delete()
      .eq('target_type', 'resource')
      .eq('target_id', resource.id)
    if (error) throw error
  }

  // 4. Nested thread: Devran → Lena replies → Maya replies to Lena
  const addComment = async (userId, body, parentId = null) => {
    const { data, error } = await admin
      .from('comments')
      .insert({
        user_id: userId,
        target_type: 'resource',
        target_id: resource.id,
        body,
        parent_comment_id: parentId
      })
      .select('id')
      .single()
    if (error) throw error
    return data
  }
  const c1 = await addComment(
    devran.id,
    'The four-step loop works even better if you write the explanation by hand — typing lets you paper over gaps.'
  )
  const c2 = await addComment(
    lena.id,
    'Agreed — I pair it with Excalidraw diagrams for step two. Explaining visually exposes different gaps than prose.',
    c1.id
  )
  await addComment(
    maya.id,
    'Both good points. The refine step is where most people stop too early, though.',
    c2.id
  )
  console.log('thread ok: 3 comments, nested 3 deep')

  // 5. Votes: resource votes + comment votes. Raw vote rows only — karma
  //    rules are TBD, so nothing here derives karma from votes.
  {
    const { error: rvErr } = await admin.from('votes').upsert(
      [
        {
          user_id: devran.id,
          target_type: 'resource',
          target_id: resource.id,
          value: 1
        },
        {
          user_id: lena.id,
          target_type: 'resource',
          target_id: resource.id,
          value: 1
        },
        {
          user_id: maya.id,
          target_type: 'comment',
          target_id: c1.id,
          value: 1
        },
        {
          user_id: lena.id,
          target_type: 'comment',
          target_id: c1.id,
          value: 1
        }
      ],
      { onConflict: 'user_id,target_type,target_id' }
    )
    if (rvErr) throw rvErr
    console.log('votes ok: 2 resource votes, 2 comment votes')
  }

  console.log('\nSeed complete. Test credentials:')
  for (const u of SEED_USERS) console.log(`  ${u.email} / ${u.password}`)
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
