# Plan — La consola del PM

> **Estado: aprobado. Pasos A–E construidos; queda F, la auditoría.**
> `PROMPT-UI-PM.md` prohíbe construir la superficie del PM antes de que Sebastian
> apruebe un plan. Este es ese plan, y está aprobado.
>
> **Hecho:** A (identidad del capataz, sección 2), B (las queries de
> `convex/office.ts`, sección 5), C (`/office` y `/office/reportes/[id]`, con la
> puerta de la oficina), D (buscar + persona/semana) y E (el email rediseñado y
> el link de vuelta al reporte, sección 7).
> **Pendiente:** F, la auditoría.

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
> cinco: `convex/office.ts`. Tres de ellas —`dayBoard`, `missingToday` y
> `report`— ya las lee una pantalla. `search` y `personWeek` siguen sin lector
> hasta el paso D.

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

## 3. Autenticación — decidido, y ahora construido de los dos lados

> **Actualizado en C.** El paso A construyó solo la mitad del capataz. La mitad
> de la oficina —correo, contraseña real, sesión de 12 h— se construyó junto con
> las pantallas, porque sin ella `/office` se habría desplegado abierto: cualquiera
> con la URL vería todos los reportes de la compañía y podría aprobarlos.
>
> **Cómo quedó.** `auth:signInOffice` verifica la contraseña dentro de Convex con
> el mismo PBKDF2 de 100k iteraciones y el mismo bloqueo de 15 minutos que el PIN.
> La puerta vive en `lib/officeSession.ts` y la aplica el layout de
> `app/office/(console)/`, no cada página: una ruta nueva bajo esa carpeta queda
> protegida por existir, y la pantalla de entrada está fuera del grupo justamente
> para no tener que abrirle una excepción a la puerta.
>
> **No hay alta pública de cuentas de oficina, y es deliberado.** El auto-enrolamiento
> es correcto para un capataz —su nombre ya está en el roster y lo peor que puede
> hacer es reportar como sí mismo— y es incorrecto para una cuenta que aprueba
> trabajo. Se crean desde un CLI autenticado, el mismo nivel donde ya vivía
> `auth:removeAccount`:
>
> ```
> npx convex run auth:createOfficeAccount '{"email":"…","name":"…","password":"…","role":"admin"}'
> ```

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

> **Construido, con dos ausencias que conviene dejar dichas.**
>
> **Las firmas no existen en la consola, y no es un olvido: nunca llegan a la
> base.** `lib/types.ts:130` las lleva en el teléfono, pero no están en
> `submittedReportFields`, así que viven solo dentro del PDF que el capataz mandó.
> Dibujar una caja de firma vacía diría que nadie firmó, que es falso. Meterlas
> es una decisión de esquema aparte — dos data-URL PNG por reporte — y no se tomó
> aquí.
>
> **Descargar PDF y reenviar por correo quedaron para el paso E**, que es donde
> se rehace el email y donde nace el link al reporte que hace que un reenvío
> valga algo.

Completo, en el mismo orden que el papel, con firmas y fotos. Acciones:
**Aprobar** · **Devolver con nota** · Descargar PDF · Reenviar por correo.

"Devolver con nota" cierra el círculo que hoy no existe: el reporte reaparece en
el teléfono del capataz con el comentario ("faltan las horas de Carlos") y él lo
corrige. Hoy eso es una llamada telefónica.

Requiere dos campos nuevos en `reports`: `reviewNote: v.optional(v.string())` y
que `needs_review` se lea como "devuelto" en el teléfono.

*Índices:* lectura directa por id, más `photos.by_report` y `crewDays.by_report`.

### `/office/reportes` — Buscar

> **Construida, con tres decisiones que el plan no había tomado.**
>
> **La ventana por defecto es de siete días**, no "todo". El rango es lo único
> que mantiene acotada esta consulta, y una pantalla recién abierta todavía no
> sabe qué se está buscando: una semana alcanza para "el reporte que vi el
> martes" sin abrir con doscientas filas.
>
> **Media URL editada a mano sigue preguntando algo sensato.** `?from=` sin
> `to=` extiende la ventana en vez de descartarse, y un rango al revés se da
> vuelta — porque un rango invertido no devuelve nada, y en pantalla eso se ve
> exactamente igual que una semana en que nadie trabajó.
>
> **Un estado que no existe se ignora en vez de viajar a Convex**, que lo
> rechazaría como argumento y convertiría un bookmark viejo en una página de
> error.
>
> Las reglas viven en `lib/officeSearch.ts`, sin un solo import de Convex, y se
> prueban solas — igual que `lib/summaries.ts` del otro lado.

