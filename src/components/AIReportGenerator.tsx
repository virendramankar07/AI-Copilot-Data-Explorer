import { useState } from "react";
import { FileText, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { generateAutoInsights } from "@/lib/insights";
import { getQualityBreakdown } from "@/lib/insights";
import type { DatasetStats } from "@/lib/dataUtils";
import { chatCompletion, buildDatasetContext, hasAIKey } from "@/lib/aiClient";
import { toast } from "@/hooks/use-toast";

interface Props {
  data: Record<string, unknown>[];
  columns: string[];
  stats: DatasetStats;
  fileName: string;
}

const AIReportGenerator = ({ data, columns, stats, fileName }: Props) => {
  const [busy, setBusy] = useState(false);

  const build = async () => {
    setBusy(true);
    try {
      const insights = generateAutoInsights(data, columns);
      const quality = getQualityBreakdown(data);

      let aiSummary = "";
      let aiConclusion = "";
      if (hasAIKey()) {
        try {
          const ctx = buildDatasetContext(data, columns);
          aiSummary = await chatCompletion([
            { role: "system", content: "You write concise data analytics report sections in plain text (no markdown)." },
            { role: "user", content: `Write a 4-6 sentence executive summary for this dataset.\n\n${ctx}` },
          ]);
          aiConclusion = await chatCompletion([
            { role: "system", content: "You write concise data analytics conclusions in plain text (no markdown)." },
            { role: "user", content: `Write a 3-5 sentence conclusion with recommended next steps.\n\n${ctx}` },
          ]);
        } catch {
          aiSummary = "AI summary unavailable (check AI Settings).";
        }
      } else {
        aiSummary = `This report covers ${stats.rows} rows across ${stats.columns} columns. Overall data quality is ${stats.qualityScore}% with ${stats.missingValues} missing cells and ${stats.duplicates} duplicate rows.`;
        aiConclusion = `The dataset is ${stats.qualityScore >= 85 ? "in good shape" : "in need of cleaning"}. Address missing values and outliers before model training. Add an AI key in Settings for a richer narrative.`;
      }

      const doc = new jsPDF();
      const pageW = doc.internal.pageSize.getWidth();
      let y = 15;

      doc.setFontSize(20);
      doc.text("AI Copilot Data Report", pageW / 2, y, { align: "center" });
      y += 8;
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text(`File: ${fileName} · ${new Date().toLocaleString()}`, pageW / 2, y, { align: "center" });
      doc.setTextColor(0);
      y += 10;

      doc.setFontSize(14);
      doc.text("1. Executive Summary", 14, y);
      y += 6;
      doc.setFontSize(10);
      const sumLines = doc.splitTextToSize(aiSummary || "—", pageW - 28);
      doc.text(sumLines, 14, y);
      y += sumLines.length * 5 + 4;

      doc.setFontSize(14);
      doc.text("2. Dataset Overview", 14, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [["Metric", "Value"]],
        body: [
          ["Rows", String(stats.rows)],
          ["Columns", String(stats.columns)],
          ["Missing values", String(stats.missingValues)],
          ["Duplicate rows", String(stats.duplicates)],
          ["Quality score", `${quality.total}%`],
          ...quality.components.map((c) => [c.label, `${c.score}%`]),
        ],
        theme: "striped",
        headStyles: { fillColor: [200, 50, 120] },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

      if (y > 240) { doc.addPage(); y = 15; }
      doc.setFontSize(14);
      doc.text("3. Key Insights", 14, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [["#", "Insight", "Detail"]],
        body: insights.map((i, idx) => [String(idx + 1), i.title, i.detail]),
        theme: "grid",
        headStyles: { fillColor: [50, 150, 200] },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

      if (y > 240) { doc.addPage(); y = 15; }
      doc.setFontSize(14);
      doc.text("4. Conclusion", 14, y);
      y += 6;
      doc.setFontSize(10);
      const conLines = doc.splitTextToSize(aiConclusion || "—", pageW - 28);
      doc.text(conLines, 14, y);

      doc.save(`report_${fileName.replace(/\.csv$/i, "")}.pdf`);
      toast({ title: "Report ready", description: "Your PDF has been downloaded." });
    } catch (e) {
      toast({ title: "Report failed", description: e instanceof Error ? e.message : "Unknown", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-5 h-5 text-accent" />
        <h3 className="text-lg font-display font-semibold text-foreground">AI Report Generator</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Generate a polished PDF: summary, dataset overview, top insights, and conclusion. Add an AI key for an AI-written narrative; otherwise a deterministic fallback is used.
      </p>
      <button
        onClick={build}
        disabled={busy}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-sm disabled:opacity-50"
      >
        <Download className="w-4 h-4" /> {busy ? "Building…" : "Generate PDF"}
      </button>
    </div>
  );
};

export default AIReportGenerator;