/**
 * Server-only loader for Gemini search aliases. Uses the service role.
 */
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import type { CatalogRelatedTermKind } from '@/lib/catalog-related-terms'

export type CatalogRelatedTermsMap = Record<string, string[]>

export async function listCatalogRelatedTermsByKind(
  kind: CatalogRelatedTermKind
): Promise<CatalogRelatedTermsMap> {
  const admin = getSupabaseAdmin()
  if (!admin) return {}

  const map: CatalogRelatedTermsMap = {}
  const pageSize = 500
  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1
    const { data, error } = await admin
      .from('catalog_related_terms')
      .select('item_id, terms')
      .eq('item_kind', kind)
      .range(from, to)
    if (error) {
      console.error('catalog_related_terms load failed', error.message)
      return map
    }
    const page = data || []
    for (const row of page) {
      const id = typeof row.item_id === 'string' ? row.item_id : ''
      if (!id || !Array.isArray(row.terms)) continue
      map[id] = row.terms.filter(
        (term): term is string => typeof term === 'string' && Boolean(term.trim())
      )
    }
    if (page.length < pageSize) break
  }
  return map
}

export function mergeRelatedTermsIntoExtra(
  extra: string | undefined,
  terms: string[] | undefined
): string | undefined {
  const cleaned = (terms || []).map((term) => term.trim()).filter(Boolean)
  if (cleaned.length === 0) return extra
  const joined = cleaned.join(' ')
  if (!extra?.trim()) return joined
  return `${extra} ${joined}`
}
