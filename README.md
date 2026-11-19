# CHATLAB

Proyecto didáctico para construir una interfaz de chat con React y Tailwind CSS y, en una etapa posterior, conectarla a una API en Python.

## Requisitos

- Node.js LTS compatible con la versión de Vite del proyecto.
- Git para clonar el repositorio.

Comprueba que Node.js y npm estén disponibles:

```bash
node -v
npm -v
```

## Preparar y ejecutar

Desde la carpeta del proyecto:

```bash
npm ci
npm run dev
```

Abre <http://localhost:8000> en el navegador. El puerto está fijado; si ya está ocupado, Vite mostrará un error para evitar iniciar silenciosamente en otra dirección.

`node_modules/` se genera localmente con `npm ci` y no se sube al repositorio. No pongas claves de proveedores de IA en variables `VITE_*`: esas variables quedan disponibles para el código del navegador.
