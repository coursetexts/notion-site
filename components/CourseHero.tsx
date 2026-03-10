import React from 'react'
import { SaveCourseButton } from './SaveCourseButton'
import styles from './CourseHero.module.css'

export interface CourseHeroData {
  courseCode?: string
  title: string
  instructorName: string
  instructorUrl: string
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

/** Known schools that have logos. Map canonical name -> logo path under /images/schools/ */
const SCHOOL_LOGOS: Record<string, string> = {
  'Harvard University': '/images/schools/harvard.png',
  'Stanford University': '/images/schools/stanford.png',
  'University of Waterloo': '/images/schools/waterloo.png',
  'University of British Columbia': '/images/schools/ubc.jpg',
  'Princeton University': '/images/schools/princeton.png',
  'New York University': '/images/schools/nyu.png',
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
    if (normalized === normalizeSchool(canonicalName)) return [canonicalName, logoPath]
  }
  // Then match by distinctive first word (e.g. "Stanford" -> "Stanford University")
  const firstWord = normalized.split(/\s+/)[0] ?? ''
  if (!firstWord) return null
  for (const [canonicalName, logoPath] of canonicalEntries) {
    const canon = normalizeSchool(canonicalName)
    if (canon.startsWith(firstWord) || canon.includes(firstWord)) return [canonicalName, logoPath]
  }
  return null
}

/** Normalize schoolDate: school first, then date. Returns single string or [school, date] for styled dot. */
function formatSchoolDate(raw: string): string | [string, string] {
  const parts = raw.split(/\s*\|\s*/).map((p) => p.trim()).filter(Boolean)
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
  instructorName,
  instructorUrl,
  schoolDate,
  descriptionHtml,
  coursePageId,
  courseTitle,
  courseUrl
}) => {
  const descriptionRef = React.useRef<HTMLDivElement>(null)

  React.useLayoutEffect(() => {
    const el = descriptionRef.current
    if (!el) return
    if (el.querySelector(`.${styles.dropCap}`)) return
    wrapFirstLetterInDescription(el)
  }, [descriptionHtml])

  // Derive course code from content in brackets at end of title, e.g. "Intro to CS (CS 101)" → "CS 101"
  const bracketMatch = title.match(/\(([^)]+)\)\s*$/)
  const derivedCourseCode = bracketMatch ? bracketMatch[1].trim() : (courseCodeProp ?? '')
  const displayTitle = bracketMatch ? title.replace(/\s*\([^)]+\)\s*$/, '').trim() : title
  const showSaveButton = courseUrl != null && (courseTitle != null || title)

  return (
    <div className={styles.root}>
      <div className={styles.left}>
        {derivedCourseCode ? (
          <div className={styles.courseCode}>{derivedCourseCode}</div>
        ) : null}
        <h1 className={styles.title}>{displayTitle}</h1>
        <div className={styles.instructor}>
          <a href={instructorUrl} className={styles.instructorLink}>
            {instructorName}
          </a>
        </div>
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
                        alt=""
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
      </div>
      <div className={styles.right}>
        <div
          ref={descriptionRef}
          className={styles.description}
          dangerouslySetInnerHTML={{ __html: descriptionHtml }}
        />
        {showSaveButton && (
          <div className={styles.saveWrap}>
            <SaveCourseButton
              courseUrl={courseUrl}
              courseTitle={courseTitle ?? title}
              coursePageId={coursePageId}
            />
          </div>
        )}
      </div>
    </div>
  )
}
