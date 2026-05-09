import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

import { useFollowerIds } from '@/hooks/useFollowerIds'
import { useFollowingIds } from '@/hooks/useFollowingIds'
import type { User } from '@supabase/supabase-js'

import { HomeFooterSection } from '@/components/HomeFooterSection'
import { HomeHeader } from '@/components/HomeHeader'
import { ProfileBackArrow } from '@/components/ProfileBackArrow'
import { ProfileSidebarBackHome } from '@/components/ProfileSidebarBackHome'
import { FollowCountDividerDot } from '@/components/FollowCountDividerDot'
import { ProfileInterestsPanel } from '@/components/ProfileInterestsPanel'
import {
  ProfilePersonalLinkAnchorRow,
  ProfilePersonalLinksPanel
} from '@/components/ProfilePersonalLinksPanel'
import { ProfileNotebooksPanel } from '@/components/ProfileNotebooksPanel'
import { UserLink } from '@/components/UserLink'
import { getCachedAuth, setCachedAuth } from '@/lib/auth-cache'
import { authDebug } from '@/lib/auth-debug'
import {
  type CommunityResourceBookmarkWithCourse,
  getMyCommunityResourceBookmarks
} from '@/lib/community-wall-db'
import { name as siteName } from '@/lib/config'
import {
  type Course as CourseType,
  type Annotation as DbAnnotation,
  type Comment as DbComment,
  getMyAnnotations,
  getMyBookmarks,
  getMyComments
} from '@/lib/course-activity-db'
import {
  type ProfileListItem,
  followUser,
  getFollowersCount,
  getFollowersList,
  getFollowingCount,
  getFollowingList,
  unfollowUser
} from '@/lib/follows'
import {
  notebookAbsoluteUrl,
  notebookUserLinkHref,
  parseNotebookIdFromUserLinkUrl
} from '@/lib/notebook-bookmark-link'
import { type Notebook, createNotebook, getMyNotebooks } from '@/lib/notebooks-db'
import { getProfileInterestsByUserId } from '@/lib/profile-interests-db'
import {
  type ProfilePersonalLink,
  listMyPersonalLinks
} from '@/lib/profile-personal-links-db'
import {
  type ProfileFeedItem,
  getProfileFeed
} from '@/lib/profile-feed-db'
import {
  type ReplyNotification,
  getReplyNotifications,
  markReplyNotificationsRead
} from '@/lib/reply-notifications'
import { getSupabaseClient } from '@/lib/supabase'
import {
  type LinkTag,
  type UserLinkWithTag,
  addLink,
  createTag,
  deleteLink,
  getMyLinks,
  getMyTags,
  updateLink
} from '@/lib/user-links'
import styles from '@/styles/profile.module.css'

