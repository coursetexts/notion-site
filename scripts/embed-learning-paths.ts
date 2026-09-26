/**
 * Backfill / refresh learning_path_embeddings for catalog-visible paths.
 *
 * Requires:
 *   supabase/migrations/055_learning_path_embeddings.sql
 *   supabase/migrations/056_match_catalog_visible_learning_path_embeddings.sql
 *
 * Env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   LEARNING_PATHS_SEED_PROJECT_REF or COMMUNITY_SEED_PROJECT_REF
 *     (must match the URL)
 *   ALLOW_PRODUCTION_LEARNING_PATH_EMBED_BACKFILL=true
 *     (required only when targeting the production project)
 *
 * Usage:
 *   yarn embed:learning-paths
 *   yarn embed:learning-paths --dry-run
 * Idempotent: skips rows whose content_hash + model already match.
 * Does not print embedding vectors.
 */
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

import { isCatalogVisibleLearningPath } from '../lib/learning-path-catalog-visibility'
import {
  LEARNING_PATH_EMBED_DIM,
  LEARNING_PATH_EMBED_MODEL,
  embedLearningPathText,
  learningPathEmbeddingHash
} from '../lib/learning-path-embed'
import { learningPathEmbeddingText } from '../lib/learning-path-embedding-text'

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

type PathRow = {
  id: string
  slug: string
  title: string
  goal: string
  summary: string
  kind: string
  visibility: string | null
  is_private: boolean | null
  is_filled: boolean | null
  data: unknown
}

type EmbeddingRow = {
  path_id: string
  model: string
  content_hash: string
}

function formatVector(values: number[]): string {
  return `[${values.join(',')}]`
}

async function fetchRelatedTerms(): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>()
  for (let from = 0; ; from += PAGE_SIZE) {
    const to = from + PAGE_SIZE - 1
    const { data, error } = await admin
      .from('catalog_related_terms')
      .select('item_id, terms')
      .eq('item_kind', 'learning-path')
      .range(from, to)
    if (error) break
    const page = data || []
    for (const row of page) {
      if (typeof row.item_id === 'string' && Array.isArray(row.terms)) {
        map.set(
          row.item_id,
          row.terms.filter((term): term is string => typeof term === 'string')
        )
      }
    }
    if (page.length < PAGE_SIZE) break
  }
  return map
}

function wouldSkipUnchanged(
  row: PathRow,
  existing: Map<string, EmbeddingRow>,
  relatedTerms: Map<string, string[]>
): boolean {
  const text = learningPathEmbeddingText(row, relatedTerms.get(row.id))
  const contentHash = learningPathEmbeddingHash(text)
  const prior = existing.get(row.id)
  return Boolean(
    prior &&
      prior.content_hash === contentHash &&
      prior.model === LEARNING_PATH_EMBED_MODEL
  )
}

async function fetchAllPathRows(): Promise<PathRow[]> {
  const rows: PathRow[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const to = from + PAGE_SIZE - 1
    const { data, error } = await admin
      .from('learning_paths')
      .select(
        'id, slug, title, goal, summary, kind, visibility, is_private, is_filled, data'
      )
      .order('id', { ascending: true })
      .range(from, to)
    if (error) {
      throw new Error(`Failed to load learning_paths: ${error.message}`)
    }
    const page = (data || []) as PathRow[]
    rows.push(...page)
    if (page.length < PAGE_SIZE) break
  }
  return rows
}

async function fetchExistingEmbeddings(): Promise<Map<string, EmbeddingRow>> {
  const map = new Map<string, EmbeddingRow>()
  for (let from = 0; ; from += PAGE_SIZE) {
    const to = from + PAGE_SIZE - 1
    const { data, error } = await admin
      .from('learning_path_embeddings')
      .select('path_id, model, content_hash')
      .order('path_id', { ascending: true })
      .range(from, to)
    if (error) {
      throw new Error(
        `Failed to load learning_path_embeddings: ${error.message}`
      )
    }
    const page = (data || []) as EmbeddingRow[]
    for (const row of page) {
      map.set(row.path_id, row)
    }
    if (page.length < PAGE_SIZE) break
  }
  return map
}

