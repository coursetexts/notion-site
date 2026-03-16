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
          <a href="/" className={styles.backToHome} aria-label="Back to homepage">
            <span className={styles.backArrow} aria-hidden>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M7.64529 1.90314C7.57602 1.87612 7.50052 1.86927 7.42752 1.88337C7.35452 1.89747 7.28701 1.93195 7.23279 1.98282L3.48279 5.73283C3.41237 5.80392 3.37286 5.89994 3.37286 6.00001C3.37286 6.10008 3.41237 6.1961 3.48279 6.2672L7.23279 10.0172C7.30477 10.086 7.4004 10.1246 7.49997 10.125C7.54974 10.1248 7.59903 10.1153 7.64529 10.0969C7.71354 10.0682 7.77177 10.02 7.81264 9.95822C7.85352 9.89649 7.87521 9.82405 7.87497 9.75001V2.25001C7.87521 2.17598 7.85352 2.10353 7.81264 2.0418C7.77177 1.98007 7.71354 1.93183 7.64529 1.90314Z" fill="black"/>
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
        {(schoolDate || showSaveButton) ? (
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
        <div className={styles.descriptionWrap}>
          <div className={styles.descriptionScroll}>
            <div
              ref={descriptionRef}
              className={styles.description}
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
          </div>
          <div className={styles.descriptionFade} aria-hidden />
        </div>
      </div>
    </div>
  )
}
