// Deterministic, no-AI-required insight engine. Powers Auto Insight Cards,
// KPI insights, Data Quality scoring detail, and outlier handling.

import { getColumnStats, getCorrelationMatrix } from "./dataUtils";

export interface AutoInsight {
  icon: string;
  title: string;
  detail: string;
  tone: "info" | "warn" | "good";
}

export function getNumericColumns(data: Record<string, unknown>[]): string[] {
  if (data.length === 0) return [];
  return Object.keys(data[0]).filter((c) =>
    data.some((r) => typeof r[c] === "number"),
  );
}

export function getCategoricalColumns(data: Record<string, unknown>[]): string[] {
  if (data.length === 0) return [];
  const numeric = new Set(getNumericColumns(data));
  return Object.keys(data[0]).filter((c) => !numeric.has(c));
}

export function generateAutoInsights(
  data: Record<string, unknown>[],
  columns: string[],
): AutoInsight[] {
  const insights: AutoInsight[] = [];
  if (data.length === 0) return insights;

  const numericCols = getNumericColumns(data);

  // Top correlation
  if (numericCols.length >= 2) {
    const { cols, matrix } = getCorrelationMatrix(data, numericCols);
    let best = { i: 0, j: 0, val: 0 };
    for (let i = 0; i < cols.length; i++) {
      for (let j = i + 1; j < cols.length; j++) {
        if (Math.abs(matrix[i][j]) > Math.abs(best.val)) {
          best = { i, j, val: matrix[i][j] };
        }
      }
    }
    if (best.val !== 0) {
      insights.push({
        icon: "🔗",
        title: "Strongest Correlation",
        detail: `${cols[best.i]} ↔ ${cols[best.j]} (r = ${best.val.toFixed(2)})`,
        tone: Math.abs(best.val) > 0.7 ? "good" : "info",
      });
    }
  }

  // Highest variance
  if (numericCols.length > 0) {
    let topCol = numericCols[0];
    let topStd = 0;
    for (const col of numericCols) {
      const s = getColumnStats(data, col);
      if ((s.std ?? 0) > topStd) {
        topStd = s.std ?? 0;
        topCol = col;
      }
    }
    insights.push({
      icon: "📊",
      title: "Highest Variation",
      detail: `${topCol} has the largest spread (σ = ${topStd.toFixed(2)})`,
      tone: "info",
    });
  }

  // Missing %
  let missing = 0;
  let total = 0;
  for (const row of data) {
    for (const col of columns) {
      total++;
      const v = row[col];
      if (v === null || v === undefined || v === "") missing++;
    }
  }
  const missingPct = total > 0 ? (missing / total) * 100 : 0;
  insights.push({
    icon: "🧩",
    title: "Missing Data",
    detail: `${missingPct.toFixed(1)}% of cells are empty`,
    tone: missingPct > 10 ? "warn" : "good",
  });

  // Outliers
  let totalOutliers = 0;
  for (const col of numericCols) {
    totalOutliers += detectOutliers(data, col).indices.length;
  }
  insights.push({
    icon: "🚨",
    title: "Outliers Detected",
    detail: `${totalOutliers} suspicious values across numeric columns`,
    tone: totalOutliers > data.length * 0.05 ? "warn" : "good",
  });

  // Top categorical concentration
  const catCols = getCategoricalColumns(data);
  if (catCols.length > 0) {
    const col = catCols[0];
    const s = getColumnStats(data, col);
    const top = s.topValues?.[0];
    if (top) {
      const pct = (top.count / data.length) * 100;
      insights.push({
        icon: "🏷️",
        title: "Dominant Category",
        detail: `${col}: "${top.value}" appears in ${pct.toFixed(0)}% of rows`,
        tone: "info",
      });
    }
  }

  return insights;
}

// IQR outlier detection
export function detectOutliers(
  data: Record<string, unknown>[],
  col: string,
): { indices: number[]; lower: number; upper: number } {
  const values = data
    .map((r, i) => ({ v: r[col], i }))
    .filter((x) => typeof x.v === "number") as { v: number; i: number }[];
  if (values.length < 4) return { indices: [], lower: 0, upper: 0 };
  const sorted = [...values].sort((a, b) => a.v - b.v).map((x) => x.v);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  return {
    indices: values.filter((x) => x.v < lower || x.v > upper).map((x) => x.i),
    lower,
    upper,
  };
}

export function removeOutliers(
  data: Record<string, unknown>[],
  col: string,
): Record<string, unknown>[] {
  const { indices } = detectOutliers(data, col);
  const set = new Set(indices);
  return data.filter((_, i) => !set.has(i));
}

