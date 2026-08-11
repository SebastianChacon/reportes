# Plan — La consola en una sola tinta

> **Estado: las nueve fases implementadas.** `npm test` 347 en verde, `tsc`
> limpio, build de producción correcta.
>
> Cinco cosas se decidieron distinto al construirlas: la trama va a 1.5px y no a
> 2 (§3), la celda hueca del calendario necesitó token propio en oscuro (§3), la
> mono se acotó a columnas e instrumentos en vez de a todo `tabular-nums` (§4),
> los cuatro filtros nuevos se unificaron en uno solo llamado `issue` (§6), y
> aparecieron tres fallos previos que no estaban en el plan (§10).
>
> **La fase 7 sigue siendo la candidata a quitar.** Está hecha y funciona, pero
> es la única que cambia cómo trabaja la gente en vez de cómo se ve la pantalla.
> Revertirla es borrar `CardApprove.tsx` y `DayFilter.tsx` y quitar la prop
> `approvable`; nada más depende de ella.

Rediseño del panel de administración (`/office`, y con él la portada `/inicio`)
a blanco y negro, y al mismo tiempo más fácil de usar.

Son dos trabajos distintos y conviene decirlo de entrada: **quitar el color** es
una decisión visual, y **hacerlo más intuitivo** es una decisión de flujo. Este
plan los mantiene separados — fases 1 a 4 cambian cómo se ve, fases 5 a 7 cambian
cómo se usa — porque cada mitad se puede soltar sin la otra si hace falta parar a
medias.

La app del teléfono no se toca. Ese formulario se lee al sol, en una obra, y su
señal más fuerte es el naranja de `--color-clay-600` cuando dos horas se
contradicen. Quitarle el color a esa pantalla sería empeorarla por coherencia,
que es la peor razón que hay.

---

## 0. Qué se rompe al quitar el color, y qué no

Antes de elegir grises conviene saber qué estaba haciendo el color, porque hoy
hace tres trabajos distintos y sólo uno de ellos sobrevive al blanco y negro tal
cual está.

**Lo que hace hoy el color en la consola:**

| Trabajo | Dónde | ¿Sobrevive en B/N? |
|---|---|---|
| **Identidad** (dos series: lo nuestro / lo de fuera) | `--viz-ours` azul, `--viz-theirs` naranja | **No.** Hay que cambiar de canal. |
| **Magnitud** (cuánto se trabajó ese día) | rampa `--viz-seq-1..5` | **Sí**, con menos escalones. |
| **Estado** (aprobado / hay que revisar) | `--ok` verde, `--warn` marrón | **No.** Hay que cambiar de canal. |

La parte de identidad no es opinable, es aritmética. El validador de paletas dice
esto sobre cualquier pareja de grises usada como categorías:

```
node scripts/validate_palette.js "#111111,#6b6b6b" --mode light

  [FAIL] Chroma floor    below floor (reads gray)
  [PASS] CVD separation  ΔE 35.0
  [PASS] Normal-vision   ΔE 35.0
```

Los dos grises se distinguen perfectamente — pero fallan el suelo de croma **por
construcción**, porque el croma de un gris es cero. No hay pareja de grises que
apruebe ese examen, y no es un defecto de estos dos valores: es que el gris no
codifica identidad, codifica cantidad. Dos grises en un gráfico apilado se leen
como "más" y "menos", no como "nuestro" y "de fuera".

Así que la regla de fondo de todo este plan:

> **El tono se reserva para la magnitud. La identidad pasa a la trama, y el
> estado pasa al peso y a la regla.**

Eso no es un apaño para salir del paso. La trama sobrevive a la fotocopiadora y a
la impresora en blanco y negro, y estos reportes se imprimen y se grapan a las
facturas. En este producto la trama es *mejor* que el color, no un sustituto.

### La dirección visual: el ticket de trabajo, no el periódico

Un "panel de administración en blanco y negro" tira solo hacia un sitio: reglas
finas de un píxel, esquinas a cero, columnas apretadas de periódico. Es el
resultado por defecto, y sale igual para un banco que para esto.

Este producto tiene un mundo propio del que sacar el diseño y conviene usarlo: es
un parte de trabajo diario. El vocabulario de ese mundo es el **talonario de
copias** — el ticket con casillas rayadas, el nombre del campo impreso pequeño en
la esquina del recuadro, y el **sello** de goma. Ese mundo ya era monocromo antes
de que nadie lo pidiera: un talonario autocopiativo es tinta negra sobre blanco y
canario.

