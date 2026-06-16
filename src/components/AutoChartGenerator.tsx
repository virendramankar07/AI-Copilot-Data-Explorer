import { useMemo } from "react";
import { Wand2 } from "lucide-react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { suggestCharts } from "@/lib/insights";

interface Props {
  data: Record<string, unknown>[];
}

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const AutoChartGenerator = ({ data }: Props) => {
  const suggestions = useMemo(() => suggestCharts(data).slice(0, 4), [data]);
  if (suggestions.length === 0) return null;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Wand2 className="w-5 h-5 text-accent" />
        <h3 className="text-lg font-display font-semibold text-foreground">Auto-Generated Charts</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suggestions.map((s, i) => (
          <div key={i} className="bg-muted/30 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-2">
              <span className="text-accent font-semibold">{s.kind.toUpperCase()}</span> · {s.reason}
            </p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                {renderChart(s, data)}
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function renderChart(s: ReturnType<typeof suggestCharts>[number], data: Record<string, unknown>[]) {
  if (s.kind === "scatter" && s.y) {
    const points = data.map((r) => ({ x: Number(r[s.x]), y: Number(r[s.y!]) })).filter((p) => !isNaN(p.x) && !isNaN(p.y));
    return (
      <ScatterChart>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis type="number" dataKey="x" name={s.x} stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <YAxis type="number" dataKey="y" name={s.y} stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
        <Scatter data={points} fill="hsl(var(--chart-1))" />
      </ScatterChart>
    );
  }
  if (s.kind === "bar" && s.y) {
    const groups: Record<string, number[]> = {};
    data.forEach((r) => {
      const k = String(r[s.x] ?? "");
      const v = Number(r[s.y!]);
      if (!isNaN(v)) (groups[k] ||= []).push(v);
    });
    const rows = Object.entries(groups).slice(0, 12).map(([name, vs]) => ({ name, value: vs.reduce((a, b) => a + b, 0) / vs.length }));
    return (
      <BarChart data={rows}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
        <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} />
      </BarChart>
    );
  }
  if (s.kind === "pie") {
    const freq: Record<string, number> = {};
    data.forEach((r) => {
      const k = String(r[s.x] ?? "");
      freq[k] = (freq[k] || 0) + 1;
    });
    const rows = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }));
    return (
      <PieChart>
        <Pie data={rows} dataKey="value" nameKey="name" outerRadius={80} label>
          {rows.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
      </PieChart>
    );
  }
  if (s.kind === "line" && s.y) {
    const rows = data
      .map((r) => ({ x: String(r[s.x]), y: Number(r[s.y!]) }))
      .filter((p) => !isNaN(p.y))
      .slice(0, 50);
    return (
      <LineChart data={rows}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="x" stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
        <Line type="monotone" dataKey="y" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
      </LineChart>
    );
  }
  // histogram fallback
  const nums = data.map((r) => Number(r[s.x])).filter((v) => !isNaN(v));
  const bins = 10;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const w = (max - min) / bins || 1;
  const buckets = Array.from({ length: bins }, (_, i) => ({ name: (min + i * w).toFixed(1), value: 0 }));
  nums.forEach((v) => { const idx = Math.min(bins - 1, Math.floor((v - min) / w)); buckets[idx].value++; });
  return (
    <BarChart data={buckets}>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
      <Bar dataKey="value" fill="hsl(var(--chart-4))" radius={[6, 6, 0, 0]} />
    </BarChart>
  );
}

export default AutoChartGenerator;