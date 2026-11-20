import { useState } from 'react'
import Button from './Button'
import DeleteChatConfirm from './DeleteChatConfirm'
import RenameChatForm from './RenameChatForm'
import { PencilIcon, TrashIcon } from './Icons'

// Una conversación del historial. Solo guarda localmente su modo: 'view' | 'rename' | 'delete'.
export default function ChatListItem({ chat, isActive, onSelect, onRename, onDelete }) {
  const [mode, setMode] = useState('view')

  if (mode === 'rename') {
    return (
      <li>
        <RenameChatForm
          initialName={chat.name}
          onCancel={() => setMode('view')}
          onSave={(name) => {
            onRename(chat.id, name)
            setMode('view')
          }}
        />
      </li>
    )
  }

  if (mode === 'delete') {
    return (
      <li>
        <DeleteChatConfirm chatName={chat.name} onCancel={() => setMode('view')} onConfirm={() => onDelete(chat.id)} />
      </li>
    )
  }

  let rowClasses = 'flex items-center rounded-lg pr-1'
  if (isActive) {
    rowClasses = `${rowClasses} bg-panel-selected`
  }

  return (
    <li className={rowClasses}>
      <Button variant="item" aria-current={isActive} title={chat.name} onClick={() => onSelect(chat.id)}>
        <span className="truncate">{chat.name}</span>
      </Button>
      <Button variant="icon" label={`Renombrar ${chat.name}`} onClick={() => setMode('rename')}>
        <PencilIcon className="size-3.5" />
      </Button>
      <Button variant="icon" label={`Eliminar ${chat.name}`} onClick={() => setMode('delete')}>
        <TrashIcon className="size-3.5" />
      </Button>
    </li>
  )
}
