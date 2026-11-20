import Sidebar from './components/Sidebar'
import ChatHeader from './components/ChatHeader'
import Welcome from './components/Welcome'
import Composer from './components/Composer'

// Título compartido por el historial lateral y el encabezado.
const NEW_CHAT_TITLE = 'Nuevo chat'

function App() {
  return (
    <div className="grid h-dvh grid-cols-[10.5rem_minmax(0,1fr)] bg-app text-strong sm:grid-cols-[12.5rem_minmax(0,1fr)]">
      <Sidebar currentChatTitle={NEW_CHAT_TITLE} />
      <main className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto]">
        <ChatHeader title={NEW_CHAT_TITLE} />
        <Welcome />
        <Composer />
      </main>
    </div>
  )
}

export default App
