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
import {
  type CommunitySearchHit,
  searchCommunity
} from '@/lib/community-search-db'

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
  /** Score snapshot used for the current Top ordering. */
  rankingScore: number
  userVote: 1 | -1 | null
  /** True when the row exists in Supabase (comments/votes persist). */
  dbBacked?: boolean
  commentCount?: number
  /** Search results can also surface knowledge components. */
  kind?: 'resource' | 'knowledge_component'
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
    rankingScore: r.score,
    userVote: r.user_vote,
    dbBacked: true,
    commentCount: r.comment_count
  }
}

/** Search hits not already in the loaded feed (e.g. knowledge components). */
function searchHitToFeedItem(h: CommunitySearchHit): CommunityResource {
  return {
    id: h.id,
    kind: h.kind,
    type: h.type,
    title: h.title,
    description: h.description ?? '',
    url: h.url ?? '',
    author: '',
    score: h.score,
    rankingScore: h.score,
    userVote: null,
    dbBacked: h.kind === 'resource'
  }
}

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
  const [resources, setResources] = React.useState<CommunityResource[]>([])
  const [resourcesLoading, setResourcesLoading] = React.useState(true)
  const [resourcesError, setResourcesError] = React.useState<string | null>(
    null
  )
  const voteRequestSequence = React.useRef<Record<string, number>>({})
  const pendingVoteIdsRef = React.useRef<Set<string>>(new Set())
  const [pendingVoteIds, setPendingVoteIds] = React.useState<Set<string>>(
    new Set()
  )
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
  const [resourceSubmitError, setResourceSubmitError] = React.useState<
    string | null
  >(null)
  const [resourceSubmitting, setResourceSubmitting] = React.useState(false)

  // Add-a-knowledge-component form state (placeholder flow)
  const [kcName, setKcName] = React.useState('')
  const [kcSummary, setKcSummary] = React.useState('')

  // Server search results (Postgres FTS via search_community RPC), or null
  // when idle / unavailable — null falls back to the local substring filter.
  const [searchResults, setSearchResults] = React.useState<
    CommunitySearchHit[] | null
  >(null)

  // Re-fetch when auth settles so user_vote reflects the current session.
  React.useEffect(() => {
    let alive = true
    setResourcesLoading(true)
    setResourcesError(null)
    getCommunityPageResources()
      .then((rows) => {
        if (!alive) return
        setResources(rows.map(dbToFeedItem))
      })
      .catch((error: unknown) => {
        if (!alive) return
        console.error('Could not load community resources', error)
        setResources([])
        setResourcesError('Community resources could not be loaded.')
      })
      .finally(() => {
        if (alive) setResourcesLoading(false)
      })
    return () => {
      alive = false
    }
  }, [auth?.user?.id])

  // Search-as-you-type: debounce ~150ms, abort superseded requests. While a
  // request is in flight the previous list stays on screen (the local filter
  // covers the very first keystrokes), so results feel instant.
  React.useEffect(() => {
    const q = query.trim()
    if (!q) {
      setSearchResults(null)
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(() => {
      searchCommunity(q, { signal: controller.signal }).then((hits) => {
        if (controller.signal.aborted) return
        setSearchResults(hits)
      })
    }, 150)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase()

    // Server-ranked search: FTS relevance, vote-score tie-break (RPC order).
    // Resource hits merge with loaded rows to keep userVote/commentCount.
    if (needle && searchResults) {
      const byId = new Map(resources.map((r) => [r.id, r]))
      let list = searchResults.map((h) =>
        h.kind === 'resource'
          ? byId.get(h.id) ?? searchHitToFeedItem(h)
          : searchHitToFeedItem(h)
      )
      if (typeFilter !== 'All') {
        list = list.filter((r) => r.type === typeFilter)
      }
      return list
    }

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
    // 'new' keeps insertion order. 'top' uses a stable score snapshot so a
    // vote can update in place without moving the card under the user.
    if (sort === 'top') {
      list = [...list].sort((a, b) => b.rankingScore - a.rankingScore)
    }
    return list
  }, [resources, searchResults, query, typeFilter, sort])

  const handleVote = (item: CommunityResource, value: 1 | -1 | null) => {
    if (pendingVoteIdsRef.current.has(item.id)) return
    pendingVoteIdsRef.current.add(item.id)
    setPendingVoteIds(new Set(pendingVoteIdsRef.current))

    const previous = { score: item.score, userVote: item.userVote }
    const sequence = (voteRequestSequence.current[item.id] ?? 0) + 1
    voteRequestSequence.current[item.id] = sequence

    // Optimistic update either way; persist for db-backed rows.
    setResources((prev) => {
      let found = false
      const next = prev.map((r) => {
        if (r.id !== item.id) return r
        found = true
        const prevVote = r.userVote ?? 0
        const nextVote = value ?? 0
        return { ...r, score: r.score - prevVote + nextVote, userVote: value }
      })

      if (!found && item.dbBacked) {
        const prevVote = item.userVote ?? 0
        const nextVote = value ?? 0
        next.push({
          ...item,
          score: item.score - prevVote + nextVote,
          userVote: value
        })
      }
      return next
    })
    if (item.dbBacked && signedIn) {
      void (async () => {
        try {
          const score = await setResourceVote(item.id, value)
          if (voteRequestSequence.current[item.id] !== sequence) return

          if (score === null) {
            setResources((prev) =>
              prev.map((r) =>
                r.id === item.id
                  ? {
                      ...r,
                      score: previous.score,
                      userVote: previous.userVote
                    }
                  : r
              )
            )
            setResourcesError('Your vote could not be saved. Please try again.')
            return
          }

          setResourcesError(null)
          setResources((prev) =>
            prev.map((r) =>
              r.id === item.id ? { ...r, score, userVote: value } : r
            )
          )
          setSearchResults(
            (prev) =>
              prev?.map((hit) =>
                hit.id === item.id ? { ...hit, score } : hit
              ) ?? null
          )
        } catch (error: unknown) {
          if (voteRequestSequence.current[item.id] !== sequence) return
          console.error('Could not save community vote', error)
          setResources((prev) =>
            prev.map((r) =>
              r.id === item.id
                ? {
                    ...r,
                    score: previous.score,
                    userVote: previous.userVote
                  }
                : r
            )
          )
          setResourcesError('Your vote could not be saved. Please try again.')
        } finally {
          if (voteRequestSequence.current[item.id] === sequence) {
            pendingVoteIdsRef.current.delete(item.id)
            setPendingVoteIds(new Set(pendingVoteIdsRef.current))
          }
        }
      })()
    } else {
      pendingVoteIdsRef.current.delete(item.id)
      setPendingVoteIds(new Set(pendingVoteIdsRef.current))
    }
  }

  const handleSortChange = (nextSort: 'top' | 'new') => {
    // Deliberately returning to Top is the point where the feed may re-rank.
    if (nextSort === 'top' && sort !== 'top') {
      setResources((prev) =>
        prev.map((resource) => ({
          ...resource,
          rankingScore: resource.score
        }))
      )
    }
    setSort(nextSort)
  }

  const setCommentCount = (id: string, count: number) => {
    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, commentCount: count } : r))
    )
  }

  const closeModal = () => setModal(null)

  const searchActive = query.trim().length > 0

  const submitResource = async () => {
    const title = resTitle.trim()
    const description = resDesc.trim()
    if (!title || !description) return
    const link = resLink.trim()

    if (!signedIn) {
      setResourceSubmitError('Sign in with Google to submit a resource.')
      return
    }

    setResourceSubmitting(true)
    setResourceSubmitError(null)
    const created = await addCommunityPageResource({
      title,
      description,
      url: link || 'https://coursetexts.org',
      type: resType
    })
    setResourceSubmitting(false)

    if (!created) {
      setResourceSubmitError('Your resource could not be saved. Try again.')
      return
    }

    setResources((prev) => [dbToFeedItem(created), ...prev])
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
                placeholder='Search resources and knowledge components…'
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
                <span className={styles.sortLabel}>
                  {searchActive ? 'Sorted by relevance' : 'Sort by'}
                </span>
                {!searchActive && (
                  <>
                    <button
                      type='button'
                      className={
                        sort === 'top'
                          ? `${styles.sortBtn} ${styles.sortBtnActive}`
                          : styles.sortBtn
                      }
                      aria-pressed={sort === 'top'}
                      onClick={() => handleSortChange('top')}
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
                      onClick={() => handleSortChange('new')}
                    >
                      New
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className={styles.feedBar}>
              <span>
                <span className={styles.feedHeadingLabel}>
                  {searchActive ? 'Results' : 'Resources'}
                </span>
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

            {resourcesError && (
              <p className={styles.emptyText} role='alert'>
                {resourcesError}
              </p>
            )}

            {resourcesLoading ? (
              <div className={styles.empty} aria-live='polite'>
                <p className={styles.emptyText}>Loading community resources…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className={styles.empty}>
                <p className={styles.emptyText}>
                  {resourcesError
                    ? 'No cached or fabricated resources are shown.'
                    : resources.length === 0
                    ? 'No resources have been shared yet.'
                    : query.trim()
                    ? `Nothing matches “${query.trim()}”.`
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
                      {r.kind === 'knowledge_component' ? (
                        <span
                          className={`${styles.typeTag} ${styles.typeTagKc}`}
                        >
                          Knowledge component
                        </span>
                      ) : (
                        r.type && (
                          <>
                            <span className={styles.typeTag}>
                              {TYPE_LABELS[r.type]}
                            </span>
                            <span className={styles.metaDot} aria-hidden>
                              ·
                            </span>
                          </>
                        )
                      )}
                      {r.url && (
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
                      )}
                      <span className={styles.rowMetaRight}>
                        {r.author && (
                          <span className={styles.author}>by {r.author}</span>
                        )}
                        <span data-testid='resource-vote'>
                          <VoteRow
                            score={r.score}
                            userVote={r.userVote}
                            disabled={
                              r.kind === 'knowledge_component' ||
                              pendingVoteIds.has(r.id) ||
                              (Boolean(r.dbBacked) && !signedIn)
                            }
                            onVote={(value) => handleVote(r, value)}
                          />
                        </span>
                      </span>
                    </div>

                    <h3 className={styles.rowTitle}>
                      {r.url ? (
                        <a
                          href={r.url}
                          className={styles.rowTitleLink}
                          target='_blank'
                          rel='noopener noreferrer'
                          data-testid='resource-title'
                        >
                          {r.title}
                        </a>
                      ) : (
                        <span
                          className={styles.rowTitleLink}
                          data-testid='resource-title'
                        >
                          {r.title}
                        </span>
                      )}
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
              disabled={
                resourceSubmitting || !resTitle.trim() || !resDesc.trim()
              }
            >
              {resourceSubmitting ? 'Sharing…' : 'Share'}
            </button>
          </div>
          {resourceSubmitError && (
            <p className={styles.emptyText} role='alert'>
              {resourceSubmitError}
            </p>
          )}
        </Modal>
      )}

      {modal === 'knowledge' && (
        <Modal title='Add a knowledge component' onClose={closeModal}>
          <p className={styles.hint}>
            Add one specific idea or skill that someone can learn. This form is
            a preview, so your entry won&apos;t be saved yet.
          </p>
          <label className={styles.field}>
            <span className={styles.label}>Topic or skill</span>
            <input
              className={styles.input}
              value={kcName}
              onChange={(e) => setKcName(e.target.value)}
              placeholder='e.g. Multiplying two matrices'
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>What should someone learn?</span>
            <textarea
              className={styles.textarea}
              value={kcSummary}
              onChange={(e) => setKcSummary(e.target.value)}
              placeholder='Describe what a learner should understand or be able to do.'
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
              Close preview
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
