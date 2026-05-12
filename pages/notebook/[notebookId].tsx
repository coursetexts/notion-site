import Head from 'next/head'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { HomeFooterSection } from '@/components/HomeFooterSection'
import { HomeHeader } from '@/components/HomeHeader'
import { ProfileBackArrow } from '@/components/ProfileBackArrow'
import { name as siteName } from '@/lib/config'
import {
  NOTEBOOK_EMPTY_DOC,
  type NotebookDocJson
} from '@/lib/notebook-editor-default'
import {
  type Notebook,
  type NotebookTab,
  createNotebookTab,
  getNotebookById,
  getTabsForNotebook,
  setNotebookPublished,
  updateNotebookDescription,
  updateNotebookTabContent,
  updateNotebookTabTitle,
  updateNotebookTitle
} from '@/lib/notebooks-db'
import { getCachedAuth } from '@/lib/auth-cache'
import notebookStyles from '@/styles/notebook.module.css'

const NotebookEditor = dynamic(
  () =>
    import('@/components/NotebookEditor').then((m) => m.NotebookEditor),
  { ssr: false }
)

const TAB_COLORS = [
  '#9ca3af',
  '#fb923c',
  '#facc15',
  '#f87171',
  '#4ade80',
  '#60a5fa'
]

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'long',
    day: 'numeric'
  })
}

function NotebookSidebarDescriptionReadOnly({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const [showToggle, setShowToggle] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setExpanded(false)
  }, [text])

  useLayoutEffect(() => {
    const el = bodyRef.current
    const trimmed = text.trim()
    if (!el || !trimmed) {
      setShowToggle(false)
      return
    }
    if (expanded) {
      setShowToggle(true)
      return
    }
    setShowToggle(el.scrollHeight > el.clientHeight + 1)
  }, [text, expanded])

  const trimmed = text.trim()
  if (!trimmed) {
    return (
      <p className={notebookStyles.sidebarNotebookDescEmpty}>
        No description yet.
      </p>
    )
  }

  return (
    <div className={notebookStyles.sidebarNotebookDescReadWrap}>
      <div
        ref={bodyRef}
        className={
          expanded
            ? notebookStyles.sidebarNotebookDescReadFull
            : notebookStyles.sidebarNotebookDescReadClamp
        }
      >
        {text}
      </div>
      {showToggle ? (
        <button
          type='button'
          className={notebookStyles.sidebarNotebookDescToggle}
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      ) : null}
    </div>
  )
}

