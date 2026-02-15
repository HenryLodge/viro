/**
 * generate-pandemic-seed.ts  —  "Pathogen Viro-X"
 *
 * Generates 1,100+ realistic patient records simulating a novel respiratory
 * pathogen emerging over a 60-day window with embedded epidemiological patterns.
 *
 * Pandemic scenario: Viro-X originates in Mumbai, spreads via air-travel
 * corridors to London, Dubai, Singapore, and NYC, then undergoes community
 * transmission and global acceleration.
 *
 * Discoverable patterns embedded in the data:
 *   - Geographic spread corridors (Mumbai → London → NYC → Boston)
 *   - Temporal acceleration (case counts increase exponentially)
 *   - Demographic vulnerability (age 65+ → 4× critical rate; immunocompromised → 3×)
 *   - Symptom signature (joint_pain + dry_cough = early Viro-X marker)
 *   - Exposure clustering (shared flights, workplaces, events, family units)
 *   - Hospital capacity strain in later phases
 *
 * Run:  npx tsx scripts/generate-pandemic-seed.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// ═══════════════════════════════════════════════════════════════════
// Load .env.local (no external dependency)
// ═══════════════════════════════════════════════════════════════════
(function loadEnv() {
  try {
    const lines = readFileSync(
      resolve(process.cwd(), ".env.local"),
      "utf-8",
    ).split("\n");
    for (const line of lines) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq < 1) continue;
      const k = t.slice(0, eq).trim();
      const v = t.slice(eq + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {
    console.error(
      "Could not read .env.local — make sure it exists in the project root.",
    );
    process.exit(1);
  }
})();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ═══════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════
const DEMO_USER_ID = "c0000000-0000-0000-0000-000000000001";
const NOW = Date.now();
const DAY = 86_400_000;
const BATCH_SIZE = 200;

// ═══════════════════════════════════════════════════════════════════
// Seeded PRNG — mulberry32 for reproducible data
// ═══════════════════════════════════════════════════════════════════
function createRng(s: number) {
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = createRng(20260215);

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function pickN<T>(arr: readonly T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < Math.min(n, copy.length); i++) {
    const idx = Math.floor(rand() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

function weightedIndex(weights: readonly number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

function jitter(base: number, spread: number): number {
  return base + (rand() - 0.5) * 2 * spread;
}

function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

/** Box-Muller gaussian for realistic age distributions */
function gaussianAge(mean: number, std: number): number {
  const u1 = rand() || 0.0001;
  const u2 = rand();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.max(1, Math.min(99, Math.round(mean + z * std)));
}

