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

## Fase actual: historial y borradores locales

Se conserva la interfaz oscura de `origin/Prueb-2.0`, tomando su fase de historial
(`2d2b9ca`) sin incorporar mensajes ni integración con IA. El botón de envío está
deshabilitado. Nuevo chat funciona con el botón, Ctrl+K y Cmd+K, sin etiqueta del atajo.

Las operaciones puras están en `src/lib/chatOperations.js`; la lectura, validación y
escritura en `src/lib/chatStorage.js`; y su conexión con React en `src/hooks/useChats.js`.
Los componentes comparten `Button`, `TextField` y los tokens Tailwind de `src/theme.css`.
Los nombres personalizados se distinguen explícitamente del nombre automático, incluso
cuando la persona elige «Nuevo chat».

La única clave utilizada es `chatlab:state:v1`. Incluye selección, nombres y borradores,
también el provisional aunque todavía no haya conversaciones. Si los datos son inválidos
o falla el almacenamiento, aparece un aviso y la sesión continúa en memoria. Los datos
dañados originales no se sobrescriben; los cambios de esa sesión no sobreviven a recargar.
No se borran ni modifican claves de otras aplicaciones.

## Pruebas de esta fase

```bash
npm test
npm run build
```

Las pruebas de navegador usan Edge headless con un contexto nuevo por caso, separado
del perfil y almacenamiento del usuario. Requieren el servidor en `http://localhost:8000`
y una instalación externa de Playwright. No se añadieron dependencias al proyecto.
En PowerShell, señala el módulo instalado y ejecuta:

```powershell
$env:PLAYWRIGHT_MODULE = 'C:/ruta/a/node_modules/playwright'
node --test tests/browser.test.mjs
```

Verificación realizada el 21-11-2026: 28 pruebas de operaciones/almacenamiento aprobadas;
14 pruebas de navegador aprobadas y 3 casos adicionales de historial extenso aprobados.
Los seis casos de tamaño/historial se repitieron después de ampliar las comprobaciones.
Build de producción correcto. Las capturas reales de revisión se guardan en `artifacts/`;
son evidencia de pruebas, no imágenes incorporadas al diseño.

| Requisito | Archivo principal | Prueba ejecutada | Resultado |
| --- | --- | --- | --- |
| Nuevo chat, ambos atajos, sin etiqueta e IDs únicos | `src/hooks/useNewChatShortcut.js`, `src/lib/chatOperations.js` | Botón, Ctrl+K y Meta+K en navegador; comprobación de IDs y texto visible | Aprobado |
| Reutilizar solo vacíos sin nombre elegido | `src/lib/chatOperations.js` | Repetir creación; borrador impide reutilizar; nombre personalizado «Nuevo chat» persiste y no se reutiliza | Aprobado |
| Provisional persistente, transferencia única | `src/lib/chatStorage.js`, `src/hooks/useChats.js` | Escribir → recargar sin chat → crear → recargar → crear otro | Aprobado |
| Dos borradores, título y selección | `src/lib/chatOperations.js`, `src/components/Composer.jsx` | Alternar dos chats y recargar cada selección | Aprobado |
| Búsqueda por nombre y limpieza | `src/components/Sidebar.jsx` | Mayúsculas mezcladas, borrador no buscable, sin coincidencias, historial vacío y limpiar espacios | Aprobado |
| Renombrar y rechazar espacios | `src/components/RenameChatForm.jsx` | Guardar/Enter, Cancelar/Escape, error con espacios, recorte y recarga | Aprobado |
| Borrar con confirmación | `src/components/DeleteChatConfirm.jsx`, `src/lib/chatOperations.js` | Cancelar/Escape; eliminar inactiva, activa y última; preservar otras | Aprobado |
| Validación y corrupción | `src/lib/chatStorage.js`, `src/hooks/useChats.js` | JSON inválido, campos inválidos, IDs repetidos, selección inexistente; aviso y edición en memoria | Aprobado |
| Almacenamiento bloqueado y claves ajenas | `src/lib/chatStorage.js`, `src/hooks/useChats.js` | Fallos de lectura/escritura y cuota; clave ajena intacta en escritura normal, corrupción y bloqueo de escritura | Aprobado |
| Envío deshabilitado, sin mensajes ni IA | `src/components/Composer.jsx` | Disabled tras escribir/Enter; estado sin mensajes; revisión de archivos sin servicio de IA | Aprobado |
| Diseño en 1440×900, 1280×600 y 390×667 | `src/App.jsx`, `src/components/`, `src/theme.css` | Capturas revisadas de historial, renombrado, eliminación; límites de controles y ancho; 25 chats, nombre largo, borrador multilínea y aviso | Aprobado; listas y borradores largos usan desplazamiento interno |
| Código y build | `src/`, `package.json`, `tests/browser.test.mjs` | Revisión de responsabilidades/operadores, `git diff --check`, `npm run build` | Aprobado |

Los casos de operaciones y almacenamiento están en `src/lib/*.test.js`; los de interacción
y tamaños en `tests/browser.test.mjs`. Cmd+K se comprobó mediante Meta+K en Edge sobre
Windows; no se ejecutó un navegador nativo de macOS.