import { useAuthOptional } from '../contexts/AuthContext'

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
  const [resolvedUser, setResolvedUser] = useState<User | null>(
    () => cached.user ?? null
  )
  const [comments, setComments] = useState<
    { comment: DbComment; course: CourseType }[]
  >([])
  const [annotations, setAnnotations] = useState<
    { annotation: DbAnnotation; course: CourseType }[]
  >([])
  const [bookmarks, setBookmarks] = useState<
    {
      bookmark: { id: string; course_id: string; created_at: string }
      course: CourseType
    }[]
  >([])
  const [resourceBookmarks, setResourceBookmarks] = useState<
    CommunityResourceBookmarkWithCourse[]
  >([])
  const [notifications, setNotifications] = useState<ReplyNotification[]>([])
  const [activityLoading, setActivityLoading] = useState(true)
  const [feedItems, setFeedItems] = useState<ProfileFeedItem[]>([])
  const [mainTab, setMainTab] = useState<
    'notebooks' | 'bookmarks' | 'activity'
  >('activity')
  const [activitySubTab, setActivitySubTab] = useState<
    'feed' | 'comments' | 'annotations' | 'replies'
  >('feed')
  const [bookmarksSubTab, setBookmarksSubTab] = useState<
    'saved' | 'notebookPins' | 'courses' | 'community'
  >('saved')
  const [notebooksSubTab, setNotebooksSubTab] = useState<'yours' | 'saved'>(
    'yours'
  )
  const [notebookCreateModalOpen, setNotebookCreateModalOpen] = useState(false)
  const [notebookCreating, setNotebookCreating] = useState(false)
  const [notebookNewTitle, setNotebookNewTitle] = useState('')
  type ProfileView = 'profile' | 'connections'
  type ConnectionsTab = 'followers' | 'following'
  const [view, setView] = useState<ProfileView>('profile')
  const [connectionsTab, setConnectionsTab] =
    useState<ConnectionsTab>('following')
  const [rowFollowBusyId, setRowFollowBusyId] = useState<string | null>(null)
  const [followingCount, setFollowingCount] = useState(0)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingList, setFollowingList] = useState<ProfileListItem[]>([])
  const [followersList, setFollowersList] = useState<ProfileListItem[]>([])
  const { followingIds, refresh: refreshFollowingIds } = useFollowingIds()
  const { followerIds } = useFollowerIds()
  const [linkTags, setLinkTags] = useState<LinkTag[]>([])
  const [userLinks, setUserLinks] = useState<UserLinkWithTag[]>([])
  /** From getMyLinks(null): notebook URL pins, independent of Saved links tag filter. */
  const [notebookPinLinks, setNotebookPinLinks] = useState<UserLinkWithTag[]>(
    []
  )
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
  const tagSubmittingRef = useRef(false)
  useEffect(() => {
    tagSubmittingRef.current = tagSubmitting
  }, [tagSubmitting])
  type LinkActionType = 'edit-note' | 'add-tag' | 'delete'
  const [linkActionOverlay, setLinkActionOverlay] = useState<{
    type: LinkActionType
    link: UserLinkWithTag
  } | null>(null)
  const [editNote, setEditNote] = useState('')
  const [editTagIds, setEditTagIds] = useState<string[]>([])
  const [editIsPrivate, setEditIsPrivate] = useState(false)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [showPrivateMessageForLinkId, setShowPrivateMessageForLinkId] =
    useState<string | null>(null)
  const [showNoteForLinkId, setShowNoteForLinkId] = useState<string | null>(
    null
  )
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [notebooksLoading, setNotebooksLoading] = useState(false)
  const [profileInterests, setProfileInterests] = useState<string[]>([])
  const [personalLinks, setPersonalLinks] = useState<ProfilePersonalLink[]>([])
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [bioDraft, setBioDraft] = useState('')
  const [bioSaving, setBioSaving] = useState(false)
  const bioSavingRef = useRef(false)
  useEffect(() => {
    bioSavingRef.current = bioSaving
  }, [bioSaving])

  const effectiveUser = user ?? resolvedUser

  const bioText = useMemo(
    () =>
      (
        (effectiveUser?.user_metadata?.bio as string | undefined) ?? ''
      ).trim(),
    [effectiveUser?.user_metadata?.bio]
  )

  const loadActivity = useCallback(async (userId: string) => {
    const [
      commentsRes,
      annotationsRes,
      bookmarksRes,
      resourceBookmarksRes,
      notificationRes,
      feedRes,
      fCount,
      fersCount,
      fList,
      fersList
    ] = await Promise.all([
      getMyComments(),
      getMyAnnotations(),
      getMyBookmarks(),
      getMyCommunityResourceBookmarks(),
      getReplyNotifications(userId),
      getProfileFeed(userId),
      getFollowingCount(userId),
      getFollowersCount(userId),
      getFollowingList(userId),
      getFollowersList(userId)
    ])
    setComments(commentsRes)
    setAnnotations(annotationsRes)
    setBookmarks(bookmarksRes)
    setResourceBookmarks(resourceBookmarksRes)
    setNotifications(notificationRes)
    setFeedItems(feedRes)
    setFollowingCount(fCount)
    setFollowersCount(fersCount)
    setFollowingList(fList)
    setFollowersList(fersList)
    setActivityLoading(false)

    // Mark as read after rendering this fetch so entries can appear as read next time.
    await markReplyNotificationsRead(userId)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_unread: false })))
  }, [])

  const refreshFollowListsAndCounts = useCallback(async () => {
    const uid = effectiveUser?.id
    if (!uid) return
    const [fCount, fersCount, fList, fersList] = await Promise.all([
      getFollowingCount(uid),
      getFollowersCount(uid),
      getFollowingList(uid),
      getFollowersList(uid)
    ])
    setFollowingCount(fCount)
    setFollowersCount(fersCount)
    setFollowingList(fList)
    setFollowersList(fersList)
  }, [effectiveUser?.id])

  const handleConnectionRowFollowToggle = useCallback(
    async (targetUserId: string) => {
      const me = effectiveUser?.id
      if (!me || targetUserId === me || rowFollowBusyId) return
      setRowFollowBusyId(targetUserId)
      try {
        const already = followingIds.has(targetUserId)
        if (already) {
          await unfollowUser(me, targetUserId)
        } else {
          await followUser(me, targetUserId)
        }
        await refreshFollowingIds()
        await refreshFollowListsAndCounts()
      } finally {
        setRowFollowBusyId(null)
      }
    },
    [
      effectiveUser?.id,
      followingIds,
      refreshFollowListsAndCounts,
      refreshFollowingIds,
      rowFollowBusyId
    ]
  )

  const loadLinks = useCallback(async () => {
    setLinksLoading(true)
    const [tags, links, allLinks] = await Promise.all([
      getMyTags(),
      getMyLinks(linkFilterTagId),
      getMyLinks(null)
    ])
    setLinkTags(tags)
    setUserLinks(links)
    setNotebookPinLinks(
      allLinks.filter((l) => parseNotebookIdFromUserLinkUrl(l.url) != null)
    )
    setLinksLoading(false)
  }, [linkFilterTagId])

  const bookmarkedNotebookIds = useMemo(() => {
    const s = new Set<string>()
    for (const l of notebookPinLinks) {
      const id = parseNotebookIdFromUserLinkUrl(l.url)
      if (id) s.add(id)
    }
    return s
  }, [notebookPinLinks])

  const savedNotebooks = useMemo<Notebook[]>(() => {
    const list: Notebook[] = []
    for (const l of notebookPinLinks) {
      const id = parseNotebookIdFromUserLinkUrl(l.url)
      if (!id) continue
      list.push({
        id,
        title: l.title?.trim() || 'Notebook',
        created_at: l.created_at,
        // Saved notebooks come from pinned links; publish state unknown here.
        published: false
      } as Notebook)
    }
    return list
  }, [notebookPinLinks])

  const pinNotebookToBookmarkLinks = useCallback(
    async (nb: { id: string; title: string }) => {
      if (typeof window === 'undefined') return false
      if (bookmarkedNotebookIds.has(nb.id)) return true
      const url = notebookAbsoluteUrl(nb.id, window.location.origin)
      const row = await addLink(url, {
        title: nb.title,
        note: 'Pinned from your notebooks'
      })
      if (row) await loadLinks()
      return !!row
    },
    [bookmarkedNotebookIds, loadLinks]
  )

  const loadPersonalLinks = useCallback(async () => {
    const list = await listMyPersonalLinks()
    setPersonalLinks(list)
  }, [])

  const loadNotebooks = useCallback(async () => {
    setNotebooksLoading(true)
    const list = await getMyNotebooks()
    setNotebooks(list)
    setNotebooksLoading(false)
  }, [])

  const openNotebookCreateModal = () => {
    setNotebookNewTitle('')
    setNotebookCreateModalOpen(true)
  }

  const closeNotebookCreateModal = () => {
    if (notebookCreating) return
    setNotebookCreateModalOpen(false)
    setNotebookNewTitle('')
  }

  const handleCreateNotebook = async () => {
    if (notebookCreating) return
    const title = notebookNewTitle.trim() || 'Untitled notebook'
    setNotebookCreating(true)
    try {
      const row = await createNotebook(title)
      if (row) {
        await loadNotebooks()
        closeNotebookCreateModal()
        await router.push(`/notebook/${row.id}`)
      }
    } finally {
      setNotebookCreating(false)
    }
  }

  useEffect(() => {
    if (!effectiveUser) return
    loadLinks()
  }, [effectiveUser, linkFilterTagId, loadLinks])

  useEffect(() => {
    if (!effectiveUser) return
    void loadNotebooks()
  }, [effectiveUser, loadNotebooks])

  useEffect(() => {
    if (!effectiveUser?.id) return
    void getProfileInterestsByUserId(effectiveUser.id).then(setProfileInterests)
  }, [effectiveUser?.id])

  useEffect(() => {
    if (!effectiveUser?.id) return
    void loadPersonalLinks()
  }, [effectiveUser?.id, loadPersonalLinks])

  useEffect(() => {
    if (isEditingProfile) setBioDraft(bioText)
  }, [isEditingProfile, bioText])

  const saveBio = async () => {
    const supabase = getSupabaseClient()
    if (!supabase || !effectiveUser) return
    setBioSaving(true)
    const trimmed = bioDraft.trim()
    const { data, error } = await supabase.auth.updateUser({
      data: {
        ...effectiveUser.user_metadata,
        bio: trimmed
      }
    })
    setBioSaving(false)
    if (error) {
      window.alert(error.message)
      return
    }
    if (data.user) {
      setCachedAuth(data.user, getCachedAuth().profile)
      if (!user) setResolvedUser(data.user)
      setBioDraft('')
    }
  }

  const saveProfile = async () => {
    const next = bioDraft.trim()
    if (next !== bioText) {
      await saveBio()
    }
    setIsEditingProfile(false)
  }

  function PencilIcon() {
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
          d='M8.6 2.2l3.2 3.2M3 11.2l2.9-.6 6.1-6.1a.9.9 0 0 0 0-1.3L10.8 2a.9.9 0 0 0-1.3 0L3.4 8.1 3 11.2Z'
          stroke='currentColor'
          strokeWidth='1.2'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    )
  }

  function CheckIcon() {
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
          d='M11.5 4L6 10l-2.5-2.6'
          stroke='currentColor'
          strokeWidth='1.6'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    )
  }

  const handleCreateTag = async () => {
    const name = newTagName.trim()
    if (!name || tagSubmitting) return
    setTagSubmitting(true)
    const tag = await createTag(name)
    if (tag) {
      setLinkTags((prev) =>
        [...prev, tag].sort((a, b) => a.name.localeCompare(b.name))
      )
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
        if (linkFilterTagId && !link.tag_ids.includes(linkFilterTagId))
          return prev
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
    if (
      !linkActionOverlay ||
      linkActionOverlay.type !== 'edit-note' ||
      editSubmitting
    )
      return
    setEditSubmitting(true)
    const updated = await updateLink(linkActionOverlay.link.id, {
      note: editNote
    })
    if (updated) {
      setUserLinks((prev) =>
        prev.map((l) => (l.id === linkActionOverlay.link.id ? updated : l))
      )
      closeLinkActionOverlay()
    }
    setEditSubmitting(false)
  }

  const handleSaveAddTag = async () => {
    if (
      !linkActionOverlay ||
      linkActionOverlay.type !== 'add-tag' ||
      editSubmitting
    )
      return
    setEditSubmitting(true)
    const updated = await updateLink(linkActionOverlay.link.id, {
      tagIds: editTagIds,
      isPrivate: editIsPrivate
    })
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
    return () => {
      cancelled = true
    }
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
          <link rel='preconnect' href='https://use.typekit.net' />
          <link rel='preconnect' href='https://p.typekit.net' />
          <link rel='stylesheet' href='https://use.typekit.net/vxh3dki.css' />
          <link rel='preconnect' href='https://fonts.googleapis.com' />
          <link
            rel='stylesheet'
            href='https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,100..900;1,100..900&display=swap'
          />
        </Head>
        <HomeHeader hideAccountActions />
        <div className={styles.pageShell}>
          <div className={styles.loading}>Loading…</div>
        </div>
        <HomeFooterSection />
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
    profile?.avatar_url ||
    (effectiveUser.user_metadata?.avatar_url as string | undefined)
  return (
    <>
      <Head>
        <title>Profile – {siteName}</title>
        <link rel='preconnect' href='https://use.typekit.net' />
        <link rel='preconnect' href='https://p.typekit.net' />
        <link rel='stylesheet' href='https://use.typekit.net/vxh3dki.css' />
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link
          rel='stylesheet'
          href='https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,100..900;1,100..900&display=swap'
        />
      </Head>
      <HomeHeader hideAccountActions />
      <div className={styles.pageShell}>
        <div className={styles.profileGrid}>
          <aside className={styles.profileSidebar}>
            {/* Next 12: default Link legacy behavior drops className; false applies it to <a>. */}
            <ProfileSidebarBackHome />
            <div className={styles.sidebarAvatarWrap}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=''
                  className={styles.sidebarAvatar}
                  width={96}
                  height={96}
                />
              ) : (
                <div className={styles.sidebarAvatarPlaceholder}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h1 className={styles.sidebarName}>{displayName}</h1>
            <div className={styles.sidebarFollowLine}>
              <button
                type='button'
                className={styles.sidebarFollowBtn}
                onClick={() => {
                  setConnectionsTab('following')
                  setView('connections')
                }}
              >
                {followingCount} following
              </button>
              <FollowCountDividerDot />
              <button
                type='button'
                className={styles.sidebarFollowBtn}
                onClick={() => {
                  setConnectionsTab('followers')
                  setView('connections')
                }}
              >
                {followersCount} followers
              </button>
            </div>
            {effectiveUser?.id ? (
              <div className={styles.sidebarProfileMeta}>
                <div className={styles.sidebarProfileMetaPreview}>
                  {isEditingProfile ? (
                    <textarea
                      value={bioDraft}
                      onChange={(e) => setBioDraft(e.target.value)}
                      placeholder='A short line about you…'
                      className={styles.sidebarPersonalBioTextarea}
                      rows={4}
                      maxLength={500}
                      aria-label='Personal bio'
                      autoFocus
                      disabled={bioSaving}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.preventDefault()
                          setIsEditingProfile(false)
                        }
                        if (
                          e.key === 'Enter' &&
                          (e.metaKey || e.ctrlKey)
                        ) {
                          e.preventDefault()
                          void saveProfile()
                        }
                      }}
                      title='⌘/Ctrl+Enter to save'
                    />
                  ) : bioText ? (
                    <p className={styles.sidebarBio}>{bioText}</p>
                  ) : null}
                  {isEditingProfile ? (
                    <ProfileInterestsPanel
                      userId={effectiveUser.id}
                      editable
                      initialTags={profileInterests}
                      onTagsChange={setProfileInterests}
                      inline
                    />
                  ) : profileInterests.length > 0 ? (
                    <div className={styles.profileInterestTags}>
                      {profileInterests.map((t) => (
                        <Link
                          key={t}
                          href={{ pathname: '/users', query: { interest: t } }}
                          legacyBehavior={false}
                          className={styles.profileInterestTag}
                        >
                          {t}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                  {isEditingProfile ? (
                    <ProfilePersonalLinksPanel
                      links={personalLinks}
                      editable
                      onRefresh={() => void loadPersonalLinks()}
                      inline
                    />
                  ) : personalLinks.length > 0 ? (
                    <ul className={styles.sidebarPersonalLinksList}>
                      {personalLinks.map((l) => (
                        <li
                          key={l.id}
                          className={styles.sidebarPersonalLinkItem}
                        >
                          <div className={styles.sidebarPersonalLinkCard}>
                            <ProfilePersonalLinkAnchorRow link={l} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {!bioText &&
                  profileInterests.length === 0 &&
                  personalLinks.length === 0 &&
                  !isEditingProfile ? (
                    <p className={styles.sidebarMetaPreviewEmpty}>
                      Your bio, interests, and links will appear here.
                    </p>
                  ) : null}
                </div>
                <div className={styles.sidebarEditProfileRow}>
                  <button
                    type='button'
                    className={
                      isEditingProfile
                        ? `${styles.sidebarEditProfileBtn} ${styles.sidebarEditProfileBtnActive}`
                        : styles.sidebarEditProfileBtn
                    }
                    onClick={() => {
                      if (isEditingProfile) {
                        void saveProfile()
                      } else {
                        setIsEditingProfile(true)
                      }
                    }}
                    aria-label={isEditingProfile ? 'Save profile' : 'Edit profile'}
                    title={isEditingProfile ? 'Save profile' : 'Edit profile'}
                    disabled={bioSaving}
                  >
                    {isEditingProfile ? <CheckIcon /> : <PencilIcon />}
                  </button>
                </div>
              </div>
            ) : null}
          </aside>

          <div className={styles.profileMain}>
            {view === 'connections' && (
              <div className={styles.mainPanel}>
                <button
                  type='button'
                  className={styles.backToProfile}
                  onClick={() => setView('profile')}
                >
                  <ProfileBackArrow className={styles.sidebarBackArrow} />
                  Profile
                </button>
                <h2 className={styles.mainSerifTitle}>
                  {connectionsTab === 'followers'
                    ? 'Followers'
                    : 'Following'}
                </h2>
                <nav
                  className={styles.connectionsTabs}
                  role='tablist'
                  aria-label='Followers and following'
                >
                  <button
                    type='button'
                    role='tab'
                    aria-selected={connectionsTab === 'followers'}
                    className={
                      connectionsTab === 'followers'
                        ? styles.connectionsTabActive
                        : styles.connectionsTab
                    }
                    onClick={() => setConnectionsTab('followers')}
                  >
                    Followers
                  </button>
                  <button
                    type='button'
                    role='tab'
                    aria-selected={connectionsTab === 'following'}
                    className={
                      connectionsTab === 'following'
                        ? styles.connectionsTabActive
                        : styles.connectionsTab
                    }
                    onClick={() => setConnectionsTab('following')}
                  >
                    Following
                  </button>
                </nav>
                {connectionsTab === 'followers' ? (
                  followersList.length === 0 ? (
                    <p className={styles.placeholder}>No followers yet.</p>
                  ) : (
                    <ul className={styles.userList}>
                      {followersList.map((u) => {
                        const selfId = effectiveUser?.id
                        const showFollow = !!selfId && u.user_id !== selfId
                        const isFollowingRow = followingIds.has(u.user_id)
                        const busy = rowFollowBusyId === u.user_id
                        return (
                          <li key={u.user_id} className={styles.userListItem}>
                            <a
                              href={`/profile/${u.user_id}`}
                              className={styles.userListLink}
                            >
                              {u.avatar_url ? (
                                <img
                                  src={u.avatar_url}
                                  alt=''
                                  className={styles.userListAvatar}
                                  width={40}
                                  height={40}
                                />
                              ) : (
                                <span
                                  className={styles.userListAvatarPlaceholder}
                                  aria-hidden
                                >
                                  {(u.display_name || 'U')
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              )}
                              <span className={styles.userListLinkText}>
                                {u.display_name || 'User'}
                              </span>
                            </a>
                            {showFollow ? (
                              <button
                                type='button'
                                className={
                                  isFollowingRow
                                    ? `${styles.followingBtn} ${styles.userListFollowBtn}`
                                    : `${styles.followBtn} ${styles.userListFollowBtn}`
                                }
                                disabled={busy || rowFollowBusyId !== null}
                                onClick={() =>
                                  void handleConnectionRowFollowToggle(
                                    u.user_id
                                  )
                                }
                              >
                                {busy
                                  ? '…'
                                  : isFollowingRow
                                    ? 'Following'
                                    : 'Follow'}
                              </button>
                            ) : null}
                          </li>
                        )
                      })}
                    </ul>
                  )
                ) : followingList.length === 0 ? (
                  <p className={styles.placeholder}>
                    Not following anyone yet.
                  </p>
                ) : (
                  <ul className={styles.userList}>
                    {followingList.map((u) => {
                      const selfId = effectiveUser?.id
                      const showFollow = !!selfId && u.user_id !== selfId
                      const isFollowingRow = followingIds.has(u.user_id)
                      const busy = rowFollowBusyId === u.user_id
                      return (
                        <li key={u.user_id} className={styles.userListItem}>
                          <a
                            href={`/profile/${u.user_id}`}
                            className={styles.userListLink}
                          >
                            {u.avatar_url ? (
                              <img
                                src={u.avatar_url}
                                alt=''
                                className={styles.userListAvatar}
                                width={40}
                                height={40}
                              />
                            ) : (
                              <span
                                className={styles.userListAvatarPlaceholder}
                                aria-hidden
                              >
                                {(u.display_name || 'U')
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                            )}
                            <span className={styles.userListLinkText}>
                              {u.display_name || 'User'}
                            </span>
                          </a>
                          {showFollow ? (
                            <button
                              type='button'
                              className={
                                isFollowingRow
                                  ? `${styles.followingBtn} ${styles.userListFollowBtn}`
                                  : `${styles.followBtn} ${styles.userListFollowBtn}`
                              }
                              disabled={busy || rowFollowBusyId !== null}
                              onClick={() =>
                                void handleConnectionRowFollowToggle(u.user_id)
                              }
                            >
                              {busy
                                ? '…'
                                : isFollowingRow
                                  ? 'Following'
                                  : 'Follow'}
                            </button>
                          ) : null}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )}

            {view === 'profile' && (
              <div className={styles.mainPanel}>
                <div className={styles.primaryTabsRow}>
                  <nav
                    className={styles.primaryTabs}
                    role='tablist'
                    aria-label='Profile content'
                  >
                    <button
                      type='button'
                      role='tab'
                      aria-selected={mainTab === 'notebooks'}
                      className={
                        mainTab === 'notebooks'
                          ? styles.primaryTabActive
                          : styles.primaryTab
                      }
                      onClick={() => setMainTab('notebooks')}
                    >
                      Notebooks
                    </button>
                    <button
                      type='button'
                      role='tab'
                      aria-selected={mainTab === 'bookmarks'}
                      className={
                        mainTab === 'bookmarks'
                          ? styles.primaryTabActive
                          : styles.primaryTab
                      }
                      onClick={() => setMainTab('bookmarks')}
                    >
                      Bookmarks
                    </button>
                    <button
                      type='button'
                      role='tab'
                      aria-selected={mainTab === 'activity'}
                      className={
                        mainTab === 'activity'
                          ? styles.primaryTabActive
                          : styles.primaryTab
                      }
                      onClick={() => setMainTab('activity')}
                    >
                      Activity
                    </button>
                  </nav>

                  <div className={styles.primaryTabsRightActions} />
                </div>

                {mainTab === 'bookmarks' && (
                  <div className={styles.tabPanel}>
                    <div className={styles.tabPanelHeaderRow}>
                      <h2 className={styles.mainSerifTitle}>Bookmarks</h2>
                      {bookmarksSubTab === 'saved' ? (
                        <div className={styles.primaryTabsRightActions}>
                          <button
                            type='button'
                            className={styles.linkFilterBtnNew}
                            onClick={() => setShowNewTagInput(true)}
                          >
                            + New tag
                          </button>
                          <button
                            type='button'
                            className={styles.addLinkBtn}
                            onClick={() => setShowAddLinkModal(true)}
                          >
                            + New Link
                          </button>
                        </div>
                      ) : (
                        <div />
                      )}
                    </div>
                    <nav
                      className={styles.activitySubTabs}
                      role='tablist'
                      aria-label='Bookmarks type'
                    >
                      <button
                        type='button'
                        role='tab'
                        aria-selected={bookmarksSubTab === 'saved'}
                        className={
                          bookmarksSubTab === 'saved'
                            ? styles.activitySubTabActive
                            : styles.activitySubTab
                        }
                        onClick={() => setBookmarksSubTab('saved')}
                      >
                        Saved links
                      </button>
                      <button
                        type='button'
                        role='tab'
                        aria-selected={bookmarksSubTab === 'notebookPins'}
                        className={
                          bookmarksSubTab === 'notebookPins'
                            ? styles.activitySubTabActive
                            : styles.activitySubTab
                        }
                        onClick={() => setBookmarksSubTab('notebookPins')}
                      >
                        Notebook bookmarks
                      </button>
                      <button
                        type='button'
                        role='tab'
                        aria-selected={bookmarksSubTab === 'courses'}
                        className={
                          bookmarksSubTab === 'courses'
                            ? styles.activitySubTabActive
                            : styles.activitySubTab
                        }
                        onClick={() => setBookmarksSubTab('courses')}
                      >
                        Course bookmarks
                      </button>
                      <button
                        type='button'
                        role='tab'
                        aria-selected={bookmarksSubTab === 'community'}
                        className={
                          bookmarksSubTab === 'community'
                            ? styles.activitySubTabActive
                            : styles.activitySubTab
                        }
                        onClick={() => setBookmarksSubTab('community')}
                      >
                        Community resources
                      </button>
                    </nav>
                    {bookmarksSubTab === 'saved' && (
                    <div className={styles.section}>
                      <div className={styles.linkFilterRow}>
                        <div className={styles.linkFilterTagsWrap}>
                          <button
                            type='button'
                            className={
                              linkFilterTagId === null
                                ? styles.linkFilterBtnActive
                                : styles.linkFilterBtn
                            }
                            onClick={() => setLinkFilterTagId(null)}
                          >
                            All
                          </button>
                          {linkTags.map((t) => (
                            <button
                              key={t.id}
                              type='button'
                              className={
                                linkFilterTagId === t.id
                                  ? styles.linkFilterBtnActive
                                  : styles.linkFilterBtn
                              }
                              onClick={() => setLinkFilterTagId(t.id)}
                            >
                              {t.name}
                            </button>
                          ))}
                          {showNewTagInput ? (
                            <input
                              type='text'
                              className={styles.linkFilterNewTagInput}
                              placeholder='New tag'
                              value={newTagName}
                              aria-label='New tag name'
                              onChange={(e) => setNewTagName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  void handleCreateTag()
                                }
                                if (e.key === 'Escape') {
                                  e.preventDefault()
                                  setShowNewTagInput(false)
                                  setNewTagName('')
                                }
                              }}
                              onBlur={() => {
                                window.setTimeout(() => {
                                  if (tagSubmittingRef.current) return
                                  setShowNewTagInput(false)
                                  setNewTagName('')
                                }, 0)
                              }}
                              disabled={tagSubmitting}
                              autoFocus
                            />
                          ) : null}
                        </div>
                      </div>
                      {showAddLinkModal && (
                        <div
                          className={styles.modalBackdrop}
                          onClick={closeAddLinkModal}
                          role='presentation'
                        >
                          <div
                            className={styles.modalCard}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className={styles.modalHeader}>
                              <h3 className={styles.modalTitle}>
                                Add New Bookmark
                              </h3>
                              <button
                                type='button'
                                className={styles.modalClose}
                                onClick={closeAddLinkModal}
                                aria-label='Close'
                              >
                                ×
                              </button>
                            </div>
                            <form
                              className={styles.modalForm}
                              onSubmit={handleAddLink}
                            >
                              <label className={styles.modalLabel}>
                                Title{' '}
                                <input
                                  type='text'
                                  className={styles.modalInput}
                                  placeholder='My Awesome Link'
                                  value={linkFormTitle}
                                  onChange={(e) =>
                                    setLinkFormTitle(e.target.value)
                                  }
                                />
                              </label>
                              <label className={styles.modalLabel}>
                                <span className={styles.modalLabelCaption}>
                                  URL{' '}
                                  <span className={styles.modalRequired}>*</span>
                                </span>
                                <input
                                  type='url'
                                  className={styles.modalInput}
                                  placeholder='https://example.com'
                                  value={linkFormUrl}
                                  onChange={(e) =>
                                    setLinkFormUrl(e.target.value)
                                  }
                                  required
                                />
                              </label>
                              <label className={styles.modalLabel}>
                                Description{' '}
                                <textarea
                                  className={styles.modalTextarea}
                                  placeholder='A brief description of this bookmark...'
                                  value={linkFormNote}
                                  onChange={(e) =>
                                    setLinkFormNote(e.target.value)
                                  }
                                  rows={3}
                                />
                              </label>
                              <div className={styles.modalLabel}>
                                <span>Tags</span>
                                <div
                                  className={styles.tagPillsWrap}
                                  role='group'
                                  aria-label='Select tags'
                                >
                                  {linkTags.map((t) => {
                                    const selected = linkFormTagIds.includes(
                                      t.id
                                    )
                                    return (
                                      <button
                                        key={t.id}
                                        type='button'
                                        className={
                                          selected
                                            ? styles.tagPillSelected
                                            : styles.tagPill
                                        }
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
                                    <span className={styles.tagPillsEmpty}>
                                      No tags yet. Add one in the filter row.
                                    </span>
                                  )}
                                </div>
                              </div>
                              <label className={styles.modalCheckboxLabel}>
                                <input
                                  type='checkbox'
                                  checked={linkFormIsPrivate}
                                  onChange={(e) =>
                                    setLinkFormIsPrivate(e.target.checked)
                                  }
                                  className={styles.modalCheckbox}
                                />
                                <span>Private – only visible to you</span>
                              </label>
                              <div className={styles.modalActions}>
                                <button
                                  type='button'
                                  className={styles.modalCancelBtn}
                                  onClick={closeAddLinkModal}
                                >
                                  Cancel
                                </button>
                                <button
                                  type='submit'
                                  className={styles.modalSubmitBtn}
                                  disabled={
                                    linkSubmitting || !linkFormUrl.trim()
                                  }
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
                          No links yet. Click “Add a new link” to add a
                          bookmark.
                        </p>
                      ) : (
                        <ul className={styles.userLinksList}>
                          {userLinks.map((l) => {
                            return (
                              <li key={l.id} className={styles.userLinkItem}>
                                <div className={styles.userLinkItemInner}>
                                  <span className={styles.userLinkIconWrap}>
                                    {/*
                                      Previous favicon / default icon logic kept for future use:

                                      {faviconDomain ? (
                                        <img
                                          src={getFaviconUrl(faviconDomain)}
                                          alt=''
                                          className={styles.userLinkIcon}
                                          width={20}
                                          height={20}
                                        />
                                      ) : (
                                        <span
                                          className={styles.userLinkIconDefault}
                                          aria-hidden
                                        >
                                          <svg
                                            width='20'
                                            height='20'
                                            viewBox='0 0 24 24'
                                            fill='none'
                                            stroke='currentColor'
                                            strokeWidth='2'
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                          >
                                            <path d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71' />
                                            <path d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' />
                                          </svg>
                                        </span>
                                      )}
                                    */}
                                    <span className={styles.userLinkIconBlue} aria-hidden>
                                      <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        width='8'
                                        height='8'
                                        viewBox='0 0 8 8'
                                        fill='none'
                                      >
                                        <path
                                          d='M4.14058 1.91562L4.44058 1.61249C4.70255 1.37372 5.04645 1.24506 5.40081 1.25327C5.75518 1.26147 6.09276 1.4059 6.3434 1.65654C6.59404 1.90718 6.73847 2.24476 6.74667 2.59913C6.75488 2.95349 6.62622 3.29739 6.38745 3.55937L5.44058 4.50312C5.31312 4.63105 5.16166 4.73256 4.99488 4.80183C4.8281 4.87109 4.64929 4.90674 4.4687 4.90674C4.28811 4.90674 4.1093 4.87109 3.94252 4.80183C3.77574 4.73256 3.62428 4.63105 3.49683 4.50312'
                                          stroke='#FDFDFD'
                                          strokeWidth='0.75'
                                          strokeLinecap='round'
                                          strokeLinejoin='round'
                                        />
                                        <path
                                          d='M3.8594 6.08436L3.5594 6.38749C3.29742 6.62626 2.95352 6.75491 2.59916 6.74671C2.24479 6.7385 1.90721 6.59407 1.65657 6.34343C1.40593 6.09279 1.2615 5.75521 1.2533 5.40085C1.2451 5.04648 1.37375 4.70258 1.61252 4.44061L2.5594 3.49686C2.68685 3.36893 2.83831 3.26742 3.00509 3.19815C3.17187 3.12889 3.35068 3.09323 3.53127 3.09323C3.71186 3.09323 3.89067 3.12889 4.05745 3.19815C4.22423 3.26742 4.37569 3.36893 4.50315 3.49686'
                                          stroke='#FDFDFD'
                                          strokeWidth='0.75'
                                          strokeLinecap='round'
                                          strokeLinejoin='round'
                                        />
                                      </svg>
                                    </span>
                                  </span>
                                  <div className={styles.userLinkContent}>
                                    <div className={styles.userLinkRow}>
                                      <span className={styles.userLinkTitleAndDomain}>
                                        <a
                                          href={l.url}
                                          target='_blank'
                                          rel='noopener noreferrer'
                                          className={styles.userLinkUrl}
                                        >
                                          {l.title || l.url}
                                        </a>
                                        {(() => {
                                          try {
                                            return (
                                              <span className={styles.userLinkDomain}>
                                                {new URL(l.url).hostname}
                                              </span>
                                            )
                                          } catch {
                                            return null
                                          }
                                        })()}
                                      </span>
                                      <div className={styles.userLinkActions}>
                                        <button
                                          type='button'
                                          className={styles.userLinkActionBtn}
                                          onClick={() =>
                                            openLinkAction('edit-note', l)
                                          }
                                          aria-label='Edit note'
                                          title='Edit note'
                                        >
                                          Note
                                        </button>
                                        <button
                                          type='button'
                                          className={styles.userLinkActionBtn}
                                          onClick={() =>
                                            openLinkAction('add-tag', l)
                                          }
                                          aria-label='Add tag'
                                          title='Tag page'
                                        >
                                          Tag
                                        </button>
                                        <button
                                          type='button'
                                          className={styles.userLinkActionBtn}
                                          onClick={() =>
                                            openLinkAction('delete', l)
                                          }
                                          aria-label='Delete link'
                                          title='Delete'
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                    <div className={styles.userLinkMeta}>
                                      <div className={styles.userLinkMetaTags}>
                                        {l.is_private && (
                                          <button
                                            type='button'
                                            className={styles.userLinkTagPrivate}
                                            onClick={() =>
                                              setShowPrivateMessageForLinkId(
                                                (id) =>
                                                  id === l.id ? null : l.id
                                              )
                                            }
                                            title='This link is only visible to you'
                                          >
                                            Private
                                          </button>
                                        )}
                                        {l.note ? (
                                          <button
                                            type='button'
                                            className={styles.userLinkNoteToggle}
                                            onClick={() =>
                                              setShowNoteForLinkId((cur) =>
                                                cur === l.id ? null : l.id
                                              )
                                            }
                                          >
                                            Note
                                          </button>
                                        ) : null}
                                        {l.tag_names?.length > 0 &&
                                          l.tag_names.map((name) => (
                                            <span
                                              key={name}
                                              className={styles.userLinkTag}
                                            >
                                              {name}
                                            </span>
                                          ))}
                                      </div>
                                      <span className={styles.userLinkDate}>
                                        {formatDate(l.created_at)}
                                      </span>
                                      {l.note && showNoteForLinkId === l.id ? (
                                        <p className={styles.userLinkNote}>
                                          {l.note}
                                        </p>
                                      ) : null}
                                    </div>
                                    {showPrivateMessageForLinkId === l.id && (
                                      <p
                                        className={styles.privateMessage}
                                        role='status'
                                      >
                                        This link is only visible to you.
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                      {linkActionOverlay && (
                        <div
                          className={styles.modalBackdrop}
                          onClick={closeLinkActionOverlay}
                          role='presentation'
                        >
                          <div
                            className={styles.actionOverlayCard}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {linkActionOverlay.type === 'edit-note' && (
                              <>
                                <h4 className={styles.actionOverlayTitle}>
                                  Edit note
                                </h4>
                                <textarea
                                  className={styles.actionOverlayInput}
                                  placeholder='Note (optional)'
                                  value={editNote}
                                  onChange={(e) => setEditNote(e.target.value)}
                                  rows={3}
                                  autoFocus
                                />
                                <div className={styles.actionOverlayActions}>
                                  <button
                                    type='button'
                                    className={styles.actionOverlayCancel}
                                    onClick={closeLinkActionOverlay}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type='button'
                                    className={styles.actionOverlaySave}
                                    onClick={handleSaveEditNote}
                                    disabled={editSubmitting}
                                  >
                                    {editSubmitting ? '…' : 'Save'}
                                  </button>
                                </div>
                              </>
                            )}
                            {linkActionOverlay.type === 'add-tag' && (
                              <>
                                <h4 className={styles.actionOverlayTitle}>
                                  Tag page
                                </h4>
                                <div
                                  className={styles.tagPillsWrap}
                                  role='group'
                                  aria-label='Select tags'
                                >
                                  {linkTags.map((t) => {
                                    const selected = editTagIds.includes(t.id)
                                    return (
                                      <button
                                        key={t.id}
                                        type='button'
                                        className={
                                          selected
                                            ? styles.tagPillSelected
                                            : styles.tagPill
                                        }
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
                                    <span className={styles.tagPillsEmpty}>
                                      No tags yet.
                                    </span>
                                  )}
                                </div>
                                <label className={styles.actionOverlayCheckbox}>
                                  <input
                                    type='checkbox'
                                    checked={editIsPrivate}
                                    onChange={(e) =>
                                      setEditIsPrivate(e.target.checked)
                                    }
                                    className={
                                      styles.actionOverlayCheckboxInput
                                    }
                                  />
                                  <span>Only visible to you</span>
                                </label>
                                <div className={styles.actionOverlayActions}>
                                  <button
                                    type='button'
                                    className={styles.actionOverlayCancel}
                                    onClick={closeLinkActionOverlay}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type='button'
                                    className={styles.actionOverlaySave}
                                    onClick={handleSaveAddTag}
                                    disabled={editSubmitting}
                                  >
                                    {editSubmitting ? '…' : 'Save'}
                                  </button>
                                </div>
                              </>
                            )}
                            {linkActionOverlay.type === 'delete' && (
                              <>
                                <h4 className={styles.actionOverlayTitle}>
                                  Delete link?
                                </h4>
                                <p className={styles.actionOverlayText}>
                                  This bookmark will be removed.
                                </p>
                                <div className={styles.actionOverlayActions}>
                                  <button
                                    type='button'
                                    className={styles.actionOverlayCancel}
                                    onClick={closeLinkActionOverlay}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type='button'
                                    className={styles.actionOverlayDelete}
                                    onClick={() =>
                                      handleDeleteLink(
                                        linkActionOverlay.link.id
                                      )
                                    }
                                  >
                                    Delete
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    )}
                    {bookmarksSubTab === 'notebookPins' && (
                    <div className={styles.section}>
                      {linksLoading ? (
                        <p className={styles.placeholder}>Loading…</p>
                      ) : notebookPinLinks.length === 0 ? (
                        <p className={styles.placeholder}>
                          No notebook shortcuts yet. Use “Bookmark” on a
                          notebook in the Notebooks tab to list it here.
                        </p>
                      ) : (
                        <ul className={styles.list}>
                          {notebookPinLinks.map((l) => (
                              <li key={l.id} className={styles.listItem}>
                                <Link
                                  href={notebookUserLinkHref(l.url)}
                                  legacyBehavior={false}
                                  className={styles.listLink}
                                >
                                  <span className={styles.listTitle}>
                                    {l.title?.trim() || 'Notebook'}
                                  </span>
                                  <span className={styles.listMeta}>
                                    Notebook · {formatDate(l.created_at)}
                                  </span>
                                </Link>
                              </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    )}
                    {bookmarksSubTab === 'courses' && (
                    <div className={styles.section}>
                      {activityLoading ? (
                        <p className={styles.placeholder}>Loading…</p>
                      ) : bookmarks.length === 0 ? (
                        <p className={styles.placeholder}>
                          No bookmarks yet. Use “Save course” on a course page
                          to add one.
                        </p>
                      ) : (
                        <ul className={styles.list}>
                          {bookmarks.map(({ bookmark, course }) => (
                            <li key={bookmark.id} className={styles.listItem}>
                              <Link
                                href={course.url ?? `/${course.notion_page_id}`}
                              >
                                <a className={styles.listLink}>
                                  <span className={styles.listTitle}>
                                    {course.name}
                                  </span>
                                  <span className={styles.listMeta}>
                                    {formatDate(bookmark.created_at)}
                                  </span>
                                </a>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    )}
                    {bookmarksSubTab === 'community' && (
                    <div className={styles.section}>
                      {activityLoading ? (
                        <p className={styles.placeholder}>Loading…</p>
                      ) : resourceBookmarks.length === 0 ? (
                        <p className={styles.placeholder}>
                          No saved resources yet. On a course page, open the
                          Community Wall tab and bookmark a resource to see it
                          here.
                        </p>
                      ) : (
                        <ul className={styles.list}>
                          {resourceBookmarks.map(
                            ({ bookmark, resource, course }) => (
                              <li key={bookmark.id} className={styles.listItem}>
                                <Link
                                  href={
                                    course.url ?? `/${course.notion_page_id}`
                                  }
                                >
                                  <a className={styles.listLink}>
                                    <span className={styles.listTitle}>
                                      {resource.title}
                                    </span>
                                    <span className={styles.listMeta}>
                                      {course.name} ·{' '}
                                      {formatDate(bookmark.created_at)}
                                    </span>
                                  </a>
                                </Link>
                                {resource.description ? (
                                  <p className={styles.listBody}>
                                    {resource.description.length > 220
                                      ? `${resource.description.slice(0, 220)}…`
                                      : resource.description}
                                  </p>
                                ) : null}
                                {resource.link ? (
                                  <p className={styles.notificationMeta}>
                                    <a
                                      href={resource.link}
                                      target='_blank'
                                      rel='noopener noreferrer'
                                      className={styles.inlineLink}
                                    >
                                      {resource.link}
                                    </a>
                                  </p>
                                ) : null}
                              </li>
                            )
                          )}
                        </ul>
                      )}
                    </div>
                    )}
                  </div>
                )}

                {mainTab === 'activity' && (
                  <div className={styles.tabPanel}>
                    <h2 className={styles.mainSerifTitle}>Activity</h2>
                    <nav
                      className={styles.activitySubTabs}
                      role='tablist'
                      aria-label='Activity type'
                    >
                      <button
                        type='button'
                        role='tab'
                        aria-selected={activitySubTab === 'feed'}
                        className={
                          activitySubTab === 'feed'
                            ? styles.activitySubTabActive
                            : styles.activitySubTab
                        }
                        onClick={() => setActivitySubTab('feed')}
                      >
                        Feed
                      </button>
                      <button
                        type='button'
                        role='tab'
                        aria-selected={activitySubTab === 'comments'}
                        className={
                          activitySubTab === 'comments'
                            ? styles.activitySubTabActive
                            : styles.activitySubTab
                        }
                        onClick={() => setActivitySubTab('comments')}
                      >
                        Comments
                      </button>
                      <button
                        type='button'
                        role='tab'
                        aria-selected={activitySubTab === 'annotations'}
                        className={
                          activitySubTab === 'annotations'
                            ? styles.activitySubTabActive
                            : styles.activitySubTab
                        }
                        onClick={() => setActivitySubTab('annotations')}
                      >
                        Annotations
                      </button>
                      <button
                        type='button'
                        role='tab'
                        aria-selected={activitySubTab === 'replies'}
                        className={
                          activitySubTab === 'replies'
                            ? styles.activitySubTabActive
                            : styles.activitySubTab
                        }
                        onClick={() => setActivitySubTab('replies')}
                      >
                        Replies
                      </button>
                    </nav>

                    {activityLoading && (
                      <p className={styles.placeholder}>Loading…</p>
                    )}

                    {!activityLoading &&
                      activitySubTab === 'feed' &&
                      (feedItems.length === 0 ? (
                        <p className={styles.placeholder}>
                          Nothing in your feed yet. Subscribe to Community Walls
                          on course pages, and follow people to see new wall
                          posts and their course and resource bookmarks here.
                        </p>
                      ) : (
                        <ul className={styles.list}>
                          {feedItems.map((item) => {
                            const courseHref =
                              item.course_url ?? `/${item.course_id}`
                            const actorLabel =
                              item.actor_display_name?.trim() || 'Someone'
                            return (
                              <li key={item.id} className={styles.listItem}>
                                <div className={styles.listLink}>
                                  <span className={styles.listTitle}>
                                    {item.kind === 'wall_resource' && (
                                      <>
                                        <UserLink
                                          userId={item.actor_id}
                                          displayName={actorLabel}
                                          showFollowingTag={followingIds.has(
                                            item.actor_id
                                          )}
                                          showFollowsYouTag={followerIds.has(
                                            item.actor_id
                                          )}
                                        />
                                        {' added '}
                                        <em>{item.resource_title}</em>
                                        {' to the Community Wall on '}
                                        <Link href={courseHref}>
                                          <a className={styles.inlineLink}>
                                            {item.course_name}
                                          </a>
                                        </Link>
                                      </>
                                    )}
                                    {item.kind === 'followed_course_bookmark' && (
                                      <>
                                        <UserLink
                                          userId={item.actor_id}
                                          displayName={actorLabel}
                                          showFollowingTag={followingIds.has(
                                            item.actor_id
                                          )}
                                          showFollowsYouTag={followerIds.has(
                                            item.actor_id
                                          )}
                                        />
                                        {' saved course '}
                                        <Link href={courseHref}>
                                          <a className={styles.inlineLink}>
                                            {item.course_name}
                                          </a>
                                        </Link>
                                      </>
                                    )}
                                    {item.kind ===
                                      'followed_resource_bookmark' && (
                                      <>
                                        <UserLink
                                          userId={item.actor_id}
                                          displayName={actorLabel}
                                          showFollowingTag={followingIds.has(
                                            item.actor_id
                                          )}
                                          showFollowsYouTag={followerIds.has(
                                            item.actor_id
                                          )}
                                        />
                                        {' bookmarked '}
                                        <em>{item.resource_title}</em>
                                        {' on '}
                                        <Link href={courseHref}>
                                          <a className={styles.inlineLink}>
                                            {item.course_name}
                                          </a>
                                        </Link>
                                      </>
                                    )}
                                  </span>
                                  <span className={styles.listMeta}>
                                    {formatDate(item.created_at)}
                                  </span>
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      ))}

                    {!activityLoading &&
                      activitySubTab === 'comments' &&
                      (comments.length === 0 ? (
                        <p className={styles.placeholder}>
                          You haven’t commented on any course yet. Comments you
                          leave on course pages will appear here.
                        </p>
                      ) : (
                        <ul className={styles.list}>
                          {comments.map(({ comment, course }) => (
                            <li key={comment.id} className={styles.listItem}>
                              <Link
                                href={course.url ?? `/${course.notion_page_id}`}
                              >
                                <a className={styles.listLink}>
                                  <span className={styles.listTitle}>
                                    {course.name}
                                  </span>
                                  <span className={styles.listMeta}>
                                    {formatDate(comment.created_at)}
                                  </span>
                                </a>
                              </Link>
                              <p className={styles.listBody}>{comment.body}</p>
                            </li>
                          ))}
                        </ul>
                      ))}

                    {!activityLoading &&
                      activitySubTab === 'annotations' &&
                      (annotations.length === 0 ? (
                        <p className={styles.placeholder}>
                          You haven’t added annotations yet. Annotations you
                          leave in course sections will appear here.
                        </p>
                      ) : (
                        <ul className={styles.list}>
                          {annotations.map(({ annotation, course }) => (
                            <li key={annotation.id} className={styles.listItem}>
                              <Link
                                href={course.url ?? `/${course.notion_page_id}`}
                              >
                                <a className={styles.listLink}>
                                  <span className={styles.listTitle}>
                                    {course.name}
                                  </span>
                                  <span className={styles.listMeta}>
                                    {formatDate(annotation.created_at)}
                                  </span>
                                </a>
                              </Link>
                              <p className={styles.notificationMeta}>
                                Section: {annotation.section_id}
                              </p>
                              <p className={styles.listBody}>
                                {annotation.body}
                              </p>
                            </li>
                          ))}
                        </ul>
                      ))}

                    {!activityLoading &&
                      activitySubTab === 'replies' &&
                      (notifications.length === 0 ? (
                        <p className={styles.placeholder}>
                          No replies yet. When someone replies to your comment
                          or annotation, it appears here.
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
                                    showFollowingTag={followingIds.has(
                                      n.author_id
                                    )}
                                    showFollowsYouTag={followerIds.has(
                                      n.author_id
                                    )}
                                  />
                                  {' replied on '}
                                  <Link
                                    href={n.course_url ?? `/${n.course_id}`}
                                  >
                                    <a className={styles.inlineLink}>
                                      {n.course_name}
                                    </a>
                                  </Link>
                                </span>
                                <span className={styles.listMeta}>
                                  {formatDate(n.created_at)}
                                </span>
                              </div>
                              {n.type === 'annotation' && n.section_id && (
                                <p className={styles.notificationMeta}>
                                  Section: {n.section_id}
                                </p>
                              )}
                              <p className={styles.listBody}>{n.body}</p>
                            </li>
                          ))}
                        </ul>
                      ))}
                  </div>
                )}

                {mainTab === 'notebooks' && (
                  <div className={styles.tabPanel}>
                    <div className={styles.tabPanelHeaderRow}>
                      <h2 className={styles.mainSerifTitle}>Notebooks</h2>
                      {notebooksSubTab === 'yours' ? (
                        <button
                          type='button'
                          className={styles.notebooksCreateBtn}
                          onClick={openNotebookCreateModal}
                          disabled={notebookCreating}
                        >
                          + Create New
                        </button>
                      ) : (
                        <div />
                      )}
                    </div>
                    <div className={styles.activitySubTabs} role='tablist'>
                      <button
                        type='button'
                        role='tab'
                        aria-selected={notebooksSubTab === 'yours'}
                        className={
                          notebooksSubTab === 'yours'
                            ? styles.activitySubTabActive
                            : styles.activitySubTab
                        }
                        onClick={() => setNotebooksSubTab('yours')}
                      >
                        Your notebooks
                      </button>
                      <button
                        type='button'
                        role='tab'
                        aria-selected={notebooksSubTab === 'saved'}
                        className={
                          notebooksSubTab === 'saved'
                            ? styles.activitySubTabActive
                            : styles.activitySubTab
                        }
                        onClick={() => setNotebooksSubTab('saved')}
                      >
                        Saved notebooks
                      </button>
                    </div>

                    {notebooksSubTab === 'yours' ? (
                      <ProfileNotebooksPanel
                        notebooks={notebooks}
                        loading={notebooksLoading}
                        onRefresh={loadNotebooks}
                        showPublishedBadge
                        subsectionTitle={null}
                        canCreate={false}
                        bookmarkedNotebookIds={bookmarkedNotebookIds}
                        onBookmarkNotebook={pinNotebookToBookmarkLinks}
                      />
                    ) : (
                      <ProfileNotebooksPanel
                        notebooks={savedNotebooks}
                        loading={linksLoading}
                        onRefresh={loadLinks}
                        subsectionTitle={null}
                        emptyHint='No saved notebooks yet.'
                        canCreate={false}
                        bookmarkedNotebookIds={bookmarkedNotebookIds}
                        onBookmarkNotebook={pinNotebookToBookmarkLinks}
                      />
                    )}

                    {notebookCreateModalOpen && (
                      <div
                        className={styles.modalBackdrop}
                        role='presentation'
                        onMouseDown={(e) => {
                          if (e.target === e.currentTarget) closeNotebookCreateModal()
                        }}
                      >
                        <div
                          className={styles.modalCard}
                          role='dialog'
                          aria-modal='true'
                          aria-labelledby='notebook-name-modal-title'
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <div className={styles.modalHeader}>
                            <h2
                              id='notebook-name-modal-title'
                              className={styles.modalTitle}
                            >
                              New notebook
                            </h2>
                            <button
                              type='button'
                              className={styles.modalClose}
                              onClick={closeNotebookCreateModal}
                              aria-label='Close'
                            >
                              ×
                            </button>
                          </div>
                          <div className={styles.modalForm}>
                            <label className={styles.modalLabel}>
                              Name
                              <input
                                type='text'
                                className={styles.modalInput}
                                value={notebookNewTitle}
                                onChange={(e) => setNotebookNewTitle(e.target.value)}
                                placeholder='Untitled notebook'
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') void handleCreateNotebook()
                                  if (e.key === 'Escape') closeNotebookCreateModal()
                                }}
                              />
                            </label>
                            <div className={styles.modalActions}>
                              <button
                                type='button'
                                className={styles.modalCancelBtn}
                                onClick={closeNotebookCreateModal}
                                disabled={notebookCreating}
                              >
                                Cancel
                              </button>
                              <button
                                type='button'
                                className={styles.modalSubmitBtn}
                                onClick={() => void handleCreateNotebook()}
                                disabled={notebookCreating}
                              >
                                {notebookCreating ? 'Creating…' : 'Create'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className={styles.pageFooterBar}>
          <button
            type='button'
            className={styles.signOutFooter}
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
      </div>
      <HomeFooterSection />
    </>
  )
}
