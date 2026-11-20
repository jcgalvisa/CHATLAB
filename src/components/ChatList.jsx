import ChatListItem from './ChatListItem'

// Lista de conversaciones; si no hay ninguna que mostrar, explica el motivo recibido.
export default function ChatList({ chats, activeId, emptyMessage, onSelect, onRename, onDelete }) {
  if (chats.length === 0) {
    return <p className="px-1 text-xs text-muted">{emptyMessage}</p>
  }

  return (
    <ul className="flex flex-col gap-1">
      {chats.map((chat) => (
        <ChatListItem
          key={chat.id}
          chat={chat}
          isActive={chat.id === activeId}
          onSelect={onSelect}
          onRename={onRename}
          onDelete={onDelete}
        />
      ))}
    </ul>
  )
}
