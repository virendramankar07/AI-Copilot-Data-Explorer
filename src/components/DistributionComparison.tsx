import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface Props {
  data: Record<string, unknown>[];
  columns: string[];
}

const DistributionComparison = ({ data, columns }: Props) => {
  const numericCols = columns.filter((c) => data.some((r) => typeof r[c] === "number"));
  const [colA, setColA] = useState(numericCols[0] || "");
  const [colB, setColB] = useState(numericCols[1] || numericCols[0] || "");

  const chartData = useMemo(() => {
    if (!colA || !colB) return [];
    const valsA = data.map((r) => Number(r[colA])).filter((v) => !isNaN(v));
    const valsB = data.map((r) => Number(r[colB])).filter((v) => !isNaN(v));
    const allVals = [...valsA, ...valsB];
    const min = Math.min(...allVals);
    const max = Math.max(...allVals);
    const binCount = 25;
    const binSize = (max - min) / binCount || 1;

    const bins = Array.from({ length: binCount }, (_, i) => ({
      range: (min + i * binSize).toFixed(1),
      [colA]: 0,
      [colB]: 0,
    }));

    valsA.forEach((v) => {
      const idx = Math.min(Math.floor((v - min) / binSize), binCount - 1);
      (bins[idx] as Record<string, number>)[colA]++;
    });
    valsB.forEach((v) => {
      const idx = Math.min(Math.floor((v - min) / binSize), binCount - 1);
      (bins[idx] as Record<string, number>)[colB]++;
    });

    return bins;
  }, [data, colA, colB]);

  if (numericCols.length < 2) {
    return (
      <div className="glass-card p-6 text-center text-muted-foreground">
        Need at least 2 numeric columns for distribution comparison.
      </div>
    );
  }

  const selectClass = "bg-muted text-foreground border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-display font-semibold text-foreground mb-4">📊 Distribution Comparison</h3>
      <div className="flex flex-wrap gap-3 mb-6">
        <select className={selectClass} value={colA} onChange={(e) => setColA(e.target.value)}>
          {numericCols.map((c) => <option key={c}>{c}</option>)}
        </select>
        <span className="text-muted-foreground self-center">vs</span>
        <select className={selectClass} value={colB} onChange={(e) => setColB(e.target.value)}>
          {numericCols.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(260, 20%, 25%)" />
            <XAxis dataKey="range" tick={{ fill: "hsl(260, 10%, 65%)", fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fill: "hsl(260, 10%, 65%)", fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "hsl(260, 40%, 14%)", border: "1px solid hsl(260, 20%, 25%)", borderRadius: "12px", color: "#fff" }} />
            <Legend />
            <Area type="monotone" dataKey={colA} stroke="hsl(330, 100%, 50%)" fill="hsl(330, 100%, 50%)" fillOpacity={0.3} />
            <Area type="monotone" dataKey={colB} stroke="hsl(195, 74%, 59%)" fill="hsl(195, 74%, 59%)" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DistributionComparison;
