import { useEffect, useRef, useState } from 'react'
import * as chatOperations from '../lib/chatOperations'
import * as messageOperations from '../lib/messageOperations'
import { loadState, saveState } from '../lib/chatStorage'
import { describeApiError, requestChatAnswer } from '../services/chatApi'

// Conecta las operaciones puras con React, la persistencia y el servicio HTTP.
// El estado vigente vive también en una ref: las respuestas tardías y los envíos seguidos
// siempre parten del último estado, no del de un render anterior.
// Si el almacenamiento falla, todo sigue en memoria y se expone un aviso.
export function useChats() {
  const [loaded] = useState(loadState)
  const [state, setState] = useState(loaded.state)
  const [warning, setWarning] = useState(loaded.warning)
  const stateRef = useRef(loaded.state)

  useEffect(() => {
    const saveWarning = saveState(state)
    if (saveWarning !== null) {
      setWarning(saveWarning)
    }
  }, [state])

  function commit(nextState) {
    stateRef.current = nextState
    setState(nextState)
  }

  // Consulta al servicio y vincula el resultado al mensaje por ids. Si el chat ya no existe, no hace nada.
  async function requestAnswer(chatId, messageId) {
    const request = messageOperations.buildChatRequest(stateRef.current, chatId, messageId)
    try {
      const answer = await requestChatAnswer(request)
      commit(messageOperations.resolveMessage(stateRef.current, chatId, messageId, answer))
    } catch (error) {
      commit(messageOperations.failMessage(stateRef.current, chatId, messageId, describeApiError(error)))
    }
  }

  function sendMessage() {
    const before = stateRef.current
    const next = messageOperations.sendDraft(before)
    if (next === before) {
      return
    }
    commit(next)
    const chat = chatOperations.getActiveChat(next)
    const message = chat.messages[chat.messages.length - 1]
    requestAnswer(chat.id, message.id)
  }

  function retryMessage(chatId, messageId) {
    const before = stateRef.current
    const next = messageOperations.retryMessage(before, chatId, messageId)
    if (next === before) {
      return
    }
    commit(next)
    requestAnswer(chatId, messageId)
  }

  return {
    state,
    warning,
    sendMessage,
    retryMessage,
    startNewChat: () => commit(chatOperations.startNewChat(stateRef.current)),
    selectChat: (id) => commit(chatOperations.selectChat(stateRef.current, id)),
    updateDraft: (text) => commit(chatOperations.setActiveDraft(stateRef.current, text)),
    renameChat: (id, name) => commit(chatOperations.renameChat(stateRef.current, id, name)),
    deleteChat: (id) => commit(chatOperations.deleteChat(stateRef.current, id)),
  }
}
