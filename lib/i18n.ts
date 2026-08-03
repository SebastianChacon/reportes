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
  downloadPdf: { en: "Download PDF", es: "Descargar PDF" },
  sent: { en: "Report sent", es: "Reporte enviado" },
  sentBody: {
    en: "The office has it. You can start a new report.",
    es: "La oficina ya lo tiene. Puedes empezar un reporte nuevo.",
  },
  newReport: { en: "New report", es: "Reporte nuevo" },
  sendFailed: {
    en: "Could not send. Download the PDF and send it manually, or try again when you have signal.",
    es: "No se pudo enviar. Descarga el PDF y mándalo a mano, o intenta de nuevo cuando tengas señal.",
  },
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

  // Validation
  required: { en: "Required", es: "Obligatorio" },
  missingFields: { en: "Fill these in first:", es: "Llena esto primero:" },
  warnLongDay: { en: "That's more than 16 hours — is it right?", es: "Son más de 16 horas — ¿está bien?" },
  warnEndBeforeStart: { en: "The end time is before the start time", es: "La hora de fin es antes de la de inicio" },
  warnNoCrew: { en: "No crew members added", es: "No agregaste a nadie" },
  warnNoHours: { en: "Some people have no hours", es: "Algunas personas no tienen horas" },

  // Misc
  autosaved: { en: "Saved on this device", es: "Guardado en este dispositivo" },
  startOver: { en: "Start over", es: "Empezar de nuevo" },
  startOverConfirm: {
    en: "Delete this report and start over?",
    es: "¿Borrar este reporte y empezar de nuevo?",
  },
  cancel: { en: "Cancel", es: "Cancelar" },
  confirm: { en: "Yes, delete", es: "Sí, borrar" },
  language: { en: "Language", es: "Idioma" },
  nothingHere: { en: "Nothing added", es: "Nada agregado" },
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
