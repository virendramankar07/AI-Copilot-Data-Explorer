import { useState, useEffect } from "react";
import { Clock, Trash2 } from "lucide-react";

interface RecentFile {
  name: string;
  rows: number;
  columns: number;
  quality: number;
  date: string;
}

interface Props {
  onClear?: () => void;
}

const STORAGE_KEY = "data-explorer-recent-files";

export function saveRecentFile(file: RecentFile) {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as RecentFile[];
  const updated = [file, ...stored.filter((f) => f.name !== file.name)].slice(0, 10);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

const RecentFiles = ({ onClear }: Props) => {
  const [files, setFiles] = useState<RecentFile[]>([]);

  useEffect(() => {
    setFiles(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
  }, []);

  const clearHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
    setFiles([]);
    onClear?.();
  };

  if (files.length === 0) return null;

  return (
    <div className="glass-card p-5 mt-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-accent" />
          <h4 className="text-sm font-display font-semibold text-foreground">Recent Files</h4>
        </div>
        <button onClick={clearHistory} className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1">
          <Trash2 className="w-3 h-3" /> Clear
        </button>
      </div>
      <div className="space-y-2">
        {files.map((f) => (
          <div key={f.name + f.date} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 text-sm">
            <span className="text-foreground truncate max-w-[200px]">📂 {f.name}</span>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>{f.rows} rows</span>
              <span>{f.columns} cols</span>
              <span className="text-accent">{f.quality}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentFiles;
