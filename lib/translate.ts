/**
 * Offline EN⇄ES translator for jobsite descriptions.
 *
 * Strategy: longest-phrase-first glossary matching. It is a *glossing*
 * translator, not a grammar engine — it reliably converts trade vocabulary
 * ("polymeric sand" → "arena polimérica") and the connective tissue around
 * it, and it reports every token it could not resolve so the reader knows
 * exactly how much to trust the output.
 *
 * Everything goes through the `Translator` interface below. To swap in a
 * real MT service later, implement that interface and change `translator`.
 */

import { EQUIPMENT, MATERIALS, SUBCONTRACTOR_TRADES, TRUCKS } from "./catalog";
import type { Lang } from "./types";

export type TranslationResult = {
  text: string;
  /** Tokens left as written because the glossary had no entry. */
  unknownTerms: string[];
};

export interface Translator {
  detect(text: string): Lang;
  translate(text: string, target: Lang): Promise<TranslationResult>;
}

/* ------------------------------------------------------------------ */
/* Glossary — English → Spanish. Reversed automatically.               */
/* Multi-word entries win over single words (longest match first).      */
/* ------------------------------------------------------------------ */

const GLOSSARY: Record<string, string> = {
  /* --- jobsite verbs --- */
  install: "instalar",
  installed: "instalamos",
  installing: "instalando",
  build: "construir",
  built: "construimos",
  dig: "excavar",
  dug: "excavamos",
  excavate: "excavar",
  remove: "quitar",
  removed: "quitamos",
  demo: "demoler",
  demolish: "demoler",
  "clean up": "limpiar",
  clean: "limpiar",
  cleaned: "limpiamos",
  cleaning: "limpiando",
  "set up": "montar",
  "tear out": "arrancar",
  cut: "cortar",
  "cut out": "recortar",
  fill: "rellenar",
  "back fill": "rellenar",
  backfill: "rellenar",
  grade: "nivelar",
  grading: "nivelación",
  level: "nivelar",
  compact: "compactar",
  spread: "esparcir",
  haul: "transportar",
  hauled: "transportamos",
  deliver: "entregar",
  delivered: "entregado",
  "pick up": "recoger",
  "drop off": "dejar",
  plant: "plantar",
  planted: "plantamos",
  planting: "plantación",
  prune: "podar",
  trim: "recortar",
  mow: "cortar el césped",
  water: "regar",
  seed: "sembrar",
  mulch: "poner mantillo",
  edge: "borde",
  edging: "bordeado",
  repair: "reparar",
  repaired: "reparamos",
  fix: "arreglar",
  replace: "reemplazar",
  pour: "vaciar",
  poured: "vaciamos",
  lay: "colocar",
  laid: "colocamos",
  set: "colocar",
  place: "colocar",
  measure: "medir",
  mark: "marcar",
  stake: "estacar",
  wrap: "envolver",
  cover: "cubrir",
  seal: "sellar",
  sweep: "barrer",
  wash: "lavar",
  "power wash": "hidrolavar",
  paint: "pintar",
  weld: "soldar",
  drill: "taladrar",
  connect: "conectar",
  disconnect: "desconectar",
  finish: "terminar",
  finished: "terminamos",
  start: "empezar",
  started: "empezamos",
  continue: "continuar",
  continued: "continuamos",
  complete: "completar",
  completed: "completamos",
  prep: "preparar",
  prepare: "preparar",
  load: "cargar",
  unload: "descargar",
  move: "mover",
  adjust: "ajustar",
  check: "revisar",
  inspect: "inspeccionar",

  /* --- structures & features --- */
  patio: "patio",
  walkway: "andador",
  walkways: "andadores",
  sidewalk: "acera",
  sidewalks: "aceras",
  driveway: "entrada de autos",
  wall: "muro",
  walls: "muros",
  "retaining wall": "muro de contención",
  step: "escalón",
  steps: "escalones",
  stair: "escalera",
  stairs: "escaleras",
  footing: "cimiento",
  footings: "cimientos",
  foundation: "cimentación",
  base: "base",
  "base course": "capa base",
  subbase: "subbase",
  joint: "junta",
  joints: "juntas",
  "brick joint": "junta de ladrillo",
  "brick joints": "juntas de ladrillo",
  paver: "adoquín",
  pavers: "adoquines",
  brick: "ladrillo",
  bricks: "ladrillos",
  block: "bloque",
  blocks: "bloques",
  stone: "piedra",
  stones: "piedras",
  slab: "losa",
  cap: "remate",
  coping: "coronamiento",
  curb: "cordón",
  border: "borde",
  bed: "cantero",
  beds: "canteros",
  lawn: "césped",
  garden: "jardín",
  fence: "cerca",
  gate: "portón",
  deck: "terraza",
  pool: "piscina",
  pond: "estanque",
  fire: "fuego",
  "fire pit": "fogata",
  "outdoor kitchen": "cocina exterior",
  grill: "parrilla",
  pergola: "pérgola",
  trench: "zanja",
  drain: "drenaje",
  drainage: "drenaje",
  pipe: "tubo",
  pipes: "tubos",
  gutter: "canaleta",
  downspout: "bajante",
  irrigation: "riego",
  sprinkler: "aspersor",
  sprinklers: "aspersores",
  head: "cabezal",
  valve: "válvula",
  line: "línea",
  wire: "cable",
  light: "luz",
  lights: "luces",
  lighting: "iluminación",
  "landscape lighting": "iluminación de jardín",

  /* --- materials (beyond the catalog) --- */
  "polymeric sand": "arena polimérica",
  bluestone: "piedra azul",
  fieldstone: "piedra de campo",
  flagstone: "laja",
  limestone: "piedra caliza",
  granite: "granito",
  gravel: "grava",
  stonedust: "polvo de piedra",
  concrete: "concreto",
  cement: "cemento",
  mortar: "mortero",
  sand: "arena",
  soil: "tierra",
  dirt: "tierra",
  topsoil: "tierra vegetal",
  compost: "composta",
  sod: "césped en rollo",
  fabric: "tela",
  geotextile: "geotextil",
  adhesive: "adhesivo",
  caulk: "sellador",
  rebar: "varilla",
  lumber: "madera",
  wood: "madera",
  "root ball": "cepellón",
  fertilizer: "fertilizante",

  /* --- plants --- */
  tree: "árbol",
  trees: "árboles",
  shrub: "arbusto",
  shrubs: "arbustos",
  perennial: "perenne",
  perennials: "perennes",
  annual: "anual",
  annuals: "anuales",
  grass: "pasto",
  flower: "flor",
  flowers: "flores",
  hedge: "seto",
  root: "raíz",
  roots: "raíces",
  branch: "rama",
  branches: "ramas",
  stump: "tocón",

  /* --- equipment --- */
  equipment: "equipo",
  machine: "máquina",
  truck: "camión",
  trucks: "camiones",
  trailer: "remolque",
  dump: "volquete",
  excavator: "excavadora",
  "skid steer": "minicargadora",
  "mini excavator": "mini excavadora",
  backhoe: "retroexcavadora",
  loader: "cargador",
  compactor: "compactadora",
  "plate compactor": "placa compactadora",
  saw: "sierra",
  "cut saw": "sierra de corte",
  jackhammer: "martillo neumático",
  "jack hammer": "martillo neumático",
  chainsaw: "motosierra",
  blower: "sopladora",
  mower: "cortacésped",
  trimmer: "desbrozadora",
  shovel: "pala",
  rake: "rastrillo",
  wheelbarrow: "carretilla",
  hose: "manguera",
  ladder: "escalera de mano",
  hand: "mano",
  tools: "herramientas",

  /* --- places & directions --- */
  house: "casa",
  home: "casa",
  building: "edificio",
  garage: "garaje",
  yard: "patio",
  "front yard": "patio delantero",
  "back yard": "patio trasero",
  backyard: "patio trasero",
  site: "sitio",
  job: "trabajo",
  jobsite: "sitio de trabajo",
  property: "propiedad",
  street: "calle",
  corner: "esquina",
  side: "lado",
  front: "frente",
  back: "atrás",
  rear: "trasero",
  left: "izquierda",
  right: "derecha",
  top: "arriba",
  bottom: "abajo",
  north: "norte",
  south: "sur",
  east: "este",
  west: "oeste",
  around: "alrededor de",
  along: "a lo largo de",
  between: "entre",
  behind: "detrás de",
  "in front of": "enfrente de",
  next: "junto",
  "next to": "junto a",
  near: "cerca de",
  under: "debajo de",
  over: "sobre",
  above: "encima de",
  below: "debajo de",
  inside: "dentro de",
  outside: "fuera de",
  entire: "entero",
  whole: "todo",
  half: "mitad",
  part: "parte",
  section: "sección",
  area: "área",

  /* --- time & quantity --- */
  today: "hoy",
  yesterday: "ayer",
  tomorrow: "mañana",
  morning: "mañana",
  afternoon: "tarde",
  day: "día",
  days: "días",
  hour: "hora",
  hours: "horas",
  week: "semana",
  "half day": "medio día",
  "all day": "todo el día",
  rain: "lluvia",
  rained: "llovió",
  weather: "clima",
  bag: "bolsa",
  bags: "bolsas",
  yard_unit: "yarda",
  yards: "yardas",
  ton: "tonelada",
  tons: "toneladas",
  load_unit: "carga",
  loads: "cargas",
  trip: "viaje",
  trips: "viajes",
  pallet: "paleta",
  pallets: "paletas",
  piece: "pieza",
  pieces: "piezas",
  foot: "pie",
  feet: "pies",
  inch: "pulgada",
  inches: "pulgadas",
  square: "cuadrado",
  linear: "lineal",
  deep: "de profundidad",
  wide: "de ancho",
  long: "de largo",
  thick: "de grosor",

  /* --- connectors & common words --- */
  the: "el",
  a: "un",
  an: "un",
  and: "y",
  or: "o",
  but: "pero",
  with: "con",
  without: "sin",
  for: "para",
  to: "a",
  of: "de",
  on: "en",
  in: "en",
  at: "en",
  from: "desde",
  by: "por",
  we: "nosotros",
  they: "ellos",
  it: "lo",
  this: "este",
  that: "ese",
  these: "estos",
  those: "esos",
  all: "todo",
  some: "algo de",
  more: "más",
  less: "menos",
  new: "nuevo",
  old: "viejo",
  existing: "existente",
  same: "mismo",
  also: "también",
  then: "luego",
  after: "después de",
  before: "antes de",
  because: "porque",
  so: "así que",
  where: "donde",
  when: "cuando",
  was: "estaba",
  were: "estaban",
  is: "es",
  are: "son",
  had: "tenía",
  have: "tener",
  has: "tiene",
  need: "necesita",
  needs: "necesita",
  needed: "se necesitó",
  will: "va a",
  can: "puede",
  not: "no",
  no: "no",
  yes: "sí",
  done: "hecho",
  ready: "listo",
  broken: "roto",
  damaged: "dañado",
  missing: "faltante",
  extra: "extra",
  problem: "problema",
  issue: "problema",
  delay: "retraso",
  waiting: "esperando",
  client: "cliente",
  customer: "cliente",
  owner: "dueño",
  crew: "cuadrilla",
  foreman: "capataz",
  helper: "ayudante",
  supervisor: "supervisor",
};

