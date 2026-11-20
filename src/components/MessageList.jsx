import { useEffect, useRef } from 'react'

// Margen (px) para considerar que la lista está "al final".
const BOTTOM_TOLERANCE = 8

function formatTime(isoDate) {
  return new Date(isoDate).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

// Historial desplazable de mensajes del usuario, alineados a la derecha.
// Se usa con key={chatId}: al cambiar de chat se monta de nuevo y baja al último mensaje.
export default function MessageList({ messages }) {
  const listRef = useRef(null)
  // Si la persona estaba al final, se mantiene allí al llegar mensajes o cambiar el alto disponible.
  const isAtBottomRef = useRef(true)

  function scrollToBottom() {
    listRef.current.scrollTop = listRef.current.scrollHeight
  }

  function handleScroll() {
    const list = listRef.current
    isAtBottomRef.current = list.scrollHeight - list.scrollTop - list.clientHeight <= BOTTOM_TOLERANCE
  }

  // Un mensaje nuevo siempre se muestra.
  useEffect(() => {
    scrollToBottom()
  }, [messages.length])

  // Si el compositor crece o la ventana cambia de tamaño, el último mensaje no debe quedar tapado.
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (isAtBottomRef.current) {
        scrollToBottom()
      }
    })
    observer.observe(listRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={listRef}
      aria-label="Mensajes del chat"
      tabIndex={0}
      onScroll={handleScroll}
      className="min-h-0 flex-1 overflow-y-auto px-4 py-4 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
    >
      <ul className="mx-auto flex w-full max-w-xl flex-col gap-3">
        {messages.map((message) => (
          <li key={message.id} className="flex min-w-0 flex-col items-end gap-1">
            <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-panel-selected px-4 py-2 text-sm text-strong wrap-anywhere">
              {message.content}
            </p>
            <time dateTime={message.createdAt} className="text-xs text-subtle">
              {formatTime(message.createdAt)}
            </time>
          </li>
        ))}
      </ul>
    </section>
  )
}
