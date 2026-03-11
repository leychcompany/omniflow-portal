"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileDropzone } from "./_components/file-dropzone";
import { ImageUploadCard } from "./_components/image-upload-card";
import { Upload, Loader2, XCircle, ArrowLeft } from "lucide-react";

const MAX_ZIP_BYTES = 1024 * 1024 * 1024; // 1 GB

export default function AddSoftwarePage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", description: "", imageUrl: "" });
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!zipFile) {
      setError("ZIP file is required");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("description", form.description.trim() || "");
      formData.append("image_url", form.imageUrl.trim() || "");
      formData.append("file", zipFile);

      const url = typeof window !== "undefined" ? `${window.location.origin}/api/software` : "/api/software";
      const res = await fetch(url, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save software");
      router.push("/admin/software");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/software")}
          className="gap-2 -ml-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Software
        </Button>
      </div>

      <Card className="border-0 shadow-xl bg-white overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2.5 bg-white/20 rounded-xl">
              <Upload className="h-6 w-6" />
            </div>
            Add Software
          </CardTitle>
          <CardDescription className="text-cyan-100">
            Upload a ZIP file and add a preview image. Max 1 GB per file.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Title *</label>
            <Input
              placeholder="e.g. OMNI-3000 Software v2.1"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              disabled={loading}
              className="h-11"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Description</label>
            <textarea
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm resize-none"
              rows={3}
              placeholder="Brief description of the software..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              disabled={loading}
            />
          </div>

          <ImageUploadCard
            value={form.imageUrl}
            onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
            disabled={loading}
          />

          <FileDropzone
            accept=".zip,application/zip,application/x-zip-compressed"
            maxSizeBytes={MAX_ZIP_BYTES}
            label="ZIP File *"
            hint="Software package. Max 1 GB."
            value={zipFile}
            onChange={setZipFile}
            disabled={loading}
          />

          {loading && (
            <div className="rounded-lg bg-cyan-50 border border-cyan-200 p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-cyan-600 animate-spin shrink-0" />
                <p className="text-sm font-medium text-cyan-900">
                  Uploading and saving...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <XCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={() => router.push("/admin/software")}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !form.title.trim() || !zipFile}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Add Software"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