/**
 * Spanish → English entries that reversing GLOSSARY cannot produce:
 * function words with no 1:1 English partner ("la", "las", "del"), inflected
 * verbs, and the noun-adjective inversions Spanish uses for trade terms.
 * These are merged into the ES→EN direction only.
 */
const GLOSSARY_ES: Record<string, string> = {
  /* --- articles, prepositions, pronouns --- */
  la: "the",
  las: "the",
  los: "the",
  lo: "the",
  una: "a",
  unos: "some",
  unas: "some",
  del: "of the",
  al: "to the",
  "a la": "to the",
  "en la": "in the",
  "en el": "in the",
  "en las": "in the",
  "en los": "in the",
  "de la": "of the",
  "de los": "of the",
  "de las": "of the",
  que: "that",
  se: "",
  nos: "us",
  les: "them",
  su: "their",
  sus: "their",
  mi: "my",
  nuestro: "our",
  cual: "which",
  cuando: "when",
  donde: "where",
  hasta: "until",
  desde: "from",
  hacia: "toward",
  sobre: "on",
  bajo: "under",
  entre: "between",
  segun: "according to",
  aunque: "although",
  mientras: "while",
  ademas: "also",
  luego: "then",
  ya: "already",
  aun: "still",
  solo: "only",
  casi: "almost",
  muy: "very",
  mucho: "a lot",
  poco: "a little",
  bien: "well",
  mal: "badly",
  otro: "another",
  otra: "another",
  otros: "other",
  otras: "other",
  cada: "each",
  toda: "all",
  todas: "all",
  todos: "all",
  varios: "several",
  ambos: "both",

  /* --- conjugated verbs the crews actually write --- */
  hicimos: "we did",
  hizo: "did",
  pusimos: "we put",
  puso: "put",
  sacamos: "we took out",
  trajimos: "we brought",
  llevamos: "we took",
  dejamos: "we left",
  seguimos: "we continued",
  faltó: "was missing",
  falto: "was missing",
  falta: "is missing",
  faltan: "are missing",
  quedo: "was left",
  "quedó": "was left",
  llego: "arrived",
  "llegó": "arrived",
  salio: "left",
  "salió": "left",
  hubo: "there was",
  hay: "there is",
  habia: "there was",
  tuvimos: "we had",
  vamos: "we are going",
  volvimos: "we came back",
  regresamos: "we came back",
  avanzamos: "we made progress",
  revisamos: "we checked",
  medimos: "we measured",
  marcamos: "we marked",
  cargamos: "we loaded",
  descargamos: "we unloaded",
  cavamos: "we dug",
  rellenamos: "we backfilled",
  nivelamos: "we graded",
  compactamos: "we compacted",
  esparcimos: "we spread",
  colocamos: "we laid",
  regamos: "we watered",
  podamos: "we pruned",
  sembramos: "we seeded",
  barrimos: "we swept",
  lavamos: "we washed",
  sellamos: "we sealed",

  /* --- inverted trade terms --- */
  "borde de piedra azul": "bluestone edge",
  "borde de piedra": "stone edge",
  "arena polimerica": "polymeric sand",
  "juntas de ladrillo": "brick joints",
  "junta de ladrillo": "brick joint",
  "muro de piedra": "stone wall",
  "camino de piedra": "stone walkway",
  "base de grava": "gravel base",
  "capa de arena": "sand layer",
  "cocina exterior": "outdoor kitchen",
  "patio delantero": "front yard",
  "patio trasero": "back yard",
  "sitio de trabajo": "jobsite",
  "medio dia": "half day",
  "todo el dia": "all day",
  "dia entero": "full day",
  "horas extras": "overtime",
  "material vegetal": "plant material",
  "sistema de riego": "irrigation system",
  "caja de drenaje": "drainage box",
  "tubo de drenaje": "drainage pipe",
};

