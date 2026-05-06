/**
 * Renders every training email kind as { html, text }.
 * html → sent as primary body in Resend; text → plain-text fallback.
 */
import { render } from "@react-email/components";
import * as React from "react";
import {
  ClassInfoBox,
  ImportantNotes,
  TrainingEmailLayout,
  emailStyles,
} from "./training-email-template";
import { Text } from "@react-email/components";
import type { TrainingEmailKind, TrainingSessionEmailContext } from "@/lib/training-notify-email";
import { TRAINING_SIGNUP_DISCLAIMER_PARAGRAPHS } from "@/lib/training-signup-disclaimers";
import {
  formatTrainingSessionSchedule,
  formatTrainingScheduleEmailBlock,
} from "@/lib/format-training-session-schedule";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildScheduleLines(ctx: TrainingSessionEmailContext): string[] {
  const sched = formatTrainingSessionSchedule(ctx.days, ctx.timezone, "en-US");
  if (sched.perDay.length === 0) return ["Schedule TBA"];
  return sched.perDay.map((d) =>
    d.label ? `${d.date} · ${d.time} — ${d.label}` : `${d.date} · ${d.time}`
  );
}

// ─── Individual email bodies ──────────────────────────────────────────────────

function RegistrationConfirmedEmail({
  greeting,
  ctx,
}: {
  greeting: string;
  ctx: TrainingSessionEmailContext;
}) {
  const scheduleLines = buildScheduleLines(ctx);
  return (
    <TrainingEmailLayout preview={`You're signed up: ${ctx.sessionTitle}`}>
      <Text style={emailStyles.greeting}>{greeting}</Text>
      <Text style={emailStyles.lead}>
        You've signed up for this class. Your OMNI representative will follow up as needed.
      </Text>
      <ClassInfoBox
        title={ctx.sessionTitle}
        scheduleLines={scheduleLines}
        location={ctx.location}
        ctaUrl={ctx.portalSessionUrl}
      />
      <Text style={{ ...emailStyles.closeText, marginBottom: "0" }}>
        We look forward to seeing you.
      </Text>
      <ImportantNotes notes={[...TRAINING_SIGNUP_DISCLAIMER_PARAGRAPHS]} />
    </TrainingEmailLayout>
  );
}

function WaitlistJoinedEmail({
  greeting,
  ctx,
  position,
}: {
  greeting: string;
  ctx: TrainingSessionEmailContext;
  position?: number | null;
}) {
  const scheduleLines = buildScheduleLines(ctx);
  return (
    <TrainingEmailLayout preview={`Waitlist: ${ctx.sessionTitle}`}>
      <Text style={emailStyles.greeting}>{greeting}</Text>
      <Text style={emailStyles.lead}>You're on the waitlist for this class.</Text>
      <ClassInfoBox
        title={ctx.sessionTitle}
        scheduleLines={scheduleLines}
        location={ctx.location}
        ctaUrl={ctx.portalSessionUrl}
      />
      {position != null && (
        <Text style={{ ...emailStyles.lead, marginBottom: "0" }}>
          Your waitlist position: <strong>#{position}</strong>
        </Text>
      )}
      <Text style={{ ...emailStyles.closeText, marginTop: position != null ? "12px" : "0" }}>
        If a seat opens, we'll email you right away.
      </Text>
      <ImportantNotes notes={[...TRAINING_SIGNUP_DISCLAIMER_PARAGRAPHS]} />
    </TrainingEmailLayout>
  );
}

function PromotedFromWaitlistEmail({
  greeting,
  ctx,
}: {
  greeting: string;
  ctx: TrainingSessionEmailContext;
}) {
  const scheduleLines = buildScheduleLines(ctx);
  return (
    <TrainingEmailLayout preview={`A seat opened — you're signed up: ${ctx.sessionTitle}`}>
      <Text style={emailStyles.greeting}>{greeting}</Text>
      <Text style={emailStyles.lead}>
        Good news — a seat opened and your signup is confirmed.
      </Text>
      <ClassInfoBox
        title={ctx.sessionTitle}
        scheduleLines={scheduleLines}
        location={ctx.location}
        ctaUrl={ctx.portalSessionUrl}
      />
      <ImportantNotes notes={[...TRAINING_SIGNUP_DISCLAIMER_PARAGRAPHS]} />
    </TrainingEmailLayout>
  );
}

