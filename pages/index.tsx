import * as React from 'react'
import { GetStaticProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'

import type { Block, ExtendedRecordMap } from 'notion-types'
import {
  getBlockParentPage,
  getBlockTitle,
  getPageProperty,
  getTextContent,
  parsePageId,
  uuidToId
} from 'notion-utils'

import { HomeBlogSection } from '@/components/HomeBlogSection'
import {
  HomeCourseCard,
  HomeCoursesSection
} from '@/components/HomeCoursesSection'
import { HomeDonateSection } from '@/components/HomeDonateSection'
import { HomeDotGrid } from '@/components/HomeDotGrid'
import { HomeFooterSection } from '@/components/HomeFooterSection'
import { HomeHeader } from '@/components/HomeHeader'
import { HomeHero } from '@/components/HomeHero'
import { HomeLearnSection } from '@/components/HomeLearnSection'
import { isDev, rootNotionPageId } from '@/lib/config'
import { getSiteMap } from '@/lib/get-site-map'
import { getRecordBlockValue } from '@/lib/notion-record-block'

export type NotionHomeDebugPayload = {
  reason?: string
  pageMapKey: string | null
  rootBlockId: string | null
  rootBlockType: string | null
  blockAtKeyType?: string | null
  rootListingCourseCount: number
  flattenedTextBlockCount?: number
  totalBlocksInRecordMap?: number
  sampleFlattened?: Array<{
    id: string
    type?: string
    text: string
  }>
  note?: string
}

type HomePageProps = {
  courses: HomeCourseCard[]
  notionHomeDebug?: NotionHomeDebugPayload | null
}

const SUBJECT_OPTIONS = ['Science', 'Math', 'Sociology', 'English'] as const
const DEFAULT_COURSE_DESCRIPTION = 'Explore this course on Coursetexts.'
type HomeSubject = (typeof SUBJECT_OPTIONS)[number]

function toText(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => toText(item))
      .filter(Boolean)
      .join(' ')
      .trim()
  }
  if (typeof value === 'object') {
    const candidate = (value as { name?: unknown }).name
    if (typeof candidate === 'string') return candidate
    try {
      return JSON.stringify(value)
    } catch {
      return ''
    }
  }
  return ''
}

function clip(text: string, max = 128): string {
  if (text.length <= max) return text
  return `${text.slice(0, max).trimEnd()}…`
}

function firstSentence(text: string, max = 150): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return ''

  const sentenceMatch = normalized.match(/^(.+?[.!?])(?:\s|$)/)
  const candidate = (sentenceMatch?.[1] || normalized).trim()
  return clip(candidate, max)
}

