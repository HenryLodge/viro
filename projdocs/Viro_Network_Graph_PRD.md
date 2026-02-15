# VIRO — Symptom Network Graph & Cluster Detection

## Overview

A real-time patient network graph — inspired by Obsidian's graph view — where every triaged patient becomes a node and edges form automatically between patients who share symptoms, travel history, geographic proximity, or exposure links. Clusters that form rapidly signal potential outbreaks before any human could spot them manually.

This is the intelligence layer that turns VIRO from a triage tool into an outbreak detection system.

---

## What It Does

Every time a patient completes triage, the network engine:

1. Compares them against all recent patients across multiple dimensions
2. Creates weighted edges where similarity is strong enough
3. Detects clusters of connected patients
4. If a cluster crosses a threshold — automatically generates an outbreak alert with details and recommended actions

No human has to manually trace contacts or review spreadsheets. The system finds the patterns on its own.

---

## The Network Graph

### Nodes
- Each node is a triaged patient
- Node color represents their triage tier (green = self-care, yellow = routine, orange = urgent, red = critical)
- Node size can represent number of connections (more connected = larger)

### Edges
Edges form between two patients when they share characteristics. Each edge has a weight based on how many dimensions match and how strong the match is.

**Similarity Dimensions:**

- **Symptom Overlap** — Compare symptom arrays between patients. Use Jaccard similarity (intersection / union). Edge forms if overlap exceeds a threshold (e.g., 3+ shared symptoms or Jaccard > 0.4).
- **Travel Correlation** — Both patients traveled to the same region within the same 14-day window. Strong signal.
- **Geographic Proximity** — Both patients are in the same metro area and were triaged within 48 hours of each other.
- **Exposure Linkage** — Both report exposure to confirmed cases at overlapping locations or events.

**Edge Weight Calculation:**
Each matching dimension adds to the edge weight. More dimensions = stronger connection.

```
weight = (symptom_score × 0.35)
       + (travel_score × 0.30)
       + (geo_temporal_score × 0.20)
       + (exposure_score × 0.15)
```

Only create an edge if total weight exceeds a minimum threshold.

### Visual Behavior
- Force-directed layout — connected nodes pull toward each other, unconnected ones drift apart
- Outbreak clusters literally clump together on screen
- Hover on a node → see patient summary (anonymized: age, symptoms, tier, location)
- Hover on an edge → see why they're connected ("shared symptoms: fever, cough, fatigue + both traveled to London")
- Clusters that are growing rapidly pulse or glow
- New nodes animate in and edges draw in real time as patients get triaged

---

## Cluster Detection

### Algorithm
Keep it simple — no need for complex graph algorithms:

1. Build an adjacency list from patient nodes and their weighted edges
2. Run connected components (flood fill / BFS) to identify clusters
3. Score each cluster:

```
cluster_score = cluster_size × avg_edge_weight × recency_factor
```

Where recency_factor weights clusters with more recent patients higher.

4. If cluster score exceeds a threshold → flag as potential outbreak → generate alert

### What a Cluster Alert Contains
- Number of connected patients
- Shared symptoms across the cluster
- Geographic spread (which cities/regions)
- Travel commonalities (if any)
- Growth rate (how fast the cluster is forming)
- AI-generated recommended action (via GPT-4o): targeted screening, travel advisories, resource pre-positioning, etc.

---

## How It Fits the Existing System

```
Patient submits intake → Triage API scores them → Patient saved to DB
                                                        ↓
                                          Network Engine runs:
                                            - Fetch recent patients
                                            - Compute similarity scores
                                            - Create/update edges
                                            - Run cluster detection
                                            - If threshold hit → generate alert
                                                        ↓
                                          Provider dashboard updates:
                                            - Network graph view refreshes
                                            - New cluster alert appears in sidebar
                                            - Globe view highlights affected regions
```

The network engine can run either:
- **On every new patient** (triggered by the triage API after saving results)
- **On a polling interval** (recompute clusters every N seconds)

For the hackathon, triggering on each new patient is simpler and more demo-friendly — you submit a patient and immediately see them connect.

---

## Provider Dashboard Integration

The provider dashboard gets a **view toggle**:

- **Globe View** (existing) — Geographic heatmap showing regions, case counts, severity, anomaly detection. Answers: "Where are outbreaks happening?"
- **Network View** (new) — Obsidian-style force graph showing patient nodes and edges. Answers: "How are patients connected and what patterns are forming?"

Both views share the same anomaly/alert sidebar. Cluster alerts from the network engine appear alongside regional anomaly alerts.

---

## Implementation

### New Files
- **`lib/network-engine.ts`** — Core logic: similarity functions, edge computation, cluster detection, alert generation
- **`app/api/network/route.ts`** — API endpoint returning nodes, edges, and clusters
- **`components/provider/NetworkGraph.tsx`** — Force-directed graph visualization component

### Modified Files
- **`app/api/triage/route.ts`** — After saving triage result, trigger network engine to process the new patient
- **`app/provider/dashboard/page.tsx`** — Add view toggle between globe and network graph
- **`components/provider/AnomalyAlertsSidebar.tsx`** — Display cluster alerts alongside existing anomaly alerts

### Visualization Library
Use `react-force-graph-2d` or `react-force-graph-3d` (by the same author as Globe.gl — consistent look and feel). These support:
- Force-directed layout out of the box
- Node coloring, sizing, hover tooltips
- Edge rendering with labels
- Real-time data updates
- Click and hover interactions

---

## Mock Data for Demo

Ensure seed data includes patients that naturally cluster:

- **Cluster A (London travel):** 3-4 patients across different cities, all with respiratory symptoms, all traveled to London in the past 2 weeks
- **Cluster B (Local outbreak):** 3-4 patients in the Boston area with gastrointestinal symptoms within 48 hours
- **Isolated patients:** 4-5 patients with no strong connections (shows the system doesn't create false clusters)

During the live demo: submit a new patient with London travel + respiratory symptoms → they connect to Cluster A in real time → cluster threshold triggers → alert fires.

---

## Demo Narrative

"Every patient who goes through VIRO becomes a node in our network graph. The system automatically finds connections — shared symptoms, overlapping travel, geographic proximity. Watch what happens when I submit this new patient... they have a fever, cough, and recently traveled to London. The system instantly connects them to three other patients across Boston, New York, and Philly who share the same profile. That cluster just crossed our threshold — and VIRO automatically generates an alert: possible emerging respiratory outbreak linked to London travel, recommending targeted screening at international arrivals. No epidemiologist had to manually trace these connections. The system found the pattern on its own."

---

*This is what separates VIRO from a triage app. It doesn't just help individual patients — it discovers outbreaks in real time by connecting the dots that no single doctor can see.*
