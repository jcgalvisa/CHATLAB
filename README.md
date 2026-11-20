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

## Conexión con el backend (RAGLAB)

CHATLAB envía cada pregunta a `POST /api/chat` del backend RAGLAB con `question` y `history` (hasta diez turnos completos anteriores, como `{ "user", "assistant" }`). La URL base se toma de `VITE_API_URL`; si no existe, se usa `http://127.0.0.1:8010`. Para cambiarla copia `.env.example` a `.env.local` (no se versiona y no se sobrescribe ningún `.env` existente).

El backend debe estar levantado (`python -m uvicorn api.app:app --port 8010`) y permitir el origen `http://localhost:8000`. La clave del proveedor de IA vive solo en el backend.

Los errores se muestran junto a la pregunta, que se conserva y se puede reintentar manualmente (sin reintentos automáticos). Si recargas con una respuesta pendiente, la pregunta queda como interrumpida y se puede reintentar.

## Pruebas

```bash
npm test
```

Ejecuta las pruebas unitarias (operaciones, almacenamiento y servicio HTTP con `fetch` simulado). No consulta el backend.
