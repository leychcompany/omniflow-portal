/**
 * Training class transactional emails via Resend. Fail-open: log only, no throw.
 */

const RESEND_URL = "https://api.resend.com/emails";

export type TrainingEmailKind =
  | "registration_confirmed"
  | "waitlist_joined"
  | "promoted_from_waitlist"
  | "registration_cancelled_self"
  | "removed_by_admin"
  | "session_cancelled"
  | "session_updated"
  | "reminder_7d"
  | "reminder_1d";

export interface TrainingSessionEmailContext {
  sessionTitle: string;
  startsAtIso: string;
  endsAtIso?: string | null;
  timezone: string;
  location: string;
  portalSessionUrl: string;
}

function portalBase(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (typeof process.env.VERCEL_URL === "string"
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3009")
  );
}

function formatSessionBlock(ctx: TrainingSessionEmailContext): string {
  return `
Class: ${ctx.sessionTitle}
When: ${ctx.startsAtIso}${ctx.endsAtIso ? ` – ${ctx.endsAtIso}` : ""} (${ctx.timezone})
Location: ${ctx.location || "TBA"}

View details: ${ctx.portalSessionUrl}
`.trim();
}

async function sendResend(to: string, subject: string, text: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.REQUEST_FROM;
  if (!key || !from) {
    console.warn("training-notify-email: missing RESEND_API_KEY or REQUEST_FROM");
    return;
  }
  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("training-notify-email Resend error:", res.status, body);
  }
}

function safeSend(p: Promise<void>): void {
  p.catch((e) => console.error("training-notify-email:", e));
}

export function notifyTrainingAttendee(
  kind: TrainingEmailKind,
  toEmail: string,
  userName: string | null,
  ctx: TrainingSessionEmailContext,
  extra?: { waitlistPosition?: number; oldSummary?: string; newSummary?: string }
): void {
  if (!toEmail) return;
  const greeting = userName ? `Hi ${userName},` : "Hi,";
  const block = formatSessionBlock(ctx);

  let subject = "";
  let body = `${greeting}\n\n`;

  switch (kind) {
    case "registration_confirmed":
      subject = `You’re registered: ${ctx.sessionTitle}`;
      body += `You’re confirmed for this class:\n\n${block}\n\nWe look forward to seeing you.`;
      break;
    case "waitlist_joined":
      subject = `Waitlist: ${ctx.sessionTitle}`;
      body += `You’re on the waitlist for this class:\n\n${block}\n\n`;
      if (extra?.waitlistPosition != null) {
        body += `Your position: #${extra.waitlistPosition}\n\n`;
      }
      body += `If a seat opens, we’ll email you.`;
      break;
    case "promoted_from_waitlist":
      subject = `A seat opened — you’re confirmed: ${ctx.sessionTitle}`;
      body += `Good news — a seat opened and you’re now confirmed:\n\n${block}`;
      break;
    case "registration_cancelled_self":
      subject = `Registration cancelled: ${ctx.sessionTitle}`;
      body += `You’ve cancelled your registration for:\n\n${block}`;
      break;
    case "removed_by_admin":
      subject = `Update: ${ctx.sessionTitle}`;
      body += `You’re no longer registered or on the waitlist for this class:\n\n${block}\n\nIf this was unexpected, contact your OMNI representative.`;
      break;
    case "session_cancelled":
      subject = `Cancelled: ${ctx.sessionTitle}`;
      body += `This scheduled class has been cancelled:\n\n${ctx.sessionTitle}\nStarts (was): ${ctx.startsAtIso}\n\nWe’re sorry for the inconvenience. For questions, reply to this email or contact support.`;
      break;
    case "session_updated":
      subject = `Schedule update: ${ctx.sessionTitle}`;
      body += `The details for this class have changed.\n\n${block}\n\n`;
      if (extra?.oldSummary && extra?.newSummary) {
        body += `Previous:\n${extra.oldSummary}\n\nUpdated:\n${extra.newSummary}\n`;
      }
      break;
    case "reminder_7d":
      subject = `Reminder — class in about a week: ${ctx.sessionTitle}`;
      body += `This is a friendly reminder:\n\n${block}`;
      break;
    case "reminder_1d":
      subject = `Tomorrow: ${ctx.sessionTitle}`;
      body += `Your class is coming up:\n\n${block}`;
      break;
    default:
      return;
  }

  safeSend(sendResend(toEmail, subject, body));
}

export function notifyInternalTrainingSignup(
  toEmails: string[],
  params: {
    attendeeEmail: string;
    attendeeName: string | null;
    sessionTitle: string;
    status: "registered" | "waitlisted";
  }
): void {
  const inbox = process.env.TRAINING_ALERTS_TO?.trim() || process.env.TRAINING_REQUEST_TO?.trim();
  const recipients = toEmails.length > 0 ? toEmails : inbox ? [inbox] : [];
  if (recipients.length === 0) return;
  const name = params.attendeeName || params.attendeeEmail;
  const subject = `Training: ${params.status === "registered" ? "Registration" : "Waitlist"} — ${params.sessionTitle}`;
  const text = `
${params.status === "registered" ? "New registration" : "New waitlist signup"}

Attendee: ${name} <${params.attendeeEmail}>
Class: ${params.sessionTitle}
`.trim();
  for (const to of recipients) {
    safeSend(sendResend(to, subject, text));
  }
}

export function buildSessionContext(
  sessionId: string,
  row: {
    title: string | null;
    starts_at: string;
    ends_at?: string | null;
    timezone: string;
    location: string;
  }
): TrainingSessionEmailContext {
  const base = portalBase();
  const sessionTitle = row.title?.trim() || "Training class";
  return {
    sessionTitle,
    startsAtIso: row.starts_at,
    endsAtIso: row.ends_at,
    timezone: row.timezone,
    location: row.location,
    portalSessionUrl: `${base}/training/sessions/${sessionId}`,
  };
}
