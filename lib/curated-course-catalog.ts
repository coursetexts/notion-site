/**
 * Server-only catalog of degree syllabi that have a real topic tree.
 * Source: data/curated-courses/{slug}.json (not title-only DB stubs).
 */
import fs from 'fs'
import path from 'path'

import { courseLearningPathIsFilled } from './course-learning-path-types'

export type FilledCuratedCourseCatalogItem = {
  id: string
  slug: string
  title: string
  description: string
  area?: string
}

export function listFilledCuratedCourseCatalog(): FilledCuratedCourseCatalogItem[] {
  const dir = path.join(process.cwd(), 'data/curated-courses')
  if (!fs.existsSync(dir)) return []

  const items: FilledCuratedCourseCatalogItem[] = []

  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.json')) continue
    const fullPath = path.join(dir, file)
    let raw: unknown
    try {
      raw = JSON.parse(fs.readFileSync(fullPath, 'utf8'))
    } catch {
      continue
    }
    if (!raw || typeof raw !== 'object') continue
    if (!courseLearningPathIsFilled(raw)) continue

    const row = raw as {
      slug?: unknown
      title?: unknown
      description?: unknown
      area?: unknown
    }
    const slug =
      typeof row.slug === 'string' && row.slug.trim()
        ? row.slug.trim()
        : file.replace(/\.json$/, '')
    const title =
      typeof row.title === 'string' && row.title.trim()
        ? row.title.trim()
        : slug
    const description =
      typeof row.description === 'string' ? row.description.trim() : ''
    const area =
      typeof row.area === 'string' && row.area.trim()
        ? row.area.trim()
        : undefined

    items.push({
      id: slug,
      slug,
      title,
      description,
      ...(area ? { area } : {})
    })
  }

  return items.sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
  )
}