// ═══════════════════════════════════════════════════════════════════
// Name Pools — culturally appropriate by region
// ═══════════════════════════════════════════════════════════════════
const NAMES: Record<string, { first: string[]; last: string[] }> = {
  south_asian: {
    first: [
      "Aarav", "Vivaan", "Aditya", "Arjun", "Sai", "Ananya", "Diya", "Isha",
      "Priya", "Kavya", "Rohan", "Vikram", "Neha", "Pooja", "Meera", "Raj",
      "Amit", "Sunita", "Deepak", "Lakshmi", "Reyansh", "Ishaan", "Riya",
      "Aisha", "Kabir", "Manish", "Tara", "Divya", "Suresh", "Krishna",
    ],
    last: [
      "Sharma", "Patel", "Gupta", "Singh", "Kumar", "Mehta", "Reddy", "Nair",
      "Joshi", "Verma", "Desai", "Rao", "Iyer", "Chatterjee", "Malhotra",
      "Kapoor", "Aggarwal", "Saxena", "Mishra", "Chauhan",
    ],
  },
  british: {
    first: [
      "Oliver", "Harry", "George", "Amelia", "Isla", "Emily", "James",
      "Charlotte", "Sophie", "William", "Thomas", "Grace", "Eleanor", "Daniel",
      "Olivia", "Jack", "Alexander", "Lily", "Edward", "Victoria",
    ],
    last: [
      "Smith", "Jones", "Williams", "Taylor", "Brown", "Wilson", "Johnson",
      "Davies", "Patel", "Thompson", "Wright", "Walker", "Roberts", "Robinson",
      "Hall", "Green", "Evans", "Turner", "Parker", "Edwards",
    ],
  },
  middle_eastern: {
    first: [
      "Ahmed", "Mohammed", "Fatima", "Aisha", "Omar", "Hassan", "Layla",
      "Zara", "Ali", "Khalid", "Noura", "Rashid", "Sara", "Yusuf", "Mariam",
      "Ibrahim", "Noor", "Tariq", "Hana", "Karim",
    ],
    last: [
      "Al-Rashid", "Al-Mansoori", "Al-Hashimi", "Al-Suwaidi", "Al-Farsi",
      "Al-Dosari", "Khan", "Hassan", "Ibrahim", "Mohammed", "Abdullah",
      "Al-Shamsi", "Al-Balushi", "Al-Zaabi", "Al-Mulla",
    ],
  },
  southeast_asian: {
    first: [
      "Wei", "Jia", "Hui", "Ming", "Xin", "Kumar", "Priya", "Siti", "Ahmad",
      "Li", "Chen", "Tan", "Lee", "Ng", "Rizal", "Dewi", "Arif", "Mei",
      "Kai", "Lian",
    ],
    last: [
      "Tan", "Lim", "Lee", "Ng", "Wong", "Chen", "Goh", "Chua", "Koh", "Teo",
      "Singh", "Muhamad", "Abdullah", "Rahman", "Kumar", "Ong", "Yeo", "Chong",
      "Ho", "Lau",
    ],
  },
  american_diverse: {
    first: [
      "James", "Maria", "David", "Jennifer", "Michael", "Sarah", "Robert",
      "Lisa", "Daniel", "Emily", "Marcus", "Keisha", "Anthony", "Nicole",
      "Jose", "Ana", "Kevin", "Ashley", "Brandon", "Megan", "Wei", "Priya",
      "Carlos", "Sofia", "William", "Patricia", "Brian", "Crystal",
      "Christopher", "Angela",
    ],
    last: [
      "Garcia", "Smith", "Johnson", "Williams", "Rodriguez", "Lee", "Chen",
      "Kim", "Brown", "Davis", "Martinez", "Thompson", "Hernandez", "Lopez",
      "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Nguyen",
      "Patel", "White", "Harris", "Martin", "Robinson", "Clark", "Lewis",
      "Walker", "Young",
    ],
  },
  brazilian: {
    first: [
      "Pedro", "Ana", "Lucas", "Mariana", "Gabriel", "Isabela", "Rafael",
      "Beatriz", "Matheus", "Larissa", "Gustavo", "Camila", "Felipe",
      "Juliana", "Thiago", "Fernanda", "Bruno", "Carolina", "Eduardo",
      "Amanda",
    ],
    last: [
      "Silva", "Santos", "Oliveira", "Souza", "Lima", "Ferreira", "Costa",
      "Rodrigues", "Almeida", "Nascimento", "Pereira", "Carvalho", "Martins",
      "Gomes", "Ribeiro", "Barbosa", "Rocha", "Cardoso", "Correia", "Dias",
    ],
  },
  nigerian: {
    first: [
      "Chidinma", "Emeka", "Oluwaseun", "Adaeze", "Chukwuma", "Ngozi",
      "Obinna", "Chiamaka", "Tunde", "Folake", "Ibrahim", "Aisha", "Yusuf",
      "Blessing", "Emmanuel", "Grace", "Samuel", "Funke", "Babatunde", "Amara",
    ],
    last: [
      "Okafor", "Adeyemi", "Nwosu", "Ogunwale", "Eze", "Abubakar",
      "Onyekachi", "Balogun", "Afolabi", "Nnamdi", "Ogundipe", "Chukwu",
      "Obi", "Adeniyi", "Olumide", "Nwankwo", "Okoro", "Adeleke", "Musa",
      "Okonkwo",
    ],
  },
  french: {
    first: [
      "Louis", "Marie", "Pierre", "Sophie", "Jean", "Camille", "Nicolas",
      "Emma", "Julien", "Manon", "Antoine", "Claire", "Paul", "Margaux",
      "Olivier", "Elise", "Thomas", "Lea", "Francois", "Chloe",
    ],
    last: [
      "Martin", "Bernard", "Dubois", "Thomas", "Robert", "Richard", "Petit",
      "Durand", "Leroy", "Moreau", "Simon", "Laurent", "Lefebvre", "Michel",
      "Garcia", "Fournier", "Lambert", "Bonnet", "Girard", "Dupont",
    ],
  },
  japanese: {
    first: [
      "Haruto", "Yui", "Sota", "Hina", "Ren", "Sakura", "Minato", "Aoi",
      "Yuto", "Mio", "Kaito", "Riko", "Sora", "Yuna", "Takumi", "Mei",
      "Hayato", "Hana", "Kota", "Akari",
    ],
    last: [
      "Sato", "Suzuki", "Takahashi", "Tanaka", "Watanabe", "Ito", "Yamamoto",
      "Nakamura", "Kobayashi", "Kato", "Yoshida", "Yamada", "Sasaki",
      "Yamaguchi", "Matsumoto", "Inoue", "Kimura", "Shimizu", "Hayashi",
      "Saito",
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════
// City Definitions
// ═══════════════════════════════════════════════════════════════════
interface CityDef {
  lat: number;
  lng: number;
  spread: number; // coordinate jitter in degrees
  regionId: string | null; // links to existing region in seed.sql
  hospitalIds: string[];
  namePool: string;
}

const CITIES: Record<string, CityDef> = {
  mumbai: {
    lat: 19.076, lng: 72.8777, spread: 0.08,
    regionId: "b0000000-0000-0000-0000-000000000020",
    hospitalIds: [], namePool: "south_asian",
  },
  delhi: {
    lat: 28.7041, lng: 77.1025, spread: 0.1,
    regionId: "b0000000-0000-0000-0000-000000000021",
    hospitalIds: [], namePool: "south_asian",
  },
  london: {
    lat: 51.5074, lng: -0.1278, spread: 0.06,
    regionId: "b0000000-0000-0000-0000-000000000012",
    hospitalIds: [], namePool: "british",
  },
  dubai: {
    lat: 25.2048, lng: 55.2708, spread: 0.05,
    regionId: null, hospitalIds: [], namePool: "middle_eastern",
  },
  singapore: {
    lat: 1.3521, lng: 103.8198, spread: 0.03,
    regionId: null, hospitalIds: [], namePool: "southeast_asian",
  },
  new_york: {
    lat: 40.7128, lng: -74.006, spread: 0.05,
    regionId: "b0000000-0000-0000-0000-000000000002",
    hospitalIds: [
      "a0000000-0000-0000-0000-000000000006",
      "a0000000-0000-0000-0000-000000000007",
      "a0000000-0000-0000-0000-000000000008",
      "a0000000-0000-0000-0000-000000000009",
    ],
    namePool: "american_diverse",
  },
  boston: {
    lat: 42.3601, lng: -71.0589, spread: 0.04,
    regionId: "b0000000-0000-0000-0000-000000000001",
    hospitalIds: [
      "a0000000-0000-0000-0000-000000000001",
      "a0000000-0000-0000-0000-000000000002",
      "a0000000-0000-0000-0000-000000000003",
      "a0000000-0000-0000-0000-000000000004",
      "a0000000-0000-0000-0000-000000000005",
    ],
    namePool: "american_diverse",
  },
  chicago: {
    lat: 41.8781, lng: -87.6298, spread: 0.06,
    regionId: "b0000000-0000-0000-0000-000000000005",
    hospitalIds: [
      "a0000000-0000-0000-0000-000000000029",
      "a0000000-0000-0000-0000-000000000030",
      "a0000000-0000-0000-0000-000000000031",
    ],
    namePool: "american_diverse",
  },
  los_angeles: {
    lat: 34.0522, lng: -118.2437, spread: 0.08,
    regionId: "b0000000-0000-0000-0000-000000000006",
    hospitalIds: [
      "a0000000-0000-0000-0000-000000000049",
      "a0000000-0000-0000-0000-000000000050",
      "a0000000-0000-0000-0000-000000000051",
    ],
    namePool: "american_diverse",
  },
  sao_paulo: {
    lat: -23.5505, lng: -46.6333, spread: 0.1,
    regionId: "b0000000-0000-0000-0000-000000000009",
    hospitalIds: [], namePool: "brazilian",
  },
  lagos: {
    lat: 6.5244, lng: 3.3792, spread: 0.07,
    regionId: "b0000000-0000-0000-0000-000000000017",
    hospitalIds: [], namePool: "nigerian",
  },
  philadelphia: {
    lat: 39.9526, lng: -75.1652, spread: 0.04,
    regionId: "b0000000-0000-0000-0000-000000000003",
    hospitalIds: [
      "a0000000-0000-0000-0000-000000000010",
      "a0000000-0000-0000-0000-000000000011",
    ],
    namePool: "american_diverse",
  },
  washington_dc: {
    lat: 38.9072, lng: -77.0369, spread: 0.04,
    regionId: "b0000000-0000-0000-0000-000000000004",
    hospitalIds: ["a0000000-0000-0000-0000-000000000065"],
    namePool: "american_diverse",
  },
  miami: {
    lat: 25.7617, lng: -80.1918, spread: 0.05,
    regionId: null,
    hospitalIds: [
      "a0000000-0000-0000-0000-000000000021",
      "a0000000-0000-0000-0000-000000000022",
    ],
    namePool: "american_diverse",
  },
  atlanta: {
    lat: 33.749, lng: -84.388, spread: 0.05,
    regionId: null,
    hospitalIds: [
      "a0000000-0000-0000-0000-000000000019",
      "a0000000-0000-0000-0000-000000000020",
    ],
    namePool: "american_diverse",
  },
  houston: {
    lat: 29.7604, lng: -95.3698, spread: 0.06,
    regionId: null,
    hospitalIds: [
      "a0000000-0000-0000-0000-000000000039",
      "a0000000-0000-0000-0000-000000000040",
      "a0000000-0000-0000-0000-000000000041",
    ],
    namePool: "american_diverse",
  },
  san_francisco: {
    lat: 37.7749, lng: -122.4194, spread: 0.04,
    regionId: null,
    hospitalIds: [
      "a0000000-0000-0000-0000-000000000052",
      "a0000000-0000-0000-0000-000000000053",
    ],
    namePool: "american_diverse",
  },
  seattle: {
    lat: 47.6062, lng: -122.3321, spread: 0.04,
    regionId: null,
    hospitalIds: [
      "a0000000-0000-0000-0000-000000000054",
      "a0000000-0000-0000-0000-000000000055",
    ],
    namePool: "american_diverse",
  },
  paris: {
    lat: 48.8566, lng: 2.3522, spread: 0.05,
    regionId: "b0000000-0000-0000-0000-000000000013",
    hospitalIds: [], namePool: "french",
  },
  tokyo: {
    lat: 35.6762, lng: 139.6503, spread: 0.05,
    regionId: "b0000000-0000-0000-0000-000000000022",
    hospitalIds: [], namePool: "japanese",
  },
};

// ═══════════════════════════════════════════════════════════════════
// Symptom Pools — Viro-X signature: joint_pain + dry_cough
// ═══════════════════════════════════════════════════════════════════
const SYMPTOM_POOLS = {
  1: {
    core: ["fever", "dry_cough", "fatigue", "joint_pain"],
    extra: ["mild_headache", "body_aches", "chills", "loss_of_appetite", "mild_sore_throat"],
    coreRange: [3, 4] as const,
    extraRange: [0, 2] as const,
  },
  2: {
    core: ["fever", "dry_cough", "fatigue", "joint_pain"],
    extra: ["sore_throat", "headache", "body_aches", "chills", "runny_nose", "loss_of_appetite", "night_sweats"],
    coreRange: [2, 4] as const,
    extraRange: [1, 3] as const,
  },
  3: {
    core: ["fever", "cough", "fatigue", "joint_pain", "shortness_of_breath"],
    extra: [
      "chest_tightness", "sore_throat", "headache", "body_aches", "night_sweats",
      "muscle_pain", "loss_of_appetite", "dizziness",
    ],
    coreRange: [2, 4] as const,
    extraRange: [1, 4] as const,
  },
  4: {
    core: ["high_fever", "severe_cough", "fatigue", "joint_pain", "shortness_of_breath"],
    extra: [
      "chest_tightness", "confusion", "inability_to_keep_fluids", "body_aches",
      "night_sweats", "muscle_pain", "dizziness", "rapid_heartbeat", "cyanosis",
    ],
    coreRange: [3, 5] as const,
    extraRange: [1, 4] as const,
  },
} as const;

const SEVERITY_FLAGS_POOL = {
  1: { flags: ["high_fever"], prob: 0.15 },
  2: { flags: ["high_fever"], prob: 0.25 },
  3: { flags: ["high_fever", "difficulty_breathing", "chest_pain"], prob: 0.35 },
  4: { flags: ["high_fever", "difficulty_breathing", "chest_pain", "confusion", "inability_to_keep_fluids"], prob: 0.5 },
} as const;

const RISK_FACTOR_POOL = [
  "diabetes", "heart_disease", "immunocompromised", "pregnancy",
  "hypertension", "obesity", "asthma", "chronic_kidney_disease",
  "chronic_lung_disease",
] as const;

// ═══════════════════════════════════════════════════════════════════
// Phase Configurations
// ═══════════════════════════════════════════════════════════════════
interface PhaseConfig {
  phase: number;
  dayRange: readonly [number, number];
  count: number;
  cities: string[];
  weights: number[];
  ageMean: number;
  ageStd: number;
  elderlyRate: number; // probability of forcing age 65+
}

const PHASES: PhaseConfig[] = [
  {
    phase: 1, dayRange: [0, 14], count: 55,
    cities: ["mumbai"],
    weights: [1],
    ageMean: 35, ageStd: 12, elderlyRate: 0.05,
  },
  {
    phase: 2, dayRange: [14, 29], count: 170,
    cities: ["london", "dubai", "singapore", "new_york", "mumbai"],
    weights: [3, 2, 2, 3, 1],
    ageMean: 40, ageStd: 14, elderlyRate: 0.1,
  },
  {
    phase: 3, dayRange: [29, 44], count: 375,
    cities: [
      "london", "new_york", "boston", "delhi", "mumbai", "singapore",
      "dubai", "chicago", "paris", "tokyo", "philadelphia",
    ],
    weights: [3, 4, 3, 2, 2, 1, 1, 2, 1, 1, 1],
    ageMean: 42, ageStd: 18, elderlyRate: 0.15,
  },
  {
    phase: 4, dayRange: [44, 59], count: 520,
    cities: [
      "new_york", "boston", "london", "mumbai", "delhi", "chicago",
      "los_angeles", "sao_paulo", "lagos", "dubai", "singapore",
      "philadelphia", "washington_dc", "miami", "atlanta", "houston",
      "san_francisco", "seattle", "paris", "tokyo",
    ],
    weights: [5, 4, 4, 3, 2, 3, 3, 2, 2, 1, 1, 2, 2, 2, 2, 2, 1, 1, 1, 1],
    ageMean: 48, ageStd: 20, elderlyRate: 0.25,
  },
];

// ═══════════════════════════════════════════════════════════════════
// Exposure Events — shared links for cluster detection
// ═══════════════════════════════════════════════════════════════════
const EXPOSURE_EVENTS = [
  // Phase 1 — Mumbai origin
  { id: "andheri-convention", label: "Andheri Business Convention, Mumbai", city: "mumbai", phase: 1, size: 8 },
  { id: "dharavi-gathering", label: "Dharavi Community Gathering", city: "mumbai", phase: 1, size: 6 },
  { id: "mumbai-central-market", label: "Crawford Market, Mumbai", city: "mumbai", phase: 1, size: 5 },

  // Phase 2 — Flight corridors
  { id: "ba138-flight", label: "Flight BA-138 Mumbai→London (Day 16)", city: "london", phase: 2, size: 10 },
  { id: "ek500-flight", label: "Flight EK-500 Mumbai→Dubai (Day 18)", city: "dubai", phase: 2, size: 8 },
  { id: "sq401-flight", label: "Flight SQ-401 Mumbai→Singapore (Day 19)", city: "singapore", phase: 2, size: 7 },
  { id: "aa112-flight", label: "Flight AA-112 Mumbai→JFK (Day 20)", city: "new_york", phase: 2, size: 10 },
  { id: "canary-wharf-summit", label: "Canary Wharf Tech Summit, London", city: "london", phase: 2, size: 12 },

  // Phase 3 — Community clusters
  { id: "gs-nyc-office", label: "Goldman Sachs NYC 34th Floor Workplace", city: "new_york", phase: 3, size: 15 },
  { id: "boston-general-staff", label: "Boston General Hospital Staff", city: "boston", phase: 3, size: 12 },
  { id: "dorchester-event", label: "Dorchester Community Center Event, Boston", city: "boston", phase: 3, size: 10 },
  { id: "jfk-terminal4", label: "JFK International Terminal 4 Cluster", city: "new_york", phase: 3, size: 8 },
  { id: "london-tube-central", label: "London Central Line Commuters", city: "london", phase: 3, size: 10 },
  { id: "delhi-hospital-workers", label: "AIIMS Delhi Healthcare Workers", city: "delhi", phase: 3, size: 8 },

  // Phase 4 — Widespread clusters
  { id: "ohare-terminal5", label: "O'Hare Airport Terminal 5 Cluster", city: "chicago", phase: 4, size: 10 },
  { id: "la-metro-blue", label: "LA Metro Blue Line Commuters", city: "los_angeles", phase: 4, size: 8 },
  { id: "nyc-subway-7", label: "NYC Subway Line 7 Cluster", city: "new_york", phase: 4, size: 12 },
  { id: "boston-university", label: "Boston University Campus Outbreak", city: "boston", phase: 4, size: 15 },
  { id: "chicago-meatpacking", label: "Chicago Meatpacking District Workers", city: "chicago", phase: 4, size: 10 },
  { id: "mumbai-slum-cluster", label: "Dharavi Slum Community Spread", city: "mumbai", phase: 4, size: 12 },
  { id: "london-nhs-cluster", label: "NHS Hospital Staff Cluster, London", city: "london", phase: 4, size: 10 },
  { id: "lagos-market-cluster", label: "Balogun Market Cluster, Lagos", city: "lagos", phase: 4, size: 8 },
  { id: "sp-favela-cluster", label: "Paraisopolis Community, Sao Paulo", city: "sao_paulo", phase: 4, size: 8 },
];

// ═══════════════════════════════════════════════════════════════════
// Flight Routes — for travel history generation
// ═══════════════════════════════════════════════════════════════════
const FLIGHT_ROUTES: Record<string, { from: string; flights: string[] }[]> = {
  london:        [{ from: "Mumbai", flights: ["BA-138", "AI-131", "VS-006"] }],
  dubai:         [{ from: "Mumbai", flights: ["EK-500", "AI-983", "EK-502"] }],
  singapore:     [{ from: "Mumbai", flights: ["SQ-401", "AI-343", "SQ-423"] }],
  new_york:      [
    { from: "Mumbai", flights: ["AA-112", "AI-101", "UA-48"] },
    { from: "London", flights: ["BA-117", "VS-003", "AA-100"] },
    { from: "Dubai", flights: ["EK-201", "EK-203"] },
  ],
  boston:         [
    { from: "New York", flights: ["DL-2401", "JB-517", "AA-4512"] },
    { from: "London", flights: ["BA-213", "DL-403", "AA-108"] },
  ],
  chicago:       [
    { from: "New York", flights: ["UA-416", "AA-307", "DL-1122"] },
    { from: "London", flights: ["BA-297", "AA-87"] },
  ],
  los_angeles:   [
    { from: "New York", flights: ["AA-1", "UA-5", "DL-408"] },
    { from: "Singapore", flights: ["SQ-37", "SQ-38"] },
  ],
  delhi:         [{ from: "Mumbai", flights: ["AI-665", "6E-178", "SG-715"] }],
  paris:         [{ from: "London", flights: ["BA-334", "AF-1081", "EZY-8481"] }],
  tokyo:         [{ from: "Singapore", flights: ["SQ-638", "NH-844"] }],
  miami:         [{ from: "New York", flights: ["AA-1407", "DL-477", "JB-1563"] }],
  atlanta:       [{ from: "New York", flights: ["DL-1017", "AA-2145"] }],
  houston:       [{ from: "New York", flights: ["UA-1212", "AA-349"] }],
  san_francisco: [{ from: "New York", flights: ["UA-100", "DL-712"] }],
  seattle:       [{ from: "San Francisco", flights: ["AS-305", "UA-516"] }],
  philadelphia:  [{ from: "New York", flights: ["AA-4512", "DL-2890"] }],
  washington_dc: [{ from: "New York", flights: ["AA-2148", "DL-3024"] }],
  sao_paulo:     [{ from: "Mumbai", flights: ["AI-173", "ET-507"] }],
  lagos:         [{ from: "London", flights: ["BA-83", "VS-651"] }, { from: "Dubai", flights: ["EK-783"] }],
};

// ═══════════════════════════════════════════════════════════════════
// Patient Generation
// ═══════════════════════════════════════════════════════════════════
interface PatientRecord {
  user_id: string;
  full_name: string;
  age: number;
  symptoms: string[];
  severity_flags: string[];
  risk_factors: string[];
  travel_history: string | null;
  exposure_history: string | null;
  triage_tier: string;
  triage_reasoning: string;
  risk_flags: string[];
  assigned_hospital_id: string | null;
  status: string;
  lat: number;
  lng: number;
  created_at: string;
  updated_at: string;
}

/** Track how many patients have been assigned to each exposure event */
const eventAssignments: Record<string, number> = {};

function generatePatient(phase: number, cityKey: string, dayOffset: number): PatientRecord {
  const city = CITIES[cityKey];
  const pool = NAMES[city.namePool];
  const sp = SYMPTOM_POOLS[phase as 1 | 2 | 3 | 4];
  const sfp = SEVERITY_FLAGS_POOL[phase as 1 | 2 | 3 | 4];
  const pc = PHASES[phase - 1];

  // ── Name ──────────────────────────────────────────────────────
  const fullName = `${pick(pool.first)} ${pick(pool.last)}`;

  // ── Age (elderly boost in later phases) ───────────────────────
  const age = rand() < pc.elderlyRate
    ? randInt(65, 92)
    : gaussianAge(pc.ageMean, pc.ageStd);

  // ── Symptoms (Viro-X signature: joint_pain + dry_cough) ───────
  const coreN = randInt(sp.coreRange[0], sp.coreRange[1]);
  const extraN = randInt(sp.extraRange[0], sp.extraRange[1]);
  const symptoms = [
    ...pickN([...sp.core], coreN),
    ...pickN([...sp.extra], extraN),
  ];

  // ── Risk factors ──────────────────────────────────────────────
  const riskFactors: string[] = [];
  if (age >= 65) riskFactors.push("age_over_65");

  const rfCount = phase >= 3 && rand() < 0.3
    ? randInt(1, 2)
    : rand() < 0.2 ? 1 : 0;
  if (rfCount > 0) {
    const available = RISK_FACTOR_POOL.filter((r) => !riskFactors.includes(r));
    riskFactors.push(...pickN([...available], rfCount));
  }
  // Immunocompromised boost in phase 4 (3× critical rate pattern)
  if (phase === 4 && rand() < 0.12 && !riskFactors.includes("immunocompromised")) {
    riskFactors.push("immunocompromised");
  }

  // ── Severity flags ────────────────────────────────────────────
  const severityFlags: string[] = [];
  if (rand() < sfp.prob) {
    severityFlags.push(...pickN([...sfp.flags], randInt(1, Math.min(2, sfp.flags.length))));
  }

  // ── Triage tier (score-based, correlated with risk) ───────────
  let score = (phase - 1) * 0.6;
  if (age >= 65) score += 1.5;
  if (age >= 75) score += 1.0;
  score += riskFactors.length * 0.7;
  score += severityFlags.length * 1.2;
  if (riskFactors.includes("immunocompromised")) score += 1.0;
  score += (rand() - 0.3) * 2.5;

  const triageTier =
    score >= 5.5 ? "critical" :
    score >= 3.5 ? "urgent" :
    score >= 1.5 ? "routine" :
    "self-care";

  // ── Travel history ────────────────────────────────────────────
  let travelHistory: string | null = null;

  if (phase === 1) {
    travelHistory = pick([
      `Resident of ${pick(["Andheri", "Bandra", "Dadar", "Dharavi", "Kurla", "Worli", "Juhu"])}, Mumbai`,
      "Lives in Mumbai metropolitan area",
      `Works in ${pick(["Nariman Point", "Lower Parel", "BKC", "Fort", "Powai"])}, Mumbai`,
    ]);
  } else if (phase === 2) {
    if (rand() < 0.7) {
      const routes = FLIGHT_ROUTES[cityKey];
      if (routes && routes.length > 0) {
        const route = pick(routes);
        travelHistory = `Arrived from ${route.from} ${randInt(3, 14)} days ago (${pick(route.flights)})`;
      } else {
        travelHistory = `Traveled from Mumbai area within the past ${randInt(5, 14)} days`;
      }
    } else {
      travelHistory = cityKey === "mumbai" ? "Lives in Mumbai" : null;
    }
  } else if (phase === 3) {
    if (rand() < 0.35) {
      const routes = FLIGHT_ROUTES[cityKey];
      if (routes && routes.length > 0) {
        const route = pick(routes);
        travelHistory = `Returned from ${route.from} ${randInt(5, 20)} days ago`;
      } else {
        travelHistory = `Returned from ${pick(["Mumbai", "London", "Dubai", "Singapore"])} ${randInt(5, 20)} days ago`;
      }
    } else {
      travelHistory = rand() < 0.3 ? "No recent travel" : null;
    }
  } else {
    if (rand() < 0.15) {
      travelHistory = `Returned from ${pick(["Mumbai", "London", "New York", "Boston", "Delhi", "Dubai"])} ${randInt(5, 25)} days ago`;
    } else {
      travelHistory = rand() < 0.4 ? "No recent travel" : null;
    }
  }

  // ── Exposure history (with clustering via shared events) ──────
  let exposureHistory: string | null = null;
  const eligible = EXPOSURE_EVENTS.filter(
    (e) => e.phase === phase && e.city === cityKey && (eventAssignments[e.id] || 0) < e.size,
  );

  if (eligible.length > 0 && rand() < 0.45) {
    const event = pick(eligible);
    eventAssignments[event.id] = (eventAssignments[event.id] || 0) + 1;
    exposureHistory = `Linked to ${event.label}`;
  } else {
    // Individual exposure stories by phase
    if (phase === 1) {
      exposureHistory = pick([
        "Visited local hospital in Mumbai with respiratory complaints",
        "Close contact with symptomatic family member",
        "Works in crowded textile market in Mumbai",
        "Attended wedding ceremony with symptomatic guests",
        "Commutes via Mumbai local train daily",
      ]);
    } else if (phase === 2) {
      exposureHistory = pick([
        "Close contact with confirmed Viro-X case",
        "Household member tested positive",
        "Shared flight with symptomatic passenger",
        "Attended conference with international delegates",
        "Colleague at work tested positive last week",
        "Visited crowded transit hub recently",
      ]);
    } else if (phase === 3) {
      exposureHistory = pick([
        "Close contact with confirmed Viro-X case",
        "Household member tested positive",
        "Colleague at work tested positive last week",
        "Visited crowded market area",
        "Attended large indoor gathering",
        "Works in healthcare facility treating Viro-X patients",
        "Lives in apartment building with confirmed cases",
        "Community transmission suspected",
        "Child's school had confirmed outbreak",
        "Unknown exposure source",
      ]);
    } else {
      exposureHistory = pick([
        "Attended large indoor gathering",
        "Works in healthcare facility treating Viro-X patients",
        "Lives in apartment building with confirmed cases",
        "Spouse hospitalized with Viro-X",
        "Child's school had confirmed outbreak",
        "Community transmission suspected",
        "Unknown exposure source",
        "No known direct exposure — likely community transmission",
        "Multiple coworkers diagnosed in the past week",
        "Lives in high-density neighborhood with active outbreak",
      ]);
    }
  }

  // ── Risk flags (composite of severity + risk + exposure) ──────
  const riskFlags: string[] = [...severityFlags];
  if (age >= 65) riskFlags.push("elderly");
  for (const rf of riskFactors) {
    if (rf !== "age_over_65") riskFlags.push(rf);
  }
  if (
    travelHistory &&
    !travelHistory.includes("No recent") &&
    !travelHistory.startsWith("Lives") &&
    !travelHistory.startsWith("Resident") &&
    !travelHistory.startsWith("Works")
  ) {
    riskFlags.push("travel_exposure");
  }
  if (
    exposureHistory &&
    (exposureHistory.includes("confirmed") ||
      exposureHistory.includes("positive") ||
      exposureHistory.includes("hospitalized"))
  ) {
    riskFlags.push("confirmed_contact");
  }

  // ── Triage reasoning ──────────────────────────────────────────
  const tierAction: Record<string, string> = {
    critical: "Immediate emergency evaluation required",
    urgent: "Same-day in-person evaluation recommended",
    routine: "Clinic appointment within 24-48 hours recommended",
    "self-care": "Home monitoring with self-care measures appropriate",
  };
  const symptomStr = symptoms.slice(0, 3).join(", ");
  const riskStr = riskFactors.length > 0 ? ` Risk factors: ${riskFactors.join(", ")}.` : "";
  const travelStr =
    travelHistory && !travelHistory.includes("No recent") && !travelHistory.startsWith("Lives")
      ? ` ${travelHistory}.`
      : "";
  const triageReasoning = `${age}-year-old patient presenting with ${symptomStr}.${riskStr}${travelStr} ${tierAction[triageTier]}.`;

  // ── Hospital assignment ───────────────────────────────────────
  const assignedHospitalId =
    city.hospitalIds.length > 0 ? pick(city.hospitalIds) : null;

  // ── Status ────────────────────────────────────────────────────
  const statusWeights =
    phase <= 2 ? [0.6, 0.25, 0.15, 0] :
    phase === 3 ? [0.45, 0.2, 0.25, 0.1] :
    [0.35, 0.15, 0.35, 0.15];
  const statuses = ["triaged", "routed", "admitted", "pending"] as const;
  const status = statuses[weightedIndex(statusWeights)];

  // ── Coordinates (jittered around city center) ─────────────────
  const lat = jitter(city.lat, city.spread);
  const lng = jitter(city.lng, city.spread);

  // ── Timestamps ────────────────────────────────────────────────
  const createdMs = NOW - (60 - dayOffset) * DAY + rand() * 24 * 3600000;
  const updatedMs = createdMs + randInt(5, 120) * 60000;

  return {
    user_id: DEMO_USER_ID,
    full_name: fullName,
    age,
    symptoms,
    severity_flags: severityFlags,
    risk_factors: riskFactors,
    travel_history: travelHistory,
    exposure_history: exposureHistory,
    triage_tier: triageTier,
    triage_reasoning: triageReasoning,
    risk_flags: riskFlags,
    assigned_hospital_id: assignedHospitalId,
    status,
    lat,
    lng,
    created_at: new Date(createdMs).toISOString(),
    updated_at: new Date(updatedMs).toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════════
// Region Updates
// ═══════════════════════════════════════════════════════════════════
function nearestCityKey(lat: number, lng: number): string {
  let best = "";
  let bestD = Infinity;
  for (const [k, c] of Object.entries(CITIES)) {
    const d = Math.hypot(lat - c.lat, lng - c.lng);
    if (d < bestD) { bestD = d; best = k; }
  }
  return best;
}

/** Names for new regions (cities without a seed.sql region) */
const NEW_REGION_LABELS: Record<string, string> = {
  dubai: "Dubai, UAE",
  singapore: "Singapore",
  miami: "Miami, USA",
  atlanta: "Atlanta, USA",
  houston: "Houston, USA",
  san_francisco: "San Francisco, USA",
  seattle: "Seattle, USA",
};

function buildRegionUpdates(patients: PatientRecord[]) {
  const cityCounts: Record<string, number> = {};
  const citySymptoms: Record<string, Record<string, number>> = {};

  for (const p of patients) {
    const ck = nearestCityKey(p.lat, p.lng);
    cityCounts[ck] = (cityCounts[ck] || 0) + 1;
    if (!citySymptoms[ck]) citySymptoms[ck] = {};
    for (const s of p.symptoms) {
      citySymptoms[ck][s] = (citySymptoms[ck][s] || 0) + 1;
    }
  }

  const updates: Array<{
    id?: string;
    name: string;
    lat: number;
    lng: number;
    case_count: number;
    severity: string;
    anomaly_flag: boolean;
    top_symptoms: string[];
  }> = [];

  for (const [ck, count] of Object.entries(cityCounts)) {
    const city = CITIES[ck];
    // Only update cities that have a regionId or are in NEW_REGION_LABELS
    if (!city.regionId && !NEW_REGION_LABELS[ck]) continue;

    const severity =
      count >= 100 ? "critical" :
      count >= 50 ? "high" :
      count >= 20 ? "moderate" :
      "low";

    const anomalyFlag = count >= 80 || (count >= 40 && severity === "high");

    const symCounts = citySymptoms[ck] || {};
    const topSymptoms = Object.entries(symCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([s]) => s);

    // Multiply to represent broader population (our records are a sample)
    const caseCount = count * randInt(8, 15);

    if (city.regionId) {
      updates.push({
        id: city.regionId,
        name: NEW_REGION_LABELS[ck] || ck,
        lat: city.lat,
        lng: city.lng,
        case_count: caseCount,
        severity,
        anomaly_flag: anomalyFlag,
        top_symptoms: topSymptoms,
      });
    } else {
      updates.push({
        name: NEW_REGION_LABELS[ck]!,
        lat: city.lat,
        lng: city.lng,
        case_count: caseCount,
        severity,
        anomaly_flag: anomalyFlag,
        top_symptoms: topSymptoms,
      });
    }
  }

  return updates;
}

// ═══════════════════════════════════════════════════════════════════
// Cluster Alerts
// ═══════════════════════════════════════════════════════════════════
function sumEvents(...ids: string[]): number {
  return ids.reduce((acc, id) => acc + (eventAssignments[id] || 0), 0);
}

function buildClusterAlerts(patients: PatientRecord[]) {
  const elderlyCount = patients.filter((p) => p.age >= 65).length;
  const immunoCount = patients.filter((p) => p.risk_factors.includes("immunocompromised")).length;
  const signatureCount = patients.filter(
    (p) =>
      p.symptoms.includes("joint_pain") &&
      (p.symptoms.includes("dry_cough") || p.symptoms.includes("cough") || p.symptoms.includes("severe_cough")),
  ).length;

  return [
    {
      id: "virox-origin-mumbai",
      cluster_label: "Mumbai Origin Cluster (Viro-X Index Cases)",
      patient_count: sumEvents("andheri-convention", "dharavi-gathering", "mumbai-central-market"),
      shared_symptoms: ["fever", "dry_cough", "joint_pain", "fatigue"],
      geographic_spread: "Concentrated in Mumbai — Andheri, Dharavi, Crawford Market",
      travel_commonalities: "All patients are Mumbai residents. No international travel. Potential zoonotic or environmental origin.",
      growth_rate: "Emerging",
      recommended_action: "Investigate origin. Genomic sequencing of earliest cases. Establish contact tracing.",
    },
    {
      id: "virox-corridor-mumbai-london",
      cluster_label: "Mumbai → London Flight Corridor",
      patient_count: sumEvents("ba138-flight", "canary-wharf-summit"),
      shared_symptoms: ["fever", "dry_cough", "joint_pain", "sore_throat"],
      geographic_spread: "Central London — Canary Wharf, Heathrow corridor, East London",
      travel_commonalities: "Patients traveled from Mumbai within past 14 days. Flight BA-138 is primary link.",
      growth_rate: "Accelerating",
      recommended_action: "Airport screening for Mumbai arrivals. Notify UK public health. Trace BA-138 passengers.",
    },
    {
      id: "virox-corridor-mumbai-nyc",
      cluster_label: "Mumbai → NYC Flight Corridor",
      patient_count: sumEvents("aa112-flight", "gs-nyc-office"),
      shared_symptoms: ["fever", "dry_cough", "joint_pain", "body_aches"],
      geographic_spread: "Manhattan and JFK Airport area, New York City",
      travel_commonalities: "Linked to Flight AA-112 from Mumbai and subsequent workplace spread.",
      growth_rate: "Accelerating",
      recommended_action: "Mandatory quarantine for Mumbai arrivals. Contact trace AA-112 manifest. Workplace lockdown.",
    },
    {
      id: "virox-community-boston",
      cluster_label: "Boston Community Transmission Cluster",
      patient_count: sumEvents("dorchester-event", "boston-general-staff", "boston-university"),
      shared_symptoms: ["fever", "cough", "joint_pain", "shortness_of_breath", "fatigue"],
      geographic_spread: "Dorchester, Boston General Hospital, Boston University campus",
      travel_commonalities: "Mixed — some travel-linked, majority community transmission with no travel history.",
      growth_rate: "Exponential",
      recommended_action: "Declare community transmission. Activate hospital surge protocols. Campus quarantine at BU.",
    },
    {
      id: "virox-healthcare-workers",
      cluster_label: "Healthcare Worker Cluster (Multi-city)",
      patient_count: sumEvents("boston-general-staff", "delhi-hospital-workers", "london-nhs-cluster"),
      shared_symptoms: ["fever", "cough", "fatigue", "shortness_of_breath"],
      geographic_spread: "Boston (General Hospital), Delhi (AIIMS), London (NHS)",
      travel_commonalities: "All are healthcare workers treating Viro-X patients. Occupational exposure.",
      growth_rate: "Steady",
      recommended_action: "Enhanced PPE protocols. Regular testing for Viro-X-treating staff. Staffing contingencies.",
    },
    {
      id: "virox-elderly-critical",
      cluster_label: "Elderly High-Risk Cohort (Age 65+)",
      patient_count: elderlyCount,
      shared_symptoms: ["high_fever", "severe_cough", "shortness_of_breath", "joint_pain", "confusion"],
      geographic_spread: "Global — disproportionate in NYC, Boston, London, Mumbai",
      travel_commonalities: "Age-linked vulnerability. 4× critical outcome rate vs. under-65 cohort.",
      growth_rate: "Accelerating",
      recommended_action: "Priority treatment for 65+. Dedicated geriatric wards. Visitor restrictions at care homes.",
    },
    {
      id: "virox-immunocompromised",
      cluster_label: "Immunocompromised Patient Cohort",
      patient_count: immunoCount,
      shared_symptoms: ["high_fever", "severe_cough", "shortness_of_breath", "fatigue", "body_aches"],
      geographic_spread: "Global distribution",
      travel_commonalities: "Immunocompromised status is common risk factor. 3× critical outcome rate.",
      growth_rate: "Steady",
      recommended_action: "Prophylactic antiviral treatment. Enhanced isolation. Prioritize for experimental therapeutics.",
    },
    {
      id: "virox-signature-symptoms",
      cluster_label: "Viro-X Signature Symptom Cluster (Joint Pain + Dry Cough)",
      patient_count: signatureCount,
      shared_symptoms: ["joint_pain", "dry_cough", "fever", "fatigue"],
      geographic_spread: "All affected regions — pathogen's distinguishing symptom profile",
      travel_commonalities: "Joint pain + dry cough combination present in majority of confirmed Viro-X cases. Early diagnostic marker.",
      growth_rate: "Tracking with overall case growth",
      recommended_action: "Use joint_pain + dry_cough as clinical screening criteria. Update case definition. Alert all EDs.",
    },
  ];
}

// ═══════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════
async function main() {
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║  Viro-X Pandemic Seed Data Generator                        ║");
  console.log("║  Generating 1,100+ patient records across 60-day window     ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  // ── Verify connectivity ───────────────────────────────────────
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", DEMO_USER_ID)
    .single();

  if (profileErr || !profile) {
    console.error("✗ Demo user not found. Run supabase/seed.sql first.");
    console.error("  Expected profile ID:", DEMO_USER_ID);
    process.exit(1);
  }
  console.log("✓ Connected to Supabase. Demo user verified.");

  // ── Step 1: Clean previous pandemic seed data ─────────────────
  console.log("\n[1/5] Cleaning previous data...");

  // Delete all patients (clean slate for pandemic data)
  const { error: delPErr, count: delPCount } = await supabase
    .from("patients")
    .delete({ count: "exact" })
    .gte("created_at", "1970-01-01T00:00:00Z");

  if (delPErr) {
    console.warn("  ⚠ Could not clean patients:", delPErr.message);
  } else {
    console.log(`  Removed ${delPCount ?? 0} existing patients.`);
  }

  // Delete virox-prefixed cluster alerts
  const { error: delAErr } = await supabase
    .from("cluster_alerts")
    .delete()
    .like("id", "virox-%");

  if (delAErr) {
    console.warn("  ⚠ Could not clean cluster_alerts:", delAErr.message);
  }

  // Delete any previously-inserted new regions
  const newRegionNames = Object.values(NEW_REGION_LABELS);
  const { error: delRErr } = await supabase
    .from("regions")
    .delete()
    .in("name", newRegionNames);

  if (delRErr) {
    console.warn("  ⚠ Could not clean new regions:", delRErr.message);
  }
  console.log("  ✓ Cleanup complete.");

  // ── Step 2: Generate patients ─────────────────────────────────
  console.log("\n[2/5] Generating patients...");
  const allPatients: PatientRecord[] = [];

  for (const phase of PHASES) {
    const phasePatients: PatientRecord[] = [];
    for (let i = 0; i < phase.count; i++) {
      const cityIdx = weightedIndex(phase.weights);
      const cityKey = phase.cities[cityIdx];
      const day = phase.dayRange[0] + rand() * (phase.dayRange[1] - phase.dayRange[0]);
      phasePatients.push(generatePatient(phase.phase, cityKey, day));
    }
    allPatients.push(...phasePatients);

    // Per-city summary
    const cityBreakdown: Record<string, number> = {};
    for (const p of phasePatients) {
      const ck = nearestCityKey(p.lat, p.lng);
      cityBreakdown[ck] = (cityBreakdown[ck] || 0) + 1;
    }
    const top3 = Object.entries(cityBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([c, n]) => `${c}:${n}`)
      .join(", ");

    console.log(
      `  Phase ${phase.phase}: ${phasePatients.length} patients | top cities: ${top3}`,
    );
  }
  console.log(`  ─────────────────────────────────────────`);
  console.log(`  Total generated: ${allPatients.length} patients`);

  // ── Step 3: Batch insert patients ─────────────────────────────
  console.log("\n[3/5] Inserting patients...");
  let inserted = 0;

  for (let i = 0; i < allPatients.length; i += BATCH_SIZE) {
    const batch = allPatients.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("patients").insert(batch);

    if (error) {
      console.error(`  ✗ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error.message);
      continue;
    }
    inserted += batch.length;
    process.stdout.write(`  ✓ ${inserted}/${allPatients.length} inserted\r`);
  }
  console.log(`  ✓ ${inserted}/${allPatients.length} patients inserted.       `);

  // ── Step 4: Update regions ────────────────────────────────────
  console.log("\n[4/5] Updating regions...");
  const regionUpdates = buildRegionUpdates(allPatients);

  for (const update of regionUpdates) {
    if (update.id) {
      const { error } = await supabase
        .from("regions")
        .update({
          case_count: update.case_count,
          severity: update.severity,
          anomaly_flag: update.anomaly_flag,
          top_symptoms: update.top_symptoms,
          updated_at: new Date().toISOString(),
        })
        .eq("id", update.id);

      if (error) {
        console.warn(`  ⚠ Update failed: ${update.name} — ${error.message}`);
      } else {
        console.log(`  ✓ Updated: ${update.name} → ${update.case_count} cases (${update.severity})`);
      }
    } else {
      const { error } = await supabase.from("regions").insert({
        name: update.name,
        lat: update.lat,
        lng: update.lng,
        case_count: update.case_count,
        severity: update.severity,
        anomaly_flag: update.anomaly_flag,
        top_symptoms: update.top_symptoms,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.warn(`  ⚠ Insert failed: ${update.name} — ${error.message}`);
      } else {
        console.log(`  + Inserted: ${update.name} → ${update.case_count} cases (${update.severity})`);
      }
    }
  }

  // ── Step 5: Insert cluster alerts ─────────────────────────────
  console.log("\n[5/5] Inserting cluster alerts...");
  const alerts = buildClusterAlerts(allPatients);

  const { error: alertErr } = await supabase.from("cluster_alerts").upsert(alerts);
  if (alertErr) {
    console.error("  ✗ Failed:", alertErr.message);
  } else {
    for (const a of alerts) {
      console.log(`  ✓ ${a.cluster_label} (${a.patient_count} patients)`);
    }
  }

  // ── Summary ───────────────────────────────────────────────────
  const crit = allPatients.filter((p) => p.triage_tier === "critical").length;
  const urg = allPatients.filter((p) => p.triage_tier === "urgent").length;
  const rout = allPatients.filter((p) => p.triage_tier === "routine").length;
  const self = allPatients.filter((p) => p.triage_tier === "self-care").length;
  const elderly = allPatients.filter((p) => p.age >= 65).length;
  const immuno = allPatients.filter((p) => p.risk_factors.includes("immunocompromised")).length;
  const signature = allPatients.filter(
    (p) =>
      p.symptoms.includes("joint_pain") &&
      (p.symptoms.includes("dry_cough") || p.symptoms.includes("cough") || p.symptoms.includes("severe_cough")),
  ).length;

  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║  Viro-X Seed Generation Complete                     ║");
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log(`║  Total patients:    ${String(allPatients.length).padStart(6)}                          ║`);
  console.log(`║  ├─ Critical:       ${String(crit).padStart(6)}                          ║`);
  console.log(`║  ├─ Urgent:         ${String(urg).padStart(6)}                          ║`);
  console.log(`║  ├─ Routine:        ${String(rout).padStart(6)}                          ║`);
  console.log(`║  └─ Self-care:      ${String(self).padStart(6)}                          ║`);
  console.log(`║  Elderly (65+):     ${String(elderly).padStart(6)}  (${((elderly / allPatients.length) * 100).toFixed(1)}%)                ║`);
  console.log(`║  Immunocompromised: ${String(immuno).padStart(6)}  (${((immuno / allPatients.length) * 100).toFixed(1)}%)                ║`);
  console.log(`║  Viro-X signature:  ${String(signature).padStart(6)}  (${((signature / allPatients.length) * 100).toFixed(1)}%)                ║`);
  console.log(`║  Cluster alerts:    ${String(alerts.length).padStart(6)}                          ║`);
  console.log(`║  Regions updated:   ${String(regionUpdates.length).padStart(6)}                          ║`);
  console.log("╚══════════════════════════════════════════════════════╝\n");
}

main().catch((err) => {
  console.error("\nFatal error:", err);
  process.exit(1);
});
