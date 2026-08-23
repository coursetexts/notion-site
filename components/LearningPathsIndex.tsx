import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

import {
  type LearningPathData,
  type StoredLearningPath,
  SEEDED_LEARNING_PATHS,
  emptyLearningPath,
  readStoredLearningPaths,
  writeStoredLearningPaths
} from '@/lib/learning-path-seed'
import {
  ensureUniqueSlug,
  slugifyLearningPathName
} from '@/lib/learning-path-slug'
import { TRENDING_CONCEPTS } from '@/lib/trending-concepts-seed'

import styles from './LearningPathsIndex.module.css'

function conceptStats(path: LearningPathData) {
  const concepts = path.nodes.filter((node) => node.kind !== 'goal')
  const explored = concepts.filter((node) => node.status === 'explored').length
  return { total: concepts.length, explored }
}

function trendingCircles(paths: LearningPathData[]) {
  return [...paths]
    .filter((path) => path.circle.members.length > 0)
    .sort((a, b) => b.circle.members.length - a.circle.members.length)
}

function storedToPath(item: StoredLearningPath): LearningPathData {
  const seeded = SEEDED_LEARNING_PATHS.find((path) => path.slug === item.slug)
  return seeded ?? emptyLearningPath(item.goal, item.slug)
}

function formatCount(n: number) {
  return n.toLocaleString('en-US')
}

function PlusIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='14'
      height='14'
      viewBox='0 0 14 14'
      fill='none'
      aria-hidden
    >
      <path
        d='M7 2.5V11.5M2.5 7H11.5'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
      />
    </svg>
  )
}

