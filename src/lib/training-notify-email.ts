/**
 * Training class transactional emails via Resend. Fail-open: log only, no throw.
 */

import {
  formatTrainingScheduleEmailBlock,
  type TrainingSessionDay,
} from "@/lib/format-training-session-schedule";
import { formatEnrollmentDetailsPlainText, type TrainingEnrollmentBody } from "@/lib/training-enrollment";
import { renderInternalTrainingSignupEmail, renderTrainingEmail } from "@/lib/emails/render-training-email";

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
  days: ReadonlyArray<TrainingSessionDay>;
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

async function sendResend(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<void> {
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
    body: JSON.stringify({ from, to: [to], subject, html, text }),
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

  const subjects: Record<TrainingEmailKind, string> = {
    registration_confirmed: `You're signed up: ${ctx.sessionTitle}`,
    waitlist_joined: `Waitlist: ${ctx.sessionTitle}`,
    promoted_from_waitlist: `A seat opened — you're signed up: ${ctx.sessionTitle}`,
    registration_cancelled_self: `Signup cancelled: ${ctx.sessionTitle}`,
    removed_by_admin: `Update: ${ctx.sessionTitle}`,
    session_cancelled: `Cancelled: ${ctx.sessionTitle}`,
    session_updated: `Schedule update: ${ctx.sessionTitle}`,
    reminder_7d: `Reminder — class in about a week: ${ctx.sessionTitle}`,
    reminder_1d: `Tomorrow: ${ctx.sessionTitle}`,
  };

  const subject = subjects[kind];
  if (!subject) return;

  safeSend(
    renderTrainingEmail(kind, userName, ctx, extra).then(({ html, text }) =>
      sendResend(toEmail, subject, html, text)
    )
  );
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
    /** Session schedule; included in the enrollment block so ops/admins see all days. */
    schedule?: { days: ReadonlyArray<TrainingSessionDay>; timezone: string };
  }
): void {
  const inbox = process.env.TRAINING_ALERTS_TO?.trim() || process.env.TRAINING_REQUEST_TO?.trim();
  const recipients = toEmails.length > 0 ? toEmails : inbox ? [inbox] : [];
  if (recipients.length === 0) return;
  const subject = `Training: ${params.status === "registered" ? "New signup" : "Waitlist"} — ${params.sessionTitle}`;
  const nameDisplay = params.attendeeName ? ` (${params.attendeeName})` : "";
  const scheduleLines =
    params.schedule && params.schedule.days.length > 0
      ? formatTrainingScheduleEmailBlock(params.schedule.days, params.schedule.timezone).split("\n")
      : ["Schedule TBA"];
  const locationLine = "See session details";
  const portalUrl = `${portalBase()}/training`;
  const enrollmentBlock = params.enrollment
    ? formatEnrollmentDetailsPlainText(params.enrollment, params.schedule)
    : `Enrollment details: Not collected via the portal signup form (e.g. admin-added enrollment). For full contact data, see Admin -> Users or the session roster in the app.`;
  const text = `
${params.status === "registered" ? "New class signup" : "New waitlist signup"}

Account (login): ${params.attendeeEmail}${nameDisplay}
Class: ${params.sessionTitle}

${enrollmentBlock}
`.trim();

  for (const to of recipients) {
    safeSend(
      renderInternalTrainingSignupEmail({
        attendeeEmail: params.attendeeEmail,
        attendeeName: params.attendeeName,
        sessionTitle: params.sessionTitle,
        status: params.status,
        location: locationLine,
        portalSessionUrl: portalUrl,
        scheduleLines,
        enrollmentBlock,
      }).then(({ html }) => sendResend(to, subject, html, text))
    );
  }
}

export function buildSessionContext(
  sessionId: string,
  row: {
    title: string | null;
    days: ReadonlyArray<TrainingSessionDay>;
    timezone: string;
    location: string;
  }
): TrainingSessionEmailContext {
  const base = portalBase();
  const sessionTitle = row.title?.trim() || "Training class";
  return {
    sessionTitle,
    days: row.days,
    timezone: row.timezone,
    location: row.location,
    portalSessionUrl: `${base}/training/sessions/${sessionId}`,
  };
}
