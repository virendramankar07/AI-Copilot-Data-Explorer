import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Download, BarChart3, LayoutDashboard, LineChart, ClipboardList, Wrench, GitCompare, FlaskConical, FileText, Brain } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import FileUpload from "@/components/FileUpload";
import KPIMetrics from "@/components/KPIMetrics";
import DataPreview from "@/components/DataPreview";
import ColumnStatsPanel from "@/components/ColumnStatsPanel";
import ChartsPanel from "@/components/ChartsPanel";
import CorrelationHeatmap from "@/components/CorrelationHeatmap";
import TimeSeriesChart from "@/components/TimeSeriesChart";
import DistributionComparison from "@/components/DistributionComparison";
import FindReplace from "@/components/FindReplace";
import RecentFiles, { saveRecentFile } from "@/components/RecentFiles";
import ThemeToggle from "@/components/ThemeToggle";
import MultiFileCompare from "@/components/MultiFileCompare";
import AutoInsightCards from "@/components/AutoInsightCards";
import AutoChartGenerator from "@/components/AutoChartGenerator";
import ChatWithData from "@/components/ChatWithData";
import OutlierHandler from "@/components/OutlierHandler";
import MLPanel from "@/components/MLPanel";
import AIReportGenerator from "@/components/AIReportGenerator";
import DataQualityScore from "@/components/DataQualityScore";
import DragDropDashboard from "@/components/DragDropDashboard";
import AISettings from "@/components/AISettings";
import AppearanceSettings from "@/components/AppearanceSettings";
import { parseCSV, autoCleanData, getDatasetStats, exportCSV, type DatasetStats } from "@/lib/dataUtils";

type SectionKey =
  | "analytics"
  | "dashboard"
  | "visuals"
  | "stats"
  | "tools"
  | "compare"
  | "ml"
  | "report"
  | "ai";

const NAV_ITEMS: { key: SectionKey; label: string; icon: typeof BarChart3 }[] = [
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "visuals", label: "Visuals", icon: LineChart },
  { key: "stats", label: "Statistics", icon: ClipboardList },
  { key: "tools", label: "Tools", icon: Wrench },
  { key: "compare", label: "Compare", icon: GitCompare },
  { key: "ml", label: "ML", icon: FlaskConical },
  { key: "report", label: "Report", icon: FileText },
  { key: "ai", label: "AI Chat", icon: Brain },
];

function AppSidebar({
  active,
  onSelect,
}: {
  active: SectionKey;
  onSelect: (key: SectionKey) => void;
}) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="animated-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-foreground font-semibold opacity-100">Explore</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.key;
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      onClick={() => onSelect(item.key)}
                      className={
                        `sidebar-nav-link ${isActive ? "active font-medium" : ""}`
                      }
                    >
                      <Icon className="h-4 w-4" style={isActive ? { color: "var(--accent-custom)" } : undefined} />
                      {!collapsed && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

const Index = () => {
  const [rawData, setRawData] = useState<Record<string, unknown>[]>([]);
  const [cleanedData, setCleanedData] = useState<Record<string, unknown>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [fileName, setFileName] = useState("");
  const [section, setSection] = useState<SectionKey>("analytics");

  const handleFile = useCallback(async (file: File) => {
    const { data, columns: cols } = await parseCSV(file);
    const cleaned = autoCleanData(data);
    const cleanedCols = cleaned.length > 0 ? Object.keys(cleaned[0]) : cols;
    setRawData(data);
    setCleanedData(cleaned);
    setColumns(cleanedCols);
    const s = getDatasetStats(cleaned, data);
    setStats(s);
    setFileName(file.name);
    saveRecentFile({ name: file.name, rows: s.rows, columns: s.columns, quality: s.qualityScore, date: new Date().toISOString() });
  }, []);

  const handleDataUpdate = useCallback((data: Record<string, unknown>[]) => {
    setCleanedData(data);
    setColumns(data.length > 0 ? Object.keys(data[0]) : []);
    setStats(getDatasetStats(data, rawData));
  }, [rawData]);

  const renderSection = () => {
    if (!stats) return null;
    switch (section) {
      case "analytics":
        return (
          <div className="space-y-6">
            <DataPreview data={cleanedData} columns={columns} />
            <CorrelationHeatmap data={cleanedData} columns={columns} />
          </div>
        );
      case "dashboard":
        return <DragDropDashboard data={cleanedData} columns={columns} stats={stats} />;
      case "visuals":
        return (
          <div className="space-y-6">
            <AutoChartGenerator data={cleanedData} />
            <ChartsPanel data={cleanedData} columns={columns} />
            <TimeSeriesChart data={cleanedData} columns={columns} />
            <DistributionComparison data={cleanedData} columns={columns} />
          </div>
        );
      case "stats":
        return (
          <div className="space-y-6">
            <DataQualityScore data={cleanedData} />
            <ColumnStatsPanel data={cleanedData} columns={columns} />
          </div>
        );
      case "tools":
        return (
          <div className="space-y-6">
            <FindReplace data={cleanedData} columns={columns} onDataUpdate={handleDataUpdate} />
            <OutlierHandler data={cleanedData} onDataUpdate={handleDataUpdate} />
          </div>
        );
      case "compare":
        return <MultiFileCompare primaryFile={{ name: fileName, data: cleanedData, columns, stats }} />;
      case "ml":
        return <MLPanel data={cleanedData} columns={columns} />;
      case "report":
        return <AIReportGenerator data={cleanedData} columns={columns} stats={stats} fileName={fileName} />;
      case "ai":
        return <ChatWithData data={cleanedData} columns={columns} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="animated-gradient-bg min-h-screen flex w-full">
        <div className="particles-layer" aria-hidden="true">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} />
          ))}
        </div>
        {stats && <AppSidebar active={section} onSelect={setSection} />}

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border/40 px-4 backdrop-blur-sm bg-background/40 sticky top-0 z-30">
            <div className="flex items-center gap-2">
              {stats && <SidebarTrigger />}
              <span className="font-display font-semibold shimmer-text hidden sm:inline">
                🤖 AI Copilot Data Explorer
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AppearanceSettings />
              <AISettings />
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 px-4 py-8 relative z-10">
            <div className="max-w-7xl mx-auto">
              {!stats ? (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                  >
                    <h1 className="text-4xl md:text-5xl font-display font-bold shimmer-text mb-2 floaty">
                      🤖 AI Copilot Data Explorer
                    </h1>
                    <p className="text-muted-foreground text-lg">The Future of Automated Analytics</p>
                  </motion.div>
                  <FileUpload onFileSelect={handleFile} />
                  <RecentFiles />
                </>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">📂 {fileName}</span>
                      <button
                        onClick={() => { setStats(null); setRawData([]); setCleanedData([]); setSection("analytics"); }}
                        className="text-xs text-accent hover:underline"
                      >
                        Upload new file
                      </button>
                    </div>
                    <button
                      onClick={() => exportCSV(cleanedData, `cleaned_${fileName}`)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-sm hover:scale-105 transition-transform glow-pulse"
                    >
                      <Download className="w-4 h-4" /> Export Cleaned Data
                    </button>
                  </div>

                  <KPIMetrics stats={stats} />
                  <AutoInsightCards data={cleanedData} columns={columns} />

                  <motion.div
                    key={section}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderSection()}
                  </motion.div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
