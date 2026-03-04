/**
 * Returns a user-friendly error message for Supabase Storage errors.
 * Handles 413 (file too large) with guidance on Supabase limits.
 */
export function getStorageErrorMessage(error: unknown): string {
  const err = error as { statusCode?: string; message?: string };
  const statusCode = err?.statusCode ?? (err as { status?: number })?.status;
  const code = String(statusCode ?? "");

  if (code === "413" || err?.message?.toLowerCase().includes("maximum allowed size")) {
    return "File exceeds Supabase Storage limit. Free plan: 50 MB max. Pro plan: increase limit in Dashboard → Storage → Settings.";
  }

  return err?.message ?? "Storage upload failed";
}
