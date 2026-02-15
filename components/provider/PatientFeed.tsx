"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { PatientCard, type PatientRecord } from "./PatientCard";
import { cn } from "@/lib/utils";

/* ── Filter options ── */

const TIER_FILTERS = [
  { value: "all", label: "All" },
  { value: "critical", label: "Critical" },
  { value: "urgent", label: "Urgent" },
  { value: "routine", label: "Routine" },
  { value: "self-care", label: "Self-Care" },
] as const;

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "triaged", label: "Triaged" },
  { value: "routed", label: "Routed" },
  { value: "admitted", label: "Admitted" },
] as const;

/* ── Component ── */

export function PatientFeed() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const newIdsRef = useRef<Set<string>>(new Set());

  /* ── Fetch initial patients ── */
  const fetchPatients = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPatients(data as PatientRecord[]);
    }
    setLoading(false);
  }, []);

  /* ── Subscribe to real-time updates ── */
  useEffect(() => {
    fetchPatients();

    const supabase = createClient();
    const channel = supabase
      .channel("patients-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "patients" },
        (payload) => {
          const newPatient = payload.new as PatientRecord;
          newIdsRef.current.add(newPatient.id);
          setPatients((prev) => [newPatient, ...prev]);

          // Remove "new" highlight after 5 seconds
          setTimeout(() => {
            newIdsRef.current.delete(newPatient.id);
          }, 5000);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "patients" },
        (payload) => {
          const updated = payload.new as PatientRecord;
          setPatients((prev) =>
            prev.map((p) => (p.id === updated.id ? updated : p))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPatients]);

  /* ── Filter patients ── */
  const filtered = patients.filter((p) => {
    if (tierFilter !== "all" && p.triage_tier !== tierFilter) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (
      searchQuery &&
      !(p.full_name ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  /* ── Stats ── */
  const stats = {
    total: patients.length,
    critical: patients.filter((p) => p.triage_tier === "critical").length,
    urgent: patients.filter((p) => p.triage_tier === "urgent").length,
    pending: patients.filter((p) => p.status === "pending").length,
  };

  if (loading) {
    return (
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
          <p className="text-sm text-white/40">Loading patient feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Patients" value={stats.total} />
        <StatCard
          label="Critical"
          value={stats.critical}
          valueColor="text-red-400"
        />
        <StatCard
          label="Urgent"
          value={stats.urgent}
          valueColor="text-orange-400"
        />
        <StatCard
          label="Pending Triage"
          value={stats.pending}
          valueColor="text-yellow-300"
        />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-[hsl(195,65%,48%)] focus:border-[hsl(195,65%,48%)]"
          />
        </div>

        {/* Tier filter */}
        <div className="flex gap-1">
          {TIER_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setTierFilter(f.value)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                tierFilter === f.value
                  ? "bg-[hsl(195,65%,48%)]/15 text-[hsl(195,65%,55%)] ring-1 ring-[hsl(195,65%,48%)]/30"
                  : "text-white/35 hover:text-white/60 hover:bg-white/[0.04]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                statusFilter === f.value
                  ? "bg-white/[0.08] text-white/80 ring-1 ring-white/10"
                  : "text-white/35 hover:text-white/60 hover:bg-white/[0.04]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Patient list ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <p className="text-sm text-white/30">
            No patients match your filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              isNew={newIdsRef.current.has(patient.id)}
            />
          ))}
        </div>
      )}

      {/* Real-time indicator */}
      <div className="flex items-center justify-center gap-2 py-2">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[11px] text-white/25">
          Live — new patients appear automatically
        </span>
      </div>
    </div>
  );
}

/* ── Stat card helper ── */

function StatCard({
  label,
  value,
  valueColor = "text-white/90",
}: {
  label: string;
  value: number;
  valueColor?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <p className={cn("text-2xl font-bold", valueColor)}>{value}</p>
      <p className="text-[11px] text-white/40 font-medium uppercase tracking-wider mt-1">
        {label}
      </p>
    </div>
  );
}
