// Botón base con variantes; todos los colores vienen de los tokens de theme.css.
const baseClasses =
  'inline-flex items-center justify-center gap-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed'

const variantClasses = {
  primary:
    'w-full rounded-lg bg-inverse px-3 py-2.5 text-on-inverse hover:bg-inverse-hover disabled:bg-disabled-surface disabled:text-disabled-text',
  icon: 'rounded-md p-1.5 text-muted hover:bg-hover disabled:text-subtle',
  send: 'rounded-lg bg-send-disabled p-2 text-send-disabled-text',
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
