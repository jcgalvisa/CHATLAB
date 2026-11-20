// Pruebas aisladas del servicio HTTP con fetch simulado (ejecutar con: npm test). No usa la red.
import test from 'node:test'
import assert from 'node:assert/strict'
import { ChatApiError, ERROR_MESSAGES, describeApiError, getChatEndpoint, requestChatAnswer } from './chatApi.js'

let calls
function mockFetch(handler) {
  calls = []
  globalThis.fetch = async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body), options })
    return handler(options)
  }
}
const jsonResponse = (status, body) => new Response(JSON.stringify(body), { status })
const errorBody = (code) => ({ error: { code, message: 'texto del backend' } })
const request = { question: '  hola  ', history: [{ user: ' a ', assistant: ' b ' }] }

async function categoryOf(promise) {
  try {
    await promise
  } catch (error) {
    assert.ok(error instanceof ChatApiError)
    return error.category
  }
  return 'sin error'
}

test('el endpoint usa el valor por defecto sin VITE_API_URL', () => {
  assert.equal(getChatEndpoint(), 'http://127.0.0.1:8010/api/chat')
})

test('envía POST JSON con question e history recortados y devuelve answer sin mostrar sources', async () => {
  mockFetch(() => jsonResponse(200, { answer: '  hola Ana  ', sources: ['a.txt'] }))
  const answer = await requestChatAnswer(request)
  assert.equal(answer, 'hola Ana')
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, 'http://127.0.0.1:8010/api/chat')
  assert.equal(calls[0].options.method, 'POST')
  assert.deepEqual(calls[0].body, { question: 'hola', history: [{ user: 'a', assistant: 'b' }] })
})

const invalidRequests = {
  'pregunta vacía': { question: '   ', history: [] },
  'pregunta de más de 8000': { question: 'x'.repeat(8001), history: [] },
  'más de diez turnos': { question: 'q', history: Array.from({ length: 11 }, () => ({ user: 'a', assistant: 'b' })) },
  'turno con texto vacío': { question: 'q', history: [{ user: 'a', assistant: ' ' }] },
  'turno con texto largo': { question: 'q', history: [{ user: 'a', assistant: 'x'.repeat(8001) }] },
  'history no es lista': { question: 'q', history: 'no' },
}
for (const [name, bad] of Object.entries(invalidRequests)) {
  test(`valida antes de consultar (${name}): error de validación y sin fetch`, async () => {
    mockFetch(() => jsonResponse(200, { answer: 'x' }))
    assert.equal(await categoryOf(requestChatAnswer(bad)), 'validation')
    assert.equal(calls.length, 0)
  })
}

test('el límite exacto de 8000 caracteres y diez turnos es válido', async () => {
  mockFetch(() => jsonResponse(200, { answer: 'ok' }))
  const history = Array.from({ length: 10 }, () => ({ user: 'a', assistant: 'x'.repeat(8000) }))
  assert.equal(await requestChatAnswer({ question: 'x'.repeat(8000), history }), 'ok')
})

const backendErrors = [
  [422, 'validation_error', 'validation'],
  [503, 'missing_api_key', 'configuration'],
  [503, 'provider_authentication_error', 'configuration'],
  [503, 'provider_model_not_found', 'configuration'],
  [503, 'provider_quota_exceeded', 'availability'],
  [503, 'provider_rate_limited', 'availability'],
  [503, 'provider_unavailable', 'availability'],
  [502, 'provider_connection_error', 'connection'],
  [504, 'provider_timeout', 'timeout'],
  [502, 'provider_malformed_response', 'format'],
  [502, 'provider_empty_response', 'format'],
  [502, 'provider_rejected_request', 'format'],
]
for (const [status, code, category] of backendErrors) {
  test(`HTTP ${status} con error.code ${code} -> ${category}`, async () => {
    mockFetch(() => jsonResponse(status, errorBody(code)))
    assert.equal(await categoryOf(requestChatAnswer(request)), category)
    assert.equal(calls.length, 1, 'sin reintentos automáticos')
  })
}

test('sin error.code se usa el estado HTTP; 5xx genérico es disponibilidad; 4xx genérico es formato', async () => {
  for (const [status, category] of [[422, 'validation'], [502, 'connection'], [503, 'availability'], [504, 'timeout'], [500, 'availability'], [404, 'format']]) {
    mockFetch(() => new Response('<html>error</html>', { status }))
    assert.equal(await categoryOf(requestChatAnswer(request)), category, `estado ${status}`)
  }
})

test('JSON inválido, answer ausente, vacío o no texto -> formato', async () => {
  const bodies = ['no es json', '{}', '{"answer": "   "}', '{"answer": 5}', 'null', '[]']
  for (const body of bodies) {
    mockFetch(() => new Response(body, { status: 200 }))
    assert.equal(await categoryOf(requestChatAnswer(request)), 'format', body)
  }
})

test('fallo de red (fetch rechaza) -> conexión', async () => {
  mockFetch(() => {
    throw new TypeError('Failed to fetch')
  })
  assert.equal(await categoryOf(requestChatAnswer(request)), 'connection')
  assert.equal(calls.length, 1)
})

test('tiempo límite finito: aborta y clasifica como timeout', async () => {
  calls = []
  globalThis.fetch = (url, options) =>
    new Promise((resolve, reject) => {
      calls.push(1)
      options.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
    })
  const started = Date.now()
  assert.equal(await categoryOf(requestChatAnswer(request, { timeoutMs: 40 })), 'timeout')
  assert.ok(Date.now() - started < 2000)
  assert.equal(calls.length, 1)
})

test('describeApiError devuelve categoría y mensaje; un error ajeno es "unknown"', () => {
  assert.deepEqual(describeApiError(new ChatApiError('timeout')), { category: 'timeout', message: ERROR_MESSAGES.timeout })
  assert.equal(describeApiError(new Error('boom')).category, 'unknown')
})

test('cada categoría tiene un mensaje distinto', () => {
  const messages = Object.values(ERROR_MESSAGES)
  assert.equal(new Set(messages).size, messages.length)
})
