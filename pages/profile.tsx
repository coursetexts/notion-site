import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useFollowerIds } from '@/hooks/useFollowerIds'
import { useFollowingIds } from '@/hooks/useFollowingIds'
import type { User } from '@supabase/supabase-js'

import { HomeFooterSection } from '@/components/HomeFooterSection'
import { HomeHeader } from '@/components/HomeHeader'
import { ProfileInterestsPanel } from '@/components/ProfileInterestsPanel'
import {
  personalLinkDisplayTitle,
  personalLinkKindLabel,
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
  getFollowersCount,
  getFollowersList,
  getFollowingCount,
  getFollowingList
} from '@/lib/follows'
import {
  getFaviconUrl,
  getLinkSiteFaviconDomain
} from '@/lib/link-site-favicon'
import { type Notebook, getMyNotebooks } from '@/lib/notebooks-db'
import { getProfileInterestsByUserId } from '@/lib/profile-interests-db'
import {
  type ProfilePersonalLink,
  listMyPersonalLinks
} from '@/lib/profile-personal-links-db'
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
  const [mainTab, setMainTab] = useState<
    'notebooks' | 'bookmarks' | 'activity'
  >('activity')
  const [activitySubTab, setActivitySubTab] = useState<
    'comments' | 'annotations' | 'replies'
  >('comments')
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
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [notebooksLoading, setNotebooksLoading] = useState(false)
  const [profileInterests, setProfileInterests] = useState<string[]>([])
  const [personalLinks, setPersonalLinks] = useState<ProfilePersonalLink[]>([])
  type SidebarEditMode = null | 'bio' | 'personalLinks' | 'interests'
  const [sidebarEditMode, setSidebarEditMode] = useState<SidebarEditMode>(null)
  const [bioDraft, setBioDraft] = useState('')
  const [bioSaving, setBioSaving] = useState(false)

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
    if (sidebarEditMode === 'bio') {
      setBioDraft(bioText)
    }
  }, [sidebarEditMode, bioText])

  const cancelBioEdit = () => {
    setSidebarEditMode(null)
    setBioDraft('')
  }

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
      setSidebarEditMode(null)
      setBioDraft('')
    }
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
            <Link
              href='/'
              legacyBehavior={false}
              className={styles.sidebarBack}
            >
              ← Back to Home
            </Link>
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
                onClick={() => setView('following')}
              >
                {followingCount} following
              </button>
              <span className={styles.sidebarFollowDot} aria-hidden>
                {' '}
                •{' '}
              </span>
              <button
                type='button'
                className={styles.sidebarFollowBtn}
                onClick={() => setView('followers')}
              >
                {followersCount} followers
              </button>
            </div>
            {effectiveUser?.id ? (
              <div className={styles.sidebarProfileMeta}>
                <div className={styles.sidebarProfileMetaPreview}>
                  {bioText ? (
                    <p className={styles.sidebarBio}>{bioText}</p>
                  ) : null}
                  {profileInterests.length > 0 ? (
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
                  {personalLinks.length > 0 ? (
                    <ul className={styles.sidebarPersonalLinksList}>
                      {personalLinks.map((l) => (
                        <li
                          key={l.id}
                          className={styles.sidebarPersonalLinkItem}
                        >
                          <div className={styles.sidebarPersonalLinkCard}>
                            <a
                              href={l.url}
                              target='_blank'
                              rel='noopener noreferrer'
                              className={styles.sidebarPersonalLinkAnchor}
                            >
                              <span className={styles.linkCardLabel}>
                                {personalLinkKindLabel(l.url)}
                              </span>
                              <span className={styles.sidebarPersonalLinkTitle}>
                                {personalLinkDisplayTitle(l.url, l.title)}
                              </span>
                            </a>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {!bioText &&
                  profileInterests.length === 0 &&
                  personalLinks.length === 0 ? (
                    <p className={styles.sidebarMetaPreviewEmpty}>
                      Your bio, interests, and links will appear here.
                    </p>
                  ) : null}
                </div>
                <hr className={styles.sidebarMetaDivider} aria-hidden />
                <div className={styles.sidebarMetaPickColumn}>
                  <button
                    type='button'
                    className={`${styles.sidebarAddMetaBtn} ${
                      sidebarEditMode === 'bio'
                        ? styles.sidebarMetaPickBtnActive
                        : ''
                    }`.trim()}
                    aria-pressed={sidebarEditMode === 'bio'}
                    onClick={() =>
                      setSidebarEditMode((m) => (m === 'bio' ? null : 'bio'))
                    }
                  >
                    {bioText ? '+ Edit personal bio' : '+ Add personal bio'}
                  </button>
                  <button
                    type='button'
                    className={`${styles.sidebarAddMetaBtn} ${
                      sidebarEditMode === 'personalLinks'
                        ? styles.sidebarMetaPickBtnActive
                        : ''
                    }`.trim()}
                    aria-pressed={sidebarEditMode === 'personalLinks'}
                    onClick={() =>
                      setSidebarEditMode((m) =>
                        m === 'personalLinks' ? null : 'personalLinks'
                      )
                    }
                  >
                    {personalLinks.length > 0
                      ? '+ Edit personal links'
                      : '+ Add personal links'}
                  </button>
                  <button
                    type='button'
                    className={`${styles.sidebarAddMetaBtn} ${
                      sidebarEditMode === 'interests'
                        ? styles.sidebarMetaPickBtnActive
                        : ''
                    }`.trim()}
                    aria-pressed={sidebarEditMode === 'interests'}
                    onClick={() =>
                      setSidebarEditMode((m) =>
                        m === 'interests' ? null : 'interests'
                      )
                    }
                  >
                    {profileInterests.length > 0
                      ? '+ Edit interests'
                      : '+ Add interests'}
                  </button>
                </div>
                {sidebarEditMode ? (
                  <div className={styles.sidebarMetaEditorSlot}>
                    <h3 className={styles.sidebarMetaEditorSubheading}>
                      {sidebarEditMode === 'bio'
                        ? bioText
                          ? 'Edit personal bio'
                          : 'Add personal bio'
                        : null}
                      {sidebarEditMode === 'personalLinks'
                        ? personalLinks.length > 0
                          ? 'Edit personal links'
                          : 'Add personal links'
                        : null}
                      {sidebarEditMode === 'interests'
                        ? profileInterests.length > 0
                          ? 'Edit interests'
                          : 'Add interests'
                        : null}
                    </h3>
                    {sidebarEditMode === 'bio' ? (
                      <div className={styles.sidebarPersonalLinkAdd}>
                        <label className={styles.sidebarPersonalLinkField}>
                          <span>Your bio</span>
                          <textarea
                            value={bioDraft}
                            onChange={(e) => setBioDraft(e.target.value)}
                            placeholder='A short line about you…'
                            className={styles.sidebarPersonalBioTextarea}
                            rows={4}
                            maxLength={500}
                            aria-label='Personal bio'
                          />
                        </label>
                        <div className={styles.sidebarPersonalLinkEditActions}>
                          <button
                            type='button'
                            className={styles.sidebarPersonalLinkGhostBtn}
                            onClick={cancelBioEdit}
                            disabled={bioSaving}
                          >
                            Cancel
                          </button>
                          <button
                            type='button'
                            className={styles.sidebarPersonalLinkPrimaryBtn}
                            onClick={() => void saveBio()}
                            disabled={bioSaving}
                          >
                            {bioSaving ? '…' : 'Save'}
                          </button>
                        </div>
                      </div>
                    ) : null}
                    {sidebarEditMode === 'personalLinks' ? (
                      <ProfilePersonalLinksPanel
                        links={personalLinks}
                        editable
                        onRefresh={() => void loadPersonalLinks()}
                        showHeading={false}
                        nested
                      />
                    ) : null}
                    {sidebarEditMode === 'interests' ? (
                      <ProfileInterestsPanel
                        userId={effectiveUser.id}
                        editable
                        initialTags={profileInterests}
                        onTagsChange={setProfileInterests}
                        showHeading={false}
                        nested
                      />
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </aside>

          <div className={styles.profileMain}>
            {view === 'following' && (
              <div className={styles.mainPanel}>
                <button
                  type='button'
                  className={styles.backToProfile}
                  onClick={() => setView('profile')}
                >
                  ← Back to profile
                </button>
                <h2 className={styles.mainSerifTitle}>Following</h2>
                {followingList.length === 0 ? (
                  <p className={styles.placeholder}>
                    Not following anyone yet.
                  </p>
                ) : (
                  <ul className={styles.userList}>
                    {followingList.map((u) => (
                      <li key={u.user_id} className={styles.userListItem}>
                        <a
                          href={`/profile/${u.user_id}`}
                          className={styles.userListLink}
                        >
                          {u.display_name || 'User'}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {view === 'followers' && (
              <div className={styles.mainPanel}>
                <button
                  type='button'
                  className={styles.backToProfile}
                  onClick={() => setView('profile')}
                >
                  ← Back to profile
                </button>
                <h2 className={styles.mainSerifTitle}>Followers</h2>
                {followersList.length === 0 ? (
                  <p className={styles.placeholder}>No followers yet.</p>
                ) : (
                  <ul className={styles.userList}>
                    {followersList.map((u) => (
                      <li key={u.user_id} className={styles.userListItem}>
                        <a
                          href={`/profile/${u.user_id}`}
                          className={styles.userListLink}
                        >
                          {u.display_name || 'User'}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {view === 'profile' && (
              <div className={styles.mainPanel}>
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

                {mainTab === 'bookmarks' && (
                  <div className={styles.tabPanel}>
                    <h2 className={styles.mainSerifTitle}>Bookmarks</h2>
                    <div className={styles.section}>
                      <h3 className={styles.subsectionSerifTitle}>
                        Saved links
                      </h3>
                      <div className={styles.linkFilterRow}>
                        <div className={styles.linkFilterTagsWrap}>
                          <span className={styles.linkFilterLabel}>
                            Filter:
                          </span>
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
                            <span className={styles.newTagWrap}>
                              <input
                                type='text'
                                className={styles.newTagInput}
                                placeholder='Tag name'
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                onKeyDown={(e) =>
                                  e.key === 'Enter' && handleCreateTag()
                                }
                                autoFocus
                              />
                              <button
                                type='button'
                                className={styles.newTagBtn}
                                onClick={handleCreateTag}
                                disabled={!newTagName.trim() || tagSubmitting}
                              >
                                {tagSubmitting ? '…' : 'Add'}
                              </button>
                              <button
                                type='button'
                                className={styles.newTagCancel}
                                onClick={() => {
                                  setShowNewTagInput(false)
                                  setNewTagName('')
                                }}
                              >
                                Cancel
                              </button>
                            </span>
                          ) : (
                            <button
                              type='button'
                              className={styles.linkFilterBtnNew}
                              onClick={() => setShowNewTagInput(true)}
                            >
                              + New tag
                            </button>
                          )}
                        </div>
                        <>
                          <span
                            className={styles.linkFilterDivider}
                            aria-hidden
                          >
                            |
                          </span>
                          <button
                            type='button'
                            className={styles.addLinkBtn}
                            onClick={() => setShowAddLinkModal(true)}
                          >
                            Add a new link
                          </button>
                        </>
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
                                <span className={styles.modalOptional}>
                                  (optional)
                                </span>
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
                                URL{' '}
                                <span className={styles.modalRequired}>*</span>
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
                                <span className={styles.modalOptional}>
                                  (optional)
                                </span>
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
                            const faviconDomain = getLinkSiteFaviconDomain(
                              l.url
                            )
                            return (
                              <li key={l.id} className={styles.userLinkItem}>
                                <div className={styles.userLinkItemInner}>
                                  <span className={styles.userLinkIconWrap}>
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
                                  </span>
                                  <div className={styles.userLinkContent}>
                                    <div className={styles.userLinkRow}>
                                      <a
                                        href={l.url}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        className={styles.userLinkUrl}
                                      >
                                        {l.title || l.url}
                                      </a>
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
                                      {l.tag_names?.length > 0 &&
                                        l.tag_names.map((name) => (
                                          <span
                                            key={name}
                                            className={styles.userLinkTag}
                                          >
                                            {name}
                                          </span>
                                        ))}
                                      <span className={styles.userLinkDate}>
                                        {formatDate(l.created_at)}
                                      </span>
                                      {(() => {
                                        try {
                                          return (
                                            <span
                                              className={styles.userLinkDomain}
                                            >
                                              {new URL(l.url).hostname}
                                            </span>
                                          )
                                        } catch {
                                          return null
                                        }
                                      })()}
                                    </div>
                                    {showPrivateMessageForLinkId === l.id && (
                                      <p
                                        className={styles.privateMessage}
                                        role='status'
                                      >
                                        This link is only visible to you.
                                      </p>
                                    )}
                                    {l.note && (
                                      <p className={styles.userLinkNote}>
                                        {l.note}
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
                    <div className={styles.section}>
                      <h3 className={styles.subsectionSerifTitle}>
                        Course bookmarks
                      </h3>
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

                    <div className={styles.section}>
                      <h3 className={styles.subsectionSerifTitle}>
                        Community resources
                      </h3>
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
                  </div>
                )}

                {mainTab === 'activity' && (
                  <div className={styles.tabPanel}>
                    <h2 className={styles.mainSerifTitle}>All activity</h2>
                    <nav
                      className={styles.activitySubTabs}
                      role='tablist'
                      aria-label='Activity type'
                    >
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
                  <ProfileNotebooksPanel
                    notebooks={notebooks}
                    loading={notebooksLoading}
                    onRefresh={loadNotebooks}
                    showPublishedBadge
                  />
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
