import { useState } from 'react'
import Button from './Button'
import ChatList from './ChatList'
import TextField from './TextField'
import { ChatIcon, CloseIcon, PlusIcon, SearchIcon } from './Icons'
import { filterChats } from '../lib/chatOperations'

// Barra lateral: marca, nuevo chat, búsqueda e historial. La búsqueda es estado local.
export default function Sidebar({ chats, activeId, onNewChat, onSelect, onRename, onDelete }) {
  const [query, setQuery] = useState('')

  const visibleChats = filterChats(chats, query)
  const isSearching = query.trim() !== ''

  // Distingue "no hay conversaciones" de "ninguna coincide con la búsqueda".
  let emptyMessage = 'Aún no hay conversaciones.'
  if (isSearching) {
    emptyMessage = 'Sin coincidencias.'
  }

  // El botón de limpiar solo existe mientras hay texto de búsqueda.
  let clearSearchButton = null
  if (isSearching) {
    clearSearchButton = (
      <Button variant="compactSubtle" onClick={() => setQuery('')}>
        <CloseIcon className="size-3" />
        Limpiar búsqueda
      </Button>
    )
  }

  return (
    <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto border-r border-line bg-sidebar p-3">
      <div className="flex items-center gap-2 px-1">
        <span className="rounded-lg bg-inverse p-1.5 text-on-inverse">
          <ChatIcon className="size-4" />
        </span>
        <span className="text-xs font-bold tracking-wide">CHATLAB</span>
      </div>

      <Button onClick={onNewChat}>
        <PlusIcon className="size-4" />
        Nuevo chat
      </Button>

      <TextField
        label="Buscar chats"
        placeholder="Buscar chats"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        icon={<SearchIcon className="size-3.5 shrink-0 text-muted" />}
      />
      {clearSearchButton}

      <nav aria-label="Historial de conversaciones" className="flex flex-col gap-1">
        <h2 className="px-1 pt-1 text-xs font-medium uppercase text-muted">Conversaciones</h2>
        <ChatList
          chats={visibleChats}
          activeId={activeId}
          emptyMessage={emptyMessage}
          onSelect={onSelect}
          onRename={onRename}
          onDelete={onDelete}
        />
      </nav>
    </aside>
  )
}
