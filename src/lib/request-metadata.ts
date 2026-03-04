import type { NextRequest } from "next/server";

/**
 * Extracts metadata from the incoming request for analytics.
 * Captures IP, user-agent, and other headers commonly used for audit trails.
 */
export function getRequestMetadata(req: NextRequest): Record<string, string | null> {
  const headers = req.headers;

  // IP: check common proxy headers (x-forwarded-for can be "client, proxy1, proxy2")
  const forwardedFor = headers.get("x-forwarded-for");
  const forwardedIp = forwardedFor ? forwardedFor.split(",")[0]?.trim() || null : null;
  const ip =
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    headers.get("true-client-ip") ??
    forwardedIp ??
    null;

  return {
    ip,
    user_agent: headers.get("user-agent"),
    referer: headers.get("referer"),
    origin: headers.get("origin"),
    accept_language: headers.get("accept-language"),
    sec_ch_ua: headers.get("sec-ch-ua"),
    sec_ch_ua_mobile: headers.get("sec-ch-ua-mobile"),
    sec_ch_ua_platform: headers.get("sec-ch-ua-platform"),
  };
}
