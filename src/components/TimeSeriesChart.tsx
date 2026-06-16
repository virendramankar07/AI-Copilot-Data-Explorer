import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface Props {
  data: Record<string, unknown>[];
  columns: string[];
}

const COLORS = [
  "hsl(330, 100%, 50%)", "hsl(195, 74%, 59%)", "hsl(33, 100%, 50%)",
  "hsl(270, 100%, 60%)", "hsl(150, 80%, 50%)",
];

function isDateLike(val: unknown): boolean {
  if (typeof val === "string") {
    const d = Date.parse(val);
    return !isNaN(d) && val.length > 4;
  }
  return false;
}

const TimeSeriesChart = ({ data, columns }: Props) => {
  const dateCols = columns.filter((c) => data.slice(0, 10).some((r) => isDateLike(r[c])));
  const numericCols = columns.filter((c) => data.some((r) => typeof r[c] === "number"));

  const [dateCol, setDateCol] = useState(dateCols[0] || columns[0]);
  const [valueCols, setValueCols] = useState<string[]>(numericCols.slice(0, 2));

  const chartData = useMemo(() => {
    return data
      .map((r) => {
        const entry: Record<string, unknown> = { date: String(r[dateCol] ?? "") };
        valueCols.forEach((c) => { entry[c] = Number(r[c]) || 0; });
        return entry;
      })
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .slice(0, 500);
  }, [data, dateCol, valueCols]);

  const toggleCol = (col: string) => {
    setValueCols((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col].slice(0, 5)
    );
  };

  const selectClass = "bg-muted text-foreground border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

  if (dateCols.length === 0 && numericCols.length < 2) {
    return (
      <div className="glass-card p-6 text-center text-muted-foreground">
        No date columns detected for time series analysis.
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-display font-semibold text-foreground mb-4">📅 Time Series</h3>
      <div className="flex flex-wrap gap-3 mb-4">
        <select className={selectClass} value={dateCol} onChange={(e) => setDateCol(e.target.value)}>
          {columns.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {numericCols.map((c) => (
          <button
            key={c}
            onClick={() => toggleCol(c)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              valueCols.includes(c)
                ? "bg-primary/20 text-primary border border-primary/40"
                : "bg-muted text-muted-foreground border border-border"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(260, 20%, 25%)" />
            <XAxis dataKey="date" tick={{ fill: "hsl(260, 10%, 65%)", fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fill: "hsl(260, 10%, 65%)", fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "hsl(260, 40%, 14%)", border: "1px solid hsl(260, 20%, 25%)", borderRadius: "12px", color: "#fff" }} />
            <Legend />
            {valueCols.map((c, i) => (
              <Line key={c} type="monotone" dataKey={c} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TimeSeriesChart;
