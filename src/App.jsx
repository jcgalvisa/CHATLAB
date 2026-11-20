import Sidebar from './components/Sidebar'
import ChatHeader from './components/ChatHeader'
import StorageNotice from './components/StorageNotice'
import Welcome from './components/Welcome'
import MessageList from './components/MessageList'
import Composer from './components/Composer'
import { useChats } from './hooks/useChats'
import { useNewChatShortcut } from './hooks/useNewChatShortcut'
import { getActiveDraft, getActiveMessages, getActiveTitle } from './lib/chatOperations'
import { isActiveChatBusy } from './lib/messageOperations'

function App() {
  const chats = useChats()
  useNewChatShortcut(chats.startNewChat)

  // Sin mensajes se muestra la bienvenida; con mensajes, el historial del chat activo.
  const messages = getActiveMessages(chats.state)
  const isBusy = isActiveChatBusy(chats.state)
  let conversation = <Welcome />
  if (messages.length > 0) {
    conversation = (
      <MessageList
        key={chats.state.activeId}
        messages={messages}
        isChatBusy={isBusy}
        onRetry={(messageId) => chats.retryMessage(chats.state.activeId, messageId)}
      />
    )
  }

  return (
    <div className="grid h-dvh grid-cols-[10.5rem_minmax(0,1fr)] bg-app text-strong sm:grid-cols-[12.5rem_minmax(0,1fr)]">
      <Sidebar
        chats={chats.state.chats}
        activeId={chats.state.activeId}
        onNewChat={chats.startNewChat}
        onSelect={chats.selectChat}
        onRename={chats.renameChat}
        onDelete={chats.deleteChat}
      />
      <main className="flex min-h-0 flex-col">
        <ChatHeader title={getActiveTitle(chats.state)} />
        <StorageNotice message={chats.warning} />
        {conversation}
        <Composer value={getActiveDraft(chats.state)} onChange={chats.updateDraft} onSend={chats.sendMessage} isBusy={isBusy} />
      </main>
    </div>
  )
}

export default App
