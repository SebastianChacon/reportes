# Job Report — Back to Nature

Versión web y móvil del formulario en papel **JOB REPORT — Construction · Maintenance · Planting · Design** (versión impresa `YW 6/5/26`).

Bilingüe español / inglés, pensada para llenarse con una mano, con guantes y con sol, desde el teléfono, en el sitio de trabajo.

---

## Cómo funciona

Un asistente de **6 pasos** en vez de una hoja de 200 casillas:

| Paso | Qué pide |
|---|---|
| 1. Trabajo | Fecha (el día de la semana se calcula solo), cliente, Job #(s), Truck #(s) |
| 2. Horarios | Salida del patio → llegada al trabajo → salida → regreso. Calcula horas totales, en sitio y de traslado |
| 3. Personal | Buscador sobre la lista de la empresa + horas. Botón "aplicar a todos" y "misma cuadrilla del último reporte" |
| 4. Trabajo hecho | Descripción con traductor ES⇄EN, más notas |
| 5. Materiales | Equipo, materiales, plantas, subcontratistas, camiones, millaje y desechos — en acordeones |
| 6. Revisar | Resumen de lo llenado, avisos, firmas con el dedo, enviar o descargar PDF |

### Decisiones que vienen del papel

- **Nada se renderiza hasta que escribís.** El papel imprime 200 filas y el capataz marca cinco; en el teléfono eso se convierte en buscar-y-agregar.
- **"Agregar" en personal, equipo y materiales.** En la foto original alguien escribió *Benjamin Mozza* y *Polymeric sand* a mano porque no estaban impresos. La app permite lo mismo y los marca con `*` en el PDF.
- **Botón "aplicar a todos".** En un día normal toda la cuadrilla trabaja las mismas horas.
- **Autoguardado local.** Si se cierra el navegador o se muere la batería no se pierde nada.
- **Sin señal no se pierde el reporte:** queda en una cola en el teléfono y se ofrece descargar el PDF.

---

## El traductor de la descripción

Funciona con un **glosario propio, sin internet y sin costo por uso**:

- Lo que escribís se guarda siempre como `original` y nunca se sobrescribe.
- El primer clic en `EN` o `ES` traduce y **guarda** el resultado.
- El **segundo clic en el mismo botón vuelve al original** — no vuelve a traducir.
- Si editás el texto, la caché se invalida y la próxima traducción es nueva.
- El reporte enviado lleva **las dos versiones**.

Es un traductor de **glosario**, no de gramática: convierte con fiabilidad el vocabulario del oficio (`polymeric sand → arena polimérica`, `borde de piedra azul → bluestone edge`, `juntas de ladrillo → brick joints`) y las palabras que las unen. Las palabras que no reconoce **se muestran en pantalla**, para que nadie confíe a ciegas en el resultado.

Ejemplo real, tomado de la hoja escaneada:

> **ES** Instalamos borde de piedra azul en el patio trasero en la esquina de la casa y instalamos arena polimerica en las aceras y limpiamos las juntas de ladrillo.
>
> **EN** Installed bluestone edge in the back yard in the corner of the house and installed polymeric sand in the sidewalks and cleaned the brick joints.

### Cambiarlo por una API

Todo pasa por la interfaz `Translator` en [lib/translate.ts](lib/translate.ts):

```ts
export interface Translator {
  detect(text: string): Lang;
  translate(text: string, target: Lang): Promise<TranslationResult>;
}
```

Para usar Claude u otro servicio, implementá esa interfaz y cambiá el `export const translator`. Nada más en la app se entera.

---

## Correr el proyecto

```bash
npm install
```

```bash
npm run dev
```

Abre <http://localhost:3000>.

---

## Enviar reportes por email

