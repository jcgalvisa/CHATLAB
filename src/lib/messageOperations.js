// Operaciones puras sobre los mensajes de un chat. No hacen peticiones ni tocan React.
//
// Cada mensaje es una pregunta del usuario junto con su resultado:
//   { id, author, content, createdAt,
//     status: 'pending' | 'answered' | 'failed',
//     answer: null | { id, questionId, content, createdAt },
//     error:  null | { category, message } }
// La respuesta vive dentro de su pregunta: así la relación pregunta/respuesta es un id y no depende del orden.
import { MAX_HISTORY_TURNS, MAX_TEXT_LENGTH } from './chatLimits.js'
import { getActiveChat, getActiveDraft, startNewChat } from './chatOperations.js'

export const USER_AUTHOR = 'user'
export const STATUS_PENDING = 'pending'
export const STATUS_ANSWERED = 'answered'
export const STATUS_FAILED = 'failed'

// Errores propios de datos restaurados (no vienen del servicio).
export const INTERRUPTED_ERROR = {
  category: 'interrupted',
  message: 'La respuesta se interrumpió al recargar la página. Puedes reintentar.',
}
export const UNSENT_ERROR = {
  category: 'unsent',
  message: 'Este mensaje nunca se envió al servicio. Puedes reintentar.',
}

const MAX_TITLE_LENGTH = 40

// Título automático: primera línea del mensaje, con espacios colapsados y longitud limitada.
function buildTitleFromMessage(content) {
  const firstLine = content.split(/\r?\n/)[0].replace(/\s+/g, ' ').trim()
  if (firstLine.length <= MAX_TITLE_LENGTH) {
    return firstLine
  }
  return `${firstLine.slice(0, MAX_TITLE_LENGTH).trimEnd()}…`
}

function createPendingMessage(content) {
  return {
    id: crypto.randomUUID(),
    author: USER_AUTHOR,
    content,
    createdAt: new Date().toISOString(),
    status: STATUS_PENDING,
    answer: null,
    error: null,
  }
}

// Un chat con una pregunta pendiente no admite otro envío ni reintento hasta que termine.
export function isChatBusy(chat) {
  return chat.messages.some((message) => message.status === STATUS_PENDING)
}

export function isActiveChatBusy(state) {
  const chat = getActiveChat(state)
  if (chat === undefined) {
    return false
  }
  return isChatBusy(chat)
}

// Envía el borrador activo como pregunta pendiente. Única operación de envío (botón y Enter).
// - Texto vacío, de más de 8000 caracteres o con el chat ocupado: no hace nada.
// - Sin chat activo: reutiliza startNewChat, que transfiere el borrador provisional.
// - Solo el primer mensaje de un chat sin nombre personalizado genera el título.
// - El borrador se limpia, por lo que un segundo envío inmediato no duplica.
export function sendDraft(state) {
  const content = getActiveDraft(state).trim()
  if (content === '' || content.length > MAX_TEXT_LENGTH) {
    return state
  }
  if (isActiveChatBusy(state)) {
    return state
  }

  let current = state
  if (getActiveChat(current) === undefined) {
    current = startNewChat(current)
  }

  const message = createPendingMessage(content)
  const chats = current.chats.map((chat) => {
    if (chat.id !== current.activeId) {
      return chat
    }
    let name = chat.name
    if (chat.messages.length === 0 && !chat.customName) {
      name = buildTitleFromMessage(content)
    }
    return { ...chat, name, draft: '', messages: [...chat.messages, message] }
  })
  return { ...current, chats }
}

// Aplica `changes` al mensaje solo si existe en ese chat y está en el estado esperado.
// Si el chat se eliminó o el mensaje ya cambió (respuesta tardía), devuelve el mismo estado.
function updateMessage(state, chatId, messageId, expectedStatus, changes) {
  const chat = state.chats.find((item) => item.id === chatId)
  if (chat === undefined) {
    return state
  }
  const message = chat.messages.find((item) => item.id === messageId)
  if (message === undefined || message.status !== expectedStatus) {
    return state
  }
  const chats = state.chats.map((item) => {
    if (item.id !== chatId) {
      return item
    }
    const messages = item.messages.map((current) => {
      if (current.id !== messageId) {
        return current
      }
      return { ...current, ...changes }
    })
    return { ...item, messages }
  })
  return { ...state, chats }
}

export function resolveMessage(state, chatId, messageId, answerText) {
  const answer = { id: crypto.randomUUID(), questionId: messageId, content: answerText, createdAt: new Date().toISOString() }
  return updateMessage(state, chatId, messageId, STATUS_PENDING, { status: STATUS_ANSWERED, answer, error: null })
}

export function failMessage(state, chatId, messageId, error) {
  return updateMessage(state, chatId, messageId, STATUS_PENDING, { status: STATUS_FAILED, answer: null, error })
}

// Reintenta un mensaje fallido sin duplicarlo; bloqueado si el chat ya tiene una pregunta pendiente.
export function retryMessage(state, chatId, messageId) {
  const chat = state.chats.find((item) => item.id === chatId)
  if (chat === undefined || isChatBusy(chat)) {
    return state
  }
  return updateMessage(state, chatId, messageId, STATUS_FAILED, { status: STATUS_PENDING, error: null })
}

// Solicitud para el servicio: la pregunta y los últimos diez turnos completos ANTERIORES a ella
// en el mismo chat. Excluye pendientes, fallidas y cualquier mensaje posterior (también al reintentar).
export function buildChatRequest(state, chatId, messageId) {
  const chat = state.chats.find((item) => item.id === chatId)
  if (chat === undefined) {
    return null
  }
  const index = chat.messages.findIndex((message) => message.id === messageId)
  if (index === -1) {
    return null
  }

  const turns = chat.messages
    .slice(0, index)
    .filter((message) => message.status === STATUS_ANSWERED)
    .slice(-MAX_HISTORY_TURNS)
    // Las respuestas del asistente pueden superar el máximo del contrato: se recortan.
    .map((message) => ({ user: message.content, assistant: message.answer.content.slice(0, MAX_TEXT_LENGTH) }))

  return { question: chat.messages[index].content, history: turns }
}
