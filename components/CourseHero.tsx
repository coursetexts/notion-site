import React from 'react'

import styles from './CourseHero.module.css'
import { SaveCourseButton } from './SaveCourseButton'

export interface CourseHeroInstructor {
  name: string
  url: string
}

export interface CourseHeroData {
  courseCode?: string
  title: string
  /** Prefer this when multiple instructors (comma-separated or multiple links). */
  instructors?: CourseHeroInstructor[]
  /** Legacy single instructor; used if instructors is not set (e.g. cached data). */
  instructorName?: string
  instructorUrl?: string
  schoolDate?: string
  descriptionHtml: string
}

export interface CourseHeroCourseInfo {
  coursePageId?: string
  courseTitle: string
  courseUrl: string
}

interface CourseHeroProps extends CourseHeroData {
  coursePageId?: string
  courseTitle?: string
  courseUrl?: string
}

const COPYRIGHT_TOGGLE_TITLE = '⚖️ Copyright Report'
const COPYRIGHT_MODAL_TITLE = 'Copyright Summary'
const COPYRIGHT_PIPELINE_BLOG_URL =
  'https://blog.coursetexts.org/automating-copyright-compliance-for-open-courseware'
const COPYRIGHT_MODAL_INTRO_BEFORE =
  'To ensure this course is compliant for free internet distribution, lecture content was first run through the '
const COPYRIGHT_MODAL_INTRO_LINK_TEXT = 'Coursetexts copyright pipeline'
const COPYRIGHT_MODAL_INTRO_AFTER =
  '. This creates some deviation from the source material.'

type CopyrightPerFileItem = {
  filename: string
  stats?: string
}

type CopyrightReportData = {
  perFile: CopyrightPerFileItem[]
  summaryLines: string[]
  restHtml: string
}

function wrapFirstLetterInDescription(container: HTMLElement) {
  const wrap = (node: ChildNode): boolean => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      const text = node.textContent
      const first = text[0]
      const rest = text.slice(1)
      const parent = node.parentElement
      if (!parent || !first.match(/\p{L}/u)) return false
      const span = document.createElement('span')
      span.className = styles.dropCap
      span.textContent = first
      parent.insertBefore(span, node)
      node.textContent = rest
      return true
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      for (let i = 0; i < node.childNodes.length; i++) {
        if (wrap(node.childNodes[i])) return true
      }
    }
    return false
  }
  for (let i = 0; i < container.childNodes.length; i++) {
    if (wrap(container.childNodes[i])) break
  }
}

function extractToggleInnerHtmlBySummaryText(
  root: ParentNode,
  summaryText: string
): string | null {
  const detailsEls = Array.from(root.querySelectorAll('details'))
  for (const details of detailsEls) {
    const summary = details.querySelector('summary')
    const label = (summary?.textContent ?? '').trim()
    if (!label) continue
    if (label !== summaryText) continue

    const wrapper = document.createElement('div')
    // Everything inside the toggle except the <summary> itself.
    for (const child of Array.from(details.childNodes)) {
      if (
        child.nodeType === Node.ELEMENT_NODE &&
        (child as Element).tagName.toLowerCase() === 'summary'
      ) {
        continue
      }
      wrapper.appendChild(child.cloneNode(true))
    }

    const html = wrapper.innerHTML.trim()
    return html.length ? html : null
  }
  return null
}

function findToggleDetailsBySummaryText(
  root: ParentNode,
  summaryText: string
): HTMLDetailsElement | null {
  const detailsEls = Array.from(root.querySelectorAll('details'))
  for (const details of detailsEls) {
    const summary = details.querySelector('summary')
    const label = (summary?.textContent ?? '').trim()
    if (!label) continue
    if (label !== summaryText) continue
    return details as HTMLDetailsElement
  }
  return null
}

