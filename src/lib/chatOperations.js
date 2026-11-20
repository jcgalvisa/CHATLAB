// Operaciones puras sobre el estado de chats. No tocan React ni el almacenamiento.
//
// Forma del estado:
//   chats:            [{ id, name, customName, draft, messages }]
//   message:          { id, author, content, createdAt }
//   activeId:         id del chat seleccionado, o null si se usa el borrador provisional
//   provisionalDraft: borrador escrito antes de que exista algún chat

export const DEFAULT_CHAT_NAME = 'Nuevo chat'
export const USER_AUTHOR = 'user'
const MAX_TITLE_LENGTH = 40

export function createEmptyState() {
  return { chats: [], activeId: null, provisionalDraft: '' }
}

function createChat(draft) {
  return { id: crypto.randomUUID(), name: DEFAULT_CHAT_NAME, customName: false, draft, messages: [] }
}

// Un chat se puede reutilizar solo si no tiene mensajes, borrador ni nombre elegido por la persona.
export function isReusableChat(chat) {
  return chat.messages.length === 0 && chat.draft === '' && !chat.customName
}

export function normalizeChatName(rawName) {
  return rawName.trim()
}

export function getActiveChat(state) {
  return state.chats.find((chat) => chat.id === state.activeId)
}

export function getActiveDraft(state) {
  const chat = getActiveChat(state)
  if (chat === undefined) {
    return state.provisionalDraft
  }
  return chat.draft
}

export function getActiveMessages(state) {
  const chat = getActiveChat(state)
  if (chat === undefined) {
    return []
  }
  return chat.messages
}

export function getActiveTitle(state) {
  const chat = getActiveChat(state)
  if (chat === undefined) {
    return DEFAULT_CHAT_NAME
  }
  return chat.name
}

// Con borrador provisional: crea un chat y se lo transfiere (una sola vez).
// Sin borrador: reutiliza un chat vacío sin nombre propio o crea uno nuevo.
export function startNewChat(state) {
  if (state.provisionalDraft !== '') {
    const chat = createChat(state.provisionalDraft)
    return { ...state, chats: [chat, ...state.chats], activeId: chat.id, provisionalDraft: '' }
  }

  const reusableChat = state.chats.find(isReusableChat)
  if (reusableChat !== undefined) {
    return { ...state, activeId: reusableChat.id }
  }

  const chat = createChat('')
  return { ...state, chats: [chat, ...state.chats], activeId: chat.id }
}

export function selectChat(state, id) {
  const exists = state.chats.some((chat) => chat.id === id)
  if (!exists) {
    return state
  }
  return { ...state, activeId: id }
}

// Escribe en el borrador del chat activo, o en el provisional si no hay chat activo.
export function setActiveDraft(state, text) {
  const chat = getActiveChat(state)
  if (chat === undefined) {
    return { ...state, provisionalDraft: text }
  }
  const chats = state.chats.map((item) => {
    if (item.id !== chat.id) {
      return item
    }
    return { ...item, draft: text }
  })
  return { ...state, chats }
}

// Título automático: primera línea del mensaje, con espacios colapsados y longitud limitada.
function buildTitleFromMessage(content) {
  const firstLine = content.split(/\r?\n/)[0].replace(/\s+/g, ' ').trim()
  if (firstLine.length <= MAX_TITLE_LENGTH) {
    return firstLine
  }
  return `${firstLine.slice(0, MAX_TITLE_LENGTH).trimEnd()}…`
}

function createUserMessage(content) {
  return { id: crypto.randomUUID(), author: USER_AUTHOR, content, createdAt: new Date().toISOString() }
}

// Envía el borrador activo como mensaje del usuario. Única operación de envío (botón y Enter).
// - Texto vacío o solo espacios: no hace nada.
// - Sin chat activo: reutiliza startNewChat, que transfiere el borrador provisional.
// - Solo el primer mensaje de un chat sin nombre personalizado genera el título.
// - El borrador del chat se limpia, por lo que un segundo envío inmediato no duplica.
export function sendDraft(state) {
  const content = getActiveDraft(state).trim()
  if (content === '') {
    return state
  }

  let current = state
  if (getActiveChat(current) === undefined) {
    current = startNewChat(current)
  }

  const message = createUserMessage(content)
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

// Renombra marcando el nombre como personalizado (incluso si es "Nuevo chat").
// Un nombre vacío tras recortar espacios se rechaza devolviendo el mismo estado.
export function renameChat(state, id, rawName) {
  const name = normalizeChatName(rawName)
  if (name === '') {
    return state
  }
  const chats = state.chats.map((chat) => {
    if (chat.id !== id) {
      return chat
    }
    return { ...chat, name, customName: true }
  })
  return { ...state, chats }
}

// Elimina un chat. Si era el activo, selecciona el vecino en su misma posición
// (o el anterior); sin chats restantes vuelve al inicio (activeId null).
export function deleteChat(state, id) {
  const index = state.chats.findIndex((chat) => chat.id === id)
  if (index === -1) {
    return state
  }

  const chats = state.chats.filter((chat) => chat.id !== id)
  if (state.activeId !== id) {
    return { ...state, chats }
  }
  if (chats.length === 0) {
    return { ...state, chats, activeId: null }
  }
  const neighbor = chats[Math.min(index, chats.length - 1)]
  return { ...state, chats, activeId: neighbor.id }
}

// Filtra por nombre sin distinguir mayúsculas; una búsqueda vacía devuelve todo.
export function filterChats(chats, query) {
  const needle = query.trim().toLowerCase()
  if (needle === '') {
    return chats
  }
  return chats.filter((chat) => chat.name.toLowerCase().includes(needle))
}
