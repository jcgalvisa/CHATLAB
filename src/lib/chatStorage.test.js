// Pruebas aisladas de persistencia con un localStorage simulado (ejecutar con: npm test).
import test from 'node:test'
import assert from 'node:assert/strict'
import { loadState, saveState, STORAGE_KEY, CORRUPTED_WARNING, BLOCKED_WARNING } from './chatStorage.js'
import { createEmptyState, setActiveDraft, startNewChat } from './chatOperations.js'
import { failMessage, resolveMessage, sendDraft } from './messageOperations.js'

const FOREIGN_KEY = 'otra-app:datos'

function installStorage(initial = {}, { blocked = false } = {}) {
  const data = { ...initial }
  const denied = () => {
    throw new Error('SecurityError')
  }
  globalThis.window = {
    localStorage: {
      getItem: (key) => {
        if (blocked) denied()
        return key in data ? data[key] : null
      },
      setItem: (key, value) => {
        if (blocked) denied()
        data[key] = String(value)
      },
    },
  }
  return data
}

test('el borrador provisional sobrevive a recargar y la creación posterior también', () => {
  const data = installStorage({ [FOREIGN_KEY]: 'intacto' })
  saveState(setActiveDraft(createEmptyState(), 'pendiente'))

  let loaded = loadState()
  assert.equal(loaded.warning, null)
  assert.equal(loaded.state.chats.length, 0)
  assert.equal(loaded.state.provisionalDraft, 'pendiente')

  saveState(startNewChat(loaded.state))
  loaded = loadState()
  assert.equal(loaded.state.chats.length, 1)
  assert.equal(loaded.state.chats[0].draft, 'pendiente')
  assert.equal(loaded.state.provisionalDraft, '')
  assert.equal(data[FOREIGN_KEY], 'intacto')
})

test('sin datos guardados no hay aviso', () => {
  installStorage()
  const { state, warning } = loadState()
  assert.equal(warning, null)
  assert.deepEqual(state, createEmptyState())
})

const corruptedCases = {
  'JSON inválido': '{no es json',
  'no es objeto': '42',
  'chats no es lista': JSON.stringify({ chats: {}, activeId: null, provisionalDraft: '' }),
  'chat sin nombre': JSON.stringify({
    chats: [{ id: 'a', name: '  ', customName: false, draft: '' }],
    activeId: null,
    provisionalDraft: '',
  }),
  'ids repetidos': JSON.stringify({
    chats: [
      { id: 'a', name: 'A', customName: false, draft: '' },
      { id: 'a', name: 'B', customName: false, draft: '' },
    ],
    activeId: null,
    provisionalDraft: '',
  }),
  'activeId inexistente': JSON.stringify({ chats: [], activeId: 'x', provisionalDraft: '' }),
  'borrador provisional inválido': JSON.stringify({ chats: [], activeId: null, provisionalDraft: 5 }),
}

for (const [name, raw] of Object.entries(corruptedCases)) {
  test(`datos dañados (${name}) muestran aviso, parten vacíos y no tocan claves ajenas`, () => {
    const data = installStorage({ [STORAGE_KEY]: raw, [FOREIGN_KEY]: 'intacto' })
    const { state, warning } = loadState()
    assert.equal(warning, CORRUPTED_WARNING)
    assert.deepEqual(state, createEmptyState())
    assert.equal(data[FOREIGN_KEY], 'intacto')
  })
}

test('almacenamiento bloqueado: aviso al cargar y al guardar, y se puede trabajar en memoria', () => {
  installStorage({}, { blocked: true })
  const { state, warning } = loadState()
  assert.equal(warning, BLOCKED_WARNING)
  assert.deepEqual(state, createEmptyState())
  assert.equal(saveState(setActiveDraft(state, 'en memoria')), BLOCKED_WARNING)
})

test('guardar escribe solo la clave propia', () => {
  const data = installStorage({ [FOREIGN_KEY]: 'intacto' })
  assert.equal(saveState(createEmptyState()), null)
  assert.deepEqual(Object.keys(data).sort(), [FOREIGN_KEY, STORAGE_KEY].sort())
  assert.equal(data[FOREIGN_KEY], 'intacto')
})

test('formato anterior sin messages: se recupera con [] y conserva nombres, selección y borradores', () => {
  const old = {
    chats: [
      { id: 'a', name: 'Recetas', customName: true, draft: 'pendiente' },
      { id: 'b', name: 'Nuevo chat', customName: false, draft: '' },
    ],
    activeId: 'a',
    provisionalDraft: 'prov',
  }
  const data = installStorage({ [STORAGE_KEY]: JSON.stringify(old), [FOREIGN_KEY]: 'intacto' })
  const { state, warning } = loadState()
  assert.equal(warning, null)
  assert.deepEqual(state.chats.map((c) => c.messages), [[], []])
  assert.deepEqual(state.chats.map((c) => [c.name, c.customName, c.draft]), [
    ['Recetas', true, 'pendiente'],
    ['Nuevo chat', false, ''],
  ])
  assert.equal(state.activeId, 'a')
  assert.equal(state.provisionalDraft, 'prov')
  assert.equal(data[FOREIGN_KEY], 'intacto')
})

