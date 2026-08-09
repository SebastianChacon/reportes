# Plan de evolución — Job Report / Back to Nature

Análisis del estado actual y plan de trabajo, con foco en **uso móvil en campo** y en un **panel de administración** que hoy no existe.

---

## 1. Cómo funciona hoy

```
Teléfono (capataz)  →  wizard de 6 pasos  →  PDF generado en el navegador
                                          →  POST /api/send-report  →  Resend  →  email a la oficina
                                                                                    ↑
                                                                          FIN DEL CAMINO
```

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind v4 · jsPDF · Resend.
**Persistencia:** solo `localStorage` (borrador, idioma, última cuadrilla, "outbox").
**Backend:** una sola ruta, [route.ts](app/api/send-report/route.ts), que arma un HTML y adjunta el PDF.
**Base de datos:** ninguna. **Autenticación:** ninguna. **Admin:** ninguno.

### Lo que está muy bien hecho

| | |
|---|---|
| Arquitectura | `lib/` puro y testeable (`calc`, `translate`, `pdf`, `storage`) separado de `components/`. Cambiar el traductor por una API es cambiar una línea. |
| Ergonomía móvil | Targets de 44px, `font-size: max(16px)` para que iOS no haga zoom, `env(safe-area-inset-bottom)`, `overscroll-behavior: none`, modo oscuro, `touch-action: none` en la firma. |
| Patrón buscar-y-agregar | [SearchPicker.tsx](components/SearchPicker.tsx) resuelve bien el problema de "200 filas impresas → 5 marcadas". No renderiza nada hasta que escribís. |
| Traductor offline | Semántica de caché correcta: `original` nunca se sobrescribe, segundo clic vuelve atrás, editar invalida. Y muestra los términos que **no** reconoció en vez de fingir seguridad. |
| Degradación | Sin variables de entorno → 503 → "Descargar PDF". Nunca deja al capataz atrapado. |

---

## 2. El hueco central

**El admin que pedís no existe, y no puede existir sobre la arquitectura actual.**

Hoy el único destino de un reporte es un correo. Un buzón de correo no permite:
buscar por número de trabajo · sumar horas por persona para la nómina · ver **quién no entregó reporte hoy** · saber si un reporte ya fue revisado · exportar a contabilidad · comparar la semana.

Todo lo demás en este plan es secundario frente a esto: **hay que guardar los reportes en una base de datos y construir el admin sobre ella.** El email pasa a ser una notificación, no el sistema de registro.

---

## 3. Bugs y riesgos encontrados (ordenados por gravedad)

### P0 — El outbox pierde reportes

