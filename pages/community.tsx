import * as React from 'react'
import Head from 'next/head'

import { createPortal } from 'react-dom'

import { CommunityComments } from '@/components/CommunityComments'
import { VoteRow } from '@/components/CourseActivity'
import { HomeFooterSection } from '@/components/HomeFooterSection'
import { HomeHeader } from '@/components/HomeHeader'
import {
  type CommunityPageResource,
  RESOURCE_TYPES,
  type ResourceDbType,
  addCommunityPageResource,
  getCommunityPageResources,
  setResourceVote
} from '@/lib/community-comments-db'

import { useAuthOptional } from '../contexts/AuthContext'
import styles from './community.module.css'

type ResourceType = ResourceDbType

/** Display labels for the resources.type enum. */
const TYPE_LABELS: Record<ResourceType, string> = {
  textbook: 'Textbook',
  video: 'Video',
  paper: 'Paper',
  slides: 'Slides',
  problem_set: 'Problem set'
}

interface CommunityResource {
  id: string
  type: ResourceType | null
  title: string
  description: string
  url: string
  author: string
  score: number
  userVote: 1 | -1 | null
  /** True when the row exists in Supabase (comments/votes persist). */
  dbBacked?: boolean
  commentCount?: number
}

function dbToFeedItem(r: CommunityPageResource): CommunityResource {
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    description: r.description ?? '',
    url: r.url,
    author: r.author_name ?? 'Anonymous',
    score: r.score,
    userVote: r.user_vote,
    dbBacked: true,
    commentCount: r.comment_count
  }
}

const MOCK_RESOURCES: CommunityResource[] = [
  {
    id: 'r1',
    type: 'paper',
    title: 'The Feynman Technique for Learning Anything',
    description:
      'A simple four-step method for understanding hard ideas: pick a concept, explain it plainly, find the gaps, and refine. Great for self-study.',
    url: 'https://fs.blog/feynman-technique/',
    author: 'Maya Chen',
    score: 142,
    userVote: 1
  },
  {
    id: 'r2',
    type: 'video',
    title: 'MIT 6.006 — Introduction to Algorithms (Full Course)',
    description:
      'The complete lecture series covering data structures, sorting, graph algorithms, and dynamic programming. Pairs well with the assigned problem sets.',
    url: 'https://www.youtube.com/watch?v=ZA-tUyM_y7s',
    author: 'Devran Patel',
    score: 98,
    userVote: null
  },
  {
    id: 'r3',
    type: 'slides',
    title: 'Excalidraw — virtual whiteboard for sketching diagrams',
    description:
      'A hand-drawn-feel diagramming tool that is perfect for mapping out proofs, system designs, and concept relationships while you study.',
    url: 'https://excalidraw.com/',
    author: 'Lena Hofmann',
    score: 76,
    userVote: null
  },
  {
    id: 'r4',
    type: 'paper',
    title: 'Attention Is All You Need',
    description:
      'The foundational transformer paper. Dense but worth annotating section by section — start with the architecture diagram and work outward.',
    url: 'https://arxiv.org/abs/1706.03762',
    author: 'Sofia Rossi',
    score: 64,
    userVote: -1
  },
  {
    id: 'r5',
    type: 'textbook',
    title: 'How to Read a Mathematics Textbook',
    description:
      'Reading math is not reading prose. This guide covers active reading, working examples by hand, and why you should never skip the exercises.',
    url: 'https://example.substack.com/p/how-to-read-math',
    author: 'Theo Albrecht',
    score: 51,
    userVote: null
  },
  {
    id: 'r6',
    type: 'video',
    title: 'CS50: Introduction to Computer Science',
    description:
      "Harvard's flagship intro course. A friendly on-ramp to programming, memory, and algorithms — fully free with graded assignments.",
    url: 'https://cs50.harvard.edu/x/',
    author: 'Imani Walker',
    score: 39,
    userVote: null
  },
  {
    id: 'r7',
    type: 'problem_set',
    title: 'Anki — powerful, intelligent flashcards',
    description:
      'Spaced-repetition flashcards that schedule reviews right before you would forget. Indispensable for memory-heavy subjects.',
    url: 'https://apps.ankiweb.net/',
    author: 'Noah Bergström',
    score: 28,
    userVote: null
  }
]

const TYPE_FILTERS: Array<'All' | ResourceType> = ['All', ...RESOURCE_TYPES]

function pluralTypeLabel(t: ResourceType): string {
  return t === 'slides' ? TYPE_LABELS[t] : `${TYPE_LABELS[t]}s`
}

