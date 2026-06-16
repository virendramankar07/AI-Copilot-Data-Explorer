import { useState } from "react";
import { LayoutDashboard, GripVertical, X, Plus } from "lucide-react";
import KPIMetrics from "./KPIMetrics";
import AutoInsightCards from "./AutoInsightCards";
import AutoChartGenerator from "./AutoChartGenerator";
import CorrelationHeatmap from "./CorrelationHeatmap";
import TimeSeriesChart from "./TimeSeriesChart";
import DistributionComparison from "./DistributionComparison";
import DataQualityScore from "./DataQualityScore";
import type { DatasetStats } from "@/lib/dataUtils";

interface Props {
  data: Record<string, unknown>[];
  columns: string[];
  stats: DatasetStats;
}

type WidgetId = "kpi" | "insights" | "charts" | "corr" | "time" | "dist" | "quality";

const ALL: { id: WidgetId; label: string }[] = [
  { id: "kpi", label: "KPI Metrics" },
  { id: "quality", label: "Quality Score" },
  { id: "insights", label: "Smart Insights" },
  { id: "charts", label: "Auto Charts" },
  { id: "corr", label: "Correlation Heatmap" },
  { id: "time", label: "Time Series" },
  { id: "dist", label: "Distribution Comparison" },
];

const DragDropDashboard = ({ data, columns, stats }: Props) => {
  const [layout, setLayout] = useState<WidgetId[]>(["kpi", "quality", "insights", "charts"]);
  const [dragId, setDragId] = useState<WidgetId | null>(null);

  const onDragStart = (id: WidgetId) => setDragId(id);
  const onDrop = (target: WidgetId) => {
    if (!dragId || dragId === target) return;
    const next = [...layout];
    const from = next.indexOf(dragId);
    const to = next.indexOf(target);
    next.splice(from, 1);
    next.splice(to, 0, dragId);
    setLayout(next);
    setDragId(null);
  };

  const remove = (id: WidgetId) => setLayout(layout.filter((x) => x !== id));
  const add = (id: WidgetId) => !layout.includes(id) && setLayout([...layout, id]);

  const renderWidget = (id: WidgetId) => {
    switch (id) {
      case "kpi": return <KPIMetrics stats={stats} />;
      case "quality": return <DataQualityScore data={data} />;
      case "insights": return <AutoInsightCards data={data} columns={columns} />;
      case "charts": return <AutoChartGenerator data={data} />;
      case "corr": return <CorrelationHeatmap data={data} columns={columns} />;
      case "time": return <TimeSeriesChart data={data} columns={columns} />;
      case "dist": return <DistributionComparison data={data} columns={columns} />;
    }
  };

  const available = ALL.filter((a) => !layout.includes(a.id));

  return (
    <div className="space-y-4">
      <div className="glass-card p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-accent" />
          <h3 className="font-display font-semibold text-foreground">Custom Dashboard</h3>
          <span className="text-xs text-muted-foreground">drag widgets to reorder</span>
        </div>
        {available.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {available.map((a) => (
              <button
                key={a.id}
                onClick={() => add(a.id)}
                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-muted/60 text-foreground hover:bg-muted"
              >
                <Plus className="w-3 h-3" /> {a.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {layout.map((id) => (
          <div
            key={id}
            draggable
            onDragStart={() => onDragStart(id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(id)}
            className={`relative ${dragId === id ? "opacity-50" : ""}`}
          >
            <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
              <span className="p-1 rounded bg-card/80 text-muted-foreground cursor-grab"><GripVertical className="w-3 h-3" /></span>
              <button onClick={() => remove(id)} className="p-1 rounded bg-card/80 text-muted-foreground hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </div>
            {renderWidget(id)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DragDropDashboard;