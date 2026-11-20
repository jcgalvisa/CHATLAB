import Button from './Button'

// Confirmación en línea para eliminar un chat; Escape también cancela.
export default function DeleteChatConfirm({ chatName, onConfirm, onCancel }) {
  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <div role="group" aria-label={`Confirmar eliminación de ${chatName}`} onKeyDown={handleKeyDown} className="flex flex-col gap-2 rounded-lg bg-panel p-2">
      <p className="break-words text-xs text-body">¿Eliminar "{chatName}"?</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="compact" autoFocus onClick={onConfirm}>
          Eliminar
        </Button>
        <Button variant="compactSubtle" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}