De ahí salen las tres decisiones que hacen que esto no parezca una plantilla:

- **El sello.** El estado de un reporte deja de ser una pastilla de color y pasa
  a ser lo que una oficina hace de verdad con un parte: estamparlo. Es el único
  sitio donde este diseño se permite ser llamativo (fase 2).
- **Las esquinas se quedan.** Los `border-radius: 16px` de `.card` no se tocan.
  Ponerlos a cero para parecer más severo sería disfraz, no decisión.
- **Ni negro puro ni blanco puro.** La tinta es `#141414` sobre `#ffffff`, no
  `#000` sobre `#fff`. El negro puro sobre blanco puro da 21:1 y vibra: a tamaño
  pequeño y leído durante una hora cansa, y a quien tiene astigmatismo le corre
  el texto. `#141414` da 18.4:1, que sobra de largo.

---

## Fase 1 — La tinta

**Archivos:** `app/globals.css`

Un solo bloque de tokens para las dos superficies de escritorio, como ahora. Los
valores están medidos, no elegidos a ojo:

| Token | Claro | Contraste | Oscuro | Contraste |
|---|---|---|---|---|
| `--surface` | `#ffffff` | — | `#141414` | — |
| `--surface-sunk` | `#f4f4f2` | — | `#0d0d0d` | — |
| `--surface-raised` | `#ffffff` | — | `#1c1c1b` | — |
| `--ink` | `#141414` | **18.4:1** | `#f2f2f0` | **16.4:1** |
| `--ink-muted` | `#5c5c5c` | **6.7:1** | `#a0a09c` | **7.0:1** |
| `--line` | `#dcdcda` | 1.4:1 | `#303030` | — |
| `--accent` | `#141414` | — | `#f2f2f0` | — |
| `--accent-soft` | `#f0f0ee` | — | `#262624` | — |
| `--accent-contrast` | `#ffffff` | — | `#141414` | — |

`--ink-muted` sobre `--surface-sunk` (que es donde más aparece, en las cabeceras
de sección) da 6.1:1 en claro y 6.5:1 sobre `--surface-raised` en oscuro. Los dos
pasan AA holgados, que importa porque en esta consola el texto secundario lleva
mucha información real, no decoración.

**Lo que se va:** `--ok`, `--ok-soft`, `--warn`, `--warn-soft`. En su lugar entra
una sola idea, que es la que sustituye al color de estado:

```css
--attention: var(--ink);          /* el peso, no el tono */
--attention-soft: #f0f0ee;        /* la banda bajo un bloque que pide algo */
--rule: 2px;                      /* la regla izquierda de "esto necesita a alguien" */
```

Un bloque normal lleva el borde de un píxel de `.card`. Un bloque que pide una
acción lleva **regla de 2px a la izquierda + título en negrita + icono**. Tres
canales a la vez y ninguno es el tono. Es más ruidoso que el marrón de hoy, que
es exactamente lo que se quiere: hoy un `needs_review` en marrón claro se pierde
en una lista de treinta.

**Riesgo a vigilar:** `--warn` está usado en siete sitios (`chips.tsx`,
`ReportCard`, `MissingPanel`, `Outstanding`, `StatTile`, el aviso de `truncated`
en resumen y en búsqueda, `ReviewActions`). Hay que recorrerlos todos en esta
fase o quedan referencias a una variable que ya no existe y se dibujan
transparentes — que es el fallo más silencioso posible.

---

## Fase 2 — El estado, sin color: el sello

**Archivos:** `components/office/chips.tsx`, `components/office/ReportCard.tsx`,
`components/office/charts/StatTile.tsx`, `app/office/(console)/reportes/[id]/page.tsx`

Tres estados, tres tratamientos en una sola tinta, ordenados por lo que le
importa a quien mira:

- **`needs_review` → chip macizo.** Fondo `--ink`, texto `--accent-contrast`. Es
  lo más oscuro de toda la pantalla, porque es lo único que necesita a una
  persona. Hoy es marrón claro y se pierde; en macizo se encuentra a un metro.
- **`submitted` → chip de contorno.** Regla fina, texto atenuado, redonda. Llegó
  y espera. Neutro a propósito.
- **`approved` → el sello.** Recuadro de contorno de 1.5px con doble regla,
  versalitas con `letter-spacing: 0.14em`, y la palomita. En la lista va recto y
  compacto. En la página del reporte va el sello entero: más grande, girado
  `-4deg`, sobre la cabecera del documento.

