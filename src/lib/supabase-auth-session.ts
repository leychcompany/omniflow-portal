import type { AuthError } from "@supabase/supabase-js";

/** Stale or revoked refresh token (e.g. newer login elsewhere, bad cookies after deploy). */
export function isInvalidRefreshAuthError(err: unknown): boolean {
  if (err == null || typeof err !== "object") return false;
  const e = err as AuthError & { code?: string; __isAuthError?: boolean };
  if (e.code === "session_expired") return true;
  const msg = typeof e.message === "string" ? e.message : "";
  if (
    msg.includes("Invalid Refresh Token") ||
    (msg.includes("Refresh Token") && msg.includes("Revoked")) ||
    msg.includes("Session Expired")
  ) {
    return true;
  }
  return false;
}