Rango de fechas · cliente · job # · capataz · persona de cuadrilla · estado.
Filtros pegados en la URL. `/` enfoca la búsqueda.

*Índices:* `reports.by_status_date` y `crewDays.by_person_date` cubren los casos
que importan. **Texto libre sobre la descripción no entra en v1** — eso es un
search index de Convex, es otra decisión, y se puede agregar después sin mover
nada de lo demás.

### `/office/personas/[personId]` — La semana de una persona

> **Construida.** La semana va de lunes a domingo, que es la semana en que se
> organiza el trabajo y en que se cuenta la nómina: una salida de sábado
> pertenece a los días que vinieron antes, no al domingo que abre la siguiente.
>
> **Un día sin horas se queda en blanco, nunca en cero**, y la pantalla cuenta
> cuántos hay: la nómina no puede pagar una semana hasta que ese número sea
> cero, así que vale más dicho que callado.
>
> **Solo la gente del roster tiene página.** Un nombre que el capataz escribió a
> mano se guarda con `personId` nulo a propósito, así que ninguna URL llega a
> uno; lo que no se reconoce dice que no está en la lista y explica por qué, en
> vez de mostrar una semana vacía que parecería una semana sin trabajo.

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
| `accounts()` | el filtro "enviado por" | la tabla `users` entera |

`accounts` la agregó el paso D y es más ancha que los capataces que cuenta
`missingToday`: `submittedBy` se escribe con la sesión que archivó el reporte,
así que un gerente que mandó uno desde una camioneta está en los datos aunque no
sea capataz. Un menú que no pudiera nombrarlo dejaría sus reportes fuera del
alcance del único filtro hecho para encontrarlos.

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

## 6. Idioma — construido

> **Hecho tal cual.** `CONSOLE` vive en `lib/i18n.ts` junto a `UI` pero separado,
> con `tc()` y `tcf()` para los strings con `{n}`. Ni un string en JSX. El idioma
> es una constante, `CONSOLE_LANG`, así que cambiarlo es una línea y no una
> reescritura. El `lang="en"` va en un envoltorio de `app/office/layout.tsx`, no
> en `<html>`, porque el layout raíz declara `es` para el asistente de campo — que
> es el HTML correcto para un subárbol en otro idioma, y lo que un lector de
> pantalla necesita para cambiar de voz en el lugar justo.

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

## 7. El email — construido

> **Hecho, y el link resultó ser más interesante de lo que el plan suponía.**
>
> El HTML salió de la ruta y vive en `lib/reportEmail.ts`, con los tokens de la
> consola escritos como hex literal — ningún cliente de correo resuelve `var()`.
> Solo claro: un email que intentara seguir el modo oscuro del lector lo
> reescribe Gmail e invierte Outlook, cada uno para su lado.
>
> **El link no puede llevar el id de Convex, porque cuando el email sale todavía
> no existe.** El teléfono manda el correo apenas el capataz aprieta enviar, y
> archiva la copia de la oficina *después*, como cortesía en segundo plano a la
> que se le permite fallar (`lib/office.ts`). Así que el link lleva `clientId`
> —la clave de idempotencia que el teléfono ya calculó— y
> `/office/reportes/clave/[clientId]` la convierte en el reporte real:
> `office.byClientId` sobre el índice `by_client_id` que ya existía.
>
> Eso obligó a una tercera respuesta que el plan no había previsto: **"el correo
> llegó y el reporte no"**. Es un estado real y recuperable —el teléfono se quedó
> sin señal a las 6pm y va a reintentar— y decir "no encontrado" mandaría a
> alguien a buscar un reporte que va a aparecer solo. Por eso es una página y no
> un redirect en middleware.
>
> La página vive dentro de `(console)`, así que un link reenviado a alguien sin
> cuenta cae en el login, no en un reporte. Es la única URL de la consola que
> sale del edificio.
>
> **Sin `NEXT_PUBLIC_CONVEX_URL` no hay link y el email lo dice**, en vez de
> dibujar un botón que caería en "no está". `APP_URL` fija el origen; sin ella se
> usa el Origin de la petición, que ya fue validado contra Host.
>
> **Descargar PDF y reenviar por correo NO se construyeron, y ahora se sabe por
> qué.** El PDF que el capataz mandó no está guardado en ningún lado, y las
> firmas no llegan a la base (sección `/office/reportes/[id]`). Rehacerlo desde
> lo almacenado daría un documento sin firmas: distinto del que está en la
> bandeja del PM. Darle a un PM un PDF que no coincide con el que ya tiene es
> peor que no darle ninguno. **Eso es una decisión de esquema —guardar el PDF, o
> guardar las firmas— y no se toma acá.** Es lo primero que hay que resolver si
> esos dos botones importan.