export function LearningPathsIndex() {
  const router = useRouter()
  const [customPaths, setCustomPaths] = React.useState<StoredLearningPath[]>(
    []
  )
  const [createOpen, setCreateOpen] = React.useState(false)
  const [draft, setDraft] = React.useState('')

  React.useEffect(() => {
    setCustomPaths(readStoredLearningPaths())
  }, [])

  const seededSlugs = React.useMemo(
    () => new Set(SEEDED_LEARNING_PATHS.map((path) => path.slug)),
    []
  )
  const customOnly = customPaths.filter(
    (item) => !seededSlugs.has(item.slug)
  )
  const paths = [
    ...customOnly.map(storedToPath),
    ...SEEDED_LEARNING_PATHS
  ]
  const circles = trendingCircles(SEEDED_LEARNING_PATHS)

  function closeCreate() {
    setCreateOpen(false)
    setDraft('')
  }

  function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    const goal = draft.trim()
    if (!goal) return
    const existing = [
      ...SEEDED_LEARNING_PATHS.map((path) => path.slug),
      ...readStoredLearningPaths().map((item) => item.slug)
    ]
    const slug = ensureUniqueSlug(slugifyLearningPathName(goal), existing)
    const item: StoredLearningPath = {
      id: `path-${Date.now()}`,
      goal,
      slug
    }
    const next = [
      item,
      ...readStoredLearningPaths().filter((row) => row.slug !== slug)
    ]
    writeStoredLearningPaths(next)
    setCustomPaths(next)
    closeCreate()
    void router.push(`/learning-path/${slug}`)
  }

  return (
    <section className={styles.section} aria-label='Learning paths'>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Learning paths</h1>
            <button
              type='button'
              className={styles.startBtn}
              onClick={() => setCreateOpen(true)}
            >
              <PlusIcon />
              Start a learning path
            </button>
          </div>
          <p className={styles.lede}>
            Start from a goal. Work backward into what you need, how deep to
            go, and who is already on the way. Leave traces so the next person
            does not start from nowhere.
          </p>
        </header>

        <div className={styles.columns}>
          <div>
            <div className={styles.bar}>
              <span>
                <span className={styles.barLabel}>All learning paths</span>
                <span className={styles.barCount}>({paths.length})</span>
              </span>
              <span className={styles.barHint}>
                What people are trying to do
              </span>
            </div>
            <ul className={styles.list}>
              {paths.map((path) => {
                const stats = conceptStats(path)
                const yours = customOnly.some((item) => item.slug === path.slug)
                return (
                  <li key={path.slug} className={styles.item}>
                    <p className={styles.kicker}>
                      {yours ? 'Your path' : 'Community path'}
                    </p>
                    <h2 className={styles.itemTitle}>
                      <Link
                        href={`/learning-path/${path.slug}`}
                        className={styles.titleLink}
                      >
                        {path.title}
                      </Link>
                    </h2>
                    <p className={styles.copy}>{path.goal}</p>
                    <p className={styles.meta}>
                      {stats.total === 0
                        ? 'Just started'
                        : `${stats.explored} of ${stats.total} concepts explored`}
                      <span aria-hidden> · </span>
                      {path.circle.members.length > 0
                        ? `${path.circle.members.length} in the circle`
                        : 'No circle yet'}
                    </p>
                  </li>
                )
              })}
            </ul>
          </div>

          <div>
            <div className={styles.bar}>
              <span>
                <span className={styles.barLabel}>Communities</span>
                <span className={styles.barCount}>({circles.length})</span>
              </span>
              <span className={styles.barHint}>Who people are joining</span>
            </div>
            <ul className={styles.list}>
              {circles.map((path, index) => (
                <li key={path.slug} className={styles.item}>
                  <p className={styles.kicker}>Joining · {index + 1}</p>
                  <h2 className={styles.itemTitle}>
                    <Link
                      href={`/learning-path/${path.slug}`}
                      className={styles.titleLink}
                    >
                      {path.circle.name}
                    </Link>
                  </h2>
                  <p className={styles.copy}>{path.circle.description}</p>
                  <div className={styles.circleMeta}>
                    <div className={styles.avatars} aria-hidden>
                      {path.circle.members.slice(0, 3).map((member) => (
                        <span key={member.initials} className={styles.avatar}>
                          {member.initials}
                        </span>
                      ))}
                      {path.circle.members.length > 3 ? (
                        <span className={styles.avatarMore}>
                          +{path.circle.members.length - 3}
                        </span>
                      ) : null}
                    </div>
                    <p className={styles.meta}>
                      {path.circle.members.length} learning together
                      <span aria-hidden> · </span>
                      On {path.title}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.concepts}>
          <div className={styles.bar}>
            <span>
              <span className={styles.barLabel}>Concepts</span>
              <span className={styles.barCount}>
                ({TRENDING_CONCEPTS.length})
              </span>
            </span>
            <span className={styles.barHint}>Trending now</span>
          </div>
          <p className={styles.conceptsLede}>
            A concept is an atomic unit a learning path can contain — one idea,
            only as deep as the goal requires. Attach resources and your notes
            to a concept, detail which part of the resource helped the concept
            click.
          </p>
          <ul className={styles.conceptGrid}>
            {TRENDING_CONCEPTS.map((concept, index) => (
              <li key={concept.id} className={styles.item}>
                <p className={styles.kicker}>
                  Trending · {index + 1}
                </p>
                <h2 className={styles.itemTitle}>
                  <Link
                    href={`/learning-path/${concept.pathSlug}`}
                    className={styles.titleLink}
                  >
                    {concept.label}
                  </Link>
                </h2>
                <p className={styles.copy}>{concept.blurb}</p>
                <p className={styles.meta}>
                  On {formatCount(concept.onPaths)} paths
                  <span aria-hidden> · </span>
                  {formatCount(concept.exploring)} exploring
                  <span aria-hidden> · </span>
                  In {concept.pathTitle}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.invite}>
          <p className={styles.inviteCopy}>
            Have a goal of your own? Map the concepts you need, how deep to go,
            and leave traces for whoever comes next.
          </p>
          <button
            type='button'
            className={styles.inviteBtn}
            onClick={() => setCreateOpen(true)}
          >
            Create your own learning path
          </button>
        </div>
      </div>

      {createOpen ? (
        <div
          className={styles.backdrop}
          role='presentation'
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeCreate()
          }}
        >
          <div
            className={styles.modal}
            role='dialog'
            aria-modal='true'
            aria-labelledby='create-path-title'
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 id='create-path-title' className={styles.modalTitle}>
                What do you want to learn?
              </h2>
              <button
                type='button'
                className={styles.modalClose}
                onClick={closeCreate}
                aria-label='Close'
              >
                ×
              </button>
            </div>
            <form className={styles.modalForm} onSubmit={handleCreate}>
              <label className={styles.field}>
                <span className={styles.label}>Your goal</span>
                <textarea
                  className={styles.textarea}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder='I want to…'
                  rows={4}
                  autoFocus
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') closeCreate()
                  }}
                />
              </label>
              <p className={styles.hint}>
                The path starts from the intention. Work backward into the
                knowledge that would make you capable of it.
              </p>
              <div className={styles.modalActions}>
                <button
                  type='button'
                  className={styles.cancelBtn}
                  onClick={closeCreate}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className={styles.submitBtn}
                  disabled={!draft.trim()}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}
