// Pruebas aisladas de mensajes: envío, estados, reintento e historial (ejecutar con: npm test).
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createEmptyState,
  startNewChat,
  selectChat,
  setActiveDraft,
  renameChat,
  deleteChat,
  getActiveChat,
  getActiveDraft,
  getActiveMessages,
  getActiveTitle,
} from './chatOperations.js'
import {
  sendDraft,
  resolveMessage,
  failMessage,
  retryMessage,
  buildChatRequest,
  isChatBusy,
  isActiveChatBusy,
} from './messageOperations.js'

const SERVICE_ERROR = { category: 'availability', message: 'no disponible' }

// Envía `text` en el chat activo (o crea uno) y devuelve el estado y el id del mensaje.
function send(state, text) {
  const next = sendDraft(setActiveDraft(state, text))
  const messages = getActiveMessages(next)
  return { state: next, messageId: messages[messages.length - 1].id }
}

function answered(state, text, answer) {
  const sent = send(state, text)
  return resolveMessage(sent.state, sent.state.activeId, sent.messageId, answer)
}

test('enviar: texto vacío o solo espacios no hace nada', () => {
  const empty = createEmptyState()
  assert.equal(sendDraft(empty), empty)
  const spaces = setActiveDraft(startNewChat(createEmptyState()), '   ')
  assert.equal(sendDraft(spaces), spaces)
})

test('enviar: más de 8000 caracteres no envía; exactamente 8000 sí', () => {
  const tooLong = setActiveDraft(createEmptyState(), 'x'.repeat(8001))
  assert.equal(sendDraft(tooLong), tooLong)
  const limit = sendDraft(setActiveDraft(createEmptyState(), '  ' + 'x'.repeat(8000) + '  '))
  assert.equal(getActiveMessages(limit)[0].content.length, 8000)
})

test('enviar desde el provisional crea el chat y un mensaje pendiente con id, autor, contenido y fecha', () => {
  const { state } = send(createEmptyState(), '  hola mundo  ')
  assert.equal(state.chats.length, 1)
  assert.equal(state.provisionalDraft, '')
  const [message] = getActiveMessages(state)
  assert.equal(message.content, 'hola mundo')
  assert.equal(message.author, 'user')
  assert.equal(message.status, 'pending')
  assert.equal(message.answer, null)
  assert.equal(message.error, null)
  assert.ok(message.id.length > 0)
  assert.ok(!Number.isNaN(Date.parse(message.createdAt)))
  assert.equal(getActiveDraft(state), '')
})

test('un segundo envío inmediato o con el chat pendiente no duplica ni envía', () => {
  const { state } = send(createEmptyState(), 'uno')
  assert.equal(sendDraft(state), state)
  const withDraft = setActiveDraft(state, 'dos')
  assert.equal(sendDraft(withDraft), withDraft)
  assert.equal(getActiveMessages(withDraft).length, 1)
  assert.equal(isActiveChatBusy(state), true)
})

test('título: primer mensaje lo genera, los siguientes no; recorte y saltos de línea', () => {
  let state = answered(createEmptyState(), 'Primera pregunta\nsegunda línea', 'r1')
  assert.equal(getActiveTitle(state), 'Primera pregunta')
  state = send(state, 'otro mensaje').state
  assert.equal(getActiveTitle(state), 'Primera pregunta')
  assert.equal(getActiveChat(state).customName, false)
  assert.equal(getActiveMessages(state)[0].content, 'Primera pregunta\nsegunda línea')
  assert.equal(getActiveTitle(send(createEmptyState(), 'x'.repeat(100)).state), 'x'.repeat(40) + '…')
})

test('el nombre manual, incluso "Nuevo chat", se respeta al enviar', () => {
  for (const manual of ['Nuevo chat', 'Mi nombre']) {
    let state = startNewChat(createEmptyState())
    state = renameChat(state, state.activeId, manual)
    assert.equal(getActiveTitle(send(state, 'hola').state), manual)
  }
})

test('resolver vincula la respuesta a su pregunta por id y la deja respondida', () => {
  const sent = send(createEmptyState(), 'hola')
  const state = resolveMessage(sent.state, sent.state.activeId, sent.messageId, 'respuesta')
  const [message] = getActiveMessages(state)
  assert.equal(message.status, 'answered')
  assert.equal(message.answer.content, 'respuesta')
  assert.equal(message.answer.questionId, sent.messageId)
  assert.ok(message.answer.id.length > 0)
  assert.equal(isActiveChatBusy(state), false)
})

test('fallar conserva la pregunta con su error y libera el chat', () => {
  const sent = send(createEmptyState(), 'hola')
  const state = failMessage(sent.state, sent.state.activeId, sent.messageId, SERVICE_ERROR)
  const [message] = getActiveMessages(state)
  assert.deepEqual([message.status, message.content, message.error], ['failed', 'hola', SERVICE_ERROR])
  assert.equal(isActiveChatBusy(state), false)
})

test('una respuesta tardía de un chat eliminado no lo recrea ni cambia nada', () => {
  const sent = send(createEmptyState(), 'hola')
  const chatId = sent.state.activeId
  const deleted = deleteChat(sent.state, chatId)
  assert.equal(resolveMessage(deleted, chatId, sent.messageId, 'tarde'), deleted)
  assert.equal(failMessage(deleted, chatId, sent.messageId, SERVICE_ERROR), deleted)
  assert.equal(deleted.chats.length, 0)
})

