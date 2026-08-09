export type Lang = "es" | "en";

/** Bilingual label — every catalog item carries both languages. */
export type L10n = { en: string; es: string };

export type Owner = "BTN" | "RENTAL";
export type Source = "BTN" | "OTHER";

export type CrewMember = {
  id: string;
  name: string;
  /** Role codes printed on the paper form: M, F, D, SL, LD, LDS, AA, SLD, PM, CM, COS, VP */
  roles: string[];
  group: CrewGroup;
};

export type CrewGroup =
  | "construction_mgmt"
  | "construction_field"
  | "operations"
  | "design_sales"
  | "planting"
  | "finance_admin";

export type CatalogItem = { id: string; label: L10n };

/* ---------- Report shape ---------- */

export type CrewEntry = {
  id: string;
  name: string;
  roles: string[];
  hours: number | null;
  /** true when the foreman typed the name in (paper equivalent: writing it in the margin) */
  adhoc?: boolean;
};

export type EquipmentEntry = {
  id: string;
  label: L10n;
  owner: Owner;
  qty: number | null;
  hours: number | null;
  adhoc?: boolean;
};

export type MaterialEntry = {
  id: string;
  label: L10n;
  source: Source;
  qty: number | null;
  cost: number | null;
  adhoc?: boolean;
};

export type PlantEntry = {
  id: string;
  category: "tree" | "shrub" | "perennial" | "annual";
  name: string;
  qty: number | null;
  size: string;
  vendor: string;
  cost: number | null;
};

export type SubcontractorEntry = {
  id: string;
  trade: string;
  tradeLabel: L10n;
  vendor: string;
  description: string;
};

export type TruckEntry = { id: string; label: L10n; hours: number | null };

export type Description = {
  /** What the foreman actually typed. Never overwritten by a translation. */
  original: string;
  originalLang: Lang;
  /** Cached translation. Cleared whenever `original` changes. */
  translation: string | null;
  translationLang: Lang | null;
  /** Words the offline glossary could not resolve — surfaced to the user. */
  unknownTerms: string[];
  /** true while the UI is showing `translation` instead of `original` */
  showingTranslation: boolean;
};

export type JobReport = {
  formVersion: string;
  filledInLang: Lang;

  date: string; // YYYY-MM-DD
  clientName: string;
  jobNumbers: string[];
  truckNumbers: string[];

  startYard: string; // HH:MM
  startJob: string;
  endJob: string;
  endYard: string;
  /** Unpaid break taken out of the day. 30 unless the foreman changes it. */
  lunchMinutes: number;

  crew: CrewEntry[];
  description: Description;
  /** data-URL JPEGs, downscaled client-side before they ever hit state. */
  photos: string[];
  equipment: EquipmentEntry[];
  materials: MaterialEntry[];
  plants: PlantEntry[];
  subcontractors: SubcontractorEntry[];
  trucks: TruckEntry[];

  mileageTrips: number | null;
  mileageWhere: string;
  disposals: string;
  notes: string;

  /** data-URL PNGs from the signature pads */
  foremanSignature: string | null;
  projectManagerSignature: string | null;

  submittedAt: string | null;
};

export function emptyDescription(lang: Lang): Description {
  return {
    original: "",
    originalLang: lang,
    translation: null,
    translationLang: null,
    unknownTerms: [],
    showingTranslation: false,
  };
}

export function emptyReport(lang: Lang): JobReport {
  const today = new Date();
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;

  return {
    formVersion: "YW 6/5/26",
    filledInLang: lang,
    date: iso,
    clientName: "",
    jobNumbers: [],
    truckNumbers: [],
    startYard: "",
    startJob: "",
    endJob: "",
    endYard: "",
    lunchMinutes: 30,
    crew: [],
    description: emptyDescription(lang),
    photos: [],
    equipment: [],
    materials: [],
    plants: [],
    subcontractors: [],
    trucks: [],
    mileageTrips: null,
    mileageWhere: "",
    disposals: "",
    notes: "",
    foremanSignature: null,
    projectManagerSignature: null,
    submittedAt: null,
  };
}