export function winsorizeColumn(
  data: Record<string, unknown>[],
  col: string,
): Record<string, unknown>[] {
  const { lower, upper } = detectOutliers(data, col);
  return data.map((r) => {
    const v = r[col];
    if (typeof v !== "number") return r;
    if (v < lower) return { ...r, [col]: lower };
    if (v > upper) return { ...r, [col]: upper };
    return r;
  });
}

// Detailed quality scoring
export interface QualityBreakdown {
  total: number;
  missingPct: number;
  duplicatePct: number;
  outlierPct: number;
  components: { label: string; score: number; weight: number }[];
}

export function getQualityBreakdown(
  data: Record<string, unknown>[],
): QualityBreakdown {
  if (data.length === 0)
    return { total: 0, missingPct: 0, duplicatePct: 0, outlierPct: 0, components: [] };
  const columns = Object.keys(data[0]);
  let missing = 0;
  let totalCells = 0;
  for (const row of data) {
    for (const col of columns) {
      totalCells++;
      const v = row[col];
      if (v === null || v === undefined || v === "") missing++;
    }
  }
  const seen = new Set<string>();
  let dups = 0;
  for (const row of data) {
    const k = JSON.stringify(row);
    if (seen.has(k)) dups++;
    else seen.add(k);
  }
  const numericCols = getNumericColumns(data);
  let outliers = 0;
  for (const c of numericCols) outliers += detectOutliers(data, c).indices.length;

  const missingPct = totalCells > 0 ? (missing / totalCells) * 100 : 0;
  const duplicatePct = data.length > 0 ? (dups / data.length) * 100 : 0;
  const outlierPct =
    data.length > 0 && numericCols.length > 0
      ? (outliers / (data.length * numericCols.length)) * 100
      : 0;

  const completeness = Math.max(0, 100 - missingPct);
  const uniqueness = Math.max(0, 100 - duplicatePct);
  const consistency = Math.max(0, 100 - outlierPct * 2);

  const components = [
    { label: "Completeness", score: Math.round(completeness), weight: 0.5 },
    { label: "Uniqueness", score: Math.round(uniqueness), weight: 0.3 },
    { label: "Consistency", score: Math.round(consistency), weight: 0.2 },
  ];
  const total = Math.round(
    components.reduce((acc, c) => acc + c.score * c.weight, 0),
  );
  return { total, missingPct, duplicatePct, outlierPct, components };
}

// Suggest charts heuristically — used by the auto-chart generator.
export interface ChartSuggestion {
  kind: "scatter" | "bar" | "line" | "pie" | "histogram";
  x: string;
  y?: string;
  reason: string;
}

export function suggestCharts(
  data: Record<string, unknown>[],
): ChartSuggestion[] {
  const suggestions: ChartSuggestion[] = [];
  if (data.length === 0) return suggestions;
  const num = getNumericColumns(data);
  const cat = getCategoricalColumns(data);

  if (num.length >= 2) {
    const { cols, matrix } = getCorrelationMatrix(data, num);
    let best = { i: 0, j: 1, val: 0 };
    for (let i = 0; i < cols.length; i++) {
      for (let j = i + 1; j < cols.length; j++) {
        if (Math.abs(matrix[i][j]) > Math.abs(best.val)) best = { i, j, val: matrix[i][j] };
      }
    }
    suggestions.push({
      kind: "scatter",
      x: cols[best.i],
      y: cols[best.j],
      reason: `Strong relationship (r = ${best.val.toFixed(2)})`,
    });
  }
  if (cat.length > 0 && num.length > 0) {
    suggestions.push({
      kind: "bar",
      x: cat[0],
      y: num[0],
      reason: `Compare ${num[0]} across ${cat[0]} groups`,
    });
  }
  if (cat.length > 0) {
    suggestions.push({
      kind: "pie",
      x: cat[0],
      reason: `Distribution of ${cat[0]}`,
    });
  }
  if (num.length > 0) {
    suggestions.push({
      kind: "histogram",
      x: num[0],
      reason: `Spread of ${num[0]}`,
    });
  }
  const dateCol = Object.keys(data[0]).find((c) => {
    const v = data[0][c];
    return typeof v === "string" && !isNaN(Date.parse(v));
  });
  if (dateCol && num.length > 0) {
    suggestions.push({
      kind: "line",
      x: dateCol,
      y: num[0],
      reason: `Trend of ${num[0]} over time`,
    });
  }
  return suggestions;
}