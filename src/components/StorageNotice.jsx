// Aviso visible cuando el almacenamiento está bloqueado o los datos guardados estaban dañados.
export default function StorageNotice({ message }) {
  if (message === null) {
    return null
  }

  return (
    <p role="alert" className="border-b border-line bg-panel px-4 py-2 text-xs text-body">
      {message}
    </p>
  )
}
