/**
 * Hospital matching algorithm for VIRO.
 *
 * Weighted scoring function:
 *   score = (w1 × normalized_available_beds)
 *         + (w2 × 1 / distance_km)
 *         + (w3 × specialty_match_bonus)
 *         - (w4 × normalized_wait_time)
 *
 * Weights: w1=0.3, w2=0.3, w3=0.25, w4=0.15
 */

/* ── Types ── */

export interface Hospital {
  id: string;
  name: string;
  lat: number;
  lng: number;
  total_capacity: number;
  available_beds: number;
  specialties: string[];
  wait_time_minutes: number;
  contact_phone: string | null;
  address: string | null;
}

export interface RankedHospital extends Hospital {
  score: number;
  distance_km: number;
}

/* ── Weights ── */

const W_BEDS = 0.15;
const W_DISTANCE = 0.5;
const W_SPECIALTY = 0.25;
const W_WAIT = 0.1;

/* ── Target specialty based on triage tier (for the specialty_match_bonus) ── */

const TIER_SPECIALTIES: Record<string, string[]> = {
  critical: ["emergency", "trauma", "infectious_disease"],
  urgent: ["emergency", "infectious_disease", "cardiology"],
  routine: ["infectious_disease", "internal_medicine", "gastroenterology"],
  "self-care": [], // no specialty matching needed for self-care
};

/* ── Haversine distance (km) ── */

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/* ── Rank hospitals ── */

export function rankHospitals(
  hospitals: Hospital[],
  patientLat: number,
  patientLng: number,
  triageTier?: string
): RankedHospital[] {
  if (hospitals.length === 0) return [];

  // Calculate distances
  const withDistance = hospitals.map((h) => ({
    ...h,
    distance_km: haversineKm(patientLat, patientLng, h.lat, h.lng),
  }));

  // Find max values for normalization
  const maxBeds = Math.max(...withDistance.map((h) => h.available_beds), 1);
  const maxDistance = Math.max(...withDistance.map((h) => h.distance_km), 1);
  const maxWait = Math.max(...withDistance.map((h) => h.wait_time_minutes), 1);

  // Desired specialties based on tier
  const desiredSpecialties = triageTier
    ? TIER_SPECIALTIES[triageTier] ?? []
    : [];

  const scored = withDistance.map((h) => {
    // Parse specialties (handle both JSON string and array)
    const specialties: string[] =
      typeof h.specialties === "string"
        ? JSON.parse(h.specialties)
        : Array.isArray(h.specialties)
          ? h.specialties
          : [];

    // Normalized available beds (higher = better)
    const bedScore = h.available_beds / maxBeds;

    // Inverse distance (closer = better), avoid division by zero
    const distScore = 1 - h.distance_km / maxDistance;

    // Specialty match: 1 if any desired specialty matches, 0 otherwise
    const specialtyScore =
      desiredSpecialties.length > 0
        ? desiredSpecialties.some((s) => specialties.includes(s))
          ? 1
          : 0
        : 0.5; // neutral if no specialty preference

    // Normalized wait time (lower = better)
    const waitScore = h.wait_time_minutes / maxWait;

    const score =
      W_BEDS * bedScore +
      W_DISTANCE * distScore +
      W_SPECIALTY * specialtyScore -
      W_WAIT * waitScore;

    return {
      ...h,
      specialties, // ensure parsed array
      score: Math.round(score * 10000) / 10000,
    };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored;
}