function parseCopyrightReportFromToggleHtml(html: string): CopyrightReportData {
  const container = document.createElement('div')
  container.innerHTML = html

  const summaryPrefixOrder = [
    'PDFs processed:',
    'Images —',
    'Attributions —',
    'Placement —',
    'Sources —'
  ]

  const summaryLines: string[] = []

  const notionTextEls = Array.from(
    container.querySelectorAll<HTMLElement>('.notion-text')
  )
  if (notionTextEls.length) {
    const lines = notionTextEls
      .map((el) => (el.textContent ?? '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)

    for (const prefix of summaryPrefixOrder) {
      const found = lines.find((l) => l.startsWith(prefix))
      if (found) summaryLines.push(found)
    }
  } else {
    // Fallback: still try to find lines by scanning all text blocks.
    const lines = Array.from(container.querySelectorAll<HTMLElement>('p, div'))
      .map((el) => (el.textContent ?? '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
    for (const prefix of summaryPrefixOrder) {
      const found = lines.find((l) => l.startsWith(prefix))
      if (found) summaryLines.push(found)
    }
  }

  const findPerFileHeading = (): HTMLElement | null => {
    const candidates = Array.from(container.querySelectorAll<HTMLElement>('*'))
    for (const el of candidates) {
      const t = (el.textContent ?? '').trim()
      if (t === 'Per-file breakdown:' || t === 'Per file breakdown:') return el
    }
    return null
  }

  const getNextListAfter = (
    start: Node
  ): HTMLUListElement | HTMLOListElement | null => {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT)
    walker.currentNode = start
    // Move once so we don't match a list inside the heading element.
    walker.nextNode()
    let node: Node | null
    while ((node = walker.nextNode())) {
      const el = node as HTMLElement
      const tag = el.tagName?.toLowerCase?.()
      if (tag === 'ul' || tag === 'ol') return el as any
    }
    return null
  }

  const perFile: CopyrightPerFileItem[] = []
  const perFileHeadingEl = findPerFileHeading()
  const perFileListEl =
    (perFileHeadingEl ? getNextListAfter(perFileHeadingEl) : null) ?? null

  const isLikelyFileLine = (raw: string) => {
    const t = raw.toLowerCase()
    return (
      t.includes('.pdf') ||
      t.includes('.doc') ||
      t.includes('.docx') ||
      t.includes('.ppt') ||
      t.includes('.pptx')
    )
  }

  const parsedLiEls: HTMLLIElement[] = []
  const parseLi = (li: HTMLLIElement) => {
    const raw = (li.textContent ?? '').replace(/\s+/g, ' ').trim()
    if (!raw) return
    if (!isLikelyFileLine(raw)) return
    const parts = raw.split(/\s+[—-]\s+/u)
    const filename = (parts[0] ?? '').trim()
    const stats = (parts.slice(1).join(' — ') ?? '').trim()
    if (!filename) return
    perFile.push({ filename, stats: stats || undefined })
    parsedLiEls.push(li)
  }

  // Prefer the list right after "Per-file breakdown:", but fall back to any list
  // items that look like file entries (some pages omit the heading or structure).
  if (perFileListEl) {
    const items = Array.from(perFileListEl.querySelectorAll('li'))
    items.forEach(parseLi)
  }

  if (perFile.length === 0) {
    const allLis = Array.from(container.querySelectorAll<HTMLLIElement>('li'))
    allLis.forEach(parseLi)
  }

  // Remove the per-file section (heading + parsed list items) from the rest HTML
  // to prevent duplication.
  if (perFileHeadingEl) perFileHeadingEl.remove()
  if (
    perFileListEl &&
    perFileListEl.querySelectorAll('li').length === parsedLiEls.length
  ) {
    // If the list appears to contain only per-file entries, remove the whole list.
    perFileListEl.remove()
  } else {
    parsedLiEls.forEach((li) => li.remove())
  }

  // Remove any summary lines blocks from rest HTML (we re-render them styled).
  if (summaryLines.length) {
    const candidates = Array.from(
      container.querySelectorAll<HTMLElement>('.notion-text, p, div')
    )
    candidates.forEach((el) => {
      const t = (el.textContent ?? '').replace(/\s+/g, ' ').trim()
      if (!t) return
      if (summaryLines.some((line) => line === t)) {
        el.remove()
      }
    })
  }

  return {
    perFile,
    summaryLines,
    restHtml: container.innerHTML.trim()
  }
}

/** Known schools that have logos. Map canonical name -> logo path under /images/schools/ */
const SCHOOL_LOGOS: Record<string, string> = {
  'Harvard University': '/images/schools/harvard.png',
  'Stanford University': '/images/schools/stanford.png',
  'University of Waterloo': '/images/schools/waterloo.png',
  'University of British Columbia': '/images/schools/ubc.jpg',
  'Princeton University': '/images/schools/princeton.png',
  'New York University': '/images/schools/nyu.png',
  'Columbia University': '/images/schools/columbia.png',
  'Yale University': '/images/schools/yale.png'
}

/** Normalize school string for matching (lowercase, trim). */
function normalizeSchool(s: string): string {
  return s.trim().toLowerCase()
}

/** If the school is one of the known ones, return [canonicalName, logoPath]; else null. */
function getSchoolLogo(school: string): [string, string] | null {
  const normalized = normalizeSchool(school)
  const canonicalEntries = Object.entries(SCHOOL_LOGOS)
  // Exact match first
  for (const [canonicalName, logoPath] of canonicalEntries) {
    if (normalized === normalizeSchool(canonicalName))
      return [canonicalName, logoPath]
  }
  // Then match by distinctive first word (e.g. "Stanford" -> "Stanford University")
  const firstWord = normalized.split(/\s+/)[0] ?? ''
  if (!firstWord) return null
  for (const [canonicalName, logoPath] of canonicalEntries) {
    const canon = normalizeSchool(canonicalName)
    if (canon.startsWith(firstWord) || canon.includes(firstWord))
      return [canonicalName, logoPath]
  }
  return null
}

/** Normalize schoolDate: school first, then date. Returns single string or [school, date] for styled dot. */
function formatSchoolDate(raw: string): string | [string, string] {
  const parts = raw
    .split(/\s*\|\s*/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]
  // Heuristic: date usually looks like "Spring 2024", "Fall 2024", or "2024"
  const dateLike = /^(Spring|Summer|Fall|Winter)\s*\d{4}$|^\d{4}$/i
  const [a, b] = parts
  const aIsDate = dateLike.test(a)
  const bIsDate = dateLike.test(b)
  if (aIsDate && !bIsDate) return [b, a] // e.g. "Spring 2024 | Harvard" → [Harvard, Spring 2024]
  return [a, b]
}

export const CourseHero: React.FC<CourseHeroProps> = ({
  courseCode: courseCodeProp,
  title,
  instructors: instructorsProp,
  instructorName: instructorNameLegacy,
  instructorUrl: instructorUrlLegacy,
  schoolDate,
  descriptionHtml,
  coursePageId,
  courseTitle,
  courseUrl
}) => {
  const descriptionRef = React.useRef<HTMLDivElement>(null)
  const [copyrightReport, setCopyrightReport] =
    React.useState<CopyrightReportData | null>(null)
  const [isCopyrightModalOpen, setIsCopyrightModalOpen] =
    React.useState<boolean>(false)

  // Support both instructors[] and legacy instructorName + instructorUrl
  const instructors: CourseHeroInstructor[] =
    (instructorsProp?.length ?? 0) > 0
      ? instructorsProp!
      : instructorNameLegacy && instructorUrlLegacy
      ? [{ name: instructorNameLegacy, url: instructorUrlLegacy }]
      : []

  React.useLayoutEffect(() => {
    const el = descriptionRef.current
    if (!el) return
    if (el.querySelector(`.${styles.dropCap}`)) return
    wrapFirstLetterInDescription(el)
  }, [descriptionHtml])

  React.useEffect(() => {
    // Toggle content lives in the Notion-rendered DOM (outside of this component),
    // so we scrape it once it appears.
    let cancelled = false
    let observer: MutationObserver | null = null
    let timeout: number | null = null

    const tryExtract = () => {
      if (cancelled) return
      const root =
        (document.querySelector('.course-page') as HTMLElement | null) ??
        document
      const details = findToggleDetailsBySummaryText(
        root,
        COPYRIGHT_TOGGLE_TITLE
      )
      const html = details
        ? extractToggleInnerHtmlBySummaryText(
            details,
            COPYRIGHT_TOGGLE_TITLE
          ) ??
          // Fallback: extract from details directly even if structure differs.
          (() => {
            const wrapper = document.createElement('div')
            for (const child of Array.from(details.childNodes)) {
              if (
                child.nodeType === Node.ELEMENT_NODE &&
                (child as Element).tagName.toLowerCase() === 'summary'
              ) {
                continue
              }
              wrapper.appendChild(child.cloneNode(true))
            }
            const inner = wrapper.innerHTML.trim()
            return inner.length ? inner : null
          })()
        : null

      if (html && details) {
        setCopyrightReport(parseCopyrightReportFromToggleHtml(html))
        // Remove the toggle from the article; we only need it to populate the modal.
        // Use remove() (not display:none) to avoid leaving a visual gap.
        details.remove()
        if (observer) observer.disconnect()
        observer = null
        if (timeout) window.clearTimeout(timeout)
        timeout = null
      }
    }

    tryExtract()

    observer = new MutationObserver(() => {
      // Throttle extraction work a bit in case Notion renders in bursts.
      if (timeout) return
      timeout = window.setTimeout(() => {
        timeout = null
        tryExtract()
      }, 80)
    })

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    })

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsCopyrightModalOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      cancelled = true
      if (observer) observer.disconnect()
      if (timeout) window.clearTimeout(timeout)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  React.useEffect(() => {
    if (!isCopyrightModalOpen) return
    // Prevent background scroll when modal is open.
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isCopyrightModalOpen])

  // Derive course code from content in brackets at end of title, e.g. "Intro to CS (CS 101)" → "CS 101"
  const bracketMatch = title.match(/\(([^)]+)\)\s*$/)
  const derivedCourseCode = bracketMatch
    ? bracketMatch[1].trim()
    : courseCodeProp ?? ''
  const displayTitle = bracketMatch
    ? title.replace(/\s*\([^)]+\)\s*$/, '').trim()
    : title
  const showSaveButton = courseUrl != null && (courseTitle != null || title)

  return (
    <div className={styles.root}>
      <div className={styles.left}>
        <div className={styles.backAndCourseCode}>
          <a
            href='/'
            className={styles.backToHome}
            aria-label='Back to homepage'
          >
            <span className={styles.backArrow} aria-hidden>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='12'
                height='12'
                viewBox='0 0 12 12'
                fill='none'
              >
                <path
                  d='M7.64529 1.90314C7.57602 1.87612 7.50052 1.86927 7.42752 1.88337C7.35452 1.89747 7.28701 1.93195 7.23279 1.98282L3.48279 5.73283C3.41237 5.80392 3.37286 5.89994 3.37286 6.00001C3.37286 6.10008 3.41237 6.1961 3.48279 6.2672L7.23279 10.0172C7.30477 10.086 7.4004 10.1246 7.49997 10.125C7.54974 10.1248 7.59903 10.1153 7.64529 10.0969C7.71354 10.0682 7.77177 10.02 7.81264 9.95822C7.85352 9.89649 7.87521 9.82405 7.87497 9.75001V2.25001C7.87521 2.17598 7.85352 2.10353 7.81264 2.0418C7.77177 1.98007 7.71354 1.93183 7.64529 1.90314Z'
                  fill='black'
                />
              </svg>
            </span>
          </a>
          {derivedCourseCode ? (
            <div className={styles.courseCode}>{derivedCourseCode}</div>
          ) : null}
        </div>
        <h1 className={styles.title}>{displayTitle}</h1>
        {instructors.length > 0 ? (
          <div className={styles.instructor}>
            {instructors.map((inst, i) => (
              <React.Fragment key={i}>
                {i > 0 && ' '}
                <a href={inst.url} className={styles.instructorLink}>
                  {inst.name}
                </a>
              </React.Fragment>
            ))}
          </div>
        ) : null}
        {schoolDate || showSaveButton ? (
          <div className={styles.schoolDateRow}>
            {schoolDate ? (
              <div className={styles.schoolDate}>
                {(() => {
                  const formatted = formatSchoolDate(schoolDate)
                  if (typeof formatted === 'string') return formatted
                  const [school, date] = formatted
                  const schoolLogo = getSchoolLogo(school)
                  const displayName = schoolLogo ? schoolLogo[0] : school
                  const logoPath = schoolLogo ? schoolLogo[1] : null
                  return (
                    <>
                      {logoPath ? (
                        <span className={styles.schoolDateWithLogo}>
                          <img
                            src={logoPath}
                            alt=''
                            className={styles.schoolLogo}
                            width={24}
                            height={24}
                          />
                          <span>{displayName}</span>
                        </span>
                      ) : (
                        displayName
                      )}
                      <span className={styles.schoolDateDot}>•</span>
                      {date}
                    </>
                  )
                })()}
              </div>
            ) : null}
            {showSaveButton ? (
              <div className={styles.saveWrap}>
                <SaveCourseButton
                  courseUrl={courseUrl}
                  courseTitle={courseTitle ?? title}
                  coursePageId={coursePageId}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className={styles.right}>
        <div
          ref={descriptionRef}
          className={styles.description}
          dangerouslySetInnerHTML={{ __html: descriptionHtml }}
        />

        {copyrightReport ? (
          <div className={styles.copyrightCtaRow}>
            <button
              type='button'
              className={styles.copyrightCtaButton}
              onClick={() => setIsCopyrightModalOpen(true)}
            >
              © Copy Right Pipeline
            </button>
          </div>
        ) : null}
      </div>

      {copyrightReport && isCopyrightModalOpen ? (
        <div
          className={styles.copyrightModalOverlay}
          role='presentation'
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsCopyrightModalOpen(false)
          }}
        >
          <div
            className={styles.copyrightModal}
            role='dialog'
            aria-modal='true'
            aria-label='Copyright report'
          >
            <div className={styles.copyrightModalHeader}>
              <div className={styles.copyrightModalTitle}>
                {COPYRIGHT_MODAL_TITLE}
              </div>
              <button
                type='button'
                className={styles.copyrightModalClose}
                onClick={() => setIsCopyrightModalOpen(false)}
                aria-label='Close'
              >
                ×
              </button>
            </div>
            <div className={styles.copyrightModalBody}>
              <p className={styles.copyrightIntro}>
                {COPYRIGHT_MODAL_INTRO_BEFORE}
                <a
                  className={styles.copyrightIntroLink}
                  href={COPYRIGHT_PIPELINE_BLOG_URL}
                  target='_blank'
                  rel='noreferrer'
                >
                  {COPYRIGHT_MODAL_INTRO_LINK_TEXT}
                </a>
                {COPYRIGHT_MODAL_INTRO_AFTER}
              </p>

              {copyrightReport.perFile.length ? (
                <section className={styles.copyrightSection}>
                  <div className={styles.copyrightSectionLabel}>
                    Per-file breakdown:
                  </div>
                  <div className={styles.perFileList}>
                    {copyrightReport.perFile.map((item, idx) => (
                      <div
                        key={`${item.filename}-${idx}`}
                        className={styles.perFileItem}
                      >
                        <div className={styles.perFileFilenameBox}>
                          <span className={styles.perFileIconBox} aria-hidden>
                            <svg
                              xmlns='http://www.w3.org/2000/svg'
                              width='8'
                              height='8'
                              viewBox='0 0 8 8'
                              fill='none'
                              className={styles.perFileIconSvg}
                            >
                              <path
                                d='M6.67812 2.57188L4.92812 0.821879C4.8805 0.775448 4.81651 0.749629 4.75 0.750004H1.75C1.61739 0.750004 1.49021 0.802682 1.39645 0.896451C1.30268 0.990219 1.25 1.1174 1.25 1.25V6.75C1.25 6.88261 1.30268 7.00979 1.39645 7.10356C1.49021 7.19733 1.61739 7.25 1.75 7.25H6.25C6.38261 7.25 6.50979 7.19733 6.60355 7.10356C6.69732 7.00979 6.75 6.88261 6.75 6.75V2.75C6.75037 2.68349 6.72456 2.6195 6.67812 2.57188ZM4.75 2.75V1.375L6.125 2.75H4.75Z'
                                fill='#5D534B'
                              />
                            </svg>
                          </span>
                          <span className={styles.perFileFilename}>
                            {item.filename}
                          </span>
                        </div>
                        {item.stats ? (
                          <div className={styles.perFileStatsRow}>
                            <span className={styles.perFileIconBox} aria-hidden>
                              <svg
                                xmlns='http://www.w3.org/2000/svg'
                                width='8'
                                height='8'
                                viewBox='0 0 8 8'
                                fill='none'
                                className={styles.perFileIconSvg}
                              >
                                <path
                                  d='M6.8625 1.27498C6.82059 1.25497 6.77402 1.24672 6.72779 1.25113C6.68155 1.25553 6.63738 1.27242 6.6 1.29998C5.71562 1.96248 4.96562 1.64373 4.1 1.27186C3.23438 0.899983 2.21563 0.462483 1.1 1.29998C1.06895 1.32327 1.04375 1.35347 1.02639 1.38818C1.00904 1.42289 1 1.46117 1 1.49998V6.74998C1 6.81629 1.02634 6.87988 1.07322 6.92676C1.12011 6.97364 1.1837 6.99998 1.25 6.99998C1.3163 6.99998 1.37989 6.97364 1.42678 6.92676C1.47366 6.87988 1.5 6.81629 1.5 6.74998V5.37811C2.34063 4.81248 3.06563 5.12186 3.9 5.48123C4.40938 5.69686 4.95625 5.93123 5.54375 5.93123C5.975 5.93123 6.42812 5.80623 6.9 5.44998C6.93087 5.42653 6.95594 5.3963 6.97328 5.36162C6.99062 5.32695 6.99976 5.28875 7 5.24998V1.49998C6.99962 1.45354 6.98663 1.40807 6.96241 1.36844C6.93819 1.32881 6.90366 1.29651 6.8625 1.27498ZM4.875 5.32186V3.64998C4.28437 3.48123 3.71563 3.15311 3.125 2.98436V4.65936C2.61563 4.52811 2.075 4.50936 1.5 4.79998V3.14998C2.07187 2.81873 2.60625 2.83748 3.125 2.98436V1.42811C3.38867 1.51493 3.64739 1.61612 3.9 1.73123C4.2125 1.86248 4.5375 2.00311 4.875 2.09061V3.64998C5.39375 3.79686 5.92812 3.81561 6.5 3.48436V5.12186C5.92812 5.50623 5.40938 5.48748 4.875 5.32186Z'
                                  fill='#5D534B'
                                />
                              </svg>
                            </span>
                            <span className={styles.perFileStatsText}>
                              {item.stats}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {copyrightReport.summaryLines.length ? (
                <section className={styles.copyrightSection}>
                  <div className={styles.summaryLines}>
                    {copyrightReport.summaryLines.map((line) => (
                      <div key={line} className={styles.summaryLine}>
                        {line}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {copyrightReport.restHtml ? (
                <section className={styles.copyrightSection}>
                  <div
                    className={styles.copyrightRemainder}
                    dangerouslySetInnerHTML={{
                      __html: copyrightReport.restHtml
                    }}
                  />
                </section>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
