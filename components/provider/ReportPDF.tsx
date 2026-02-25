"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { ReportSection } from "@/lib/ai-report";

/* ══════════════════════════════════════════════════════════════
   Fonts — use built-in Helvetica to avoid web font issues
   ══════════════════════════════════════════════════════════════ */

Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica" },
    { src: "Helvetica-Bold", fontWeight: "bold" },
    { src: "Helvetica-Oblique", fontStyle: "italic" },
  ],
});

/* ══════════════════════════════════════════════════════════════
   Styles
   ══════════════════════════════════════════════════════════════ */

const colors = {
  bg: "#0f1117",
  cardBg: "#161821",
  border: "#2a2d3a",
  accentBlue: "#4bb3d0",
  accentGreen: "#6ee7b7",
  textPrimary: "#e5e5ea",
  textSecondary: "#9ca3af",
  textMuted: "#6b7280",
  white: "#ffffff",
};

const AUDIENCE_COLORS: Record<string, string> = {
  government: "#60a5fa",
  hospital: "#6ee7b7",
  technical: "#c084fc",
};

const s = StyleSheet.create({
  page: {
    backgroundColor: colors.bg,
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    color: colors.textPrimary,
  },
  /* ── Header ── */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: {
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 3,
    color: colors.accentBlue,
  },
  subtitle: {
    fontSize: 8,
    color: colors.textMuted,
    marginTop: 2,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  audienceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    fontSize: 7,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerDate: {
    fontSize: 8,
    color: colors.textMuted,
    marginTop: 4,
  },
  /* ── Title ── */
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 6,
  },
  meta: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  metaItem: {
    fontSize: 8,
    color: colors.textMuted,
  },
  metaValue: {
    fontWeight: "bold",
    color: colors.textSecondary,
  },
  /* ── Executive Summary ── */
  summaryCard: {
    backgroundColor: "#0d2936",
    borderWidth: 1,
    borderColor: "#1a4050",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 7,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: colors.accentBlue,
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: colors.textSecondary,
  },
  /* ── Section ── */
  section: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionType: {
    fontSize: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.textMuted,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.white,
  },
  /* ── Content ── */
  paragraph: {
    fontSize: 9,
    lineHeight: 1.65,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  heading2: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  heading3: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: 3,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 3,
    paddingLeft: 8,
  },
  bulletDot: {
    fontSize: 9,
    color: colors.textMuted,
    marginRight: 6,
    marginTop: 1,
  },
  bulletText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: colors.textSecondary,
    flex: 1,
  },
  numberedItem: {
    flexDirection: "row",
    marginBottom: 3,
    paddingLeft: 4,
  },
  numberedNum: {
    fontSize: 8,
    color: colors.textMuted,
    marginRight: 6,
    width: 14,
    marginTop: 1,
  },
  /* ── Footer ── */
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontSize: 7,
    color: colors.textMuted,
  },
  pageNumber: {
    fontSize: 7,
    color: colors.textMuted,
  },
});

/* ══════════════════════════════════════════════════════════════
   Markdown → PDF Renderer
   ══════════════════════════════════════════════════════════════ */

