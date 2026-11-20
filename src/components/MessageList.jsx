import { useEffect, useRef } from 'react'
import MessageItem from './MessageItem'

// Margen (px) para considerar que la lista está "al final".
const BOTTOM_TOLERANCE = 8

// Historial desplazable: preguntas a la derecha y respuestas a la izquierda.
// Se usa con key={chatId}: al cambiar de chat se monta de nuevo y baja al último mensaje.
export default function MessageList({ messages, isChatBusy, onRetry }) {
  const listRef = useRef(null)
  const contentRef = useRef(null)
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

  // Si el compositor crece, la ventana cambia de tamaño o una respuesta/error alarga el contenido,
  // el último mensaje no debe quedar tapado (solo si la persona ya estaba al final).
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (isAtBottomRef.current) {
        scrollToBottom()
      }
    })
    observer.observe(listRef.current)
    observer.observe(contentRef.current)
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
      <ul ref={contentRef} className="mx-auto flex w-full max-w-xl flex-col gap-3">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} isChatBusy={isChatBusy} onRetry={onRetry} />
        ))}
      </ul>
    </section>
  )
}
