import { NextRequest, NextResponse } from 'next/server'
import sanitizeHtml from 'sanitize-html'
import { stripHtml } from '@/lib/strip-html'
import { verifyAuth } from '@/lib/verify-auth'

const MAX_FILES = 3
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

/** Default inbox for /support ticket emails (override with SUPPORT_REQUEST_TO if needed). */
const DEFAULT_SUPPORT_TO = 'helpdesk@omniflow.com'
const DESCRIPTION_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    's',
    'u',
    'ul',
    'ol',
    'li',
  ],
  allowedAttributes: {},
}

async function sendResendEmail(apiKey: string, payload: Record<string, unknown>) {
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export async function POST(req: NextRequest) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const SUPPORT_REQUEST_FROM = process.env.REQUEST_FROM
  const supportTo =
    process.env.SUPPORT_REQUEST_TO?.trim() || DEFAULT_SUPPORT_TO

  if (!RESEND_API_KEY || !SUPPORT_REQUEST_FROM) {
    return NextResponse.json(
      { error: 'Email is not configured (missing RESEND_API_KEY or REQUEST_FROM).' },
      { status: 500 }
    )
  }

  const auth = await verifyAuth(req)
  if (!auth.ok) return auth.response
  const accountEmail = auth.userEmail.trim()
  if (!accountEmail) {
    return NextResponse.json({ error: 'Authenticated account is missing an email address.' }, { status: 400 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const subject = (formData.get('subject') as string | null)?.trim() || ''
  const category = (formData.get('category') as string | null)?.trim() || ''
  const priority = (formData.get('priority') as string | null)?.trim() || ''
  const descriptionRaw = (formData.get('description') as string | null)?.trim() || ''
  const description = sanitizeHtml(descriptionRaw, DESCRIPTION_SANITIZE_OPTIONS)
  const descriptionText = stripHtml(description)

  if (!subject || !category || !priority || !descriptionText) {
    return NextResponse.json(
      { error: 'Subject, category, priority, and description are required.' },
      { status: 400 }
    )
  }

  const rawAttachments = formData.getAll('attachments')
  const files = rawAttachments.filter((item): item is File => item instanceof File)

  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Too many attachments. Max ${MAX_FILES} files.` },
      { status: 400 }
    )
  }

  try {
    const attachments = await Promise.all(
      files.map(async (file) => {
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`Attachment ${file.name} exceeds ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB limit.`)
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        return {
          filename: file.name,
          content: buffer.toString('base64'),
        }
      })
    )

    const text = `
Support ticket received

Subject: ${subject}
Category: ${category}
Priority: ${priority}
From: ${accountEmail}

Description:
${descriptionText}
`
    const html = `
<p><strong>Support ticket received</strong></p>
<p><strong>Subject:</strong> ${escapeHtml(subject)}<br />
<strong>Category:</strong> ${escapeHtml(category)}<br />
<strong>Priority:</strong> ${escapeHtml(priority)}<br />
<strong>From:</strong> ${escapeHtml(accountEmail)}</p>
<p><strong>Description:</strong></p>
${description}
`

    const emailPayload = {
      from: SUPPORT_REQUEST_FROM,
      to: [supportTo],
      reply_to: accountEmail,
      subject: `Support: ${subject} [${priority}]`,
      text,
      html,
      attachments: attachments.length ? attachments : undefined,
    }

    const res = await sendResendEmail(RESEND_API_KEY, emailPayload)

    if (!res.ok) {
      const errorBody = await res.text()
      return NextResponse.json(
        { error: 'Failed to send email', details: errorBody },
        { status: 500 }
      )
    }

    const confirmationText = `
Hi,

We received your support ticket and our team will review it shortly.

Subject: ${subject}
Category: ${category}
Priority: ${priority}

Your message:
${descriptionText}

Thank you,
Omniflow Support
`
    const confirmationHtml = `
<p>Hi,</p>
<p>We received your support ticket and our team will review it shortly.</p>
<p><strong>Subject:</strong> ${escapeHtml(subject)}<br />
<strong>Category:</strong> ${escapeHtml(category)}<br />
<strong>Priority:</strong> ${escapeHtml(priority)}</p>
<p><strong>Your message:</strong></p>
${description}
<p>Thank you,<br />Omniflow Support</p>
`
    const confirmationPayload = {
      from: SUPPORT_REQUEST_FROM,
      to: [accountEmail],
      subject: `We received your support ticket: ${subject}`,
      text: confirmationText,
      html: confirmationHtml,
    }

    const confirmationRes = await sendResendEmail(RESEND_API_KEY, confirmationPayload)
    if (!confirmationRes.ok) {
      const confirmationError = await confirmationRes.text()
      console.error('Failed to send support confirmation email:', confirmationError)
      return NextResponse.json({ ok: true, confirmationSent: false })
    }

    return NextResponse.json({ ok: true, confirmationSent: true })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to process request' },
      { status: 400 }
    )
  }
}
