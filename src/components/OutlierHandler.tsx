import { useMemo, useState } from "react";
import { AlertTriangle, Trash2, Crop } from "lucide-react";
import { detectOutliers, getNumericColumns, removeOutliers, winsorizeColumn } from "@/lib/insights";
import { toast } from "@/hooks/use-toast";

interface Props {
  data: Record<string, unknown>[];
  onDataUpdate: (data: Record<string, unknown>[]) => void;
}

const OutlierHandler = ({ data, onDataUpdate }: Props) => {
  const numeric = useMemo(() => getNumericColumns(data), [data]);
  const [col, setCol] = useState(numeric[0] ?? "");
  const result = useMemo(() => (col ? detectOutliers(data, col) : { indices: [], lower: 0, upper: 0 }), [col, data]);

  if (numeric.length === 0) {
    return <div className="glass-card p-5 text-sm text-muted-foreground">No numeric columns to analyse.</div>;
  }

  const remove = () => {
    const next = removeOutliers(data, col);
    onDataUpdate(next);
    toast({ title: "Removed", description: `${data.length - next.length} outlier rows dropped from ${col}.` });
  };
  const cap = () => {
    const next = winsorizeColumn(data, col);
    onDataUpdate(next);
    toast({ title: "Capped", description: `Outlier values in ${col} clipped to IQR bounds.` });
  };

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-accent" />
        <h3 className="text-lg font-display font-semibold text-foreground">Outlier Handling</h3>
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={col}
          onChange={(e) => setCol(e.target.value)}
          className="px-3 py-2 rounded-lg bg-muted/60 border border-border text-sm text-foreground"
        >
          {numeric.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="text-xs text-muted-foreground">
          {result.indices.length} outliers · bounds [{result.lower.toFixed(2)}, {result.upper.toFixed(2)}]
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={remove} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/80 text-destructive-foreground text-sm hover:bg-destructive">
          <Trash2 className="w-4 h-4" /> Remove outlier rows
        </button>
        <button onClick={cap} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/80 text-accent-foreground text-sm hover:bg-accent">
          <Crop className="w-4 h-4" /> Cap (winsorize)
        </button>
      </div>
    </div>
  );
};

export default OutlierHandler;