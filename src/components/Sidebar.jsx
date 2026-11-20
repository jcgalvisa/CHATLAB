import Button from './Button'
import TextField from './TextField'
import { ChatIcon, PlusIcon, SearchIcon } from './Icons'

// Barra lateral: marca, acciones (deshabilitadas en esta fase) e historial.
export default function Sidebar({ currentChatTitle }) {
  return (
    <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto border-r border-line bg-sidebar p-3">
      <div className="flex items-center gap-2 px-1">
        <span className="rounded-lg bg-inverse p-1.5 text-on-inverse">
          <ChatIcon className="size-4" />
        </span>
        <span className="text-xs font-bold tracking-wide">CHATLAB</span>
      </div>

      <Button disabled>
        <PlusIcon className="size-4" />
        Nuevo chat
      </Button>

      <TextField
        disabled
        label="Buscar chats"
        placeholder="Buscar chats"
        icon={<SearchIcon className="size-3.5 shrink-0 text-muted" />}
      />

      <nav aria-label="Historial de conversaciones" className="flex flex-col gap-1">
        <h2 className="px-1 pt-1 text-xs font-medium uppercase text-muted">Conversaciones</h2>
        {/* Marcador del chat en borrador; no es una conversación guardada. */}
        <p aria-current="page" className="truncate rounded-lg bg-panel-selected px-3 py-2 text-xs font-medium text-body">
          {currentChatTitle}
        </p>
      </nav>
    </aside>
  )
}
