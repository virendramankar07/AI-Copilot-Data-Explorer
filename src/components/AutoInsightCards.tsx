import { motion } from "framer-motion";
import { useMemo } from "react";
import { generateAutoInsights } from "@/lib/insights";

interface Props {
  data: Record<string, unknown>[];
  columns: string[];
}

const toneClass = {
  info: "border-accent/40",
  warn: "border-destructive/50",
  good: "border-primary/40",
};

const AutoInsightCards = ({ data, columns }: Props) => {
  const insights = useMemo(() => generateAutoInsights(data, columns), [data, columns]);
  if (insights.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-display font-semibold text-foreground mb-3">
        🧠 Smart Insights
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {insights.map((i, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            className={`glass-card p-4 border-l-4 ${toneClass[i.tone]}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{i.icon}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{i.title}</p>
                <p className="text-xs text-muted-foreground mt-1 break-words">{i.detail}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AutoInsightCards;