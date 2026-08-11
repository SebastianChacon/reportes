# Plan — El resumen visual de la oficina

Qué le falta a la consola para que un project manager pueda **decidir** con ella, y
no solo leer reportes uno por uno.

Hoy `/office` contesta *qué pasó hoy* y `/office/reportes` contesta *dónde está
aquel reporte*. Las dos son preguntas de un día o de un reporte. Ninguna contesta
la pregunta que un PM hace el viernes: **¿en qué se nos fue el mes?**

Este plan agrega esa tercera pantalla, y antes agrega los datos que la hacen
demostrable.

---

## 0. La pregunta que hay que contestar primero

Un dashboard bonito sobre datos que nadie mira es la forma más cara de no
resolver nada. Así que la primera decisión no es qué gráfico, sino **qué preguntas
merecen un gráfico** — y sólo se aceptan las que hoy no se pueden contestar de
otra forma.

De todo lo que el formulario ya guarda, éstas son las cinco que califican:

| Pregunta | Por qué el papel no la contesta | Dato que la sostiene |
|---|---|---|
| ¿Cuánto de la hora pagada se va manejando? | El papel apunta cuatro horas y nadie las resta nunca | `totals.onSiteHours` vs `totals.travelHours` |
| ¿Qué nos está costando la maquinaria rentada? | Cada renta está en una hoja distinta, en una carpeta distinta | `equipment[].owner = RENTAL` + `hours` |
| ¿Cuánto salió de la yarda y cuánto se compró? | Nadie suma 200 hojas para saberlo | `materials[].source = BTN \| OTHER` + `cost` |
| ¿Qué cliente se está comiendo las horas? | Requiere sumar a mano por cliente | `totals.crewHours` agrupado por `clientName` |
| ¿Quién entrega y quién no, de verdad? | Un buzón enseña lo que llegó, nunca lo que faltó | huecos en `reports.by_date` por capataz |

Las cinco tienen la misma forma: **el dato ya existe, escrito por el capataz, y
nadie lo puede leer en conjunto**. Eso es exactamente lo que un gráfico sirve para
arreglar, y es la única razón honesta para construirlo.

Todo lo demás — velocidad de aprobación, márgenes, productividad por persona —
necesita datos que este sistema **no tiene** (tarifas, presupuestos, horarios
planeados). No se inventan. Se dice en la pantalla lo que se puede decir y nada más.

---

## 1. Las dos fases

**Fase 1 — El resumen.** Una pantalla, `/office/resumen`. Cinco números arriba,
cuatro gráficos abajo, un selector de periodo. Cero configuración: se abre y ya
dice algo. Es lo que se le enseña a alguien en treinta segundos.

**Fase 2 — Opciones avanzadas.** `/office/resumen/avanzado`. Rango libre, agrupar
por la dimensión que quieras, tabla pivote, exportar a CSV, la nómina por persona
y el panel de calidad de datos. Es lo que usa quien ya sabe qué está buscando.

La separación no es cosmética. Un PM que abre esto por primera vez y ve doce
controles cierra la pestaña; el mismo PM tres semanas después necesita los doce
controles y se enoja si no están. **Son dos usuarios, y resulta que son la misma
persona en dos momentos distintos.** Por eso una pantalla y un link, no una
pantalla con un acordeón de "más opciones".

Antes de las dos: **datos**. Sin más de un mes de reportes reales adentro, los dos
gráficos más importantes son un rectángulo vacío y una promesa.

---

## 2. Fase 0 — Los datos de demostración

### Qué se genera

Cinco cuadrillas, de lunes a sábado, **doce semanas hasta hoy** — anclado al
reloj, no a fechas fijas, así que siempre es "los últimos tres meses" cuando se
corra. Son ~72 días de trabajo × 5 cuadrillas = **292 reportes** y ~1.200 filas
de `crewDays`.

**Doce semanas y no seis**, aunque la pantalla abra en seis: cada delta del
resumen se mide contra el periodo anterior del mismo largo, y con solo seis
semanas de datos las cinco tarjetas dirían para siempre "no hay periodo anterior
con qué comparar". Una demo donde la columna más interesante está permanentemente
en blanco es la demo de una función rota.

