/**
 * Seed catalog learning paths (Learn Spanish, transformers, rom-com, tree house).
 *
 * Requires tables from supabase/migrations/020_learning_paths.sql.
 * Env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   LEARNING_PATHS_SEED_PROJECT_REF or COMMUNITY_SEED_PROJECT_REF
 *     (must match the URL; production is refused)
 *
 * Usage: yarn seed:learning-paths
 * Idempotent: upserts catalog rows by slug.
 */
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

import { SEEDED_LEARNING_PATHS } from '../lib/learning-path-seed'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const expectedProjectRef =
  process.env.LEARNING_PATHS_SEED_PROJECT_REF ||
  process.env.COMMUNITY_SEED_PROJECT_REF
const productionProjectRefs = new Set(['agxbxmvtbjigvfvhtxic'])

if (!url || !serviceKey || !expectedProjectRef) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or LEARNING_PATHS_SEED_PROJECT_REF.'
  )
  process.exit(1)
}

const actualProjectRef = new URL(url).hostname.split('.')[0]
if (actualProjectRef !== expectedProjectRef) {
  console.error(
    'Refusing to seed: LEARNING_PATHS_SEED_PROJECT_REF does not match the target URL.'
  )
  process.exit(1)
}
if (productionProjectRefs.has(actualProjectRef)) {
  console.error('Refusing to seed the Coursetexts production Supabase project.')
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function seed() {
  for (const path of SEEDED_LEARNING_PATHS) {
    const { id: _id, ...data } = path
    void _id
    const payload = {
      slug: path.slug,
      owner_id: null,
      title: path.title,
      goal: path.goal,
      summary: path.summary,
      data,
      is_catalog: true,
      updated_at: new Date().toISOString()
    }
    const { data: existing, error: lookupError } = await admin
      .from('learning_paths')
      .select('id')
      .eq('slug', path.slug)
      .maybeSingle()
    if (lookupError) {
      throw new Error(`${path.slug}: lookup failed: ${lookupError.message}`)
    }
    if (existing?.id) {
      const { error } = await admin
        .from('learning_paths')
        .update(payload)
        .eq('id', existing.id)
      if (error) {
        throw new Error(`${path.slug}: update failed: ${error.message}`)
      }
      console.log(`updated ${path.slug}`)
    } else {
      const { error } = await admin.from('learning_paths').insert(payload)
      if (error) {
        throw new Error(`${path.slug}: insert failed: ${error.message}`)
      }
      console.log(`inserted ${path.slug}`)
    }
  }
}

seed()
  .then(() => {
    console.log(`Seeded ${SEEDED_LEARNING_PATHS.length} catalog learning paths.`)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
