import { motion } from "framer-motion";
import { Database, Columns, AlertTriangle, Copy, ShieldCheck } from "lucide-react";
import type { DatasetStats } from "@/lib/dataUtils";

interface KPIMetricsProps {
  stats: DatasetStats;
}

const metrics = [
  { key: "rows" as const, label: "Rows", icon: Database },
  { key: "columns" as const, label: "Columns", icon: Columns },
  { key: "missingValues" as const, label: "Missing Values", icon: AlertTriangle },
  { key: "duplicates" as const, label: "Duplicates", icon: Copy },
];

const insightFor = (key: string, stats: DatasetStats): string => {
  switch (key) {
    case "rows":
      return stats.rows > 1000 ? "Large dataset — sampling recommended" : "Compact dataset";
    case "columns":
      return stats.columns > 20 ? "Wide dataset — consider feature selection" : "Narrow & focused";
    case "missingValues":
      return stats.missingValues === 0 ? "Complete — no gaps" : `${((stats.missingValues / (stats.rows * stats.columns)) * 100).toFixed(1)}% empty cells`;
    case "duplicates":
      return stats.duplicates === 0 ? "All rows unique" : "Consider deduping";
    default:
      return "";
  }
};

const KPIMetrics = ({ stats }: KPIMetricsProps) => (
  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
    {metrics.map(({ key, label, icon: Icon }, i) => (
      <motion.div
        key={key}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.1 }}
        className="glass-card p-5"
      >
        <div className="flex items-center gap-3 mb-2">
          <Icon className="w-5 h-5 text-accent" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
        </div>
        <p className="text-2xl font-display font-bold text-foreground">
          {stats[key].toLocaleString()}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{insightFor(key, stats)}</p>
      </motion.div>
    ))}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card p-5"
    >
      <div className="flex items-center gap-3 mb-2">
        <ShieldCheck className="w-5 h-5 text-accent" />
        <span className="text-xs text-muted-foreground uppercase tracking-wider">Quality</span>
      </div>
      <p className="text-2xl font-display font-bold text-foreground">
        {stats.qualityScore}%
      </p>
      <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
          style={{ width: `${stats.qualityScore}%` }}
        />
      </div>
    </motion.div>
  </div>
);

export default KPIMetrics;
