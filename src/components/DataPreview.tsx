import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DataPreviewProps {
  data: Record<string, unknown>[];
  columns: string[];
}

const DataPreview = ({ data, columns }: DataPreviewProps) => (
  <div className="glass-card p-6 overflow-auto max-h-[400px]">
    <h3 className="text-lg font-display font-semibold text-foreground mb-4">📋 Data Preview</h3>
    <Table>
      <TableHeader>
        <TableRow className="border-border">
          {columns.map((col) => (
            <TableHead key={col} className="text-accent font-semibold text-xs uppercase tracking-wider whitespace-nowrap">
              {col}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.slice(0, 10).map((row, i) => (
          <TableRow key={i} className="border-border">
            {columns.map((col) => (
              <TableCell key={col} className="text-foreground/80 text-sm whitespace-nowrap">
                {String(row[col] ?? "")}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export default DataPreview;
