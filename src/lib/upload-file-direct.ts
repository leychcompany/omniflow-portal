/**
 * Get a presigned upload URL from the API, then upload the file directly to Supabase.
 * Avoids sending the file through the server (Vercel 4.5 MB body limit).
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export async function uploadFileViaPresign(
  presignUrl: string,
  getAuthHeaders: () => Promise<Record<string, string>>,
  presignBody: Record<string, unknown>,
  file: File
): Promise<{ path: string; filename: string; size: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(presignUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(presignBody),
  });
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