test('una respuesta o error solo aplica a mensajes pendientes (no se pisa un resultado)', () => {
  const sent = send(createEmptyState(), 'hola')
  const state = resolveMessage(sent.state, sent.state.activeId, sent.messageId, 'uno')
  assert.equal(resolveMessage(state, state.activeId, sent.messageId, 'dos'), state)
  assert.equal(failMessage(state, state.activeId, sent.messageId, SERVICE_ERROR), state)
})

test('reintentar: solo fallidos, sin duplicar, bloqueado si hay otro pendiente', () => {
  let { state, messageId } = send(createEmptyState(), 'A')
  const chatId = state.activeId
  assert.equal(retryMessage(state, chatId, messageId), state)
  state = failMessage(state, chatId, messageId, SERVICE_ERROR)
  const retried = retryMessage(state, chatId, messageId)
  assert.equal(getActiveMessages(retried).length, 1)
  assert.deepEqual([getActiveMessages(retried)[0].status, getActiveMessages(retried)[0].error], ['pending', null])
  assert.equal(retryMessage(retried, chatId, messageId), retried)

  // Con B pendiente, reintentar A queda bloqueado.
  const withB = send(state, 'B')
  assert.equal(retryMessage(withB.state, chatId, messageId), withB.state)
})

test('historial: últimos diez turnos completos anteriores; sin pendientes, fallidos ni actual', () => {
  let state = createEmptyState()
  for (let i = 1; i <= 12; i++) {
    state = answered(state, `P${i}`, `R${i}`)
  }
  const failed = send(state, 'fallida')
  state = failMessage(failed.state, failed.state.activeId, failed.messageId, SERVICE_ERROR)
  const pending = send(state, 'actual')
  const request = buildChatRequest(pending.state, pending.state.activeId, pending.messageId)
  assert.equal(request.question, 'actual')
  assert.equal(request.history.length, 10)
  assert.deepEqual(request.history[0], { user: 'P3', assistant: 'R3' })
  assert.deepEqual(request.history[9], { user: 'P12', assistant: 'R12' })
})

test('historial recorta respuestas de más de 8000 caracteres', () => {
  let state = answered(createEmptyState(), 'P1', 'r'.repeat(9000))
  const next = send(state, 'P2')
  const request = buildChatRequest(next.state, next.state.activeId, next.messageId)
  assert.equal(request.history[0].assistant.length, 8000)
})

test('A falla, B responde, reintentar A: su historial no incluye a B y la respuesta queda con A', () => {
  const a = send(createEmptyState(), 'A')
  const chatId = a.state.activeId
  let state = failMessage(a.state, chatId, a.messageId, SERVICE_ERROR)
  const b = send(state, 'B')
  state = resolveMessage(b.state, chatId, b.messageId, 'respuesta B')

  const retried = retryMessage(state, chatId, a.messageId)
  const request = buildChatRequest(retried, chatId, a.messageId)
  assert.deepEqual(request, { question: 'A', history: [] })

  const done = resolveMessage(retried, chatId, a.messageId, 'respuesta A')
  const [first, second] = getActiveMessages(done)
  assert.deepEqual([first.content, first.answer.content, first.answer.questionId], ['A', 'respuesta A', a.messageId])
  assert.deepEqual([second.content, second.answer.content], ['B', 'respuesta B'])
  assert.equal(getActiveMessages(done).length, 2)
})

test('el historial solo usa mensajes del mismo chat', () => {
  let state = answered(createEmptyState(), 'P1', 'R1')
  const firstChatId = state.activeId
  state = startNewChat(state)
  const next = send(state, 'P2')
  const request = buildChatRequest(next.state, next.state.activeId, next.messageId)
  assert.deepEqual(request.history, [])
  assert.notEqual(firstChatId, next.state.activeId)
})

test('Nuevo chat tras enviar crea otro; con uno vacío lo reutiliza; con mensajes no se reutiliza', () => {
  let state = answered(createEmptyState(), 'hola', 'r')
  state = startNewChat(state)
  assert.equal(state.chats.length, 2)
  const emptyId = state.activeId
  state = selectChat(state, state.chats.find((chat) => chat.id !== emptyId).id)
  state = startNewChat(state)
  assert.equal(state.chats.length, 2)
  assert.equal(state.activeId, emptyId)
})

test('dos chats con borradores independientes: enviar en uno no toca al otro', () => {
  let state = answered(createEmptyState(), 'A1', 'rA1')
  const idA = state.activeId
  state = startNewChat(state)
  const idB = state.activeId
  state = setActiveDraft(state, 'borradorB')
  state = setActiveDraft(selectChat(state, idA), 'borradorA')
  state = sendDraft(state)
  const a = state.chats.find((chat) => chat.id === idA)
  const b = state.chats.find((chat) => chat.id === idB)
  assert.equal(a.messages.length, 2)
  assert.equal(a.draft, '')
  assert.deepEqual([b.messages.length, b.draft], [0, 'borradorB'])
  assert.equal(isChatBusy(a), true)
  assert.equal(isChatBusy(b), false)
})

test('un chat pendiente no bloquea a otro chat', () => {
  const sent = send(createEmptyState(), 'A')
  let state = startNewChat(sent.state)
  state = sendDraft(setActiveDraft(state, 'B'))
  assert.equal(state.chats.every((chat) => isChatBusy(chat)), true)
})