[JobReportApp.tsx:105](components/JobReportApp.tsx#L105) llama `queueReport()` cuando falla el envío. Pero **nada lee esa cola nunca**: `loadOutbox()` y `removeFromOutbox()` están exportados en [storage.ts](lib/storage.ts) y no los usa ningún componente.

Resultado real: el capataz sin señal ve "se guardó", el reporte queda en `localStorage` para siempre y **jamás se envía**. Es la peor clase de bug: silencioso y con promesa explícita en el README.

### P0 — La promesa de "offline" es falsa

No hay `public/`, ni `manifest.json`, ni service worker. Sin señal, abrir la app da **página en blanco**. El README dice "sin señal no se pierde el reporte"; eso solo es cierto si la pestaña ya estaba abierta.

### P0 — El borrador no tiene versión de esquema

[storage.ts:48](lib/storage.ts#L48) hace `JSON.parse(raw) as JobReport` sin validar. Si mañana cambia la forma de `JobReport` y un capataz tiene un borrador viejo, `report.crew.map(...)` revienta contra `undefined` y **la app queda muerta hasta borrar el storage del navegador**. En un teléfono de campo eso es irrecuperable para el usuario.

### P0 — La API no tiene autenticación ni límite de tasa

`POST /api/send-report` es pública. Cualquiera puede disparar correos a la oficina con contenido arbitrario. Hoy el daño está acotado (`from`/`to` son fijos), pero en cuanto haya base de datos esto es una puerta abierta.

### P1 — El PDF se arma en el teléfono y viaja en base64

[JobReportApp.tsx:91](components/JobReportApp.tsx#L91) genera el PDF en el cliente y lo manda como base64 (límite 8 MB). Dos PNG de firma a DPR 3 pesan de verdad, y eso sale por datos móviles en el peor momento posible. El PDF debe generarse en el servidor a partir del JSON.

### P1 — IDs ad-hoc colisionables

`adhoc-eq-${Date.now()}` ([StepResources.tsx:147](components/steps/StepResources.tsx#L147), y equivalentes en materiales/plantas/subcontratistas). Dos altas en el mismo milisegundo colisionan y React duplica claves. Usar `crypto.randomUUID()`.

### P2 — Menores

- No se puede agregar el mismo material dos veces con costos distintos (`SearchPicker` lo filtra por `selectedIds`).
- `formatHours` usa `.replace(/0$/, "")` — funciona, pero es frágil; conviene `Intl.NumberFormat`.
- `<html lang="es">` está fijo en [layout.tsx](app/layout.tsx); solo se corrige en el cliente.
- `Toggle` (role=radiogroup) no maneja flechas del teclado; el checkbox de camiones es un `<button role="checkbox">` con contenido interactivo anidado.
- **Cero tests.** `lib/calc.ts` es puro y trivial de testear: es el archivo del que dependen las horas de nómina.

---

## 4. Plan

### Fase 0 — Estabilizar · ~1-2 días

Antes de construir nada encima, cerrar los P0.

1. `npm install` (hoy `node_modules` ni está instalado) + `tsc --noEmit` y `next lint` en CI.
2. Versionar el borrador: `{ v: 2, report }`. Si `v` no coincide → descartar y arrancar limpio en vez de reventar.
3. Reemplazar `Date.now()` por `crypto.randomUUID()` en todos los IDs ad-hoc.
4. Tests unitarios de `lib/calc.ts` (`hoursBetween` cruzando medianoche, `travelHours`, `warnings`, `missingRequired`) y de `lib/translate.ts` (ida y vuelta del ejemplo del README).
5. Rate limit básico en la ruta de envío.

### Fase 1 — Persistencia · ~2-3 días

El paso que habilita todo lo demás.

- **Base de datos:** Neon Postgres (Marketplace de Vercel) + Drizzle ORM.
- **Esquema:** `reports` (con el JSON completo + columnas indexadas: `date`, `client_name`, `job_numbers[]`, `foreman_id`, `status`, `total_hours`, `material_cost`), `report_photos`, `users`, `catalog_items`, `audit_log`.
- **Archivos:** firmas y fotos a **Vercel Blob** (privado), no base64 en la base.
- **PDF al servidor:** la ruta recibe JSON, guarda, genera el PDF y recién ahí manda el correo. El teléfono sube ~20 KB en vez de ~4 MB.
- **`POST /api/reports`** reemplaza a `send-report`; el email pasa a ser efecto secundario.

**Autenticación — recomendación.** No metas Clerk/Auth0 para el capataz: un hombre con guantes a las 6am no escribe una contraseña. Propongo:

- **Capataz:** elige su nombre del roster una sola vez + PIN de 4 dígitos → cookie httpOnly firmada de 90 días. El teléfono queda "suyo".
- **Admin:** mismo mecanismo con contraseña real + sesión de 12 h.
- Todo con `jose` + cookies. Cero dependencias externas, cero costo, proporcionado al riesgo (son reportes de jardinería, no historias clínicas).

Si preferís no mantener auth propia, Clerk se instala desde el Marketplace en una tarde — pero la fricción para el capataz sube.

### Fase 2 — Offline de verdad · ~2 días

Cumplir la promesa que ya hace el README.

- `manifest.json` + iconos + `display: standalone` → "Agregar a pantalla de inicio". La app se ve y se siente como app.
- Service worker (Serwist) que cachea el shell → **abre sin señal**.
- Mover el outbox de `localStorage` a **IndexedDB** y **conectarlo**: reintento con Background Sync, más reintento al volver `online`, más un botón visible "N reportes pendientes de enviar" en la cabecera.
- El borrador se guarda con `debounce` (hoy escribe en `localStorage` en cada tecla).

### Fase 3 — Admin v1 · ~4-5 días

**Principio de diseño:** la oficina revisa el día en un escritorio, pero el gerente lo abre desde la camioneta. Responsive de verdad, no "desktop encogido". Todo direccionable por URL, para poder pegar un link en un WhatsApp.

**Pantalla 1 — Bandeja del día** (`/admin`, es el home)

La vista por defecto es **hoy**. Arriba, una franja de cuatro números: reportes recibidos · cuadrillas en calle · horas de mano de obra · gasto en materiales.

Debajo, y esto es lo más importante del admin entero: **"Faltan por entregar"** — la lista de capataces que hoy no mandaron reporte. Es lo que la oficina necesita a las 5pm y es exactamente lo que un buzón de correo no puede darte.

Luego las tarjetas de reporte: cliente · job # · capataz · horas · personas · costo · chip de estado (`Nuevo` / `Revisado` / `Devuelto`). Una línea, escaneable, sin abrir nada.

**Pantalla 2 — Detalle del reporte** (`/admin/reportes/[id]`)

Vista completa en el mismo orden que el papel, con firmas y fotos. Acciones: **Aprobar** · **Devolver con nota** · Descargar PDF · Reenviar por correo.

"Devolver con nota" cierra el círculo que hoy no existe: el reporte reaparece en el teléfono del capataz con el comentario ("faltan las horas de Carlos") y él lo corrige. Hoy eso es una llamada telefónica.

**Pantalla 3 — Búsqueda y filtros** (`/admin/reportes`)

Rango de fechas · cliente · job # · capataz · miembro de cuadrilla · estado · texto libre sobre la descripción. Filtros pegados en la URL. `/` enfoca la búsqueda. Esto es, literalmente, lo que el email no puede hacer.

**Pantalla 4 — Exportar**

CSV de reportes, de horas por persona y de materiales. Es el puente a la nómina y a la contabilidad.

**Reglas de UX que el admin debe respetar:**
- Máximo 2 clics desde el home a cualquier reporte.
- Ningún modal dentro de otro modal.
- Toda tabla ancha hace scroll dentro de sí misma, nunca la página.
- Estados vacíos que digan qué hacer, no "no hay datos".
- Aprobación en lote con checkboxes.

### Fase 4 — Móvil, segunda vuelta · ~3 días

Ordenado por impacto real en campo:

1. **Fotos.** La ausencia más grande. Para un reporte de paisajismo, el antes/después es la mitad del valor. Captura directa de cámara, compresión en el cliente (canvas → WebP ~200 KB), subida a Blob, miniaturas en el PDF y galería en el admin.
2. **Dictado por voz** en la descripción (Web Speech API, `es-US`/`en-US`). Un capataz con guantes y sol dicta; no escribe. Cae de pie: si el navegador no lo soporta, sigue el teclado.
3. **Botón "ahora"** junto a cada campo de hora. El selector nativo de hora en móvil es lento y estos cuatro campos se llenan en el momento exacto en que ocurre.
4. **Tocar la barra de progreso para saltar de paso.** Hoy solo se navega con Atrás/Siguiente (o desde Revisar).
5. **"Duplicar reporte de ayer"** — trabajos de varios días en el mismo sitio: mismo cliente, mismo job #, misma cuadrilla, se cambian horas y descripción.
6. **Autocompletar cliente** desde reportes anteriores (ya hay base de datos en Fase 1).
7. Vibración corta al agregar/quitar (`navigator.vibrate`).

### Fase 5 — Admin, segunda vuelta · ~4 días

1. **Vista por trabajo** (`/admin/trabajos/[jobNumber]`). Todos los reportes del job 21550 consolidados: horas totales, costo de materiales, días trabajados, línea de tiempo, fotos. Esto convierte reportes diarios en **costeo de obra** — es donde el proyecto deja de ser papeleo y pasa a ser dinero.
2. **Panel de horas por persona.** Semana × empleado, sumado desde todos los reportes, exportable. Probablemente justifica el proyecto entero por sí solo.
3. **Catálogo administrable.** Hoy agregar un empleado es editar [catalog.ts](lib/catalog.ts) y desplegar. Debe ser una pantalla. (Los ítems del catálogo también alimentan el glosario del traductor, así que la migración debe conservar ese enganche.)
4. **Recordatorio automático a las 6pm.** Cron de Vercel: si hay job abierto sin reporte, aviso por SMS/WhatsApp/email al capataz. Convierte el "faltan por entregar" de informe pasivo en acción.

### Fase 6 — Pulido · ~2 días

Accesibilidad (teclado en `Toggle`, checkbox de camiones), tests e2e del flujo completo con Playwright, monitoreo de errores, y revisión de `npm audit`.

---

## 5. Extras que agregaría, en orden de valor

| Idea | Por qué |
|---|---|
| **Fotos** | La pieza que más le falta al reporte. Cero discusión. |
| **Costeo por trabajo** | Horas × tarifa por rol + materiales, por job #. El reporte deja de ser archivo y pasa a ser margen. |
| **Dictado por voz** | Elimina la parte más lenta de llenar el formulario en campo. |
| **Devolver con nota** | Hoy el flujo es de una sola dirección; la corrección vive en llamadas telefónicas. |
| **Firma del cliente en sitio** | Un tercer pad. Prueba de trabajo realizado ante un reclamo. Ya tenés el componente. |
| **Clima del día** | Auto-completado por fecha y ubicación. Los días de lluvia son la fuente clásica de disputa en paisajismo. |
| **Sello de ubicación** | Un toque de "estoy en el sitio" al llegar y al salir. Confirma presencia sin vigilar a nadie. |
| **Exportación a nómina** | CSV listo para el sistema contable. |

---

## 6. Orden recomendado

```
Fase 0  Estabilizar        ██              1-2 d   ← bloquea todo, son bugs con pérdida de datos
Fase 1  Persistencia       ████            2-3 d   ← habilita el admin
Fase 2  Offline real       ███             2 d
Fase 3  Admin v1           ██████          4-5 d   ← lo que pediste
Fase 4  Móvil ++           ████            3 d
Fase 5  Admin ++           █████           4 d
Fase 6  Pulido             ███             2 d
                                        ─────────
                                        ~18-21 días
```

Estimaciones aproximadas, de una persona a tiempo completo.

Si hay que recortar: **Fases 0, 1 y 3 son el mínimo viable** para tener un admin real (~8-10 días). La Fase 2 es la que decide si la app aguanta un día de trabajo sin señal, y la 4 es la que hace que el capataz la prefiera al papel.