/* Words that strongly signal the source language. */
const ES_MARKERS = new Set([
  "el","la","los","las","un","una","unos","unas","de","del","y","o","que","con","sin","por","para","en",
  "se","es","son","fue","fueron","está","están","hoy","ayer","mañana","muy","más","también","pero",
  "instalamos","limpiamos","terminamos","empezamos","hicimos","pusimos","cortamos","quitamos","al","lo",
]);
const EN_MARKERS = new Set([
  "the","and","of","to","in","on","at","for","with","we","is","are","was","were","this","that","it",
  "install","installed","clean","cleaned","finished","started","did","done","from","by","up","out","a","an",
]);

/* ------------------------------------------------------------------ */
/* Build the lookup tables                                             */
/* ------------------------------------------------------------------ */

type Dict = Map<string, string>;

function buildDicts(): { enToEs: Dict; esToEn: Dict; maxWords: { en: number; es: number } } {
  const enToEs: Dict = new Map();
  const esToEn: Dict = new Map();

  const addPair = (en: string, es: string) => {
    // `yard_unit` / `load_unit` disambiguate homographs; strip the suffix.
    const cleanEn = en.replace(/_unit$/, "");
    const k1 = norm(cleanEn);
    const k2 = norm(es);
    if (k1 && !enToEs.has(k1)) enToEs.set(k1, es);
    if (k2 && !esToEn.has(k2)) esToEn.set(k2, cleanEn);
  };

  for (const [en, es] of Object.entries(GLOSSARY)) addPair(en, es);

  // Every catalog item is already bilingual — free glossary coverage.
  for (const item of [...EQUIPMENT, ...MATERIALS, ...SUBCONTRACTOR_TRADES, ...TRUCKS]) {
    addPair(item.label.en, item.label.es);
  }

  // Spanish-side entries override anything the reversal produced.
  for (const [es, en] of Object.entries(GLOSSARY_ES)) {
    esToEn.set(norm(es), en);
  }

  const maxWords = {
    en: Math.max(...[...enToEs.keys()].map((k) => k.split(" ").length)),
    es: Math.max(...[...esToEn.keys()].map((k) => k.split(" ").length)),
  };

  return { enToEs, esToEn, maxWords };
}

