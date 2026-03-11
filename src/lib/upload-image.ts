/**
 * Upload an image via presigned URL so the file never hits the server (avoids Vercel 4.5 MB body limit).
 */
export async function uploadImageDirect(
  file: File,
  folder: "news" | "training" | "software",
  getAuthHeaders: () => Promise<Record<string, string>>
): Promise<string> {
  const headers = await getAuthHeaders();
  const presignRes = await fetch("/api/upload/presign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({
      folder,
      filename: file.name,
      fileSize: file.size,
      contentType: file.type,
    }),
    credentials: "include",
  });
  const presignData = await presignRes.json();
  if (!presignRes.ok) {
    throw new Error(presignData.error || "Failed to get upload URL");
  }
  const { path, token, publicUrl } = presignData as {
    path: string;
    token: string;
    publicUrl: string;
  };

  const { supabase } = await import("@/lib/supabase");
  const { error } = await supabase.storage
    .from("images")
    .uploadToSignedUrl(path, token, file, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    throw new Error(error.message || "Upload failed");
  }
  return publicUrl;
}
