// Cliente HTTP de POST /api/chat (RAGLAB). Sin React ni estado: recibe una solicitud y
// devuelve el texto de la respuesta, o lanza ChatApiError con una categoría estable.
import { MAX_HISTORY_TURNS, MAX_TEXT_LENGTH } from '../lib/chatLimits.js'

const DEFAULT_API_URL = 'http://127.0.0.1:8010'

// Mayor que el tiempo límite del backend (30 s) para que su error 504 llegue antes que el nuestro.
export const REQUEST_TIMEOUT_MS = 45000

export const ERROR_MESSAGES = {
  validation: 'La pregunta no es válida para el servicio. Revisa su longitud e inténtalo de nuevo.',
  configuration: 'El servicio de IA no está configurado correctamente (clave o modelo). Revisa el backend.',
  availability: 'El servicio de IA no está disponible o alcanzó su cuota. Inténtalo más tarde.',
  connection: 'No se pudo conectar con el servicio de IA. Revisa tu conexión y que el backend esté activo.',
  format: 'El servicio respondió con un formato inválido.',
  timeout: 'El servicio tardó demasiado en responder.',
  unknown: 'Ocurrió un error inesperado al consultar el servicio.',
}

// Código estable de error.code (cuerpo {"error": {"code", "message"}}) -> categoría.
const CATEGORY_BY_CODE = {
  validation_error: 'validation',
  missing_api_key: 'configuration',
  provider_authentication_error: 'configuration',
  provider_model_not_found: 'configuration',
  provider_quota_exceeded: 'availability',
  provider_rate_limited: 'availability',
  provider_unavailable: 'availability',
  provider_connection_error: 'connection',
  provider_timeout: 'timeout',
  provider_malformed_response: 'format',
  provider_empty_response: 'format',
  provider_rejected_request: 'format',
}

// Respaldo cuando el cuerpo no trae un código conocido: se usa el estado HTTP.
const CATEGORY_BY_STATUS = { 422: 'validation', 502: 'connection', 503: 'availability', 504: 'timeout' }

export class ChatApiError extends Error {
  constructor(category) {
    super(ERROR_MESSAGES[category])
    this.category = category
  }
}

// Convierte cualquier error capturado en { category, message } listo para guardar y mostrar.
export function describeApiError(error) {
  if (error instanceof ChatApiError) {
    return { category: error.category, message: error.message }
  }
  return { category: 'unknown', message: ERROR_MESSAGES.unknown }
}

// VITE_API_URL manda; sin ella se usa el backend local. No se guarda ninguna clave en React.
export function getChatEndpoint() {
  const configuredUrl = import.meta.env?.VITE_API_URL
  let baseUrl = DEFAULT_API_URL
  if (typeof configuredUrl === 'string' && configuredUrl.trim() !== '') {
    baseUrl = configuredUrl.trim()
  }
  return `${baseUrl.replace(/\/+$/, '')}/api/chat`
}

function isValidText(value) {
  return typeof value === 'string' && value.trim().length >= 1 && value.trim().length <= MAX_TEXT_LENGTH
}

// Valida y normaliza (textos recortados) antes de tocar la red.
function buildPayload(request) {
  const history = request?.history
  if (!isValidText(request?.question) || !Array.isArray(history) || history.length > MAX_HISTORY_TURNS) {
    throw new ChatApiError('validation')
  }
  const turns = history.map((turn) => {
    if (!isValidText(turn?.user) || !isValidText(turn?.assistant)) {
      throw new ChatApiError('validation')
    }
    return { user: turn.user.trim(), assistant: turn.assistant.trim() }
  })
  return { question: request.question.trim(), history: turns }
}

// Fallo de transporte: el temporizador aborta con AbortError; cualquier otro es de conexión.
function toTransportError(error) {
  if (error?.name === 'AbortError') {
    return new ChatApiError('timeout')
  }
  return new ChatApiError('connection')
}

function parseJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

function categoryFromErrorResponse(status, body) {
  const code = body?.error?.code
  if (typeof code === 'string' && code in CATEGORY_BY_CODE) {
    return CATEGORY_BY_CODE[code]
  }
  if (status in CATEGORY_BY_STATUS) {
    return CATEGORY_BY_STATUS[status]
  }
  if (status >= 500) {
    return 'availability'
  }
  return 'format'
}

// Pide la respuesta del asistente. Sin reintentos automáticos y con tiempo límite finito.
export async function requestChatAnswer(request, { timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
  const payload = buildPayload(request)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  let status
  let text
  try {
    const response = await fetch(getChatEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    status = response.status
    text = await response.text()
  } catch (error) {
    throw toTransportError(error)
  } finally {
    clearTimeout(timer)
  }

  const body = parseJson(text)
  if (status < 200 || status >= 300) {
    throw new ChatApiError(categoryFromErrorResponse(status, body))
  }
  const answer = body?.answer
  if (typeof answer !== 'string' || answer.trim() === '') {
    throw new ChatApiError('format')
  }
  // `sources` se ignora a propósito: no se muestra.
  return answer.trim()
}