| Cuadrilla | Capataz | Tipo |
|---|---|---|
| 1 | Aguilar, Miguel | Construcción |
| 2 | Santander, Carlos | Construcción |
| 3 | Tix Tix, Domingo | Construcción |
| 4 | Guadron, Michael | Plantación |
| 5 | Patino, Jhelsson | Plantación |

Los tres primeros ya tienen cuenta en el deployment. Los dos últimos los crea el
seed, porque **sin cuenta un capataz no puede aparecer en "Faltan por entregar"**
ni en el filtro de "enviado por", y ahí se cae media demostración.

### Qué hace que sirvan

Datos perfectos no demuestran nada. Un mes donde todos entregaron todos los días,
con las horas completas y sin una sola renta, hace que la consola parezca
decorativa. Así que el generador mete, a propósito:

- **~8 % de días sin reporte** por cuadrilla — vacaciones, lluvia, día libre. Son
  los huecos que el mapa de calor existe para enseñar.
- **~10 % de reportes con la hora de alguien en blanco** → bandera `warnNoHours` →
  entran solos a `needs_review`. La cola de revisión tiene contenido desde el
  primer minuto.
- **Un par de días de más de 16 horas** → `warnLongDay`. La bandera roja existe y
  se ve.
- **Trabajos que duran días.** Una cuadrilla se queda en el mismo cliente una o dos
  semanas, como pasa de verdad. Sin esto, "clientes por horas" son 40 barras
  iguales de una hora cada una y el gráfico no dice nada.
- **Rentas concentradas.** La excavadora grande se renta tres días seguidos, no una
  hora suelta cada martes. Así se ve el patrón que cuesta dinero.
- **Reportes viejos ya aprobados.** Todo lo anterior a dos semanas queda `approved`
  con revisor, para que el filtro de estado tenga los tres estados vivos.
- **Hoy incompleto.** El último día sólo entregan 3 de las 5 cuadrillas, así que
  el tablero del día abre enseñando exactamente para lo que fue hecho.
- **Nombres escritos a mano.** Uno de cada veinte reportes trae un nombre que no
  está en la lista — "Benjamin Mozza", "Luis (temporal)" — guardado con
  `personId: null`, que es el caso que la tabla de nómina tiene que saber
  explicar.

### Dónde vive y cómo se deshace

```
lib/demoData.ts     genera JobReport[] — puro, sin Convex, determinista
convex/seed.ts      los mete por el mismo camino que usa el teléfono
```

Tres decisiones sostienen esto:

1. **Pasa por `lib/submission.ts`.** El seed no escribe filas a mano: arma un
   `JobReport` y lo pasa por `buildSubmission()`, igual que el teléfono. Los
   `totals`, las `flags` y el estado inicial los calcula el mismo código de
   producción. Un dato de demo que se construyera por otra ruta podría verse bien
   y ser imposible el día que llegue uno real.

2. **`clientId` empieza con `demo:`.** El id es `demo:<fecha>:<cuadrilla>`, así que
   `seed:clear` borra exactamente lo que el seed creó y **no toca los 5 reportes
   de prueba que ya están en la base**. Además hace la siembra idempotente: correr
   `seed:demo` dos veces no duplica nada, porque `reports.submit` ya es idempotente
   sobre esa llave.

3. **PRNG determinista.** Un solo generador, recorrido en un orden fijo, así que
   correr el seed en otra máquina produce los mismos reportes hasta el minuto.
   Una demo que se ve distinta cada vez que se prepara no se puede ensayar.

Además crea **las cuentas para poder enseñarlo**: los dos capataces que faltaban
(PIN `2468`) y una cuenta de consola, `demo@backtonature.test`. Las tres llevan
`demo: true` en la tabla `users` — un campo nuevo, opcional, que existe para una
sola cosa: que "borrar la demo" pueda distinguir una cuenta que creó el seed de
la cuenta de una persona real. Sin esa marca, borrar por nombre acabaría el día
que un Michael Guadron de verdad se enrole con el mismo id de la lista.

```bash
npx convex run seed:demo
```

```bash
npx convex run seed:clear
```