function hostFromUrl(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return url
  }
}

const SearchIcon: React.FC = () => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    width='16'
    height='16'
    viewBox='0 0 16 16'
    fill='none'
    aria-hidden
  >
    <circle cx='7' cy='7' r='4.5' stroke='#6b7280' strokeWidth='1.3' />
    <path
      d='M10.5 10.5L14 14'
      stroke='#6b7280'
      strokeWidth='1.3'
      strokeLinecap='round'
    />
  </svg>
)

const PlusIcon: React.FC = () => (
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

const ExternalIcon: React.FC = () => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    width='12'
    height='12'
    viewBox='0 0 12 12'
    fill='none'
    aria-hidden
  >
    <path
      d='M3 9L9 3'
      stroke='currentColor'
      strokeWidth='1'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M4.125 3H9V7.875'
      stroke='currentColor'
      strokeWidth='1'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
)

type ModalKind = 'resource' | 'knowledge' | null

interface ModalProps {
  title: string
  children: React.ReactNode
  onClose: () => void
}

const Modal: React.FC<ModalProps> = ({ title, children, onClose }) => {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className={styles.modalBackdrop}
      role='dialog'
      aria-modal='true'
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={styles.modal}>
        <h2 className={styles.modalTitle}>{title}</h2>
        {children}
      </div>
    </div>,
    document.body
  )
}

