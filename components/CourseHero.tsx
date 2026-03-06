import React from 'react'
import styles from './CourseHero.module.css'

export interface CourseHeroData {
  courseCode?: string
  title: string
  instructorName: string
  instructorUrl: string
  schoolDate?: string
  descriptionHtml: string
}

interface CourseHeroProps extends CourseHeroData {}

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

export const CourseHero: React.FC<CourseHeroProps> = ({
  courseCode: courseCodeProp,
  title,
  instructorName,
  instructorUrl,
  schoolDate,
  descriptionHtml
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
          <div className={styles.schoolDate}>{schoolDate}</div>
        ) : null}
      </div>
      <div
        ref={descriptionRef}
        className={styles.description}
        dangerouslySetInnerHTML={{ __html: descriptionHtml }}
      />
    </div>
  )
}
