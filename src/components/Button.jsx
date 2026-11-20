// Botón base con variantes; todos los colores vienen de los tokens de theme.css.
const baseClasses =
  'inline-flex items-center justify-center gap-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed'

const variantClasses = {
  primary:
    'w-full rounded-lg bg-inverse px-3 py-2.5 text-on-inverse hover:bg-inverse-hover disabled:bg-disabled-surface disabled:text-disabled-text',
  icon: 'rounded-md p-1.5 text-muted hover:bg-hover disabled:text-subtle',
  send: 'rounded-lg bg-send-disabled p-2 text-send-disabled-text',
  // Entrada del historial: ocupa el ancho disponible y recorta el texto largo.
  item: 'min-w-0 flex-1 justify-start rounded-lg px-3 py-2 text-xs text-body hover:bg-hover',
  compact: 'rounded-md bg-inverse px-2 py-1 text-xs text-on-inverse hover:bg-inverse-hover',
  compactSubtle: 'rounded-md bg-panel-selected px-2 py-1 text-xs text-body hover:bg-hover',
}

export default function Button({ variant = 'primary', label, className = '', children, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