Se siembra **por semanas**, no de un golpe: 180 reportes más 720 filas de cuadrilla
en una sola mutación pelea contra los límites de transacción de Convex. La acción
`seed:demo` llama siete veces a una mutación interna, una por semana.

---

## 3. Fase 1 — `/office/resumen`

### La forma antes que el color

Cada bloque de la pantalla se eligió por **el trabajo que el lector tiene que
hacer**, no por variedad. El orden de la página es el orden en que se hacen las
preguntas.

| # | Bloque | Trabajo del lector | Forma | Por qué no otra |
|---|---|---|---|---|
| — | Fila de KPIs | leer cinco magnitudes de un vistazo | **5 stat tiles** con delta contra el periodo anterior | un gráfico de barras de cinco cosas sin relación no es un gráfico, es una tabla mal dibujada |
| A | Horas por semana | tendencia **y** composición a la vez | **columnas apiladas** (en sitio / traslado) | una línea doble obligaría a dos ejes o a perder el total |
| B | Propio vs. de fuera | parte-sobre-el-todo, dos veces | **dos barras apiladas horizontales** (maquinaria horas, materiales costo) | un pastel de dos rebanadas es una barra que ocupa cuatro veces más |
| B2 | Lo que rentamos | leer una lista sobre la que se puede actuar | **barras horizontales**, solo lo rentado | por horas totales, la orilladora de la yarda entierra a la excavadora que costó dinero; se lista aparte o no se ve |
| C | Clientes por horas | comparar magnitud entre categorías con nombre largo | **barras horizontales**, top 8, una sola serie | vertical corta los nombres; el ranking se lee mejor de arriba a abajo |
| D | El mes, día por día | encontrar **huecos** en una malla | **mapa de calor** capataz × día | ningún otro gráfico enseña una ausencia; una línea la interpola y una barra la omite |

Y encima de todo, una tira de **cinco tarjetas** con su delta contra el periodo
anterior del mismo largo: horas de mano de obra, % del día manejando, horas de
máquina rentada, gasto en materiales, reportes recibidos. El delta es lo que las
hace accionables — "4.407 horas" es un dato con el que nadie puede hacer nada;
"4.407 horas, 1% más que las seis semanas anteriores" es una pregunta.

Una unidad recorre todo el archivo y vale la pena decirla en voz alta, porque
equivocarla convertiría el gráfico principal en una mentira: **las horas de
cuadrilla son horas-persona** (cuatro hombres por ocho horas son 32, y es lo que
paga la nómina), mientras que **las horas de jornada son de una cuadrilla**, en
sitio más traslado, contadas una vez sin importar cuántos iban en la camioneta.
Nunca se suman y nunca comparten eje. El reparto entre sitio y traslado se grafica
en horas de jornada porque es la unidad en que se midió; repartirlo entre la
cuadrilla sería una estimación disfrazada de medición.

El mapa de calor (D) es el que justifica la pantalla. Cinco filas, 37 columnas: los
días que sí se entregaron son celdas con intensidad según las horas, y **los que
no, son huecos**. Eso es literalmente imposible de ver en una bandeja de correo.

### El color

Se toma la paleta categórica de referencia y se **valida contra las superficies
reales de este proyecto** (`--surface-raised`: `#ffffff` claro, `#1d1c16` oscuro),
no contra las superficies del ejemplo:

```
claro  #2a78d6 #eb6834 #1baf7a  → todo pasa (aviso de contraste en el verde agua)
oscuro #3987e5 #d95926 #199e70  → todo pasa
```

Sobre esos tres cupos se impone **una regla semántica que vale en toda la
pantalla**, y ésta es la decisión de diseño que hace que el resumen se lea como
una sola cosa en vez de cuatro gráficos juntos:

> **Azul = lo nuestro y lo productivo. Naranja = lo de fuera y lo que se fuga.**

- Gráfico A: azul = horas en sitio · naranja = horas manejando
- Gráfico B: azul = maquinaria propia / material de la yarda · naranja = rentada / comprado
- Gráfico D: rampa azul de una sola tinta, porque ahí el color es magnitud, no identidad

