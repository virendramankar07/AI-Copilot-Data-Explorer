import { useState } from "react";
import { Search, Replace } from "lucide-react";
import { toast } from "sonner";

interface Props {
  data: Record<string, unknown>[];
  columns: string[];
  onDataUpdate: (data: Record<string, unknown>[]) => void;
}

const FindReplace = ({ data, columns, onDataUpdate }: Props) => {
  const [findValue, setFindValue] = useState("");
  const [replaceValue, setReplaceValue] = useState("");
  const [selectedCol, setSelectedCol] = useState("__all__");
  const [matchCount, setMatchCount] = useState<number | null>(null);

  const handleFind = () => {
    let count = 0;
    data.forEach((row) => {
      const cols = selectedCol === "__all__" ? columns : [selectedCol];
      cols.forEach((col) => {
        if (String(row[col] ?? "").includes(findValue)) count++;
      });
    });
    setMatchCount(count);
    toast.info(`Found ${count} matches`);
  };

  const handleReplace = () => {
    const updated = data.map((row) => {
      const newRow = { ...row };
      const cols = selectedCol === "__all__" ? columns : [selectedCol];
      cols.forEach((col) => {
        const val = String(newRow[col] ?? "");
        if (val.includes(findValue)) {
          const replaced = val.split(findValue).join(replaceValue);
          const num = Number(replaced);
          newRow[col] = !isNaN(num) && replaced.trim() !== "" ? num : replaced;
        }
      });
      return newRow;
    });
    onDataUpdate(updated);
    toast.success(`Replaced all occurrences of "${findValue}" with "${replaceValue}"`);
    setMatchCount(null);
  };

  const inputClass = "bg-muted text-foreground border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-full";
  const selectClass = "bg-muted text-foreground border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-display font-semibold text-foreground mb-4">🔍 Find & Replace</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Column</label>
          <select className={selectClass + " w-full"} value={selectedCol} onChange={(e) => setSelectedCol(e.target.value)}>
            <option value="__all__">All columns</option>
            {columns.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Find</label>
          <input className={inputClass} value={findValue} onChange={(e) => setFindValue(e.target.value)} placeholder="Search value..." />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Replace with</label>
          <input className={inputClass} value={replaceValue} onChange={(e) => setReplaceValue(e.target.value)} placeholder="Replace with..." />
        </div>
        <div className="flex items-end gap-2">
          <button onClick={handleFind} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-sm transition-colors">
            <Search className="w-4 h-4" /> Find
          </button>
          <button onClick={handleReplace} disabled={!findValue} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-medium disabled:opacity-50 transition-all">
            <Replace className="w-4 h-4" /> Replace
          </button>
        </div>
      </div>
      {matchCount !== null && (
        <p className="text-sm text-muted-foreground">
          Found <span className="text-accent font-semibold">{matchCount}</span> matches
        </p>
      )}
    </div>
  );
};

export default FindReplace;
