import type { GraphNode } from "@/lib/network-engine";

/**
 * Export an array of GraphNodes to a CSV file and trigger a download.
 */
export function exportFilteredCSV(
  nodes: GraphNode[],
  filename?: string,
): void {
  const headers = [
    "Age",
    "Triage Tier",
    "Symptoms",
    "Severity Flags",
    "Risk Factors",
    "Travel History",
    "Exposure History",
    "Region",
    "Connections",
    "Created At",
  ];

  const escapeCSV = (val: string): string => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const rows = nodes.map((n) => [
    n.age?.toString() ?? "",
    n.tier ?? "",
    n.symptoms.join("; "),
    n.severityFlags.join("; "),
    n.riskFactors.join("; "),
    n.travelHistory ?? "",
    n.exposureHistory ?? "",
    n.location ?? "",
    n.connectionCount.toString(),
    n.createdAt
      ? new Date(n.createdAt).toISOString()
      : "",
  ]);

  const csvContent = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download =
    filename ?? `viro-network-export-${new Date().toISOString().slice(0, 10)}.csv`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}