El giro es la única licencia de todo el diseño y sólo se la puede permitir el
detalle, donde hay **un** documento. Treinta sellos torcidos en una lista serían
ruido; ahí va la variante recta. Es el consejo de Chanel aplicado: el sello es el
accesorio, y por eso todo lo demás se queda callado.

**`FlagChips`** pierde el marrón y se queda con contorno + el triángulo de aviso,
que ya lleva. El icono ya hacía el trabajo; el color sólo lo acompañaba.

**`Delta`** (el `+4% vs. antes` de cada tile) deja de tener verde y marrón. La
flecha y el signo ya dicen la dirección — el propio comentario del archivo dice
que el color nunca era la única señal, así que quitarlo no cuesta información. Lo
que sí hay que conservar es *si esa dirección es buena*, y eso pasa al peso:

- dirección mala → `--ink`, `font-semibold`
- dirección buena o neutra → `--ink-muted`, peso normal
- plano → atenuado, sin flecha (como ya hace)

---

## Fase 3 — Los gráficos: trama en lugar de tono

**Archivos:** `components/office/charts/*.tsx`, `app/globals.css`

### Las dos series pasan a ser relleno, no color

`--viz-ours` y `--viz-theirs` dejan de ser dos hues y pasan a ser dos rellenos:

- **`ours`** — macizo, `--ink`. Lo nuestro: las horas en obra, la máquina propia,
  el material del patio.
- **`theirs`** — trama diagonal a 45°, líneas de 1.5px cada 5px, en `--ink` sobre
  la superficie. Lo que sale de la empresa: manejar, alquiler, lo comprado.

Un solo `<pattern>` de SVG definido una vez y referenciado desde `StackedColumns`,
`RankedBars` y `SplitBar`. La semántica de hoy (`ours` = lo productivo, `theirs` =
lo que se va) no cambia ni una línea — sólo cambia el canal, así que la frase del
comentario de `globals.css` sigue siendo verdad: después del primer gráfico nadie
vuelve a leer la leyenda.

Dos detalles que dejan de ser opcionales y pasan a ser estructurales:

- **El hueco de 2px** entre segmentos que se tocan. Con color era higiene; con
  trama es lo que impide que el macizo y la trama se lean como una sola mancha.
- **Los cuadros de la leyenda tienen que llevar el relleno de verdad** — uno
  macizo y uno tramado. Una leyenda con dos cuadraditos negros iguales no dice
  nada.

### La rampa del calendario baja de 5 escalones a 4

Ese sí es un uso legítimo del gris, porque las celdas del mapa de calor son
magnitud. Pero cinco escalones de gris no se separan lo suficiente. Medido:

```
5 pasos  →  peor par adyacente ΔE 11.1   [FAIL] por debajo de 15
4 pasos  →  peor par adyacente ΔE 16.9   [PASS]
```

| | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| Claro | `#cfcfcb` | `#9a9a94` | `#63635d` | `#1b1b18` |
| Oscuro | `#3a3a37` | `#6b6b65` | `#9d9d96` | `#e8e8e4` |

En oscuro la rampa corre al revés, como ya hace hoy: sobre fondo oscuro el que
retrocede es el más apagado, así que "más" es más claro. Medido igual: ΔE 16.8,
pasa.

"Sin reporte" **sigue dibujándose hueco** y no es un escalón de la rampa. Esa
decisión ya estaba tomada y es correcta: una ausencia no es una cantidad
pequeña.

Los dos escalones más claros quedan por debajo de 3:1 contra la superficie, lo
que el validador marca como aviso y obliga a dar una salida. Ya está dada: cada
gráfico lleva su tabla debajo con todos los valores. Conviene dejarlo escrito en
el código para que nadie quite esas tablas pensando que sobran — son lo que hace
legal la rampa.

### El tooltip

`.viz-tip` usa `display: none`, que no se puede animar. Pasa a
`opacity` + `visibility` con transición de 125ms `ease-out` y
`transform-origin` hacia la marca que lo dispara. Es un cambio pequeño y es el
tipo de detalle que nadie nota de uno en uno.

---

## Fase 4 — La tipografía

**Archivos:** `app/layout.tsx`, `app/globals.css`

En un diseño monocromo la tipografía carga toda la personalidad, porque no queda
color donde apoyarse. Entra una pareja real por `next/font/google`, que se
auto-hospeda y no produce layout shift:

