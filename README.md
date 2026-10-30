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

## Índice para IA

El espejo genera también `data/ia/indice-es.json`, `indice-en.json` e `indice-pt.json`: todas las fichas de Historia Clínica y Emergencias en un solo archivo por idioma, para que una IA (por ejemplo Mujer y Mamá) lea el contenido sin entrar al sitio.

- Dirección: https://cavesal.app/academy/data/ia/indice-es.json (cambiar `es` por `en` o `pt`).
- Cada ficha trae: `id`, `app`, `seccion`, `titulo`, `texto`, `fuentes`, `academy` (enlace a la ficha en Academy) y `guia` (enlace a la guía de origen).
- Se actualiza solo, con el espejo diario. No editar a mano.

## Vigilancia de evidencia

El día 1 de cada mes, a las 07:00 de Paraguay, la acción **Vigilancia de evidencia** busca publicaciones nuevas sobre los temas de `vigilancia/temas.json` en PubMed (incluye Cochrane), OMS, OPS y RCOG.

- Descarta lo ya citado en las guías y lo ya revisado en meses anteriores (`vigilancia/estado.json`).
- Una IA (Groq, plan gratuito; clave en el secreto `GROQ_API_KEY`) clasifica cada hallazgo en **Importante** (podría cambiar una conducta), **Para revisar** o descartado. Si la IA no está disponible, clasifica por tipo de publicación.
- Abre un **Issue** con el informe y casillas Aprobar / Descartar. Si hay algo importante menciona a @cavesal, y GitHub manda el correo.
- Avisa al grupo de Telegram **CaVeSal Evidencia**: con sonido si hay algo importante, en silencio si no. Si la corrida falla, también avisa.
- **Nunca modifica una guía.** Lo aprobado se aplica a mano en la app de origen (ES/EN/PT y bibliografía).
- Prueba manual: Actions → Vigilancia de evidencia → Run workflow → prueba = si. La prueba abre el Issue marcado [Prueba] y no guarda lo visto.
- Requiere los secretos `TELEGRAM_BOT_TOKEN` y `GROQ_API_KEY` en Settings → Secrets and variables → Actions. Sin `GROQ_API_KEY` funciona igual, pero sin resumen ni clasificación por IA.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html`, `styles.css`, `app.js` | El sitio |
| `sw.js`, `manifest.json` | Instalación y modo sin conexión |
| `scripts/espejo.mjs` | Copia automática de las guías |
| `.github/workflows/espejo.yml` | Ejecuta el espejo cada día |
| `scripts/vigilancia.mjs` | Vigilancia mensual de evidencia |
| `vigilancia/temas.json` | Temas y búsquedas de la vigilancia (se puede editar) |
| `vigilancia/estado.json` | Lo ya revisado, lo guarda la vigilancia, no editar |
| `.github/workflows/vigilancia.yml` | Ejecuta la vigilancia el día 1 de cada mes |
| `data/` | Generado por el espejo, no editar |
| `img/` | Logo, portada e íconos |

Si se cambia `index.html`, `styles.css` o `app.js`, subir también `sw.js` con `VERSION` aumentado (por ejemplo `cavesal-academy-v2`) para que los teléfonos tomen la versión nueva.

© Dr. Carlos Vera Salerno · drverasalerno@gmail.com