test('respuestas y errores guardados se recuperan intactos', () => {
  installStorage()
  let state = sendDraft(setActiveDraft(createEmptyState(), 'hola'))
  const chatId = state.activeId
  state = resolveMessage(state, chatId, state.chats[0].messages[0].id, 'respuesta')
  state = sendDraft(setActiveDraft(state, 'segunda'))
  state = failMessage(state, chatId, state.chats[0].messages[1].id, { category: 'timeout', message: 'tardó' })
  saveState(state)
  assert.deepEqual(loadState().state, state)
})

test('una pregunta pendiente al recargar queda interrumpida y fallida, sin respuesta ni bloqueo', () => {
  installStorage()
  const pending = sendDraft(setActiveDraft(createEmptyState(), 'hola'))
  saveState(pending)
  const { state, warning } = loadState()
  assert.equal(warning, null)
  const [message] = state.chats[0].messages
  assert.deepEqual([message.status, message.answer, message.error.category], ['failed', null, 'interrupted'])
  assert.equal(message.content, 'hola')
})

test('mensajes anteriores sin estado se recuperan como no enviados y reintentables', () => {
  const old = {
    chats: [
      {
        id: 'a',
        name: 'Viejo',
        customName: false,
        draft: 'borr',
        messages: [{ id: 'm1', author: 'user', content: 'hola', createdAt: '2025-01-01T00:00:00.000Z' }],
      },
    ],
    activeId: 'a',
    provisionalDraft: '',
  }
  installStorage({ [STORAGE_KEY]: JSON.stringify(old) })
  const { state, warning } = loadState()
  assert.equal(warning, null)
  const [message] = state.chats[0].messages
  assert.deepEqual([message.status, message.answer, message.error.category, message.content], ['failed', null, 'unsent', 'hola'])
  assert.equal(state.chats[0].draft, 'borr')
})

const corruptedMessages = {
  'messages no es lista': { messages: 'x' },
  'mensaje con autor inválido': { messages: [{ id: 'm', author: 'bot', content: 'x', createdAt: '2025-01-01T00:00:00.000Z' }] },
  'mensaje sin contenido': { messages: [{ id: 'm', author: 'user', content: '', createdAt: '2025-01-01T00:00:00.000Z' }] },
  'mensaje con fecha inválida': { messages: [{ id: 'm', author: 'user', content: 'x', createdAt: 'nunca' }] },
  'ids de mensaje repetidos': {
    messages: [
      { id: 'm', author: 'user', content: 'x', createdAt: '2025-01-01T00:00:00.000Z' },
      { id: 'm', author: 'user', content: 'y', createdAt: '2025-01-01T00:00:00.000Z' },
    ],
  },
}

for (const [name, extra] of Object.entries(corruptedMessages)) {
  test(`mensajes dañados (${name}) se tratan como datos dañados`, () => {
    const chat = { id: 'a', name: 'A', customName: false, draft: '', ...extra }
    installStorage({ [STORAGE_KEY]: JSON.stringify({ chats: [chat], activeId: null, provisionalDraft: '' }) })
    const { state, warning } = loadState()
    assert.equal(warning, CORRUPTED_WARNING)
    assert.deepEqual(state, createEmptyState())
  })
}

const corruptedStatus = {
  'respondido sin respuesta': { status: 'answered' },
  'respuesta con questionId ajeno': { status: 'answered', answer: { id: 'r', questionId: 'otro', content: 'x', createdAt: '2025-01-01T00:00:00.000Z' } },
  'fallido sin error': { status: 'failed' },
  'estado desconocido': { status: 'raro' },
}

for (const [name, extra] of Object.entries(corruptedStatus)) {
  test(`estado de mensaje dañado (${name}) se trata como datos dañados`, () => {
    const message = { id: 'm', author: 'user', content: 'x', createdAt: '2025-01-01T00:00:00.000Z', ...extra }
    const chat = { id: 'a', name: 'A', customName: false, draft: '', messages: [message] }
    installStorage({ [STORAGE_KEY]: JSON.stringify({ chats: [chat], activeId: null, provisionalDraft: '' }) })
    assert.equal(loadState().warning, CORRUPTED_WARNING)
  })
}
