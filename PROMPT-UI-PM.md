# Prompt — Rediseño UI/UX para el PM/CM que recibe los reportes

> Pegá todo lo que está debajo de la línea en una sesión nueva de Claude Code, parado en la raíz del repo.

---

## Contexto del proyecto

Trabajás en `btn-job-report`: una app Next 16 (App Router) + React 19 + Tailwind v4, sin librería de componentes. Reemplaza un formulario en papel de construcción/jardinería ("JOB REPORT — Back to Nature"). El capataz lo llena desde el teléfono, en el sitio de trabajo, con guantes y con sol, en español o inglés.

Leé `README.md` completo antes de tocar nada. Después mirá:

- `components/JobReportApp.tsx` — asistente de 6 pasos, idioma, autoguardado, envío
- `components/ui.tsx` — todos los primitivos (`TextField`, `TimeField`, `Button`, `Section`, `Toggle`, iconos)
- `app/globals.css` — los design tokens viven acá como CSS custom properties (`--surface`, `--ink`, `--line`, `--accent`, `--accent-soft`, …) y las utilidades `field`, `card`, `touch-target`, `step-enter`
- `components/steps/StepReview.tsx` — el paso de revisión y firma
- `app/api/send-report/route.ts` — el email HTML + PDF adjunto que hoy le llega al PM
- `lib/pdf.ts`, `lib/calc.ts`, `lib/i18n.ts`, `lib/catalog.ts`

## Objetivo

**El usuario que quiero contentar no es el capataz: es el PM / Construction Manager que recibe los reportes.** Hoy ese rol no tiene ninguna pantalla propia — le llega un email con un resumen HTML y un PDF de una página, y ahí termina todo. Quiero que revisar reportes le resulte rápido, claro y agradable, y que la app entera se vea profesional.

Dos frentes, en este orden:

1. **Que lo que llega esté bien.** Subir el nivel visual del asistente existente para que los datos entren completos y consistentes: jerarquía, densidad, feedback, estados de error, microinteracciones. Menos reportes a medias = menos ida y vuelta para el PM.
2. **Darle una superficie propia al PM.** Una vista de revisión de reportes dentro de la app (no solo el email): leer un reporte de un vistazo — horas, cuadrilla, costos, fotos, firmas — sin scrollear un PDF en el teléfono. Y el email en sí, que hoy es HTML inline armado a mano en la route, merece el mismo cuidado.

## Habilidades que quiero que uses

Ya están instaladas en `.claude/skills/`. Usalas explícitamente, no de memoria:

| Skill | Cuándo |
|---|---|
| `ui-ux-pro-max` | Antes de decidir paleta, tipografía o estilo. Tiene bases de datos de estilos, paletas y tipografías — elegí de ahí, con criterio, no un tema genérico. |
| `emil-design-eng` | Durante toda la implementación. Es la vara de calidad: detalles invisibles, pulido de componentes, cuándo algo se siente bien. |
| `web-design-guidelines` | Como auditoría, al final de cada frente. Accesibilidad y Web Interface Guidelines. |
| `find-animation-opportunities` | Después de que el layout esté firme. Read-only: te dice qué debería animarse y qué no. |
| `animate` | Para implementar solo las animaciones que la skill anterior justificó. |
| `vercel-react-best-practices` | Al revisar los `.tsx` que hayas tocado. |

Cargá `ui-ux-pro-max` y `emil-design-eng` **antes** de escribir la primera línea de CSS.

## Restricciones duras — no negociables

Estas decisiones vienen del papel y del campo. No las rompas por estética:

- **Mobile-first, 375px es el ancho de diseño.** El escritorio es secundario en el asistente (en la vista del PM puede ser al revés).
- **Objetivos táctiles de 44px mínimo. Tipografía de inputs nunca bajo 16px** — iOS hace zoom al enfocar si baja.
- **Bilingüe ES/EN.** Todo texto nuevo va a `lib/i18n.ts` en los dos idiomas. Cero strings hardcodeados en JSX.
- **Modo claro y oscuro**, ambos con el mismo nivel de terminación.
- **Funciona sin señal.** No agregues nada que dependa de red en el camino crítico del asistente. El autoguardado local y la cola de envío se mantienen intactos.
- **Nada se renderiza hasta que el usuario escribe** (buscar-y-agregar, no 200 filas impresas). Respetá ese patrón.
- **Los tests tienen que seguir pasando:** `npm test`. Si cambiás estructura que un test consulta por texto o rol, arreglá el test con intención, no borrándolo.
- **Sin dependencias nuevas pesadas sin preguntarme antes.** Tailwind v4 + CSS + los tokens que ya existen alcanzan para casi todo. Si querés `motion`/`framer-motion` para el punto 4, proponémelo con el argumento.
- **Los tokens de color se definen en `app/globals.css`**, no como clases sueltas repartidas por los componentes.

## Cómo quiero que trabajes

**Fase 0 — Diagnóstico, antes de editar.**
Levantá el dev server (`preview_start` con la config `job-report` de `.claude/launch.json`), recorré los 6 pasos a 375px en claro y oscuro, sacá capturas y decime en prosa qué está flojo: jerarquía, ritmo vertical, densidad, estados vacíos, feedback de error, consistencia entre pasos. Sé específico y citá archivo:línea. No me des una lista genérica de buenas prácticas.

**Fase 1 — Dirección visual.**
Con `ui-ux-pro-max`, proponeme **una** dirección (no tres): paleta, escala tipográfica, radios, sombras, espaciado. Justificá por qué encaja con una app de campo que además tiene que verse seria para un manager. Mostrámela aplicada a una pantalla real antes de propagarla.

**Fase 2 — Implementación del asistente.**
Aplicá la dirección a `globals.css` y `ui.tsx` primero, después a los pasos. Cambios chicos y verificables. Después de cada pantalla: captura antes/después.

**Fase 3 — La superficie del PM.**
Antes de construirla, **pará y proponeme un plan**: qué rutas, qué datos, de dónde salen (hoy no hay base de datos — el reporte vive en `localStorage` y se va por email; decime si eso alcanza, si hay que persistir, y qué implica). No la construyas hasta que yo apruebe el plan. Incluí en la propuesta el rediseño del email HTML de `app/api/send-report/route.ts`.

**Fase 4 — Movimiento.**
`find-animation-opportunities` primero, `animate` después, y solo lo que sobreviva el filtro. Respetá `prefers-reduced-motion`. Si algo no gana nada, no lo animes.

**Fase 5 — Auditoría y cierre.**
`web-design-guidelines` sobre el diff, `vercel-react-best-practices` sobre los `.tsx` tocados, `npm test`, y un resumen de qué cambió y por qué.

## Criterios de aceptación

- Los 6 pasos se ven como un sistema, no como seis pantallas de autores distintos.
- Un reporte terminado se lee de un vistazo, en el teléfono y en escritorio.
- Claro y oscuro terminados por igual; nada de contraste bajo en modo oscuro.
- Contraste AA en texto e iconos con significado; foco visible en todo lo interactivo; todo operable con teclado.
- `npm test` en verde.
- Cero regresiones en offline, autoguardado, traducción ES⇄EN, firma y PDF.

## Cómo verificar

Nunca me pidas que lo pruebe yo. Levantá el server, navegá vos, sacá capturas a 375px y a escritorio, en claro y en oscuro, y mostrámelas. Revisá consola y network por errores antes de decir que algo está listo.

Empezá por la Fase 0.
