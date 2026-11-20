import { useEffect } from 'react'

// Ejecuta onNewChat con Ctrl+K (Windows/Linux) o Cmd+K (macOS).
export function useNewChatShortcut(onNewChat) {
  useEffect(() => {
    function handleKeyDown(event) {
      const hasModifier = event.ctrlKey || event.metaKey
      if (!hasModifier || event.key.toLowerCase() !== 'k') {
        return
      }
      event.preventDefault()
      onNewChat()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onNewChat])
}