Era HTML inline armado a mano en `app/api/send-report/route.ts`. Se rediseñó
con los mismos tokens que la consola, y **ganó un link al reporte** — que es lo
que lo convierte de documento final en notificación. Ese link es la mitad del
valor de tener consola: el PM abre el mail en la camioneta y toca.

---

## 8. Orden

```
A  Identidad del capataz + auth      ✅ hecho
B  Queries de Convex                 ✅ hecho: sin UI, verificadas contra dev
C  /office (el día) + detalle        ✅ hecho: contra dev, con datos sembrados
D  Buscar + persona/semana           ✅ hecho: contra dev, con datos sembrados
E  Email rediseñado con link         ✅ hecho: contra dev, las dos ramas del link
F  Auditoría: web-design-guidelines, react-best-practices, npm test  ← sigue
```

**E se verificó con un reporte sembrado y la vuelta completa del link.** Se
archivó un reporte de prueba en `dev:canny-dove-786` bajo una clave conocida y
se siguió el link como lo seguiría un PM: sin sesión cae en el login (la puerta
de `(console)` cubre la ruta nueva), con sesión redirige a
`/office/reportes/[id]` y muestra el reporte correcto. Una clave que nadie
archivó —incluida una clave `legacy:` llena de dos puntos, que es la que prueba
que el encode/decode de la URL no la rompe— muestra "este reporte no está
archivado". Después se borró el reporte.

Queda vivo en `dev` **una cuenta de oficina de prueba** ("Step E Probe"):
`auth:removeAccount` busca por `crewMemberId` y una cuenta de oficina no tiene,
así que hoy solo se borra desde el dashboard de Convex. Es el mismo agujero que
la sección 8 ya anotaba para el capataz que olvida el PIN, ahora confirmado del
lado de la oficina.

**C se construyó contra `dev`, no contra producción, y el bloqueo de abajo sigue
en pie.** El plan decía que producción bloqueaba a C. Bloquea a *desplegar* C, no
a escribirlo: es el mismo argumento que dejó pasar a B. Se sembraron tres
reportes de un día real en `dev:canny-dove-786` —dos con capataz, uno sin— y se
verificó la vuelta completa contra ellos: entrar, leer el día, abrir un reporte,
devolverlo con nota, y aprobarlo (lo que borra la nota, como manda la sección 5).
`reviewedBy` quedó escrito con el nombre que salió de la cookie, no de la página.

Lo que queda por verificar contra producción es exactamente lo que producción
tiene y `dev` no: nada, hasta que exista.

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
sin tocar producción. C se hizo por la misma razón.

**Lo que bloquea es el despliegue, no la escritura.** Una consola es una pantalla
que un PM abre esperando ver el día de su gente; contra una base en la que ningún
teléfono escribe, muestra cero reportes y cero capataces faltantes, que es
exactamente lo que mostraría si todo funcionara y nadie hubiera trabajado. Eso no
es una pantalla incompleta, es una pantalla que miente.

> **Actualizado en C: ya no miente.** La consola ahora comprueba las dos
> variables y, si falta alguna, lo dice y las nombra en pantalla en vez de
> dibujar un día vacío (`lib/officeSession.ts`, `components/office/Unconfigured.tsx`).
> Eso quita el peligro, no el trabajo: sigue sin haber deployment de producción.

Antes de que la consola sirva para algo desplegada, hacen falta tres órdenes, y
ninguna es código:

```
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
npx convex deploy
vercel env add NEXT_PUBLIC_CONVEX_URL production && vercel env add AUTH_SECRET production
```

Y después, una cuenta de oficina en el deployment de producción — ver la
sección 3. Sin ella no hay quien entre.

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
