import { NOTEBOOK_EMPTY_DOC, type NotebookDocJson } from './notebook-editor-default'
import { getSupabaseClient } from './supabase'

export type Notebook = {
  id: string
  user_id: string
  title: string
  published: boolean
  created_at: string
  updated_at: string
}

export type NotebookTab = {
  id: string
  notebook_id: string
  title: string
  content: NotebookDocJson
  sort_order: number
  created_at: string
  updated_at: string
}

const NOTEBOOK_LIST_COLS =
  'id, user_id, title, published, created_at, updated_at'

export async function getMyNotebooks(): Promise<Notebook[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('notebooks')
    .select(NOTEBOOK_LIST_COLS)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data as Notebook[]
}

/** Public notebooks on someone’s profile (RLS: only rows with published = true). */
export async function getPublishedNotebooksByUserId(
  userId: string
): Promise<Notebook[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('notebooks')
    .select(NOTEBOOK_LIST_COLS)
    .eq('user_id', userId)
    .eq('published', true)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data as Notebook[]
}

export async function getNotebookById(
  notebookId: string
): Promise<Notebook | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('notebooks')
    .select(NOTEBOOK_LIST_COLS)
    .eq('id', notebookId)
    .maybeSingle()
  if (error || !data) return null
  return data as Notebook
}

export async function updateNotebookTitle(
  notebookId: string,
  title: string
): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return false
  const { error } = await supabase
    .from('notebooks')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', notebookId)
    .eq('user_id', user.id)
  return !error
}

export async function setNotebookPublished(
  notebookId: string,
  published: boolean
): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return false
  const { error } = await supabase
    .from('notebooks')
    .update({ published, updated_at: new Date().toISOString() })
    .eq('id', notebookId)
    .eq('user_id', user.id)
  return !error
}

export async function createNotebook(
  title = 'Untitled notebook'
): Promise<Notebook | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: nb, error: nbErr } = await supabase
    .from('notebooks')
    .insert({ user_id: user.id, title, published: false })
    .select(NOTEBOOK_LIST_COLS)
    .single()
  if (nbErr || !nb) return null

  const { error: tabErr } = await supabase.from('notebook_tabs').insert({
    notebook_id: nb.id,
    title: 'Untitled Tab',
    content: NOTEBOOK_EMPTY_DOC as unknown as NotebookDocJson,
    sort_order: 0
  })
  if (tabErr) {
    await supabase.from('notebooks').delete().eq('id', nb.id)
    return null
  }
  return nb as Notebook
}

export async function getTabsForNotebook(
  notebookId: string
): Promise<NotebookTab[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('notebook_tabs')
    .select(
      'id, notebook_id, title, content, sort_order, created_at, updated_at'
    )
    .eq('notebook_id', notebookId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error || !data) return []
  return data as NotebookTab[]
}

export async function createNotebookTab(
  notebookId: string,
  title = 'Untitled Tab'
): Promise<NotebookTab | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: maxRows } = await supabase
    .from('notebook_tabs')
    .select('sort_order')
    .eq('notebook_id', notebookId)
    .order('sort_order', { ascending: false })
    .limit(1)
  const nextOrder =
    maxRows && maxRows.length > 0 ? (maxRows[0].sort_order as number) + 1 : 0

  const { data, error } = await supabase
    .from('notebook_tabs')
    .insert({
      notebook_id: notebookId,
      title,
      content: NOTEBOOK_EMPTY_DOC as unknown as NotebookDocJson,
      sort_order: nextOrder
    })
    .select(
      'id, notebook_id, title, content, sort_order, created_at, updated_at'
    )
    .single()
  if (error || !data) return null
  return data as NotebookTab
}

export async function updateNotebookTabContent(
  tabId: string,
  content: NotebookDocJson
): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false
  const { error } = await supabase
    .from('notebook_tabs')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', tabId)
  return !error
}

export async function updateNotebookTabTitle(
  tabId: string,
  title: string
): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false
  const { error } = await supabase
    .from('notebook_tabs')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', tabId)
  return !error
}
