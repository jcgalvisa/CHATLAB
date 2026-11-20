import { useState } from 'react'
import Button from './Button'
import TextField from './TextField'
import { normalizeChatName } from '../lib/chatOperations'

// Formulario de renombrado: Enter o Guardar confirma, Escape o Cancelar descarta.
export default function RenameChatForm({ initialName, onSave, onCancel }) {
  const [name, setName] = useState(initialName)
  const [hasError, setHasError] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    const cleanName = normalizeChatName(name)
    if (cleanName === '') {
      setHasError(true)
      return
    }
    onSave(cleanName)
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      onCancel()
    }
  }

  let errorMessage = ''
  if (hasError) {
    errorMessage = 'El nombre no puede estar vacío.'
  }

  return (
    <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col gap-2 rounded-lg bg-panel p-2">
      <TextField
        autoFocus
        label="Nuevo nombre del chat"
        value={name}
        aria-invalid={hasError}
        onChange={(event) => {
          setName(event.target.value)
          setHasError(false)
        }}
      />
      <p role="alert" className="text-xs text-body">
        {errorMessage}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="compact" type="submit">
          Guardar
        </Button>
        <Button variant="compactSubtle" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
