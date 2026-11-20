import { ChatIcon } from './Icons'

// Bienvenida centrada horizontalmente y ubicada en la parte superior del área de chat.
export default function Welcome() {
  return (
    <section className="flex min-h-0 flex-col items-center gap-3 overflow-y-auto px-6 pt-16 text-center sm:pt-24">
      <span className="rounded-2xl border border-line bg-panel p-3 text-body">
        <ChatIcon className="size-5" />
      </span>
      <h1 className="text-base font-semibold">¿En qué puedo ayudarte?</h1>
      <p className="max-w-xs text-xs text-muted sm:max-w-sm">
        Escribe una pregunta para comenzar. La respuesta aparecerá cuando conectemos el servicio de IA.
      </p>
    </section>
  )
}
