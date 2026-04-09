"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { fetchWithAdminAuth } from "@/lib/admin-fetch";
import { sanitizeCourseHtml } from "@/lib/sanitize-course-html";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import {
  ArrowLeft,
  Image,
  ImageOff,
  Loader2,
  Pencil,
  Plus,
  XCircle,
} from "lucide-react";

type CourseFormState = {
  id: string;
  title: string;
  description: string;
  topics: string;
  duration: string;
  thumbnail: string;
  featured: boolean;
  sort_order: number;
  price: string;
  early_bird_price: string;
  format: string;
  location: string;
  prerequisite_course_id: string;
};

const emptyCreateState = (): CourseFormState => ({
  id: "",
  title: "",
  description: "",
  topics: "",
  duration: "",
  thumbnail: "",
  featured: false,
  sort_order: 0,
  price: "",
  early_bird_price: "",
  format: "",
  location: "",
  prerequisite_course_id: "",
});

type CourseFormProps =
  | { mode: "create" }
  | { mode: "edit"; courseId: string };

export function CourseForm(props: CourseFormProps) {
  const router = useRouter();
  const mode = props.mode;
  const courseId = props.mode === "edit" ? props.courseId : "";

  const [form, setForm] = useState<CourseFormState | null>(
    mode === "create" ? emptyCreateState() : null
  );
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [thumbnailPreviewFailed, setThumbnailPreviewFailed] = useState(false);
  const [courseOptions, setCourseOptions] = useState<
    { id: string; title: string }[]
  >([]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetchWithAdminAuth("/api/courses");
        const data = await res.json();
        if (Array.isArray(data)) {
          setCourseOptions(
            data.map((c: { id: string; title: string }) => ({
              id: c.id,
              title: c.title,
            }))
          );
        }
      } catch {
        setCourseOptions([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !courseId) return;
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    void (async () => {
      try {
        const res = await fetchWithAdminAuth(`/api/courses/${courseId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load course");
        if (cancelled) return;
        setForm({
          id: data.id,
          title: data.title,
          description: data.description ?? "",
          topics: data.topics ?? "",
          duration: data.duration ?? "",
          thumbnail: data.thumbnail ?? "",
          featured: !!data.featured,
          sort_order: data.sort_order ?? 0,
          price: data.price != null ? String(data.price) : "",
          early_bird_price:
            data.early_bird_price != null ? String(data.early_bird_price) : "",
          format: data.format ?? "",
          location: data.location ?? "",
          prerequisite_course_id: data.prerequisite_course_id ?? "",
        });
        setThumbnailPreviewFailed(false);
      } catch (e) {
        if (!cancelled)
          setLoadError(e instanceof Error ? e.message : "Failed to load course");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, courseId]);

  useEffect(() => {
    setThumbnailPreviewFailed(false);
  }, [form?.thumbnail]);

  const handleUploadImage = async (file: File): Promise<string | null> => {
    setImageUploading(true);
    try {
      const { uploadImageDirect } = await import("@/lib/upload-image");
      return await uploadImageDirect(file, "training", async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) throw new Error("Session expired");
        return { Authorization: `Bearer ${session.access_token}` };
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      return null;
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form || !form.title.trim()) {
      setError("Title is required");
      return;
    }
    if (mode === "create" && !form.id.trim()) {
      setError("Course ID is required (e.g. TR7000)");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const description = sanitizeCourseHtml(form.description);
      const topics = sanitizeCourseHtml(form.topics);
      const payload = {
        title: form.title,
        description,
        duration: form.duration.trim() || null,
        thumbnail: form.thumbnail.trim() || null,
        featured: form.featured,
        sort_order: form.sort_order,
        topics,
        price: form.price.trim() === "" ? null : form.price.trim(),
        early_bird_price:
          form.early_bird_price.trim() === "" ? null : form.early_bird_price.trim(),
        format: form.format.trim() || null,
        location: form.location.trim() || null,
        prerequisite_course_id: form.prerequisite_course_id.trim() || null,
      };

      if (mode === "create") {
        const res = await fetchWithAdminAuth("/api/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: form.id.trim(),
            ...payload,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create course");
      } else {
        const res = await fetchWithAdminAuth(`/api/courses/${form.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update course");
      }

      router.push("/admin/training");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const disabled = saving || loading;
  const thumb = form?.thumbnail?.trim() ?? "";

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="gap-2 text-zinc-600 dark:text-zinc-400"
        >
          <Link href="/admin/training">
            <ArrowLeft className="h-4 w-4" />
            Back to training
          </Link>
        </Button>
      </div>

      <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#141414] sm:p-8">
        <div className="border-b border-zinc-200 pb-5 dark:border-white/[0.08]">
          <h1 className="flex flex-wrap items-center gap-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {mode === "create" ? (
              <>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Plus className="h-5 w-5" />
                </span>
                Add course
              </>
            ) : (
              <>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25">
                  <Pencil className="h-5 w-5" />
                </span>
                Edit course
                {form?.id && (
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {form.id}
                  </span>
                )}
              </>
            )}
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {mode === "create"
              ? "Create a catalog entry. Description and topics support bold, lists, and basic formatting."
              : "Update course copy, pricing, and visibility."}
          </p>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="h-9 w-9 animate-spin text-blue-500" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Loading course…
            </p>
          </div>
        )}

        {!loading && loadError && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 shrink-0" />
              {loadError}
            </div>
            <Button variant="outline" className="mt-3" asChild>
              <Link href="/admin/training">Back to training</Link>
            </Button>
          </div>
        )}

        {!loading && form && (
          <div className="space-y-5 pt-6">
            {mode === "create" && (
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Course ID
                </label>
                <Input
                  placeholder="e.g. TR7000"
                  value={form.id}
                  onChange={(e) =>
                    setForm((f) => (f ? { ...f, id: e.target.value } : f))
                  }
                  className="h-11"
                  disabled={disabled}
                />
              </div>
            )}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Title
              </label>
              <Input
                placeholder="Course title"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => (f ? { ...f, title: e.target.value } : f))
                }
                className="h-11"
                disabled={disabled}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Description
              </label>
              <RichTextEditor
                key={
                  mode === "create"
                    ? "create-description"
                    : `edit-${courseId}-description`
                }
                initialContent={form.description || ""}
                onChange={(html) =>
                  setForm((f) => (f ? { ...f, description: html } : f))
                }
                disabled={disabled}
                placeholder="Describe the course…"
                aria-label="Description"
                minHeight="180px"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Topics
              </label>
              <RichTextEditor
                key={
                  mode === "create"
                    ? "create-topics"
                    : `edit-${courseId}-topics`
                }
                initialContent={form.topics || ""}
                onChange={(html) =>
                  setForm((f) => (f ? { ...f, topics: html } : f))
                }
                disabled={disabled}
                placeholder="List topics, bullets, highlights…"
                aria-label="Topics"
                minHeight="140px"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Price
                </label>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  placeholder="e.g. 1200"
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => (f ? { ...f, price: e.target.value } : f))
                  }
                  className="h-11"
                  disabled={disabled}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Early bird price
                </label>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  placeholder="Optional"
                  value={form.early_bird_price}
                  onChange={(e) =>
                    setForm((f) =>
                      f ? { ...f, early_bird_price: e.target.value } : f
                    )
                  }
                  className="h-11"
                  disabled={disabled}
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Format
              </label>
              <Input
                placeholder="e.g. In-person, Virtual, Hybrid"
                value={form.format}
                onChange={(e) =>
                  setForm((f) => (f ? { ...f, format: e.target.value } : f))
                }
                className="h-11"
                disabled={disabled}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Duration
              </label>
              <Input
                placeholder="e.g. 2 days, 8 hours"
                value={form.duration}
                onChange={(e) =>
                  setForm((f) => (f ? { ...f, duration: e.target.value } : f))
                }
                className="h-11"
                disabled={disabled}
              />
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                How long the course runs—not the same as format above.
              </p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Location
              </label>
              <Input
                placeholder="e.g. Houston, TX · Training center · Online"
                value={form.location}
                onChange={(e) =>
                  setForm((f) => (f ? { ...f, location: e.target.value } : f))
                }
                className="h-11"
                disabled={disabled}
              />
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Where the course is usually held, if applicable.
              </p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Prerequisite course
              </label>
              <select
                className="flex h-11 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-zinc-100"
                value={form.prerequisite_course_id}
                onChange={(e) =>
                  setForm((f) =>
                    f ? { ...f, prerequisite_course_id: e.target.value } : f
                  )
                }
                disabled={disabled}
              >
                <option value="">None</option>
                {courseOptions
                  .filter((c) => c.id !== form.id.trim())
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} — {c.title}
                    </option>
                  ))}
              </select>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Optional. Learners should complete this course first.
              </p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Thumbnail
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-white/[0.12] dark:bg-white/[0.04] sm:w-40 sm:shrink-0">
                  <div className="relative aspect-video w-full">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={() => setThumbnailPreviewFailed(true)}
                      />
                    ) : (
                      <div className="flex h-full min-h-[72px] items-center justify-center p-2">
                        <Image className="h-6 w-6 text-zinc-400 opacity-50" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <label
                    className={`inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-white/[0.12] dark:bg-white/[0.04] dark:hover:bg-white/[0.08] ${imageUploading || disabled ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await handleUploadImage(file);
                          if (url)
                            setForm((c) => (c ? { ...c, thumbnail: url } : c));
                          e.target.value = "";
                        }
                      }}
                      disabled={imageUploading || disabled}
                    />
                    {imageUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    ) : (
                      <Image className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                    )}
                    <span className="hidden sm:inline">
                      {thumb ? "Replace" : "Upload"}
                    </span>
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 shrink-0 gap-2 border-zinc-200 dark:border-white/[0.12]"
                    disabled={disabled || imageUploading || !thumb}
                    onClick={() => {
                      setForm((f) => (f ? { ...f, thumbnail: "" } : f));
                      setThumbnailPreviewFailed(false);
                    }}
                  >
                    <ImageOff className="h-4 w-4" />
                    <span className="hidden sm:inline">Remove</span>
                  </Button>
                </div>
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                JPEG, PNG, GIF, WebP, max 5 MB. Optional.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:items-end">
              <label className="flex cursor-pointer items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) =>
                    setForm((f) =>
                      f ? { ...f, featured: e.target.checked } : f
                    )
                  }
                  disabled={disabled}
                  className="rounded border-zinc-300 text-blue-600 dark:border-white/[0.2]"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  Featured
                </span>
              </label>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Sort order
                </label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm((f) =>
                      f
                        ? {
                            ...f,
                            sort_order: parseInt(e.target.value, 10) || 0,
                          }
                        : f
                    )
                  }
                  className="h-11 w-28"
                  disabled={disabled}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
                <XCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-zinc-200 pt-5 dark:border-white/[0.08] sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => router.push("/admin/training")}
              >
                Cancel
              </Button>
              <Button
                onClick={() => void handleSubmit()}
                disabled={saving}
                className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : mode === "create" ? (
                  "Create course"
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
