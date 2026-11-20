import { useEffect, useState } from 'react'
import * as operations from '../lib/chatOperations'
import { loadState, saveState } from '../lib/chatStorage'

// Conecta las operaciones puras con React y con la persistencia.
// Si el almacenamiento falla, el estado sigue funcionando en memoria y se expone un aviso.
export function useChats() {
  const [loaded] = useState(loadState)
  const [state, setState] = useState(loaded.state)
  const [warning, setWarning] = useState(loaded.warning)

  useEffect(() => {
    const saveWarning = saveState(state)
    if (saveWarning !== null) {
      setWarning(saveWarning)
    }
  }, [state])

  return {
    state,
    warning,
    startNewChat: () => setState((current) => operations.startNewChat(current)),
    selectChat: (id) => setState((current) => operations.selectChat(current, id)),
    updateDraft: (text) => setState((current) => operations.setActiveDraft(current, text)),
    renameChat: (id, name) => setState((current) => operations.renameChat(current, id, name)),
    deleteChat: (id) => setState((current) => operations.deleteChat(current, id)),
  }
}
