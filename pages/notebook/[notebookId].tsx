import Head from 'next/head'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
      setTabs([])
      setLoading(false)
      return
    }

    const owner = viewerId !== null && nb.user_id === viewerId
    if (!nb.published && !owner) {
      setForbidden(true)
      setNotebook(null)
      setTabs([])
      setLoading(false)
      return
    }

    setNotebook(nb)
    setNotebookTitle(nb.title)
    setIsOwner(owner)
    const list = await getTabsForNotebook(notebookId)
    setTabs(list)
    setLoading(false)
  }, [notebookId])

  useEffect(() => {
    if (!router.isReady || !notebookId) return
    void fetchNotebook()
  }, [router.isReady, notebookId, fetchNotebook])

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
    setActiveTabId((cur) => (cur === pick ? cur : pick))
    if (!qTab || pick !== qTab) {
      void router.replace(
        `/notebook/${notebookId}?tab=${pick}`,
        undefined,
        { shallow: true }
      )
    }
  }, [router.isReady, notebookId, tabs, router.query.tab, router])

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

  const onNotebookTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setNotebookTitle(v)
    if (titleDebounce) clearTimeout(titleDebounce)
    const t = setTimeout(() => persistNotebookTitle(v.trim() || 'Untitled'), 600)
    setTitleDebounce(t)
  }

  useEffect(() => {
    return () => {
      if (titleDebounce) clearTimeout(titleDebounce)
    }
  }, [titleDebounce])

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
  const profileBackLabel = isOwner ? 'Back to Home' : 'Back to profile'

  const handlePublish = async () => {
    if (!notebookId || !isOwner) return
    const nb = notebook
    if (!nb) return
    setPublishBusy(true)
    try {
      await flushSaveRef.current?.()
      if (!nb.published) {
        const ok = await setNotebookPublished(notebookId, true)
        if (ok) {
          setNotebook((prev) => (prev ? { ...prev, published: true } : null))
        }
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
              Back to profile
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
          {notebook ? `${notebook.title} — Notebook` : 'Notebook'} — {siteName}
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
              </aside>

              <main className={notebookStyles.main}>
                {isOwner ? (
                  <input
                    className={notebookStyles.notebookTitle}
                    value={notebookTitle}
                    onChange={onNotebookTitleChange}
                    placeholder='Untitled'
                    aria-label='Notebook title'
                  />
                ) : (
                  <h1 className={notebookStyles.notebookTitleStatic}>
                    {notebookTitle || 'Untitled'}
                  </h1>
                )}
                {isOwner ? (
                  <p className={notebookStyles.descPlaceholder}>
                    Add your description here…
                  </p>
                ) : null}
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

                {isOwner ? (
                  <div className={notebookStyles.footer}>
                    {notebook?.published ? (
                      <span className={notebookStyles.publishedLive}>
                        Live on your public profile
                      </span>
                    ) : (
                      <button
                        type='button'
                        className={notebookStyles.publishBtn}
                        disabled={publishBusy || !activeTab}
                        onClick={() => void handlePublish()}
                      >
                        {publishBusy ? '…' : 'Publish'}
                      </button>
                    )}
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
