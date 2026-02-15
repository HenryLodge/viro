"use client";

import { useEffect, useState } from "react";
import { CapacitySummaryCards } from "@/components/provider/CapacitySummaryCards";
import {
  HospitalCapacityTable,
  type HospitalData,
} from "@/components/provider/HospitalCapacityTable";

export default function ProviderCapacityPage() {
  const [hospitals, setHospitals] = useState<HospitalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHospitals() {
      try {
        const res = await fetch("/api/hospitals");
        if (!res.ok) throw new Error("Failed to fetch hospitals");
        const data = await res.json();

        // Ensure specialties are parsed arrays
        const parsed = data.map(
          (h: HospitalData & { specialties: string[] | string }) => ({
            ...h,
            specialties:
              typeof h.specialties === "string"
                ? JSON.parse(h.specialties)
                : Array.isArray(h.specialties)
                  ? h.specialties
                  : [],
          })
        );

        setHospitals(parsed);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load hospitals"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchHospitals();
  }, []);

  if (loading) {
    return (
      <div className="container max-w-7xl py-8 px-4 sm:px-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <svg
              className="h-8 w-8 text-[hsl(195,65%,55%)] animate-spin mx-auto mb-3"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-sm text-white/40">Loading hospital data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-7xl py-8 px-4 sm:px-6">
        <div className="text-center py-20">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-8 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white/90">Hospital Capacity</h1>
        <p className="mt-1 text-sm text-white/40">
          Real-time overview of hospital beds, wait times, and utilization
          across the network.
        </p>
      </div>

      <div className="space-y-6">
        <CapacitySummaryCards hospitals={hospitals} />
        <HospitalCapacityTable hospitals={hospitals} />
      </div>
    </div>
  );
}