function CancelledSelfEmail({
  greeting,
  ctx,
}: {
  greeting: string;
  ctx: TrainingSessionEmailContext;
}) {
  const scheduleLines = buildScheduleLines(ctx);
  return (
    <TrainingEmailLayout preview={`Signup cancelled: ${ctx.sessionTitle}`}>
      <Text style={emailStyles.greeting}>{greeting}</Text>
      <Text style={emailStyles.lead}>You've cancelled your signup for this class.</Text>
      <ClassInfoBox
        title={ctx.sessionTitle}
        scheduleLines={scheduleLines}
        location={ctx.location}
        ctaUrl={ctx.portalSessionUrl}
      />
    </TrainingEmailLayout>
  );
}

function RemovedByAdminEmail({
  greeting,
  ctx,
}: {
  greeting: string;
  ctx: TrainingSessionEmailContext;
}) {
  const scheduleLines = buildScheduleLines(ctx);
  return (
    <TrainingEmailLayout preview={`Update: ${ctx.sessionTitle}`}>
      <Text style={emailStyles.greeting}>{greeting}</Text>
      <Text style={emailStyles.lead}>
        You're no longer signed up or on the waitlist for this class.
      </Text>
      <ClassInfoBox
        title={ctx.sessionTitle}
        scheduleLines={scheduleLines}
        location={ctx.location}
        ctaUrl={ctx.portalSessionUrl}
      />
      <Text style={emailStyles.closeText}>
        If this was unexpected, please contact your OMNI representative.
      </Text>
    </TrainingEmailLayout>
  );
}

function SessionCancelledEmail({
  greeting,
  ctx,
}: {
  greeting: string;
  ctx: TrainingSessionEmailContext;
}) {
  const scheduleLines = buildScheduleLines(ctx);
  return (
    <TrainingEmailLayout preview={`Cancelled: ${ctx.sessionTitle}`}>
      <Text style={emailStyles.greeting}>{greeting}</Text>
      <Text style={emailStyles.lead}>This scheduled class has been cancelled.</Text>
      <ClassInfoBox
        title={ctx.sessionTitle}
        scheduleLines={scheduleLines}
        location={ctx.location}
        ctaUrl={ctx.portalSessionUrl}
      />
      <Text style={emailStyles.closeText}>
        We're sorry for the inconvenience. For questions, reply to this email or contact your OMNI
        representative.
      </Text>
    </TrainingEmailLayout>
  );
}

function SessionUpdatedEmail({
  greeting,
  ctx,
  oldSummary,
  newSummary,
}: {
  greeting: string;
  ctx: TrainingSessionEmailContext;
  oldSummary?: string;
  newSummary?: string;
}) {
  const scheduleLines = buildScheduleLines(ctx);
  return (
    <TrainingEmailLayout preview={`Schedule update: ${ctx.sessionTitle}`}>
      <Text style={emailStyles.greeting}>{greeting}</Text>
      <Text style={emailStyles.lead}>The details for this class have changed.</Text>
      <ClassInfoBox
        title={ctx.sessionTitle}
        scheduleLines={scheduleLines}
        location={ctx.location}
        ctaUrl={ctx.portalSessionUrl}
      />
      {oldSummary && newSummary && (
        <div
          style={{
            backgroundColor: "#fafafa",
            border: "1px solid #e4e4e7",
            borderRadius: "4px",
            padding: "12px 16px",
            fontSize: "13px",
            lineHeight: "20px",
            color: "#52525b",
          }}
        >
          <div style={{ marginBottom: "8px" }}>
            <strong style={{ color: "#18181b" }}>Previous</strong>
            <pre style={{ margin: "4px 0 0", fontFamily: "inherit", whiteSpace: "pre-wrap" }}>
              {oldSummary}
            </pre>
          </div>
          <div>
            <strong style={{ color: "#18181b" }}>Updated</strong>
            <pre style={{ margin: "4px 0 0", fontFamily: "inherit", whiteSpace: "pre-wrap" }}>
              {newSummary}
            </pre>
          </div>
        </div>
      )}
    </TrainingEmailLayout>
  );
}

