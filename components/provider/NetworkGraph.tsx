"use client";

import { useRef, useCallback, useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import type {
  GraphNode,
  GraphEdge,
  Cluster,
} from "@/lib/network-engine";
import type { NetworkFilterState } from "@/components/provider/NetworkFilterPanel";
import { nodeMatchesFilter, isFilterActive } from "@/components/provider/NetworkFilterPanel";

/* ── Dynamically import ForceGraph2D (client-only, uses canvas) ── */
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

/* ══════════════════════════════════════════════════════════════
   Obsidian-style palette — muted but distinct tier colors
   ══════════════════════════════════════════════════════════════ */

const TIER_COLORS: Record<string, string> = {
  "self-care": "#6ee7b7", // teal-green
  routine: "#7dd3fc", // sky-blue
  urgent: "#c084fc", // purple
  critical: "#fb7185", // rose
};

const DEFAULT_NODE_COLOR = "#a1a1aa"; // zinc-400

/* ── Canvas background ── */
const CANVAS_BG = "#0a0a0f";

/* ── Props ── */

interface NetworkGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: Cluster[];
  activeFilters?: NetworkFilterState | null;
  timeLimit?: Date | null;
  onNodeSelect?: (nodeId: string) => void;
}

/* ── Internal data shapes for react-force-graph ── */

interface FGNode {
  id: string;
  tier: string | null;
  connectionCount: number;
  label: string;
  age: number | null;
  symptoms: string[];
  location: string | null;
  clusterAlertId?: string;
  x?: number;
  y?: number;
}

interface FGLink {
  source: string | FGNode;
  target: string | FGNode;
  weight: number;
  reason: string;
}

/* ── Helpers ── */

function linkSourceId(link: FGLink): string {
  return typeof link.source === "string" ? link.source : link.source.id;
}

function linkTargetId(link: FGLink): string {
  return typeof link.target === "string" ? link.target : link.target.id;
}

/* ══════════════════════════════════════════════════════════════
   Component
   ══════════════════════════════════════════════════════════════ */

