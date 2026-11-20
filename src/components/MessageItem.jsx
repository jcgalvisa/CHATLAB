import MessageReply from './MessageReply'

function formatTime(isoDate) {
  return new Date(isoDate).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

// Una pregunta (a la derecha) y debajo su respuesta, espera o error (a la izquierda).
export default function MessageItem({ message, isChatBusy, onRetry }) {
  return (
    <li className="flex min-w-0 flex-col gap-2">
      <div className="flex min-w-0 flex-col items-end gap-1">
        <p
          data-author="user"
          className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-panel-selected px-4 py-2 text-sm text-strong wrap-anywhere"
        >
          {message.content}
        </p>
        <time dateTime={message.createdAt} className="text-xs text-subtle">
          {formatTime(message.createdAt)}
        </time>
      </div>
      <MessageReply message={message} isChatBusy={isChatBusy} onRetry={() => onRetry(message.id)} />
    </li>
  )
}
