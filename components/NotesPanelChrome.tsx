import * as React from 'react'

type NotesPanelChromeApi = {
  setActions: (node: React.ReactNode | null) => void
  showEditorSave: boolean
}

const NotesPanelChromeApiContext =
  React.createContext<NotesPanelChromeApi | null>(null)
const NotesPanelChromeActionsContext = React.createContext<React.ReactNode>(
  null
)

export function NotesPanelChromeProvider({
  children,
  showEditorSave = false
}: {
  children: React.ReactNode
  showEditorSave?: boolean
}) {
  const [actions, setActionsState] = React.useState<React.ReactNode>(null)
  const setActions = React.useCallback((node: React.ReactNode | null) => {
    setActionsState(node)
  }, [])
  const api = React.useMemo(
    () => ({ setActions, showEditorSave }),
    [setActions, showEditorSave]
  )
  return (
    <NotesPanelChromeApiContext.Provider value={api}>
      <NotesPanelChromeActionsContext.Provider value={actions}>
        {children}
      </NotesPanelChromeActionsContext.Provider>
    </NotesPanelChromeApiContext.Provider>
  )
}

export function NotesPanelChromeSlot() {
  const actions = React.useContext(NotesPanelChromeActionsContext)
  if (!actions) return null
  return <>{actions}</>
}

export function useNotesPanelChrome() {
  return React.useContext(NotesPanelChromeApiContext)
}
