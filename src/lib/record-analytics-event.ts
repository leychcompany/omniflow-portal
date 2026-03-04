/**
 * Records an auth analytics event (login/logout) from the client.
 * Metadata (IP, user-agent, etc.) is captured server-side from the request.
 * Fire-and-forget: does not throw or block the auth flow.
 */
export async function recordAuthEvent(
  eventType: "login" | "logout",
  accessToken?: string | null
): Promise<void> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
    await fetch("/api/analytics/events", {
      method: "POST",
      headers,
      body: JSON.stringify({ event_type: eventType }),
      credentials: "include",
    });
  } catch {
    // Fire-and-forget: do not block auth flow
  }
}
