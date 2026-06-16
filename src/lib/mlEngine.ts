// Tiny client-side ML engine. Linear regression for numeric targets,
// majority-class classifier with feature contribution scores for
// categorical targets. Pure JS — no native deps.

import { getNumericColumns } from "./insights";

export interface MLResult {
  task: "regression" | "classification";
  target: string;
  features: string[];
  metric: { name: string; value: number };
  importance: { feature: string; weight: number }[];
  explanation: string;
}

function isNumericColumn(data: Record<string, unknown>[], col: string): boolean {
  return data.some((r) => typeof r[col] === "number");
}

function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n === 0) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  const den = Math.sqrt(dx2 * dy2);
  return den === 0 ? 0 : num / den;
}

export function trainModel(
  data: Record<string, unknown>[],
  target: string,
): MLResult {
  const numeric = getNumericColumns(data);
  const features = numeric.filter((c) => c !== target);
  const isReg = isNumericColumn(data, target);

  if (isReg) {
    const ys = data.map((r) => Number(r[target])).filter((v) => !isNaN(v));
    const importance = features.map((f) => {
      const xs = data.map((r) => Number(r[f]));
      const valid = xs.map((x, i) => ({ x, y: ys[i] })).filter((p) => !isNaN(p.x) && !isNaN(p.y));
      const r = pearson(valid.map((p) => p.x), valid.map((p) => p.y));
      return { feature: f, weight: Math.abs(r) };
    }).sort((a, b) => b.weight - a.weight);

    // Simple R² approximation = top correlation squared
    const r2 = importance.length > 0 ? importance[0].weight ** 2 : 0;

    const top = importance[0];
    const explanation = top
      ? `${top.feature} contributes ${(top.weight * 100).toFixed(0)}% to predicting ${target}. Higher correlation = stronger predictive signal.`
      : `Not enough numeric features to model ${target}.`;

    return {
      task: "regression",
      target,
      features,
      metric: { name: "R² (approx)", value: r2 },
      importance,
      explanation,
    };
  }

  // Classification: count how well each numeric feature separates classes
  const targetVals = data.map((r) => String(r[target] ?? ""));
  const classes = Array.from(new Set(targetVals));
  const importance = features.map((f) => {
    const groups: Record<string, number[]> = {};
    for (const c of classes) groups[c] = [];
    data.forEach((r, i) => {
      const v = Number(r[f]);
      if (!isNaN(v)) groups[targetVals[i]]?.push(v);
    });
    const means = classes.map((c) => {
      const g = groups[c];
      return g.length > 0 ? g.reduce((a, b) => a + b, 0) / g.length : 0;
    });
    const overall = means.reduce((a, b) => a + b, 0) / means.length;
    const variance = means.reduce((acc, m) => acc + (m - overall) ** 2, 0) / means.length;
    return { feature: f, weight: Math.sqrt(variance) };
  });

  // Normalize weights to 0-1
  const max = Math.max(...importance.map((i) => i.weight), 1);
  importance.forEach((i) => (i.weight = i.weight / max));
  importance.sort((a, b) => b.weight - a.weight);

  // Baseline accuracy = majority class
  const counts: Record<string, number> = {};
  targetVals.forEach((v) => (counts[v] = (counts[v] || 0) + 1));
  const majority = Math.max(...Object.values(counts));
  const accuracy = majority / targetVals.length;

  const top = importance[0];
  const explanation = top
    ? `${top.feature} is the most discriminating feature for ${target} (${(top.weight * 100).toFixed(0)}% relative importance).`
    : `Not enough numeric features to classify ${target}.`;

  return {
    task: "classification",
    target,
    features,
    metric: { name: "Baseline accuracy", value: accuracy },
    importance,
    explanation,
  };
}