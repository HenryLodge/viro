"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { NetworkFilterState } from "@/components/provider/NetworkFilterPanel";
import type { ParsedFilterState } from "@/lib/ai-query";

/* ══════════════════════════════════════════════════════════════
   Props
   ══════════════════════════════════════════════════════════════ */

interface NetworkQueryBarProps {
  /** Available symptoms derived from current graph nodes. */
  availableSymptoms: string[];
  /** Available regions derived from current graph nodes. */
  availableRegions: string[];
  /** Called with the AI-parsed filter state (Sets) when a query succeeds. */
  onFiltersApplied: (filters: NetworkFilterState) => void;
  /** Called with an ISO date if the query includes a time constraint. */
  onTimeConstraint?: (date: Date) => void;
}

/* ══════════════════════════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════════════════════════ */

/** Convert the API's array-based filter state to the Set-based NetworkFilterState. */
function toFilterState(parsed: ParsedFilterState): NetworkFilterState {
  return {
    ageGroups: new Set(parsed.ageGroups),
    triageTiers: new Set(parsed.triageTiers),
    symptoms: new Set(parsed.symptoms),
    regions: new Set(parsed.regions),
  };
}

/* ══════════════════════════════════════════════════════════════
   Component
   ══════════════════════════════════════════════════════════════ */

export function NetworkQueryBar({
  availableSymptoms,
  availableRegions,
  onFiltersApplied,
  onTimeConstraint,
}: NetworkQueryBarProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Clear success badge after a delay */
  useEffect(() => {
    return () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, []);

  /* ── Submit handler ── */
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      const trimmed = query.trim();
      if (!trimmed || loading) return;

      setLoading(true);
      setError(null);
      setSuccess(false);

      try {
        const res = await fetch("/api/network/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: trimmed,
            availableSymptoms,
            availableRegions,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            (data as { error?: string }).error ?? `Request failed (${res.status})`
          );
        }

        const parsed: ParsedFilterState = await res.json();

        /* Apply filters */
        onFiltersApplied(toFilterState(parsed));

        /* Apply time constraint if present */
        if (parsed.beforeDate && onTimeConstraint) {
          const d = new Date(parsed.beforeDate);
          if (!isNaN(d.getTime())) {
            onTimeConstraint(d);
          }
        }

        /* Flash success state */
        setSuccess(true);
        successTimer.current = setTimeout(() => setSuccess(false), 2500);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Query failed");
      } finally {
        setLoading(false);
      }
    },
    [query, loading, availableSymptoms, availableRegions, onFiltersApplied, onTimeConstraint]
  );

  /* ── Keyboard shortcut: Enter to submit ── */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === "Escape") {
        setQuery("");
        setError(null);
        inputRef.current?.blur();
      }
    },
    [handleSubmit]
  );

  /* ── Clear handler ── */
  const handleClear = useCallback(() => {
    setQuery("");
    setError(null);
    setSuccess(false);
    inputRef.current?.focus();
  }, []);

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex items-center gap-1.5 max-w-md flex-1"
    >
      {/* Input wrapper */}
      <div
        className={`relative flex items-center flex-1 rounded-lg border transition-all ${
          error
            ? "border-red-500/40 bg-red-500/[0.05]"
            : success
              ? "border-emerald-500/40 bg-emerald-500/[0.05]"
              : "border-white/[0.08] bg-white/[0.03] focus-within:border-white/[0.18] focus-within:bg-white/[0.05]"
        }`}
      >
        {/* AI Sparkle icon */}
        <div className="pl-2.5 flex-shrink-0">
          {loading ? (
            <svg
              className="h-3.5 w-3.5 text-cyan-400 animate-spin"
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
          ) : (
            <svg
              className={`h-3.5 w-3.5 transition-colors ${
                success
                  ? "text-emerald-400"
                  : error
                    ? "text-red-400"
                    : "text-cyan-400/60"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
              />
            </svg>
          )}
        </div>

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask AI to filter... e.g. &quot;critical patients over 65 in Boston&quot;"
          disabled={loading}
          className="flex-1 bg-transparent px-2 py-1.5 text-xs text-white/80 placeholder-white/25 outline-none disabled:opacity-50"
        />

        {/* Clear button (shown when there is text) */}
        {query && !loading && (
          <button
            type="button"
            onClick={handleClear}
            className="pr-1.5 flex-shrink-0 text-white/25 hover:text-white/50 transition-colors"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="flex-shrink-0 mr-1 rounded-md bg-cyan-500/15 px-2 py-1 text-[10px] font-medium text-cyan-400 hover:bg-cyan-500/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "Thinking..." : "Query"}
        </button>
      </div>

      {/* Error tooltip */}
      {error && (
        <div className="absolute top-full left-0 mt-1.5 z-50 max-w-sm">
          <div className="rounded-lg border border-red-500/20 bg-red-950/80 backdrop-blur-sm px-3 py-2 shadow-lg">
            <div className="flex items-start gap-2">
              <svg
                className="h-3.5 w-3.5 text-red-400 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
              <p className="text-[11px] text-red-300 leading-relaxed">{error}</p>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-red-400/60 hover:text-red-300 flex-shrink-0"
              >
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
