/**
 * Welcoming email sent when an admin unlocks a user so they know they can sign in.
 * Uses Resend (same env as other transactional mail: RESEND_API_KEY, REQUEST_FROM).
 */

function portalBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim()
  return raw ? raw.replace(/\/$/, "") : ""
}

export type SendAccountUnlockedEmailParams = {
  to: string
  name?: string | null
}

export async function sendAccountUnlockedWelcomeEmail(
  params: SendAccountUnlockedEmailParams
): Promise<{ ok: boolean; error?: string }> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const REQUEST_FROM = process.env.REQUEST_FROM

  if (!RESEND_API_KEY || !REQUEST_FROM) {
    console.warn(
      "sendAccountUnlockedWelcomeEmail: missing RESEND_API_KEY or REQUEST_FROM, skipping"
    )
    return { ok: false, error: "Email not configured" }
  }

  const to = params.to?.trim()
  if (!to) {
    return { ok: false, error: "Missing recipient email" }
  }

  const base = portalBaseUrl()
  const loginHref = base ? `${base}/login` : null
  const displayName =
    params.name?.trim() ||
    to.split("@")[0] ||
    "there"

  const subject = "Your OMNI portal account is ready"

  const textLines = [
    `Hello ${displayName},`,
    "",
    "Your account has been approved. You now have full access to the OMNI client portal.",
    loginHref
      ? `Sign in here: ${loginHref}`
      : "You can sign in using the same portal link you used when you registered.",
    "",
    "If you have questions, reply to this email or contact your OMNI representative.",
    "",
    "— OMNI Flow Team",
  ]

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #1e293b;">
  <p>Hello ${escapeHtml(displayName)},</p>
  <p>Your account has been approved. You now have full access to the OMNI client portal.</p>
  ${
    loginHref
      ? `<p><a href="${escapeHtml(loginHref)}" style="color: #2563eb;">Sign in to the portal</a></p>`
      : "<p>You can sign in using the same portal link you used when you registered.</p>"
  }
  <p>If you have questions, reply to this email or contact your OMNI representative.</p>
  <p style="margin-top: 1.5rem; color: #64748b; font-size: 0.875rem;">— OMNI Flow Team</p>
</body>
</html>`.trim()

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: REQUEST_FROM,
        to: [to],
        subject,
        text: textLines.join("\n"),
        html,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error("sendAccountUnlockedWelcomeEmail Resend error:", res.status, errBody)
      return { ok: false, error: errBody }
    }

    return { ok: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    console.error("sendAccountUnlockedWelcomeEmail error:", msg)
    return { ok: false, error: msg }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
