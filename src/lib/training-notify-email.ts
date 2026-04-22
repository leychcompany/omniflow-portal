/**
 * Training class transactional emails via Resend. Fail-open: log only, no throw.
 */

import { formatTrainingScheduleEmailBlock } from "@/lib/format-training-session-schedule";
import { formatEnrollmentDetailsPlainText, type TrainingEnrollmentBody } from "@/lib/training-enrollment";
import { trainingSignupDisclaimerEmailBlock } from "@/lib/training-signup-disclaimers";

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
  const schedule = formatTrainingScheduleEmailBlock(
    ctx.startsAtIso,
    ctx.endsAtIso,
    ctx.timezone
  );
  return `
Class: ${ctx.sessionTitle}
${schedule}

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
      subject = `You’re signed up: ${ctx.sessionTitle}`;
      body += `You’ve signed up for this class. Payment is handled offline (for example by purchase order); your OMNI representative will follow up as needed.\n\n${block}\n\n${trainingSignupDisclaimerEmailBlock()}\n\nWe look forward to seeing you.`;
      break;
    case "waitlist_joined":
      subject = `Waitlist: ${ctx.sessionTitle}`;
      body += `You’re on the waitlist for this class:\n\n${block}\n\n`;
      if (extra?.waitlistPosition != null) {
        body += `Your position: #${extra.waitlistPosition}\n\n`;
      }
      body += `${trainingSignupDisclaimerEmailBlock()}\n\nIf a seat opens, we’ll email you.`;
      break;
    case "promoted_from_waitlist":
      subject = `A seat opened — you’re signed up: ${ctx.sessionTitle}`;
      body += `Good news — a seat opened and your signup is confirmed:\n\n${block}\n\n${trainingSignupDisclaimerEmailBlock()}`;
      break;
    case "registration_cancelled_self":
      subject = `Signup cancelled: ${ctx.sessionTitle}`;
      body += `You’ve cancelled your signup for:\n\n${block}`;
      break;
    case "removed_by_admin":
      subject = `Update: ${ctx.sessionTitle}`;
      body += `You’re no longer signed up or on the waitlist for this class:\n\n${block}\n\nIf this was unexpected, contact your OMNI representative.`;
      break;
    case "session_cancelled":
      subject = `Cancelled: ${ctx.sessionTitle}`;
      body += `This scheduled class has been cancelled:\n\n${ctx.sessionTitle}\n\n${formatTrainingScheduleEmailBlock(
        ctx.startsAtIso,
        ctx.endsAtIso,
        ctx.timezone
      )}\n\nLocation: ${ctx.location || "TBA"}\n\nWe’re sorry for the inconvenience. For questions, reply to this email or contact support.`;
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
    /** Portal self-serve signup payload; omit when added by admin so management sees a short notice. */
    enrollment?: TrainingEnrollmentBody | null;
    /** Session schedule; included in the enrollment block so ops/admins see class start & end. */
    schedule?: { startsAtIso: string; endsAtIso?: string | null; timezone: string };
  }
): void {
  const inbox = process.env.TRAINING_ALERTS_TO?.trim() || process.env.TRAINING_REQUEST_TO?.trim();
  const recipients = toEmails.length > 0 ? toEmails : inbox ? [inbox] : [];
  if (recipients.length === 0) return;
  const name = params.attendeeName || params.attendeeEmail;
  const subject = `Training: ${params.status === "registered" ? "New signup" : "Waitlist"} — ${params.sessionTitle}`;
  const enrollmentBlock = params.enrollment
    ? `\n\n${formatEnrollmentDetailsPlainText(params.enrollment, params.schedule)}`
    : `\n\nEnrollment details: Not collected via the portal signup form (e.g. admin-added enrollment). For full contact data, see Admin → Users or the session roster in the app.`;
  const text = `
${params.status === "registered" ? "New class signup" : "New waitlist signup"}

Account (login): ${name} <${params.attendeeEmail}>
Class: ${params.sessionTitle}${enrollmentBlock}
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
