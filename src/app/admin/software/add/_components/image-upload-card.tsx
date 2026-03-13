"use client";

import { useState } from "react";
import { uploadImageDirect } from "@/lib/upload-image";
import { Image, Loader2, XCircle, Link2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPT = "image/jpeg,image/jpg,image/png,image/gif,image/webp";

export interface ImageUploadCardProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export function ImageUploadCard({ value, onChange, disabled }: ImageUploadCardProps) {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = async () => {
    const { supabase } = await import("@/lib/supabase");
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
    return {};
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || disabled || uploading) return;

    if (file.size > MAX_SIZE) {
      setError("Image must be under 5 MB");
      return;
    }
    const allowedTypes = ACCEPT.split(",");
    const ext = file.name.split(".").pop()?.toLowerCase();
    const validType = allowedTypes.includes(file.type) || ["jpg", "jpeg", "png", "gif", "webp"].includes(ext ?? "");
    if (!validType) {
      setError("Only JPEG, PNG, GIF, WebP allowed");
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const url = await uploadImageDirect(file, "software", getAuthHeaders);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setError(null);
    onChange(url);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700 block">
        Preview Image (optional)
      </label>
      <div
        className={cn(
          "rounded-xl border-2 border-dashed p-4 transition-all",
          value ? "border-slate-200" : "border-slate-200 hover:border-cyan-300"
        )}
      >
        {value ? (
          <div className="flex gap-4 items-start">
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-slate-100 shrink-0">
              <img
                src={value}
                alt="Preview"
                className="w-full h-full object-contain"
                onError={() => onChange("")}
              />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept={ACCEPT}
                    onChange={handleFileSelect}
                    disabled={disabled || uploading}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 text-sm text-cyan-600 hover:text-cyan-700 font-medium",
                      (disabled || uploading) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Image className="h-4 w-4" />
                    )}
                    {uploading ? "Uploading..." : "Replace"}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => onChange("")}
                  disabled={disabled}
                  className="text-sm text-slate-500 hover:text-red-600 font-medium"
                >
                  Remove
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
              >
                <Link2 className="h-3 w-3" />
                {showUrlInput ? "Hide URL" : "Paste URL instead"}
                {showUrlInput ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="cursor-pointer block">
              <input
                type="file"
                accept={ACCEPT}
                onChange={handleFileSelect}
                disabled={disabled || uploading}
                className="sr-only"
              />
              <div
                className={cn(
                  "flex flex-col items-center gap-2 py-4 rounded-lg transition-colors",
                  (disabled || uploading)
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-slate-50"
                )}
              >
                {uploading ? (
                  <Loader2 className="h-10 w-10 text-cyan-600 animate-spin" />
                ) : (
                  <Image className="h-10 w-10 text-slate-400" />
                )}
                <span className="text-sm text-slate-600">
                  {uploading ? "Uploading image..." : "Click to upload image"}
                </span>
                <span className="text-xs text-slate-400">JPEG, PNG, GIF, WebP · max 5 MB</span>
              </div>
            </label>
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-xs text-slate-500 hover:text-cyan-600 flex items-center gap-1"
            >
              <Link2 className="h-3 w-3" />
              {showUrlInput ? "Hide" : "Or paste image URL"}
              {showUrlInput ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        )}

        {showUrlInput && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <Input
              placeholder="https://..."
              value={value}
              onChange={(e) => handleUrlChange(e.target.value)}
              disabled={disabled}
              className="h-9 text-sm"
            />
          </div>
        )}

        {error && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
            <XCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
