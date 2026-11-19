function App() {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-12">
      <section className="w-full max-w-2xl text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
          React · Vite · Tailwind CSS
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          CHATLAB
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-slate-600">
          El entorno está listo. En esta clase construiremos la interfaz de un chat
          y luego la conectaremos con una API de IA.
        </p>
        <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
          <span aria-hidden="true" className="size-2 rounded-full bg-emerald-500" />
          Aplicación iniciada correctamente
        </div>
      </section>
    </main>
  )
}

export default App
