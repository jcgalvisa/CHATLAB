// Persistencia en localStorage bajo una única clave propia; nunca lee ni escribe otras.
import { createEmptyState } from './chatOperations.js'
import {
  INTERRUPTED_ERROR,
  STATUS_ANSWERED,
  STATUS_FAILED,
  STATUS_PENDING,
  UNSENT_ERROR,
  USER_AUTHOR,
} from './messageOperations.js'

export const STORAGE_KEY = 'chatlab:state:v1'

export const CORRUPTED_WARNING =
  'Los datos guardados estaban dañados y se descartaron. Puedes seguir trabajando con un historial nuevo.'
export const BLOCKED_WARNING =
  'El almacenamiento del navegador no está disponible. Puedes seguir trabajando, pero los cambios no se conservarán al recargar.'

function isNonEmptyString(value) {
  return typeof value === 'string' && value !== ''
}

function isValidDate(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

function isValidAnswer(answer, message) {
  if (typeof answer !== 'object' || answer === null) {
    return false
  }
  return isNonEmptyString(answer.id) && answer.questionId === message.id && isNonEmptyString(answer.content) && isValidDate(answer.createdAt)
}

function isValidError(error) {
  if (typeof error !== 'object' || error === null) {
    return false
  }
  return isNonEmptyString(error.category) && isNonEmptyString(error.message)
}

// `status`, `answer` y `error` pueden faltar (formato anterior); si existen, deben ser coherentes.
function isValidStatusData(message) {
  if (message.status === undefined) {
    return true
  }
  if (message.status === STATUS_ANSWERED) {
    return isValidAnswer(message.answer, message)
  }
  if (message.status === STATUS_FAILED) {
    return isValidError(message.error)
  }
  return message.status === STATUS_PENDING
}

function isValidMessage(message) {
  if (typeof message !== 'object' || message === null) {
    return false
  }
  if (!isNonEmptyString(message.id) || !isNonEmptyString(message.content) || message.author !== USER_AUTHOR) {
    return false
  }
  return isValidDate(message.createdAt) && isValidStatusData(message)
}

// Los chats guardados antes de existir los mensajes no tienen `messages`: es válido y se recupera como [].
function hasValidMessages(chat) {
  if (chat.messages === undefined) {
    return true
  }
  if (!Array.isArray(chat.messages) || !chat.messages.every(isValidMessage)) {
    return false
  }
  return new Set(chat.messages.map((message) => message.id)).size === chat.messages.length
}

// Mensajes anteriores a las respuestas no tienen estado: nunca se enviaron, se pueden reintentar.
// Una pregunta pendiente al recargar quedó interrumpida: no se reenvía sola ni bloquea el chat.
function restoreMessage(message) {
  if (message.status === undefined) {
    return { ...message, status: STATUS_FAILED, answer: null, error: UNSENT_ERROR }
  }
  if (message.status === STATUS_PENDING) {
    return { ...message, status: STATUS_FAILED, answer: null, error: INTERRUPTED_ERROR }
  }
  if (message.status === STATUS_ANSWERED) {
    return { ...message, error: null }
  }
  return { ...message, answer: null }
}

function restoreChat(chat) {
  if (chat.messages === undefined) {
    return { ...chat, messages: [] }
  }
  return { ...chat, messages: chat.messages.map(restoreMessage) }
}

function isValidChat(chat) {
  if (typeof chat !== 'object' || chat === null) {
    return false
  }
  const hasValidText =
    typeof chat.id === 'string' && chat.id !== '' && typeof chat.name === 'string' && typeof chat.draft === 'string'
  if (!hasValidText) {
    return false
  }
  return chat.name.trim() !== '' && typeof chat.customName === 'boolean' && hasValidMessages(chat)
}

function isValidState(value) {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  if (!Array.isArray(value.chats) || typeof value.provisionalDraft !== 'string') {
    return false
  }
  if (!value.chats.every(isValidChat)) {
    return false
  }
  const ids = value.chats.map((chat) => chat.id)
  if (new Set(ids).size !== ids.length) {
    return false
  }
  if (value.activeId === null) {
    return true
  }
  return ids.includes(value.activeId)
}

// Devuelve { state, warning }. warning es null cuando todo salió bien.
export function loadState() {
  let raw
  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return { state: createEmptyState(), warning: BLOCKED_WARNING }
  }

  if (raw === null) {
    return { state: createEmptyState(), warning: null }
  }

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { state: createEmptyState(), warning: CORRUPTED_WARNING }
  }

  if (!isValidState(parsed)) {
    return { state: createEmptyState(), warning: CORRUPTED_WARNING }
  }
  return { state: { ...parsed, chats: parsed.chats.map(restoreChat) }, warning: null }
}

// Devuelve un aviso si no se pudo guardar, o null si se guardó.
export function saveState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    return BLOCKED_WARNING
  }
  return null
}
