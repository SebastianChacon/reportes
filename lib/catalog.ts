import type { CatalogItem, CrewGroup, CrewMember, L10n } from "./types";

/* ------------------------------------------------------------------ */
/* Role codes, exactly as printed on the paper form                    */
/* ------------------------------------------------------------------ */

export const ROLE_CODES: Record<string, L10n> = {
  M: { en: "Mason", es: "Albañil" },
  F: { en: "Foreman", es: "Capataz" },
  D: { en: "Driver", es: "Conductor" },
  SL: { en: "Skilled Labor", es: "Mano de obra calificada" },
  LD: { en: "Landscape Design", es: "Diseño de paisaje" },
  LDS: { en: "Landscape Design Sales", es: "Ventas de diseño" },
  AA: { en: "Admin", es: "Administración" },
  SLD: { en: "Yard", es: "Patio" },
  CM: { en: "Construction Manager", es: "Gerente de construcción" },
  PM: { en: "Project Manager", es: "Gerente de proyecto" },
  COS: { en: "Chief of Staff", es: "Jefe de gabinete" },
  VP: { en: "Vice President", es: "Vicepresidente" },
  PRES: { en: "President", es: "Presidente" },
  SDO: { en: "Sr. Director of Ops", es: "Director sr. de operaciones" },
  CADM: { en: "Construction Admin", es: "Admin. de construcción" },
};

export const CREW_GROUPS: Record<CrewGroup, L10n> = {
  construction_mgmt: { en: "Construction — Management", es: "Construcción — Supervisión" },
  construction_field: { en: "Construction Crews", es: "Cuadrillas de construcción" },
  operations: { en: "Operations", es: "Operaciones" },
  design_sales: { en: "Design / Sales", es: "Diseño / Ventas" },
  planting: { en: "Planting Crews", es: "Cuadrillas de plantación" },
  finance_admin: { en: "Finance / Admin", es: "Finanzas / Administración" },
};

/* ------------------------------------------------------------------ */
/* Crew roster — transcribed from the printed form.                    */
/* To add or remove people permanently, edit this list.                */
/* The foreman can always add a one-off name from the app.             */
/* ------------------------------------------------------------------ */

export const CREW: CrewMember[] = [
  // Construction — management
  { id: "santander-edwin", name: "Santander, Edwin", roles: ["CM"], group: "construction_mgmt" },
  { id: "urgiles-nelson", name: "Urgiles, Nelson", roles: ["PM"], group: "construction_mgmt" },
  { id: "testa-jason", name: "Testa, Jason", roles: ["PM"], group: "construction_mgmt" },
  { id: "wilson-yarlin", name: "Wilson, Yarlin", roles: ["CADM"], group: "construction_mgmt" },
  { id: "mora-restrepo-simon", name: "Mora Restrepo, Simon", roles: ["SL", "D"], group: "construction_mgmt" },

  // Construction — field
  { id: "aguilar-miguel", name: "Aguilar, Miguel", roles: ["F", "D"], group: "construction_field" },
  { id: "maynor", name: "Maynor", roles: ["SL"], group: "construction_field" },
  { id: "santander-carlos", name: "Santander, Carlos", roles: ["F", "D"], group: "construction_field" },
  { id: "sumba-flavio", name: "Sumba, Flavio", roles: ["SL"], group: "construction_field" },
  { id: "aguilar-danny", name: "Aguilar, Danny", roles: ["SL"], group: "construction_field" },
  { id: "marin-ramirez-juan", name: "Marin-Ramirez, Juan", roles: ["SL"], group: "construction_field" },
  { id: "giron-cristian", name: "Giron, Cristian", roles: ["SL"], group: "construction_field" },
  { id: "chacon-dennis", name: "Chacon, Dennis (Trelles)", roles: ["SL"], group: "construction_field" },
  { id: "tix-tix-domingo", name: "Tix Tix, Domingo", roles: ["F", "D"], group: "construction_field" },
  { id: "borja-alejandro", name: "Borja, Alejandro", roles: ["SL"], group: "construction_field" },
  { id: "montes-cesar", name: "Montes, Cesar", roles: ["M"], group: "construction_field" },
  { id: "aguilar-ebedic", name: "Aguilar, Ebedic", roles: ["SL", "D"], group: "construction_field" },
  { id: "chacon-mateo", name: "Chacon, Mateo", roles: ["SL"], group: "construction_field" },
  { id: "sislema-jordy", name: "Sislema, Jordy (Lascano)", roles: ["SL"], group: "construction_field" },

  // Operations
  { id: "ralph-evan", name: "Ralph, Evan", roles: ["PRES"], group: "operations" },
  { id: "zara-wai-sze", name: "Zara, Wai Sze", roles: ["COS"], group: "operations" },
  { id: "ceramina-tony", name: "Ceramina, Tony", roles: ["SDO"], group: "operations" },

  // Design / sales
  { id: "kinghorn-molly", name: "Kinghorn, Molly", roles: ["LD"], group: "design_sales" },
  { id: "kane-connor", name: "Kane, Connor", roles: ["LDS"], group: "design_sales" },
  { id: "corman-alexandra", name: "Corman, Alexandra", roles: ["LD"], group: "design_sales" },
  { id: "rodriguez-josh", name: "Rodriguez, Josh", roles: ["LDS"], group: "design_sales" },

  // Planting
  { id: "calva-dora", name: "Calva, Dora", roles: ["LD"], group: "planting" },
  { id: "mehta-salonee", name: "Mehta, Salonee", roles: ["LD"], group: "planting" },
  { id: "guadron-niuver", name: "Guadron, Niuver", roles: ["PM"], group: "planting" },
  { id: "guadron-michael", name: "Guadron, Michael", roles: ["F", "D"], group: "planting" },
  { id: "gomez-obispo", name: "Gomez, Obispo", roles: ["SL"], group: "planting" },
  { id: "lima-luis", name: "Lima, Luis", roles: ["SL"], group: "planting" },
  { id: "gutierrez-esvin", name: "Gutierrez, Esvin", roles: ["SL"], group: "planting" },
  { id: "patino-jhelsson", name: "Patino, Jhelsson", roles: ["SL", "D"], group: "planting" },
  { id: "munoz-harry", name: "Munoz, Harry", roles: ["SL"], group: "planting" },
  { id: "pan-tux-jesus", name: "Pan-Tux, Jesus", roles: ["SL"], group: "planting" },
  { id: "guadron-jorge", name: "Guadron, Jorge", roles: ["SL"], group: "planting" },

  // Finance / admin
  { id: "sblendorio-maria", name: "Sblendorio, Maria", roles: ["VP"], group: "finance_admin" },
  { id: "sblendorio-anthony", name: "Sblendorio Jr., Anthony", roles: ["AA"], group: "finance_admin" },
];