Así, después del primer gráfico, el lector ya sabe qué significa el naranja sin
volver a mirar la leyenda. Y como nunca hay más de dos series por gráfico, el
problema de los ocho colores no existe aquí.

El verde agua queda de reserva para el tercer cupo si alguna vista de la fase 2 lo
necesita. Los colores de estado (`--ok`, `--warn`) ya existen en `globals.css` y
**no se reutilizan como serie**: un color de estado significa un estado.

### Las reglas de marca que se respetan

- Barras ≤ 24 px, punta redondeada de 4 px, base cuadrada.
- **Separación de 2 px del color de la superficie** entre segmentos apilados y entre
  barras vecinas — el hueco separa, nunca un borde dibujado.
- Cuadrícula y ejes: línea de 1 px sólida, un paso fuera de la superficie. Nunca
  punteada.
- **Leyenda siempre que haya dos series**, y etiqueta directa selectiva — el
  porcentaje de traslado en la columna, el valor en la punta de la barra. Nunca un
  número en cada punto.
- **El texto nunca lleva el color de la serie.** La identidad la carga el cuadrito
  de color al lado, no la tinta de la letra.
- Un eje. Nunca dos escalas en el mismo dibujo.

### Cómo se construyen

**HTML y CSS. Sin librería de gráficos y sin JavaScript de cliente.**

Los cuatro gráficos son barras, barras apiladas y una malla — ninguno necesita una
curva ni una escala continua dibujada. Todo eso es `flex`, `grid` y un `%` de
altura. Eso significa:

- **Cero dependencias nuevas.** Recharts pesa ~500 KB para dibujar un rectángulo.
- **Siguen siendo Server Components**, como todo lo demás de la consola. No hay
  hidratación, no hay bundle, no hay parpadeo.
- **El modo oscuro sale gratis**, porque todo está escrito contra las variables CSS
  que ya cambian solas en `[data-surface="office"]`.
- **Responsive sin `ResizeObserver`.** Un `%` ya es responsive.

La capa de hover también es CSS: cada marca es un elemento con `tabindex="0"` y el
tooltip se enseña con `:hover, :focus-visible`. **El teclado ve lo mismo que el
ratón**, sin una línea de JS.

Y cada gráfico trae debajo un `<details>` con **su tabla**. No es un extra de
accesibilidad marcado por cumplir: es lo que hace que el aviso de contraste del
verde agua sea aceptable, y es lo que un PM copia y pega a un correo.

### Dónde vive

```
lib/analytics.ts                    las reglas de agregación — puras, con tests
convex/analytics.ts                 una query indexada, envoltura fina
components/office/charts/           StatTile · StackedColumns · RankedBars ·
                                    SplitBar · Heatmap · Legend · TableView
app/office/(console)/resumen/       la pantalla
```

`lib/analytics.ts` no recalcula **ningún** total. Suma los `totals` que el teléfono
ya escribió, por la misma razón que `lib/summaries.ts`: un número aquí que
contradijera el PDF que el capataz ya mandó no valdría nada.

El periodo vive en la URL (`?from=&to=&p=`), como los filtros de búsqueda, por la
misma razón: **un resumen es un link que se manda por WhatsApp** y llega enseñando
lo mismo.

### La puerta

No hace falta una comprobación de rol nueva. `isOfficeRole()` ya deja pasar sólo a
`manager` y `admin`, y el layout de `(console)` aplica la puerta a todo lo que viva
dentro — así que una pantalla nueva **está protegida por existir**. Un capataz no
puede ver el gasto de la empresa porque no puede entrar a la consola, punto.

---

## 4. Fase 2 — `/office/resumen/avanzado`

Lo mismo, pero manejado por quien ya sabe qué busca.

