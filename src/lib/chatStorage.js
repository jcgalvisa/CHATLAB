// Persistencia en localStorage bajo una única clave propia; nunca lee ni escribe otras.
import { createEmptyState } from './chatOperations.js'

export const STORAGE_KEY = 'chatlab:state:v1'

export const CORRUPTED_WARNING =
  'Los datos guardados estaban dañados y se descartaron. Puedes seguir trabajando con un historial nuevo.'
export const BLOCKED_WARNING =
  'El almacenamiento del navegador no está disponible. Puedes seguir trabajando, pero los cambios no se conservarán al recargar.'

function isValidChat(chat) {
  if (typeof chat !== 'object' || chat === null) {
    return false
  }
  const hasValidText =
    typeof chat.id === 'string' && chat.id !== '' && typeof chat.name === 'string' && typeof chat.draft === 'string'
  if (!hasValidText) {
    return false
  }
  return chat.name.trim() !== '' && typeof chat.customName === 'boolean'
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
  return { state: parsed, warning: null }
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
