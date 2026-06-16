import { getColumnStats, type ColumnStats as CS } from "@/lib/dataUtils";
import { motion } from "framer-motion";

interface Props {
  data: Record<string, unknown>[];
  columns: string[];
}

const ColumnStatsPanel = ({ data, columns }: Props) => {
  const stats = columns.map((c) => getColumnStats(data, c));

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-display font-semibold text-foreground mb-4">📊 Column Statistics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-lg bg-muted/40 border border-border"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-foreground truncate">{s.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary capitalize">
                {s.type}
              </span>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between"><span>Count</span><span className="text-foreground">{s.count}</span></div>
              <div className="flex justify-between"><span>Missing</span><span className="text-foreground">{s.missing}</span></div>
              <div className="flex justify-between"><span>Unique</span><span className="text-foreground">{s.unique}</span></div>
              {s.type === "numeric" && (
                <>
                  <div className="flex justify-between"><span>Mean</span><span className="text-foreground">{s.mean?.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Median</span><span className="text-foreground">{s.median?.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Std Dev</span><span className="text-foreground">{s.std?.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Skewness</span><span className="text-foreground">{s.skewness?.toFixed(2)}</span></div>
                </>
              )}
              {s.type === "categorical" && s.topValues && (
                <div className="mt-2">
                  <span className="text-muted-foreground">Top values:</span>
                  {s.topValues.map((tv) => (
                    <div key={tv.value} className="flex justify-between">
                      <span className="truncate max-w-[120px]">{tv.value}</span>
                      <span className="text-foreground">{tv.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ColumnStatsPanel;
