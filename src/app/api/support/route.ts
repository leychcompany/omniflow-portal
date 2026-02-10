import { NextResponse } from 'next/server'

const MAX_FILES = 3
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(req: Request) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const SUPPORT_REQUEST_TO = process.env.SUPPORT_REQUEST_TO
  const SUPPORT_REQUEST_FROM = process.env.REQUEST_FROM

  if (!RESEND_API_KEY || !SUPPORT_REQUEST_TO || !SUPPORT_REQUEST_FROM) {
    return NextResponse.json(
      { error: 'Email is not configured (missing RESEND_API_KEY, SUPPORT_REQUEST_TO, or REQUEST_FROM).' },
      { status: 500 }
    )
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
  const description = (formData.get('description') as string | null)?.trim() || ''
  const email = (formData.get('email') as string | null)?.trim() || ''

  if (!subject || !category || !priority || !description || !email) {
    return NextResponse.json(
      { error: 'Subject, category, priority, description, and email are required.' },
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
From: ${email}

Description:
${description}
`

    const emailPayload = {
      from: SUPPORT_REQUEST_FROM,
      to: [SUPPORT_REQUEST_TO],
      reply_to: email,
      subject: `Support: ${subject} [${priority}]`,
      text,
      attachments: attachments.length ? attachments : undefined,
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
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to process request' },
      { status: 400 }
    )
  }
}
