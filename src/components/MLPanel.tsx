import { useMemo, useState } from "react";
import { Brain, Play } from "lucide-react";
import { trainModel, type MLResult } from "@/lib/mlEngine";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface Props {
  data: Record<string, unknown>[];
  columns: string[];
}

const MLPanel = ({ data, columns }: Props) => {
  const [target, setTarget] = useState(columns[columns.length - 1] ?? "");
  const [result, setResult] = useState<MLResult | null>(null);

  const run = () => {
    if (!target) return;
    setResult(trainModel(data, target));
  };

  const importanceData = useMemo(
    () => result?.importance.slice(0, 10).map((i) => ({ name: i.feature, value: Math.round(i.weight * 100) })) ?? [],
    [result],
  );

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-accent" />
        <h3 className="text-lg font-display font-semibold text-foreground">Auto ML</h3>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-muted-foreground">Target column</label>
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="px-3 py-2 rounded-lg bg-muted/60 border border-border text-sm text-foreground"
        >
          {columns.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={run} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm">
          <Play className="w-4 h-4" /> Train
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-muted/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground">Task</p>
              <p className="text-base font-semibold text-foreground capitalize">{result.task}</p>
            </div>
            <div className="bg-muted/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground">{result.metric.name}</p>
              <p className="text-base font-semibold text-foreground">{(result.metric.value * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-muted/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground">Features used</p>
              <p className="text-base font-semibold text-foreground">{result.features.length}</p>
            </div>
          </div>

          <div className="bg-accent/10 border border-accent/30 rounded-xl p-3 text-sm text-foreground">
            💡 {result.explanation}
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Feature Importance</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={importanceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={100} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MLPanel;