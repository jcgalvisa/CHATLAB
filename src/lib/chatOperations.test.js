// Pruebas aisladas de las operaciones puras (ejecutar con: npm test).
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createEmptyState,
  startNewChat,
  selectChat,
  setActiveDraft,
  renameChat,
  deleteChat,
  filterChats,
  getActiveDraft,
  getActiveTitle,
  getActiveChat,
} from './chatOperations.js'

function stateWithChats(names) {
  let state = createEmptyState()
  for (const name of names) {
    state = startNewChat(state)
    state = renameChat(state, state.activeId, name)
    state = setActiveDraft(state, `borrador ${name}`)
  }
  return state
}

test('el borrador provisional se transfiere una sola vez al crear el primer chat', () => {
  let state = setActiveDraft(createEmptyState(), 'hola')
  assert.equal(getActiveDraft(state), 'hola')
  state = startNewChat(state)
  assert.equal(state.chats.length, 1)
  assert.equal(getActiveDraft(state), 'hola')
  assert.equal(state.provisionalDraft, '')
})

test('ids únicos y chat vacío sin nombre propio se reutiliza', () => {
  let state = startNewChat(createEmptyState())
  const firstId = state.activeId
  state = startNewChat(state)
  assert.equal(state.chats.length, 1)
  assert.equal(state.activeId, firstId)

  state = setActiveDraft(state, 'x')
  state = startNewChat(state)
  assert.equal(state.chats.length, 2)
  assert.equal(new Set(state.chats.map((chat) => chat.id)).size, 2)
})

test('un chat con nombre personalizado no se reutiliza, ni siquiera "Nuevo chat"', () => {
  let state = startNewChat(createEmptyState())
  state = renameChat(state, state.activeId, '  Nuevo chat  ')
  assert.equal(getActiveChat(state).name, 'Nuevo chat')
  assert.equal(getActiveChat(state).customName, true)
  state = startNewChat(state)
  assert.equal(state.chats.length, 2)
})

test('un chat con borrador no se reutiliza', () => {
  let state = setActiveDraft(startNewChat(createEmptyState()), 'texto')
  state = startNewChat(state)
  assert.equal(state.chats.length, 2)
})

test('dos borradores se alternan y se restauran con selección y encabezado', () => {
  let state = stateWithChats(['Uno', 'Dos'])
  const [dos, uno] = state.chats
  assert.equal(state.activeId, dos.id)
  state = selectChat(state, uno.id)
  assert.equal(getActiveDraft(state), 'borrador Uno')
  assert.equal(getActiveTitle(state), 'Uno')
  state = selectChat(state, dos.id)
  assert.equal(getActiveDraft(state), 'borrador Dos')
  assert.equal(getActiveTitle(state), 'Dos')
})

test('el borrador provisional es independiente de los borradores de chats', () => {
  let state = setActiveDraft(createEmptyState(), 'prov')
  state = { ...state, chats: [{ id: 'a', name: 'A', customName: false, draft: 'da' }], activeId: 'a' }
  assert.equal(getActiveDraft(state), 'da')
  assert.equal(state.provisionalDraft, 'prov')
})

test('la búsqueda ignora mayúsculas y una consulta vacía devuelve todo', () => {
  const state = stateWithChats(['Recetas', 'Viajes'])
  assert.deepEqual(filterChats(state.chats, 'rEcE').map((c) => c.name), ['Recetas'])
  assert.equal(filterChats(state.chats, '   ').length, 2)
  assert.equal(filterChats(state.chats, 'zzz').length, 0)
})

test('renombrar recorta espacios y rechaza nombres vacíos', () => {
  let state = stateWithChats(['Uno'])
  const id = state.activeId
  state = renameChat(state, id, '  Nuevo nombre ')
  assert.equal(getActiveTitle(state), 'Nuevo nombre')
  const rejected = renameChat(state, id, '    ')
  assert.equal(rejected, state)
})

test('eliminar una inactiva conserva la selección y las demás', () => {
  let state = stateWithChats(['A', 'B', 'C'])
  const activeId = state.activeId
  const other = state.chats.find((chat) => chat.id !== activeId)
  state = deleteChat(state, other.id)
  assert.equal(state.chats.length, 2)
  assert.equal(state.activeId, activeId)
})

test('eliminar la activa selecciona otra; eliminar la última vuelve al inicio', () => {
  let state = stateWithChats(['A', 'B'])
  const activeId = state.activeId
  state = deleteChat(state, activeId)
  assert.equal(state.chats.length, 1)
  assert.equal(state.activeId, state.chats[0].id)
  state = deleteChat(state, state.activeId)
  assert.equal(state.chats.length, 0)
  assert.equal(state.activeId, null)
  assert.equal(getActiveTitle(state), 'Nuevo chat')
})

test('eliminar conserva el borrador provisional', () => {
  let state = stateWithChats(['A'])
  state = { ...state, provisionalDraft: 'prov' }
  state = deleteChat(state, state.activeId)
  assert.equal(getActiveDraft(state), 'prov')
})
