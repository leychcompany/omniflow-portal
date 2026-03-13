const FETCH_TIMEOUT_MS = 60_000;

/**
 * Fetch with credentials. On 401, calls auth refresh and retries once.
 * Has 60s timeout to avoid hanging forever.
 */
export async function fetchWithAuthRetry(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const opts = {
    ...options,
    credentials: "include" as RequestCredentials,
    signal: options.signal ?? controller.signal,
  };

  try {
    const res = await fetch(url, opts);
    clearTimeout(timeout);
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
  } catch (e) {
    clearTimeout(timeout);
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw e;
  }
}
