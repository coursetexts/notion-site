/**
 * Generate Gemini related-search phrases for catalog items, then re-embed.
 *
 * Requires migration 058_catalog_related_terms.sql and GEMINI_API_KEY.
 * Same Supabase production guard as the other embed scripts.
 *
 * Usage:
 *   yarn embed:related-terms
 *   yarn embed:related-terms --dry-run
 */
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

process.env.NOTION_DEBUG_FULL_PAGE = '0'

import {
  CATALOG_RELATED_TERMS_RESPONSE_SCHEMA,
  CATALOG_RELATED_TERMS_SYSTEM_PROMPT,
  buildCatalogRelatedTermsUserPrompt,
  catalogRelatedTermsSourceHash,
  parseCatalogRelatedTermsResponse,
  type CatalogRelatedTermKind
} from '../lib/catalog-related-terms'
import { generateGeminiJson } from '../lib/gemini-generate-json'
import { isCatalogVisibleLearningPath } from '../lib/learning-path-catalog-visibility'
import { learningPathEmbeddingText } from '../lib/learning-path-embedding-text'
import { loadNotionHomeCourses } from '../lib/load-notion-home-courses'
import { notionCourseEmbeddingText } from '../lib/notion-course-embedding-text'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const expectedProjectRef =
  process.env.LEARNING_PATHS_SEED_PROJECT_REF ||
  process.env.COMMUNITY_SEED_PROJECT_REF
const productionProjectRefs = new Set(['ctzfgrzsgddjbprdkfor'])
const apiKey = process.env.GEMINI_API_KEY
const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

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

if (!dryRun && !apiKey) {
  console.error('Missing GEMINI_API_KEY.')
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
      'Refusing to write against the Coursetexts production Supabase project.'
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

type StoredTerms = {
  item_id: string
  source_hash: string
  terms: string[]
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
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
    if (error) throw new Error(`Failed to load learning_paths: ${error.message}`)
    const page = (data || []) as PathRow[]
    rows.push(...page)
    if (page.length < PAGE_SIZE) break
  }
  return rows
}

async function fetchStoredTerms(
  kind: CatalogRelatedTermKind
): Promise<Map<string, StoredTerms>> {
  const map = new Map<string, StoredTerms>()
  for (let from = 0; ; from += PAGE_SIZE) {
    const to = from + PAGE_SIZE - 1
    const { data, error } = await admin
      .from('catalog_related_terms')
      .select('item_id, source_hash, terms')
      .eq('item_kind', kind)
      .range(from, to)
    if (error) {
      throw new Error(
        `Failed to load catalog_related_terms (${kind}): ${error.message}. Apply supabase/migrations/058_catalog_related_terms.sql.`
      )
    }
    const page = (data || []) as StoredTerms[]
    for (const row of page) {
      map.set(row.item_id, row)
    }
    if (page.length < PAGE_SIZE) break
  }
  return map
}

async function upsertTerms(input: {
  kind: CatalogRelatedTermKind
  itemId: string
  terms: string[]
  sourceHash: string
}): Promise<void> {
  const { error } = await admin.from('catalog_related_terms').upsert(
    {
      item_kind: input.kind,
      item_id: input.itemId,
      terms: input.terms,
      source_hash: input.sourceHash,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'item_kind,item_id' }
  )
  if (error) throw new Error(error.message)
}

