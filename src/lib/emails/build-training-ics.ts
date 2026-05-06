/**
 * Build a standards-compliant iCalendar (.ics) attachment for a training
 * session. Times are converted from the class IANA timezone to UTC so that
 * every major email client / calendar (Gmail, Outlook web/desktop/mobile,
 * Apple Mail, etc.) can render the event in the recipient's local time
 * without requiring a VTIMEZONE block.
 *
 * Spec: RFC 5545 (iCalendar). METHOD:PUBLISH yields a universal
 * "Add to Calendar" affordance. METHOD:CANCEL is reserved for cancellations
 * (currently unused — kept for future use).
 */
import type { TrainingSessionDay } from "@/lib/format-training-session-schedule";

export type TrainingIcsContext = {
  sessionId: string;
  sessionTitle: string;
  days: ReadonlyArray<TrainingSessionDay>;
  timezone: string;
  location: string;
  portalSessionUrl: string;
};

export type IcsKind = "publish" | "cancel";

const PRODID = "-//Omni Flow Computers//Training//EN";

export const ICS_CONTENT_TYPE = "text/calendar; method=PUBLISH; charset=UTF-8";
export const ICS_FILENAME = "training.ics";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Returns the offset (minutes) that `timeZone` has at the given UTC instant. */
function getTimeZoneOffsetMinutes(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) if (p.type !== "literal") map[p.type] = p.value;
  const hour = Number(map.hour) === 24 ? 0 : Number(map.hour);
  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    hour,
    Number(map.minute),
    Number(map.second)
  );
  return (asUTC - date.getTime()) / 60000;
}

/** Convert a wall-clock (Y, M, D, hh, mm) in `timeZone` to a UTC instant. */
function wallTimeToUtc(
  y: number,
  m: number,
  d: number,
  hh: number,
  mm: number,
  timeZone: string
): Date {
  // First approximation: pretend wall time is UTC, see what offset the tz had
  // at that moment, subtract it. Re-check against the resulting instant in
  // case we crossed a DST boundary, and re-correct once.
  const tNaive = Date.UTC(y, m - 1, d, hh, mm, 0);
  const off1 = getTimeZoneOffsetMinutes(new Date(tNaive), timeZone);
  let t = tNaive - off1 * 60000;
  const off2 = getTimeZoneOffsetMinutes(new Date(t), timeZone);
  if (off2 !== off1) t = tNaive - off2 * 60000;
  return new Date(t);
}

function formatUtcStamp(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}` +
    `T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`
  );
}

/** Escape per RFC 5545 §3.3.11 for TEXT property values. */
function escapeText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/** Fold long lines per RFC 5545 §3.1: lines > 75 octets continue with CRLF + space. */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  parts.push(line.slice(0, 75));
  let rest = line.slice(75);
  while (rest.length > 0) {
    parts.push(" " + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  return parts.join("\r\n");
}

function parseDay(day: TrainingSessionDay): { y: number; m: number; d: number } {
  const [yStr = "1970", mStr = "1", dStr = "1"] = day.day_date.split("-");
  return {
    y: Number.parseInt(yStr, 10) || 1970,
    m: Number.parseInt(mStr, 10) || 1,
    d: Number.parseInt(dStr, 10) || 1,
  };
}

function parseHM(time: string): { h: number; m: number } {
  const [hStr = "0", mStr = "0"] = time.split(":");
  return {
    h: Number.parseInt(hStr, 10) || 0,
    m: Number.parseInt(mStr, 10) || 0,
  };
}

function uidFor(sessionId: string, dayDate: string, position: number): string {
  return `training-${sessionId}-${dayDate}-${position}@omniflow`;
}

/**
 * Build an iCalendar string with one VEVENT per session day. Returns null
 * when there are no days to publish (e.g. schedule TBA).
 */
export function buildTrainingIcs(
  ctx: TrainingIcsContext,
  kind: IcsKind = "publish"
): { filename: string; content: string; contentType: string } | null {
  if (!ctx.days || ctx.days.length === 0) return null;

  const method = kind === "cancel" ? "CANCEL" : "PUBLISH";
  const status = kind === "cancel" ? "CANCELLED" : "CONFIRMED";
  const sequence = kind === "cancel" ? 1 : 0;
  const dtstamp = formatUtcStamp(new Date());

  const sorted = [...ctx.days].sort((a, b) => {
    if (a.day_date < b.day_date) return -1;
    if (a.day_date > b.day_date) return 1;
    return (a.position ?? 0) - (b.position ?? 0);
  });

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${PRODID}`,
    "CALSCALE:GREGORIAN",
    `METHOD:${method}`,
  ];

  for (const day of sorted) {
    const { y, m, d } = parseDay(day);
    const { h: sh, m: sm } = parseHM(day.start_time);
    const { h: eh, m: em } = parseHM(day.end_time);
    const startUtc = wallTimeToUtc(y, m, d, sh, sm, ctx.timezone);
    const endUtc = wallTimeToUtc(y, m, d, eh, em, ctx.timezone);

    const summary = day.label?.trim()
      ? `${ctx.sessionTitle} — ${day.label.trim()}`
      : ctx.sessionTitle;
    const description = `Training class.\nSession details: ${ctx.portalSessionUrl}`;

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uidFor(ctx.sessionId, day.day_date, day.position ?? 0)}`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART:${formatUtcStamp(startUtc)}`);
    lines.push(`DTEND:${formatUtcStamp(endUtc)}`);
    lines.push(`SUMMARY:${escapeText(summary)}`);
    if (ctx.location && ctx.location.trim()) {
      lines.push(`LOCATION:${escapeText(ctx.location.trim())}`);
    }
    lines.push(`DESCRIPTION:${escapeText(description)}`);
    lines.push(`URL:${ctx.portalSessionUrl}`);
    lines.push(`STATUS:${status}`);
    lines.push(`SEQUENCE:${sequence}`);
    lines.push("TRANSP:OPAQUE");
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  const folded = lines.map(foldLine).join("\r\n") + "\r\n";

  return {
    filename: ICS_FILENAME,
    content: folded,
    contentType: kind === "cancel"
      ? "text/calendar; method=CANCEL; charset=UTF-8"
      : ICS_CONTENT_TYPE,
  };
}