El envío usa [Resend](https://resend.com). Copiá `.env.example` a `.env.local` y llená:

```bash
cp .env.example .env.local
```

| Variable | Para qué |
|---|---|
| `RESEND_API_KEY` | Clave de la cuenta de Resend |
| `REPORT_TO_EMAIL` | A dónde llegan los reportes. Separá con comas para varios destinatarios |
| `REPORT_FROM_EMAIL` | Debe ser de un dominio verificado en Resend |

**Sin estas variables la app sigue funcionando**: "Enviar reporte" devuelve 503, se muestra un mensaje claro y el capataz usa "Descargar PDF".

El email lleva un resumen en HTML y el **PDF de una página** adjunto, con el mismo orden de secciones que el formulario impreso.

---

## La copia de la oficina (Convex)

Cada reporte enviado se archiva además en una base de datos, para que el PM pueda
revisarlos por día y por persona. La base guarda y **la consola ya existe**: vive en
`/office` — ver [La consola de la oficina](#la-consola-de-la-oficina-office) más abajo.

### Encenderlo

```bash
npx convex dev
```

Pide iniciar sesión con tu cuenta de Convex, crea el deployment y escribe
`CONVEX_DEPLOYMENT` en `.env.local`. Copiá la URL que imprime a `NEXT_PUBLIC_CONVEX_URL`.

**Sin esa variable la app funciona exactamente igual que antes**: el reporte sale por
la hoja de compartir y no se archiva nada. Como el teléfono ya guarda los últimos 20
reportes enviados, la primera reconexión después de configurarla **archiva los que ya
estaban** — no se pierde el trabajo de las semanas anteriores.

### Qué se guarda y por qué

| Tabla | Para qué |
|---|---|
| `reports` | El reporte completo, más `totals` y `flags` calculados **al escribir** con `lib/calc.ts`, para que la consola nunca contradiga al PDF |
| `crewDays` | Una fila por persona por reporte. Es lo único que hace que "elegir una persona y ver su día" sea una lectura indexada en vez de recorrer todos los reportes |
| `photos` | Van a file storage, no al documento: Convex corta los documentos en 1 MB |
| `users` | Correo, nombre y rol (`foreman` / `manager` / `admin`) |

Tres decisiones que sostienen el diseño:

- **`reports.submit` es idempotente** sobre `JobReport.id`. La cola reintenta varias
  veces cuando vuelve la señal — los navegadores móviles disparan `online` repetidas
  veces mientras se estabiliza la conexión — y un segundo envío del mismo reporte
  tiene que ser un no-op, o la nómina cuenta el día dos veces.
- **`personId` es el id del catálogo**, nunca el nombre. A quien el capataz escribe a
  mano se le guarda `personId: null`: aparece en el reporte pero no inventa una
  persona nueva en la lista cada vez.
- **Primero suben las fotos, después el reporte.** Un reporte que aparece en la
  consola mientras sus fotos todavía suben se lee como un reporte sin fotos.

Archivar es siempre **best-effort y posterior al envío**: pase lo que pase con la base,
el capataz ya mandó su reporte y nunca ve un error de esto. Si falla, la entrada queda
sin marcar en el historial y se reintenta en la próxima reconexión.

`convex/_generated/` está escrito a mano porque el codegen real necesita un deployment;
`npx convex dev` lo sobrescribe con el mismo contenido.

---

## La consola de la oficina (`/office`)

Donde el PM lee el día: los cuatro números, **quién no entregó**, y cada reporte
abierto entero con **Aprobar** y **Devolver con nota**. Está en inglés; el asistente
de campo sigue en español.

Y dos pantallas más para todo lo que no es hoy:

- **`/office/reportes`** — buscar por rango de fechas, cliente, número de trabajo,
  capataz, persona de cuadrilla y estado. Los filtros viven en la URL, así que una
  búsqueda es un link que se manda por WhatsApp y llega mostrando lo mismo. `/`
  salta al buscador. Texto libre sobre las descripciones todavía no: eso necesita
  un search index de Convex y es su propia decisión.
- **`/office/personas/[personId]`** — la semana de una persona, de lunes a domingo,
  armada desde `crewDays`. Suma las horas que **escribió el capataz** y cuenta
  aparte los días en que nadie las anotó, que es lo que la nómina necesita saber
  antes de pagar. Se llega desde el nombre en la cuadrilla de cualquier reporte, o
  desde la lista de "Faltan por entregar".

### Qué necesita para abrir

Dos variables, y la consola te dice cuál falta en vez de mostrarte un día vacío:

| Variable | Sin ella |
|---|---|
| `AUTH_SECRET` | Nadie puede entrar — no hay con qué firmar la sesión |
| `NEXT_PUBLIC_CONVEX_URL` | No hay reportes que leer |

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

### Crear una cuenta de oficina

No hay alta pública, a propósito: un capataz se auto-enrola porque su nombre ya está
en el roster y lo peor que puede hacer es reportar como sí mismo, pero una cuenta que
**aprueba trabajo** no se reparte sola. Se crean desde un CLI autenticado, el mismo
nivel donde ya vivía `auth:removeAccount`:

```bash
npx convex run auth:createOfficeAccount '{"email":"pm@tu-dominio.com","name":"Nombre Apellido","password":"una-contraseña-larga","role":"admin"}'
```

Mínimo 10 caracteres. Devuelve `null` si el correo ya tiene cuenta, así que
re-correrlo **no** es una forma de resetearle la contraseña a alguien en silencio.

La contraseña se verifica dentro de Convex con el mismo PBKDF2 de 100k iteraciones
que el PIN del capataz, y con el mismo bloqueo de 15 minutos a los 5 intentos. La
sesión dura 12 horas — no 90 días como la del teléfono — porque una consola se abre
en escritorios que se comparten.

---

## Editar la lista de personal

La lista vive en [lib/catalog.ts](lib/catalog.ts), en la constante `CREW`. Cada persona es una línea:

```ts
{ id: "santander-carlos", name: "Santander, Carlos", roles: ["F", "D"], group: "construction_field" },
```

Los códigos de rol (`M`, `F`, `D`, `SL`, `LD`, `LDS`, `AA`, `SLD`, `CM`, `PM`, `COS`, `VP`) están en `ROLE_CODES` y ya están traducidos a los dos idiomas.

En el mismo archivo están `EQUIPMENT`, `MATERIALS`, `PLANT_CATEGORIES`, `SUBCONTRACTOR_TRADES` y `TRUCKS`. Todo lo que agregues ahí con etiqueta en los dos idiomas **también alimenta el glosario del traductor automáticamente**.

---

## Estructura

```
app/
  page.tsx                    punto de entrada (el asistente del capataz)
  api/send-report/route.ts    email + PDF adjunto (Resend)
  api/auth/foreman/route.ts   enrolar / entrar con PIN → cookie
  api/auth/office/route.ts    entrar con correo y contraseña → cookie de 12 h
  api/office/status/route.ts  aprobar / devolver con nota
  office/
    layout.tsx                superficie "office": modo oscuro + lang="en"
    entrar/                   la puerta — fuera del grupo protegido
    (console)/
      layout.tsx              la puerta aplicada: todo lo de adentro está detrás
      page.tsx                el día
      reportes/                buscar: rango, cliente, job #, capataz, persona
      reportes/[id]/          un reporte, entero
      personas/[personId]/    la semana de una persona, día por día
components/
  JobReportApp.tsx            asistente, idioma, autoguardado, envío
  DescriptionField.tsx        traductor ES⇄EN con caché
  SearchPicker.tsx            buscar-y-agregar con opción "otro"
  SignaturePad.tsx            firma con el dedo (canvas)
  steps/                      los 6 pasos
  office/                     lo que solo usa la consola
convex/
  office.ts                   las queries de lectura de la consola
  auth.ts                     PIN del capataz + contraseña de la oficina
lib/
  catalog.ts                  personal, equipo, materiales, camiones
  translate.ts                glosario offline + interfaz Translator
  pdf.ts                      PDF de una página
  calc.ts                     horas, costos, avisos, campos obligatorios
  summaries.ts                las reglas de lectura, sin importar Convex
  i18n.ts                     textos: UI (campo, ES) y CONSOLE (oficina, EN)
  officeSession.ts            la puerta de la consola
  officeDate.ts               qué significa "hoy", y dónde empieza una semana
  officeSearch.ts             los filtros de búsqueda, leídos y escritos en la URL
  storage.ts                  borrador, idioma, última cuadrilla, cola
```

---

## Notas

- Objetivos táctiles de 44px, teclados nativos correctos (`date`, `time`, `inputmode="decimal"`), tipografía de 16px mínimo para que iOS no haga zoom al enfocar.
- **El asistente del capataz es siempre claro**, aunque el teléfono esté en modo oscuro: se lee al aire libre, donde un tema oscuro es la respuesta equivocada diga lo que diga el sistema. **La consola sí sigue al sistema** — se lee en un escritorio, muchas veces de noche. Por eso el modo oscuro está limitado al subárbol `[data-surface="office"]` y no es global.
- `npm audit` reporta 3 avisos *high* heredados de dependencias internas de Next (`postcss`, `sharp`). Ya estamos en la última versión de Next; no hay corrección disponible que no sea bajar de versión.
# reportes