| Pieza | Qué hace |
|---|---|
| **Rango libre** | dos fechas, sin presets. Un trimestre, una semana, un día. |
| **Agrupar por** | semana · día · cliente · capataz. La misma agregación, otro eje. |
| **Tabla pivote** | filas = la dimensión elegida; diez columnas: reportes, horas de mano de obra, en sitio, manejando, % manejando, materiales, de la yarda, comprado, máquina propia, rentada. Cada encabezado es un link que ordena por esa columna, y el orden va en la URL. |
| **Exportar CSV** | un route handler que devuelve exactamente las filas de la tabla, en el mismo orden, **sin símbolos** — una hoja de cálculo que tiene que limpiar "$1.234,56" antes de poder sumar una columna es una hoja que alguien abandona. |
| **Nómina por persona** | horas por persona en el rango, con los días sin horas contados aparte. Es lo que se necesita **antes** de pagar. |
| **Calidad de datos** | links a los reportes por estado, con las fechas ya puestas. Un número que no se puede clicar es un número que alguien tiene que reconstruir a mano, y así es como una pantalla deja de abrirse. |

Todo lee de la misma query y de las mismas funciones puras de la fase 1. La fase 2
no es un segundo sistema: es la misma agregación con el eje suelto.

Dos decisiones que se ven pequeñas y no lo son:

- **Agrupar por persona no está.** Todo lo demás se mide por reporte — un reporte
  tiene cliente, capataz, fecha — y una persona no tiene un costo de material ni
  un tiempo de traslado propio. Repartir la jornada de una cuadrilla entre cinco
  para darle a cada uno su parte del diésel sería una estimación presentada como
  medición. Las personas tienen su propia tabla, construida desde `crewDays`,
  donde la única medida es la que de verdad se escribió: horas.
- **La puerta del CSV se revisa otra vez dentro de la ruta.** Un route handler
  **no** está dentro del layout de `(console)` — los layouts no corren para
  rutas — así que "la página se te renderizó" no es razón para entregarle este
  archivo a quien lo pida. Son todos los clientes y todo el gasto de la empresa
  en una descarga.

---

## 5. Lo que este plan deliberadamente no hace

- **No inventa dinero.** No hay tarifa por hora en el sistema, así que no hay
  "costo de mano de obra". Se enseñan horas. El día que exista una tarifa, se
  multiplica.
- **No mide productividad de personas.** Los datos alcanzarían para hacerlo y el
  resultado sería basura: un albañil en una escalera y un peón cargando piedra
  tienen la misma hora en la hoja. Un ranking de personas con estos datos sería
  una injusticia con gráfico.
- **No cachea nada.** Igual que el tablero del día: un resumen de hace un minuto
  es la respuesta a otra pregunta.
- **No agrega un segundo backend de analítica.** Las tablas que hay, con los
  índices que hay, contestan las cinco preguntas. El día que no alcancen, la
  respuesta es una tabla de agregados escrita al mismo tiempo que el reporte — no
  un almacén de datos.

---

## 6. Orden de trabajo

1. ✅ `lib/demoData.ts` — el generador determinista
2. ✅ `convex/seed.ts` — sembrar y deshacer
3. ✅ `lib/analytics.ts` + tests — las reglas de agregación
4. ✅ `convex/analytics.ts` — las queries (`overview`, `breakdown`, `people`)
5. ✅ `components/office/charts/` — las primitivas
6. ✅ `app/office/(console)/resumen/` — la pantalla + nav + textos
7. ✅ `app/office/(console)/resumen/avanzado/` + `app/api/office/export/` — la fase 2
8. ✅ `npm test`, `npm run build`, y revisarlo en el navegador

---

## 7. Cómo se enseña

```bash
npx convex run seed:demo
```

Entrar a `/office/entrar` con **`demo@backtonature.test`** y la contraseña que
imprime el seed, y abrir la pestaña **Resumen**. El recorrido que cuenta la
historia completa, en orden:

1. **El día** — hoy sólo entregaron 3 de 5 cuadrillas, así que "Faltan por
   entregar" tiene nombres. Es el problema.
2. **Resumen → las cinco tarjetas** — el 17% del día pagado se va manejando.
   Nadie sabía eso, y no lo sabía nadie porque estaba repartido en 292 hojas.
3. **El mapa de calor** — los huecos. Un buzón no puede enseñar una ausencia.
4. **Lo que rentamos** — cada fila es una factura.
5. **Opciones avanzadas → agrupar por cliente → ordenar por "rentada" →
   descargar CSV.** Ahí se acaba el correo de "¿me pasas el resumen del mes?".

Para dejar la base como estaba:

```bash
npx convex run seed:clear
```
