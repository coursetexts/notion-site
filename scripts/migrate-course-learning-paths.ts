/**
 * Copy curated_* syllabi into learning_paths.data (kind = course).
 *
 * Does not overwrite an existing learning_paths row unless kind is already
 * `course`. Never steals community/research slugs.
 *
 * Env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   LEARNING_PATHS_SEED_PROJECT_REF or CURATED_COURSES_SEED_PROJECT_REF
 *     (must match the URL; production is refused)
 *
 * Usage:
 *   yarn migrate:course-learning-paths
 *   yarn migrate:course-learning-paths -- --slug=fluid-mechanics
 */
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

import { loadCourseLearningPathFromCuratedTables } from '../lib/course-learning-path-db'
import type { CourseLearningPathData } from '../lib/course-learning-path-types'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const expectedProjectRef =
  process.env.LEARNING_PATHS_SEED_PROJECT_REF ||
  process.env.CURATED_COURSES_SEED_PROJECT_REF ||
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
    'Refusing to migrate: seed project ref does not match the target URL.'
  )
  process.exit(1)
}
if (productionProjectRefs.has(actualProjectRef)) {
  console.error('Refusing to migrate the Coursetexts production Supabase project.')
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

function parseSlugArg(): string | null {
  const argv = process.argv.slice(2).filter((a) => a !== '--')
  const flag = argv.find((a) => a.startsWith('--slug='))
  if (flag) return flag.slice('--slug='.length).trim() || null
  const idx = argv.indexOf('--slug')
  if (idx >= 0 && argv[idx + 1]) return argv[idx + 1].trim() || null
  return null
}

type PathRow = { id: string; kind?: string | null }

async function upsertCoursePath(tree: CourseLearningPathData): Promise<string | null> {
  const { data: existing, error: lookupError } = await admin
    .from('learning_paths')
    .select('id, kind')
    .eq('slug', tree.slug)
    .maybeSingle()
  if (lookupError) {
    throw new Error(`${tree.slug}: lookup failed: ${lookupError.message}`)
  }
  const row = (existing as PathRow | null) ?? null
  if (row?.kind && row.kind !== 'course') {
    console.warn(
      `skip ${tree.slug}: existing learning_paths.kind=${row.kind} (not overwritten)`
    )
    return null
  }

  const payload = {
    slug: tree.slug,
    owner_id: null,
    title: tree.title,
    goal: tree.title,
    summary: tree.description ?? '',
    data: { ...tree, dbBacked: true },
    is_catalog: true,
    is_private: false,
    kind: 'course',
    visibility: 'public',
    updated_at: new Date().toISOString()
  }

  if (row?.id) {
    const { error } = await admin
      .from('learning_paths')
      .update(payload)
      .eq('id', row.id)
    if (error) {
      throw new Error(`${tree.slug}: update failed: ${error.message}`)
    }
    return row.id
  }

  const { data: inserted, error } = await admin
    .from('learning_paths')
    .insert(payload)
    .select('id')
    .single()
  if (error) {
    throw new Error(`${tree.slug}: insert failed: ${error.message}`)
  }
  return (inserted as { id: string } | null)?.id ?? null
}

async function copyNotesAndPins() {
  const { data: notes, error: notesLoadError } = await admin
    .from('curated_course_notes')
    .select('user_id, node_id, course_slug, content')
  if (notesLoadError) {
    console.warn(`notes copy skipped: ${notesLoadError.message}`)
  } else if (notes?.length) {
    const { data: paths } = await admin
      .from('learning_paths')
      .select('id, slug')
      .eq('kind', 'course')
    const pathBySlug = new Map(
      ((paths || []) as Array<{ id: string; slug: string }>).map((row) => [
        row.slug,
        row.id
      ])
    )
    const grouped = new Map<string, Record<string, unknown>>()
    for (const note of notes as Array<{
      user_id: string
      node_id: string
      course_slug: string | null
      content: unknown
    }>) {
      const pathId = note.course_slug ? pathBySlug.get(note.course_slug) : null
      if (!pathId || !note.node_id) continue
      const key = `${note.user_id}:${pathId}`
      const bucket = grouped.get(key) ?? {}
      bucket[note.node_id] = note.content
      grouped.set(key, bucket)
    }
    for (const [key, noteMap] of grouped) {
      const [userId, pathId] = key.split(':')
      const existing = await admin
        .from('learning_path_user_state')
        .select('notes, resources, node_status')
        .eq('user_id', userId)
        .eq('path_id', pathId)
        .maybeSingle()
      const priorNotes =
        existing.data && typeof existing.data.notes === 'object'
          ? (existing.data.notes as Record<string, unknown>)
          : {}
      const { error } = await admin.from('learning_path_user_state').upsert(
        {
          user_id: userId,
          path_id: pathId,
          notes: { ...priorNotes, ...noteMap },
          resources: existing.data?.resources ?? {},
          node_status: existing.data?.node_status ?? {},
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id,path_id' }
      )
      if (error) {
        console.warn(`notes merge ${key}: ${error.message}`)
      }
    }
    console.log(`notes: merged ${grouped.size} user/path rows`)
  }

  const { data: pins, error: pinsError } = await admin
    .from('curated_course_pins')
    .select('user_id, course_id, created_at')
  if (pinsError) {
    console.warn(`pins copy skipped: ${pinsError.message}`)
    return
  }
  if (!pins?.length) return

  const { data: courses } = await admin
    .from('curated_courses')
    .select('id, slug')
  const slugByCourseId = new Map(
    ((courses || []) as Array<{ id: string; slug: string }>).map((row) => [
      row.id,
      row.slug
    ])
  )
  const { data: paths } = await admin
    .from('learning_paths')
    .select('id, slug')
    .eq('kind', 'course')
  const pathBySlug = new Map(
    ((paths || []) as Array<{ id: string; slug: string }>).map((row) => [
      row.slug,
      row.id
    ])
  )
  let copied = 0
  for (const pin of pins as Array<{
    user_id: string
    course_id: string
    created_at: string
  }>) {
    const slug = slugByCourseId.get(pin.course_id)
    const pathId = slug ? pathBySlug.get(slug) : null
    if (!pathId) continue
    const { error } = await admin.from('learning_path_pins').upsert(
      {
        user_id: pin.user_id,
        path_id: pathId,
        created_at: pin.created_at
      },
      { onConflict: 'user_id,path_id' }
    )
    if (error) {
      console.warn(`pin ${pin.user_id}/${slug}: ${error.message}`)
      continue
    }
    copied += 1
  }
  console.log(`pins: copied ${copied}`)
}

async function migrate() {
  const onlySlug = parseSlugArg()
  let query = admin.from('curated_courses').select('slug').order('slug')
  if (onlySlug) query = query.eq('slug', onlySlug)
  const { data: courses, error } = await query
  if (error) throw new Error(`curated_courses: ${error.message}`)
  const slugs = ((courses || []) as Array<{ slug: string }>).map((row) => row.slug)
  if (!slugs.length) {
    console.log(onlySlug ? `No curated_courses row for ${onlySlug}.` : 'No curated_courses rows.')
    return
  }

  let upserted = 0
  let skipped = 0
  for (const slug of slugs) {
    const tree = await loadCourseLearningPathFromCuratedTables(admin, slug)
    if (!tree) {
      console.warn(`skip ${slug}: could not assemble syllabus from curated_*`)
      skipped += 1
      continue
    }
    const id = await upsertCoursePath(tree)
    if (id) {
      upserted += 1
      console.log(`upserted ${slug}`)
    } else {
      skipped += 1
    }
  }

  await copyNotesAndPins()
  console.log(`Done. upserted=${upserted} skipped=${skipped}`)
}

migrate().catch((error) => {
  console.error(error)
  process.exit(1)
})
