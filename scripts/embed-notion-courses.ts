/**
 * Backfill / refresh notion_course_embeddings for Notion university courses.
 *
 * Requires:
 *   supabase/migrations/057_notion_course_embeddings.sql
 *
 * Env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   LEARNING_PATHS_SEED_PROJECT_REF or COMMUNITY_SEED_PROJECT_REF
 *     (must match the URL)
 *   ALLOW_PRODUCTION_LEARNING_PATH_EMBED_BACKFILL=true
 *     (required only when targeting the production project)
 *   Notion credentials used by getSiteMap / loadNotionHomeCourses
 *
 * Usage:
 *   yarn embed:notion-courses
 *   yarn embed:notion-courses --dry-run
 * Idempotent: skips rows whose content_hash + model already match.
 * Does not print embedding vectors.
 */
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

import {
  LEARNING_PATH_EMBED_DIM,
  LEARNING_PATH_EMBED_MODEL,
  embedLearningPathText,
  learningPathEmbeddingHash
} from '../lib/learning-path-embed'
import {
  type NotionHomeCourseCard,
  loadNotionHomeCourses
} from '../lib/load-notion-home-courses'
import { notionCourseEmbeddingText } from '../lib/notion-course-embedding-text'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const expectedProjectRef =
  process.env.LEARNING_PATHS_SEED_PROJECT_REF ||
  process.env.COMMUNITY_SEED_PROJECT_REF
const productionProjectRefs = new Set(['ctzfgrzsgddjbprdkfor'])

function parseDryRunArg(): boolean {
  const argv = process.argv.slice(2).filter((a) => a !== '--')
  return argv.includes('--dry-run')
}

const dryRun = parseDryRunArg()

if (!url || !serviceKey || !expectedProjectRef) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or LEARNING_PATHS_SEED_PROJECT_REF.'
  )
  process.exit(1)
}

