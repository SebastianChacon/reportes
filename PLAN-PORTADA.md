# Plan — la portada

Una pantalla inicial en `/` que hace una sola pregunta y la responde bien:
**¿venís a llenar un reporte, o venís a administrar?**

---

## 1. Por qué hace falta

Hoy la raíz `/` es el asistente de campo. Eso significa que el link que uno
comparte para decir "acá está el sistema" abre el paso 1 de un formulario de
seis pasos en español, apuntado a un capataz. Un gerente que recibe ese link no
tiene desde ahí ninguna forma de llegar a la consola: `/office` no está enlazado
en ninguna parte de la app de campo. La única pantalla que enlaza las dos
puertas es `/inicio`, y hay que saber que existe.

La pieza también existe a medias: `Surfaces` en
[HomeShell.tsx:104](components/home/HomeShell.tsx#L104) ya dibuja las dos
tarjetas, con los tres estados correctos de la puerta de oficina. El trabajo no
es inventarla, es **moverla a la raíz, sacarle el ruido de alrededor y arreglar
lo que hoy se rompe al cruzar la puerta cerrada**.

## 2. Decisiones tomadas

| | |
|---|---|
| "Reportes" lleva a | llenar un reporte — el asistente de campo, sin sesión |
| La portada vive en | `/`; el asistente se muda a `/reporte` |
| `/inicio` queda como | página de estado (números del día, capacidades, inventario de rutas), sin las dos tarjetas |

**El costo, dicho de frente:** el capataz gasta un toque más cada mañana. Se
compensa en §6 y no se disimula: `/reporte` es una URL que se puede marcar, y la
portada recuerda la última puerta elegida. Lo que **no** se hace es redirigir
automáticamente (§6), porque eso deja atrapado al que eligió mal una vez.

## 3. El problema de diseño de verdad

Las dos puertas no son simétricas y la pantalla tiene que decirlo **antes** del
clic, no después.

- **Reportes** está abierta. Se toca y se está adentro.
- **Administración** pide correo y contraseña.

Si las dos tarjetas se ven iguales, la única forma de aprender la diferencia es
tocar y aparecer en un formulario de login sin haberlo pedido. Ese es el
momento exacto en el que una pantalla "intuitiva" deja de serlo. Entonces:

1. **La puerta de administración lleva un candado y la palabra "Entrar"**, no
   "Abrir". La cerradura se anuncia; no se descubre.
2. **La puerta de campo es la fuerte.** No por importancia moral: se usa veinte
   veces por cada vez que se abre la otra. Va con relleno de tinta sólida, que
   en este producto ya es el gesto más fuerte que existe (ver el bloque de
   tokens en [globals.css](app/globals.css) — no hay color que gastar, así que
   el énfasis lo carga el relleno). La de administración va en contorno.
3. **Nadie con sesión viva ve un login.** La tarjeta lee la cookie en el
   servidor y, si ya hay sesión de oficina, dice "Abrir administración" y va
   derecho a `/office`.
4. **Una puerta que no puede abrirse no se ofrece como link.** Sin
   `AUTH_SECRET` o sin `NEXT_PUBLIC_CONVEX_URL` la tarjeta se muestra igual —
   es la mitad de lo que este producto es — pero apagada, diciendo que no está
   conectada en este servidor. Esa lógica ya existe en
   [systemStatus.ts](lib/systemStatus.ts) y en `officeAccess()`; se reusa, no se
   reescribe.

Restricciones de estilo que el plan hereda y respeta: una sola tinta
(PLAN-BLANCO-Y-NEGRO.md), `--danger` naranja como único matiz y solo para
errores, y las primitivas ya existentes `card` · `press` · `touch-target` ·
`step-enter`. **No se agrega paleta nueva.**

## 4. La forma de la pantalla

```
┌──────────────────────────────────────────────┐
│  BACK TO NATURE                    [ES│EN]   │
│  Reporte de trabajo                          │
│                                              │
│  ┌────────────────────┐ ┌──────────────────┐ │
│  │ ███ Reportes  ███  │ │  Administración  │ │
│  │ Llenar el reporte  │ │  🔒 El día, la   │ │
│  │ del día. Seis      │ │  búsqueda, las   │ │
│  │ pasos, en el       │ │  horas por       │ │
│  │ teléfono.          │ │  persona.        │ │
│  │                    │ │                  │ │
│  │ Empezar →          │ │  Entrar →        │ │
│  └────────────────────┘ └──────────────────┘ │
│                                              │
│                       Estado del servidor ↗  │
└──────────────────────────────────────────────┘
```

- **Una columna en teléfono**, con "Reportes" arriba: es el pulgar del capataz
  el que llega primero. Dos columnas desde `md`.
- **Alto mínimo generoso y centrado vertical** en pantallas de escritorio. Es
  una pantalla con dos objetos; llenarla de aire es la decisión correcta, no la
  perezosa.
- **Nada más.** Ni números, ni estado, ni inventario. Un link discreto al pie
  hacia `/inicio` para quien necesite el diagnóstico.
- **Bilingüe**, con el `LanguageToggle` que ya existe. Escribe la misma clave de
  `localStorage` que lee el asistente, así que elegir inglés acá abre el
  asistente en inglés. Una sola preferencia en todo el producto.

## 5. Los pasos

### Paso 1 — mudar el asistente a `/reporte`

- `app/page.tsx` → `app/reporte/page.tsx` (el archivo actual es de dos líneas;
  se mueve tal cual).
- Nuevo `app/reporte/layout.tsx` que declara `themeColor: "#f4f4f4"`.
  **Importante:** hoy ese `themeColor` fijo vive en el `viewport` de
  [layout.tsx](app/layout.tsx) y aplica a la raíz. Si la portada se queda con
  él, la barra del navegador queda clara sobre una página que se fue a oscuro,
  que es exactamente el bug que `/inicio` y `/office` ya arreglaron en sus
  layouts. Del `viewport` raíz se quedan `width`, `initialScale`,
  `maximumScale: 5` y `viewportFit: "cover"` — el asistente los necesita.
- `<html lang="es">` sigue en el layout raíz. La portada declara su propio
  `lang` en su envoltorio, como ya hace `HomeShell`.

### Paso 2 — la portada en `/`

- Nuevo `app/page.tsx`: server component, `export const dynamic = "force-dynamic"`,
  llama `officeAccess()` y `systemStatus()`. **No consulta Convex**: la portada
  no muestra números, y esa es la razón por la que va a ser la página más rápida
  del producto.
- Nuevo `app/(portada)/layout.tsx` o layout propio: envoltorio con
  `data-surface="home"` + `deskFonts` + `themeColor` por esquema (claro/oscuro),
  copiado de [app/inicio/layout.tsx](app/inicio/layout.tsx).
- Nuevo `components/portada/Portada.tsx`: cliente, dueño del idioma y del
  toggle. Se construye extrayendo `Surfaces` y `SurfaceCard` de
  [HomeShell.tsx](components/home/HomeShell.tsx) y aplicándoles §3 (candado,
  jerarquía sólido/contorno, tercer estado "ya tenés sesión").

### Paso 3 — `/inicio` se vuelve la página de estado

- Sacar `<Surfaces>` de `HomeShell`; el resto queda igual.
- Sacar también la consulta a Convex si el panel del día se queda — **se queda**:
  "cuántos reportes llegaron hoy y quién no entregó" es información de estado,
  no de navegación.
- Actualizar el título y el `tagline` para que digan qué es ahora la página.
- Actualizar la tabla `ROUTES` en
  [Inventory.tsx:87](components/home/Inventory.tsx#L87): `/` pasa a ser la
  portada, se agrega `/reporte`, se agrega `/inicio`.

### Paso 4 — que la puerta cerrada no pierda el destino

Dos arreglos chicos que hoy son fricción real y que la portada vuelve visibles:

- [`(console)/layout.tsx:23`](app/office/(console)/layout.tsx#L23) hace
  `redirect("/office/entrar")` y **tira a dónde ibas**. Pasar a
  `redirect("/office/entrar?next=" + encodeURIComponent(ruta))`.
- [`SignInForm.tsx:44`](components/office/SignInForm.tsx#L44) hace
  `router.replace("/office")` fijo. Leer `next` de los search params y usarlo,
  **validando que empiece con `/office`** — si no, ignorarlo y usar `/office`.
  Sin esa validación el parámetro es un redirect abierto.
- El link "volver" del formulario apunta hoy a `/inicio`; pasa a `/`.

### Paso 5 — textos

Todo entra en el bloque `HOME` de [i18n.ts:901](lib/i18n.ts#L901), en los dos
idiomas, con claves nuevas (`doorFieldTitle`, `doorFieldBody`, `doorFieldCta`,
`doorAdminTitle`, `doorAdminBody`, `doorAdminSignIn`, `doorAdminOpen`,
`doorAdminLocked`, `doorLockedHint`, `statusLink`). Las claves viejas de
`Surfaces` (`fieldTitle`, `officeBody`, …) se borran una vez que nadie las usa.

**Decisión de copia:** la puerta se llama **"Administración" / "Administration"**
—la palabra que usa la gente que la va a tocar— aunque la ruta siga siendo
`/office` y la consola siga hablando en inglés adentro. La ruta no es texto de
interfaz.

### Paso 6 — recordar la elección, sin trampa

- La portada guarda en `localStorage` cuál puerta se usó por última vez.
- Efecto: en teléfono, esa puerta se dibuja primero. **Nada más.**
- **Explícitamente no se hace redirección automática.** Un `/` que salta solo al
  asistente deja sin entrada al gerente que recibió ese mismo link, y la salida
  —un parámetro de query para "no me redirijas"— es una función escondida, que
  es lo contrario de lo que pide este trabajo. Si más adelante el toque extra
  molesta de verdad, la respuesta correcta es un `manifest.json` con
  `start_url: "/reporte"` para que el ícono en la pantalla de inicio del
  teléfono abra el asistente directo. Eso es trabajo aparte (hoy no hay
  `public/` ni manifiesto; ver PLAN.md §3).

### Paso 7 — el login ya viene lleno, y solo hay que dar Entrar

Pedido: que al llegar a `/office/entrar` el correo y la contraseña ya estén
puestos, y que entrar sea un solo clic.

**La distinción que decide todo esto.** Precargar la contraseña **real** de la
oficina significa mandarla en el JavaScript a todo el que abra la página: el
navegador tiene que tenerla para poder escribirla en el campo. Eso no es una
puerta más floja, es no tener puerta — cualquiera con la URL entra, y la
contraseña queda además en el HTML que el navegador cachea y que cualquier
buscador que llegue a la página puede indexar. Así que lo que se precarga es la
**cuenta de demostración**, cuyas credenciales ya están en git desde que existe
el seed:

```
convex/seed.ts:43   demo@backtonature.test / demo-back-to-nature
```

Precargar eso no mueve ningún secreto a ningún lado nuevo. Precargar el otro par
sí, y por eso el plan no lo hace ni ofrece una opción para hacerlo.

**Cómo:**

- Las credenciales se mudan de `convex/seed.ts` a `lib/demoAccount.ts`, y las
  dos puntas leen de ahí. `convex/seed.ts` ya importa de `../lib/` (líneas 5–7),
  así que el camino existe y no hay que inventarlo. Un solo lugar donde vive el
  par es lo que evita que el formulario ofrezca una contraseña que el seed ya
  cambió — y ese fallo se vería como "la demo no entra", que es el peor momento
  para descubrirlo.
- El precargado se enciende con **`NEXT_PUBLIC_DEMO_SIGN_IN=1`**, y con nada
  más. Un deployment que no la declara no precarga nada: **falla cerrado**, que
  es la única forma segura de equivocarse acá. Poner la variable en el proyecto
  de demostración es una línea; olvidarla en producción es el comportamiento
  correcto.
- `SignInForm` arranca su estado con el par en vez de con `""`, y muestra una
  línea sobria arriba del formulario diciendo que son credenciales de
  demostración. Sin eso, alguien va a creer que la sesión que abrió es la suya y
  va a aprobar reportes de mentira pensando que son reales.
- **No se auto-envía.** El pedido es "solo dar Entrar", y eso es exactamente lo
  que queda: los campos llenos y un botón. Un formulario que se manda solo al
  cargar también quita la única pantalla desde la cual alguien puede escribir
  *otras* credenciales, que es lo que hace el gerente de verdad.
- Los campos quedan editables y con su `autoComplete` intacto, así que el
  administrador de contraseñas del gerente sigue pudiendo pisar los dos valores.

**Lo que hay que verificar y hoy no sé:** si el deployment que usás para mostrar
la consola tiene corrido `seed:demo`. Si no, la cuenta `demo@backtonature.test`
no existe y el botón va a contestar "contraseña incorrecta" con los campos
llenos, que es la forma más confusa posible de fallar. El paso incluye correr
`npx convex run seed:demo` contra ese deployment, o —si preferís no sembrar
datos— crear solo la cuenta con `auth:createOfficeAccount`.

## 6. Qué se toca

```
app/page.tsx                       reescrito → la portada
app/reporte/page.tsx               nuevo → lo que era app/page.tsx
app/reporte/layout.tsx             nuevo → themeColor claro fijo
app/layout.tsx                     editado → sale themeColor del viewport raíz
app/inicio/page.tsx                editado → título/tagline de página de estado
components/portada/Portada.tsx     nuevo → las dos puertas
components/portada/icons.tsx       nuevo → candado (o se suma a home/icons.tsx)
components/home/HomeShell.tsx      editado → sale Surfaces + SurfaceCard
components/home/Inventory.tsx      editado → tabla ROUTES al día
components/office/SignInForm.tsx   editado → ?next= validado, link de vuelta a /,
                                             campos precargados en modo demo
app/office/(console)/layout.tsx    editado → redirect conserva el destino
lib/demoAccount.ts                 nuevo → el par de la demo, en un solo lugar
convex/seed.ts                     editado → lee el par de lib/ en vez de definirlo
lib/i18n.ts                        editado → claves nuevas en HOME y en CONSOLE
.env.example                       editado → NEXT_PUBLIC_DEMO_SIGN_IN, documentada
README.md                          editado → el mapa de rutas cambia
```

Nada de esto toca `lib/calc.ts`, `lib/pdf.ts`, `lib/storage.ts` ni ningún paso
del asistente. **El riesgo está contenido en el ruteo y en la capa de
presentación.**

## 7. Cómo se verifica

1. `npm run dev`, y recorrer `/` → `/reporte` → volver → `/` → "Entrar" →
   `/office/entrar` → consola.
2. **Los tres estados de la puerta de administración**, forzados por entorno:
   sin `AUTH_SECRET` (apagada), con secreto y sin cookie ("Entrar"), con sesión
   viva ("Abrir" y sin pasar por el login).
3. **El destino conservado:** pegar `/office/reportes` sin sesión debe volver a
   `/office/reportes` después de entrar, no a `/office`.
4. **El redirect abierto:** `/office/entrar?next=https://otro.sitio` tiene que
   ignorarse y caer en `/office`.
5. **El precargado, por las dos puntas.** Con `NEXT_PUBLIC_DEMO_SIGN_IN=1`: los
   campos llegan llenos y un solo clic entra. **Sin la variable: los campos
   llegan vacíos**, y —lo que de verdad importa— `view-source` y el bundle de
   JavaScript no contienen ninguna contraseña. Esto se mira, no se supone:
   `grep -r "demo-back-to-nature" .next/static/` tiene que no devolver nada en
   un build hecho sin la variable.
5. A 375px y a 1440px; en claro y en oscuro; con el teclado solo (foco visible,
   orden de tabulación: idioma → reportes → administración → estado).
6. `npm run test` y `npm run build`. Los tests que existen son de `lib/`, que
   este plan no toca — sirven como control de que no se rompió nada de paso.

## 8. Lo que este plan no hace

- No agrega login al asistente de campo. La `IdentityGate` que ya existe sigue
  siendo saltable a propósito: un reporte a las 6am importa más que saber de
  quién es.
- No unifica las tipografías ni los temas del asistente y la consola. Son dos
  superficies distintas por decisión, y la portada es el puente, no la fusión.
- **No precarga la cuenta real de la oficina, en ningún modo.** No es una
  omisión que se pueda completar más adelante con una variable más: la
  contraseña tiene que llegar al navegador para poder aparecer en el campo, así
  que toda versión de eso la publica. Si lo que molesta es que el gerente la
  escriba cada día, la respuesta es el administrador de contraseñas —los campos
  conservan su `autoComplete` justamente para eso— o alargar las 12 horas que ya
  dura la cookie.
- No arregla los P0 de PLAN.md (el outbox que nadie lee, el borrador sin versión
  de esquema, la API sin autenticación). Siguen siendo más urgentes que esta
  pantalla, y siguen abiertos.
