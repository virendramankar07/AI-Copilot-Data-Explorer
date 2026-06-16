import { useMemo } from "react";
import { ShieldCheck } from "lucide-react";
import { getQualityBreakdown } from "@/lib/insights";

interface Props {
  data: Record<string, unknown>[];
}

const DataQualityScore = ({ data }: Props) => {
  const q = useMemo(() => getQualityBreakdown(data), [data]);

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-5 h-5 text-accent" />
        <h3 className="text-lg font-display font-semibold text-foreground">Data Quality Score</h3>
      </div>
      <div className="flex items-center gap-6 flex-wrap">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" stroke="hsl(var(--muted))" strokeWidth="10" fill="none" />
            <circle
              cx="50"
              cy="50"
              r="42"
              stroke="url(#qg)"
              strokeWidth="10"
              fill="none"
              strokeDasharray={2 * Math.PI * 42}
              strokeDashoffset={2 * Math.PI * 42 * (1 - q.total / 100)}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="qg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--accent))" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute text-2xl font-display font-bold text-foreground">{q.total}</span>
        </div>
        <div className="flex-1 min-w-[200px] space-y-2">
          {q.components.map((c) => (
            <div key={c.label}>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{c.label}</span>
                <span>{c.score}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent"
                  style={{ width: `${c.score}%` }}
                />
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground pt-2">
            Missing {q.missingPct.toFixed(1)}% · Duplicates {q.duplicatePct.toFixed(1)}% · Outliers {q.outlierPct.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default DataQualityScore;