const UPLOAD_TIMEOUT_MS = 30_000;

/**
 * Upload an image via server (FormData to /api/upload).
 * Same approach as ZIP - file goes through Next.js, server uploads to Supabase.
 * No client-side uploadToSignedUrl.
 */
export async function uploadImageDirect(
  file: File,
  folder: "news" | "training" | "software",
  _getAuthHeaders: () => Promise<Record<string, string>>
): Promise<string> {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${base}/api/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      body: formData,
      credentials: "include",
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timeout);
    if (e instanceof Error) {
      if (e.name === "AbortError") {
        throw new Error("Upload timed out. Please try again.");
      }
      throw new Error(e.message || "Failed to connect");
    }
    throw new Error("Failed to connect");
  }
  clearTimeout(timeout);

  const data = (await res.json()) as { url?: string; error?: string };

  if (!res.ok) {
    throw new Error(data.error || `Upload failed (${res.status})`);
  }
  if (!data.url) {
    throw new Error("No URL returned from upload");
  }
  return data.url;
}