/** Lowercase, strip accents and punctuation — used only for lookup keys. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/["'’.,;:!?()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const { enToEs, esToEn, maxWords } = buildDicts();

/* ------------------------------------------------------------------ */
/* Engine                                                              */
/* ------------------------------------------------------------------ */

/** Split into words while keeping punctuation and line breaks as their own tokens. */
function tokenize(text: string): string[] {
  return text.match(/\n+|[A-Za-zÁÉÍÓÚÑÜáéíóúñü0-9/'’-]+|[^\sA-Za-zÁÉÍÓÚÑÜáéíóúñü0-9]/g) ?? [];
}

function isWord(tok: string): boolean {
  return /[A-Za-zÁÉÍÓÚÑÜáéíóúñü]/.test(tok);
}

function isNumeric(tok: string): boolean {
  return /^[0-9/'’-]+$/.test(tok);
}

/** Copy the casing pattern of the source onto the translation. */
function matchCase(source: string, translated: string): string {
  if (source === source.toUpperCase() && source.length > 1) return translated.toUpperCase();
  if (source[0] === source[0]?.toUpperCase()) {
    return translated.charAt(0).toUpperCase() + translated.slice(1);
  }
  return translated;
}

function detect(text: string): Lang {
  const words = norm(text).split(" ").filter(Boolean);
  let es = 0;
  let en = 0;
  for (const w of words) {
    if (ES_MARKERS.has(w)) es++;
    if (EN_MARKERS.has(w)) en++;
  }
  // Accented characters and ñ are a strong Spanish signal on their own.
  if (/[áéíóúñü¿¡]/i.test(text)) es += 2;
  return es > en ? "es" : "en";
}

function glossText(text: string, from: Lang): TranslationResult {
  const dict = from === "en" ? enToEs : esToEn;
  const window = from === "en" ? maxWords.en : maxWords.es;
  const tokens = tokenize(text);
  const out: string[] = [];
  const unknown: string[] = [];

  let i = 0;
  while (i < tokens.length) {
    const tok = tokens[i];

    if (!isWord(tok)) {
      out.push(tok);
      i++;
      continue;
    }

    // Longest phrase first: try N-word windows down to 1.
    let matched = false;
    for (let n = Math.min(window, tokens.length - i); n >= 1; n--) {
      const slice = tokens.slice(i, i + n);
      if (slice.some((s) => !isWord(s) && !isNumeric(s))) continue;
      const hit = dict.get(norm(slice.join(" ")));
      if (hit !== undefined) {
        // An empty mapping means "this word has no English equivalent" —
        // reflexive "se", for example. Drop it rather than emit a gap.
        if (hit !== "") out.push(matchCase(slice[0], hit));
        i += n;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // No entry — keep the word as written and flag it.
    out.push(tok);
    if (!isNumeric(tok) && tok.length > 1) unknown.push(tok);
    i++;
  }

  return { text: detokenize(out), unknownTerms: [...new Set(unknown)] };
}

/** Reassemble tokens with sane spacing around punctuation. */
function detokenize(tokens: string[]): string {
  let out = "";
  for (const tok of tokens) {
    if (tok.startsWith("\n")) {
      out = out.trimEnd() + tok;
    } else if (/^[.,;:!?)%]$/.test(tok)) {
      out = out.trimEnd() + tok + " ";
    } else if (/^[(¿¡]$/.test(tok)) {
      out += tok;
    } else {
      out += tok + " ";
    }
  }
  return out.trim();
}

export const translator: Translator = {
  detect,
  async translate(text, target) {
    const from = detect(text);
    if (from === target) return { text, unknownTerms: [] };
    return glossText(text, from);
  },
};

/** Exposed for tests and for the "how good is this?" indicator in the UI. */
export function glossaryCoverage(result: TranslationResult): number {
  const words = result.text.split(/\s+/).filter((w) => /[A-Za-zÁÉÍÓÚÑÜáéíóúñü]/.test(w)).length;
  if (words === 0) return 1;
  return Math.max(0, 1 - result.unknownTerms.length / words);
}