function isLikelyInstructorLine(text: string): boolean {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return true

  if (
    /\b(professor|instructor|lecturer|teaching assistant|ta|faculty|staff)\b/i.test(
      normalized
    )
  ) {
    return true
  }

  if (/^(dr|prof)\.?\s+/i.test(normalized)) {
    return true
  }

  // Most descriptions are sentence-like; this catches short "Firstname Lastname" lines.
  if (
    !/[.!?]/.test(normalized) &&
    /^[A-Z][a-z'`.-]+(?:\s+[A-Z][a-z'`.-]+){1,3}$/.test(normalized)
  ) {
    return true
  }

  return false
}

function isUsableDescriptionSentence(text: string): boolean {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return false
  if (
    isLikelySchoolDateLine(normalized) ||
    isLikelyInstructorLine(normalized)
  ) {
    return false
  }
  if (normalized.split(/\s+/).length < 5) return false
  return true
}

function cleanCourseTitle(rawTitle: string): string {
  const trimmed = rawTitle.trim()

  const withoutTrailingCode = trimmed.replace(
    /\s*\(([A-Z]{2,}\s*\d{1,4}[A-Z0-9-]*)\)\s*$/i,
    ''
  )

  const withoutLeadingCode = withoutTrailingCode.replace(
    /^\(?([A-Z]{2,}\s*\d{1,4}[A-Z0-9-]*)\)?\s*[:\-–]\s*/i,
    ''
  )

  return withoutLeadingCode.trim()
}

function isLikelySchoolDateLine(text: string): boolean {
  const value = text.trim()
  if (!value) return false

  const hasTerm =
    /(spring|summer|fall|winter|semester|quarter|\b20\d{2}\b)/i.test(value)
  const hasSeparator = /[|/]/.test(value)
  const hasSchool =
    /\b(university|college|institute|mit|harvard|stanford|waterloo|princeton|nyu|yale|columbia|cornell|berkeley)\b/i.test(
      value
    )

  return (hasTerm && hasSeparator) || (hasTerm && hasSchool)
}

/**
 * Plain text for matching course titles / metadata. Prefer getBlockTitle; extend
 * for block shapes that store copy outside properties.title (e.g. table_row cells).
 */
function getRecordBlockPlainText(
  recordMap: ExtendedRecordMap,
  blockId: string
): string {
  const block = getRecordBlockValue(recordMap, blockId)
  if (!block) return ''

  const fromTitle = (getBlockTitle(block, recordMap) || '')
    .replace(/\s+/g, ' ')
    .trim()
  if (fromTitle) return fromTitle

  if (block.type === 'table_row' && block.properties) {
    const props = block.properties as Record<string, unknown>
    const parts = Object.keys(props)
      .sort()
      .map((k) => getTextContent(props[k] as any) || '')
      .filter(Boolean)
    return parts.join(' ').replace(/\s+/g, ' ').trim()
  }

  return ''
}

function getChildBlockText(
  recordMap: ExtendedRecordMap,
  childId: string | undefined
): string {
  if (!childId) return ''
  return getRecordBlockPlainText(recordMap, childId)
}

function extractCourseFallbackContent(
  block: any,
  recordMap: ExtendedRecordMap
): {
  schoolDate: string
  descriptionSentence: string
} {
  const childIds = Array.isArray(block?.content) ? block.content : []
  const firstBlockText = getChildBlockText(recordMap, childIds[0])
  const thirdBlockText = getChildBlockText(recordMap, childIds[2])

  const schoolDate = isLikelySchoolDateLine(firstBlockText)
    ? firstBlockText
    : ''
  const thirdSentence = thirdBlockText ? firstSentence(thirdBlockText) : ''
  if (isUsableDescriptionSentence(thirdSentence)) {
    return { schoolDate, descriptionSentence: thirdSentence }
  }

  for (const childId of childIds.slice(1, 24)) {
    const childText = getChildBlockText(recordMap, childId)
    if (!childText || isLikelySchoolDateLine(childText)) continue
    const sentence = firstSentence(childText)
    if (isUsableDescriptionSentence(sentence)) {
      return { schoolDate, descriptionSentence: sentence }
    }
  }

  return { schoolDate, descriptionSentence: '' }
}

function looksLikeTerm(value: string): boolean {
  return /(spring|summer|fall|winter|semester|quarter|term|\b20\d{2}\b)/i.test(
    value
  )
}

function inferSchoolFromText(text: string): string {
  const normalized = text.toLowerCase()

  const schools: Array<[RegExp, string]> = [
    [/\bharvard\b/i, 'Harvard University'],
    [/\bstanford\b/i, 'Stanford University'],
    [/\bwaterloo\b/i, 'University of Waterloo'],
    [/\bubc\b|\bbritish columbia\b/i, 'University of British Columbia'],
    [/\bprinceton\b/i, 'Princeton University'],
    [/\bnew york university\b|\bnyu\b/i, 'New York University'],
    [/\bmassachusetts institute of technology\b|\bmit\b/i, 'MIT']
  ]

  for (const [pattern, name] of schools) {
    if (pattern.test(normalized)) return name
  }

  return ''
}

function parseSchoolDate(raw: string): { school: string; term: string } {
  const value = raw.replace(/\s+/g, ' ').trim()
  if (!value) return { school: '', term: '' }

  const segments = value
    .split(/[|/]/)
    .map((item) => item.trim())
    .filter(Boolean)

  if (segments.length >= 2) {
    const first = segments[0]
    const second = segments[1]
    const firstTerm = looksLikeTerm(first)
    const secondTerm = looksLikeTerm(second)

    if (firstTerm && !secondTerm) return { school: second, term: first }
    if (secondTerm && !firstTerm) return { school: first, term: second }
    return { school: first, term: second }
  }

  if (looksLikeTerm(value)) {
    return { school: '', term: value }
  }

  return { school: value, term: '' }
}

function formatSchoolDisplayName(school: string): string {
  const trimmed = school.trim()
  if (!trimmed) return ''

  if (/^harvard university$/i.test(trimmed)) return 'Harvard'
  if (/^princeton university$/i.test(trimmed)) return 'Princeton'
  if (/^yale university$/i.test(trimmed)) return 'Yale'
  if (/^columbia university$/i.test(trimmed)) return 'Columbia'

  return trimmed
}

function buildCourseMeta(params: {
  schoolDate: string
  school: string
  term: string
  title: string
  pagePath: string
  description: string
}): string {
  const parsed = parseSchoolDate(params.schoolDate)

  let school = parsed.school || params.school.trim()
  const term = parsed.term || params.term.trim()

  if (/^course$/i.test(school)) {
    school = ''
  }

  if (!school) {
    school = inferSchoolFromText(
      `${params.title} ${params.pagePath} ${params.description}`
    )
  }

  school = formatSchoolDisplayName(school)

  if (school && term) return `${school} / ${term}`
  if (school) return school
  if (term) return term

  return (
    inferSchoolFromText(`${params.title} ${params.pagePath}`) ||
    'Harvard / Spring 2024'
  )
}

function pickRandom<T>(items: T[], count: number): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, count)
}

function fallbackCourses(): HomeCourseCard[] {
  const fallbackMeta = [
    'Harvard University / Fall 2024',
    'Stanford University / Fall 2024',
    'University of Waterloo / Winter 2025',
    'MIT / Spring 2025'
  ]

  return Array.from({ length: 8 }).map((_, index) => ({
    id: `fallback-${index + 1}`,
    href: '/',
    meta: fallbackMeta[index % fallbackMeta.length],
    title: 'Global & Visual Digital Culture',
    description:
      'Investigate digital media as a convergence-point where technical-systems, economic-imperatives, and power-structures collide',
    subjects: [SUBJECT_OPTIONS[index % SUBJECT_OPTIONS.length]]
  }))
}

function parseSubjectsParam(
  value: string | string[] | undefined
): HomeSubject[] {
  const raw = Array.isArray(value) ? value.join(',') : value || ''

  if (!raw.trim()) return []

  const normalized = raw
    .split(',')
    .map((subject) => subject.trim().toLowerCase())
    .filter(Boolean)

  return SUBJECT_OPTIONS.filter((subject) =>
    normalized.includes(subject.toLowerCase())
  )
}

function sameSubjects(a: HomeSubject[], b: HomeSubject[]): boolean {
  if (a.length !== b.length) return false
  return a.every((subject, index) => subject === b[index])
}

function inferSubjects(params: {
  fallbackSeed: string
  pagePath: string
  title: string
  description: string
  schoolDate: string
  subjectHints: string
}): HomeSubject[] {
  const text =
    `${params.subjectHints} ${params.title} ${params.description} ${params.pagePath} ${params.schoolDate}`
      .toLowerCase()
      .replace(/\s+/g, ' ')

  const results: HomeSubject[] = []

  if (
    /\b(science|biology|biological|chemistry|chemical|physics|neuroscience|engineering|astronomy|geology|biochem|ecology|genetics|medicine)\b/.test(
      text
    )
  ) {
    results.push('Science')
  }

  if (
    /\b(math|maths|mathematics|calculus|algebra|geometry|trigonometry|probability|statistics|statistical|topology|number theory|linear algebra)\b/.test(
      text
    )
  ) {
    results.push('Math')
  }

  if (
    /\b(sociology|social|anthropology|politics|political|history|economics|economic|psychology|culture|public policy|law|philosophy|ethics)\b/.test(
      text
    )
  ) {
    results.push('Sociology')
  }

  if (
    /\b(english|writing|literature|poetry|grammar|rhetoric|linguistics|language|composition|creative writing)\b/.test(
      text
    )
  ) {
    results.push('English')
  }

  if (results.length > 0) {
    return SUBJECT_OPTIONS.filter((subject) => results.includes(subject))
  }

  let hash = 0
  for (let index = 0; index < params.fallbackSeed.length; index += 1) {
    hash = (hash << 5) - hash + params.fallbackSeed.charCodeAt(index)
    hash |= 0
  }
  const deterministicSubject =
    SUBJECT_OPTIONS[Math.abs(hash) % SUBJECT_OPTIONS.length]
  return [deterministicSubject]
}

/**
 * Stable dashed UUID for comparisons. Do not use idToUuid() on values that may
 * already contain hyphens — it corrupts the string. parsePageId handles both forms.
 */
function canonicalNotionPageUuid(id: string): string | null {
  return parsePageId(id, { uuid: true }) ?? null
}

function resolvePageMapKey(
  pageMap: Record<string, ExtendedRecordMap>,
  notionPageId: string
): string | null {
  const target = canonicalNotionPageUuid(notionPageId)
  if (!target) return null
  for (const key of Object.keys(pageMap)) {
    const keyUuid = canonicalNotionPageUuid(key)
    if (keyUuid === target) return key
  }
  return null
}

function findCanonicalPathForPageId(
  canonicalPageMap: Record<string, string>,
  pageMapKey: string
): string {
  const target = canonicalNotionPageUuid(pageMapKey)
  if (!target) return ''
  for (const [path, pid] of Object.entries(canonicalPageMap)) {
    if (canonicalNotionPageUuid(pid) === target) return path
  }
  return ''
}

/**
 * Course titles on the root Notion page look like "Frontiers in Biophysics (CHEM 163)"
 * or "* Title (CODE)" — paragraph or heading blocks with a parenthetical course code.
 */
function looksLikeCourseTitleLine(text: string): boolean {
  const normalized = text.replace(/^\s*\*\s*/, '').trim()
  if (!normalized) return false
  if (/\([A-Z]{2,}\s*\d{2,4}[A-Z0-9-]*\)/i.test(normalized)) return true
  if (/\([^)]*[A-Za-z][^)]*\d[^)]*\)/.test(normalized)) return true
  return false
}

/** Course list ends before the site footer (Notion page body convention). */
function isCourseListLicenseLine(text: string): boolean {
  const t = text.replace(/\s+/g, ' ').trim()
  return /\bCC[- ]?BY[- ]?NC[- ]?SA\b/i.test(t) && /licensed under/i.test(t)
}

const ROOT_PAGE_TEXT_BLOCK_TYPES = new Set<Block['type']>([
  'text',
  'header',
  'sub_header',
  'sub_sub_header',
  'bulleted_list',
  'numbered_list',
  'quote',
  'to_do',
  'table_row'
])

/** Notion roots that own a `content` tree of child blocks (normal page or full-page DB). */
const ROOT_TRAVERSAL_BLOCK_TYPES = new Set<string>([
  'page',
  'collection_view_page'
])

/**
 * Depth-first document order over `block.content`, including blocks inside
 * columns, callouts, toggles, etc. (Direct `page.content` alone misses those.)
 */
function flattenPageContentBlockIds(
  recordMap: ExtendedRecordMap,
  pageBlockId: string
): string[] {
  const out: string[] = []

  const visit = (blockId: string, parentBlockId: string | undefined) => {
    const block = getRecordBlockValue(recordMap, blockId)
    if (!block) return

    const atSiteRoot = blockId === pageBlockId
    const parentIsSiteRoot = parentBlockId === pageBlockId

    if (
      !atSiteRoot &&
      (block.type === 'page' || block.type === 'collection_view_page')
    ) {
      if (parentIsSiteRoot) {
        out.push(blockId)
      }
      const children = Array.isArray(block.content) ? block.content : []
      for (const cid of children) {
        visit(cid, blockId)
      }
      return
    }

    if (block.type === 'collection_view') {
      return
    }

    const children = Array.isArray(block.content) ? block.content : []

    if (!atSiteRoot && ROOT_PAGE_TEXT_BLOCK_TYPES.has(block.type)) {
      out.push(blockId)
    }

    if (block.type === 'transclusion_reference') {
      const refId = (block as Block & { format?: { transclusion_reference_pointer?: { id: string } } })
        .format?.transclusion_reference_pointer?.id
      if (refId) {
        visit(refId, blockId)
      }
      return
    }

    if (block.type === 'alias') {
      const aliasId = (
        block as Block & { format?: { alias_pointer?: { id: string } } }
      ).format?.alias_pointer?.id
      if (aliasId) {
        visit(aliasId, blockId)
      }
      return
    }

    for (const cid of children) {
      visit(cid, blockId)
    }
  }

  visit(pageBlockId, undefined)
  return out
}

/**
 * Metadata line: "Instructor | Term | School" (e.g. "Adam Cohen | Fall 2022 | Harvard University").
 */
function isCourseListingMetadataLine(text: string): boolean {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized.includes('|')) return false
  const parts = normalized.split('|').map((p) => p.trim()).filter(Boolean)
  if (parts.length >= 3) {
    // Middle segment is the term; last is school (may be "MIT", "Harvard University", etc.)
    return looksLikeTerm(parts[1]) && parts[2].length > 0
  }
  if (parts.length === 2) {
    return isLikelySchoolDateLine(normalized)
  }
  return false
}

function parseListingMetaLine(metaLine: string): { school: string; term: string } {
  const parts = metaLine.split('|').map((p) => p.trim()).filter(Boolean)
  if (parts.length >= 3) {
    return { school: parts[2], term: parts[1] }
  }
  return parseSchoolDate(metaLine)
}

function buildMetaFromListingLine(
  metaLine: string,
  title: string,
  pagePath: string,
  description: string
): string {
  const { school, term } = parseListingMetaLine(metaLine)
  const schoolFmt = formatSchoolDisplayName(school)
  if (schoolFmt && term) return `${schoolFmt} / ${term}`
  return buildCourseMeta({
    schoolDate: metaLine,
    school: '',
    term: '',
    title,
    pagePath,
    description
  })
}

function logRootPageBlocksPreview(
  recordMap: ExtendedRecordMap,
  pageId: string
): void {
  if (!isDev) return

  const flatIds = flattenPageContentBlockIds(recordMap, pageId)
  const preview = flatIds.slice(0, 120).map((blockId) => {
    const b = getRecordBlockValue(recordMap, blockId)
    const text = getRecordBlockPlainText(recordMap, blockId)
    return {
      id: blockId,
      type: b?.type,
      textPreview: text.slice(0, 160)
    }
  })

  console.log(
    '[getStaticProps] root Notion page — flattened content blocks (type + text preview)',
    JSON.stringify(
      { totalFlattened: flatIds.length, preview },
      null,
      2
    )
  )
}

function shouldLogFullNotionRecordMapJson(): boolean {
  if (!isDev) return false
  const v = process.env.NOTION_DEBUG_FULL_PAGE
  if (v === '0' || v === 'false') return false
  return true
}

/**
 * Logs every block in the page `recordMap` (inventory) and optionally the full JSON
 * (chunked). Set NOTION_DEBUG_FULL_PAGE=0 to skip the huge full dump; inventory still runs in dev.
 */
function logNotionRootRecordMapDebug(
  recordMap: ExtendedRecordMap,
  meta: { pageMapKey: string; stage: string }
): void {
  if (!isDev) return

  const blockMap = recordMap.block || {}
  const ids = Object.keys(blockMap)
  const topKeys = Object.keys(recordMap as unknown as Record<string, unknown>).filter(
    (k) => k !== 'block'
  )

  const inventory = ids.map((id) => {
    const wrap = blockMap[id] as { role?: string } | undefined
    const v = getRecordBlockValue(recordMap, id) as
      | (Block & { parent_table?: string })
      | undefined
    const content = Array.isArray(v?.content) ? v.content : null
    const props = v?.properties
    return {
      id,
      role: wrap?.role,
      type: v?.type,
      alive: v?.alive,
      parent_table: v?.parent_table,
      contentChildCount: content?.length ?? 0,
      propertyKeys:
        props && typeof props === 'object' ? Object.keys(props as object) : [],
      textPreview: getRecordBlockPlainText(recordMap, id).slice(0, 150)
    }
  })

  const payload = {
    ...meta,
    recordMapTopLevelKeys: topKeys,
    blockCount: ids.length,
    collectionCount: Object.keys(recordMap.collection || {}).length,
    collectionViewCount: Object.keys(recordMap.collection_view || {}).length,
    blocks: inventory
  }

  const invJson = JSON.stringify(payload, null, 2)
  const chunkSize = 14000
  console.log(
    `[getStaticProps] Notion DEBUG — block inventory (JSON length=${invJson.length}). ` +
      'Full recordMap: set NOTION_DEBUG_FULL_PAGE=0 to skip.'
  )
  for (let i = 0; i < invJson.length; i += chunkSize) {
    const part = Math.floor(i / chunkSize) + 1
    const total = Math.ceil(invJson.length / chunkSize) || 1
    console.log(`[NOTION_INVENTORY ${part}/${total}]\n${invJson.slice(i, i + chunkSize)}`)
  }

  if (!shouldLogFullNotionRecordMapJson()) {
    return
  }

  try {
    const full = JSON.stringify(recordMap, null, 2)
    console.log(
      `[getStaticProps] Notion DEBUG — FULL recordMap JSON (length=${full.length})`
    )
    for (let i = 0; i < full.length; i += chunkSize) {
      const part = Math.floor(i / chunkSize) + 1
      const total = Math.ceil(full.length / chunkSize) || 1
      console.log(`[NOTION_FULL_DUMP ${part}/${total}]\n${full.slice(i, i + chunkSize)}`)
    }
  } catch (err) {
    console.error('[getStaticProps] FULL recordMap JSON.stringify failed', err)
    console.dir(recordMap, { depth: 8, maxArrayLength: 20 })
  }
}

/**
 * Parses the root Coursetexts Notion page when courses are inline blocks:
 * title block → description paragraph(s) → "Instructor | Term | School" line.
 */
function extractHomeCoursesFromRootPage(params: {
  pageMap: Record<string, ExtendedRecordMap>
  canonicalPageMap: Record<string, string>
  rootNotionPageId: string
}): {
  courses: HomeCourseCard[]
  notionHomeDebug: NotionHomeDebugPayload | null
} {
  const pageMapKey = resolvePageMapKey(
    params.pageMap,
    params.rootNotionPageId
  )
  if (!pageMapKey) {
    if (isDev) {
      console.warn(
        '[getStaticProps] root listing: no pageMap key matches rootNotionPageId (ID normalize bug?)',
        {
          rootNotionPageId: params.rootNotionPageId,
          pageMapKeys: Object.keys(params.pageMap)
        }
      )
    }
    return {
      courses: [],
      notionHomeDebug: isDev
        ? {
            reason: 'no pageMapKey for rootNotionPageId',
            pageMapKey: null,
            rootBlockId: null,
            rootBlockType: null,
            rootListingCourseCount: 0
          }
        : null
    }
  }

  const recordMap = params.pageMap[pageMapKey] as ExtendedRecordMap
  if (!recordMap?.block) {
    return {
      courses: [],
      notionHomeDebug: isDev
        ? {
            reason: 'recordMap.block missing',
            pageMapKey,
            rootBlockId: null,
            rootBlockType: null,
            rootListingCourseCount: 0
          }
        : null
    }
  }

  logNotionRootRecordMapDebug(recordMap, {
    pageMapKey,
    stage: 'extractHomeCoursesFromRootPage (raw recordMap from getSiteMap pageMap)'
  })

  const wantUuid = canonicalNotionPageUuid(pageMapKey)
  const blockAtKey = getRecordBlockValue(recordMap, pageMapKey)

  let rootBlockId: string | null =
    blockAtKey && ROOT_TRAVERSAL_BLOCK_TYPES.has(blockAtKey.type)
      ? pageMapKey
      : Object.keys(recordMap.block).find((bid) => {
          const v = getRecordBlockValue(recordMap, bid)
          return (
            !!v &&
            ROOT_TRAVERSAL_BLOCK_TYPES.has(v.type) &&
            !!wantUuid &&
            canonicalNotionPageUuid(bid) === wantUuid
          )
        }) ?? null

  if (
    !rootBlockId &&
    blockAtKey &&
    Array.isArray(blockAtKey.content)
  ) {
    rootBlockId = pageMapKey
  }

  const rootBlock = rootBlockId
    ? getRecordBlockValue(recordMap, rootBlockId)
    : undefined
  const rootOk =
    !!rootBlockId &&
    !!rootBlock &&
    (ROOT_TRAVERSAL_BLOCK_TYPES.has(rootBlock.type) ||
      Array.isArray(rootBlock.content))

  if (!rootOk) {
    console.warn(
      '[getStaticProps] root listing: could not find root block in recordMap',
      JSON.stringify(
        {
          pageMapKey,
          wantUuid,
          blockAtKeyType: blockAtKey?.type,
          sampleBlockIds: Object.keys(recordMap.block).slice(0, 8)
        },
        null,
        2
      )
    )
    return {
      courses: [],
      notionHomeDebug: isDev
        ? {
            reason: 'root block not resolved (type/content)',
            pageMapKey,
            rootBlockId,
            rootBlockType: rootBlock?.type ?? null,
            blockAtKeyType: blockAtKey?.type ?? null,
            rootListingCourseCount: 0,
            totalBlocksInRecordMap: Object.keys(recordMap.block).length
          }
        : null
    }
  }

  logRootPageBlocksPreview(recordMap, rootBlockId!)

  const rootPagePath = findCanonicalPathForPageId(
    params.canonicalPageMap,
    pageMapKey
  )

  const flatIds = flattenPageContentBlockIds(recordMap, rootBlockId)
  const out: HomeCourseCard[] = []
  let i = 0

  while (i < flatIds.length) {
    const titleBlockId = flatIds[i]
    const rawTitle = getRecordBlockPlainText(recordMap, titleBlockId)

    if (isCourseListLicenseLine(rawTitle)) {
      break
    }

    if (!looksLikeCourseTitleLine(rawTitle)) {
      i += 1
      continue
    }

    const displayTitle = rawTitle.replace(/^\s*\*\s*/, '').trim()
    i += 1

    const descriptionChunks: string[] = []
    let metaLine: string | null = null
    let stopAll = false

    while (i < flatIds.length) {
      const cid = flatIds[i]
      const chunkText = getChildBlockText(recordMap, cid)

      if (isCourseListLicenseLine(chunkText)) {
        stopAll = true
        break
      }

      if (looksLikeCourseTitleLine(chunkText)) {
        break
      }

      if (isCourseListingMetadataLine(chunkText)) {
        metaLine = chunkText
        i += 1
        break
      }

      if (chunkText) descriptionChunks.push(chunkText)
      i += 1
    }

    if (stopAll) break

    if (!metaLine) continue

    const description = descriptionChunks.join(' ').replace(/\s+/g, ' ').trim()
    const descriptionSentence = firstSentence(description)
    const descriptionOut = clip(
      isUsableDescriptionSentence(descriptionSentence)
        ? descriptionSentence
        : description.length > 0
          ? clip(description, 150)
          : DEFAULT_COURSE_DESCRIPTION,
      150
    )

    const metaStr = buildMetaFromListingLine(
      metaLine,
      displayTitle,
      rootPagePath,
      description
    )

    const titleBlock = getRecordBlockValue(recordMap, titleBlockId)
    const nestedCoursePage =
      titleBlock &&
      (titleBlock.type === 'page' ||
        titleBlock.type === 'collection_view_page')
    const subPagePath = nestedCoursePage
      ? findCanonicalPathForPageId(
          params.canonicalPageMap,
          titleBlockId
        )
      : ''

    const hash = uuidToId(titleBlockId)
    const coursePageSegment =
      parsePageId(titleBlockId, { uuid: false }) ?? uuidToId(titleBlockId)

    let href: string
    if (nestedCoursePage) {
      href = subPagePath ? `/${subPagePath}` : `/${coursePageSegment}`
    } else {
      const rootPathForHash =
        rootPagePath ||
        findCanonicalPathForPageId(params.canonicalPageMap, pageMapKey) ||
        parsePageId(pageMapKey, { uuid: false }) ||
        uuidToId(pageMapKey)
      href = `/${rootPathForHash}#${hash}`
    }

    out.push({
      id: titleBlockId,
      href,
      meta: metaStr,
      title: clip(cleanCourseTitle(displayTitle) || displayTitle, 64),
      description: descriptionOut,
      subjects: inferSubjects({
        fallbackSeed: titleBlockId,
        pagePath: rootPagePath,
        title: displayTitle,
        description,
        schoolDate: metaLine,
        subjectHints: ''
      })
    })
  }

  if (out.length === 0) {
    const pageContentLen = Array.isArray(rootBlock.content)
      ? rootBlock.content.length
      : 0
    const totalBlocks = Object.keys(recordMap.block || {}).length
    const sample = flatIds.slice(0, 20).map((id) => {
      const t = getRecordBlockPlainText(recordMap, id)
      return {
        type: getRecordBlockValue(recordMap, id)?.type,
        text: t.slice(0, 120),
        titleCandidate: looksLikeCourseTitleLine(t),
        metaCandidate: isCourseListingMetadataLine(t)
      }
    })
    console.warn(
      '[getStaticProps] root listing parsed 0 courses — diagnostics',
      JSON.stringify(
        {
          pageMapKey,
          rootPagePath,
          pageContentChildCount: pageContentLen,
          totalBlocksInRecordMap: totalBlocks,
          flattenedTextBlockCount: flatIds.length,
          sampleFlattenedBlocks: sample
        },
        null,
        2
      )
    )
  }

  const notionHomeDebug: NotionHomeDebugPayload | null = isDev
    ? {
        pageMapKey,
        rootBlockId,
        rootBlockType: rootBlock?.type ?? null,
        blockAtKeyType: blockAtKey?.type ?? null,
        rootListingCourseCount: out.length,
        flattenedTextBlockCount: flatIds.length,
        totalBlocksInRecordMap: Object.keys(recordMap.block).length,
        sampleFlattened: flatIds.slice(0, 25).map((id) => ({
          id,
          type: getRecordBlockValue(recordMap, id)?.type,
          text: getRecordBlockPlainText(recordMap, id).slice(0, 160)
        })),
        note:
          'Dev-only payload from getStaticProps. Compare sampleFlattened order and text to Notion.'
      }
    : null

  return { courses: out, notionHomeDebug }
}

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  try {
    const siteMap = await getSiteMap()
    const excludedPaths = new Set([
      '',
      'why',
      'about',
      'process',
      'feed',
      'profile',
      'signin',
      'privacy-policy',
      'terms-of-service'
    ])

    const { courses: rootListing, notionHomeDebug } =
      extractHomeCoursesFromRootPage({
        pageMap: siteMap.pageMap as Record<string, ExtendedRecordMap>,
        canonicalPageMap: siteMap.canonicalPageMap,
        rootNotionPageId
      })

    if (isDev) {
      console.log(
        '[getStaticProps] courses from root listing:',
        rootListing.length
      )
    }

    let pool: HomeCourseCard[]

    if (rootListing.length > 0) {
      pool = rootListing
    } else {
      pool = []

      for (const [pagePath, pageId] of Object.entries(
        siteMap.canonicalPageMap
      )) {
        if (excludedPaths.has(pagePath)) continue

        const recordMap = siteMap.pageMap[pageId] as ExtendedRecordMap
      if (!recordMap?.block) continue

      const block = getRecordBlockValue(recordMap, pageId)
      if (!block || block.type !== 'page') continue

      const title = (getBlockTitle(block, recordMap) || '').trim()
      if (!title) continue

      const parentPage = getBlockParentPage(block, recordMap)
      const rootUuid = canonicalNotionPageUuid(rootNotionPageId)
      const parentUuid = parentPage?.id
        ? canonicalNotionPageUuid(parentPage.id)
        : null
      const isBlogPost =
        block.parent_table === 'collection' &&
        !!rootUuid &&
        parentUuid === rootUuid

      const published = getPageProperty<number>('Published', block, recordMap)
      if (isBlogPost || !!published) continue

      const descriptionRaw =
        getPageProperty<string>('Description', block, recordMap) ??
        getPageProperty<string>('Summary', block, recordMap) ??
        ''
      const description = toText(descriptionRaw).replace(/\s+/g, ' ').trim()
      const fallbackContent = extractCourseFallbackContent(block, recordMap)
      const descriptionSentence = firstSentence(description)

      const safeDescriptionSentence = isUsableDescriptionSentence(
        descriptionSentence
      )
        ? descriptionSentence
        : ''

      const schoolDateRaw =
        getPageProperty<string>('School | Date', block, recordMap) ??
        getPageProperty<string>('School / Date', block, recordMap) ??
        getPageProperty<string>('School', block, recordMap) ??
        ''
      const schoolDate =
        toText(schoolDateRaw).trim() || fallbackContent.schoolDate

      const schoolRaw =
        getPageProperty<string>('School', block, recordMap) ??
        getPageProperty<string>('University', block, recordMap) ??
        getPageProperty<string>('Institution', block, recordMap) ??
        ''
      const school = toText(schoolRaw).trim()

      const termRaw =
        getPageProperty<string>('Term', block, recordMap) ??
        getPageProperty<string>('Semester', block, recordMap) ??
        getPageProperty<string>('Quarter', block, recordMap) ??
        getPageProperty<string>('Season', block, recordMap) ??
        getPageProperty<string>('Year', block, recordMap) ??
        getPageProperty<string>('Date', block, recordMap) ??
        ''
      const term = toText(termRaw).trim()

      const subjectHintsRaw =
        getPageProperty<string>('Subject', block, recordMap) ??
        getPageProperty<string>('Subjects', block, recordMap) ??
        getPageProperty<string>('Topic', block, recordMap) ??
        getPageProperty<string>('Topics', block, recordMap) ??
        getPageProperty<string>('Field', block, recordMap) ??
        getPageProperty<string>('Department', block, recordMap) ??
        ''
      const subjectHints = toText(subjectHintsRaw).trim()

      const looksLikeCourse =
        /[a-z]{2,}[-\s]?\d{2,}/i.test(title) ||
        /course|lecture|syllabus|module|seminar/i.test(description) ||
        description.length > 30

      if (!looksLikeCourse) continue

      pool.push({
        id: pageId,
        href: `/${pagePath}`,
        meta: buildCourseMeta({
          schoolDate,
          school,
          term,
          title,
          pagePath,
          description
        }),
        title: clip(cleanCourseTitle(title) || title, 64),
        description: clip(
          safeDescriptionSentence ||
            fallbackContent.descriptionSentence ||
            DEFAULT_COURSE_DESCRIPTION,
          150
        ),
        subjects: inferSubjects({
          fallbackSeed: pageId,
          pagePath,
          title,
          description,
          schoolDate,
          subjectHints
        })
      })
      }

      if (pool.length > 0) {
        pool = pickRandom(pool, pool.length)
      }
    }

    const courses = pool.length > 0 ? pool : fallbackCourses()

    console.log(
      '[getStaticProps] home courses:',
      courses.length,
      rootListing.length > 0 ? '(parsed root Notion page)' : '(subpages or fallback)'
    )

    if (isDev) {
      console.log('[getStaticProps] final courses detail', {
        usedRootListing: rootListing.length > 0,
        sampleTitles: courses.slice(0, 3).map((c) => c.title)
      })
    }

    return {
      props: { courses, notionHomeDebug },
      revalidate: 600
    }
  } catch (error) {
    console.error('home page courses load failed', error)
    const courses = fallbackCourses()
    console.log('[getStaticProps] courses (fallback)', courses)
    return {
      props: { courses, notionHomeDebug: null },
      revalidate: 120
    }
  }
}

