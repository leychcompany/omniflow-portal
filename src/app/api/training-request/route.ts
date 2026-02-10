import { NextResponse } from 'next/server'
import { z } from 'zod'

const bodySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  courseId: z.string().min(1),
  message: z.string().optional().nullable(),
})

export async function POST(req: Request) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const TRAINING_REQUEST_TO = process.env.TRAINING_REQUEST_TO
  const TRAINING_REQUEST_FROM =
    process.env.TRAINING_REQUEST_FROM || 'no-reply@omniflow.com'

  if (!RESEND_API_KEY || !TRAINING_REQUEST_TO) {
    return NextResponse.json(
      { error: 'Email is not configured (missing RESEND_API_KEY or TRAINING_REQUEST_TO).' },
      { status: 500 }
    )
  }

  const json = await req.json().catch(() => null)
  if (!json) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const data = parsed.data

  const text = `
Training request received

Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone || 'N/A'}
Company: ${data.company || 'N/A'}
Course: ${data.courseId}

Notes:
${data.message || 'N/A'}
`

  const emailPayload = {
    from: TRAINING_REQUEST_FROM,
    to: [TRAINING_REQUEST_TO],
    reply_to: data.email,
    subject: `Training request: ${data.courseId} - ${data.name}`,
    text,
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailPayload),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    return NextResponse.json(
      { error: 'Failed to send email', details: errorBody },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
