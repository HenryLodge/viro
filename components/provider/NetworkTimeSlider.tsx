"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ══════════════════════════════════════════════════════════════
   NetworkTimeSlider — controls the visible time window of the graph
   ══════════════════════════════════════════════════════════════ */

interface TimeSliderProps {
  minDate: Date;
  maxDate: Date;
  currentDate: Date;
  onChange: (date: Date) => void;
  totalCount: number;
  visibleCount: number;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function NetworkTimeSlider({
  minDate,
  maxDate,
  currentDate,
  onChange,
  totalCount,
  visibleCount,
}: TimeSliderProps) {
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const range = maxDate.getTime() - minDate.getTime();
  const current = currentDate.getTime() - minDate.getTime();
  const pct = range > 0 ? current / range : 1;

  /* ── Slider change handler ── */
  const handleSlider = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value);
      const ms = minDate.getTime() + (val / 1000) * range;
      onChange(new Date(ms));
    },
    [minDate, range, onChange],
  );

  /* ── Play / pause animation ── */
  const currentRef = useRef(currentDate);
  currentRef.current = currentDate;

  useEffect(() => {
    if (playing) {
      const stepMs = range / 120; // ~120 steps
      intervalRef.current = setInterval(() => {
        const next = new Date(currentRef.current.getTime() + stepMs);
        if (next >= maxDate) {
          setPlaying(false);
          onChange(maxDate);
        } else {
          onChange(next);
        }
      }, 100);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, range, maxDate, onChange]);

  const togglePlay = useCallback(() => {
    // Reset to start if we're at the end
    if (currentDate >= maxDate) {
      onChange(minDate);
    }
    setPlaying((p) => !p);
  }, [currentDate, maxDate, minDate, onChange]);

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-[#0a0a0f] border-t border-white/[0.04]">
      {/* Play / Pause */}
      <button
        onClick={togglePlay}
        className="flex items-center justify-center h-6 w-6 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white/80 transition-colors flex-shrink-0"
        title={playing ? "Pause" : "Play timeline"}
      >
        {playing ? (
          <svg
            className="h-3 w-3"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg
            className="h-3 w-3 ml-0.5"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Min date */}
      <span className="text-[9px] text-white/30 flex-shrink-0 w-12 text-right">
        {fmtDate(minDate)}
      </span>

      {/* Range input */}
      <div className="flex-1 relative">
        <input
          type="range"
          min={0}
          max={1000}
          value={Math.round(pct * 1000)}
          onChange={handleSlider}
          className="w-full h-1 appearance-none bg-white/[0.08] rounded-full outline-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(34,211,238,0.4)]
            [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-cyan-400 [&::-moz-range-thumb]:border-0"
        />
        {/* Current date label centered above thumb */}
        <div
          className="absolute -top-4 text-[9px] text-cyan-400 font-medium whitespace-nowrap pointer-events-none"
          style={{
            left: `${pct * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {fmtDate(currentDate)}
        </div>
      </div>

      {/* Max date */}
      <span className="text-[9px] text-white/30 flex-shrink-0 w-12">
        {fmtDate(maxDate)}
      </span>

      {/* Count */}
      <span className="text-[9px] text-white/30 flex-shrink-0 whitespace-nowrap">
        <span className="text-white/60 font-medium">{visibleCount}</span>
        <span className="text-white/20"> / </span>
        <span>{totalCount}</span>
      </span>
    </div>
  );
}
