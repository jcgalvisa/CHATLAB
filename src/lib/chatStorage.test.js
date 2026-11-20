// Pruebas aisladas de persistencia con un localStorage simulado (ejecutar con: npm test).
import test from 'node:test'
import assert from 'node:assert/strict'
import { loadState, saveState, STORAGE_KEY, CORRUPTED_WARNING, BLOCKED_WARNING } from './chatStorage.js'
import { createEmptyState, setActiveDraft, startNewChat } from './chatOperations.js'

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