- **Archivo** para la interfaz — una gótica americana hecha para impresión y
  señalética. Encaja con el mundo del ticket y no es el Inter que trae todo el
  mundo por defecto.
- **IBM Plex Mono** para las cifras — horas, dinero, números de obra, fechas,
  IDs, el `filedAtTime` de cada tarjeta. Le da voz propia al dato y alinea las
  columnas de verdad.

Se aplican **sólo bajo `[data-surface="office"]` y `[data-surface="home"]`**. El
teléfono se queda con la pila del sistema y no descarga ni un byte de fuente en
una conexión de obra.

Escala: 12 / 13 / 15 / 17 / 22 / 28 / 40. Todo sitio que hoy lleva
`tabular-nums` pasa a la mono. Las reglas de `input/textarea/select/button` de
`globals.css` ya heredan la familia y ya fuerzan `max(16px, 1rem)`, así que los
controles de formulario no necesitan nada.

---

## Fase 5 — Dónde estoy y cómo vuelvo

Aquí empieza la otra mitad del trabajo. Estos son problemas reales que ya existen
hoy, con color o sin él.

**Archivos:** `components/office/ConsoleNav.tsx`, `app/office/(console)/layout.tsx`,
y las cuatro páginas profundas

1. **Ninguna pestaña se enciende en las pantallas profundas.** `ConsoleNav`
   compara `pathname === link.href` exacto, así que en `/office/resumen/avanzado`
   no hay pestaña activa: el usuario está dentro del resumen y la navegación no
   lo dice. Para el detalle de un reporte la decisión de hoy es defendible (se
   llega desde los dos lados), pero para `/resumen/avanzado` es sencillamente un
   fallo. Pasa a coincidencia por prefijo en `/office/resumen` y
   `/office/reportes`, y exacta sólo en `/office`.

2. **No hay camino de vuelta.** Cuatro rutas cuelgan a dos niveles
   (`resumen/avanzado`, `reportes/[id]`, `reportes/clave/[clientId]`,
   `personas/[personId]`) y ninguna tiene migas. Entran migas en esas cuatro.

3. **No hay enlace de salto al contenido.** La consola se maneja mucho con
   teclado — lo dice el propio `globals.css` al justificar los focus rings — y
   sin embargo hay que tabular la cabecera entera en cada página. Entra un skip
   link y un `id` en `<main>`.

4. **El atajo `/` sólo existe dentro de la búsqueda.** Hoy vive en
   `SearchFilters`, así que en el tablero del día no hace nada. Sube al layout:
   desde cualquier sitio de la consola, `/` lleva a la búsqueda con el campo de
   cliente enfocado. Sigue ignorándose mientras se escribe en un campo, como
   ahora.

---

## Fase 6 — Que los números se puedan usar

**Archivos:** `app/office/(console)/resumen/page.tsx`, `lib/officeSearch.ts`,
`convex/office.ts`

El panel "Pendiente" del resumen tiene cinco cifras y **cuatro de ellas no se
pueden clicar** (`href: null`). El comentario del propio archivo explica por qué
eso está mal: *"un número que un PM no puede clicar es un número que tiene que ir
a reconstruir a mano, que es como un dashboard deja de usarse."* La consola sabe
que hay 12 reportes sin horas y no ofrece manera de verlos.

Para arreglarlo hacen falta cuatro filtros nuevos en la búsqueda —
`missingHours`, `longDays`, `noCrew`, `unattributed` — en `lib/officeSearch.ts`
y en la query `office.search` de Convex. **Es trabajo de backend, no de
diseño**, y por eso va en su propia fase: se puede soltar sin tocar nada de lo
anterior.

Con eso, las cinco cifras se vuelven enlaces a la búsqueda que las produjo, con
las fechas ya puestas.

---

## Fase 7 — Aprobar sin salir de la lista

**Archivos:** `components/office/ReportCard.tsx`, `components/office/ReviewActions.tsx`,
`app/office/(console)/page.tsx`

Hoy aprobar treinta reportes son treinta cargas de página: abrir, aprobar,
volver, repetir. Pero estar de acuerdo con un reporte es el caso común, y el
propio `ReviewActions` ya dice que debería costar nada.

Entra el botón de aprobar en la tarjeta del tablero del día, contra el mismo
`POST /api/office/status` que ya existe, con **deshacer** en un aviso breve en
vez de un diálogo de confirmación. Aprobar es reversible — `reopen` ya existe —
así que pedir confirmación sería cobrar dos clics por la acción más frecuente.