export function NetworkGraph({
  nodes,
  edges,
  clusters,
  activeFilters,
  timeLimit,
  onNodeSelect,
}: NetworkGraphProps) {
  /* ── Refs & state ── */
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null);

  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [hoveredNode, setHoveredNode] = useState<FGNode | null>(null);
  const [hoveredLink, setHoveredLink] = useState<FGLink | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  /* ── Hovered node + neighbors highlight set ── */
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(
    null
  );

  // Track which node IDs belong to alerted clusters
  const { alertNodeIds, nodeClusterMap } = useMemo(() => {
    const ids = new Set<string>();
    const clusterMap = new Map<string, string>();
    for (const cluster of clusters) {
      if (cluster.isAlert) {
        for (const id of cluster.patientIds) {
          ids.add(id);
          clusterMap.set(id, cluster.id);
        }
      }
    }
    return { alertNodeIds: ids, nodeClusterMap: clusterMap };
  }, [clusters]);

  /* ── Build adjacency map for neighbor lookup ── */
  const neighborMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const e of edges) {
      if (!map.has(e.source)) map.set(e.source, new Set());
      if (!map.has(e.target)) map.set(e.target, new Set());
      map.get(e.source)!.add(e.target);
      map.get(e.target)!.add(e.source);
    }
    return map;
  }, [edges]);

  /* ── The set of nodes to keep bright on hover ── */
  const highlightedSet = useMemo(() => {
    if (!highlightedNodeId) return null;
    const set = new Set<string>();
    set.add(highlightedNodeId);
    const neighbors = neighborMap.get(highlightedNodeId);
    if (neighbors) {
      for (const n of Array.from(neighbors)) set.add(n);
    }
    return set;
  }, [highlightedNodeId, neighborMap]);

  /* ── Measure container ── */
  useEffect(() => {
    function measure() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    }
    measure();
    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  /* ── Filtered node set (filters + time) ── */
  const filteredNodeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const n of nodes) {
      if (!nodeMatchesFilter(n, activeFilters ?? null)) continue;
      if (timeLimit && n.createdAt && new Date(n.createdAt) > timeLimit) continue;
      ids.add(n.id);
    }
    return ids;
  }, [nodes, activeFilters, timeLimit]);

  const filtersActive = isFilterActive(activeFilters ?? null) || timeLimit != null;

  /* ── Graph data ── */
  const graphData = useMemo(
    () => ({
      nodes: nodes
        .filter((n) => filteredNodeIds.has(n.id))
        .map((n) => ({
          ...n,
          clusterAlertId: nodeClusterMap.get(n.id),
        })) as FGNode[],
      links: edges
        .filter(
          (e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
        )
        .map((e) => ({
          source: e.source,
          target: e.target,
          weight: e.weight,
          reason: e.reason,
        })) as FGLink[],
    }),
    [nodes, edges, nodeClusterMap, filteredNodeIds]
  );

  /* ── Tune d3 forces for better spread ── */
  useEffect(() => {
    if (!graphRef.current) return;
    const fg = graphRef.current;
    // Stronger repulsion to spread nodes apart
    fg.d3Force("charge")?.strength(-120).distanceMax(300);
    // Longer links so clusters separate visually
    fg.d3Force("link")?.distance(40);
    // Re-heat simulation to apply new forces
    fg.d3ReheatSimulation();
  }, [graphData]);

  /* ══════════════════════════════════════════════════════════════
     Node canvas rendering — Obsidian-style soft glow + labels
     ══════════════════════════════════════════════════════════════ */

  const paintNode = useCallback(
    (node: FGNode, ctx: CanvasRenderingContext2D) => {
      const baseRadius = Math.max(4, (node.connectionCount ?? 0) * 1.2 + 4);
      const color = TIER_COLORS[node.tier ?? ""] ?? DEFAULT_NODE_COLOR;
      const x = node.x ?? 0;
      const y = node.y ?? 0;

      // Determine if this node is dimmed (hover-highlight active but this node is not in the set)
      const isDimmed = highlightedSet !== null && !highlightedSet.has(node.id);
      const isHighlighted =
        highlightedSet !== null && highlightedSet.has(node.id);
      const opacity = isDimmed ? 0.15 : 1;
      const radius = isDimmed ? baseRadius * 0.7 : baseRadius;

      ctx.globalAlpha = opacity;

      // Outer glow (soft bloom)
      ctx.beginPath();
      ctx.arc(x, y, radius + 4, 0, 2 * Math.PI);
      ctx.fillStyle = hexWithAlpha(color, 0.1);
      ctx.fill();

      // Alert glow ring for cluster-alert nodes
      if (alertNodeIds.has(node.id) && !isDimmed) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 6, 0, 2 * Math.PI);
        ctx.fillStyle = hexWithAlpha(color, 0.08);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, radius + 3, 0, 2 * Math.PI);
        ctx.strokeStyle = hexWithAlpha(color, 0.35);
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Main circle
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      // Thin ring
      ctx.strokeStyle = hexWithAlpha(color, 0.3);
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Highlight ring when hovered directly
      if (isHighlighted && highlightedNodeId === node.id) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 2, 0, 2 * Math.PI);
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Label below node
      if (!isDimmed) {
        const label =
          node.label.length > 24
            ? node.label.slice(0, 22) + "..."
            : node.label;
        ctx.font = "3.5px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = isHighlighted
          ? "rgba(255,255,255,0.7)"
          : "rgba(255,255,255,0.35)";
        ctx.fillText(label, x, y + radius + 3);
      }

      ctx.globalAlpha = 1;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [highlightedSet, highlightedNodeId, alertNodeIds]
  );

  /* ══════════════════════════════════════════════════════════════
     Link rendering — dim non-highlighted edges
     ══════════════════════════════════════════════════════════════ */

  const getLinkColor = useCallback(
    (link: FGLink) => {
      if (!highlightedSet) return "rgba(255,255,255,0.18)";
      const src = linkSourceId(link);
      const tgt = linkTargetId(link);
      const isActive = highlightedSet.has(src) && highlightedSet.has(tgt);
      return isActive ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.06)";
    },
    [highlightedSet]
  );

  const getLinkWidth = useCallback(
    (link: FGLink) => {
      if (!highlightedSet) return Math.max(1, link.weight * 3);
      const src = linkSourceId(link);
      const tgt = linkTargetId(link);
      const isActive = highlightedSet.has(src) && highlightedSet.has(tgt);
      return isActive ? Math.max(1.5, link.weight * 4) : 0.4;
    },
    [highlightedSet]
  );

  /* ══════════════════════════════════════════════════════════════
     Interaction handlers
     ══════════════════════════════════════════════════════════════ */

  const handleNodeHover = useCallback((node: FGNode | null) => {
    setHoveredNode(node);
    setHighlightedNodeId(node ? node.id : null);
    if (!node) setHoveredLink(null);
  }, []);

  const handleLinkHover = useCallback((link: FGLink | null) => {
    setHoveredLink(link);
    if (!link) setHoveredNode(null);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  /* ── Click to focus (center + zoom) + drill-down ── */
  const handleNodeClick = useCallback((node: FGNode) => {
    if (graphRef.current && node.x != null && node.y != null) {
      graphRef.current.centerAt(node.x, node.y, 400);
      graphRef.current.zoom(3, 400);
    }
    onNodeSelect?.(node.id);
  }, [onNodeSelect]);

  /* ── Double-click background to reset view ── */
  const handleBackgroundClick = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 40);
    }
  }, []);

  /* ══════════════════════════════════════════════════════════════
     Render
     ══════════════════════════════════════════════════════════════ */

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative"
      onMouseMove={handleMouseMove}
    >
      {nodes.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-white/30">
            No connected patients to display. Submit patients through intake to
            build the network.
          </p>
        </div>
      ) : (
        <ForceGraph2D
          ref={graphRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeCanvasObject={paintNode as never}
          nodePointerAreaPaint={((
            node: FGNode,
            color: string,
            ctx: CanvasRenderingContext2D
          ) => {
            const radius = Math.max(4, (node.connectionCount ?? 0) * 1.2 + 4);
            ctx.beginPath();
            ctx.arc(node.x ?? 0, node.y ?? 0, radius + 4, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
          }) as never}
          onNodeHover={handleNodeHover as never}
          onNodeClick={handleNodeClick as never}
          onLinkHover={handleLinkHover as never}
          onBackgroundClick={handleBackgroundClick as never}
          linkWidth={getLinkWidth as never}
          linkColor={getLinkColor as never}
          backgroundColor={CANVAS_BG}
          cooldownTicks={100}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.25}
          d3AlphaMin={0.005}
          nodeRelSize={1}
          linkDirectionalParticles={0}
        />
      )}

      {/* Tooltip — Node */}
      {hoveredNode && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: mousePos.x + 14,
            top: mousePos.y + 14,
          }}
        >
          <div className="bg-black/90 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 max-w-xs shadow-xl">
            <p className="text-xs font-semibold text-white/90">
              {hoveredNode.label}
            </p>
            {hoveredNode.location && (
              <p className="text-[10px] text-white/50 mt-0.5">
                {hoveredNode.location}
              </p>
            )}
            <p className="text-[10px] text-white/40 mt-0.5">
              {hoveredNode.connectionCount} connection
              {hoveredNode.connectionCount !== 1 ? "s" : ""}
            </p>
            {hoveredNode.clusterAlertId && (
              <p className="text-[10px] text-red-400 mt-0.5 font-medium">
                Part of active cluster alert
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tooltip — Edge */}
      {hoveredLink && !hoveredNode && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: mousePos.x + 14,
            top: mousePos.y + 14,
          }}
        >
          <div className="bg-black/90 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 max-w-xs shadow-xl">
            <p className="text-[10px] text-white/60 font-medium">
              Connection strength:{" "}
              <span className="text-white/90">
                {Math.round(hoveredLink.weight * 100)}%
              </span>
            </p>
            <p className="text-[10px] text-white/50 mt-0.5">
              {hoveredLink.reason}
            </p>
          </div>
        </div>
      )}

      {/* Stats overlay */}
      <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/[0.06]">
        <div className="flex items-center gap-4 text-[10px] text-white/50">
          <span>
            <span className="text-white/80 font-semibold">
              {filtersActive ? `${graphData.nodes.length}/${nodes.length}` : nodes.length}
            </span>{" "}
            nodes
          </span>
          <span>
            <span className="text-white/80 font-semibold">
              {filtersActive ? graphData.links.length : edges.length}
            </span>{" "}
            edges
          </span>
          <span>
            <span className="text-white/80 font-semibold">
              {clusters.filter((c) => c.isAlert).length}
            </span>{" "}
            alerts
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/[0.06]">
        {[
          { label: "Self-care", color: "#6ee7b7" },
          { label: "Routine", color: "#7dd3fc" },
          { label: "Urgent", color: "#c084fc" },
          { label: "Critical", color: "#fb7185" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[10px] text-white/50">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Utility: hex color + alpha → rgba string ── */

function hexWithAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