/* ------------------------------------------------------------------ */
/* Equipment — BTN-owned or rental                                     */
/* ------------------------------------------------------------------ */

export const EQUIPMENT: CatalogItem[] = [
  { id: "skid-steer", label: { en: "Skid Steer", es: "Minicargadora" } },
  { id: "sm-skid-steer", label: { en: "Sm Skid Steer / Dingo", es: "Minicargadora pequeña / Dingo" } },
  { id: "big-excavator", label: { en: "Big Excavator", es: "Excavadora grande" } },
  { id: "regular-excavator", label: { en: "Regular Excavator", es: "Excavadora regular" } },
  { id: "mini-excavator", label: { en: "Mini Excavator", es: "Mini excavadora" } },
  { id: "backhoe", label: { en: "Backhoe", es: "Retroexcavadora" } },
  { id: "plate-compactor", label: { en: "Plate Compactor", es: "Placa compactadora" } },
  { id: "concrete-mixer", label: { en: "Concrete Mixer", es: "Mezcladora de concreto" } },
  { id: "diamond-cut-saw", label: { en: "Diamond Cut Saw", es: "Sierra de diamante" } },
  { id: "jack-hammer", label: { en: "Jack Hammer", es: "Martillo neumático" } },
  { id: "wood-chipper", label: { en: "Wood Chipper", es: "Trituradora de madera" } },
  { id: "loader", label: { en: "Loader", es: "Cargador" } },
  { id: "power-wash", label: { en: "Power Wash", es: "Hidrolavadora" } },
  { id: "jumping-jack", label: { en: "Jumping Jack", es: "Compactador de salto" } },
  { id: "hammer-drill", label: { en: "Hammer Drill", es: "Taladro percutor" } },
  { id: "chainsaw", label: { en: "Chainsaw", es: "Motosierra" } },
  { id: "water-pump", label: { en: "Water Pump", es: "Bomba de agua" } },
  { id: "torch", label: { en: "Torch", es: "Soplete" } },
  { id: "concrete-vibrator", label: { en: "Concrete Vibrator", es: "Vibrador de concreto" } },
  { id: "backpack-blower", label: { en: "Backpack Blower", es: "Sopladora de mochila" } },
  { id: "line-trimmer", label: { en: "Line Trimmer", es: "Desbrozadora" } },
  { id: "riding-mower", label: { en: "Riding Mower", es: "Cortacésped de montar" } },
  { id: "push-mower", label: { en: "Push Mower", es: "Cortacésped de empuje" } },
];

/* ------------------------------------------------------------------ */
/* Materials                                                           */
/* ------------------------------------------------------------------ */

