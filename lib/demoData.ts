import { CREW } from "./catalog";
import { workdays } from "./officeDate";
import { emptyDescription } from "./types";
import type {
  CrewEntry,
  EquipmentEntry,
  JobReport,
  MaterialEntry,
  PlantEntry,
  SubcontractorEntry,
  TruckEntry,
} from "./types";

/**
 * A month and a half of reports that never happened.
 *
 * Built so the console can be shown to somebody before a single crew has used
 * it — five crews, Monday to Saturday, six weeks — and so that everything the
 * office screens claim to do has something to do it to.
 *
 * Three rules hold throughout, and they are what separate this from a fixture:
 *
 * 1. **It produces `JobReport`s, not rows.** The seed hands each one to
 *    `buildSubmission()` — the same function the phone calls — so the totals,
 *    the flags and the initial status are computed by production code. Demo data
 *    that took a shortcut around that could look right and be impossible.
 * 2. **It is deterministic.** One PRNG, walked in a fixed order, so the same
 *    range always produces the same reports down to the minute. A demo that
 *    looked different every time it was prepared could not be rehearsed.
 * 3. **It is not clean.** Perfect data makes the console look decorative: the
 *    missing-reports panel is empty, the review queue is empty, and the heat map
 *    is a solid rectangle. The gaps below are the point, not an oversight.
 */

/** Every id this file writes starts here, which is what makes it removable. */
export const DEMO_PREFIX = "demo:";

export function isDemoId(clientId: string): boolean {
  return clientId.startsWith(DEMO_PREFIX);
}

/* ------------------------------------------------------------------ */
/* Randomness that is the same every time                              */
/* ------------------------------------------------------------------ */

/** mulberry32 — small, fast, and identical on every machine. */
function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = {
  /** [0, 1) */
  next: () => number;
  /** Integer in [min, max]. */
  int: (min: number, max: number) => number;
  pick: <T>(items: readonly T[]) => T;
  /** `n` distinct items, or all of them if the pool is smaller. */
  some: <T>(items: readonly T[], n: number) => T[];
  /** True with probability `p`. */
  chance: (p: number) => boolean;
};

function rngFrom(seed: number): Rng {
  const next = prng(seed);
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));

  return {
    next,
    int,
    pick: (items) => items[int(0, items.length - 1)],
    some: (items, n) => {
      const pool = [...items];
      const out: (typeof pool)[number][] = [];
      const take = Math.min(n, pool.length);
      for (let i = 0; i < take; i++) out.push(...pool.splice(int(0, pool.length - 1), 1));
      return out;
    },
    chance: (p) => next() < p,
  };
}

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

function addDays(isoDate: string, days: number): string {
  const at = new Date(`${isoDate}T12:00:00Z`);
  at.setUTCDate(at.getUTCDate() + days);
  return at.toISOString().slice(0, 10);
}

/** 0 = Sunday. Sunday is the one day nobody is out. */
function weekday(isoDate: string): number {
  return new Date(`${isoDate}T12:00:00Z`).getUTCDay();
}

