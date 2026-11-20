import Button from './Button'
import { STATUS_ANSWERED, STATUS_FAILED } from '../lib/messageOperations'

// Lado del asistente de un mensaje: respuesta, espera o error con opción de reintentar.
export default function MessageReply({ message, isChatBusy, onRetry }) {
  if (message.status === STATUS_ANSWERED) {
    return (
      <p
        data-author="assistant"
        className="max-w-[85%] self-start whitespace-pre-wrap rounded-2xl border border-line bg-panel px-4 py-2 text-sm text-body wrap-anywhere"
      >
        {message.answer.content}
      </p>
    )
  }

  if (message.status === STATUS_FAILED) {
    return (
      <div role="alert" data-error-category={message.error.category} className="flex max-w-[85%] flex-col items-start gap-2 self-start">
        <p className="rounded-2xl border border-line bg-panel px-4 py-2 text-xs text-body wrap-anywhere">{message.error.message}</p>
        <Button variant="compactSubtle" disabled={isChatBusy} onClick={onRetry}>
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <p role="status" className="self-start px-1 text-xs text-muted">
      Esperando respuesta…
    </p>
  )
}
