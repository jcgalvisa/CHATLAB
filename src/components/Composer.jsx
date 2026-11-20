import Button from './Button'
import TextField from './TextField'
import { ArrowUpIcon } from './Icons'

// Compositor controlado: el texto es el borrador del chat activo (o el provisional).
// El envío sigue deshabilitado hasta conectar la IA.
export default function Composer({ value, onChange }) {
  return (
    <div className="flex justify-center px-4 pb-4">
      <div className="flex w-full max-w-xl flex-col gap-3 rounded-xl border border-line bg-panel p-3.5">
        <TextField
          multiline
          label="Escribe un mensaje"
          placeholder="Escribe un mensaje..."
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-hover px-2.5 py-1 text-xs text-body">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-strong" />
            Chat
          </span>
          <Button variant="send" label="Enviar mensaje" disabled>
            <ArrowUpIcon className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
