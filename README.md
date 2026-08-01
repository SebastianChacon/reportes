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
  page.tsx                    punto de entrada
  api/send-report/route.ts    email + PDF adjunto (Resend)
components/
  JobReportApp.tsx            asistente, idioma, autoguardado, envío
  DescriptionField.tsx        traductor ES⇄EN con caché
  SearchPicker.tsx            buscar-y-agregar con opción "otro"
  SignaturePad.tsx            firma con el dedo (canvas)
  steps/                      los 6 pasos
lib/
  catalog.ts                  personal, equipo, materiales, camiones
  translate.ts                glosario offline + interfaz Translator
  pdf.ts                      PDF de una página
  calc.ts                     horas, costos, avisos, campos obligatorios
  i18n.ts                     textos de la interfaz ES/EN
  storage.ts                  borrador, idioma, última cuadrilla, cola
```

---

## Notas

- Objetivos táctiles de 44px, teclados nativos correctos (`date`, `time`, `inputmode="decimal"`), tipografía de 16px mínimo para que iOS no haga zoom al enfocar.
- Se adapta al modo claro y oscuro del teléfono.
- `npm audit` reporta 3 avisos *high* heredados de dependencias internas de Next (`postcss`, `sharp`). Ya estamos en la última versión de Next; no hay corrección disponible que no sea bajar de versión.
# reportes
