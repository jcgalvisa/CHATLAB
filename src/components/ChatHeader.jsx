import Button from './Button'
import { SidebarIcon } from './Icons'

// Encabezado compacto con el control lateral (deshabilitado) y el título del chat.
export default function ChatHeader({ title }) {
  return (
    <header className="flex items-center gap-3 border-b border-line px-4 py-2.5">
      <Button variant="icon" label="Mostrar u ocultar barra lateral" disabled>
        <SidebarIcon className="size-4" />
      </Button>
      <p className="truncate text-xs font-semibold">{title}</p>
    </header>
  )
}