function ReminderEmail({
  kind,
  greeting,
  ctx,
}: {
  kind: "reminder_7d" | "reminder_1d";
  greeting: string;
  ctx: TrainingSessionEmailContext;
}) {
  const scheduleLines = buildScheduleLines(ctx);
  const preview =
    kind === "reminder_1d"
      ? `Tomorrow: ${ctx.sessionTitle}`
      : `Reminder — class in about a week: ${ctx.sessionTitle}`;
  const lead =
    kind === "reminder_1d"
      ? "Your class is tomorrow — here are the details."
      : "Just a friendly reminder about your upcoming class.";
  return (
    <TrainingEmailLayout preview={preview}>
      <Text style={emailStyles.greeting}>{greeting}</Text>
      <Text style={emailStyles.lead}>{lead}</Text>
      <ClassInfoBox
        title={ctx.sessionTitle}
        scheduleLines={scheduleLines}
        location={ctx.location}
        ctaUrl={ctx.portalSessionUrl}
      />
      <Text style={emailStyles.closeText}>We look forward to seeing you.</Text>
    </TrainingEmailLayout>
  );
}

// ─── Public render function ───────────────────────────────────────────────────

export async function renderTrainingEmail(
  kind: TrainingEmailKind,
  userName: string | null,
  ctx: TrainingSessionEmailContext,
  extra?: { waitlistPosition?: number; oldSummary?: string; newSummary?: string }
): Promise<{ html: string; text: string }> {
  const greeting = userName ? `Hi ${userName},` : "Hi,";

  let element: React.ReactElement;

  switch (kind) {
    case "registration_confirmed":
      element = <RegistrationConfirmedEmail greeting={greeting} ctx={ctx} />;
      break;
    case "waitlist_joined":
      element = (
        <WaitlistJoinedEmail greeting={greeting} ctx={ctx} position={extra?.waitlistPosition} />
      );
      break;
    case "promoted_from_waitlist":
      element = <PromotedFromWaitlistEmail greeting={greeting} ctx={ctx} />;
      break;
    case "registration_cancelled_self":
      element = <CancelledSelfEmail greeting={greeting} ctx={ctx} />;
      break;
    case "removed_by_admin":
      element = <RemovedByAdminEmail greeting={greeting} ctx={ctx} />;
      break;
    case "session_cancelled":
      element = <SessionCancelledEmail greeting={greeting} ctx={ctx} />;
      break;
    case "session_updated":
      element = (
        <SessionUpdatedEmail
          greeting={greeting}
          ctx={ctx}
          oldSummary={extra?.oldSummary}
          newSummary={extra?.newSummary}
        />
      );
      break;
    case "reminder_7d":
    case "reminder_1d":
      element = <ReminderEmail kind={kind} greeting={greeting} ctx={ctx} />;
      break;
    default:
      throw new Error(`Unknown email kind: ${kind}`);
  }

  const html = await render(element);
  const text = buildPlainText(kind, greeting, ctx, extra);
  return { html, text };
}

