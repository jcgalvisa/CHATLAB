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
  getActiveMessages,
  sendDraft,
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

test('enviar: texto vacío o solo espacios no crea nada ni limpia el borrador', () => {
  const empty = createEmptyState()
  assert.equal(sendDraft(empty), empty)
  const spaces = setActiveDraft(startNewChat(createEmptyState()), '   \n  ')
  assert.equal(sendDraft(spaces), spaces)
})

test('enviar desde el provisional crea el chat, un mensaje con id, autor, contenido y fecha', () => {
  let state = setActiveDraft(createEmptyState(), '  hola mundo  ')
  state = sendDraft(state)
  assert.equal(state.chats.length, 1)
  assert.equal(state.provisionalDraft, '')
  const [message] = getActiveMessages(state)
  assert.equal(getActiveMessages(state).length, 1)
  assert.equal(message.content, 'hola mundo')
  assert.equal(message.author, 'user')
  assert.ok(message.id.length > 0)
  assert.ok(!Number.isNaN(Date.parse(message.createdAt)))
  assert.equal(getActiveDraft(state), '')
})

test('un segundo envío inmediato no duplica el mensaje', () => {
  let state = sendDraft(setActiveDraft(createEmptyState(), 'uno'))
  const again = sendDraft(state)
  assert.equal(again, state)
  assert.equal(getActiveMessages(again).length, 1)
})

test('conserva saltos de línea internos y ids únicos entre mensajes', () => {
  let state = sendDraft(setActiveDraft(createEmptyState(), 'a\nb'))
  state = sendDraft(setActiveDraft(state, 'c'))
  const messages = getActiveMessages(state)
  assert.equal(messages[0].content, 'a\nb')
  assert.notEqual(messages[0].id, messages[1].id)
})

test('el primer mensaje genera el título; los siguientes no lo sustituyen', () => {
  let state = sendDraft(setActiveDraft(createEmptyState(), 'Primera pregunta\nsegunda línea'))
  assert.equal(getActiveTitle(state), 'Primera pregunta')
  state = sendDraft(setActiveDraft(state, 'otro mensaje'))
  assert.equal(getActiveTitle(state), 'Primera pregunta')
  assert.equal(getActiveChat(state).customName, false)
})

test('un título largo se recorta', () => {
  const state = sendDraft(setActiveDraft(createEmptyState(), 'x'.repeat(100)))
  assert.equal(getActiveTitle(state), 'x'.repeat(40) + '…')
})

test('el nombre manual, incluso "Nuevo chat", se respeta al enviar el primer mensaje', () => {
  for (const manual of ['Nuevo chat', 'Mi nombre']) {
    let state = startNewChat(createEmptyState())
    state = renameChat(state, state.activeId, manual)
    state = sendDraft(setActiveDraft(state, 'hola'))
    assert.equal(getActiveTitle(state), manual)
  }
})

test('dos chats con borradores independientes: enviar en uno no toca al otro', () => {
  let state = sendDraft(setActiveDraft(createEmptyState(), 'A1'))
  const idA = state.activeId
  state = startNewChat(state)
  const idB = state.activeId
  assert.notEqual(idA, idB)
  state = setActiveDraft(state, 'borradorB')
  state = setActiveDraft(selectChat(state, idA), 'borradorA')
  state = sendDraft(state)
  const a = state.chats.find((c) => c.id === idA)
  const b = state.chats.find((c) => c.id === idB)
  assert.equal(a.messages.length, 2)
  assert.equal(a.draft, '')
  assert.equal(b.messages.length, 0)
  assert.equal(b.draft, 'borradorB')
})

test('Nuevo chat tras enviar crea otro; con uno vacío lo reutiliza', () => {
  let state = sendDraft(setActiveDraft(createEmptyState(), 'hola'))
  state = startNewChat(state)
  assert.equal(state.chats.length, 2)
  const emptyId = state.activeId
  state = selectChat(state, state.chats.find((c) => c.id !== emptyId).id)
  state = startNewChat(state)
  assert.equal(state.chats.length, 2)
  assert.equal(state.activeId, emptyId)
})

test('un chat sin borrador ni nombre propio pero con mensajes no se reutiliza', () => {
  let state = sendDraft(setActiveDraft(createEmptyState(), 'hola'))
  assert.equal(getActiveDraft(state), '')
  state = startNewChat(state)
  assert.equal(state.chats.length, 2)
})
