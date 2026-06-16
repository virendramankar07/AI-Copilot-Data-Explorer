import { useState, useCallback } from "react";
import { Upload, ArrowLeftRight } from "lucide-react";
import { parseCSV, getDatasetStats, type DatasetStats } from "@/lib/dataUtils";

interface FileData {
  name: string;
  data: Record<string, unknown>[];
  columns: string[];
  stats: DatasetStats;
}

interface Props {
  primaryFile?: { name: string; data: Record<string, unknown>[]; columns: string[]; stats: DatasetStats };
}

const MultiFileCompare = ({ primaryFile }: Props) => {
  const [compareFile, setCompareFile] = useState<FileData | null>(null);

  const handleFile = useCallback(async (file: File) => {
    const { data, columns } = await parseCSV(file);
    const stats = getDatasetStats(data, data);
    setCompareFile({ name: file.name, data, columns, stats });
  }, []);

  if (!primaryFile) return null;

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-display font-semibold text-foreground mb-4">
        <ArrowLeftRight className="w-5 h-5 inline mr-2" />
        Multi-File Comparison
      </h3>

      {!compareFile ? (
        <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Upload a second CSV to compare</p>
          <input type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </label>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Comparing with: <span className="text-foreground">{compareFile.name}</span></span>
            <button onClick={() => setCompareFile(null)} className="text-xs text-accent hover:underline">Remove</button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* File 1 */}
            <div className="p-4 rounded-lg bg-muted/40 border border-border">
              <h4 className="text-sm font-semibold text-foreground mb-3">📂 {primaryFile.name}</h4>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between"><span>Rows</span><span className="text-foreground">{primaryFile.stats.rows}</span></div>
                <div className="flex justify-between"><span>Columns</span><span className="text-foreground">{primaryFile.stats.columns}</span></div>
                <div className="flex justify-between"><span>Missing Values</span><span className="text-foreground">{primaryFile.stats.missingValues}</span></div>
                <div className="flex justify-between"><span>Duplicates</span><span className="text-foreground">{primaryFile.stats.duplicates}</span></div>
                <div className="flex justify-between"><span>Quality</span><span className="text-accent">{primaryFile.stats.qualityScore}%</span></div>
              </div>
            </div>

            {/* File 2 */}
            <div className="p-4 rounded-lg bg-muted/40 border border-border">
              <h4 className="text-sm font-semibold text-foreground mb-3">📂 {compareFile.name}</h4>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between"><span>Rows</span><span className="text-foreground">{compareFile.stats.rows}</span></div>
                <div className="flex justify-between"><span>Columns</span><span className="text-foreground">{compareFile.stats.columns}</span></div>
                <div className="flex justify-between"><span>Missing Values</span><span className="text-foreground">{compareFile.stats.missingValues}</span></div>
                <div className="flex justify-between"><span>Duplicates</span><span className="text-foreground">{compareFile.stats.duplicates}</span></div>
                <div className="flex justify-between"><span>Quality</span><span className="text-accent">{compareFile.stats.qualityScore}%</span></div>
              </div>
            </div>
          </div>

          {/* Column overlap */}
          <div className="p-4 rounded-lg bg-muted/40 border border-border">
            <h4 className="text-sm font-semibold text-foreground mb-2">Column Overlap</h4>
            <div className="flex flex-wrap gap-2">
              {primaryFile.columns.map((c) => (
                <span key={c} className={`px-2 py-1 rounded text-xs ${
                  compareFile.columns.includes(c)
                    ? "bg-accent/20 text-accent"
                    : "bg-destructive/20 text-destructive"
                }`}>
                  {c} {compareFile.columns.includes(c) ? "✓" : "✗"}
                </span>
              ))}
              {compareFile.columns.filter((c) => !primaryFile.columns.includes(c)).map((c) => (
                <span key={c} className="px-2 py-1 rounded text-xs bg-primary/20 text-primary">
                  {c} (new)
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiFileCompare;