export default function NotebookPage() {
  const router = useRouter()
  const rawId = router.query.notebookId
  const notebookId = typeof rawId === 'string' ? rawId : null

  const [notebook, setNotebook] = useState<Notebook | null>(null)
  const [tabs, setTabs] = useState<NotebookTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [tabSearch, setTabSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [notebookTitle, setNotebookTitle] = useState('')
  const [notebookDescription, setNotebookDescription] = useState('')
  const [titleDebounce, setTitleDebounce] = useState<ReturnType<
    typeof setTimeout
  > | null>(null)
  const [renamingTabId, setRenamingTabId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const [newTabBusy, setNewTabBusy] = useState(false)
  const [saveUi, setSaveUi] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle'
  )
  const [publishBusy, setPublishBusy] = useState(false)
  const [isOwner, setIsOwner] = useState(false)

  const flushSaveRef = useRef<(() => Promise<void>) | null>(null)
  const tabTitleSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  )
  const descSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const notebookDescriptionRef = useRef('')

  useEffect(() => {
    notebookDescriptionRef.current = notebookDescription
  }, [notebookDescription])

  const fetchNotebook = useCallback(async () => {
    if (!notebookId) return
    setLoading(true)
    setForbidden(false)
    setIsOwner(false)
    const cached = await getCachedAuth()
    const viewerId = cached?.user?.id ?? null

    const nb = await getNotebookById(notebookId)
    if (!nb) {
      setForbidden(true)
      setNotebook(null)
      setNotebookDescription('')
      notebookDescriptionRef.current = ''
      setTabs([])
      setLoading(false)
      return
    }

    const owner = viewerId !== null && nb.user_id === viewerId
    if (!nb.published && !owner) {
      setForbidden(true)
      setNotebook(null)
      setNotebookDescription('')
      notebookDescriptionRef.current = ''
      setTabs([])
      setLoading(false)
      return
    }

    setNotebook(nb)
    setNotebookTitle(nb.title)
    const desc = nb.description
    setNotebookDescription(desc)
    notebookDescriptionRef.current = desc
    setIsOwner(owner)
    const list = await getTabsForNotebook(notebookId)
    setTabs(list)
    setLoading(false)
  }, [notebookId])

  useEffect(() => {
    if (!router.isReady || !notebookId) return
    void fetchNotebook()
  }, [router.isReady, notebookId, fetchNotebook])

  const flushPendingTabTitleSave = useCallback(
    (tabId: string | null) => {
      if (!tabId || !isOwner) return
      if (tabTitleSaveTimerRef.current) {
        clearTimeout(tabTitleSaveTimerRef.current)
        tabTitleSaveTimerRef.current = null
      }
      const row = tabs.find((t) => t.id === tabId)
      if (!row) return
      void updateNotebookTabTitle(tabId, row.title.trim() || 'Untitled Tab')
    },
    [isOwner, tabs]
  )

  useEffect(() => {
    if (!router.isReady || !notebookId) return
    if (tabs.length === 0) {
      setActiveTabId(null)
      return
    }
    const qTab =
      typeof router.query.tab === 'string' ? router.query.tab : null
    const pick =
      qTab && tabs.some((t) => t.id === qTab) ? qTab : tabs[0].id
    if (activeTabId !== pick) {
      if (activeTabId) {
        flushPendingTabTitleSave(activeTabId)
      }
      setActiveTabId(pick)
    }
    if (!qTab || pick !== qTab) {
      void router.replace(
        `/notebook/${notebookId}?tab=${pick}`,
        undefined,
        { shallow: true }
      )
    }
  }, [
    router.isReady,
    notebookId,
    tabs,
    router.query.tab,
    router,
    activeTabId,
    flushPendingTabTitleSave
  ])

  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId) ?? null,
    [tabs, activeTabId]
  )

  const filteredTabs = useMemo(() => {
    if (!isOwner) return tabs
    const q = tabSearch.trim().toLowerCase()
    if (!q) return tabs
    return tabs.filter((t) => t.title.toLowerCase().includes(q))
  }, [tabs, tabSearch, isOwner])

  const persistNotebookTitle = useCallback(
    (title: string) => {
      if (!notebookId || !isOwner) return
      void updateNotebookTitle(notebookId, title)
    },
    [notebookId, isOwner]
  )

  const flushNotebookDescriptionSave = useCallback(async () => {
    if (descSaveTimerRef.current) {
      clearTimeout(descSaveTimerRef.current)
      descSaveTimerRef.current = null
    }
    if (!notebookId || !isOwner) return
    const d = notebookDescriptionRef.current
    const ok = await updateNotebookDescription(notebookId, d)
    if (ok) {
      setNotebook((prev) => (prev ? { ...prev, description: d } : null))
    }
  }, [notebookId, isOwner])

  const onNotebookTitleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const v = e.target.value
    setNotebookTitle(v)
    if (titleDebounce) clearTimeout(titleDebounce)
    const t = setTimeout(() => persistNotebookTitle(v.trim() || 'Untitled'), 600)
    setTitleDebounce(t)
  }

  const onNotebookDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const v = e.target.value
    setNotebookDescription(v)
    if (descSaveTimerRef.current) {
      clearTimeout(descSaveTimerRef.current)
    }
    descSaveTimerRef.current = setTimeout(() => {
      descSaveTimerRef.current = null
      void (async () => {
        if (!notebookId || !isOwner) return
        const ok = await updateNotebookDescription(notebookId, v)
        if (ok) {
          setNotebook((prev) => (prev ? { ...prev, description: v } : null))
        }
      })()
    }, 600)
  }

  const onNotebookDescriptionBlur = () => {
    void flushNotebookDescriptionSave()
  }

  const onActiveTabTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeTabId || !isOwner) return
    const v = e.target.value
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, title: v } : t))
    )
    if (tabTitleSaveTimerRef.current) {
      clearTimeout(tabTitleSaveTimerRef.current)
    }
    tabTitleSaveTimerRef.current = setTimeout(() => {
      tabTitleSaveTimerRef.current = null
      void updateNotebookTabTitle(activeTabId, v.trim() || 'Untitled Tab')
    }, 600)
  }

  const onActiveTabTitleBlur = () => {
    if (!activeTabId || !isOwner) return
    if (tabTitleSaveTimerRef.current) {
      clearTimeout(tabTitleSaveTimerRef.current)
      tabTitleSaveTimerRef.current = null
    }
    const row = tabs.find((t) => t.id === activeTabId)
    if (!row) return
    void updateNotebookTabTitle(
      activeTabId,
      row.title.trim() || 'Untitled Tab'
    )
  }

  useEffect(() => {
    return () => {
      if (titleDebounce) clearTimeout(titleDebounce)
    }
  }, [titleDebounce])

  useEffect(() => {
    return () => {
      if (tabTitleSaveTimerRef.current) {
        clearTimeout(tabTitleSaveTimerRef.current)
        tabTitleSaveTimerRef.current = null
      }
      if (descSaveTimerRef.current) {
        clearTimeout(descSaveTimerRef.current)
        descSaveTimerRef.current = null
      }
    }
  }, [])

  const setTabInUrl = useCallback(
    (tabId: string) => {
      if (!notebookId) return
      void router.replace(
        { pathname: `/notebook/${notebookId}`, query: { tab: tabId } },
        undefined,
        { shallow: true }
      )
    },
    [notebookId, router]
  )

  const selectTab = (tabId: string) => {
    if (tabId !== activeTabId && activeTabId) {
      flushPendingTabTitleSave(activeTabId)
    }
    setActiveTabId(tabId)
    setTabInUrl(tabId)
  }

  const handleNewTab = async () => {
    if (!notebookId || !isOwner || newTabBusy) return
    setNewTabBusy(true)
    const row = await createNotebookTab(notebookId)
    if (row) {
      setTabs((prev) => [...prev, row])
      selectTab(row.id)
    }
    setNewTabBusy(false)
  }

  const commitRename = async () => {
    if (!renamingTabId || !isOwner) return
    const title = renameDraft.trim() || 'Untitled Tab'
    const ok = await updateNotebookTabTitle(renamingTabId, title)
    if (ok) {
      setTabs((prev) =>
        prev.map((t) => (t.id === renamingTabId ? { ...t, title } : t))
      )
    }
    setRenamingTabId(null)
  }

  const handleSaveTabContent = useCallback(
    async (json: NotebookDocJson) => {
      if (!activeTabId || !isOwner) return
      const ok = await updateNotebookTabContent(activeTabId, json)
      if (ok) {
        setTabs((prev) =>
          prev.map((t) => (t.id === activeTabId ? { ...t, content: json } : t))
        )
      }
    },
    [activeTabId, isOwner]
  )

  const profileBackHref =
    notebook && !isOwner ? `/profile/${notebook.user_id}` : '/profile'
  const profileBackLabel = isOwner ? 'Notebooks' : 'Back to profile'

  const handleVisibilityToggle = async () => {
    if (!notebookId || !isOwner || !notebook) return
    const next = !notebook.published
    setPublishBusy(true)
    try {
      flushPendingTabTitleSave(activeTabId)
      await flushNotebookDescriptionSave()
      await flushSaveRef.current?.()
      const ok = await setNotebookPublished(notebookId, next)
      if (ok) {
        setNotebook((prev) => (prev ? { ...prev, published: next } : null))
      } else {
        window.alert('Could not update visibility. Try again.')
      }
    } finally {
      setPublishBusy(false)
    }
  }

  const saveStatusLabel =
    saveUi === 'saving'
      ? 'Saving…'
      : saveUi === 'saved'
        ? 'All changes saved'
        : saveUi === 'error'
          ? 'Could not save'
          : ''

  if (!router.isReady || !notebookId) {
    return null
  }

  if (forbidden && !loading) {
    return (
      <>
        <Head>
          <title>Notebook — {siteName}</title>
        </Head>
        <HomeHeader />
        <div className={notebookStyles.page}>
          <div className={notebookStyles.shell}>
            <p>Notebook not found or you do not have access.</p>
            <Link
              href='/profile'
              legacyBehavior={false}
              className={notebookStyles.backLink}
            >
              <ProfileBackArrow className={notebookStyles.backLinkArrow} />
              Notebooks
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>
          {notebook
            ? `${(notebookTitle || notebook.title).trim() || 'Untitled'}${
                activeTab?.title
                  ? ` — ${activeTab.title.trim() || 'Untitled Tab'}`
                  : ''
              } — Notebook — ${siteName}`
            : `Notebook — ${siteName}`}
        </title>
      </Head>
      <HomeHeader />
      <div className={notebookStyles.page}>
        <div className={notebookStyles.shell}>
          <div className={notebookStyles.backRow}>
            <Link
              href={profileBackHref}
              legacyBehavior={false}
              className={notebookStyles.backLink}
            >
              <ProfileBackArrow className={notebookStyles.backLinkArrow} />
              {profileBackLabel}
            </Link>
          </div>

          {loading ? (
            <p>Loading notebook…</p>
          ) : (
            <div className={notebookStyles.layout}>
              <aside className={notebookStyles.sidebar}>
                {notebook ? (
                  <div className={notebookStyles.sidebarNotebookBlock}>
                    <span className={notebookStyles.sidebarNotebookLabel}>
                      Notebook
                    </span>
                    {isOwner ? (
                      <textarea
                        className={notebookStyles.sidebarNotebookTitle}
                        value={notebookTitle}
                        onChange={onNotebookTitleChange}
                        placeholder='Untitled'
                        aria-label='Notebook title'
                        rows={2}
                        spellCheck={true}
                      />
                    ) : (
                      <p className={notebookStyles.sidebarNotebookTitleStatic}>
                        {(notebookTitle || notebook.title || 'Untitled').trim()}
                      </p>
                    )}
                    <span className={notebookStyles.sidebarNotebookDescLabel}>
                      Description
                    </span>
                    {isOwner ? (
                      <textarea
                        className={notebookStyles.sidebarNotebookDescInput}
                        value={notebookDescription}
                        onChange={onNotebookDescriptionChange}
                        onBlur={onNotebookDescriptionBlur}
                        placeholder='Describe this notebook…'
                        aria-label='Notebook description'
                        rows={3}
                        spellCheck={true}
                      />
                    ) : (
                      <NotebookSidebarDescriptionReadOnly
                        text={notebookDescription}
                      />
                    )}
                  </div>
                ) : null}
                <h2 className={notebookStyles.sidebarTitle}>
                  {isOwner ? 'Your Tabs' : 'Pages'}
                </h2>
                {isOwner ? (
                  <input
                    type='search'
                    className={notebookStyles.tabSearch}
                    placeholder='Search tabs'
                    value={tabSearch}
                    onChange={(e) => setTabSearch(e.target.value)}
                    aria-label='Search tabs'
                  />
                ) : null}
                {filteredTabs.length === 0 ? (
                  <p className={notebookStyles.emptyTabs}>
                    {tabs.length === 0
                      ? 'No tabs yet.'
                      : 'No tabs match your search.'}
                  </p>
                ) : (
                  <ul className={notebookStyles.tabList}>
                    {filteredTabs.map((t, i) => {
                      const color =
                        TAB_COLORS[t.sort_order % TAB_COLORS.length] ??
                        TAB_COLORS[i % TAB_COLORS.length]
                      const active = t.id === activeTabId
                      return (
                        <li key={t.id} className={notebookStyles.tabRow}>
                          <span
                            className={notebookStyles.tabColor}
                            style={{ background: color }}
                            aria-hidden
                          />
                          {renamingTabId === t.id ? (
                            <input
                              className={notebookStyles.renameInput}
                              value={renameDraft}
                              onChange={(e) => setRenameDraft(e.target.value)}
                              onBlur={() => void commitRename()}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') void commitRename()
                                if (e.key === 'Escape') {
                                  setRenamingTabId(null)
                                }
                              }}
                              autoFocus
                              aria-label='Tab name'
                            />
                          ) : (
                            <button
                              type='button'
                              className={
                                active
                                  ? `${notebookStyles.tabBtn} ${notebookStyles.tabBtnActive}`
                                  : notebookStyles.tabBtn
                              }
                              onClick={() => selectTab(t.id)}
                              onDoubleClick={
                                isOwner
                                  ? () => {
                                      setRenamingTabId(t.id)
                                      setRenameDraft(t.title)
                                    }
                                  : undefined
                              }
                            >
                              {t.title}
                            </button>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
                {isOwner ? (
                  <button
                    type='button'
                    className={notebookStyles.newTabBtn}
                    onClick={() => void handleNewTab()}
                    disabled={newTabBusy}
                  >
                    {newTabBusy ? '…' : '+ New tab'}
                  </button>
                ) : null}
                {isOwner && notebook ? (
                  <div className={notebookStyles.visibilityBlock}>
                    <div className={notebookStyles.visibilityHeader}>
                      Profile visibility
                    </div>
                    <div className={notebookStyles.visibilityControl}>
                      <button
                        type='button'
                        role='switch'
                        aria-checked={notebook.published}
                        aria-label={
                          notebook.published
                            ? 'Public on profile. Click to make private.'
                            : 'Private. Click to publish on profile.'
                        }
                        disabled={publishBusy}
                        className={`${notebookStyles.visToggle}${
                          notebook.published
                            ? ` ${notebookStyles.visToggleOn}`
                            : ''
                        }`}
                        onClick={() => void handleVisibilityToggle()}
                      >
                        <span className={notebookStyles.visToggleKnob} />
                      </button>
                      <span className={notebookStyles.visToggleLabel}>
                        {notebook.published ? 'Public' : 'Private'}
                      </span>
                    </div>
                    <p className={notebookStyles.visibilityHint}>
                      {notebook.published
                        ? 'Listed on your profile so others can find this notebook.'
                        : 'Hidden from your profile. Only you can open this notebook.'}
                    </p>
                  </div>
                ) : null}
              </aside>

              <main className={notebookStyles.main}>
                {activeTab ? (
                  isOwner ? (
                    <input
                      className={notebookStyles.tabPageTitle}
                      value={activeTab.title}
                      onChange={onActiveTabTitleChange}
                      onBlur={onActiveTabTitleBlur}
                      placeholder='Untitled tab'
                      aria-label='Tab title'
                    />
                  ) : (
                    <h1 className={notebookStyles.tabPageTitleStatic}>
                      {activeTab.title.trim() || 'Untitled tab'}
                    </h1>
                  )
                ) : (
                  <h1 className={notebookStyles.tabPageTitleStatic}>
                    {isOwner ? 'New notebook' : 'Notebook'}
                  </h1>
                )}
                <div className={notebookStyles.metaRow}>
                  <span className={notebookStyles.metaPill}>
                    {activeTab
                      ? formatShortDate(activeTab.updated_at)
                      : '—'}
                  </span>
                  {isOwner && saveStatusLabel ? (
                    <span className={notebookStyles.saveStatus}>
                      {saveStatusLabel}
                    </span>
                  ) : null}
                </div>

                {activeTab ? (
                  <NotebookEditor
                    key={activeTab.id}
                    tabId={activeTab.id}
                    initialContent={
                      (activeTab.content ??
                        NOTEBOOK_EMPTY_DOC) as unknown as NotebookDocJson
                    }
                    onSave={handleSaveTabContent}
                    onSaveState={isOwner ? setSaveUi : undefined}
                    flushSaveRef={isOwner ? flushSaveRef : undefined}
                    editable={isOwner}
                  />
                ) : (
                  <p className={notebookStyles.saveStatus}>
                    {isOwner
                      ? 'Create a tab to start writing.'
                      : 'This notebook has no pages yet.'}
                  </p>
                )}

                {isOwner && notebook ? (
                  <div className={notebookStyles.footer}>
                    <span className={notebookStyles.footerNote}>
                      {notebook.published
                        ? 'This notebook is public on your profile.'
                        : 'This notebook is private to you.'}
                    </span>
                  </div>
                ) : null}
              </main>
            </div>
          )}
        </div>
      </div>
      {!isOwner && notebook && !loading ? <HomeFooterSection /> : null}
    </>
  )
}
