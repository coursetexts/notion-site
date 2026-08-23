/**
 * Seed curated course syllabus trees from data/curated-courses/{slug}.json
 *
 * Requires curated_courses / curated_course_* tables.
 * Env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   CURATED_COURSES_SEED_PROJECT_REF  (must match URL; refuse prod)
 *
 * Usage:
 *   yarn seed:curated-courses
 *   yarn seed:curated-courses -- --slug=fluid-mechanics
 *
 * Idempotent per slug: deletes existing curated_courses row (cascade) then re-inserts.
 */
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'
import { readFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const expectedProjectRef = process.env.CURATED_COURSES_SEED_PROJECT_REF
const productionProjectRefs = new Set(['agxbxmvtbjigvfvhtxic'])

if (!url || !serviceKey || !expectedProjectRef) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or CURATED_COURSES_SEED_PROJECT_REF.'
  )
  process.exit(1)
}

const actualProjectRef = new URL(url).hostname.split('.')[0]
if (actualProjectRef !== expectedProjectRef) {
  console.error(
    'Refusing to seed: CURATED_COURSES_SEED_PROJECT_REF does not match the target URL.'
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

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '../data/curated-courses')

function parseSlugArg() {
  const argv = process.argv.slice(2).filter((a) => a !== '--')
  const flag = argv.find((a) => a.startsWith('--slug='))
  if (flag) return flag.slice('--slug='.length).trim()
  const idx = argv.indexOf('--slug')
  if (idx >= 0 && argv[idx + 1]) return argv[idx + 1].trim()
  return 'fluid-mechanics'
}

function loadCourseJson(slug) {
  const path = join(dataDir, `${slug}.json`)
  if (!existsSync(path)) {
    throw new Error(
      `Missing curated course file: data/curated-courses/${slug}.json`
    )
  }
  return JSON.parse(readFileSync(path, 'utf8'))
}

async function insertNode(courseId, node, parentId, sortOrder) {
  const { data: row, error } = await admin
    .from('curated_course_nodes')
    .insert({
      course_id: courseId,
      parent_id: parentId,
      node_type: node.type,
      title: node.title,
      description: node.description ?? null,
      sort_order: sortOrder
    })
    .select('id')
    .single()

  if (error) throw error

  if (node.videos?.length) {
    const videoRows = node.videos.map((v, i) => ({
      node_id: row.id,
      sort_order: i,
      title: v.title,
      channel: v.channel || null,
      duration_seconds: v.durationSeconds ?? null,
      url: v.url || '#',
      thumbnail_url: v.thumbnailUrl ?? null,
      annotation: v.annotation ?? null
    }))
    const { error: vErr } = await admin.from('curated_course_videos').insert(videoRows)
    if (vErr) throw vErr
  }

  const linkRows = [
    ...(node.tests ?? []).map((item, i) => ({
      node_id: row.id,
      kind: 'test',
      sort_order: i,
      title: item.title,
      url: item.url || '#'
    })),
    ...(node.slides ?? []).map((item, i) => ({
      node_id: row.id,
      kind: 'slide',
      sort_order: i,
      title: item.title,
      url: item.url || '#'
    }))
  ]
  if (linkRows.length) {
    const { error: lErr } = await admin.from('curated_course_links').insert(linkRows)
    if (lErr) throw lErr
  }

  if (node.children?.length) {
    for (let i = 0; i < node.children.length; i++) {
      await insertNode(courseId, node.children[i], row.id, i)
    }
  }
}

async function main() {
  const slug = parseSlugArg()
  const course = loadCourseJson(slug)
  if (!course.slug || !course.title || !Array.isArray(course.topics)) {
    throw new Error(`Invalid curated course JSON for ${slug}`)
  }

  console.log(`Seeding curated course: ${course.title} (${course.slug})`)

  await admin.from('curated_courses').delete().eq('slug', course.slug)

  const { data: inserted, error } = await admin
    .from('curated_courses')
    .insert({
      slug: course.slug,
      title: course.title,
      description: course.description ?? null
    })
    .select('id')
    .single()

  if (error) throw error

  for (let i = 0; i < course.topics.length; i++) {
    await insertNode(inserted.id, course.topics[i], null, i)
    process.stdout.write('.')
  }

  if (course.resources?.length) {
    const resourceRows = course.resources.map((r, i) => ({
      course_id: inserted.id,
      kind: r.kind,
      title: r.title,
      link_or_site: r.linkOrSite,
      description: r.description ?? null,
      sort_order: i
    }))
    const { error: rErr } = await admin
      .from('curated_course_resources')
      .insert(resourceRows)
    if (rErr) throw rErr
    console.log(`\nResources: ${resourceRows.length}`)
  }

  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
