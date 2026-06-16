import * as Papa from "papaparse";

export interface DatasetStats {
  rows: number;
  columns: number;
  missingValues: number;
  duplicates: number;
  qualityScore: number;
}

export interface ColumnStats {
  name: string;
  type: "numeric" | "categorical";
  count: number;
  missing: number;
  unique: number;
  mean?: number;
  median?: number;
  std?: number;
  min?: number;
  max?: number;
  skewness?: number;
  topValues?: { value: string; count: number }[];
}

export function parseCSV(file: File): Promise<{ data: Record<string, unknown>[]; columns: string[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<Record<string, unknown>>) => {
        const columns = results.meta.fields || [];
        resolve({ data: results.data as Record<string, unknown>[], columns });
      },
      error: reject,
    });
  });
}

export function getDatasetStats(data: Record<string, unknown>[], rawData: Record<string, unknown>[]): DatasetStats {
  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  let missingValues = 0;
  for (const row of rawData) {
    for (const col of Object.keys(row)) {
      if (row[col] === null || row[col] === undefined || row[col] === "") missingValues++;
    }
  }

  const seen = new Set<string>();
  let duplicates = 0;
  for (const row of rawData) {
    const key = JSON.stringify(row);
    if (seen.has(key)) duplicates++;
    else seen.add(key);
  }

  const totalCells = rawData.length * columns.length;
  const qualityScore = totalCells > 0 ? Math.round(((totalCells - missingValues) / totalCells) * 100) : 100;

  return { rows: data.length, columns: columns.length, missingValues, duplicates, qualityScore };
}

export function autoCleanData(data: Record<string, unknown>[]): Record<string, unknown>[] {
  if (data.length === 0) return data;
  const columns = Object.keys(data[0]);
  const cleaned = data.map((row) => ({ ...row }));

  const dropCols = ["Name", "Ticket", "Cabin", "PassengerId"];
  const activeCols = columns.filter((c) => !dropCols.includes(c));

  for (const col of activeCols) {
    const isNumeric = cleaned.some((r) => typeof r[col] === "number");
    if (isNumeric) {
      const vals = cleaned.map((r) => r[col]).filter((v) => typeof v === "number") as number[];
      const median = vals.length > 0 ? vals.sort((a, b) => a - b)[Math.floor(vals.length / 2)] : 0;
      cleaned.forEach((r) => { if (r[col] === null || r[col] === undefined || r[col] === "") r[col] = median; });
    } else {
      const freq: Record<string, number> = {};
      cleaned.forEach((r) => { const v = String(r[col] ?? ""); if (v) freq[v] = (freq[v] || 0) + 1; });
      const mode = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || "Unknown";
      cleaned.forEach((r) => { if (r[col] === null || r[col] === undefined || r[col] === "") r[col] = mode; });
    }
  }

  return cleaned.map((row) => {
    const newRow: Record<string, unknown> = {};
    for (const col of activeCols) newRow[col] = row[col];
    return newRow;
  });
}

export function getColumnStats(data: Record<string, unknown>[], colName: string): ColumnStats {
  const values = data.map((r) => r[colName]);
  const missing = values.filter((v) => v === null || v === undefined || v === "").length;
  const unique = new Set(values.map(String)).size;
  const isNumeric = values.some((v) => typeof v === "number");

  if (isNumeric) {
    const nums = values.filter((v) => typeof v === "number") as number[];
    const sorted = [...nums].sort((a, b) => a - b);
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const variance = nums.reduce((acc, v) => acc + (v - mean) ** 2, 0) / nums.length;
    const std = Math.sqrt(variance);
    const n = nums.length;
    const skewness = n > 2 ? (n / ((n - 1) * (n - 2))) * nums.reduce((acc, v) => acc + ((v - mean) / std) ** 3, 0) : 0;

    return { name: colName, type: "numeric", count: nums.length, missing, unique, mean, median, std, min: sorted[0], max: sorted[sorted.length - 1], skewness: isFinite(skewness) ? skewness : 0 };
  }

  const freq: Record<string, number> = {};
  values.forEach((v) => { const s = String(v ?? ""); freq[s] = (freq[s] || 0) + 1; });
  const topValues = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([value, count]) => ({ value, count }));

  return { name: colName, type: "categorical", count: values.length, missing, unique, topValues };
}

export function getCorrelationMatrix(data: Record<string, unknown>[], numericCols: string[]): { cols: string[]; matrix: number[][] } {
  const cols = numericCols;
  const matrix: number[][] = [];

  for (let i = 0; i < cols.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < cols.length; j++) {
      const xVals = data.map((r) => Number(r[cols[i]])).filter((v) => !isNaN(v));
      const yVals = data.map((r) => Number(r[cols[j]])).filter((v) => !isNaN(v));
      const n = Math.min(xVals.length, yVals.length);
      if (n === 0) { matrix[i][j] = 0; continue; }

      const xMean = xVals.slice(0, n).reduce((a, b) => a + b, 0) / n;
      const yMean = yVals.slice(0, n).reduce((a, b) => a + b, 0) / n;
      let num = 0, denX = 0, denY = 0;
      for (let k = 0; k < n; k++) {
        const dx = xVals[k] - xMean;
        const dy = yVals[k] - yMean;
        num += dx * dy;
        denX += dx * dx;
        denY += dy * dy;
      }
      const den = Math.sqrt(denX * denY);
      matrix[i][j] = den === 0 ? 0 : Math.round((num / den) * 100) / 100;
    }
  }

  return { cols, matrix };
}

export function exportCSV(data: Record<string, unknown>[], filename: string) {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
