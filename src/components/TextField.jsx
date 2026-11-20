// Campo de texto reutilizable: input de una línea (con ícono opcional) o textarea (multiline).
const fieldClasses =
  'w-full min-w-0 bg-transparent text-sm text-strong placeholder:text-muted focus:outline-none disabled:cursor-not-allowed'

export default function TextField({ label, icon, multiline = false, ...props }) {
  if (multiline) {
    return (
      <textarea
        aria-label={label}
        rows={1}
        className={`${fieldClasses} max-h-40 resize-none field-sizing-content`}
        {...props}
      />
    )
  }

  return (
    <label className="flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2.5 focus-within:outline-2 focus-within:outline-focus has-[[aria-invalid=true]]:border-strong">
      {icon}
      <input type="text" aria-label={label} className={fieldClasses} {...props} />
    </label>
  )
}
