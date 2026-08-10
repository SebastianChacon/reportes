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

/* ------------------------------------------------------------------ */
/* The office console                                                  */
/* ------------------------------------------------------------------ */

/**
 * Kept apart from `UI` on purpose. These are two vocabularies, not one: `UI`
 * talks to a foreman in a truck ("Left the yard", "Sign with your finger") and
 * this talks to a project manager at a desk about the same day afterwards.
 * Merging them would mean one 600-line object where half the keys are wrong for
 * whichever screen you are reading.
 *
 * Both languages are written for every string, exactly as the brief requires —
 * what defaults to English is the console, not the file. See `CONSOLE_LANG`.
 */
export const CONSOLE = {
  // Shell
  office: { en: "Office", es: "Oficina" },
  company: { en: "Back to Nature", es: "Back to Nature" },
  signOut: { en: "Sign out", es: "Salir" },
  signedInAs: { en: "Signed in as", es: "Conectado como" },

  // Sign in
  signInTitle: { en: "Office sign in", es: "Entrar a la oficina" },
  signInHint: {
    en: "This console shows every report the crews have filed.",
    es: "Esta consola muestra todos los reportes que enviaron las cuadrillas.",
  },
  email: { en: "Email", es: "Correo" },
  password: { en: "Password", es: "Contraseña" },
  signIn: { en: "Sign in", es: "Entrar" },
  signingIn: { en: "Signing in…", es: "Entrando…" },
  signInBad: {
    en: "That email and password do not match an account.",
    es: "Ese correo y contraseña no corresponden a ninguna cuenta.",
  },
  signInLocked: {
    en: "Too many attempts. Try again in {n} min.",
    es: "Demasiados intentos. Intenta en {n} min.",
  },
  signInUnreachable: {
    en: "Could not reach the server. Check your connection and try again.",
    es: "No se pudo contactar al servidor. Revisa tu conexión e intenta de nuevo.",
  },
  signInUnconfigured: {
    en: "Sign-in is not set up on this server yet, so the console cannot be opened.",
    es: "El inicio de sesión todavía no está configurado en este servidor, así que la consola no se puede abrir.",
  },

  // The day
  theDay: { en: "The day", es: "El día" },
  today: { en: "Today", es: "Hoy" },
  previousDay: { en: "Previous day", es: "Día anterior" },
  nextDay: { en: "Next day", es: "Día siguiente" },
  backToToday: { en: "Back to today", es: "Volver a hoy" },

  // The four numbers
  reportsReceived: { en: "Reports in", es: "Reportes recibidos" },
  peopleOnSite: { en: "People out", es: "Personas en calle" },
  labourHours: { en: "Labour hours", es: "Horas de mano de obra" },
  materialsSpend: { en: "Materials", es: "Materiales" },

  // Missing today — the screen the console exists for
  missingTitle: { en: "Not filed yet", es: "Faltan por entregar" },
  missingHint: {
    en: "Foremen with an account who have not filed anything for this day.",
    es: "Capataces con cuenta que no han enviado nada para este día.",
  },
  missingNone: {
    en: "Everyone with an account has filed.",
    es: "Todos los que tienen cuenta ya enviaron.",
  },
  missingNobodyEnrolled: {
    en: "Nobody has set up an account yet, so there is no one this can name.",
    es: "Nadie ha creado una cuenta todavía, así que no hay a quién nombrar.",
  },
  // The honest limit, stated on the screen rather than buried in a plan.
  unattributedNoteOne: {
    en: "One report arrived without a foreman, so it clears nobody from this list.",
    es: "Un reporte llegó sin capataz, así que no saca a nadie de esta lista.",
  },
  unattributedNoteMany: {
    en: "{n} reports arrived without a foreman, so they clear nobody from this list.",
    es: "{n} reportes llegaron sin capataz, así que no sacan a nadie de esta lista.",
  },
  enrolledCount: {
    en: "{filed} of {enrolled} filed",
    es: "{filed} de {enrolled} enviaron",
  },

  // The list
  reports: { en: "Reports", es: "Reportes" },
  noReports: {
    en: "No reports for this day yet.",
    es: "Todavía no hay reportes para este día.",
  },
  noReportsHint: {
    en: "They arrive as the crews finish. Check a previous day, or come back later.",
    es: "Llegan conforme las cuadrillas terminan. Revisa un día anterior, o vuelve más tarde.",
  },
  unattributed: { en: "No foreman", es: "Sin capataz" },
  jobShort: { en: "Job", es: "Trabajo" },
  people: { en: "people", es: "personas" },
  hours: { en: "hrs", es: "hrs" },
  photos: { en: "photos", es: "fotos" },

  // Status
  statusSubmitted: { en: "New", es: "Nuevo" },
  statusNeedsReview: { en: "Sent back", es: "Devuelto" },
  statusApproved: { en: "Approved", es: "Aprobado" },

  // Flags, as the office reads them — shorter and blunter than the phone's
  // version, because here they are a reason to open a report, not advice.
  flagLongDay: { en: "Over 16 hours", es: "Más de 16 horas" },
  flagNoCrew: { en: "No crew", es: "Sin cuadrilla" },
  flagNoHours: { en: "Missing hours", es: "Faltan horas" },

  // One report
  reportTitle: { en: "Report", es: "Reporte" },
  backToDay: { en: "Back to the day", es: "Volver al día" },
  notFound: { en: "That report is not here.", es: "Ese reporte no está." },
  notFoundHint: {
    en: "It may have been deleted, or the link may be wrong.",
    es: "Puede que se haya borrado, o que el link esté mal.",
  },
  filedBy: { en: "Filed by", es: "Enviado por" },
  filedAt: { en: "Filed", es: "Enviado" },
  reviewedBy: { en: "Reviewed by", es: "Revisado por" },

  sectionJob: { en: "Job", es: "Trabajo" },
  sectionTimes: { en: "Times", es: "Horarios" },
  sectionCrew: { en: "Crew", es: "Cuadrilla" },
  sectionWork: { en: "Work done", es: "Trabajo hecho" },
  sectionMaterials: { en: "Materials & resources", es: "Materiales y recursos" },
  sectionPhotos: { en: "Photos", es: "Fotos" },

  client: { en: "Client", es: "Cliente" },
  jobNumbers: { en: "Job numbers", es: "Números de trabajo" },
  truckNumbers: { en: "Trucks", es: "Camiones" },
  date: { en: "Date", es: "Fecha" },
  leftYard: { en: "Left the yard", es: "Salida del patio" },
  arrivedJob: { en: "Arrived at job", es: "Llegada al trabajo" },
  leftJob: { en: "Left the job", es: "Salida del trabajo" },
  backYard: { en: "Back at the yard", es: "Regreso al patio" },
  lunch: { en: "Lunch", es: "Almuerzo" },
  dayHours: { en: "Day", es: "Día" },
  onSite: { en: "On site", es: "En el sitio" },
  travel: { en: "Travel", es: "Traslado" },
  crewHours: { en: "Crew hours", es: "Horas de cuadrilla" },
  name: { en: "Name", es: "Nombre" },
  role: { en: "Role", es: "Rol" },
  notOnRoster: { en: "not on the roster", es: "no está en la lista" },
  noHoursRecorded: { en: "no hours", es: "sin horas" },

  // The description carries two languages. The console shows the translation
  // and keeps the original one click away — never hidden, never replaced.
  original: { en: "Original", es: "Original" },
  translation: { en: "Translation", es: "Traducción" },
  showOriginal: { en: "Show the original", es: "Ver el original" },
  showTranslation: { en: "Show the translation", es: "Ver la traducción" },
  notesLabel: { en: "Notes", es: "Notas" },
  mileage: { en: "Mileage", es: "Millaje" },
  disposals: { en: "Disposals", es: "Desechos" },
  trips: { en: "trips", es: "viajes" },
  qty: { en: "Qty", es: "Cant." },
  cost: { en: "Cost", es: "Costo" },
  equipment: { en: "Equipment", es: "Equipo" },
  materials: { en: "Materials", es: "Materiales" },
  plants: { en: "Plants", es: "Plantas" },
  subcontractors: { en: "Subcontractors", es: "Subcontratistas" },
  trucks: { en: "Trucks", es: "Camiones" },
  nothingRecorded: { en: "Nothing recorded", es: "Nada registrado" },
  noPhotos: { en: "No photos with this report", es: "Sin fotos en este reporte" },
  photoMissing: { en: "Photo unavailable", es: "Foto no disponible" },
  openPhoto: { en: "Open full size", es: "Abrir en tamaño completo" },

  // Actions
  approve: { en: "Approve", es: "Aprobar" },
  approving: { en: "Approving…", es: "Aprobando…" },
  sendBack: { en: "Send back with a note", es: "Devolver con nota" },
  sendingBack: { en: "Sending back…", es: "Devolviendo…" },
  noteLabel: { en: "What needs fixing?", es: "¿Qué hay que corregir?" },
  notePlaceholder: {
    en: "e.g. Carlos's hours are missing",
    es: "ej. faltan las horas de Carlos",
  },
  noteRequired: {
    en: "Write what needs fixing — that note is the whole point of sending it back.",
    es: "Escribe qué hay que corregir — esa nota es el punto de devolverlo.",
  },
  noteShown: {
    en: "The foreman sees this on his phone.",
    es: "El capataz ve esto en su teléfono.",
  },
  sentBackNote: { en: "Sent back", es: "Devuelto" },
  cancel: { en: "Cancel", es: "Cancelar" },
  actionFailed: {
    en: "That did not go through. Try again.",
    es: "No se pudo. Intenta de nuevo.",
  },
  reopen: { en: "Reopen", es: "Reabrir" },

  // Getting between the screens
  navDay: { en: "The day", es: "El día" },
  navSearch: { en: "Search", es: "Buscar" },

  // Search
  searchTitle: { en: "Search reports", es: "Buscar reportes" },
  searchHint: {
    en: "Every filter stays in the address bar, so a search is a link you can send.",
    es: "Cada filtro queda en la barra de direcciones, así que una búsqueda es un link que puedes mandar.",
  },
  filterFrom: { en: "From", es: "Desde" },
  filterTo: { en: "To", es: "Hasta" },
  filterStatus: { en: "Status", es: "Estado" },
  filterClient: { en: "Client", es: "Cliente" },
  filterClientHint: {
    en: "Any part of the name",
    es: "Cualquier parte del nombre",
  },
  filterJob: { en: "Job number", es: "Número de trabajo" },
  // Exact on purpose, and said out loud: 2155 is a different job from 21550.
  filterJobHint: { en: "The whole number", es: "El número completo" },
  filterFiledBy: { en: "Filed by", es: "Enviado por" },
  filterPerson: { en: "On the crew", es: "En la cuadrilla" },
  filterAny: { en: "Anyone", es: "Cualquiera" },
  filterAnyStatus: { en: "Any", es: "Cualquiera" },
  runSearch: { en: "Search", es: "Buscar" },
  clearFilters: { en: "Clear", es: "Limpiar" },
  searchShortcut: { en: "Press / to search", es: "Presiona / para buscar" },

  resultsOne: { en: "1 report", es: "1 reporte" },
  resultsMany: { en: "{n} reports", es: "{n} reportes" },
  // A search that quietly drops results is worse than one that says it stopped.
  resultsTruncated: {
    en: "Showing the most recent matches only. Narrow the dates to see the rest.",
    es: "Se muestran solo las coincidencias más recientes. Acorta las fechas para ver el resto.",
  },
  noResults: { en: "Nothing matched that search.", es: "Nada coincide con esa búsqueda." },
  noResultsHint: {
    en: "Try a wider date range, or clear a filter.",
    es: "Prueba un rango de fechas más amplio, o quita un filtro.",
  },
  noResultsInRange: {
    en: "No reports were filed in these dates.",
    es: "No se envió ningún reporte en esas fechas.",
  },
  // Nothing is filtered here, so telling anyone to clear a filter would be
  // advice about a box they never touched.
  noResultsInRangeHint: {
    en: "Try a wider date range.",
    es: "Prueba un rango de fechas más amplio.",
  },

  // One person's week
  personTitle: { en: "Week", es: "Semana" },
  personHint: {
    en: "Every day this person was on a crew, from the reports the foremen filed.",
    es: "Cada día que esta persona estuvo en una cuadrilla, según los reportes que enviaron los capataces.",
  },
  previousWeek: { en: "Previous week", es: "Semana anterior" },
  nextWeek: { en: "Next week", es: "Semana siguiente" },
  thisWeek: { en: "This week", es: "Esta semana" },
  totalHours: { en: "Total hours", es: "Horas totales" },
  daysWorked: { en: "Days worked", es: "Días trabajados" },
  daysMissingHours: { en: "Days without hours", es: "Días sin horas" },
  // Payroll cannot pay from a week until this is zero, so it is said plainly.
  daysMissingHoursHint: {
    en: "On these days they were on a crew and nobody wrote the hours down.",
    es: "Esos días estuvo en una cuadrilla y nadie anotó las horas.",
  },
  noWorkInWeek: { en: "No work recorded in these dates.", es: "No hay trabajo registrado en esas fechas." },
  noWorkInWeekHint: {
    en: "Try another week, or check whether the reports for these days have been filed.",
    es: "Prueba otra semana, o revisa si ya enviaron los reportes de esos días.",
  },
  unknownPerson: { en: "That person is not on the roster.", es: "Esa persona no está en la lista." },
  unknownPersonHint: {
    en: "Only people on the roster have a history. A name typed into one report is a name on that report, not a person to follow.",
    es: "Solo las personas de la lista tienen historial. Un nombre escrito en un reporte es un nombre en ese reporte, no una persona a la que seguir.",
  },
  jobsThatDay: { en: "Jobs", es: "Trabajos" },
  seeAllReports: { en: "All their reports", es: "Todos sus reportes" },
  openReport: { en: "Open the report", es: "Abrir el reporte" },
  viewWeek: { en: "See this person's week", es: "Ver la semana de esta persona" },

  // Not wired to a deployment
  unconfigured: {
    en: "This server is not set up to open the console.",
    es: "Este servidor no está configurado para abrir la consola.",
  },
  unconfiguredHint: {
    en: "It needs AUTH_SECRET to sign anyone in and NEXT_PUBLIC_CONVEX_URL to read the reports. Without them the console would show an empty day, which looks exactly like a day nobody worked.",
    es: "Necesita AUTH_SECRET para dejar entrar a alguien y NEXT_PUBLIC_CONVEX_URL para leer los reportes. Sin eso la consola mostraría un día vacío, que se ve igual que un día en que nadie trabajó.",
  },
  unconfiguredMissing: { en: "Missing:", es: "Falta:" },
} as const;

export type ConsoleKey = keyof typeof CONSOLE;

/**
 * The console's language.
 *
 * English, because it serves Back to Nature's project managers, while the field
 * wizard stays Spanish-first. Both languages are written above regardless, so
 * this is one constant to change rather than a rewrite.
 */
export const CONSOLE_LANG: Lang = "en";

export function tc(key: ConsoleKey, lang: Lang = CONSOLE_LANG): string {
  return CONSOLE[key][lang];
}

/** `tc` with `{name}` placeholders filled in. */
export function tcf(
  key: ConsoleKey,
  values: Record<string, string | number>,
  lang: Lang = CONSOLE_LANG
): string {
  return tc(key, lang).replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in values ? String(values[name]) : whole
  );
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