async function deleteStaleEmbeddings(pathIds: string[]): Promise<number> {
  if (!pathIds.length) return 0
  let deleted = 0
  for (let i = 0; i < pathIds.length; i += PAGE_SIZE) {
    const chunk = pathIds.slice(i, i + PAGE_SIZE)
    const { error, count } = await admin
      .from('learning_path_embeddings')
      .delete({ count: 'exact' })
      .in('path_id', chunk)
    if (error) {
      throw new Error(`Failed to delete stale embeddings: ${error.message}`)
    }
    deleted += count ?? chunk.length
  }
  return deleted
}

async function upsertEmbedding(input: {
  pathId: string
  contentHash: string
  embedding: number[]
}): Promise<void> {
  const { error } = await admin.from('learning_path_embeddings').upsert(
    {
      path_id: input.pathId,
      model: LEARNING_PATH_EMBED_MODEL,
      content_hash: input.contentHash,
      embedding: formatVector(input.embedding),
      updated_at: new Date().toISOString()
    },
    { onConflict: 'path_id' }
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

  const allRows = await fetchAllPathRows()
  const eligible = allRows.filter(isCatalogVisibleLearningPath)
  const eligibleIds = new Set(eligible.map((row) => row.id))
  const existing = await fetchExistingEmbeddings()
  const relatedTerms = await fetchRelatedTerms()

  const staleIds = [...existing.keys()].filter((id) => !eligibleIds.has(id))

  if (dryRun) {
    let wouldSkip = 0
    let wouldEmbed = 0
    const byKind: Record<string, number> = {}
    for (const row of eligible) {
      byKind[row.kind || 'unknown'] = (byKind[row.kind || 'unknown'] || 0) + 1
      if (wouldSkipUnchanged(row, existing, relatedTerms)) {
        wouldSkip += 1
      } else {
        wouldEmbed += 1
      }
    }

    console.log('---')
    console.log(`Target project ref: ${actualProjectRef}`)
    console.log(`Production: ${isProductionTarget ? 'yes' : 'no'}`)
    console.log(`Eligible: ${eligible.length}`)
    console.log(`Eligible by kind: ${JSON.stringify(byKind)}`)
    console.log(`Would embed: ${wouldEmbed}`)
    console.log(`Would skip: ${wouldSkip}`)
    console.log(`Would delete: ${staleIds.length}`)
    return
  }

  const deleted = await deleteStaleEmbeddings(staleIds)

  console.log(`Eligible catalog-visible paths: ${eligible.length}`)
  console.log(`Existing embedding rows: ${existing.size}`)
  console.log(`Deleted stale embeddings: ${deleted}`)

  let embedded = 0
  let skipped = 0
  let errors = 0

  for (let i = 0; i < eligible.length; i++) {
    const row = eligible[i]
    const label = `${row.slug || row.id} (${row.kind})`
    try {
      const text = learningPathEmbeddingText(row, relatedTerms.get(row.id))
      const contentHash = learningPathEmbeddingHash(text)
      const prior = existing.get(row.id)
      if (
        prior &&
        prior.content_hash === contentHash &&
        prior.model === LEARNING_PATH_EMBED_MODEL
      ) {
        skipped += 1
        console.log(`[${i + 1}/${eligible.length}] skip unchanged ${label}`)
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
        pathId: row.id,
        contentHash,
        embedding: vector
      })
      embedded += 1
      console.log(`[${i + 1}/${eligible.length}] embedded ${label}`)
    } catch (error) {
      errors += 1
      const message = error instanceof Error ? error.message : String(error)
      console.error(`[${i + 1}/${eligible.length}] error ${label}: ${message}`)
    }
  }

  console.log('---')
  console.log(`Eligible: ${eligible.length}`)
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