function clock(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** Times on a paper form are written to the nearest five minutes, never 07:13. */
function toFive(minutes: number): number {
  return Math.round(minutes / 5) * 5;
}

/**
 * An ISO stamp for `minutes` past midnight on `date`, in the company's summer
 * offset. Minutes past 24h roll the date forward, which is the only way a
 * sixteen-hour day gets a filing time that comes after the work.
 */
function filedAt(date: string, minutes: number): string {
  const shifted = addDays(date, Math.floor(minutes / 1440));
  return new Date(`${shifted}T${clock(minutes)}:00-04:00`).toISOString();
}

/* ------------------------------------------------------------------ */
/* The five crews                                                      */
/* ------------------------------------------------------------------ */

export type DemoCrew = {
  id: string;
  /** Roster id of the foreman — the seed looks up his account by this. */
  foremanId: string;
  /** Roster ids of the people who ride with him most days. */
  memberIds: string[];
  kind: "construction" | "planting";
};

/**
 * Real names from `lib/catalog.ts`, grouped the way the company actually works:
 * three masonry crews and two planting crews, each with a foreman who drives.
 *
 * The membership is a habit, not a rule — `crewFor()` drops somebody most weeks
 * and borrows from another crew now and then, because a roster that never moved
 * would make "one person's week" a screen with nothing to say.
 */
export const DEMO_CREWS: DemoCrew[] = [
  {
    id: "crew-1",
    foremanId: "aguilar-miguel",
    memberIds: ["sumba-flavio", "aguilar-danny", "montes-cesar", "chacon-mateo"],
    kind: "construction",
  },
  {
    id: "crew-2",
    foremanId: "santander-carlos",
    memberIds: ["marin-ramirez-juan", "giron-cristian", "chacon-dennis"],
    kind: "construction",
  },
  {
    id: "crew-3",
    foremanId: "tix-tix-domingo",
    memberIds: ["borja-alejandro", "aguilar-ebedic", "sislema-jordy"],
    kind: "construction",
  },
  {
    id: "crew-4",
    foremanId: "guadron-michael",
    memberIds: ["gomez-obispo", "lima-luis", "gutierrez-esvin"],
    kind: "planting",
  },
  {
    id: "crew-5",
    foremanId: "patino-jhelsson",
    memberIds: ["munoz-harry", "pan-tux-jesus", "guadron-jorge"],
    kind: "planting",
  },
];

/** The two foremen above who have no account yet. The seed creates them. */
export const DEMO_FOREMEN = DEMO_CREWS.map((crew) => crew.foremanId);

const ROSTER = new Map(CREW.map((member) => [member.id, member]));

function rosterEntry(id: string, hours: number | null): CrewEntry {
  const member = ROSTER.get(id);
  return {
    id,
    name: member?.name ?? id,
    roles: member?.roles ?? ["SL"],
    hours,
  };
}

/* ------------------------------------------------------------------ */
/* The work                                                            */
/* ------------------------------------------------------------------ */

type Job = {
  client: string;
  jobNumber: string;
  kind: "construction" | "planting";
  /** Working days this job keeps a crew busy — jobs last weeks, not hours. */
  length: number;
};

/**
 * The book of work.
 *
 * Jobs run for days on end on purpose. A generator that picked a fresh client
 * every morning would produce forty clients of one day each, and "which client
 * ate the hours" would be forty identical bars — a chart that is technically
 * correct and says nothing.
 */
const JOBS: Job[] = [
  { client: "Weinstein Residence", jobNumber: "2155", kind: "construction", length: 11 },
  { client: "Ferrante Patio", jobNumber: "2160", kind: "construction", length: 8 },
  { client: "Hollis Pool Deck", jobNumber: "2163", kind: "construction", length: 14 },
  { client: "Dutra Retaining Wall", jobNumber: "2171", kind: "construction", length: 9 },
  { client: "Kaplan Driveway", jobNumber: "2174", kind: "construction", length: 6 },
  { client: "Mancuso Walkway", jobNumber: "2180", kind: "construction", length: 7 },
  { client: "Brookside Steps", jobNumber: "2184", kind: "construction", length: 10 },
  { client: "Ridgewood Country Club", jobNumber: "2101", kind: "planting", length: 12 },
  { client: "Sagarese Front Beds", jobNumber: "2188", kind: "planting", length: 5 },
  { client: "Talbot Screening", jobNumber: "2192", kind: "planting", length: 9 },
  { client: "Oakhill Maintenance", jobNumber: "2044", kind: "planting", length: 7 },
  { client: "Levine Meadow", jobNumber: "2196", kind: "planting", length: 6 },
];

/** Owned outright. Its hours are a fact about utilisation, not about spend. */
const OWNED_EQUIPMENT = [
  { id: "skid-steer", en: "Skid Steer", es: "Minicargadora" },
  { id: "sm-skid-steer", en: "Sm Skid Steer / Dingo", es: "Minicargadora pequeña / Dingo" },
  { id: "plate-compactor", en: "Plate Compactor", es: "Placa compactadora" },
  { id: "jumping-jack", en: "Jumping Jack", es: "Compactador de salto" },
  { id: "concrete-mixer", en: "Concrete Mixer", es: "Mezcladora de concreto" },
  { id: "diamond-cut-saw", en: "Diamond Cut Saw", es: "Sierra de diamante" },
  { id: "jack-hammer", en: "Jack Hammer", es: "Martillo neumático" },
  { id: "power-wash", en: "Power Wash", es: "Hidrolavadora" },
  { id: "chainsaw", en: "Chainsaw", es: "Motosierra" },
  { id: "backpack-blower", en: "Backpack Blower", es: "Sopladora de mochila" },
  { id: "line-trimmer", en: "Line Trimmer", es: "Desbrozadora" },
];

/** Rented by the day. Every hour on this list is money leaving the company. */
const RENTED_EQUIPMENT = [
  { id: "big-excavator", en: "Big Excavator", es: "Excavadora grande" },
  { id: "regular-excavator", en: "Regular Excavator", es: "Excavadora regular" },
  { id: "mini-excavator", en: "Mini Excavator", es: "Mini excavadora" },
  { id: "backhoe", en: "Backhoe", es: "Retroexcavadora" },
  { id: "loader", en: "Loader", es: "Cargador" },
  { id: "wood-chipper", en: "Wood Chipper", es: "Trituradora de madera" },
];

/** Out of the yard: already bought, already paid for, still worth counting. */
const YARD_MATERIALS = [
  { id: "topsoil", en: "Topsoil", es: "Tierra vegetal", unit: 42 },
  { id: "mulch", en: "Mulch", es: "Mantillo", unit: 38 },
  { id: "sand", en: "Sand", es: "Arena", unit: 29 },
  { id: "stone-dust", en: "Stone Dust", es: "Polvo de piedra", unit: 34 },
  { id: "dga", en: "DGA", es: "DGA (agregado denso)", unit: 31 },
  { id: "three-quarters-clean", en: '3/4" Clean', es: 'Grava limpia 3/4"', unit: 44 },
  { id: "fabric", en: "Fabric", es: "Tela geotextil", unit: 18 },
  { id: "stakes", en: "Stakes", es: "Estacas", unit: 4 },
  { id: "hay", en: "Hay", es: "Heno", unit: 12 },
  { id: "seed", en: "Seed", es: "Semilla", unit: 26 },
];

/** Bought for this job. This is the line an invoice can be held against. */
const BOUGHT_MATERIALS = [
  { id: "bluestone", en: "Bluestone", es: "Piedra azul", unit: 168 },
  { id: "mortar-mix", en: "Mortar Mix", es: "Mezcla de mortero", unit: 14 },
  { id: "concrete-mix", en: "Concrete Mix", es: "Mezcla de concreto", unit: 11 },
  { id: "cement", en: "Cement", es: "Cemento", unit: 17 },
  { id: "boulders", en: "Boulders", es: "Rocas grandes", unit: 210 },
  { id: "rebar", en: "Rebar", es: "Varilla / acero de refuerzo", unit: 22 },
  { id: "wire-mesh", en: "Wire Mesh", es: "Malla de alambre", unit: 36 },
  { id: "drainage-pipe", en: "Drainage Pipe", es: "Tubo de drenaje", unit: 48 },
  { id: "drainage-box", en: "Drainage Box", es: "Caja de drenaje", unit: 62 },
  { id: "pvc-pipe", en: "PVC Pipe", es: "Tubo de PVC", unit: 19 },
  { id: "sod", en: "Sod", es: "Césped en rollo", unit: 58 },
];

const TRUCK_POOL = [
  { id: "super-duty-dump", en: "Super Duty Dump", es: "Volquete super duty" },
  { id: "med-duty-dump", en: "Med. Duty Dump", es: "Volquete mediano" },
  { id: "light-duty-truck", en: "Light Duty Truck", es: "Camioneta ligera" },
  { id: "trailer", en: "Trailer", es: "Remolque" },
];

const PLANTS: { category: PlantEntry["category"]; name: string; size: string; unit: number }[] = [
  { category: "tree", name: "Skyrocket Juniper", size: "6-7'", unit: 185 },
  { category: "tree", name: "Green Giant Arborvitae", size: "7-8'", unit: 210 },
  { category: "tree", name: "River Birch (clump)", size: '2.5"', unit: 340 },
  { category: "shrub", name: "Boxwood Green Velvet", size: "24-30\"", unit: 62 },
  { category: "shrub", name: "Hydrangea Limelight", size: "5 gal", unit: 48 },
  { category: "shrub", name: "Inkberry Holly", size: "3 gal", unit: 39 },
  { category: "perennial", name: "Nepeta Walker's Low", size: "1 gal", unit: 14 },
  { category: "perennial", name: "Hosta Patriot", size: "1 gal", unit: 12 },
  { category: "perennial", name: "Karl Foerster Grass", size: "2 gal", unit: 19 },
  { category: "annual", name: "Begonia (flat)", size: "flat", unit: 26 },
];

const VENDORS = ["Braen Supply", "Shemin Nursery", "Halka Nurseries", "County Concrete", "Bergen Brick"];

/** Written the way a foreman writes them: Spanish first, English cached beside. */
const CONSTRUCTION_WORK: { es: string; en: string }[] = [
  {
    es: "Continuamos con el borde de piedra azul en el patio trasero y nivelamos la base con polvo de piedra.",
    en: "Continued the bluestone edge in the back yard and levelled the base with stone dust.",
  },
  {
    es: "Excavamos para el muro de contencion y sacamos el material sobrante a la yarda.",
    en: "Excavated for the retaining wall and hauled the spoil back to the yard.",
  },
  {
    es: "Instalamos arena polimerica en las aceras y limpiamos las juntas de ladrillo.",
    en: "Installed polymeric sand in the sidewalks and cleaned the brick joints.",
  },
  {
    es: "Colocamos el drenaje detras del muro y conectamos la caja al tubo existente.",
    en: "Set the drainage behind the wall and tied the box into the existing pipe.",
  },
  {
    es: "Compactamos la base del camino y empezamos a asentar los adoquines desde la calle.",
    en: "Compacted the driveway base and started setting pavers from the street.",
  },
  {
    es: "Cortamos y asentamos los escalones de piedra, y rellenamos los costados con tierra.",
    en: "Cut and set the stone steps, and backfilled the sides with soil.",
  },
  {
    es: "Terminamos el encofrado de la losa y colamos concreto en la mitad del patio.",
    en: "Finished the slab forms and poured concrete on half of the patio.",
  },
  {
    es: "Limpiamos el sitio, cargamos escombro y devolvimos el equipo rentado.",
    en: "Cleaned the site, loaded debris and returned the rented equipment.",
  },
];

const PLANTING_WORK: { es: string; en: string }[] = [
  {
    es: "Plantamos la hilera de arborvitae en el lindero y los estacamos contra el viento.",
    en: "Planted the arborvitae row along the property line and staked them against the wind.",
  },
  {
    es: "Preparamos las camas del frente con mezcla para plantar y colocamos los arbustos.",
    en: "Prepared the front beds with planting mix and set the shrubs.",
  },
  {
    es: "Pusimos mantillo en todas las camas y recortamos el borde con la orilladora.",
    en: "Mulched every bed and cut the edge with the trimmer.",
  },
  {
    es: "Sacamos el cesped viejo, nivelamos y colocamos cesped en rollo en el jardin lateral.",
    en: "Stripped the old lawn, graded it and laid sod in the side garden.",
  },
  {
    es: "Plantamos las perennes segun el plano y regamos todo antes de irnos.",
    en: "Planted the perennials to the drawing and watered everything before leaving.",
  },
  {
    es: "Podamos los setos, limpiamos las hojas y soplamos las aceras.",
    en: "Trimmed the hedges, cleared the leaves and blew off the walkways.",
  },
];

const DISPOSALS = [
  "2 cargas de escombro a la yarda",
  "1 carga de tierra al dumpster",
  "Ramas y hojas a la pila de compost",
  "3 cargas de concreto viejo al reciclaje",
  "",
  "",
];

/* ------------------------------------------------------------------ */
/* One report                                                          */
/* ------------------------------------------------------------------ */

function money(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * A crew for one day.
 *
 * Somebody is out most weeks and now and then a hand is borrowed from another
 * crew, because a roster that never moved would make "one person's week" a
 * screen with nothing on it. The hours start from the paid day and then drift:
 * one man leaves early, another stays to finish a pour.
 */
function crewFor(rng: Rng, crew: DemoCrew, dayHours: number): CrewEntry[] {
  const base = Math.round(dayHours * 4) / 4;

  const present = crew.memberIds.filter(() => rng.chance(0.86));
  // Never send a foreman out alone — an empty crew is a different flag, and this
  // generator raises that one deliberately or not at all.
  if (present.length === 0) present.push(crew.memberIds[0]);

  const ids = [crew.foremanId, ...present];

  // A hand borrowed from another crew, roughly one day in six.
  if (rng.chance(0.16)) {
    const other = rng.pick(DEMO_CREWS.filter((c) => c.id !== crew.id));
    const borrowed = rng.pick(other.memberIds);
    if (!ids.includes(borrowed)) ids.push(borrowed);
  }

  const members = ids.map((id) => {
    const drift = rng.chance(0.22) ? rng.pick([-2, -1.5, -1, -0.5, 0.5, 1]) : 0;
    return rosterEntry(id, Math.max(2, base + drift));
  });

  // A name written in the margin, exactly as the paper form gets used. It is
  // stored with a null personId, so the console has a real one to show.
  if (rng.chance(0.05)) {
    members.push({
      id: `adhoc-${rng.int(1000, 9999)}`,
      name: rng.pick(["Benjamin Mozza", "Luis (temporal)", "Wilmer Pineda"]),
      roles: ["SL"],
      hours: base,
      adhoc: true,
    });
  }

  return members;
}

function equipmentFor(rng: Rng, kind: DemoCrew["kind"], rental: string | null, dayHours: number): EquipmentEntry[] {
  const out: EquipmentEntry[] = [];

  const ownedPool =
    kind === "planting"
      ? OWNED_EQUIPMENT.filter((item) => item.id !== "concrete-mixer" && item.id !== "jack-hammer")
      : OWNED_EQUIPMENT;

  for (const item of rng.some(ownedPool, rng.int(1, 3))) {
    out.push({
      id: item.id,
      label: { en: item.en, es: item.es },
      owner: "BTN",
      qty: 1,
      hours: Math.max(1, Math.round((dayHours * rng.next() * 0.9) * 2) / 2),
    });
  }

  if (rental) {
    const item = RENTED_EQUIPMENT.find((e) => e.id === rental);
    if (item) {
      out.push({
        id: item.id,
        label: { en: item.en, es: item.es },
        owner: "RENTAL",
        qty: 1,
        // A rental is charged by the day whether it runs or not, which is the
        // whole reason the office wants to see these hours next to the owned ones.
        hours: Math.max(2, Math.round(dayHours * (0.45 + rng.next() * 0.5) * 2) / 2),
      });
    }
  }

  return out;
}

function materialsFor(rng: Rng, kind: DemoCrew["kind"]): MaterialEntry[] {
  const out: MaterialEntry[] = [];

  for (const item of rng.some(YARD_MATERIALS, rng.int(1, 3))) {
    const qty = rng.int(1, 8);
    out.push({
      id: item.id,
      label: { en: item.en, es: item.es },
      source: "BTN",
      qty,
      cost: money(qty * item.unit * (0.9 + rng.next() * 0.2)),
    });
  }

  if (kind === "construction" ? rng.chance(0.75) : rng.chance(0.4)) {
    for (const item of rng.some(BOUGHT_MATERIALS, rng.int(1, 2))) {
      const qty = rng.int(1, 6);
      out.push({
        id: item.id,
        label: { en: item.en, es: item.es },
        source: "OTHER",
        qty,
        cost: money(qty * item.unit * (0.9 + rng.next() * 0.25)),
      });
    }
  }

  // The one the paper form did not print, written in by hand. It is the example
  // in the README, and it is why `adhoc` exists.
  if (rng.chance(0.08)) {
    const qty = rng.int(2, 10);
    out.push({
      id: `adhoc-polymeric-${rng.int(100, 999)}`,
      label: { en: "Polymeric Sand", es: "Arena polimérica" },
      source: "OTHER",
      qty,
      cost: money(qty * 32),
      adhoc: true,
    });
  }

  return out;
}

function plantsFor(rng: Rng): PlantEntry[] {
  return rng.some(PLANTS, rng.int(1, 3)).map((plant, index) => {
    const qty = rng.int(3, 24);
    return {
      id: `plant-${index}-${plant.category}`,
      category: plant.category,
      name: plant.name,
      qty,
      size: plant.size,
      vendor: rng.pick(VENDORS),
      cost: money(qty * plant.unit * (0.95 + rng.next() * 0.15)),
    };
  });
}

function subcontractorsFor(rng: Rng): SubcontractorEntry[] {
  if (!rng.chance(0.12)) return [];
  const trade = rng.pick([
    { id: "plumber", en: "Plumber", es: "Plomero" },
    { id: "electrician", en: "Electrician", es: "Electricista" },
    { id: "irrigation", en: "Irrigation", es: "Riego" },
    { id: "fence", en: "Fence", es: "Cerca" },
  ]);
  return [
    {
      id: `sub-${trade.id}`,
      trade: trade.id,
      tradeLabel: { en: trade.en, es: trade.es },
      vendor: rng.pick(["Vaccaro & Son", "Northside Electric", "Rain Bird Services", "Colonial Fence"]),
      description: rng.pick([
        "Movio la linea de riego antes de que colaramos.",
        "Conecto la luz del patio.",
        "Reparo la cerca del lindero.",
        "Reviso la bomba de la fuente.",
      ]),
    },
  ];
}

function trucksFor(rng: Rng, dayHours: number): TruckEntry[] {
  return rng.some(TRUCK_POOL, rng.int(1, 2)).map((truck) => ({
    id: truck.id,
    label: { en: truck.en, es: truck.es },
    hours: Math.max(1, Math.round(dayHours * (0.5 + rng.next() * 0.5) * 2) / 2),
  }));
}

/* ------------------------------------------------------------------ */
/* The schedule                                                        */
/* ------------------------------------------------------------------ */

type Assignment = {
  job: Job;
  /** The rental this job is holding today, if any. */
  rental: string | null;
};

/**
 * What each crew is on, day by day.
 *
 * A job is picked, held for its length, then the crew moves to the next one.
 * Rentals are booked in stretches inside a job rather than sprinkled a day at a
 * time — an excavator comes on a trailer and stays for the week, and the whole
 * point of charting rental hours is to make that stretch visible.
 */
function scheduleFor(rng: Rng, crew: DemoCrew, days: string[]): Map<string, Assignment> {
  const pool = JOBS.filter((job) => job.kind === crew.kind);
  const plan = new Map<string, Assignment>();

  let jobIndex = rng.int(0, pool.length - 1);
  let left = rng.int(2, pool[jobIndex].length);
  let rental: string | null = null;
  let rentalLeft = 0;

  for (const date of days) {
    if (left <= 0) {
      jobIndex = (jobIndex + 1 + rng.int(0, 1)) % pool.length;
      left = pool[jobIndex].length;
      rental = null;
      rentalLeft = 0;
    }

    if (rentalLeft <= 0) {
      rental = null;
      // Construction rents far more than planting does, and neither rents daily.
      const wants = crew.kind === "construction" ? 0.18 : 0.07;
      if (rng.chance(wants)) {
        rental = rng.pick(RENTED_EQUIPMENT).id;
        rentalLeft = rng.int(2, 5);
      }
    }

    plan.set(date, { job: pool[jobIndex], rental });
    left--;
    rentalLeft--;
  }

  return plan;
}

/* ------------------------------------------------------------------ */
/* Generation                                                          */
/* ------------------------------------------------------------------ */

export type DemoReport = {
  report: JobReport;
  /** Roster id of the foreman, so the seed can attach the right account. */
  foremanId: string;
  crewId: string;
};

export type DemoRange = {
  from: string;
  to: string;
  /**
   * The last day, treated as in progress: only some crews have filed. Leave it
   * unset for a range that is entirely in the past.
   */
  partialLastDay?: boolean;
};

/**
 * Every report in the range, oldest first.
 *
 * One PRNG for the whole run, walked crew by crew and then day by day. The order
 * is what makes it reproducible, so nothing here may become concurrent without
 * also becoming seeded per report.
 */
export function demoReports({ from, to, partialLastDay = true }: DemoRange): DemoReport[] {
  const rng = rngFrom(0x7bd0c0de);
  const days = workdays(from, to);
  const out: DemoReport[] = [];

  // Two long days across the whole month, planted rather than left to chance —
  // the flag is worth exactly one example, and zero of them is the failure.
  const longDayFor = new Map<string, number>([
    [`crew-2:${days[Math.floor(days.length * 0.3)] ?? ""}`, 1],
    [`crew-4:${days[Math.floor(days.length * 0.72)] ?? ""}`, 1],
  ]);

  for (const crew of DEMO_CREWS) {
    const plan = scheduleFor(rng, crew, days);

    for (const date of days) {
      const assignment = plan.get(date);
      if (!assignment) continue;

      // The last day is still happening: two of the five crews are not back yet.
      const isLastDay = date === days[days.length - 1];
      if (isLastDay && partialLastDay && (crew.id === "crew-3" || crew.id === "crew-5")) continue;

      // Rain, a day off, a truck in the shop. These are the gaps the heat map
      // exists to show, and Saturdays are quieter than the rest of the week.
      const offChance = weekday(date) === 6 ? 0.26 : 0.06;
      if (rng.chance(offChance)) continue;

      out.push(buildReport(rng, crew, date, assignment, longDayFor.has(`${crew.id}:${date}`)));
    }
  }

  return out.sort((a, b) => a.report.date.localeCompare(b.report.date));
}

function buildReport(
  rng: Rng,
  crew: DemoCrew,
  date: string,
  assignment: Assignment,
  longDay: boolean
): DemoReport {
  const { job, rental } = assignment;

  const startYard = toFive(6 * 60 + 30 + rng.int(0, 45));
  const outbound = toFive(rng.int(20, 65));
  const onSite = longDay
    ? toFive(rng.int(15, 16) * 60 + 30)
    : toFive(rng.int(6 * 60 + 15, 8 * 60 + 45));
  const inbound = toFive(rng.int(20, 65));

  const startJob = startYard + outbound;
  const endJob = startJob + onSite;
  const endYard = endJob + inbound;

  const lunchMinutes = 30;
  const dayHours = (endYard - startYard - lunchMinutes) / 60;

  const crewMembers = crewFor(rng, crew, dayHours);

  // Somebody's hours left blank. It is the most common real mistake on the paper
  // form, it raises `warnNoHours`, and it is what puts a report in the review
  // queue without anybody having to notice it.
  if (rng.chance(0.1) && crewMembers.length > 1) {
    crewMembers[rng.int(1, crewMembers.length - 1)].hours = null;
  }

  const work = rng.pick(crew.kind === "planting" ? PLANTING_WORK : CONSTRUCTION_WORK);
  const trips = rng.int(1, 3);

  const report: JobReport = {
    id: `${DEMO_PREFIX}${date}:${crew.id}`,
    formVersion: "YW 6/5/26",
    filledInLang: "es",

    date,
    clientName: job.client,
    jobNumbers: [job.jobNumber],
    truckNumbers: [],

    startYard: clock(startYard),
    startJob: clock(startJob),
    endJob: clock(endJob),
    endYard: clock(endYard),
    lunchMinutes,

    crew: crewMembers,
    description: {
      ...emptyDescription("es"),
      original: work.es,
      originalLang: "es",
      translation: work.en,
      translationLang: "en",
    },
    photos: [],
    equipment: equipmentFor(rng, crew.kind, rental, dayHours),
    materials: materialsFor(rng, crew.kind),
    plants: crew.kind === "planting" && rng.chance(0.7) ? plantsFor(rng) : [],
    subcontractors: subcontractorsFor(rng),
    trucks: trucksFor(rng, dayHours),

    mileageTrips: trips,
    mileageWhere: rng.pick(["Braen Supply", "La yarda", "Shemin", "County Concrete", "El dumpster"]),
    disposals: rng.pick(DISPOSALS),
    notes: rng.chance(0.25)
      ? rng.pick([
          "Falta material para terminar el lado norte.",
          "El cliente pidio mover el borde 6 pulgadas.",
          "Llovio despues del almuerzo, paramos temprano.",
          "Se poncho una llanta del remolque.",
        ])
      : "",

    foremanSignature: null,
    projectManagerSignature: null,
    // Filed from the truck on the way back, which is when they really get sent.
    // A 16-hour day lands past midnight, so the stamp rolls onto the next date
    // rather than wrapping backwards and reading as filed before it started.
    submittedAt: filedAt(date, endYard + rng.int(5, 90)),
  };

  // Trucks are recorded twice on the paper form — as numbers at the top and as
  // hours at the bottom — so the demo fills both, or the header reads empty.
  report.truckNumbers = report.trucks.map((truck) => truck.label.en);

  return { report, foremanId: crew.foremanId, crewId: crew.id };
}
