import * as React from 'react'

import { getCachedAuth } from '@/lib/auth-cache'
import { normalizeKnowledgeTopicLabel } from '@/lib/learning-path-knowledge'
import type {
  UndergraduateCourse,
  UndergraduateDegree
} from '@/lib/undergraduate-degrees'
import {
  addMyKnowledgeTopics,
  type UserKnowledgeTopic
} from '@/lib/user-knowledge-topics-db'

import styles from './AddKnowledgeTopicsModal.module.css'

type DegreeLevel = 'undergraduate' | 'graduate'

type Catalog = Record<DegreeLevel, UndergraduateDegree[]>


type SelectedCourse = {
  key: string
  degreeName: string
  courseName: string
  topics: string[]
}

function courseKey(level: DegreeLevel, degreeId: string, course: UndergraduateCourse) {
  return `${level}:${degreeId}:${course.number}:${course.name}`
}

function degreeCourses(degree: UndergraduateDegree): UndergraduateCourse[] {
  return degree.courses.filter((course) => course.topics.length > 0)
}

export function AddKnowledgeTopicsModal({
  open,
  existingLabels,
  onClose,
  onAdded
}: {
  open: boolean
  existingLabels: string[]
  onClose: () => void
  onAdded: (topics: UserKnowledgeTopic[]) => void
}) {
  const [level, setLevel] = React.useState<DegreeLevel>('undergraduate')
  const [degreeQuery, setDegreeQuery] = React.useState('')
  const [courseQuery, setCourseQuery] = React.useState('')
  const [degreeId, setDegreeId] = React.useState<string | null>(null)
  const [selected, setSelected] = React.useState<Map<string, SelectedCourse>>(
    () => new Map()
  )
  const [draft, setDraft] = React.useState('')
  const [namedTopics, setNamedTopics] = React.useState<string[]>([])
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [catalog, setCatalog] = React.useState<Catalog | null>(null)

  React.useEffect(() => {
    if (!open || catalog) return
    let cancelled = false
    void Promise.all([
      import('@/lib/undergraduate-degrees'),
      import('@/lib/graduate-degrees')
    ])
      .then(([undergrad, grad]) => {
        if (cancelled) return
        setCatalog({
          undergraduate: undergrad.undergraduateDegrees,
          graduate: grad.graduateDegrees
        })
      })
      .catch(() => {
        if (!cancelled) setError('Could not load the degree course list.')
      })
    return () => {
      cancelled = true
    }
  }, [open, catalog])

  React.useEffect(() => {
    if (!open) return
    setLevel('undergraduate')
    setDegreeQuery('')
    setCourseQuery('')
    setDegreeId(null)
    setSelected(new Map())
    setDraft('')
    setNamedTopics([])
    setSaving(false)
    setError(null)
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, saving])

  const owned = React.useMemo(
    () => new Set(existingLabels.map((label) => normalizeKnowledgeTopicLabel(label))),
    [existingLabels]
  )

  const degrees = catalog?.[level] ?? []
  const needle = degreeQuery.trim().toLowerCase()
  const matchingDegrees = needle
    ? degrees.filter((degree) =>
        `${degree.name} ${degree.shortName}`.toLowerCase().includes(needle)
      )
    : degrees
  const selectedDegree =
    degrees.find((degree) => degree.id === degreeId) ?? null

  const visibleCourses = React.useMemo(() => {
    if (!selectedDegree) return []
    const courseNeedle = courseQuery.trim().toLowerCase()
    const courses = degreeCourses(selectedDegree)
    if (!courseNeedle) return courses
    return courses.filter((course) =>
      `${course.name} ${course.year} ${course.topics.join(' ')}`
        .toLowerCase()
        .includes(courseNeedle)
    )
  }, [selectedDegree, courseQuery])

  const coursesByYear = React.useMemo(() => {
    const groups = new Map<string, UndergraduateCourse[]>()
    for (const course of visibleCourses) {
      const year = course.year.trim() || 'Courses'
      const list = groups.get(year) ?? []
      list.push(course)
      groups.set(year, list)
    }
    return [...groups.entries()]
  }, [visibleCourses])

  function isNewLabel(label: string) {
    const key = normalizeKnowledgeTopicLabel(label)
    return Boolean(key) && !owned.has(key)
  }

  const pendingLabels = React.useMemo(() => {
    const seen = new Set<string>()
    const labels: string[] = []
    const push = (label: string) => {
      const key = normalizeKnowledgeTopicLabel(label)
      if (!key || owned.has(key) || seen.has(key)) return
      seen.add(key)
      labels.push(label.trim())
    }
    for (const label of namedTopics) push(label)
    for (const course of selected.values()) {
      for (const topic of course.topics) push(topic)
    }
    return labels
  }, [namedTopics, selected, owned])

  function addNamedTopic() {
    const label = draft.trim()
    if (!label) return
    setNamedTopics((current) => {
      const key = normalizeKnowledgeTopicLabel(label)
      if (
        current.some((item) => normalizeKnowledgeTopicLabel(item) === key)
      ) {
        return current
      }
      return [...current, label]
    })
    setDraft('')
    setError(null)
  }

  function toggleCourse(course: UndergraduateCourse) {
    if (!selectedDegree) return
    const key = courseKey(level, selectedDegree.id, course)
    setSelected((current) => {
      const next = new Map(current)
      if (next.has(key)) next.delete(key)
      else {
        next.set(key, {
          key,
          degreeName: selectedDegree.name,
          courseName: course.name,
          topics: course.topics
        })
      }
      return next
    })
    setError(null)
  }

  async function save() {
    if (pendingLabels.length === 0 || saving) return
    if (!getCachedAuth().user?.id) {
      setError('Sign in to add topics.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const named = namedTopics.filter(isNewLabel)
      let latest: UserKnowledgeTopic[] = []
      if (named.length > 0) {
        latest = await addMyKnowledgeTopics(named, {
          pathTitle: 'Added by you'
        })
      }
      for (const course of selected.values()) {
        const labels = course.topics.filter(isNewLabel)
        if (labels.length === 0) continue
        latest = await addMyKnowledgeTopics(labels, {
          pathTitle: `${course.degreeName}: ${course.courseName}`
        })
      }
      if (latest.length === 0) {
        setError('Sign in to add topics.')
        setSaving(false)
        return
      }
      onAdded(latest)
    } catch {
      setError('Could not add those topics. Try again.')
      setSaving(false)
    }
  }

  if (!open) return null

  const levelToggle = (
    <div className={styles.levelToggle} role='group' aria-label='Degree level'>
      <button
        type='button'
        className={
          level === 'undergraduate' ? styles.levelBtnActive : styles.levelBtn
        }
        aria-pressed={level === 'undergraduate'}
        onClick={() => {
          setLevel('undergraduate')
          setDegreeId(null)
          setCourseQuery('')
        }}
      >
        Undergraduate
      </button>
      <button
        type='button'
        className={
          level === 'graduate' ? styles.levelBtnActive : styles.levelBtn
        }
        aria-pressed={level === 'graduate'}
        onClick={() => {
          setLevel('graduate')
          setDegreeId(null)
          setCourseQuery('')
        }}
      >
        Graduate
      </button>
    </div>
  )

  return (
    <div
      className={styles.backdrop}
      role='presentation'
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose()
      }}
    >
      <div
        className={styles.modal}
        role='dialog'
        aria-modal='true'
        aria-labelledby='add-topics-title'
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id='add-topics-title' className={styles.title}>
            Add topics
          </h2>
          <button
            type='button'
            className={styles.close}
            onClick={onClose}
            disabled={saving}
            aria-label='Close'
          >
            ×
          </button>
        </div>

        <div className={styles.body}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Name a topic</h3>
            <form
              className={styles.nameRow}
              onSubmit={(event) => {
                event.preventDefault()
                addNamedTopic()
              }}
            >
              <input
                className={styles.input}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder='Topic name'
                aria-label='Topic name'
                autoFocus
              />
              <button
                type='submit'
                className={styles.secondaryBtn}
                disabled={!draft.trim()}
              >
                Add
              </button>
            </form>
            {namedTopics.length > 0 ? (
              <ul className={styles.chips}>
                {namedTopics.map((label) => (
                  <li key={normalizeKnowledgeTopicLabel(label)} className={styles.chip}>
                    <span>{label}</span>
                    <button
                      type='button'
                      className={styles.chipRemove}
                      aria-label={`Remove ${label}`}
                      onClick={() =>
                        setNamedTopics((current) =>
                          current.filter((item) => item !== label)
                        )
                      }
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              Courses you&apos;ve taken
            </h3>
            <p className={styles.help}>
              Choose a degree, then the courses you studied outside
              Coursetexts. Each course adds the topics from that course.
            </p>

            {!catalog ? (
              <p className={styles.empty}>Loading degrees…</p>
            ) : selectedDegree ? (
              <>
                <p className={styles.degreeName}>{selectedDegree.name}</p>
                <input
                  className={styles.input}
                  value={courseQuery}
                  onChange={(event) => setCourseQuery(event.target.value)}
                  placeholder='Search courses'
                  aria-label='Search courses'
                />
                <div className={styles.searchTools}>
                  <button
                    type='button'
                    className={styles.backLink}
                    onClick={() => {
                      setDegreeId(null)
                      setCourseQuery('')
                    }}
                  >
                    ← Degrees
                  </button>
                  {levelToggle}
                </div>
                <div className={styles.courseList}>
                  {coursesByYear.length === 0 ? (
                    <p className={styles.empty}>No matching courses.</p>
                  ) : (
                    coursesByYear.map(([year, courses]) => (
                      <div key={year} className={styles.yearGroup}>
                        <p className={styles.yearLabel}>{year}</p>
                        <ul className={styles.courses}>
                          {courses.map((course) => {
                            const key = courseKey(
                              level,
                              selectedDegree.id,
                              course
                            )
                            const checked = selected.has(key)
                            return (
                              <li key={key}>
                                <label className={styles.courseRow}>
                                  <input
                                    type='checkbox'
                                    checked={checked}
                                    onChange={() => toggleCourse(course)}
                                  />
                                  <span className={styles.courseCopy}>
                                    <span className={styles.courseName}>
                                      {course.name}
                                    </span>
                                    <span className={styles.courseMeta}>
                                      {course.topics.length}{' '}
                                      {course.topics.length === 1
                                        ? 'topic'
                                        : 'topics'}
                                    </span>
                                  </span>
                                </label>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <>
                <input
                  className={styles.input}
                  value={degreeQuery}
                  onChange={(event) => setDegreeQuery(event.target.value)}
                  placeholder='Search degrees, such as Computer Science'
                  aria-label='Search degrees'
                />
                <div className={styles.searchTools}>
                  <span />
                  {levelToggle}
                </div>
                <ul className={styles.degreeList}>
                  {matchingDegrees.slice(0, 12).map((degree) => (
                    <li key={degree.id}>
                      <button
                        type='button'
                        className={styles.degreeBtn}
                        onClick={() => {
                          setDegreeId(degree.id)
                          setCourseQuery('')
                        }}
                      >
                        <span>{degree.name}</span>
                        <span className={styles.courseMeta}>
                          {degreeCourses(degree).length} courses
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                {matchingDegrees.length === 0 ? (
                  <p className={styles.empty}>No matching degrees.</p>
                ) : matchingDegrees.length > 12 ? (
                  <p className={styles.empty}>
                    {matchingDegrees.length - 12} more. Keep typing to narrow
                    the list.
                  </p>
                ) : null}
              </>
            )}
          </section>

          {pendingLabels.length > 0 ? (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>
                {pendingLabels.length}{' '}
                {pendingLabels.length === 1 ? 'topic' : 'topics'} to add
              </h3>
              <ul className={styles.preview}>
                {pendingLabels.map((label) => (
                  <li key={normalizeKnowledgeTopicLabel(label)}>{label}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {error ? (
            <p className={styles.error} role='alert'>
              {error}
            </p>
          ) : null}
        </div>

        <div className={styles.footer}>
          <button
            type='button'
            className={styles.textBtn}
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type='button'
            className={styles.primaryBtn}
            onClick={() => void save()}
            disabled={saving || pendingLabels.length === 0}
          >
            {saving
              ? 'Adding…'
              : pendingLabels.length === 0
                ? 'Add topics'
                : `Add ${pendingLabels.length} ${
                    pendingLabels.length === 1 ? 'topic' : 'topics'
                  }`}
          </button>
        </div>
      </div>
    </div>
  )
}
