/**
 * Sends a notification email to helpdesk@omniflow.com via Resend.
 * Used when a user is created or accepts an invite.
 */

const HELPDESK_EMAIL = 'helpdesk@omniflow.com'

export type HelpdeskNotifyType = 'user_created' | 'invite_accepted'

export interface HelpdeskNotifyData {
  email: string
  name?: string
}

export async function notifyHelpdesk(
  type: HelpdeskNotifyType,
  data: HelpdeskNotifyData
): Promise<{ ok: boolean; error?: string }> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const REQUEST_FROM = process.env.REQUEST_FROM

  if (!RESEND_API_KEY || !REQUEST_FROM) {
    console.warn('notifyHelpdesk: missing RESEND_API_KEY or REQUEST_FROM, skipping')
    return { ok: false, error: 'Email not configured' }
  }

  const isUserCreated = type === 'user_created'
  const subject = isUserCreated
    ? `Portal: New user created – ${data.email}`
    : `Portal: Invite accepted – ${data.email}`

  const text = isUserCreated
    ? `A new user has been added to the OMNI portal.

Email: ${data.email}
Name: ${data.name ?? '—'}`
    : `A user has accepted their invite and set their password.

Email: ${data.email}
Name: ${data.name ?? '—'}

They can now sign in to the portal.`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: REQUEST_FROM,
        to: [HELPDESK_EMAIL],
        subject,
        text,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('notifyHelpdesk Resend error:', res.status, errBody)
      return { ok: false, error: errBody }
    }

    return { ok: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('notifyHelpdesk error:', msg)
    return { ok: false, error: msg }
  }
}
