import { useMemo } from "react";
import { getCorrelationMatrix } from "@/lib/dataUtils";

interface Props {
  data: Record<string, unknown>[];
  columns: string[];
}

const CorrelationHeatmap = ({ data, columns }: Props) => {
  const numericCols = columns.filter((c) => data.some((r) => typeof r[c] === "number"));
  const { cols, matrix } = useMemo(() => getCorrelationMatrix(data, numericCols), [data, numericCols]);

  if (cols.length < 2) return null;

  const getColor = (v: number) => {
    if (v > 0) return `rgba(72, 191, 227, ${Math.abs(v)})`;
    if (v < 0) return `rgba(255, 0, 127, ${Math.abs(v)})`;
    return "transparent";
  };

  return (
    <div className="glass-card p-6 overflow-auto">
      <h3 className="text-lg font-display font-semibold text-foreground mb-4">🔥 Correlation Heatmap</h3>
      <div className="inline-block">
        <div className="flex">
          <div className="w-24" />
          {cols.map((c) => (
            <div key={c} className="w-16 text-xs text-muted-foreground text-center truncate px-1" title={c}>
              {c.slice(0, 8)}
            </div>
          ))}
        </div>
        {matrix.map((row, i) => (
          <div key={cols[i]} className="flex items-center">
            <div className="w-24 text-xs text-muted-foreground truncate pr-2" title={cols[i]}>
              {cols[i].slice(0, 12)}
            </div>
            {row.map((val, j) => (
              <div
                key={j}
                className="w-16 h-12 flex items-center justify-center text-xs font-medium text-foreground border border-border/30 rounded-sm"
                style={{ background: getColor(val) }}
                title={`${cols[i]} × ${cols[j]}: ${val}`}
              >
                {val.toFixed(2)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CorrelationHeatmap;
