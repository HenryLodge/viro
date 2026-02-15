"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { RegionData } from "./AnomalyAlertsSidebar";

/* ── Severity → color mapping ── */

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444", // red
  high: "#f97316", // orange
  moderate: "#eab308", // yellow
  low: "#22c55e", // green
};

/* ── Generate arcs between anomaly hotspots and nearby regions ── */

function generateArcs(regions: RegionData[]) {
  const anomalies = regions.filter((r) => r.anomaly_flag);
  const arcs: {
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    color: string;
  }[] = [];

  for (const anomaly of anomalies) {
    // Connect to the 3 nearest non-anomaly regions
    const others = regions
      .filter((r) => r.id !== anomaly.id)
      .map((r) => ({
        ...r,
        dist: Math.sqrt(
          (r.lat - anomaly.lat) ** 2 + (r.lng - anomaly.lng) ** 2
        ),
      }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 3);

    for (const other of others) {
      arcs.push({
        startLat: anomaly.lat,
        startLng: anomaly.lng,
        endLat: other.lat,
        endLng: other.lng,
        color: other.anomaly_flag ? "#ef4444" : "rgba(239,68,68,0.3)",
      });
    }
  }

  return arcs;
}

/* ── Component ── */

export function GlobeVisualization({ regions }: { regions: RegionData[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const animFrameRef = useRef<number>();

  const initGlobe = useCallback(async () => {
    if (!containerRef.current || globeRef.current) return;

    // Dynamic import since globe.gl is client-only
    const GlobeModule = await import("globe.gl");
    const Globe = GlobeModule.default;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const maxCases = Math.max(...regions.map((r) => r.case_count), 1);
    const arcs = generateArcs(regions);

    const globe = new Globe(container)
      .width(width)
      .height(height)
      .backgroundColor("rgba(0,0,0,0)")
      .globeImageUrl(
        "//unpkg.com/three-globe/example/img/earth-night.jpg"
      )
      .bumpImageUrl(
        "//unpkg.com/three-globe/example/img/earth-topology.png"
      )
      .atmosphereColor("hsl(195,65%,48%)")
      .atmosphereAltitude(0.2)
      // Points
      .pointsData(regions)
      .pointLat("lat")
      .pointLng("lng")
      .pointAltitude((d: object) => {
        const r = d as RegionData;
        return 0.01 + (r.case_count / maxCases) * 0.15;
      })
      .pointRadius((d: object) => {
        const r = d as RegionData;
        return 0.3 + (r.case_count / maxCases) * 0.8;
      })
      .pointColor((d: object) => {
        const r = d as RegionData;
        return SEVERITY_COLORS[r.severity] ?? SEVERITY_COLORS.low;
      })
      .pointLabel((d: object) => {
        const r = d as RegionData;
        return `<div style="background:rgba(0,0,0,0.85);color:white;padding:8px 12px;border-radius:8px;font-size:12px;line-height:1.5;border:1px solid rgba(255,255,255,0.1);">
          <b>${r.name}</b><br/>
          Cases: ${r.case_count.toLocaleString()}<br/>
          Severity: ${r.severity}${r.anomaly_flag ? "<br/><span style='color:#ef4444;font-weight:bold;'>⚠ ANOMALY DETECTED</span>" : ""}
        </div>`;
      })
      // Arcs
      .arcsData(arcs)
      .arcStartLat("startLat")
      .arcStartLng("startLng")
      .arcEndLat("endLat")
      .arcEndLng("endLng")
      .arcColor("color")
      .arcStroke(0.5)
      .arcDashLength(0.4)
      .arcDashGap(0.2)
      .arcDashAnimateTime(2000);

    // Pulsing rings for anomaly regions
    const rings = regions
      .filter((r) => r.anomaly_flag)
      .map((r) => ({
        lat: r.lat,
        lng: r.lng,
        maxR: 3,
        propagationSpeed: 2,
        repeatPeriod: 1000,
        color: "rgba(239, 68, 68, 0.6)",
      }));

    globe
      .ringsData(rings)
      .ringLat("lat")
      .ringLng("lng")
      .ringMaxRadius("maxR")
      .ringPropagationSpeed("propagationSpeed")
      .ringRepeatPeriod("repeatPeriod")
      .ringColor(() => (t: number) => `rgba(239, 68, 68, ${1 - t})`);

    // Auto-rotate
    const controls = globe.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;
      controls.enableZoom = true;
      controls.minDistance = 200;
      controls.maxDistance = 500;
    }

    // Initial camera position
    globe.pointOfView({ lat: 30, lng: -20, altitude: 2.2 }, 1000);

    globeRef.current = globe;
    setReady(true);

    // Handle resize
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (globeRef.current) {
          globeRef.current.width(w).height(h);
        }
      }
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [regions]);

  useEffect(() => {
    initGlobe();
    const container = containerRef.current;

    return () => {
      if (globeRef.current) {
        // Clean up the globe instance
        if (container) {
          while (container.firstChild) {
            container.removeChild(container.firstChild);
          }
        }
        globeRef.current = null;
      }
    };
  }, [initGlobe]);

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <div ref={containerRef} className="w-full h-full" />

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center">
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
            <p className="text-sm text-white/40">Loading globe...</p>
          </div>
        </div>
      )}
    </div>
  );
}