export async function renderInternalTrainingSignupEmail(params: {
  attendeeEmail: string;
  attendeeName: string | null;
  sessionTitle: string;
  status: "registered" | "waitlisted";
  location: string;
  portalSessionUrl: string;
  scheduleLines: string[];
  enrollmentBlock: string;
}): Promise<{ html: string; text: string }> {
  const preview = `Training: ${params.status === "registered" ? "New signup" : "Waitlist"} — ${params.sessionTitle}`;
  const nameDisplay = params.attendeeName ? ` (${params.attendeeName})` : "";
  const title = params.status === "registered" ? "New class signup" : "New waitlist signup";
  const headingLead =
    params.status === "registered"
      ? "A customer signed up for this class."
      : "A customer joined the waitlist for this class.";
  const detailLines = params.enrollmentBlock
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const html = await render(
    <TrainingEmailLayout preview={preview}>
      <Text style={emailStyles.greeting}>{title}</Text>
      <Text style={emailStyles.lead}>
        {headingLead}
        <br />
        Account (login): {params.attendeeEmail}
        {nameDisplay}
      </Text>
      <ClassInfoBox
        title={params.sessionTitle}
        scheduleLines={params.scheduleLines}
        location={params.location}
        ctaUrl={params.portalSessionUrl}
      />
      <div
        style={{
          marginTop: "16px",
          fontSize: "14px",
          lineHeight: "22px",
          color: "#3f3f46",
        }}
      >
        {detailLines.map((line, idx) => {
          const separatorIdx = line.indexOf(":");
          const possibleLabel = separatorIdx > 0 ? line.slice(0, separatorIdx) : "";
          const isLabeledPair = separatorIdx > 0 && !/\d/.test(possibleLabel);
          if (isLabeledPair) {
            const label = possibleLabel;
            const value = line.slice(separatorIdx + 1).trim();
            return (
              <Text key={`${idx}-${label}`} style={{ margin: "0 0 10px" }}>
                <strong style={{ color: "#18181b" }}>{label}:</strong>{" "}
                {value ? <span>{value}</span> : null}
              </Text>
            );
          }
          return (
            <Text key={`${idx}-plain`} style={{ margin: "0 0 10px", color: "#3f3f46" }}>
              {line}
            </Text>
          );
        })}
      </div>
    </TrainingEmailLayout>
  );

  const text = `
${title}

Account (login): ${params.attendeeEmail}${nameDisplay}
Class: ${params.sessionTitle}
${params.scheduleLines.join("\n")}
Location: ${params.location || "TBA"}
View details: ${params.portalSessionUrl}

${params.enrollmentBlock}
`.trim();

  return { html, text };
}

// ─── Plain-text fallback ──────────────────────────────────────────────────────

import { trainingSignupDisclaimerEmailBlock } from "@/lib/training-signup-disclaimers";

function buildPlainText(
  kind: TrainingEmailKind,
  greeting: string,
  ctx: TrainingSessionEmailContext,
  extra?: { waitlistPosition?: number; oldSummary?: string; newSummary?: string }
): string {
  const schedule = formatTrainingScheduleEmailBlock(ctx.days, ctx.timezone);
  const block = `Class: ${ctx.sessionTitle}\n${schedule}\n\nLocation: ${ctx.location || "TBA"}\n\nView details: ${ctx.portalSessionUrl}`;
  const disclaimers = trainingSignupDisclaimerEmailBlock();

  switch (kind) {
    case "registration_confirmed":
      return `${greeting}\n\nYou've signed up for this class. Your OMNI representative will follow up as needed.\n\n${block}\n\n${disclaimers}\n\nWe look forward to seeing you.`;
    case "waitlist_joined": {
      let body = `${greeting}\n\nYou're on the waitlist for this class:\n\n${block}\n\n`;
      if (extra?.waitlistPosition != null) body += `Your position: #${extra.waitlistPosition}\n\n`;
      return body + `${disclaimers}\n\nIf a seat opens, we'll email you.`;
    }
    case "promoted_from_waitlist":
      return `${greeting}\n\nGood news — a seat opened and your signup is confirmed:\n\n${block}\n\n${disclaimers}`;
    case "registration_cancelled_self":
      return `${greeting}\n\nYou've cancelled your signup for:\n\n${block}`;
    case "removed_by_admin":
      return `${greeting}\n\nYou're no longer signed up or on the waitlist for this class:\n\n${block}\n\nIf this was unexpected, contact your OMNI representative.`;
    case "session_cancelled":
      return `${greeting}\n\nThis scheduled class has been cancelled:\n\n${block}\n\nWe're sorry for the inconvenience. For questions, reply to this email or contact support.`;
    case "session_updated": {
      let body = `${greeting}\n\nThe details for this class have changed.\n\n${block}\n\n`;
      if (extra?.oldSummary && extra?.newSummary)
        body += `Previous:\n${extra.oldSummary}\n\nUpdated:\n${extra.newSummary}\n`;
      return body;
    }
    case "reminder_7d":
      return `${greeting}\n\nJust a friendly reminder about your upcoming class:\n\n${block}`;
    case "reminder_1d":
      return `${greeting}\n\nYour class is tomorrow:\n\n${block}`;
    default:
      return `${greeting}\n\n${block}`;
  }
}