const actualProjectRef = new URL(url).hostname.split('.')[0]
const isProductionTarget = productionProjectRefs.has(actualProjectRef)
if (actualProjectRef !== expectedProjectRef) {
  console.error(
    'Refusing to embed: LEARNING_PATHS_SEED_PROJECT_REF does not match the target URL.'
  )
  process.exit(1)
}
if (isProductionTarget) {
  if (process.env.ALLOW_PRODUCTION_LEARNING_PATH_EMBED_BACKFILL !== 'true') {
    console.error(
      'Refusing to embed against the Coursetexts production Supabase project.'
    )
    console.error(
      'To opt in after verifying the target, set ALLOW_PRODUCTION_LEARNING_PATH_EMBED_BACKFILL=true.'
    )
    process.exit(1)
  }
  console.log(
    'ALLOW_PRODUCTION_LEARNING_PATH_EMBED_BACKFILL=true: proceeding against production.'
  )
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const PAGE_SIZE = 500

type EmbeddingRow = {
  notion_page_id: string
  model: string
  content_hash: string
}

function formatVector(values: number[]): string {
  return `[${values.join(',')}]`
}

function wouldSkipUnchanged(
  course: NotionHomeCourseCard,
  existing: Map<string, EmbeddingRow>
): boolean {
  const text = notionCourseEmbeddingText(course)
  const contentHash = learningPathEmbeddingHash(text)
  const prior = existing.get(course.id)
  return Boolean(
    prior &&
      prior.content_hash === contentHash &&
      prior.model === LEARNING_PATH_EMBED_MODEL
  )
}

async function loadNotionCourses(): Promise<NotionHomeCourseCard[]> {
  const courses = await loadNotionHomeCourses()
  return courses.filter(
    (course) =>
      course &&
      typeof course.id === 'string' &&
      course.id.trim() &&
      typeof course.title === 'string' &&
      course.title.trim()
  )
}

async function fetchExistingEmbeddings(): Promise<Map<string, EmbeddingRow>> {
  const map = new Map<string, EmbeddingRow>()
  for (let from = 0; ; from += PAGE_SIZE) {
    const to = from + PAGE_SIZE - 1
    const { data, error } = await admin
      .from('notion_course_embeddings')
      .select('notion_page_id, model, content_hash')
      .order('notion_page_id', { ascending: true })
      .range(from, to)
    if (error) {
      throw new Error(
        `Failed to load notion_course_embeddings: ${error.message}`
      )
    }
    const page = (data || []) as EmbeddingRow[]
    for (const row of page) {
      map.set(row.notion_page_id, row)
    }
    if (page.length < PAGE_SIZE) break
  }
  return map
}

async function deleteStaleEmbeddings(pageIds: string[]): Promise<number> {
  if (!pageIds.length) return 0
  let deleted = 0
  for (let i = 0; i < pageIds.length; i += PAGE_SIZE) {
    const chunk = pageIds.slice(i, i + PAGE_SIZE)
    const { error, count } = await admin
      .from('notion_course_embeddings')
      .delete({ count: 'exact' })
      .in('notion_page_id', chunk)
    if (error) {
      throw new Error(`Failed to delete stale embeddings: ${error.message}`)
    }
    deleted += count ?? chunk.length
  }
  return deleted
}

async function upsertEmbedding(input: {
  notionPageId: string
  title: string
  contentHash: string
  embedding: number[]
}): Promise<void> {
  const { error } = await admin.from('notion_course_embeddings').upsert(
    {
      notion_page_id: input.notionPageId,
      title: input.title,
      model: LEARNING_PATH_EMBED_MODEL,
      content_hash: input.contentHash,
      embedding: formatVector(input.embedding),
      updated_at: new Date().toISOString()
    },
    { onConflict: 'notion_page_id' }
  )
  if (error) {
    throw new Error(error.message)
  }
}

async function run() {
  console.log(`Target Supabase project: ${actualProjectRef}`)
  console.log(`Production target: ${isProductionTarget ? 'yes' : 'no'}`)
  console.log(
    `Model: ${LEARNING_PATH_EMBED_MODEL} (${LEARNING_PATH_EMBED_DIM}d)`
  )
  if (dryRun) {
    console.log('Dry run: no embeds, inserts, updates, or deletes.')
  }

  const courses = await loadNotionCourses()
  const eligibleIds = new Set(courses.map((course) => course.id))
  const existing = await fetchExistingEmbeddings()
  const staleIds = [...existing.keys()].filter((id) => !eligibleIds.has(id))

  if (dryRun) {
    let wouldSkip = 0
    let wouldEmbed = 0
    for (const course of courses) {
      if (wouldSkipUnchanged(course, existing)) {
        wouldSkip += 1
      } else {
        wouldEmbed += 1
      }
    }

    console.log('---')
    console.log(`Target project ref: ${actualProjectRef}`)
    console.log(`Production: ${isProductionTarget ? 'yes' : 'no'}`)
    console.log(`Eligible Notion courses: ${courses.length}`)
    console.log(`Would embed: ${wouldEmbed}`)
    console.log(`Would skip: ${wouldSkip}`)
    console.log(`Would delete: ${staleIds.length}`)
    return
  }

  const deleted = await deleteStaleEmbeddings(staleIds)

  console.log(`Eligible Notion courses: ${courses.length}`)
  console.log(`Existing embedding rows: ${existing.size}`)
  console.log(`Deleted stale embeddings: ${deleted}`)

  let embedded = 0
  let skipped = 0
  let errors = 0

  for (let i = 0; i < courses.length; i++) {
    const course = courses[i]
    const label = `${course.title} (${course.id})`
    try {
      const text = notionCourseEmbeddingText(course)
      const contentHash = learningPathEmbeddingHash(text)
      const prior = existing.get(course.id)
      if (
        prior &&
        prior.content_hash === contentHash &&
        prior.model === LEARNING_PATH_EMBED_MODEL
      ) {
        skipped += 1
        console.log(`[${i + 1}/${courses.length}] skip unchanged ${label}`)
        continue
      }

      const vector = await embedLearningPathText(text)
      if (!Array.isArray(vector) || vector.length !== LEARNING_PATH_EMBED_DIM) {
        throw new Error(
          `expected ${LEARNING_PATH_EMBED_DIM} dims, got ${
            Array.isArray(vector) ? vector.length : typeof vector
          }`
        )
      }
      if (
        !vector.every(
          (value) => typeof value === 'number' && Number.isFinite(value)
        )
      ) {
        throw new Error('embedding contained non-finite values')
      }

      await upsertEmbedding({
        notionPageId: course.id,
        title: course.title.trim(),
        contentHash,
        embedding: vector
      })
      embedded += 1
      console.log(`[${i + 1}/${courses.length}] embedded ${label}`)
    } catch (error) {
      errors += 1
      const message = error instanceof Error ? error.message : String(error)
      console.error(`[${i + 1}/${courses.length}] error ${label}: ${message}`)
    }
  }

  console.log('---')
  console.log(`Eligible: ${courses.length}`)
  console.log(`Embedded: ${embedded}`)
  console.log(`Skipped unchanged: ${skipped}`)
  console.log(`Deleted: ${deleted}`)
  console.log(`Errors: ${errors}`)

  if (errors > 0) {
    process.exit(1)
  }
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
