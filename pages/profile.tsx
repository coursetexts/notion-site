import React, { useCallback, useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import type { User } from '@supabase/supabase-js'
import { useAuthOptional } from '../contexts/AuthContext'
import { getCachedAuth } from '@/lib/auth-cache'
import { authDebug } from '@/lib/auth-debug'
import { getSupabaseClient } from '@/lib/supabase'
import {
  getMyComments,
  getMyAnnotations,
  getMyBookmarks,
  type Comment as DbComment,
  type Annotation as DbAnnotation,
  type Course as CourseType
} from '@/lib/course-activity-db'
import {
  getFollowingCount,
  getFollowersCount,
  getFollowingList,
  getFollowersList,
  type ProfileListItem
} from '@/lib/follows'
import {
  getReplyNotifications,
  markReplyNotificationsRead,
  type ReplyNotification
} from '@/lib/reply-notifications'
import {
  getMyTags,
  getMyLinks,
  createTag,
  addLink,
  updateLink,
  deleteLink,
  type LinkTag,
  type UserLinkWithTag
} from '@/lib/user-links'
import { getLinkSiteFaviconDomain, getFaviconUrl } from '@/lib/link-site-favicon'
import { name as siteName } from '@/lib/config'
import { useFollowingIds } from '@/hooks/useFollowingIds'
import { useFollowerIds } from '@/hooks/useFollowerIds'
import { UserLink } from '@/components/UserLink'
import styles from '@/styles/profile.module.css'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export default function ProfilePage() {
  const router = useRouter()
  const auth = useAuthOptional()
  const user = auth?.user ?? null
  const profile = auth?.profile ?? null
  const isLoading = auth?.isLoading ?? true
  const signOut = auth?.signOut ?? (async () => Promise.resolve())

  const cached = getCachedAuth()
  const [resolvedUser, setResolvedUser] = useState<User | null>(() => cached.user ?? null)
  const [comments, setComments] = useState<{ comment: DbComment; course: CourseType }[]>([])
  const [annotations, setAnnotations] = useState<{ annotation: DbAnnotation; course: CourseType }[]>([])
  const [bookmarks, setBookmarks] = useState<{ bookmark: { id: string; course_id: string; created_at: string }; course: CourseType }[]>([])
  const [notifications, setNotifications] = useState<ReplyNotification[]>([])
  const [activityLoading, setActivityLoading] = useState(true)
  const [myActivityTab, setMyActivityTab] = useState<'comments' | 'annotations'>(
    'comments'
  )
  type ProfileView = 'profile' | 'following' | 'followers'
  const [view, setView] = useState<ProfileView>('profile')
  const [followingCount, setFollowingCount] = useState(0)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingList, setFollowingList] = useState<ProfileListItem[]>([])
  const [followersList, setFollowersList] = useState<ProfileListItem[]>([])
  const { followingIds } = useFollowingIds()
  const { followerIds } = useFollowerIds()
  const [linkTags, setLinkTags] = useState<LinkTag[]>([])
  const [userLinks, setUserLinks] = useState<UserLinkWithTag[]>([])
  const [linkFilterTagId, setLinkFilterTagId] = useState<string | null>(null)
  const [showAddLinkModal, setShowAddLinkModal] = useState(false)
  const [linkFormTitle, setLinkFormTitle] = useState('')
  const [linkFormUrl, setLinkFormUrl] = useState('')
  const [linkFormTagIds, setLinkFormTagIds] = useState<string[]>([])
  const [linkFormNote, setLinkFormNote] = useState('')
  const [linkFormIsPrivate, setLinkFormIsPrivate] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [showNewTagInput, setShowNewTagInput] = useState(false)
  const [linksLoading, setLinksLoading] = useState(false)
  const [linkSubmitting, setLinkSubmitting] = useState(false)
  const [tagSubmitting, setTagSubmitting] = useState(false)
  type LinkActionType = 'edit-note' | 'add-tag' | 'delete'
  const [linkActionOverlay, setLinkActionOverlay] = useState<{ type: LinkActionType; link: UserLinkWithTag } | null>(null)
  const [editNote, setEditNote] = useState('')
  const [editTagIds, setEditTagIds] = useState<string[]>([])
  const [editIsPrivate, setEditIsPrivate] = useState(false)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [showPrivateMessageForLinkId, setShowPrivateMessageForLinkId] = useState<string | null>(null)

  const effectiveUser = user ?? resolvedUser

  const loadActivity = useCallback(async (userId: string) => {
    const [
      commentsRes,
      annotationsRes,
      bookmarksRes,
      notificationRes,
      fCount,
      fersCount,
      fList,
      fersList
    ] = await Promise.all([
      getMyComments(),
      getMyAnnotations(),
      getMyBookmarks(),
      getReplyNotifications(userId),
      getFollowingCount(userId),
      getFollowersCount(userId),
      getFollowingList(userId),
      getFollowersList(userId)
    ])
    setComments(commentsRes)
    setAnnotations(annotationsRes)
    setBookmarks(bookmarksRes)
    setNotifications(notificationRes)
    setFollowingCount(fCount)
    setFollowersCount(fersCount)
    setFollowingList(fList)
    setFollowersList(fersList)
    setActivityLoading(false)

    // Mark as read after rendering this fetch so entries can appear as read next time.
    await markReplyNotificationsRead(userId)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_unread: false })))
  }, [])

  const loadLinks = useCallback(async () => {
    setLinksLoading(true)
    const [tags, links] = await Promise.all([
      getMyTags(),
      getMyLinks(linkFilterTagId)
    ])
    setLinkTags(tags)
    setUserLinks(links)
    setLinksLoading(false)
  }, [linkFilterTagId])

  useEffect(() => {
    if (!effectiveUser) return
    loadLinks()
  }, [effectiveUser, linkFilterTagId, loadLinks])

  const handleCreateTag = async () => {
    const name = newTagName.trim()
    if (!name || tagSubmitting) return
    setTagSubmitting(true)
    const tag = await createTag(name)
    if (tag) {
      setLinkTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)))
      setNewTagName('')
      setShowNewTagInput(false)
    }
    setTagSubmitting(false)
  }

  const closeAddLinkModal = () => {
    setShowAddLinkModal(false)
    setLinkFormTitle('')
    setLinkFormUrl('')
    setLinkFormTagIds([])
    setLinkFormNote('')
    setLinkFormIsPrivate(false)
  }

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!linkFormUrl.trim() || linkSubmitting) return
    setLinkSubmitting(true)
    const link = await addLink(linkFormUrl, {
      title: linkFormTitle || null,
      tagIds: linkFormTagIds.length ? linkFormTagIds : undefined,
      note: linkFormNote || null,
      isPrivate: linkFormIsPrivate
    })
    if (link) {
      setUserLinks((prev) => {
        if (linkFilterTagId && !link.tag_ids.includes(linkFilterTagId)) return prev
        return [link, ...prev]
      })
      closeAddLinkModal()
    }
    setLinkSubmitting(false)
  }

  const handleDeleteLink = async (linkId: string) => {
    const ok = await deleteLink(linkId)
    if (ok) {
      setUserLinks((prev) => prev.filter((l) => l.id !== linkId))
      setLinkActionOverlay(null)
    }
  }

  const openLinkAction = (type: LinkActionType, link: UserLinkWithTag) => {
    setLinkActionOverlay({ type, link })
    setEditNote(link.note ?? '')
    setEditTagIds(link.tag_ids ? [...link.tag_ids] : [])
    setEditIsPrivate(link.is_private ?? false)
  }

  const closeLinkActionOverlay = () => {
    setLinkActionOverlay(null)
    setEditNote('')
    setEditTagIds([])
    setEditIsPrivate(false)
  }

  const handleSaveEditNote = async () => {
    if (!linkActionOverlay || linkActionOverlay.type !== 'edit-note' || editSubmitting) return
    setEditSubmitting(true)
    const updated = await updateLink(linkActionOverlay.link.id, { note: editNote })
    if (updated) {
      setUserLinks((prev) =>
        prev.map((l) => (l.id === linkActionOverlay.link.id ? updated : l))
      )
      closeLinkActionOverlay()
    }
    setEditSubmitting(false)
  }

  const handleSaveAddTag = async () => {
    if (!linkActionOverlay || linkActionOverlay.type !== 'add-tag' || editSubmitting) return
    setEditSubmitting(true)
    const updated = await updateLink(linkActionOverlay.link.id, { tagIds: editTagIds, isPrivate: editIsPrivate })
    if (updated) {
      setUserLinks((prev) =>
        prev.map((l) => (l.id === linkActionOverlay.link.id ? updated : l))
      )
      closeLinkActionOverlay()
    }
    setEditSubmitting(false)
  }

  useEffect(() => {
    authDebug('profile:effective-user', {
      authUser: user?.id ?? null,
      resolvedUser: resolvedUser?.id ?? null,
      effectiveUser: effectiveUser?.id ?? null,
      isLoading
    })
    if (!isLoading && !effectiveUser) {
      router.replace(`/signin?redirect=${encodeURIComponent('/profile')}`)
    }
  }, [effectiveUser, isLoading, router])

  useEffect(() => {
    setView('profile')
    if (effectiveUser) loadActivity(effectiveUser.id)
    else setActivityLoading(false)
  }, [effectiveUser, loadActivity])

  useEffect(() => {
    if (user) {
      setResolvedUser(null)
      return
    }
    if (resolvedUser) return
    const supabase = getSupabaseClient()
    if (!supabase) return
    let cancelled = false
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled && session?.user) setResolvedUser(session.user)
    })
    return () => { cancelled = true }
  }, [user, isLoading, resolvedUser])

  const handleSignOut = async () => {
    await signOut()
    const supabase = getSupabaseClient()
    if (supabase) await supabase.auth.signOut()
    setResolvedUser(null)
    router.replace('/')
  }

  if ((isLoading && !resolvedUser) || !effectiveUser) {
    return (
      <>
        <Head>
          <title>Profile – {siteName}</title>
        </Head>
        <div className={styles.container}>
          <div className={styles.loading}>Loading…</div>
        </div>
      </>
    )
  }

  const displayName =
    profile?.display_name ||
    (effectiveUser.user_metadata?.full_name as string | undefined) ||
    (effectiveUser.user_metadata?.name as string | undefined) ||
    effectiveUser.email?.split('@')[0] ||
    'User'
  const avatarUrl =
    profile?.avatar_url || (effectiveUser.user_metadata?.avatar_url as string | undefined)

  return (
    <>
      <Head>
        <title>Profile – {siteName}</title>
      </Head>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <Link href="/" className={styles.back}>
              ← Back to home
            </Link>
          </div>

          <div className={styles.profileSection}>
            <div className={styles.avatarWrap}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className={styles.avatar}
                  width={80}
                  height={80}
                />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h1 className={styles.name}>{displayName}</h1>
            {effectiveUser.email && (
              <p className={styles.email}>{effectiveUser.email}</p>
            )}
            <div className={styles.followRow}>
              <span className={styles.followCounts}>
                <button
                  type="button"
                  className={styles.followCountBtn}
                  onClick={() => setView('following')}
                >
                  <strong>{followingCount}</strong> following
                </button>
                {' · '}
                <button
                  type="button"
                  className={styles.followCountBtn}
                  onClick={() => setView('followers')}
                >
                  <strong>{followersCount}</strong> followers
                </button>
              </span>
            </div>
            <button
              type="button"
              className={styles.signOutBtn}
              onClick={handleSignOut}
            >
              Sign out
            </button>
          </div>

          {view === 'following' && (
            <div className={styles.section}>
              <button
                type="button"
                className={styles.backToProfile}
                onClick={() => setView('profile')}
              >
                ← Back to profile
              </button>
              <h2 className={styles.sectionTitle}>Following</h2>
              {followingList.length === 0 ? (
                <p className={styles.placeholder}>Not following anyone yet.</p>
              ) : (
                <ul className={styles.userList}>
                  {followingList.map((u) => (
                    <li key={u.user_id} className={styles.userListItem}>
                      <a href={`/profile/${u.user_id}`} className={styles.userListLink}>
                        {u.display_name || 'User'}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {view === 'followers' && (
            <div className={styles.section}>
              <button
                type="button"
                className={styles.backToProfile}
                onClick={() => setView('profile')}
              >
                ← Back to profile
              </button>
              <h2 className={styles.sectionTitle}>Followers</h2>
              {followersList.length === 0 ? (
                <p className={styles.placeholder}>No followers yet.</p>
              ) : (
                <ul className={styles.userList}>
                  {followersList.map((u) => (
                    <li key={u.user_id} className={styles.userListItem}>
                      <a href={`/profile/${u.user_id}`} className={styles.userListLink}>
                        {u.display_name || 'User'}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {view === 'profile' && (
          <>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Bookmarked courses</h2>
            {activityLoading ? (
              <p className={styles.placeholder}>Loading…</p>
            ) : bookmarks.length === 0 ? (
              <p className={styles.placeholder}>
                No bookmarks yet. Use “Save course” on a course page to add one.
              </p>
            ) : (
              <ul className={styles.list}>
                {bookmarks.map(({ bookmark, course }) => (
                  <li key={bookmark.id} className={styles.listItem}>
                    <Link href={course.url ?? `/${course.notion_page_id}`}>
                      <a className={styles.listLink}>
                        <span className={styles.listTitle}>{course.name}</span>
                        <span className={styles.listMeta}>{formatDate(bookmark.created_at)}</span>
                      </a>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Replies to me</h2>
            {activityLoading ? (
              <p className={styles.placeholder}>Loading…</p>
            ) : notifications.length === 0 ? (
              <p className={styles.placeholder}>
                No replies yet. When someone replies to your comment or annotation, it appears here.
              </p>
            ) : (
              <ul className={styles.list}>
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={
                      n.is_unread
                        ? `${styles.listItem} ${styles.listItemUnread}`
                        : styles.listItem
                    }
                  >
                    <div className={styles.listLink}>
                      <span className={styles.listTitle}>
                        <UserLink
                          userId={n.author_id}
                          displayName={n.author_name}
                          showFollowingTag={followingIds.has(n.author_id)}
                          showFollowsYouTag={followerIds.has(n.author_id)}
                        />
                        {' replied on '}
                        <Link href={n.course_url ?? `/${n.course_id}`}>
                          <a className={styles.inlineLink}>{n.course_name}</a>
                        </Link>
                      </span>
                      <span className={styles.listMeta}>{formatDate(n.created_at)}</span>
                    </div>
                    {n.type === 'annotation' && n.section_id && (
                      <p className={styles.notificationMeta}>Section: {n.section_id}</p>
                    )}
                    <p className={styles.listBody}>{n.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitleRow}>
              <h2 className={styles.sectionTitle}>My activity</h2>
              <div className={styles.activityToggle} role="tablist" aria-label="My activity tabs">
                <button
                  type="button"
                  role="tab"
                  aria-selected={myActivityTab === 'comments'}
                  className={myActivityTab === 'comments' ? styles.toggleBtnActive : styles.toggleBtn}
                  onClick={() => setMyActivityTab('comments')}
                >
                  Comments
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={myActivityTab === 'annotations'}
                  className={myActivityTab === 'annotations' ? styles.toggleBtnActive : styles.toggleBtn}
                  onClick={() => setMyActivityTab('annotations')}
                >
                  Annotations
                </button>
              </div>
            </div>

            {activityLoading && <p className={styles.placeholder}>Loading…</p>}

            {!activityLoading && myActivityTab === 'comments' && (
              comments.length === 0 ? (
                <p className={styles.placeholder}>
                  You haven’t commented on any course yet. Comments you leave on course pages will appear here.
                </p>
              ) : (
                <ul className={styles.list}>
                  {comments.map(({ comment, course }) => (
                    <li key={comment.id} className={styles.listItem}>
                      <Link href={course.url ?? `/${course.notion_page_id}`}>
                        <a className={styles.listLink}>
                          <span className={styles.listTitle}>{course.name}</span>
                          <span className={styles.listMeta}>{formatDate(comment.created_at)}</span>
                        </a>
                      </Link>
                      <p className={styles.listBody}>{comment.body}</p>
                    </li>
                  ))}
                </ul>
              )
            )}

            {!activityLoading && myActivityTab === 'annotations' && (
              annotations.length === 0 ? (
                <p className={styles.placeholder}>
                  You haven’t added annotations yet. Annotations you leave in course sections will appear here.
                </p>
              ) : (
                <ul className={styles.list}>
                  {annotations.map(({ annotation, course }) => (
                    <li key={annotation.id} className={styles.listItem}>
                      <Link href={course.url ?? `/${course.notion_page_id}`}>
                        <a className={styles.listLink}>
                          <span className={styles.listTitle}>{course.name}</span>
                          <span className={styles.listMeta}>{formatDate(annotation.created_at)}</span>
                        </a>
                      </Link>
                      <p className={styles.notificationMeta}>Section: {annotation.section_id}</p>
                      <p className={styles.listBody}>{annotation.body}</p>
                    </li>
                  ))}
                </ul>
              )
            )}
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>My bookmarked links</h2>
            <div className={styles.linkFilterRow}>
              <div className={styles.linkFilterTagsWrap}>
                <span className={styles.linkFilterLabel}>Filter:</span>
                <button
                  type="button"
                  className={linkFilterTagId === null ? styles.linkFilterBtnActive : styles.linkFilterBtn}
                  onClick={() => setLinkFilterTagId(null)}
                >
                  All
                </button>
                {linkTags.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={linkFilterTagId === t.id ? styles.linkFilterBtnActive : styles.linkFilterBtn}
                    onClick={() => setLinkFilterTagId(t.id)}
                  >
                    {t.name}
                  </button>
                ))}
                {showNewTagInput ? (
                  <span className={styles.newTagWrap}>
                    <input
                      type="text"
                      className={styles.newTagInput}
                      placeholder="Tag name"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                      autoFocus
                    />
                    <button
                      type="button"
                      className={styles.newTagBtn}
                      onClick={handleCreateTag}
                      disabled={!newTagName.trim() || tagSubmitting}
                    >
                      {tagSubmitting ? '…' : 'Add'}
                    </button>
                    <button
                      type="button"
                      className={styles.newTagCancel}
                      onClick={() => { setShowNewTagInput(false); setNewTagName('') }}
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    className={styles.linkFilterBtnNew}
                    onClick={() => setShowNewTagInput(true)}
                  >
                    + New tag
                  </button>
                )}
              </div>
              <>
                <span className={styles.linkFilterDivider} aria-hidden>|</span>
                <button
                  type="button"
                  className={styles.addLinkBtn}
                  onClick={() => setShowAddLinkModal(true)}
                >
                  Add a new link
                </button>
              </>
            </div>
            {showAddLinkModal && (
              <div className={styles.modalBackdrop} onClick={closeAddLinkModal} role="presentation">
                <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                  <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>Add New Bookmark</h3>
                    <button
                      type="button"
                      className={styles.modalClose}
                      onClick={closeAddLinkModal}
                      aria-label="Close"
                    >
                      ×
                    </button>
                  </div>
                  <form className={styles.modalForm} onSubmit={handleAddLink}>
                    <label className={styles.modalLabel}>
                      Title <span className={styles.modalOptional}>(optional)</span>
                      <input
                        type="text"
                        className={styles.modalInput}
                        placeholder="My Awesome Link"
                        value={linkFormTitle}
                        onChange={(e) => setLinkFormTitle(e.target.value)}
                      />
                    </label>
                    <label className={styles.modalLabel}>
                      URL <span className={styles.modalRequired}>*</span>
                      <input
                        type="url"
                        className={styles.modalInput}
                        placeholder="https://example.com"
                        value={linkFormUrl}
                        onChange={(e) => setLinkFormUrl(e.target.value)}
                        required
                      />
                    </label>
                    <label className={styles.modalLabel}>
                      Description <span className={styles.modalOptional}>(optional)</span>
                      <textarea
                        className={styles.modalTextarea}
                        placeholder="A brief description of this bookmark..."
                        value={linkFormNote}
                        onChange={(e) => setLinkFormNote(e.target.value)}
                        rows={3}
                      />
                    </label>
                    <div className={styles.modalLabel}>
                      <span>Tags</span>
                      <div className={styles.tagPillsWrap} role="group" aria-label="Select tags">
                        {linkTags.map((t) => {
                          const selected = linkFormTagIds.includes(t.id)
                          return (
                            <button
                              key={t.id}
                              type="button"
                              className={selected ? styles.tagPillSelected : styles.tagPill}
                              onClick={() => {
                                setLinkFormTagIds((prev) =>
                                  prev.includes(t.id)
                                    ? prev.filter((id) => id !== t.id)
                                    : [...prev, t.id]
                                )
                              }}
                            >
                              {t.name}
                            </button>
                          )
                        })}
                        {linkTags.length === 0 && (
                          <span className={styles.tagPillsEmpty}>No tags yet. Add one in the filter row.</span>
                        )}
                      </div>
                    </div>
                    <label className={styles.modalCheckboxLabel}>
                      <input
                        type="checkbox"
                        checked={linkFormIsPrivate}
                        onChange={(e) => setLinkFormIsPrivate(e.target.checked)}
                        className={styles.modalCheckbox}
                      />
                      <span>Private – only visible to you</span>
                    </label>
                    <div className={styles.modalActions}>
                      <button
                        type="button"
                        className={styles.modalCancelBtn}
                        onClick={closeAddLinkModal}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={styles.modalSubmitBtn}
                        disabled={linkSubmitting || !linkFormUrl.trim()}
                      >
                        {linkSubmitting ? '…' : 'Add Bookmark'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {linksLoading ? (
              <p className={styles.placeholder}>Loading links…</p>
            ) : userLinks.length === 0 ? (
              <p className={styles.placeholder}>
                No links yet. Click “Add a new link” to add a bookmark.
              </p>
            ) : (
              <ul className={styles.userLinksList}>
                {userLinks.map((l) => {
                  const faviconDomain = getLinkSiteFaviconDomain(l.url)
                  return (
                  <li key={l.id} className={styles.userLinkItem}>
                    <div className={styles.userLinkItemInner}>
                      <span className={styles.userLinkIconWrap}>
                        {faviconDomain ? (
                          <img
                            src={getFaviconUrl(faviconDomain)}
                            alt=""
                            className={styles.userLinkIcon}
                            width={20}
                            height={20}
                          />
                        ) : (
                          <span className={styles.userLinkIconDefault} aria-hidden>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                          </span>
                        )}
                      </span>
                      <div className={styles.userLinkContent}>
                        <div className={styles.userLinkRow}>
                          <a
                            href={l.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.userLinkUrl}
                          >
                            {l.title || l.url}
                          </a>
                          <div className={styles.userLinkActions}>
                            <button
                              type="button"
                              className={styles.userLinkActionBtn}
                              onClick={() => openLinkAction('edit-note', l)}
                              aria-label="Edit note"
                              title="Edit note"
                            >
                              Note
                            </button>
                            <button
                              type="button"
                              className={styles.userLinkActionBtn}
                              onClick={() => openLinkAction('add-tag', l)}
                              aria-label="Add tag"
                              title="Tag page"
                            >
                              Tag
                            </button>
                            <button
                              type="button"
                              className={styles.userLinkActionBtn}
                              onClick={() => openLinkAction('delete', l)}
                              aria-label="Delete link"
                              title="Delete"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <div className={styles.userLinkMeta}>
                          {l.is_private && (
                            <button
                              type="button"
                              className={styles.userLinkTagPrivate}
                              onClick={() => setShowPrivateMessageForLinkId((id) => (id === l.id ? null : l.id))}
                              title="This link is only visible to you"
                            >
                              Private
                            </button>
                          )}
                          {l.tag_names?.length > 0 && l.tag_names.map((name) => (
                            <span key={name} className={styles.userLinkTag}>{name}</span>
                          ))}
                          <span className={styles.userLinkDate}>{formatDate(l.created_at)}</span>
                          {(() => {
                            try {
                              return <span className={styles.userLinkDomain}>{new URL(l.url).hostname}</span>
                            } catch {
                              return null
                            }
                          })()}
                        </div>
                        {showPrivateMessageForLinkId === l.id && (
                          <p className={styles.privateMessage} role="status">
                            This link is only visible to you.
                          </p>
                        )}
                        {l.note && <p className={styles.userLinkNote}>{l.note}</p>}
                      </div>
                    </div>
                  </li>
                  )
                })}
              </ul>
            )}
            {linkActionOverlay && (
              <div className={styles.modalBackdrop} onClick={closeLinkActionOverlay} role="presentation">
                <div className={styles.actionOverlayCard} onClick={(e) => e.stopPropagation()}>
                  {linkActionOverlay.type === 'edit-note' && (
                    <>
                      <h4 className={styles.actionOverlayTitle}>Edit note</h4>
                      <textarea
                        className={styles.actionOverlayInput}
                        placeholder="Note (optional)"
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        rows={3}
                        autoFocus
                      />
                      <div className={styles.actionOverlayActions}>
                        <button type="button" className={styles.actionOverlayCancel} onClick={closeLinkActionOverlay}>Cancel</button>
                        <button type="button" className={styles.actionOverlaySave} onClick={handleSaveEditNote} disabled={editSubmitting}>{editSubmitting ? '…' : 'Save'}</button>
                      </div>
                    </>
                  )}
                  {linkActionOverlay.type === 'add-tag' && (
                    <>
                      <h4 className={styles.actionOverlayTitle}>Tag page</h4>
                      <div className={styles.tagPillsWrap} role="group" aria-label="Select tags">
                        {linkTags.map((t) => {
                          const selected = editTagIds.includes(t.id)
                          return (
                            <button
                              key={t.id}
                              type="button"
                              className={selected ? styles.tagPillSelected : styles.tagPill}
                              onClick={() => {
                                setEditTagIds((prev) =>
                                  prev.includes(t.id)
                                    ? prev.filter((id) => id !== t.id)
                                    : [...prev, t.id]
                                )
                              }}
                            >
                              {t.name}
                            </button>
                          )
                        })}
                        {linkTags.length === 0 && (
                          <span className={styles.tagPillsEmpty}>No tags yet.</span>
                        )}
                      </div>
                      <label className={styles.actionOverlayCheckbox}>
                        <input
                          type="checkbox"
                          checked={editIsPrivate}
                          onChange={(e) => setEditIsPrivate(e.target.checked)}
                          className={styles.actionOverlayCheckboxInput}
                        />
                        <span>Only visible to you</span>
                      </label>
                      <div className={styles.actionOverlayActions}>
                        <button type="button" className={styles.actionOverlayCancel} onClick={closeLinkActionOverlay}>Cancel</button>
                        <button type="button" className={styles.actionOverlaySave} onClick={handleSaveAddTag} disabled={editSubmitting}>{editSubmitting ? '…' : 'Save'}</button>
                      </div>
                    </>
                  )}
                  {linkActionOverlay.type === 'delete' && (
                    <>
                      <h4 className={styles.actionOverlayTitle}>Delete link?</h4>
                      <p className={styles.actionOverlayText}>This bookmark will be removed.</p>
                      <div className={styles.actionOverlayActions}>
                        <button type="button" className={styles.actionOverlayCancel} onClick={closeLinkActionOverlay}>Cancel</button>
                        <button type="button" className={styles.actionOverlayDelete} onClick={() => handleDeleteLink(linkActionOverlay.link.id)}>Delete</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          </>
          )}
        </div>
      </div>
    </>
  )
}