export default function HomePage({
  courses,
  notionHomeDebug
}: HomePageProps) {
  const router = useRouter()

  React.useEffect(() => {
    if (notionHomeDebug && typeof window !== 'undefined') {
      console.log(
        '%c[Coursetexts] Notion home debug (from getStaticProps)',
        'color:#2563eb;font-weight:bold;',
        notionHomeDebug
      )
    }
  }, [notionHomeDebug])

  React.useEffect(() => {
    if (!router.isReady) return

    const legacySubjectRaw = router.query.subject
    const legacySchoolRaw = router.query.school

    const legacySubject = Array.isArray(legacySubjectRaw)
      ? legacySubjectRaw[0]
      : legacySubjectRaw
    const legacySchool = Array.isArray(legacySchoolRaw)
      ? legacySchoolRaw[0]
      : legacySchoolRaw

    if (!legacySubject && !legacySchool) return

    const nextQuery: Record<string, string> = {}

    if (legacySubject?.trim()) {
      const normalizedSubject = /^maths$/i.test(legacySubject.trim())
        ? 'Math'
        : legacySubject.trim()
      nextQuery.subjects = normalizedSubject
    }

    if (legacySchool?.trim()) {
      nextQuery.q = legacySchool.trim()
    }

    void router.replace(
      {
        pathname: '/all-courses',
        query: nextQuery
      },
      undefined,
      { shallow: true }
    )
  }, [router])

  const querySubjects = React.useMemo(
    () =>
      parseSubjectsParam(
        router.query.subjects as string | string[] | undefined
      ),
    [router.query.subjects]
  )
  const [activeSubjects, setActiveSubjects] =
    React.useState<HomeSubject[]>(querySubjects)

  React.useEffect(() => {
    if (!router.isReady) return
    setActiveSubjects((current) =>
      sameSubjects(current, querySubjects) ? current : querySubjects
    )
  }, [querySubjects, router.isReady])

  React.useEffect(() => {
    if (!router.isReady || sameSubjects(querySubjects, activeSubjects)) return

    const nextQuery: Record<string, string | string[]> = {
      ...router.query
    } as Record<string, string | string[]>

    if (activeSubjects.length > 0) {
      nextQuery.subjects = activeSubjects.join(',')
    } else {
      delete nextQuery.subjects
    }

    void router.replace(
      {
        pathname: router.pathname,
        query: nextQuery
      },
      undefined,
      { shallow: true, scroll: false }
    )
  }, [activeSubjects, querySubjects, router])

  const handleSubjectToggle = React.useCallback((subject: string) => {
    if (!SUBJECT_OPTIONS.includes(subject as HomeSubject)) return

    setActiveSubjects((current) => {
      const typedSubject = subject as HomeSubject
      const next = current.includes(typedSubject)
        ? current.filter((item) => item !== typedSubject)
        : [...current, typedSubject]

      return SUBJECT_OPTIONS.filter((item) => next.includes(item))
    })
  }, [])

  const filteredCourses = React.useMemo(() => {
    const subset =
      activeSubjects.length === 0
        ? courses
        : courses.filter((course) =>
            (course.subjects || []).some((subject) =>
              activeSubjects.includes(subject as HomeSubject)
            )
          )

    return subset.slice(0, 8)
  }, [activeSubjects, courses])

  return (
    <>
      <Head>
        <title>Coursetexts</title>
        <link rel='preconnect' href='https://use.typekit.net' />
        <link rel='preconnect' href='https://p.typekit.net' />
        <link rel='stylesheet' href='https://use.typekit.net/vxh3dki.css' />
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link
          rel='preconnect'
          href='https://fonts.gstatic.com'
          crossOrigin=''
        />
        <link
          href='https://fonts.googleapis.com/css2?family=Bad+Script&family=Hanken+Grotesk:ital,wght@0,100..900;1,100..900&display=swap'
          rel='stylesheet'
        />
      </Head>

      <main
        style={
          {
            '--home-side': 'clamp(20px, 4.03vw, 58px)',
            '--home-main-max': '1324px',
            '--home-content-max': '640px',
            '--home-footer-side': 'max(28px, 15.28vw)',
            minHeight: '100vh',
            background: 'var(--footer, #F8F7F4)',
            display: 'flex',
            flexDirection: 'column'
          } as React.CSSProperties
        }
      >
        <HomeHeader />
        <HomeHero
          activeSubjects={activeSubjects}
          onSubjectToggle={handleSubjectToggle}
        />
        <HomeDotGrid courses={courses} />
        <HomeCoursesSection
          courses={filteredCourses}
          activeSubjects={activeSubjects}
          onSubjectToggle={handleSubjectToggle}
        />
        <HomeLearnSection />
        <HomeDonateSection />
        <HomeBlogSection />
        <HomeFooterSection />
      </main>
    </>
  )
}
