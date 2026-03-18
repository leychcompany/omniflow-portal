"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Upload, X, Loader2 } from "lucide-react";

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export interface FileDropzoneProps {
  accept: string;
  maxSizeBytes?: number;
  label: string;
  hint?: string;
  value: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  isUploading?: boolean;
}

export function FileDropzone({
  accept,
  maxSizeBytes,
  label,
  hint,
  value,
  onChange,
  disabled,
  isUploading,
}: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback(
    (f: File): string | null => {
      if (maxSizeBytes && f.size > maxSizeBytes) {
        const mb = (maxSizeBytes / (1024 * 1024)).toFixed(1);
        return `File must be under ${mb} MB`;
      }
      return null;
    },
    [maxSizeBytes]
  );

  const handleFile = useCallback(
    (f: File | null) => {
      if (!f) {
        onChange(null);
        setError(null);
        return;
      }
      const err = validateFile(f);
      if (err) {
        setError(err);
        return;
      }
      setError(null);
      onChange(f);
    },
    [onChange, validateFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled || isUploading) return;
      const f = e.dataTransfer.files?.[0];
      if (f) handleFile(f);
    },
    [disabled, isUploading, handleFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0] ?? null;
      handleFile(f);
      e.target.value = "";
    },
    [handleFile]
  );

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block">{label}</label>
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={cn(
          "rounded-xl border-2 border-dashed p-6 text-center transition-all",
          isDragOver && !disabled && !isUploading
            ? "border-blue-400 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/40"
            : "border-zinc-200 dark:border-white/[0.12] hover:border-blue-300 dark:hover:border-blue-500",
          (disabled || isUploading) && "opacity-60 cursor-not-allowed"
        )}
      >
        <input
          type="file"
          accept={accept}
          onChange={onInputChange}
          disabled={disabled || isUploading}
          className="sr-only"
          id={`dropzone-${label.replace(/\s/g, "-")}`}
        />
        <label
          htmlFor={`dropzone-${label.replace(/\s/g, "-")}`}
          className={cn(
            "cursor-pointer flex flex-col items-center gap-3",
            (disabled || isUploading) && "cursor-not-allowed"
          )}
        >
          {value ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-3 p-2 bg-zinc-100 dark:bg-white/[0.06] rounded-lg">
                {isUploading ? (
                  <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
                ) : (
                  <Upload className="h-8 w-8 text-zinc-500 dark:text-zinc-400" />
                )}
                <div className="text-left">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[200px]">
                    {value.name}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {formatSize(value.size)}
                  </p>
                </div>
                {!isUploading && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onChange(null);
                    }}
                    className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-white/[0.12] text-zinc-500 dark:text-zinc-400 hover:text-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {!isUploading && (
                <span className="text-xs text-zinc-500 dark:text-zinc-400">Click or drag to replace</span>
              )}
            </div>
          ) : (
            <>
              <Upload className="h-10 w-10 text-zinc-400 dark:text-zinc-500" />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Drag & drop or click to select
              </span>
            </>
          )}
        </label>
      </div>
      {hint && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
