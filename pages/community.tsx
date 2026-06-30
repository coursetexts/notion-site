import * as React from 'react'
import Head from 'next/head'
import { createPortal } from 'react-dom'

import { VoteRow } from '@/components/CourseActivity'
import { HomeFooterSection } from '@/components/HomeFooterSection'
import { HomeHeader } from '@/components/HomeHeader'

import styles from './community.module.css'

type ResourceType = 'Article' | 'Video' | 'Tool' | 'Paper' | 'Course'

interface CommunityResource {
  id: string
  type: ResourceType
  title: string
  description: string
  url: string
  author: string
  score: number
  userVote: 1 | -1 | null
}

const MOCK_RESOURCES: CommunityResource[] = [
  {
    id: 'r1',
    type: 'Article',
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
    type: 'Video',
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
    type: 'Tool',
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
    type: 'Paper',
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
    type: 'Article',
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
    type: 'Course',
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
    type: 'Tool',
    title: 'Anki — powerful, intelligent flashcards',
    description:
      'Spaced-repetition flashcards that schedule reviews right before you would forget. Indispensable for memory-heavy subjects.',
    url: 'https://apps.ankiweb.net/',
    author: 'Noah Bergström',
    score: 28,
    userVote: null
  }
]

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
    <circle cx='7' cy='7' r='4.5' stroke='#9ca3af' strokeWidth='1.3' />
    <path
      d='M10.5 10.5L14 14'
      stroke='#9ca3af'
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
  const [resources, setResources] =
    React.useState<CommunityResource[]>(MOCK_RESOURCES)
  const [query, setQuery] = React.useState('')
  const [modal, setModal] = React.useState<ModalKind>(null)

  // Submit-a-resource form state
  const [resTitle, setResTitle] = React.useState('')
  const [resDesc, setResDesc] = React.useState('')
  const [resLink, setResLink] = React.useState('')
  const [resType, setResType] = React.useState<ResourceType>('Article')

  // Add-a-knowledge-component form state (placeholder flow)
  const [kcName, setKcName] = React.useState('')
  const [kcSummary, setKcSummary] = React.useState('')

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return resources
    return resources.filter((r) =>
      `${r.title} ${r.description} ${r.type} ${r.author}`
        .toLowerCase()
        .includes(needle)
    )
  }, [resources, query])

  const handleVote = (id: string, value: 1 | -1 | null) => {
    setResources((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        const prevVote = r.userVote ?? 0
        const nextVote = value ?? 0
        return { ...r, score: r.score - prevVote + nextVote, userVote: value }
      })
    )
  }

  const closeModal = () => setModal(null)

  const submitResource = () => {
    const title = resTitle.trim()
    const description = resDesc.trim()
    if (!title || !description) return
    const link = resLink.trim()
    setResources((prev) => [
      {
        id: `new-${prev.length + 1}-${title.slice(0, 8)}`,
        type: resType,
        title,
        description,
        url: link || 'https://coursetexts.org',
        author: 'You',
        score: 1,
        userVote: 1
      },
      ...prev
    ])
    setResTitle('')
    setResDesc('')
    setResLink('')
    setResType('Article')
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
              <h1 className={styles.title}>Community</h1>
              <p className={styles.subtitle}>
                Resources and knowledge components shared by learners. Upvote
                what helped you, and add your own.
              </p>
              <div className={styles.ctaRow}>
                <button
                  type='button'
                  className={styles.ctaPrimary}
                  onClick={() => setModal('resource')}
                >
                  <PlusIcon />
                  Submit a Resource
                </button>
                <button
                  type='button'
                  className={styles.ctaSecondary}
                  onClick={() => setModal('knowledge')}
                >
                  <PlusIcon />
                  Add a Knowledge Component
                </button>
              </div>
            </header>

            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>
                <SearchIcon />
              </span>
              <input
                type='search'
                className={styles.searchInput}
                placeholder='Search resources…'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label='Search resources'
              />
            </div>

            <div className={styles.feedHeading}>
              <span className={styles.feedHeadingLabel}>Resources</span>
              <span className={styles.feedHeadingCount}>
                ({filtered.length})
              </span>
            </div>

            {filtered.length === 0 ? (
              <p className={styles.empty}>
                No resources match “{query.trim()}”. Try a different search.
              </p>
            ) : (
              <div className={styles.feed}>
                {filtered.map((r) => (
                  <article key={r.id} className={styles.card}>
                    <div className={styles.cardHead}>
                      <span className={styles.typeTag}>{r.type}</span>
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
                    </div>

                    <h3 className={styles.cardTitle}>
                      <a
                        href={r.url}
                        className={styles.cardTitleLink}
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        {r.title}
                      </a>
                    </h3>
                    <p className={styles.cardDesc}>{r.description}</p>

                    <div className={styles.cardFooter}>
                      <VoteRow
                        score={r.score}
                        userVote={r.userVote}
                        disabled={false}
                        onVote={(value) => handleVote(r.id, value)}
                      />
                      <span className={styles.author}>by {r.author}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <HomeFooterSection />
      </main>

      {modal === 'resource' && (
        <Modal title='Submit a Resource' onClose={closeModal}>
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
              <option>Article</option>
              <option>Video</option>
              <option>Tool</option>
              <option>Paper</option>
              <option>Course</option>
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
              Submit
            </button>
          </div>
        </Modal>
      )}

      {modal === 'knowledge' && (
        <Modal title='Add a Knowledge Component' onClose={closeModal}>
          <p className={styles.hint}>
            Knowledge components are a richer, structured contribution type.
            This flow is a placeholder for now.
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
