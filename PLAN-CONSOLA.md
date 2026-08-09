# Plan — La consola del PM

> **Estado: aprobado. Pasos A y B construidos; C en adelante pendientes.**
> `PROMPT-UI-PM.md` prohíbe construir la superficie del PM antes de que Sebastian
> apruebe un plan. Este es ese plan, y está aprobado.
>
> **Hecho:** el paso A — identidad del capataz (sección 2) — y el paso B, las
> cinco queries de `convex/office.ts` (sección 5).
> **Pendiente:** todo lo demás. Ninguna pantalla de `/office` existe todavía.

Reconcilia la **Fase 3 (Admin v1)** de [PLAN.md](PLAN.md) con lo que el repo
realmente tiene hoy: Convex, no Neon + Drizzle.

---

## 1. De dónde partimos

La capa de datos está construida y desplegada ([PR #13](https://github.com/SebastianChacon/reportes/pull/13)).
Cuatro tablas, ocho índices vivos.

Lo que ya resuelve, y que conviene no volver a discutir:

- `reports.totals` y `reports.flags` se calculan **al escribir**, con `lib/calc.ts`.
  La consola nunca puede contradecir al PDF que el capataz ya mandó, y la cola de
  revisión existe sin re-correr ningún chequeo en cada lectura.
- `crewDays` desarma la cuadrilla en una fila por persona. "Elegí una persona,
  vé su día" es una lectura indexada, no un barrido.
- `photoCount` está denormalizado: la lista del día dice "4 fotos" sin tocar la
  tabla de fotos.
- `reports.setStatus` ya existe, escrito y esperando. Le falta solo saber quién
  es el que aprueba.

> **Actualizado.** Esto decía que no existía ni una sola query. Ya existen las
> cinco: `convex/office.ts`. Lo que falta ahora es la UI que las lea.

---

## 2. El hallazgo que ordenó el resto — resuelto

> **Cerrado.** `reports.submittedBy` ya se escribe. Lo que sigue queda como
> registro de por qué esto fue primero, y de cómo terminó implementado.
>
> **Cómo quedó.** El capataz elige su nombre del roster y fija un PIN de 4
> dígitos. El PIN se verifica **dentro de Convex** (`convex/auth.ts`, PBKDF2-SHA256,
> 100k iteraciones, bloqueo de 15 min a los 5 intentos): el hash nunca sale del
> deployment, porque las únicas funciones que lo leen son `internal` y no son
> alcanzables desde afuera — verificado contra el deployment real.
>
> La identidad vive en una cookie httpOnly firmada (`jose`, HS256, 90 días). Por
> eso **el reporte ahora se archiva a través de `POST /api/reports`** y no desde el
> teléfono directo a Convex: la cookie solo la puede leer el servidor, así que el
> servidor es lo único que puede poner `submittedBy`. Un teléfono que pudiera
> nombrar al capataz podría nombrar a cualquiera.
>
> Las fotos **siguen yendo directo** del teléfono a Convex storage. Son megabytes
> en el plan de datos de una camioneta y no tienen por qué pasar por una función
> nuestra solo para ser reenviadas.
>
> Sin `AUTH_SECRET` nada de esto aparece: la app no pregunta quién sos y archiva
> sin atribuir, igual que antes. Es el mismo trato que ya tiene con Resend y con
> Convex, y está verificado corriendo el server sin la variable.
>
> Y el reporte que se archivó sin capataz **se rellena solo**: si un reintento del
> outbox llega con cookie, `reports.submit` completa el `submittedBy` que faltaba.

**Hoy un reporte no registra quién lo mandó.**

Mirá `submittedReportFields` en [convex/validators.ts:76](convex/validators.ts):
hay cliente, job numbers, horarios, cuadrilla, materiales, totales, flags. No hay
capataz. El único campo que podría decirlo es `reportFields.submittedBy`, que es
`v.optional(v.id("users"))` — y **nunca se escribe**, porque no hay con qué
identificarlo.

Esto tiene una consecuencia directa: **"Faltan por entregar" no se puede
construir.** Es, según `PLAN.md`, "lo más importante del admin entero" — la lista
de capataces que hoy no mandaron reporte, lo que la oficina necesita a las 5pm y
exactamente lo que un buzón de correo no puede darte. No se puede saber quién
faltó si no se sabe quién mandó.

De ahí sale el orden de todo lo que sigue: **la identidad del capataz no es una
mejora de la Fase 1, es su precondición.** No es "agregar login". Es el campo del
que depende la pantalla que justifica la consola.

Y hay un detalle que hace esto urgente: cada reporte que se archive antes de
resolverlo queda sin capataz **para siempre**. No es un dato que se pueda
reconstruir después.

---

## 3. Autenticación — decidido

Se toma la recomendación de `PLAN.md`, sin cambios:

- **Capataz:** elige su nombre del roster una sola vez + PIN de 4 dígitos →
  cookie httpOnly firmada de 90 días. El teléfono queda "suyo".
- **Oficina:** mismo mecanismo, contraseña real, sesión de 12 h.
- `jose` + cookies. Sin dependencias externas, sin costo.

El argumento es de campo, no técnico: un hombre con guantes a las 6am no escribe
una contraseña. Y el riesgo es proporcionado — son reportes de jardinería.

Que sea propio no nos encierra: la consola habla con `users` y con `submittedBy`,
nunca con el mecanismo de login. Cambiar a Clerk después toca el borde, no el
centro.

**Dependencia nueva:** `jose`. Es lo único que este plan agrega al `package.json`.

---

## 4. Las pantallas

Todo direccionable por URL — un link de un reporte se tiene que poder pegar en un
WhatsApp. Ruta base `/office` (no `/admin`: quien entra es un PM, no un
administrador de sistema).

### `/office` — El día

La vista por defecto es **hoy**. Arriba, cuatro números: reportes recibidos ·
cuadrillas en calle · horas de mano de obra · gasto en materiales. Salen sumando
`totals` de los reportes del día: ya vienen calculados, no se recalcula nada.

Debajo, **"Faltan por entregar"**: capataces con turno que hoy no mandaron nada.
Depende por completo de la sección 2.

Después las tarjetas de reporte, una línea cada una, escaneable sin abrir:
cliente · job # · capataz · horas · personas · costo · chip de estado. Los
`flags` guardados se muestran acá — un reporte con `warnNoHours` se ve distinto
antes de que nadie lo abra.

*Índice:* `reports.by_date`. Un solo `withIndex`.

### `/office/reportes/[id]` — El reporte

Completo, en el mismo orden que el papel, con firmas y fotos. Acciones:
**Aprobar** · **Devolver con nota** · Descargar PDF · Reenviar por correo.

"Devolver con nota" cierra el círculo que hoy no existe: el reporte reaparece en
el teléfono del capataz con el comentario ("faltan las horas de Carlos") y él lo
corrige. Hoy eso es una llamada telefónica.

Requiere dos campos nuevos en `reports`: `reviewNote: v.optional(v.string())` y
que `needs_review` se lea como "devuelto" en el teléfono.

*Índices:* lectura directa por id, más `photos.by_report` y `crewDays.by_report`.

### `/office/reportes` — Buscar

Rango de fechas · cliente · job # · capataz · persona de cuadrilla · estado.
Filtros pegados en la URL. `/` enfoca la búsqueda.

*Índices:* `reports.by_status_date` y `crewDays.by_person_date` cubren los casos
que importan. **Texto libre sobre la descripción no entra en v1** — eso es un
search index de Convex, es otra decisión, y se puede agregar después sin mover
nada de lo demás.

### `/office/personas/[personId]` — La semana de una persona

Semana × persona, sumada desde `crewDays`. `PLAN.md` la pone en la Fase 5 y dice
que "probablemente justifica el proyecto entero por sí sola". Con `by_person_date`
ya construido, cuesta poco. Entra en v1.

*Índice:* `crewDays.by_person_date`. Exactamente para esto se creó la tabla.

---

## 5. Las queries — escritas

Todas en `convex/office.ts`, todas `query`, ninguna toca `lib/calc.ts` en lectura:

| Query | Sirve a | Índice |
|---|---|---|
| `dayBoard({ date })` | `/office` | `reports.by_date` |
| `missingToday({ date })` | "Faltan por entregar" | `reports.by_date` + `users` |
| `report({ id })` | detalle | directo + `by_report` ×2 |
| `search({ from, to, status, … })` | `/office/reportes` | `by_status_date` / `by_person_date` |
| `personWeek({ personId, from, to })` | `/office/personas/[id]` | `by_person_date` |

La mutation quedó como `setStatus` extendida con `note`, no como una función
aparte: el estado y el motivo se escriben juntos o el reporte queda devuelto sin
decir por qué. La nota se **reemplaza**, no se acumula — aprobar sin nota la
borra, porque una corrección ya hecha no debe seguir mostrándose como pendiente.

Tres decisiones que el plan no había tomado y que el código tuvo que tomar:

- **La aritmética no se rehace.** `convex/office.ts` no suma nada por su cuenta:
  las reglas viven en `lib/summaries.ts`, sin un solo import de Convex, y se
  prueban solas — igual que `lib/submission.ts` en el lado del teléfono.
- **`search` tiene tope.** Un rango de fechas de un año es una consulta legal.
  Escanea hasta 1.000 documentos y devuelve hasta 200, y avisa con `truncated`
  en vez de recortar en silencio.
- **Texto libre sigue afuera**, como decía la sección 9. El filtro de cliente es
  subcadena; el de job # es exacto, porque un job # es un identificador y "2155"
  es otro trabajo, no un prefijo de "21550".

**El límite honesto de "Faltan por entregar":** solo puede faltar quien se
enroló. Un capataz que nunca fijó su PIN no tiene cuenta, así que la lista no
puede saber si trabajó y no mandó nada. Por eso la query también devuelve
`unattributed` — reportes archivados sin capataz, que no sacan a nadie de la
lista.

---

## 6. Idioma

**La consola arranca en inglés.** Todo string va a `lib/i18n.ts` en los dos
idiomas igual, en un objeto `CONSOLE` separado de `UI` — `UI` ya tiene 292 líneas
y son dos vocabularios distintos, uno de campo y uno de oficina.

Las dos fuentes que parecían contradecirse no lo hacían: el brief exige que
ningún string esté hardcodeado en JSX, que es una regla sobre **dónde viven los
strings**, no sobre cuál idioma se muestra primero.

Los datos son aparte: las etiquetas de catálogo ya vienen en `{en, es}` desde el
teléfono (`l10n` en los validators), y `description` guarda original y traducción
con el idioma de cada uno. La consola muestra la traducción y deja ver el
original — nunca lo esconde.

---

## 7. El email

Hoy es HTML inline armado a mano en `app/api/send-report/route.ts`. Se rediseña
con los mismos tokens que la consola, y **gana un link al reporte** — que es lo
que lo convierte de documento final en notificación. Ese link es la mitad del
valor de tener consola: el PM abre el mail en la camioneta y toca.

---

## 8. Orden

```
A  Identidad del capataz + auth      ✅ hecho
B  Queries de Convex                 ✅ hecho: sin UI, verificadas contra dev
C  /office (el día) + detalle        ← sigue: el mínimo que sirve
D  Buscar + persona/semana
E  Email rediseñado con link
F  Auditoría: web-design-guidelines, react-best-practices, npm test
```

**A fue primero** porque cada reporte archivado sin capataz quedaba sin él para
siempre. Resultó que la ventana estaba entera: no había ni un reporte archivado
cuando se resolvió, así que no se perdió ninguna atribución.

**B se verificó con datos, no solo con tipos.** Se enrolaron dos capataces en
`dev:canny-dove-786`, se archivó un reporte de prueba a nombre de uno, se
corrieron las cinco queries y la vuelta completa de `setStatus` con nota, y
después se borró todo. "Faltan por entregar" nombró al que no mandó. El
deployment quedó vacío otra vez.

**Lo que bloquea a producción, y no es código.** El deployment de Convex es
`dev:canny-dove-786` y en Vercel no está ni `NEXT_PUBLIC_CONVEX_URL` ni
`AUTH_SECRET`. Mientras eso siga así, la app desplegada no archiva nada y no
pregunta quién sos — sin error visible, por diseño.

El plan ponía esto antes que B. B se hizo igual, y la razón es que no cambió
nada: las queries se escriben y se prueban contra el deployment de desarrollo
sin tocar producción. **Pero sí bloquea a C en adelante.** Una consola es una
pantalla que un PM abre esperando ver el día de su gente; contra una base en la
que ningún teléfono escribe, muestra cero reportes y cero capataces faltantes,
que es exactamente lo que mostraría si todo funcionara y nadie hubiera trabajado.
Eso no es una pantalla incompleta, es una pantalla que miente. Antes de C:
`npx convex deploy`, y las dos variables en Vercel.

**Falta también, y es de la oficina, no del capataz:** un capataz que olvide su
PIN hoy solo se desbloquea desde el dashboard de Convex
(`auth:removeAccount`, interna a propósito). Cuando exista `/office`, eso
necesita una pantalla.

---

## 9. Lo que NO entra en v1

Dicho explícito, para que la ausencia sea una decisión y no un olvido:

- Búsqueda de texto libre sobre descripciones (necesita search index).
- Aprobación en lote.
- Exportar a CSV — es el puente a la nómina, pero es su propia pieza.
- Vista por trabajo / costeo por job #.
- Catálogo administrable.
- Recordatorio automático a las 6pm.

---

## 10. Cómo se sabe que está bien

- Un PM abre `/office` a las 5pm y sabe **quién no entregó** sin preguntarle a nadie.
- De la bandeja a cualquier reporte, máximo 2 clics.
- Un reporte se lee de un vistazo en escritorio y en teléfono.
- Claro y oscuro terminados por igual; contraste AA; foco visible; todo operable
  con teclado.
- Toda tabla ancha scrollea dentro de sí misma, nunca la página.
- Estados vacíos que dicen qué hacer, no "no hay datos".
- `npm test` en verde, sin regresiones en offline, autoguardado, ES⇄EN, firma ni PDF.