Y filtros rápidos en el tablero del día (todos / sin revisar / aprobados) que
escriben en la URL, para poder mandar por enlace "lo que falta por revisar hoy".

**Esta fase es la más opcional de todas.** Cambia el flujo de trabajo, no el
aspecto, y si hay dudas sobre si el PM quiere aprobar sin abrir el reporte, se
queda fuera sin consecuencias para el resto.

---

## Fase 8 — Velocidad percibida

**Archivos:** `app/office/(console)/**/loading.tsx` (nuevos),
`components/office/SearchFilters.tsx`

Todas las páginas de la consola son `force-dynamic` con `await` a Convex y
**ninguna tiene `loading.tsx`**. En la práctica: se pulsa una pestaña y no pasa
nada visible hasta que el servidor contesta. En una consola de datos eso es lo
que hace que se sienta lenta aunque no lo sea.

- Un `loading.tsx` por ruta, con esqueletos que reserven el mismo espacio que el
  contenido real, para que no haya salto al llegar los datos.
- El botón de buscar pasa a `useTransition` y muestra estado ocupado.

**Lo que deliberadamente no se hace: entradas escalonadas en las listas.** Un PM
abre esta pantalla veinte veces al día; una cascada de tarjetas es encantadora la
primera vez y un peaje la vigésima. Las tarjetas aparecen y ya.

---

## Fase 9 — El repaso

1. Volver a pasar el validador sobre los tokens finales, claro y oscuro.
2. **Impresión.** Estos reportes se imprimen. En blanco y negro sale casi gratis:
   una hoja `@media print` que quite la cabecera pegajosa y la navegación.
3. **`forced-colors`.** Las tramas SVG tienen que dibujarse con `currentColor`
   para sobrevivir al modo de alto contraste de Windows.
4. Comprobar 375 / 768 / 1024 / 1440 en el navegador, en claro y en oscuro.
5. Verificar que ningún estado depende de una sola señal — que en este diseño es
   casi automático, porque ya no hay tono del que depender.

---

## 10. Lo que apareció al construirlo

Tres fallos que ya estaban en el código y que este trabajo destapó. Ninguno
estaba en el plan porque ninguno se ve leyendo el diseño — se ven al ejecutarlo.

1. **`.viz-mark` anulaba a Tailwind.** Declaraba `display: block` y, por ir
   después del `@import "tailwindcss"`, le ganaba a `.flex` con la misma
   especificidad. El único gráfico que pedía flex es `SplitBar`, así que sus
   porcentajes dentro de la barra llevaban desde siempre alineados a la
   izquierda en vez de centrados. La regla ahora sólo declara `position`.

2. **La consola nunca declaró `theme-color`.** `/inicio` sí lo hacía y explicaba
   por qué en un comentario: sin ello el cromo del navegador se queda claro sobre
   una pantalla que se fue a oscuro, y parece que la página no cargó su fondo.
   `/office` tenía el mismo problema y ninguna línea al respecto.

3. **`jose` estaba en `package.json` pero no instalado**, así que dos ficheros de
   test fallaban y la app no arrancaba. Instalado; los 25 ficheros pasan.

Y una decisión que el plan daba por hecha y resultó no serlo: los cuatro filtros
nuevos de la fase 6 son **uno solo**, `issue`, con cuatro valores. Son la misma
pregunta ("¿qué tiene de malo?") y un PM elige exactamente una a la vez. Además
va como `<select>` visible en el formulario, no sólo en la URL: este formulario
reconstruye la búsqueda desde sus propios campos, así que un filtro que no puede
mostrar es un filtro que la siguiente búsqueda borra en silencio.

---

## Orden y qué se puede soltar

```
1 tinta  →  2 sello  →  3 gráficos  →  4 tipografía     ← el aspecto
                              ↓
5 orientación  →  6 números  →  7 aprobar  →  8 velocidad  ← el uso
                              ↓
                          9 repaso
```

Las fases 1 a 3 van juntas o no van: durante el cambio de tokens la consola queda
a medio camino, con chips que buscan un `--warn` que ya no existe. Cerrada la 3,
todo lo demás se puede parar en cualquier punto y lo entregado sigue en pie.

La fase 6 es backend. La fase 7 es la única que cambia cómo trabaja la gente y es
la primera candidata a caerse si hay que recortar.