export const MATERIALS: CatalogItem[] = [
  { id: "mortar-mix", label: { en: "Mortar Mix", es: "Mezcla de mortero" } },
  { id: "concrete-mix", label: { en: "Concrete Mix", es: "Mezcla de concreto" } },
  { id: "cement", label: { en: "Cement", es: "Cemento" } },
  { id: "planting-mix", label: { en: "Planting Mix", es: "Mezcla para plantar" } },
  { id: "topsoil", label: { en: "Topsoil", es: "Tierra vegetal" } },
  { id: "mulch", label: { en: "Mulch", es: "Mantillo" } },
  { id: "sand", label: { en: "Sand", es: "Arena" } },
  { id: "stone-dust", label: { en: "Stone Dust", es: "Polvo de piedra" } },
  { id: "perlite", label: { en: "Perlite", es: "Perlita" } },
  { id: "sod", label: { en: "Sod", es: "Césped en rollo" } },
  { id: "stakes", label: { en: "Stakes", es: "Estacas" } },
  { id: "burlap", label: { en: "Burlap", es: "Arpillera" } },
  { id: "silt-fabric", label: { en: "Silt Fabric", es: "Tela de limo" } },
  { id: "bluestone", label: { en: "Bluestone", es: "Piedra azul" } },
  { id: "three-eighths-clean", label: { en: '3/8" Clean', es: 'Grava limpia 3/8"' } },
  { id: "three-quarters-clean", label: { en: '3/4" Clean', es: 'Grava limpia 3/4"' } },
  { id: "dga", label: { en: "DGA", es: "DGA (agregado denso)" } },
  { id: "boulders", label: { en: "Boulders", es: "Rocas grandes" } },
  { id: "rebar", label: { en: "Rebar", es: "Varilla / acero de refuerzo" } },
  { id: "wire-mesh", label: { en: "Wire Mesh", es: "Malla de alambre" } },
  { id: "fabric", label: { en: "Fabric", es: "Tela geotextil" } },
  { id: "seed", label: { en: "Seed", es: "Semilla" } },
  { id: "hay", label: { en: "Hay", es: "Heno" } },
  { id: "pvc-pipe", label: { en: "PVC Pipe", es: "Tubo de PVC" } },
  { id: "pvc-accs", label: { en: "PVC Accessories", es: "Accesorios de PVC" } },
  { id: "drainage-pipe", label: { en: "Drainage Pipe", es: "Tubo de drenaje" } },
  { id: "drainage-box", label: { en: "Drainage Box", es: "Caja de drenaje" } },
  { id: "add-cleaning", label: { en: "Add / Cleaning", es: "Aditivo / limpieza" } },
  { id: "ads-pipe", label: { en: "ADS Pipe", es: "Tubo ADS" } },
  { id: "tarps-plastic", label: { en: "Tarps / Plastic", es: "Lonas / plástico" } },
  { id: "irrigation-repair", label: { en: "Irrigation Repair", es: "Reparación de riego" } },
  { id: "herbicide", label: { en: "Herbicide / Pre-EM (Gal)", es: "Herbicida / Pre-EM (Gal)" } },
  { id: "insecticide", label: { en: "Insecticide (Gal)", es: "Insecticida (Gal)" } },
  { id: "fungicide", label: { en: "Fungicide (Gal)", es: "Fungicida (Gal)" } },
];

/* ------------------------------------------------------------------ */
/* Plant material categories                                           */
/* ------------------------------------------------------------------ */

export const PLANT_CATEGORIES: { id: "tree" | "shrub" | "perennial" | "annual"; label: L10n }[] = [
  { id: "tree", label: { en: "Tree", es: "Árbol" } },
  { id: "shrub", label: { en: "Shrub", es: "Arbusto" } },
  { id: "perennial", label: { en: "Perennial", es: "Perenne" } },
  { id: "annual", label: { en: "Annual", es: "Anual" } },
];

/* ------------------------------------------------------------------ */
/* Subcontractor trades                                                */
/* ------------------------------------------------------------------ */

export const SUBCONTRACTOR_TRADES: CatalogItem[] = [
  { id: "plumber", label: { en: "Plumber", es: "Plomero" } },
  { id: "electrician", label: { en: "Electrician", es: "Electricista" } },
  { id: "pool", label: { en: "Pool", es: "Piscina" } },
  { id: "irrigation", label: { en: "Irrigation", es: "Riego" } },
  { id: "fence", label: { en: "Fence", es: "Cerca" } },
  { id: "tree", label: { en: "Tree", es: "Árboles" } },
  { id: "contractor", label: { en: "Contractor", es: "Contratista" } },
  { id: "excavator", label: { en: "Excavator", es: "Excavación" } },
  { id: "equipment-used", label: { en: "Equipment Used", es: "Equipo utilizado" } },
];

/* ------------------------------------------------------------------ */
/* Trucks                                                              */
/* ------------------------------------------------------------------ */

export const TRUCKS: CatalogItem[] = [
  { id: "super-duty-dump", label: { en: "Super Duty Dump", es: "Volquete super duty" } },
  { id: "med-duty-dump", label: { en: "Med. Duty Dump", es: "Volquete mediano" } },
  { id: "light-duty-truck", label: { en: "Light Duty Truck", es: "Camioneta ligera" } },
  { id: "trailer", label: { en: "Trailer", es: "Remolque" } },
];
