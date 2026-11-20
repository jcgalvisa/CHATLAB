import { useRef } from 'react'
import Button from './Button'
import TextField from './TextField'
import { ArrowUpIcon } from './Icons'
import { MAX_TEXT_LENGTH } from '../lib/chatLimits'

// Compositor controlado: el texto es el borrador del chat activo (o el provisional).
// Botón y Enter comparten handleSend; la validación del texto vive en la operación de envío.
// Con una pregunta pendiente en el chat (isBusy) no se puede enviar, pero sí seguir escribiendo.
export default function Composer({ value, onChange, onSend, isBusy }) {
  const fieldRef = useRef(null)
  const length = value.trim().length
  const isTooLong = length > MAX_TEXT_LENGTH
  const canSend = length > 0 && !isTooLong && !isBusy

  let hint = null
  if (isTooLong) {
    hint = (
      <p role="status" className="text-xs text-body">
        El mensaje supera el máximo de {MAX_TEXT_LENGTH} caracteres ({length}).
      </p>
    )
  }

  function handleSend() {
    onSend()
    fieldRef.current.focus()
  }

  function handleKeyDown(event) {
    if (event.key !== 'Enter' || event.shiftKey) {
      return
    }
    // Enter confirma una composición (IME): no debe enviar.
    if (event.nativeEvent.isComposing) {
      return
    }
    event.preventDefault()
    handleSend()
  }

  return (
    <div className="flex justify-center px-4 pb-4">
      <div className="flex w-full max-w-xl flex-col gap-3 rounded-xl border border-line bg-panel p-3.5">
        <TextField
          multiline
          ref={fieldRef}
          label="Escribe un mensaje"
          placeholder="Escribe un mensaje..."
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        {hint}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-hover px-2.5 py-1 text-xs text-body">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-strong" />
            Chat
          </span>
          <Button variant="send" label="Enviar mensaje" disabled={!canSend} onClick={handleSend}>
            <ArrowUpIcon className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