async function generateTerms(input: {
  kind: CatalogRelatedTermKind
  title: string
  text: string
}): Promise<string[]> {
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY')
  let lastError: unknown
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const parsed = await generateGeminiJson({
        apiKey,
        model,
        systemPrompt: CATALOG_RELATED_TERMS_SYSTEM_PROMPT,
        userPrompt: buildCatalogRelatedTermsUserPrompt({
          kind: input.kind,
          title: input.title,
          text: input.text.slice(0, 1800)
        }),
        responseSchema: CATALOG_RELATED_TERMS_RESPONSE_SCHEMA,
        temperature: 0.2,
        maxOutputTokens: 1024
      })
      const terms = parseCatalogRelatedTermsResponse(parsed)
      if (terms.length === 0) {
        throw new Error('Gemini returned no usable terms')
      }
      return terms
    } catch (error) {
      lastError = error
      if (attempt < 2) {
        await sleep(1500 * (attempt + 1))
        continue
      }
      throw error
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

async function runKind(params: {
  kind: CatalogRelatedTermKind
  items: Array<{ id: string; title: string; sourceText: string }>
}): Promise<{ generated: number; skipped: number; errors: number }> {
  const stored = await fetchStoredTerms(params.kind)
  let generated = 0
  let skipped = 0
  let errors = 0

  for (let i = 0; i < params.items.length; i++) {
    const item = params.items[i]
    const label = `${item.title} (${item.id})`
    const sourceHash = catalogRelatedTermsSourceHash(item.sourceText)
    const prior = stored.get(item.id)
    if (prior && prior.source_hash === sourceHash && prior.terms.length > 0) {
      skipped += 1
      console.log(
        `[${params.kind} ${i + 1}/${params.items.length}] skip unchanged ${label}`
      )
      continue
    }

    if (dryRun) {
      generated += 1
      console.log(
        `[${params.kind} ${i + 1}/${params.items.length}] would generate ${label}`
      )
      continue
    }

    try {
      const terms = await generateTerms({
        kind: params.kind,
        title: item.title,
        text: item.sourceText
      })
      await upsertTerms({
        kind: params.kind,
        itemId: item.id,
        terms,
        sourceHash
      })
      generated += 1
      console.log(
        `[${params.kind} ${i + 1}/${params.items.length}] ${terms.length} terms ${label}`
      )
      await sleep(200)
    } catch (error) {
      errors += 1
      const message = error instanceof Error ? error.message : String(error)
      console.error(
        `[${params.kind} ${i + 1}/${params.items.length}] error ${label}: ${message}`
      )
    }
  }

  return { generated, skipped, errors }
}

async function run() {
  console.log(`Target Supabase project: ${actualProjectRef}`)
  console.log(`Production target: ${isProductionTarget ? 'yes' : 'no'}`)
  console.log(`Gemini model: ${model}`)
  if (dryRun) {
    console.log('Dry run: no Gemini calls, writes, or re-embeds.')
  }

  const pathRows = (await fetchAllPathRows()).filter(
    isCatalogVisibleLearningPath
  )
  const pathItems = pathRows.map((row) => ({
    id: row.id,
    title: row.title || row.slug || row.id,
    sourceText: learningPathEmbeddingText(row)
  }))

  const courses = (await loadNotionHomeCourses()).filter(
    (course) =>
      typeof course.id === 'string' &&
      course.id.trim() &&
      typeof course.title === 'string' &&
      course.title.trim()
  )
  const courseItems = courses.map((course) => ({
    id: course.id,
    title: course.title,
    sourceText: notionCourseEmbeddingText(course)
  }))

  console.log(
    `Eligible: ${pathItems.length} learning paths, ${courseItems.length} Notion courses`
  )

  const paths = await runKind({ kind: 'learning-path', items: pathItems })
  const notion = await runKind({
    kind: 'university-course',
    items: courseItems
  })

  console.log('---')
  console.log(
    `Paths generated: ${paths.generated} skip: ${paths.skipped} errors: ${paths.errors}`
  )
  console.log(
    `Notion generated: ${notion.generated} skip: ${notion.skipped} errors: ${notion.errors}`
  )

  if (dryRun) return

  if (paths.errors + notion.errors > 0) {
    console.error('Related-term generation had errors; skip re-embed.')
    process.exit(1)
  }

  console.log('Re-embedding catalog items so vectors include related terms...')
}

run()
  .then(async () => {
    if (dryRun) return
    const { spawn } = await import('node:child_process')
    const runScript = (script: string) =>
      new Promise<void>((resolve, reject) => {
        const child = spawn('npx', ['tsx', script], {
          stdio: 'inherit',
          env: process.env
        })
        child.on('exit', (code) => {
          if (code === 0) resolve()
          else reject(new Error(`${script} exited ${code}`))
        })
      })
    await runScript('scripts/embed-learning-paths.ts')
    await runScript('scripts/embed-notion-courses.ts')
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
