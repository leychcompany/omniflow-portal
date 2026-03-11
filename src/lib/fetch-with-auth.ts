/**
 * Fetch with credentials. On 401, calls auth refresh and retries once.
 * Use for API calls that require auth (e.g. software upload).
 */
export async function fetchWithAuthRetry(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const res = await fetch(url, { ...options, credentials: "include" });
  if (res.status === 401) {
    const refreshRes = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    if (refreshRes.ok) {
      return fetch(url, { ...options, credentials: "include" });
    }
  }
  return res;
}