export default function CommunityPage() {
  const auth = useAuthOptional()
  const signedIn = Boolean(auth?.user)
  const [resources, setResources] =
    React.useState<CommunityResource[]>(MOCK_RESOURCES)
  const [openThreads, setOpenThreads] = React.useState<Record<string, boolean>>(
    {}
  )
  const [query, setQuery] = React.useState('')
  const [typeFilter, setTypeFilter] = React.useState<'All' | ResourceType>(
    'All'
  )
  const [sort, setSort] = React.useState<'top' | 'new'>('top')
  const [modal, setModal] = React.useState<ModalKind>(null)

  // Submit-a-resource form state
  const [resTitle, setResTitle] = React.useState('')
  const [resDesc, setResDesc] = React.useState('')
  const [resLink, setResLink] = React.useState('')
  const [resType, setResType] = React.useState<ResourceType>('textbook')

  // Add-a-knowledge-component form state (placeholder flow)
  const [kcName, setKcName] = React.useState('')
  const [kcSummary, setKcSummary] = React.useState('')

  // Live resources from Supabase replace the mocks when any exist.
  // Re-fetched when auth settles so user_vote reflects the session.
  React.useEffect(() => {
    let alive = true
    getCommunityPageResources().then((rows) => {
      if (!alive || rows.length === 0) return
      setResources(rows.map(dbToFeedItem))
    })
    return () => {
      alive = false
    }
  }, [auth?.user?.id])

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    let list = resources
    if (typeFilter !== 'All') {
      list = list.filter((r) => r.type === typeFilter)
    }
    if (needle) {
      list = list.filter((r) =>
        `${r.title} ${r.description} ${r.type} ${r.author}`
          .toLowerCase()
          .includes(needle)
      )
    }
    // 'new' keeps insertion order (submissions are prepended); 'top' by score.
    if (sort === 'top') {
      list = [...list].sort((a, b) => b.score - a.score)
    }
    return list
  }, [resources, query, typeFilter, sort])

  const handleVote = (item: CommunityResource, value: 1 | -1 | null) => {
    // Optimistic update either way; persist for db-backed rows.
    setResources((prev) =>
      prev.map((r) => {
        if (r.id !== item.id) return r
        const prevVote = r.userVote ?? 0
        const nextVote = value ?? 0
        return { ...r, score: r.score - prevVote + nextVote, userVote: value }
      })
    )
    if (item.dbBacked && signedIn) {
      setResourceVote(item.id, value).then((score) => {
        if (score === null) return
        setResources((prev) =>
          prev.map((r) => (r.id === item.id ? { ...r, score } : r))
        )
      })
    }
  }

  const setCommentCount = (id: string, count: number) => {
    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, commentCount: count } : r))
    )
  }

  const closeModal = () => setModal(null)

  const submitResource = async () => {
    const title = resTitle.trim()
    const description = resDesc.trim()
    if (!title || !description) return
    const link = resLink.trim()

    let item: CommunityResource | null = null
    if (signedIn) {
      const created = await addCommunityPageResource({
        title,
        description,
        url: link || 'https://coursetexts.org',
        type: resType
      })
      if (created) item = dbToFeedItem(created)
    }
    if (!item) {
      // Signed out (or Supabase unavailable): keep it local to the session.
      item = {
        id: `new-${resources.length + 1}-${title.slice(0, 8)}`,
        type: resType,
        title,
        description,
        url: link || 'https://coursetexts.org',
        author: 'You',
        score: 1,
        userVote: 1
      }
    }
    setResources((prev) => [item as CommunityResource, ...prev])
    setResTitle('')
    setResDesc('')
    setResLink('')
    setResType('textbook')
    closeModal()
  }

  return (
    <>
      <Head>
        <title>Community · Coursetexts</title>
        <meta
          name='description'
          content='Resources and knowledge components shared by the Coursetexts community.'
        />
      </Head>

      <main
        style={
          {
            '--home-side': 'clamp(20px, 4.03vw, 58px)',
            '--home-main-max': '1324px',
            '--home-content-max': '1000px',
            '--home-footer-side': 'max(28px, 15.28vw)',
            minHeight: '100vh',
            background: 'var(--footer, #F8F7F4)',
            display: 'flex',
            flexDirection: 'column'
          } as React.CSSProperties
        }
      >
        <HomeHeader />

        <section className={styles.section} aria-label='Community'>
          <div className={styles.container}>
            <header className={styles.header}>
              <div className={styles.titleRow}>
                <h1 className={styles.title}>Community</h1>
                <button
                  type='button'
                  className={styles.shareBtn}
                  onClick={() => setModal('resource')}
                >
                  <PlusIcon />
                  Share a resource
                </button>
              </div>
              <p className={styles.subtitle}>
                Articles, lectures, tools, and papers that helped other
                learners. Upvote what helps you.
              </p>
            </header>

            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>
                <SearchIcon />
              </span>
              <input
                type='search'
                className={styles.searchInput}
                placeholder='Search by title, topic, or author…'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label='Search resources'
              />
            </div>

            <div className={styles.filterBar}>
              <div
                className={styles.chipRow}
                role='group'
                aria-label='Filter by type'
              >
                {TYPE_FILTERS.map((t) => (
                  <button
                    key={t}
                    type='button'
                    className={
                      typeFilter === t
                        ? `${styles.chip} ${styles.chipSelected}`
                        : styles.chip
                    }
                    aria-pressed={typeFilter === t}
                    onClick={() => setTypeFilter(t)}
                  >
                    {t === 'All' ? 'All' : pluralTypeLabel(t)}
                  </button>
                ))}
              </div>
              <div className={styles.sortRow}>
                <span className={styles.sortLabel}>Sort by</span>
                <button
                  type='button'
                  className={
                    sort === 'top'
                      ? `${styles.sortBtn} ${styles.sortBtnActive}`
                      : styles.sortBtn
                  }
                  aria-pressed={sort === 'top'}
                  onClick={() => setSort('top')}
                >
                  Top
                </button>
                <button
                  type='button'
                  className={
                    sort === 'new'
                      ? `${styles.sortBtn} ${styles.sortBtnActive}`
                      : styles.sortBtn
                  }
                  aria-pressed={sort === 'new'}
                  onClick={() => setSort('new')}
                >
                  New
                </button>
              </div>
            </div>

            <div className={styles.feedBar}>
              <span>
                <span className={styles.feedHeadingLabel}>Resources</span>
                <span className={styles.feedHeadingCount}>
                  ({filtered.length})
                </span>
              </span>
              <button
                type='button'
                className={styles.quietLink}
                onClick={() => setModal('knowledge')}
              >
                Add a knowledge component
              </button>
            </div>

            {filtered.length === 0 ? (
              <div className={styles.empty}>
                <p className={styles.emptyText}>
                  {resources.length === 0
                    ? 'Nothing here yet.'
                    : query.trim()
                    ? `No resources match “${query.trim()}”.`
                    : typeFilter === 'All'
                    ? 'No resources shared yet.'
                    : `No ${pluralTypeLabel(
                        typeFilter
                      ).toLowerCase()} shared yet.`}
                </p>
                {query.trim() || typeFilter !== 'All' ? (
                  <button
                    type='button'
                    className={styles.quietLink}
                    onClick={() => {
                      setQuery('')
                      setTypeFilter('All')
                    }}
                  >
                    Clear search and filters
                  </button>
                ) : (
                  <button
                    type='button'
                    className={styles.quietLink}
                    onClick={() => setModal('resource')}
                  >
                    Be the first to share a resource
                  </button>
                )}
              </div>
            ) : (
              <div className={styles.feed}>
                {filtered.map((r) => (
                  <article
                    key={r.id}
                    className={styles.row}
                    data-testid='resource-row'
                  >
                    <div className={styles.rowMeta}>
                      {r.type && (
                        <>
                          <span className={styles.typeTag}>
                            {TYPE_LABELS[r.type]}
                          </span>
                          <span className={styles.metaDot} aria-hidden>
                            ·
                          </span>
                        </>
                      )}
                      <a
                        href={r.url}
                        className={styles.host}
                        target='_blank'
                        rel='noopener noreferrer'
                        title={r.url}
                      >
                        {hostFromUrl(r.url)}
                        <ExternalIcon />
                      </a>
                      <span className={styles.rowMetaRight}>
                        <span className={styles.author}>by {r.author}</span>
                        <span data-testid='resource-vote'>
                          <VoteRow
                            score={r.score}
                            userVote={r.userVote}
                            disabled={Boolean(r.dbBacked) && !signedIn}
                            onVote={(value) => handleVote(r, value)}
                          />
                        </span>
                      </span>
                    </div>

                    <h3 className={styles.rowTitle}>
                      <a
                        href={r.url}
                        className={styles.rowTitleLink}
                        target='_blank'
                        rel='noopener noreferrer'
                        data-testid='resource-title'
                      >
                        {r.title}
                      </a>
                    </h3>
                    <p className={styles.rowDesc}>{r.description}</p>

                    {r.dbBacked && (
                      <div className={styles.rowActions}>
                        <button
                          type='button'
                          className={styles.quietLink}
                          onClick={() =>
                            setOpenThreads((prev) => ({
                              ...prev,
                              [r.id]: !prev[r.id]
                            }))
                          }
                          aria-expanded={Boolean(openThreads[r.id])}
                          data-testid='comments-toggle'
                        >
                          {openThreads[r.id]
                            ? 'Hide comments'
                            : r.commentCount === 1
                            ? '1 comment'
                            : `${r.commentCount ?? 0} comments`}
                        </button>
                      </div>
                    )}
                    {r.dbBacked && openThreads[r.id] && (
                      <CommunityComments
                        resourceId={r.id}
                        signedIn={signedIn}
                        onCountChange={(n) => setCommentCount(r.id, n)}
                      />
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <HomeFooterSection />
      </main>

      {modal === 'resource' && (
        <Modal title='Share a resource' onClose={closeModal}>
          <label className={styles.field}>
            <span className={styles.label}>Title</span>
            <input
              className={styles.input}
              value={resTitle}
              onChange={(e) => setResTitle(e.target.value)}
              placeholder='e.g. A great intro to linear algebra'
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Type</span>
            <select
              className={styles.input}
              value={resType}
              onChange={(e) => setResType(e.target.value as ResourceType)}
            >
              {RESOURCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Description</span>
            <textarea
              className={styles.textarea}
              value={resDesc}
              onChange={(e) => setResDesc(e.target.value)}
              placeholder='Why is this useful?'
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Link (optional)</span>
            <input
              className={styles.input}
              value={resLink}
              onChange={(e) => setResLink(e.target.value)}
              placeholder='https://…'
            />
          </label>
          <div className={styles.modalActions}>
            <button type='button' className={styles.btn} onClick={closeModal}>
              Cancel
            </button>
            <button
              type='button'
              className={styles.btnPrimary}
              onClick={submitResource}
              disabled={!resTitle.trim() || !resDesc.trim()}
            >
              Share
            </button>
          </div>
        </Modal>
      )}

      {modal === 'knowledge' && (
        <Modal title='Add a knowledge component' onClose={closeModal}>
          <p className={styles.hint}>
            Knowledge components are structured study units — an early preview.
            Entries aren&apos;t saved yet.
          </p>
          <label className={styles.field}>
            <span className={styles.label}>Name</span>
            <input
              className={styles.input}
              value={kcName}
              onChange={(e) => setKcName(e.target.value)}
              placeholder='e.g. Eigenvalues & eigenvectors'
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Summary</span>
            <textarea
              className={styles.textarea}
              value={kcSummary}
              onChange={(e) => setKcSummary(e.target.value)}
              placeholder='What does this component teach?'
            />
          </label>
          <div className={styles.modalActions}>
            <button type='button' className={styles.btn} onClick={closeModal}>
              Cancel
            </button>
            <button
              type='button'
              className={styles.btnPrimary}
              onClick={closeModal}
            >
              Done
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
