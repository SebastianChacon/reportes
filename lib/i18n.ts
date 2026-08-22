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
  // The one page in the product that is behind neither door.
  backToOverview: { en: "Back to the start", es: "Volver al inicio" },
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
  /*
   * Said out loud when the fields arrive already filled.
   *
   * Without it someone signs in with the demo account, sees 292 invented
   * reports, and approves one believing it is a crew's real day. The whole
   * point of the prefill is convenience at a demo; the cost of not labelling it
   * is a manager acting on fiction.
   */
  signInDemo: {
    en: "Demonstration account — the reports behind it are invented.",
    es: "Cuenta de demostración — los reportes que hay detrás son inventados.",
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
  skipToContent: { en: "Skip to content", es: "Saltar al contenido" },
  loading: { en: "Loading", es: "Cargando" },
  searching: { en: "Searching…", es: "Buscando…" },
  approvedJustNow: { en: "Approved", es: "Aprobado" },
  undo: { en: "Undo", es: "Deshacer" },
  undoing: { en: "Undoing…", es: "Deshaciendo…" },
  showAll: { en: "All", es: "Todos" },
  noneUnderFilter: { en: "Nothing left here", es: "No queda nada aquí" },
  noneUnderFilterHint: {
    en: "Reports were filed today — none of them are in this state.",
    es: "Hoy sí llegaron reportes; ninguno está en este estado.",
  },
  breadcrumb: { en: "Breadcrumb", es: "Ruta de navegación" },
  crumbReport: { en: "Report", es: "Reporte" },
  crumbPerson: { en: "The week", es: "La semana" },
  crumbAdvanced: { en: "Advanced", es: "Avanzado" },
  crumbClient: { en: "Client", es: "Cliente" },

  // Search
  searchTitle: { en: "Search reports", es: "Buscar reportes" },
  searchHint: {
    en: "Every filter stays in the address bar, so a search is a link you can send.",
    es: "Cada filtro queda en la barra de direcciones, así que una búsqueda es un link que puedes mandar.",
  },
  filterIssue: { en: "Problem", es: "Problema" },
  filterAnyIssue: { en: "Any", es: "Cualquiera" },
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

  // The email the office gets when a report is sent (lib/reportEmail.ts).
  // Console strings, not field strings: the reader is a project manager at a
  // desk, and the email's whole job now is to get him to the console.
  emailSubjectTag: { en: "Job report", es: "Reporte de trabajo" },
  emailOpenInConsole: { en: "Open in the console", es: "Abrir en la consola" },
  emailNeedsALook: { en: "needs a look", es: "necesita revisión" },
  emailPreheaderCrew: { en: "{n} on the crew", es: "{n} en la cuadrilla" },
  emailYardToJob: { en: "Yard → Job", es: "Patio → Trabajo" },
  emailJobToYard: { en: "Job → Yard", es: "Trabajo → Patio" },
  emailPdfAttached: {
    en: "The full report is attached as a one-page PDF, signatures and all.",
    es: "El reporte completo va adjunto en un PDF de una página, con firmas y todo.",
  },
  emailPhotosAttached: { en: "{n} photo(s) attached.", es: "{n} foto(s) adjuntas." },
  emailNoPhotosAttached: { en: "No photos on this one.", es: "Este no trae fotos." },
  emailSentAt: { en: "Sent {at} from the field app.", es: "Enviado {at} desde la app de campo." },
  // Said instead of a button that would land nowhere. See `linkBlock`.
  emailNoConsole: {
    en: "This server has no console wired up, so there is no link to open this report with — the PDF below is the whole record.",
    es: "Este servidor no tiene consola conectada, así que no hay link para abrir este reporte — el PDF de abajo es todo el registro.",
  },

  // Following an emailed link (/office/reportes/clave/[clientId])
  notFiledTitle: { en: "This report has not been filed.", es: "Este reporte no está archivado." },
  notFiledHint: {
    en: "The email went out, but the phone never managed to store the office's copy — usually no signal at the end of the day. It files itself the next time that phone opens the app with a connection.",
    es: "El correo salió, pero el teléfono nunca logró guardar la copia de la oficina — casi siempre por falta de señal al final del día. Se archiva solo la próxima vez que ese teléfono abra la app con conexión.",
  },
  notFiledMeanwhile: {
    en: "The PDF attached to the email is the full report in the meantime.",
    es: "Mientras tanto, el PDF adjunto al correo es el reporte completo.",
  },

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

  /* ---------------------------------------------------------------- */
  /* The summary (/office/resumen)                                     */
  /* ---------------------------------------------------------------- */

  navSummary: { en: "Summary", es: "Resumen" },
  summaryTitle: { en: "The summary", es: "El resumen" },
  summaryHint: {
    en: "Where the work, the hours and the money went over a stretch of time.",
    es: "A dónde se fue el trabajo, las horas y el dinero en un periodo.",
  },

  // The period, which lives in the URL so a summary is a link.
  period: { en: "Period", es: "Periodo" },
  periodWeek: { en: "This week", es: "Esta semana" },
  period4w: { en: "4 weeks", es: "4 semanas" },
  period6w: { en: "6 weeks", es: "6 semanas" },
  periodMonth: { en: "This month", es: "Este mes" },
  periodCustom: { en: "Pick dates", es: "Elegir fechas" },
  periodFrom: { en: "From", es: "Desde" },
  periodTo: { en: "To", es: "Hasta" },
  periodApply: { en: "Apply", es: "Aplicar" },
  periodDays: { en: "{n} days", es: "{n} días" },

  vsPrevious: { en: "vs before", es: "vs antes" },
  deltaFlat: { en: "about the same", es: "casi igual" },
  deltaNoBase: {
    en: "No earlier period to compare with",
    es: "No hay periodo anterior con qué comparar",
  },
  seeTable: { en: "See the numbers", es: "Ver los números" },
  vizNoData: {
    en: "Nothing was recorded for this in the period.",
    es: "No se registró nada de esto en el periodo.",
  },
  vizNotFiled: { en: "Not filed", es: "Sin reporte" },
  vizFlagged: { en: "Needs a look", es: "Necesita revisión" },
  vizTruncated: {
    en: "This period holds more reports than one read can cover, so the charts are drawn from the most recent of them. Narrow the dates for an exact answer.",
    es: "Este periodo tiene más reportes de los que cabe leer de una vez, así que los gráficos usan los más recientes. Acorta las fechas para una respuesta exacta.",
  },

  // The five numbers
  kpiLabour: { en: "Labour hours", es: "Horas de mano de obra" },
  kpiLabourHint: { en: "person-hours paid", es: "horas-persona pagadas" },
  kpiTravel: { en: "Time spent driving", es: "Tiempo manejando" },
  kpiTravelHint: { en: "of the yard-to-yard day", es: "de la jornada patio a patio" },
  kpiMaterials: { en: "Materials", es: "Materiales" },
  kpiMaterialsHint: { en: "material and plants", es: "material y plantas" },
  kpiRental: { en: "Rented machine hours", es: "Horas de máquina rentada" },
  kpiRentalHint: { en: "billed by the day", es: "se cobran por día" },
  kpiReports: { en: "Reports filed", es: "Reportes recibidos" },
  kpiReportsHint: { en: "one per crew per day", es: "uno por cuadrilla por día" },

  // A. Hours by week
  chartHours: { en: "Where the day goes, week by week", es: "A dónde se va la jornada, semana a semana" },
  chartHoursHint: {
    en: "Yard-to-yard hours, counted once per crew per day. An hour in the truck is paid at the same rate as an hour laying stone.",
    es: "Horas de patio a patio, contadas una vez por cuadrilla por día. Una hora en la camioneta se paga igual que una hora poniendo piedra.",
  },
  seriesOnSite: { en: "On site", es: "En el sitio" },
  seriesTravel: { en: "Driving", es: "Manejando" },

  // B. Ours against theirs
  chartSplit: { en: "Ours, and everyone else's", es: "Lo nuestro y lo de fuera" },
  chartSplitHint: {
    en: "What the company already owned against what it had to pay somebody for.",
    es: "Lo que la empresa ya tenía contra lo que hubo que pagarle a alguien.",
  },
  splitEquipment: { en: "Machine hours", es: "Horas de máquina" },
  splitMaterials: { en: "Material spend", es: "Gasto en material" },
  seriesOwned: { en: "Ours", es: "Propia" },
  seriesRented: { en: "Rented", es: "Rentada" },
  seriesYard: { en: "From the yard", es: "De la yarda" },
  seriesBought: { en: "Bought", es: "Comprado" },
  splitUnclassified: {
    en: "{amount} of the material total is not itemised on any line — an older report, or lines edited after filing.",
    es: "{amount} del total de material no está desglosado en ninguna línea — un reporte viejo, o líneas editadas después de enviarlo.",
  },

  // The rentals, listed. Every row is an invoice.
  chartRentals: { en: "What we rented", es: "Lo que rentamos" },
  chartRentalsHint: {
    en: "Ranked apart from the owned machines on purpose: by total hours the yard's own trimmer buries the excavator that cost real money.",
    es: "Se listan aparte de las máquinas propias a propósito: por horas totales, la orilladora de la yarda entierra a la excavadora que sí costó dinero.",
  },

  // C. Clients
  chartClients: { en: "Which clients took the hours", es: "Qué clientes se llevaron las horas" },
  chartClientsHint: {
    en: "Person-hours on the crew, every job for that client added together.",
    es: "Horas-persona de cuadrilla, sumando todos los trabajos de ese cliente.",
  },

  // D. The calendar
  chartCalendar: { en: "The period, day by day", es: "El periodo, día por día" },
  chartCalendarHint: {
    en: "One square per foreman per working day. A hollow square is a day nothing was filed — the one thing a mailbox can never show you.",
    es: "Un cuadro por capataz por día de trabajo. Un cuadro vacío es un día sin reporte — lo único que un buzón nunca te puede enseñar.",
  },

  // What the office still has to chase
  outstandingTitle: { en: "Still open", es: "Pendiente" },
  outstandingNone: {
    en: "Nothing outstanding in this period.",
    es: "Nada pendiente en este periodo.",
  },
  outNeedsReview: { en: "sent back", es: "devueltos" },
  outMissingHours: { en: "missing someone's hours", es: "sin las horas de alguien" },
  outUnattributed: { en: "with no foreman", es: "sin capataz" },
  outLongDays: { en: "over 16 hours", es: "de más de 16 horas" },
  outNoCrew: { en: "with no crew", es: "sin cuadrilla" },

  // Table columns
  colWeek: { en: "Week of", es: "Semana del" },
  colReports: { en: "Reports", es: "Reportes" },
  colOnSite: { en: "On site", es: "En sitio" },
  colTravel: { en: "Driving", es: "Manejando" },
  colShare: { en: "Driving %", es: "% manejando" },
  colCrewHours: { en: "Labour hrs", es: "Horas m.o." },
  colClient: { en: "Client", es: "Cliente" },
  colJobs: { en: "Job #", es: "Trabajo #" },
  colCost: { en: "Materials", es: "Materiales" },
  colItem: { en: "Item", es: "Artículo" },
  colOurs: { en: "Ours", es: "Propio" },
  colTheirs: { en: "Rented / bought", es: "Rentado / comprado" },
  colForeman: { en: "Foreman", es: "Capataz" },
  colDaysFiled: { en: "Days filed", es: "Días con reporte" },
  colDaysMissed: { en: "Days missed", es: "Días sin reporte" },

  /* ---------------------------------------------------------------- */
  /* Advanced (/office/resumen/avanzado)                               */
  /* ---------------------------------------------------------------- */

  advancedTitle: { en: "Advanced", es: "Opciones avanzadas" },
  advancedHint: {
    en: "The same period, with the axis loose: group it by whatever you are asking about, sort it, and take it away as a spreadsheet.",
    es: "El mismo periodo, con el eje suelto: agrúpalo por lo que estés preguntando, ordénalo, y llévatelo como hoja de cálculo.",
  },
  advancedOpen: { en: "Advanced options", es: "Opciones avanzadas" },

  groupBy: { en: "Group by", es: "Agrupar por" },
  groupWeek: { en: "Week", es: "Semana" },
  groupClient: { en: "Client", es: "Cliente" },
  groupForeman: { en: "Foreman", es: "Capataz" },
  groupPerson: { en: "Person", es: "Persona" },
  groupDay: { en: "Day", es: "Día" },

  sortBy: { en: "Sorted by", es: "Ordenado por" },
  exportCsv: { en: "Download as CSV", es: "Descargar como CSV" },
  // Plain text on purpose: this one is read in a browser tab, by somebody who
  // followed a link into a file and needs to know it is the session, not the link.
  exportSignedOut: {
    en: "Sign in to the office console before downloading this.",
    es: "Entra a la consola de la oficina antes de descargar esto.",
  },
  exportHint: {
    en: "Exactly the rows above, in the order they are shown — no symbols, so a spreadsheet can add them up.",
    es: "Exactamente las filas de arriba, en el orden en que se ven — sin símbolos, para que una hoja de cálculo las pueda sumar.",
  },

  payrollTitle: { en: "Hours by person", es: "Horas por persona" },
  payrollHint: {
    en: "What each person was written down for over the period, and how many of their days nobody recorded hours on. Payroll cannot pay from a row whose second number is not zero.",
    es: "Lo que se le anotó a cada persona en el periodo, y en cuántos de sus días nadie escribió las horas. Nómina no puede pagar una fila cuyo segundo número no sea cero.",
  },
  colDaysWorked: { en: "Days on a crew", es: "Días en cuadrilla" },
  colHoursMissing: { en: "Days with no hours", es: "Días sin horas" },
  colAdhoc: { en: "Written in", es: "Escrito a mano" },
  adhocNote: {
    en: "Names a foreman wrote in are grouped by the name itself, because they have no roster id — two crews that both wrote \"Juan\" count as one man here.",
    es: "Los nombres que un capataz escribió a mano se agrupan por el nombre, porque no tienen id de la lista — dos cuadrillas que escribieron \"Juan\" cuentan como uno solo aquí.",
  },

  qualityTitle: { en: "What needs chasing", es: "Lo que hay que perseguir" },
  qualityHint: {
    en: "Every one of these is a link to the reports it counts.",
    es: "Cada uno de estos es un link a los reportes que cuenta.",
  },

  /* ---------------------------------------------------------------- */
  /* The production board                                              */
  /* ---------------------------------------------------------------- */

  navCalendar: { en: "The board", es: "El tablero" },
  boardTitle: { en: "The production board", es: "El tablero de producción" },
  boardLead: {
    en: "The wall in the office, editable. Drag across a line to draw a job; drag a bar to move it, or its ends to lengthen it.",
    es: "La pared de la oficina, editable. Arrastra sobre una línea para dibujar un trabajo; arrastra una barra para moverla, o sus extremos para alargarla.",
  },
  boardEmpty: { en: "Nothing on the board yet", es: "Todavía no hay nada en el tablero" },
  boardEmptyHint: {
    en: "Start it from the photograph of the wall — the clients, the crews and the two weeks of enhancements — and edit from there. Or add the first line yourself.",
    es: "Empiézalo desde la foto de la pared — los clientes, las cuadrillas y las dos semanas de enhancements — y edítalo desde ahí. O agrega tú la primera línea.",
  },
  boardSeed: { en: "Fill it from the wall", es: "Llenarlo desde la pared" },
  boardSeeding: { en: "Filling…", es: "Llenando…" },
  boardStartBlank: { en: "Start with one empty line", es: "Empezar con una línea vacía" },
  boardTruncated: {
    en: "This board is longer than the screen will draw. Split it into a second board.",
    es: "Este tablero es más largo de lo que la pantalla dibuja. Divídelo en un segundo tablero.",
  },

  boardSaving: { en: "Saving…", es: "Guardando…" },
  boardSaved: { en: "Saved", es: "Guardado" },
  boardSaveFailed: {
    en: "That change did not save. It is still on your screen — try again.",
    es: "Ese cambio no se guardó. Sigue en tu pantalla — intenta de nuevo.",
  },
  boardRetry: { en: "Try again", es: "Intentar de nuevo" },
  boardRefresh: { en: "Refresh", es: "Actualizar" },

  boardSettings: { en: "The ruler", es: "La regleta" },
  boardStartDate: { en: "Starts", es: "Empieza" },
  boardColumns: { en: "Columns", es: "Columnas" },
  boardScaleWeek: { en: "By week", es: "Por semana" },
  boardScaleDay: { en: "By day", es: "Por día" },
  boardAddMarker: { en: "Mark a date", es: "Marcar una fecha" },
  boardMarkerLabel: { en: "What it marks", es: "Qué marca" },
  boardMarkerRemove: { en: "Remove the mark", es: "Quitar la marca" },
  boardToday: { en: "Today", es: "Hoy" },

  boardColClient: { en: "Client", es: "Cliente" },
  boardColDLong: { en: "Designer", es: "Diseñador" },
  boardColCmLong: { en: "Construction manager", es: "Jefe de obra" },
  boardColPmLong: { en: "Project manager", es: "Jefe de proyecto" },
  boardNote: { en: "Note", es: "Nota" },

  boardAddRow: { en: "Add a line", es: "Agregar una línea" },
  boardAddGroup: { en: "Add a group", es: "Agregar un grupo" },
  boardGroupTitle: { en: "Group name", es: "Nombre del grupo" },
  boardRowMenu: { en: "This line", es: "Esta línea" },
  boardMoveUp: { en: "Move up", es: "Subir" },
  boardMoveDown: { en: "Move down", es: "Bajar" },
  boardDeleteRow: { en: "Delete the line", es: "Borrar la línea" },
  boardDeleteRowSure: {
    en: "Delete this line and everything drawn on it?",
    es: "¿Borrar esta línea y todo lo dibujado en ella?",
  },
  boardDeleteGroup: { en: "Delete the group", es: "Borrar el grupo" },
  boardDeleteGroupSure: {
    en: "Delete this group? Its lines go with it.",
    es: "¿Borrar este grupo? Sus líneas se van con él.",
  },

  boardAddBar: { en: "Add a bar", es: "Agregar una barra" },
  boardBarLabel: { en: "Written on it", es: "Escrito encima" },
  boardBarFrom: { en: "From", es: "Desde" },
  boardBarSpan: { en: "How long", es: "Cuánto dura" },
  boardBarTentative: { en: "Not confirmed", es: "Sin confirmar" },
  boardBarDelete: { en: "Erase it", es: "Borrarla" },
  boardBarColor: { en: "Marker", es: "Rotulador" },
  boardDone: { en: "Done", es: "Listo" },

  boardInkRed: { en: "Red", es: "Rojo" },
  boardInkGreen: { en: "Green", es: "Verde" },
  boardInkBlue: { en: "Blue", es: "Azul" },
  boardInkOrange: { en: "Orange", es: "Naranja" },
  boardInkInk: { en: "Black", es: "Negro" },

  boardKeys: {
    en: "With a keyboard: tab to a bar, then arrows move it, shift and arrows lengthen it, Enter opens it, Delete erases it.",
    es: "Con teclado: tabula hasta una barra; las flechas la mueven, mayúsculas y flechas la alargan, Enter la abre, Suprimir la borra.",
  },
  boardBarAt: {
    en: "{label}, from {from} for {span}",
    es: "{label}, desde {from} durante {span}",
  },
  boardWeeksN: { en: "{n} weeks", es: "{n} semanas" },
  boardDaysN: { en: "{n} days", es: "{n} días" },
  boardLine: { en: "Line on the board", es: "Línea del tablero" },
  boardEmptyRow: { en: "Nothing drawn here yet", es: "Nada dibujado aquí todavía" },
  boardUnnamed: { en: "New line", es: "Línea nueva" },
  boardStrays: { en: "Not in any group", es: "Sin grupo" },
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

/* ------------------------------------------------------------------ */
/* The overview (/inicio)                                              */
/* ------------------------------------------------------------------ */

/**
 * A third vocabulary, and for the same reason there is a second one.
 *
 * `UI` speaks to a foreman about the day he is having; `CONSOLE` speaks to a
 * manager about the day that has happened. This speaks about the software
 * itself — what it does, what this particular server has switched on, and where
 * each screen is. Neither of the other two has any use for that, and folding it
 * into either would put strings about environment variables next to strings
 * about polymeric sand.
 *
 * Unlike the console, this one is Spanish-first: it is the front door, and the
 * people who own this product read Spanish. The toggle is real either way.
 */
export const HOME = {
  // Shell
  title: { en: "Project status", es: "Estado del proyecto" },
  tagline: {
    en: "What this server has switched on, and what came in today.",
    es: "Qué tiene encendido este servidor, y qué llegó hoy.",
  },
  language: { en: "Language", es: "Idioma" },

  /*
   * The chooser at `/`.
   *
   * Two doors and nothing else, so every word here is read — which is why the
   * bodies are one short line each and not the paragraph the old overview cards
   * carried. A screen whose entire content is two buttons cannot afford prose.
   */
  doorsLabel: { en: "Where are you going?", es: "¿A dónde vas?" },
  doorFieldTitle: { en: "Report", es: "Reporte" },
  doorFieldBody: {
    en: "Fill in the day's report.",
    es: "Llenar el reporte del día.",
  },
  /* Not the title again. "Report → Report" reads as a rendering fault, and the
   * verb is the half that says what happens when you press it. */
  doorFieldCta: { en: "Start", es: "Empezar" },
  doorAdminTitle: { en: "Administration", es: "Administración" },
  doorAdminBody: {
    en: "The day, the search, the hours.",
    es: "El día, la búsqueda, las horas.",
  },
  /*
   * "Sign in" rather than "Open", and a padlock beside it.
   *
   * The two doors are not symmetrical — one is open and the other wants a
   * password — and the screen has to say so *before* the click. Without this
   * the only way to learn the difference is to tap and land in a login nobody
   * asked for, which is the exact moment an "intuitive" screen stops being one.
   */
  doorAdminSignIn: { en: "Sign in", es: "Entrar" },
  doorAdminOpen: { en: "Open", es: "Abrir" },
  doorAdminLocked: {
    en: "Not wired up on this server yet.",
    es: "Todavía no está conectada en este servidor.",
  },
  doorLockedHint: { en: "Needs a password", es: "Pide contraseña" },

  /** Still used by the status page, where the day's numbers sit behind the door. */
  officeSignInCta: { en: "Sign in to the console", es: "Entrar a la consola" },

  // What this server has switched on
  status: { en: "What is switched on here", es: "Qué está encendido acá" },
  statusHint: {
    en: "Every piece above the phone switches itself off when its variable is missing, instead of failing loudly. That is good in the field and impossible to debug, so the missing names are printed here.",
    es: "Cada pieza por encima del teléfono se apaga sola cuando le falta su variable, en vez de fallar a los gritos. Eso está bien en el campo y es imposible de depurar, así que acá se imprimen los nombres que faltan.",
  },
  stateAlways: { en: "Needs nothing", es: "No necesita nada" },
  stateReady: { en: "On", es: "Encendido" },
  stateOff: { en: "Off", es: "Apagado" },
  missingLabel: { en: "Missing", es: "Falta" },
  withoutIt: { en: "Without it", es: "Sin eso" },
  fieldOnlyNote: {
    en: "Nothing above the phone is configured on this server, so what you are looking at is the field wizard and nothing else — which is a supported way to run it, not a broken install.",
    es: "En este servidor no hay nada configurado por encima del teléfono, así que lo que estás viendo es el asistente de campo y nada más — que es una forma válida de correrlo, no una instalación rota.",
  },

  capFieldTitle: { en: "Field capture", es: "Captura en campo" },
  capFieldBody: {
    en: "The wizard, the offline draft and the send queue. It depends on no variable at all, which is the point: a report at 6am matters more than the rest of this list.",
    es: "El asistente, el borrador sin conexión y la cola de envío. No depende de ninguna variable, y ese es el punto: un reporte a las 6am importa más que todo el resto de esta lista.",
  },
  capEmailTitle: { en: "Email delivery", es: "Envío por email" },
  capEmailBody: {
    en: "Resend sends the office a notification with the one-page PDF attached and a link straight into the console.",
    es: "Resend le manda a la oficina una notificación con el PDF de una página adjunto y un link directo a la consola.",
  },
  capEmailOff: {
    en: "Sending returns 503, the phone says so plainly, and the foreman downloads the PDF instead.",
    es: "El envío devuelve 503, el teléfono lo dice claramente y el capataz descarga el PDF en su lugar.",
  },
  capArchiveTitle: { en: "The office archive", es: "El archivo de la oficina" },
  capArchiveBody: {
    en: "Every sent report is stored in Convex with its totals computed at write time, so the console can never contradict the PDF.",
    es: "Cada reporte enviado se guarda en Convex con sus totales calculados al escribir, para que la consola nunca contradiga al PDF.",
  },
  capArchiveOff: {
    en: "Reports go out by email and nothing is filed. The phone keeps its last 20, so the first reconnect after this is configured files the weeks already gone by.",
    es: "Los reportes salen por email y no se archiva nada. El teléfono guarda los últimos 20, así que la primera reconexión después de configurarlo archiva las semanas que ya pasaron.",
  },
  capConsoleTitle: { en: "The console door", es: "La puerta de la consola" },
  capConsoleBody: {
    en: "A 12-hour office session — not the phone's 90 days, because a console is opened on shared desktops. PBKDF2 at 100k iterations, locked for 15 minutes after 5 tries.",
    es: "Sesión de oficina de 12 horas — no los 90 días del teléfono, porque una consola se abre en escritorios compartidos. PBKDF2 de 100k iteraciones y bloqueo de 15 minutos a los 5 intentos.",
  },
  capConsoleOff: {
    en: "Nobody can sign in, and the console says exactly that rather than showing an empty day — an empty day and a misconfigured server look identical.",
    es: "Nadie puede entrar, y la consola lo dice en vez de mostrar un día vacío — un día vacío y un servidor mal configurado se ven igual.",
  },

  // Today
  today: { en: "Today", es: "Hoy" },
  todaySignedOut: {
    en: "The day's numbers are behind the console door. This page is not.",
    es: "Los números del día están detrás de la puerta de la consola. Esta página no.",
  },
  todayUnconfigured: {
    en: "No archive is connected, so there are no numbers — and four zeroes here would read as a day when nobody worked.",
    es: "No hay archivo conectado, así que no hay números — y cuatro ceros acá se leerían como un día en que nadie trabajó.",
  },
  todayOpen: { en: "Open the day", es: "Abrir el día" },
  todayNotFiled: { en: "Still to file", es: "Faltan por entregar" },

  // The capability inventory
  whatItDoes: { en: "What it does", es: "Qué hace" },
  groupPhone: { en: "On the phone", es: "En el teléfono" },
  groupTranslator: { en: "The translator", es: "El traductor" },
  groupOutputs: { en: "What comes out", es: "Lo que sale" },
  groupOffice: { en: "In the office", es: "En la oficina" },

  itmSteps: {
    en: "Six steps instead of a sheet with 200 boxes.",
    es: "Seis pasos en vez de una hoja con 200 casillas.",
  },
  itmSearchAdd: {
    en: "Search-and-add: nothing is drawn until you type. The paper printed 200 rows and the foreman ticked five.",
    es: "Buscar-y-agregar: no se dibuja nada hasta que escribís. El papel imprimía 200 filas y el capataz marcaba cinco.",
  },
  itmApplyAll: {
    en: "\"Apply to everyone\" and \"same crew as the last report\" — on a normal day the whole crew works the same hours.",
    es: "«Aplicar a todos» y «misma cuadrilla del último reporte» — en un día normal toda la cuadrilla trabaja las mismas horas.",
  },
  itmAdhoc: {
    en: "Names and materials that were never on the printed list can be written in, and are marked with * in the PDF.",
    es: "Los nombres y materiales que nunca estuvieron en la lista impresa se pueden escribir, y salen marcados con * en el PDF.",
  },
  itmTimes: {
    en: "Four times in, and total, on-site and travel hours come out — with lunch taken off and contradictory times refused.",
    es: "Entran cuatro horarios y salen las horas totales, en sitio y de traslado — con el almuerzo descontado y los horarios que se contradicen rechazados.",
  },
  itmAutosave: {
    en: "Autosaved locally as you type. A dead battery costs nothing.",
    es: "Autoguardado local mientras escribís. Que se muera la batería no cuesta nada.",
  },
  itmQueue: {
    en: "No signal: the report waits in a queue on the phone and retries by itself when the connection comes back.",
    es: "Sin señal: el reporte espera en una cola en el teléfono y se reintenta solo cuando vuelve la conexión.",
  },
  itmSignature: {
    en: "Signatures drawn with a finger, and photos from the job.",
    es: "Firmas con el dedo, y fotos del trabajo.",
  },
  itmPin: {
    en: "A four-digit PIN picks the foreman off the roster once and keeps that phone his for 90 days.",
    es: "Un PIN de cuatro dígitos elige al capataz de la lista una sola vez y deja ese teléfono suyo por 90 días.",
  },

  itmGlossary: {
    en: "A trade glossary, offline and free per use — polymeric sand, bluestone edge, brick joints.",
    es: "Un glosario del oficio, sin internet y sin costo por uso — arena polimérica, borde de piedra azul, juntas de ladrillo.",
  },
  itmCache: {
    en: "The original is never overwritten, and a second click on the same button goes back to it.",
    es: "El original nunca se sobrescribe, y el segundo clic en el mismo botón vuelve a él.",
  },
  itmUnknown: {
    en: "Words it did not recognise are shown on screen, so nobody trusts the result blindly.",
    es: "Las palabras que no reconoció se muestran en pantalla, para que nadie confíe a ciegas en el resultado.",
  },
  itmSwap: {
    en: "One interface, one line to change: swap the glossary for an API and nothing else in the app notices.",
    es: "Una interfaz y una línea que cambiar: reemplazá el glosario por una API y nada más en la app se entera.",
  },

  itmPdf: {
    en: "A one-page PDF in the same section order as the printed form.",
    es: "Un PDF de una página, con el mismo orden de secciones que el formulario impreso.",
  },
  itmEmail: {
    en: "An email that is a notification, not the record: summary, PDF attached, and a button into the console.",
    es: "Un email que es una notificación, no el registro: resumen, PDF adjunto y un botón hacia la consola.",
  },
  itmShare: {
    en: "The phone's own share sheet when there is no server to send through.",
    es: "La hoja de compartir del teléfono cuando no hay servidor por donde mandarlo.",
  },
  itmBoth: {
    en: "Whatever was translated travels in both languages.",
    es: "Lo que se tradujo viaja en los dos idiomas.",
  },

  itmDay: {
    en: "The day: four numbers, then who has not filed, then every report — the order a manager asks at 5pm.",
    es: "El día: cuatro números, después quién no entregó, después cada reporte — el orden en que un manager pregunta a las 5pm.",
  },
  itmReview: {
    en: "Approve, or return with a note, over the whole report rather than a summary of it.",
    es: "Aprobar, o devolver con una nota, sobre el reporte entero y no sobre un resumen.",
  },
  itmSearch: {
    en: "Search by date range, client, job number, foreman, crew member and status.",
    es: "Buscar por rango de fechas, cliente, número de trabajo, capataz, persona de cuadrilla y estado.",
  },
  itmUrlFilters: {
    en: "The filters live in the URL, so a search is a link you send on WhatsApp and it arrives showing the same thing.",
    es: "Los filtros viven en la URL, así que una búsqueda es un link que mandás por WhatsApp y llega mostrando lo mismo.",
  },
  itmPerson: {
    en: "One person's week, Monday to Sunday, with the days nobody wrote hours for counted separately — payroll needs that before it pays.",
    es: "La semana de una persona, de lunes a domingo, contando aparte los días en que nadie anotó las horas — la nómina necesita eso antes de pagar.",
  },
  itmIdempotent: {
    en: "Filing the same report twice is a no-op. The queue retries, and payroll must not count the day twice.",
    es: "Archivar dos veces el mismo reporte no hace nada. La cola reintenta, y la nómina no puede contar el día dos veces.",
  },

  // Every screen
  routes: { en: "Every screen", es: "Todas las pantallas" },
  routesHint: {
    en: "Eight screens. The two with a name in the address are reached from inside, not typed.",
    es: "Ocho pantallas. Las dos que llevan un nombre en la dirección se alcanzan desde adentro, no se escriben.",
  },
  rtChooser: { en: "Two doors: report, or administration.", es: "Dos puertas: reporte, o administración." },
  rtStatus: { en: "This page — what is switched on.", es: "Esta página — qué está encendido." },
  rtField: { en: "The wizard a foreman fills in.", es: "El asistente que llena el capataz." },
  rtSignIn: { en: "The console's door.", es: "La puerta de la consola." },
  rtDay: { en: "Today's board.", es: "El tablero de hoy." },
  rtSearch: { en: "Search across every report ever filed.", es: "Buscar entre todos los reportes archivados." },
  rtReport: { en: "One report, whole, with approve and return.", es: "Un reporte entero, con aprobar y devolver." },
  rtPerson: { en: "One person's week, for payroll.", es: "La semana de una persona, para la nómina." },
  reachedFrom: { en: "Reached from", es: "Se llega desde" },
  fromReportCard: { en: "a report card", es: "una tarjeta de reporte" },
  fromCrewName: { en: "a name in the crew", es: "un nombre en la cuadrilla" },
} as const;

export type HomeKey = keyof typeof HOME;

/** The overview is Spanish-first — see the note on `HOME`. */
export const HOME_LANG: Lang = "es";

export function th(key: HomeKey, lang: Lang = HOME_LANG): string {
  return HOME[key][lang];
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
