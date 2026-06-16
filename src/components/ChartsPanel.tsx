import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, PieChart, Pie, Cell, Legend,
} from "recharts";

interface Props {
  data: Record<string, unknown>[];
  columns: string[];
}

const COLORS = [
  "hsl(330, 100%, 50%)", "hsl(195, 74%, 59%)", "hsl(33, 100%, 50%)",
  "hsl(270, 100%, 60%)", "hsl(150, 80%, 50%)", "hsl(0, 80%, 55%)",
];

const ChartsPanel = ({ data, columns }: Props) => {
  const numericCols = columns.filter((c) => data.some((r) => typeof r[c] === "number"));
  const categoricalCols = columns.filter((c) => !numericCols.includes(c));
  const [chartType, setChartType] = useState<"histogram" | "scatter" | "pie">("histogram");
  const [colX, setColX] = useState(numericCols[0] || columns[0]);
  const [colY, setColY] = useState(numericCols[1] || numericCols[0] || columns[0]);

  const histogramData = useMemo(() => {
    if (!colX) return [];
    const isNum = data.some((r) => typeof r[colX] === "number");
    if (isNum) {
      const vals = data.map((r) => Number(r[colX])).filter((v) => !isNaN(v));
      const min = Math.min(...vals), max = Math.max(...vals);
      const binCount = Math.min(20, Math.ceil(Math.sqrt(vals.length)));
      const binSize = (max - min) / binCount || 1;
      const bins = Array.from({ length: binCount }, (_, i) => ({
        range: `${(min + i * binSize).toFixed(1)}`,
        count: 0,
      }));
      vals.forEach((v) => {
        const idx = Math.min(Math.floor((v - min) / binSize), binCount - 1);
        bins[idx].count++;
      });
      return bins;
    }
    const freq: Record<string, number> = {};
    data.forEach((r) => { const v = String(r[colX] ?? ""); freq[v] = (freq[v] || 0) + 1; });
    return Object.entries(freq).slice(0, 20).map(([range, count]) => ({ range, count }));
  }, [data, colX]);

  const scatterData = useMemo(() => {
    return data.slice(0, 500).map((r) => ({ x: Number(r[colX]), y: Number(r[colY]) })).filter((d) => !isNaN(d.x) && !isNaN(d.y));
  }, [data, colX, colY]);

  const pieData = useMemo(() => {
    const col = categoricalCols[0] || colX;
    const freq: Record<string, number> = {};
    data.forEach((r) => { const v = String(r[col] ?? ""); freq[v] = (freq[v] || 0) + 1; });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }));
  }, [data, categoricalCols, colX]);

  const selectClass = "bg-muted text-foreground border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-display font-semibold text-foreground mb-4">📈 Visualizations</h3>
      <div className="flex flex-wrap gap-3 mb-6">
        {(["histogram", "scatter", "pie"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setChartType(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              chartType === t
                ? "bg-gradient-to-r from-primary to-accent text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "histogram" ? "📊 Histogram" : t === "scatter" ? "🔵 Scatter" : "🍩 Pie Chart"}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <select className={selectClass} value={colX} onChange={(e) => setColX(e.target.value)}>
          {columns.map((c) => <option key={c}>{c}</option>)}
        </select>
        {chartType === "scatter" && (
          <select className={selectClass} value={colY} onChange={(e) => setColY(e.target.value)}>
            {columns.map((c) => <option key={c}>{c}</option>)}
          </select>
        )}
      </div>

      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "histogram" ? (
            <BarChart data={histogramData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(260, 20%, 25%)" />
              <XAxis dataKey="range" tick={{ fill: "hsl(260, 10%, 65%)", fontSize: 11 }} />
              <YAxis tick={{ fill: "hsl(260, 10%, 65%)", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "hsl(260, 40%, 14%)", border: "1px solid hsl(260, 20%, 25%)", borderRadius: "12px", color: "#fff" }} />
              <Bar dataKey="count" fill="hsl(195, 74%, 59%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : chartType === "scatter" ? (
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(260, 20%, 25%)" />
              <XAxis dataKey="x" name={colX} tick={{ fill: "hsl(260, 10%, 65%)", fontSize: 11 }} />
              <YAxis dataKey="y" name={colY} tick={{ fill: "hsl(260, 10%, 65%)", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "hsl(260, 40%, 14%)", border: "1px solid hsl(260, 20%, 25%)", borderRadius: "12px", color: "#fff" }} />
              <Scatter data={scatterData} fill="hsl(330, 100%, 50%)" />
            </ScatterChart>
          ) : (
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={120} dataKey="value" nameKey="name" label>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(260, 40%, 14%)", border: "1px solid hsl(260, 20%, 25%)", borderRadius: "12px", color: "#fff" }} />
              <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartsPanel;
