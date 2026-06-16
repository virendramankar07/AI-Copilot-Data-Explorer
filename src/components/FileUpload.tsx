import { useCallback } from "react";
import { Upload } from "lucide-react";
import { motion } from "framer-motion";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

const FileUpload = ({ onFileSelect }: FileUploadProps) => {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file?.name.endsWith(".csv")) onFileSelect(file);
    },
    [onFileSelect]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center justify-center min-h-[60vh]"
    >
      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="glass-card-hover flex flex-col items-center justify-center w-full max-w-lg p-16 cursor-pointer text-center"
      >
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
          <Upload className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-display font-bold text-foreground mb-2">
          Upload Your Dataset
        </h2>
        <p className="text-muted-foreground mb-6">
          Drag & drop a CSV file or click to browse
        </p>
        <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-sm">
          Browse Files
        </div>
        <input
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelect(file);
          }}
        />
      </label>
    </motion.div>
  );
};

export default FileUpload;
