function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

const PRESIGN_TIMEOUT_MS = 30_000;

/**
 * Get a presigned upload URL from the API, then upload the file directly to Supabase.
 * Uses plain fetch with credentials (cookies) - no getAuthHeaders to avoid hanging on getSession.
 */
export async function uploadFileViaPresign(
  presignUrl: string,
  getAuthHeaders: () => Promise<Record<string, string>>,
  presignBody: Record<string, unknown>,
  file: File
): Promise<{ path: string; filename: string; size: string }> {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  const url = presignUrl.startsWith("http") ? presignUrl : `${base}${presignUrl}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PRESIGN_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(presignBody),
      credentials: "include",
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timeout);
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("Upload timed out. Please try again.");
    }
    throw e;
  }
  clearTimeout(timeout);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to get upload URL");
  const { bucket, path, token } = data as {
    bucket: string;
    path: string;
    token: string;
  };
  const { supabase } = await import("@/lib/supabase");
  const { error } = await supabase.storage
    .from(bucket)
    .uploadToSignedUrl(path, token, file, {
      contentType: file.type,
      upsert: true,
    });
  if (error) throw new Error(error.message);
  const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  return { path, filename, size: formatFileSize(file.size) };
}
