# CaVeSal® Academy — Medical Education

Sitio puente con todas las guías del ecosistema CaVeSal® en un solo lugar. Se publica en **https://cavesal.app/academy/**.

## Cómo funciona

- Las guías **no se editan acá**. Se siguen editando en su app de origen:
  - Historia Clínica: `public/guias-clinicas*.html` y `bibliografia-completa*.html` (historia.cavesal.app).
  - Emergencias: `guia.html` y `bibliografia.html` (cavesal.app/cavesal-emergencias).
- Todos los días, la acción **Espejo de guías** lee esas páginas publicadas y regenera la carpeta `data/`. Si no hubo cambios, no hace nada.
- Si una fuente viene vacía o incompleta (por ejemplo, la página no cargó), el espejo se detiene y deja la copia anterior intacta.
- El sitio funciona sin conexión una vez abierto (service worker).

## Acceso

Entra cualquier persona con una clave **Full** activada de Calculadora, Historia Clínica o Emergencias:

1. Si ya activó una de esas apps en el mismo navegador (cavesal.app), entra directo.
2. Desde la Historia Clínica, el botón Academy abre `https://cavesal.app/academy/#k=CLAVE&lang=es`.
3. Si no, escribe su clave en la pantalla de acceso.

La clave se comprueba con el script de licencias (`accion=verificar&producto=academy`). Las claves de IA no sirven. Plan anual vencido: 7 días de gracia y después pide renovar. Sin conexión entra si ya había entrado antes.

## Puesta en marcha (una sola vez)

1. En GitHub, cuenta **cavesal**: crear repositorio **academy** (público).
2. Subir todos estos archivos (sin `node_modules`).
3. Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)` → Save. Queda en https://cavesal.app/academy/ (usa el dominio que ya tiene cavesal.github.io; no hace falta tocar DNS).
4. Actions → Espejo de guías → *Run workflow* para la primera actualización manual.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html`, `styles.css`, `app.js` | El sitio |
| `sw.js`, `manifest.json` | Instalación y modo sin conexión |
| `scripts/espejo.mjs` | Copia automática de las guías |
| `.github/workflows/espejo.yml` | Ejecuta el espejo cada día |
| `data/` | Generado por el espejo, no editar |
| `img/` | Logo, portada e íconos |

Si se cambia `index.html`, `styles.css` o `app.js`, subir también `sw.js` con `VERSION` aumentado (por ejemplo `cavesal-academy-v2`) para que los teléfonos tomen la versión nueva.

© Dr. Carlos Vera Salerno · drverasalerno@gmail.com
