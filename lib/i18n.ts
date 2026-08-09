import type { Lang } from "./types";

export const UI = {
  appTitle: { en: "Job Report", es: "Reporte de Trabajo" },
  company: { en: "Back to Nature", es: "Back to Nature" },
  subtitle: {
    en: "Construction · Maintenance · Planting · Design",
    es: "Construcción · Mantenimiento · Plantación · Diseño",
  },

  // Navigation
  next: { en: "Next", es: "Siguiente" },
  back: { en: "Back", es: "Atrás" },
  step: { en: "Step", es: "Paso" },
  of: { en: "of", es: "de" },
  optional: { en: "optional", es: "opcional" },
  skip: { en: "Skip this step", es: "Saltar este paso" },

  // Steps
  stepJob: { en: "Job", es: "Trabajo" },
  stepTimes: { en: "Times", es: "Horarios" },
  stepCrew: { en: "Crew", es: "Personal" },
  stepWork: { en: "Work Done", es: "Trabajo hecho" },
  stepResources: { en: "Materials", es: "Materiales" },
  stepReview: { en: "Review", es: "Revisar" },

  // Step 1 — job
  date: { en: "Date", es: "Fecha" },
  dayOfWeek: { en: "Day", es: "Día" },
  clientName: { en: "Client name", es: "Nombre del cliente" },
  clientNamePlaceholder: { en: "e.g. Salazar", es: "ej. Salazar" },
  jobNumbers: { en: "Job number(s)", es: "Número(s) de trabajo" },
  jobNumberPlaceholder: { en: "e.g. 21550", es: "ej. 21550" },
  truckNumbers: { en: "Truck number(s)", es: "Número(s) de camión" },
  truckNumberPlaceholder: { en: "e.g. 28", es: "ej. 28" },
  add: { en: "Add", es: "Agregar" },
  remove: { en: "Remove", es: "Quitar" },
  useYesterdayJob: { en: "Same job info as last report", es: "Mismos datos que el último reporte" },

  // Step 2 — times
  startYard: { en: "Left the yard", es: "Salida del patio" },
  startJob: { en: "Arrived at job", es: "Llegada al trabajo" },
  endJob: { en: "Left the job", es: "Salida del trabajo" },
  endYard: { en: "Back at the yard", es: "Regreso al patio" },
  totalHours: { en: "Total hours", es: "Horas totales" },
  onSiteHours: { en: "Hours on site", es: "Horas en el sitio" },
  travelHours: { en: "Travel", es: "Traslado" },
  now: { en: "Now", es: "Ahora" },
  lunch: { en: "Lunch", es: "Almuerzo" },
  lunchHint: {
    en: "Taken out of the day. Set it to 0 if the crew did not stop.",
    es: "Se descuenta del día. Ponlo en 0 si la cuadrilla no paró.",
  },
  minutesShort: { en: "min", es: "min" },
  timesEmpty: {
    en: "Fill in the four times and the hours are worked out for you.",
    es: "Llena los cuatro horarios y las horas se calculan solas.",
  },
  timesFixFirst: {
    en: "Fix the times marked in red to continue",
    es: "Corrige los horarios marcados en rojo para continuar",
  },

  // Times that contradict each other — {prev} is the checkpoint before them.
  errNotBefore: {
    en: "Cannot be earlier than “{prev}”",
    es: "No puede ser antes de «{prev}»",
  },

  // Step 3 — crew
  crewSearch: { en: "Search for a person…", es: "Buscar una persona…" },
  crewAdded: { en: "On this job", es: "En este trabajo" },
  crewNoneYet: { en: "No one added yet", es: "Nadie agregado todavía" },
  hours: { en: "Hours", es: "Horas" },
  hrs: { en: "hrs", es: "hrs" },
  applyToAll: { en: "Apply to everyone", es: "Aplicar a todos" },
  applyHoursHint: {
    en: "Set the same hours for the whole crew",
    es: "Poner las mismas horas para toda la cuadrilla",
  },
  addPerson: { en: "Add someone not on the list", es: "Agregar a alguien que no está en la lista" },
  personName: { en: "Name", es: "Nombre" },
  noResults: { en: "No results", es: "Sin resultados" },
  addAsNew: { en: "Add", es: "Agregar" },
  crewTotal: { en: "Total crew hours", es: "Horas totales de la cuadrilla" },
  hoursFromTimes: {
    en: "{n} hrs from today's times — change it for anyone who worked different hours",
    es: "{n} hrs según los horarios de hoy — cámbialo para quien trabajó distinto",
  },
  hoursNoTimes: {
    en: "Fill in the times first and these come pre-filled",
    es: "Llena primero los horarios y estas horas se ponen solas",
  },
  useYesterday: { en: "Same crew as last report", es: "Misma cuadrilla del último reporte" },

  // Step 4 — description
  description: { en: "What did you do today?", es: "¿Qué hicieron hoy?" },
  descriptionPlaceholder: {
    en: "Describe the work performed on this job today…",
    es: "Describe el trabajo realizado hoy en este trabajo…",
  },
  showInEnglish: { en: "Show in English", es: "Ver en inglés" },
  showInSpanish: { en: "Show in Spanish", es: "Ver en español" },
  showOriginal: { en: "Back to original", es: "Volver al original" },
  translating: { en: "Translating…", es: "Traduciendo…" },
  translatedLabel: { en: "Translation — the original is saved", es: "Traducción — el original está guardado" },
  unknownTermsLabel: {
    en: "Not in the glossary, left as written:",
    es: "No están en el glosario, se dejaron igual:",
  },
  bothSent: {
    en: "Both versions are sent with the report.",
    es: "Las dos versiones se envían con el reporte.",
  },
  photos: { en: "Photos", es: "Fotos" },
  addPhotos: { en: "Add photos", es: "Agregar fotos" },
  photosHint: {
    en: "Before / after shots help the office a lot",
    es: "Fotos de antes / después ayudan mucho a la oficina",
  },
  processingPhotos: { en: "Processing…", es: "Procesando…" },
  takePhoto: { en: "Take photo", es: "Tomar foto" },
  chooseFromGallery: { en: "Gallery", es: "Galería" },
  photosMax: { en: "Maximum {n} photos", es: "Máximo {n} fotos" },
  photosFailed: {
    en: "{n} photo(s) could not be read and were skipped.",
    es: "No se pudieron leer {n} foto(s) y se omitieron.",
  },

  // Step 5 — resources
  equipment: { en: "Equipment", es: "Equipo" },
  materials: { en: "Materials", es: "Materiales" },
  plants: { en: "Plant material", es: "Material vegetal" },
  subcontractors: { en: "Subcontractors", es: "Subcontratistas" },
  trucks: { en: "Trucks", es: "Camiones" },
  logistics: { en: "Mileage & disposals", es: "Millaje y desechos" },
  equipmentSearch: { en: "Search equipment…", es: "Buscar equipo…" },
  materialsSearch: { en: "Search materials…", es: "Buscar materiales…" },
  owned: { en: "BTN", es: "BTN" },
  rental: { en: "Rental", es: "Rentado" },
  other: { en: "Other", es: "Otro" },
  ownerHint: {
    en: "BTN = owned by Back to Nature",
    es: "BTN = propiedad de Back to Nature",
  },
  qty: { en: "Qty", es: "Cant." },
  cost: { en: "Cost", es: "Costo" },
  size: { en: "Size", es: "Tamaño" },
  vendor: { en: "Vendor", es: "Proveedor" },
  plantsHint: {
    en: "Only what was INSTALLED today — not what was delivered.",
    es: "Solo lo que se INSTALÓ hoy — no lo que fue entregado.",
  },
  plantName: { en: "Plant name", es: "Nombre de la planta" },
  addPlant: { en: "Add plant", es: "Agregar planta" },
  addSub: { en: "Add subcontractor", es: "Agregar subcontratista" },
  trade: { en: "Trade", es: "Oficio" },
  subDescription: { en: "What they did", es: "Qué hicieron" },
  mileageTrips: { en: "How many trips", es: "Cuántos viajes" },
  mileageWhere: { en: "Where to", es: "A dónde" },
  disposals: { en: "Disposals", es: "Desechos" },
  notes: { en: "Additional notes", es: "Notas adicionales" },
  materialsTotal: { en: "Materials total", es: "Total de materiales" },

  // Step 6 — review
  reviewTitle: { en: "Review before sending", es: "Revisa antes de enviar" },
  reviewHint: {
    en: "Only the sections you filled in are shown.",
    es: "Solo se muestran las secciones que llenaste.",
  },
  edit: { en: "Edit", es: "Editar" },
  foremanSignature: { en: "Foreman signature", es: "Firma del capataz" },
  pmSignature: { en: "Project manager signature", es: "Firma del gerente de proyecto" },
  signHere: { en: "Sign with your finger", es: "Firma con tu dedo" },
  clear: { en: "Clear", es: "Borrar" },
  send: { en: "Send report", es: "Enviar reporte" },
  sending: { en: "Sending…", es: "Enviando…" },
  sendShareHint: {
    en: "Opens your phone's share menu — pick Gmail, Mail or WhatsApp and send it to {to}. The PDF and the photos go attached.",
    es: "Abre el menú de compartir del teléfono — elige Gmail, Mail o WhatsApp y mándalo a {to}. El PDF y las fotos van adjuntos.",
  },
  downloadPdf: { en: "Download PDF", es: "Descargar PDF" },
  // Deliberately not "Report sent": the share sheet only proves the phone handed
  // the PDF to the mail app. Saying more than that is how a report gets lost.
  sent: { en: "Report handed over", es: "Reporte entregado" },
  sentBody: {
    en: "Now send it from your mail app — it is not out until you press send there. A copy is kept on this phone under History.",
    es: "Ahora mándalo desde tu app de correo — no sale hasta que le des enviar ahí. Queda una copia en este teléfono, en Historial.",
  },
  sendViaServer: { en: "Send from the office server", es: "Enviar desde el servidor" },
  sendViaServerHint: {
    en: "Use this if the share menu did not work. The office receives it directly.",
    es: "Usa esto si el menú de compartir no funcionó. La oficina lo recibe directo.",
  },
  newReport: { en: "New report", es: "Reporte nuevo" },
  sendFailed: {
    en: "Could not send. Download the PDF and send it manually, or try again when you have signal.",
    es: "No se pudo enviar. Descarga el PDF y mándalo a mano, o intenta de nuevo cuando tengas señal.",
  },
  // Send failures the foreman can act on — a dead spot and a broken email
  // account need very different reactions, so they must not read the same.
  sendFailedConfig: {
    en: "Email is not set up on the server, so retrying will not help. Download the PDF and send it manually, and tell the office.",
    es: "El correo no está configurado en el servidor, reintentar no va a servir. Descarga el PDF y mándalo a mano, y avisa a la oficina.",
  },
  sendFailedTooLarge: {
    en: "The report is too heavy to email — remove a few photos and try again.",
    es: "El reporte pesa demasiado para enviarlo — quita algunas fotos e intenta de nuevo.",
  },
  sendFailedQueueFull: {
    en: "Could not send, and this phone has no room left to save the report. Download the PDF now so it is not lost.",
    es: "No se pudo enviar, y este teléfono ya no tiene espacio para guardar el reporte. Descarga el PDF ahora para no perderlo.",
  },
  sendFailedDetail: { en: "Details", es: "Detalles" },
  retry: { en: "Try again", es: "Intentar de nuevo" },
  offline: { en: "No connection — your report is saved on this phone", es: "Sin conexión — tu reporte está guardado en este teléfono" },

  // Outbox — reports that failed to send and are queued on the device
  pendingReports: { en: "Pending reports", es: "Reportes pendientes" },
  pendingCount: { en: "pending", es: "pendientes" },
  pendingEmpty: { en: "Nothing pending", es: "Nada pendiente" },
  pendingHint: {
    en: "Saved on this phone — resend when you have signal.",
    es: "Guardados en este teléfono — reenvíalos cuando tengas señal.",
  },
  resend: { en: "Resend", es: "Reenviar" },
  resent: { en: "Sent", es: "Enviado" },
  queuedAt: { en: "Queued", es: "En cola" },
  close: { en: "Close", es: "Cerrar" },

  // History — reports that already left the phone, kept so a mail draft
  // abandoned in Gmail does not mean the report is gone.
  history: { en: "Sent reports", es: "Reportes enviados" },
  historyShort: { en: "Sent", es: "Enviados" },
  historyEmpty: { en: "Nothing sent yet", es: "Todavía no enviaste nada" },
  historyHint: {
    en: "Kept on this phone. If one never left your mail app, send it again from here.",
    es: "Guardados en este teléfono. Si alguno no salió de tu app de correo, mándalo otra vez desde aquí.",
  },
  historyNoPhotos: { en: "photos not kept", es: "sin fotos guardadas" },
  historyFull: {
    en: "This phone is full, so no copy was kept. Download the PDF now if you are not sure the mail went out.",
    es: "El teléfono está lleno y no se guardó copia. Descarga el PDF ahora si no estás seguro de que el correo salió.",
  },
  sendAgain: { en: "Send again", es: "Enviar otra vez" },

  // Validation
  required: { en: "Required", es: "Obligatorio" },
  missingFields: { en: "Fill these in first:", es: "Llena esto primero:" },
  warnLongDay: { en: "That's more than 16 hours — is it right?", es: "Son más de 16 horas — ¿está bien?" },
  warnNoCrew: { en: "No crew members added", es: "No agregaste a nadie" },
  warnNoHours: { en: "Some people have no hours", es: "Algunas personas no tienen horas" },

  // Misc
  autosaved: { en: "Saved on this device", es: "Guardado en este dispositivo" },
  autosaveNoPhotos: {
    en: "Saved, but this phone is full — photos are not being kept. Send soon.",
    es: "Guardado, pero el teléfono está lleno — las fotos no se están guardando. Envía pronto.",
  },
  autosaveFailed: {
    en: "Could not save on this phone — do not close the app before sending.",
    es: "No se pudo guardar en este teléfono — no cierres la app antes de enviar.",
  },
  startOver: { en: "Start over", es: "Empezar de nuevo" },
  startOverConfirm: {
    en: "Delete this report and start over?",
    es: "¿Borrar este reporte y empezar de nuevo?",
  },
  cancel: { en: "Cancel", es: "Cancelar" },
  confirm: { en: "Yes, delete", es: "Sí, borrar" },
  language: { en: "Language", es: "Idioma" },
  nothingHere: { en: "Nothing added", es: "Nada agregado" },

  // Who is holding the phone. Asked once, then never again on this device.
  whoAreYou: { en: "Who are you?", es: "¿Quién eres?" },
  whoAreYouHint: {
    en: "Pick your name once. This phone stays yours, and the office knows your reports are yours.",
    es: "Elige tu nombre una vez. Este teléfono queda tuyo, y la oficina sabe que tus reportes son tuyos.",
  },
  foremenShortcut: { en: "Foremen", es: "Capataces" },
  findYourName: { en: "Or search the roster", es: "O busca en la lista" },
  findYourNamePlaceholder: { en: "Type your last name", es: "Escribe tu apellido" },
  noNameFound: { en: "No one by that name", es: "Nadie con ese nombre" },
  choosePin: { en: "Choose a 4-digit PIN", es: "Elige un PIN de 4 dígitos" },
  choosePinHint: {
    en: "You will type it on this phone. Pick something you will not forget.",
    es: "Lo escribirás en este teléfono. Elige algo que no vayas a olvidar.",
  },
  enterPin: { en: "Enter your PIN", es: "Ingresa tu PIN" },
  enterPinHint: {
    en: "The four digits you chose the first time.",
    es: "Los cuatro dígitos que elegiste la primera vez",
  },
  notYou: { en: "Not you? Pick again", es: "¿No eres tú? Elige otra vez" },
  pinWrong: { en: "That PIN is not right", es: "Ese PIN no es correcto" },
  pinLocked: {
    en: "Too many tries. Try again in {n} min.",
    es: "Demasiados intentos. Intenta en {n} min.",
  },
  pinTaken: {
    en: "This name already has a PIN — enter it instead.",
    es: "Este nombre ya tiene un PIN — ingrésalo.",
  },
  pinNeedsSignal: {
    en: "This one step needs signal. You can fill the report now and do it later.",
    es: "Este paso necesita señal. Puedes llenar el reporte ahora y hacerlo después.",
  },
  identifyLater: { en: "Not now", es: "Ahora no" },
  identifyLaterHint: {
    en: "The report still sends. The office just will not know it was you.",
    es: "El reporte igual se envía. La oficina simplemente no sabrá que fuiste tú.",
  },
  identifyNow: { en: "Say who you are", es: "Di quién eres" },
  signedInAs: { en: "Reporting as", es: "Reportando como" },
  // Short on purpose: it shares a 375px row with the foreman's own name, and the
  // name is the part he needs to be able to read.
  handOverPhone: { en: "Not me", es: "No soy yo" },
  pinClear: { en: "Clear", es: "Borrar" },
  pinDelete: { en: "Delete last digit", es: "Borrar último dígito" },
} as const;

export type UIKey = keyof typeof UI;

export function t(key: UIKey, lang: Lang): string {
  return UI[key][lang];
}

const DAYS: Record<Lang, string[]> = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  es: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
};

/** Day of week derived from the date — one less field to fill in. */
export function dayOfWeek(isoDate: string, lang: Lang): string {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return "";
  return DAYS[lang][new Date(y, m - 1, d).getDay()] ?? "";
}