function renderContentToPDF(content: string) {
  const blocks = content.split(/\n\n+/);
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim();
    if (!block) continue;

    // Headings
    if (block.startsWith("### ")) {
      elements.push(
        <Text key={i} style={s.heading3}>
          {stripMarkdownBold(block.slice(4))}
        </Text>,
      );
      continue;
    }
    if (block.startsWith("## ")) {
      elements.push(
        <Text key={i} style={s.heading2}>
          {stripMarkdownBold(block.slice(3))}
        </Text>,
      );
      continue;
    }
    if (block.startsWith("# ")) {
      elements.push(
        <Text key={i} style={s.heading2}>
          {stripMarkdownBold(block.slice(2))}
        </Text>,
      );
      continue;
    }

    // Bullet list
    if (block.match(/^[-*] /m)) {
      const items = block.split(/\n/).filter((l) => l.trim());
      for (let j = 0; j < items.length; j++) {
        elements.push(
          <View key={`${i}-${j}`} style={s.bulletItem}>
            <Text style={s.bulletDot}>{"\u2022"}</Text>
            <Text style={s.bulletText}>
              {stripMarkdownBold(items[j].replace(/^[-*]\s*/, ""))}
            </Text>
          </View>,
        );
      }
      continue;
    }

    // Numbered list
    if (block.match(/^\d+\. /m)) {
      const items = block.split(/\n/).filter((l) => l.trim());
      for (let j = 0; j < items.length; j++) {
        elements.push(
          <View key={`${i}-${j}`} style={s.numberedItem}>
            <Text style={s.numberedNum}>{j + 1}.</Text>
            <Text style={s.bulletText}>
              {stripMarkdownBold(items[j].replace(/^\d+\.\s*/, ""))}
            </Text>
          </View>,
        );
      }
      continue;
    }

    // Regular paragraph
    elements.push(
      <Text key={i} style={s.paragraph}>
        {stripMarkdownBold(block)}
      </Text>,
    );
  }

  return elements;
}

/** Strip markdown bold/italic markers since PDF doesn't support inline styling */
function stripMarkdownBold(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");
}

/* ══════════════════════════════════════════════════════════════
   Section Type Labels
   ══════════════════════════════════════════════════════════════ */

const SECTION_TYPE_LABELS: Record<string, string> = {
  narrative: "NARRATIVE",
  data_summary: "DATA SUMMARY",
  recommendations: "RECOMMENDATIONS",
  forecast: "FORECAST",
};

/* ══════════════════════════════════════════════════════════════
   PDF Document Component
   ══════════════════════════════════════════════════════════════ */

interface ReportPDFProps {
  title: string;
  audience: string;
  summary: string;
  sections: ReportSection[];
  patientCount: number;
  clusterCount: number;
  dateRangeStart: string;
  dateRangeEnd: string;
  createdAt: string;
}

export function ReportPDFDocument({
  title,
  audience,
  summary,
  sections,
  patientCount,
  clusterCount,
  dateRangeStart,
  dateRangeEnd,
  createdAt,
}: ReportPDFProps) {
  const accentColor = AUDIENCE_COLORS[audience] ?? colors.accentBlue;
  const dateStr = new Date(createdAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.logo}>VIRO</Text>
            <Text style={s.subtitle}>Pandemic Intelligence Platform</Text>
          </View>
          <View style={s.headerRight}>
            <Text
              style={[
                s.audienceBadge,
                {
                  backgroundColor: accentColor + "20",
                  color: accentColor,
                },
              ]}
            >
              {audience}
            </Text>
            <Text style={s.headerDate}>{dateStr}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={s.title}>{title}</Text>

        {/* Meta row */}
        <View style={s.meta}>
          <Text style={s.metaItem}>
            Patients: <Text style={s.metaValue}>{patientCount}</Text>
          </Text>
          <Text style={s.metaItem}>
            Clusters: <Text style={s.metaValue}>{clusterCount}</Text>
          </Text>
          <Text style={s.metaItem}>
            Period: <Text style={s.metaValue}>{dateRangeStart?.slice(0, 10)} to {dateRangeEnd?.slice(0, 10)}</Text>
          </Text>
        </View>

        {/* Executive Summary */}
        <View style={s.summaryCard}>
          <Text style={s.summaryLabel}>Executive Summary</Text>
          <Text style={s.summaryText}>{summary}</Text>
        </View>

        {/* Sections */}
        {sections.map((section, idx) => (
          <View key={section.id || idx} style={s.section} wrap={false}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>{section.title}</Text>
              <Text style={s.sectionType}>
                {SECTION_TYPE_LABELS[section.type] ?? section.type}
              </Text>
            </View>
            {renderContentToPDF(section.content)}
          </View>
        ))}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            Generated by VIRO AI — {dateStr}
          </Text>
          <Text
            style={s.pageNumber}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
