/**
 * Single source of truth for rendering a training class schedule (admin form
 * preview, portal screens, and emails). All times are displayed in the
 * **class timezone**, never converted to the viewer's local time, so
 * "10:00 AM (CST)" appears identically everywhere.
 */

export type TrainingSessionDay = {
  /** ordering hint within a session */
  position: number;
  /** YYYY-MM-DD, in the class timezone */
  day_date: string;
  /** HH:MM or HH:MM:SS, in the class timezone */
  start_time: string;
  /** HH:MM or HH:MM:SS, in the class timezone */
  end_time: string;
  label?: string | null;
};

export type TrainingSessionScheduleSummary = {
  /** True when every day has the same start_time and end_time (so we can collapse to "each day"). */
  uniform: boolean;
  /** Combined date span when `uniform` is true. e.g. "Tuesday, August 25 – Thursday, August 27, 2026" */
  dates: string | null;
  /** Daily time when `uniform` is true. e.g. "9:00 AM – 3:00 PM (CDT) each day" */
  time: string | null;
  /** Per-day lines (always populated, used directly when `uniform` is false). */
  perDay: Array<{
    date: string;
    time: string;
    label: string | null;
  }>;
};

const DEFAULT_LOCALE: Intl.LocalesArgument = "en-US";

function parseTime(time: string): { hour: number; minute: number } {
  const [hStr = "0", mStr = "0"] = time.split(":");
  const hour = Number.parseInt(hStr, 10) || 0;
  const minute = Number.parseInt(mStr, 10) || 0;
  return { hour, minute };
}

function timesEqual(a: string, b: string): boolean {
  const pa = parseTime(a);
  const pb = parseTime(b);
  return pa.hour === pb.hour && pa.minute === pb.minute;
}

function parseDateString(dateStr: string): { y: number; m: number; d: number } {
  const [y, m, d] = dateStr.split("-").map((s) => Number.parseInt(s, 10));
  return { y, m, d };
}

/** Format "YYYY-MM-DD" as "Tuesday, August 25, 2026" without DST/timezone math. */
function formatDateLong(dateStr: string, locale: Intl.LocalesArgument): string {
  const { y, m, d } = parseDateString(dateStr);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return dt.toLocaleString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** "Tuesday, August 25" (no year) — used inside an X – Y, YYYY range. */
function formatDateLongNoYear(dateStr: string, locale: Intl.LocalesArgument): string {
  const { y, m, d } = parseDateString(dateStr);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return dt.toLocaleString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** "10:00 AM" — locale-aware time-of-day with no timezone math. */
function formatTimeOfDay(time: string, locale: Intl.LocalesArgument): string {
  const { hour, minute } = parseTime(time);
  const dt = new Date(Date.UTC(2000, 0, 1, hour, minute, 0));
  return dt.toLocaleString(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
}

/** Short timezone abbreviation for a calendar day in `tz`, e.g. "CDT" / "CST". */
function tzAbbreviationFor(dateStr: string, tz: string, locale: Intl.LocalesArgument): string {
  const { y, m, d } = parseDateString(dateStr);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone: tz,
    timeZoneName: "short",
  }).formatToParts(dt);
  return parts.find((p) => p.type === "timeZoneName")?.value ?? "local";
}

function dateSpanLabel(
  firstDate: string,
  lastDate: string,
  locale: Intl.LocalesArgument
): string {
  if (firstDate === lastDate) return formatDateLong(firstDate, locale);
  const first = parseDateString(firstDate);
  const last = parseDateString(lastDate);
  if (first.y !== last.y) {
    return `${formatDateLong(firstDate, locale)} – ${formatDateLong(lastDate, locale)}`;
  }
  return `${formatDateLongNoYear(firstDate, locale)} – ${formatDateLong(lastDate, locale)}`;
}

function timeRangeLabel(
  startTime: string,
  endTime: string,
  abbrev: string,
  locale: Intl.LocalesArgument
): string {
  return `${formatTimeOfDay(startTime, locale)} – ${formatTimeOfDay(endTime, locale)} (${abbrev})`;
}

function sortDays(days: ReadonlyArray<TrainingSessionDay>): TrainingSessionDay[] {
  return [...days].sort((a, b) => {
    if (a.day_date < b.day_date) return -1;
    if (a.day_date > b.day_date) return 1;
    return (a.position ?? 0) - (b.position ?? 0);
  });
}

/**
 * Build a summary that's safe to render anywhere. Always returns `perDay`,
 * and when every day shares the same hours also returns collapsed
 * `dates` / `time` strings.
 */
export function formatTrainingSessionSchedule(
  days: ReadonlyArray<TrainingSessionDay>,
  timezone: string,
  locale: Intl.LocalesArgument = DEFAULT_LOCALE
): TrainingSessionScheduleSummary {
  if (!days || days.length === 0) {
    return { uniform: true, dates: null, time: null, perDay: [] };
  }

  const sorted = sortDays(days);

  const perDay = sorted.map((d) => {
    const abbrev = tzAbbreviationFor(d.day_date, timezone, locale);
    return {
      date: formatDateLong(d.day_date, locale),
      time: timeRangeLabel(d.start_time, d.end_time, abbrev, locale),
      label: d.label?.trim() ? d.label.trim() : null,
    };
  });

  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const uniform = sorted.every(
    (d) => timesEqual(d.start_time, first.start_time) && timesEqual(d.end_time, first.end_time)
  );

  if (!uniform) {
    return { uniform: false, dates: null, time: null, perDay };
  }

  const abbrev = tzAbbreviationFor(first.day_date, timezone, locale);
  const dates = dateSpanLabel(first.day_date, last.day_date, locale);
  const baseTime = timeRangeLabel(first.start_time, first.end_time, abbrev, locale);
  const time = sorted.length > 1 ? `${baseTime} each day` : baseTime;

  return { uniform: true, dates, time, perDay };
}

/**
 * Plain-text email block. en-US locale for consistent copy.
 *
 *   Dates: Tuesday, August 25 – Thursday, August 27, 2026
 *   Time: 9:00 AM – 3:00 PM (CDT) each day
 *
 * For non-uniform schedules:
 *
 *   Schedule:
 *     Tuesday, August 25, 2026 · 9:00 AM – 3:00 PM (CDT)
 *     Wednesday, August 26, 2026 · 9:00 AM – 12:00 PM (CDT) — Half day
 *     ...
 */
export function formatTrainingScheduleEmailBlock(
  days: ReadonlyArray<TrainingSessionDay>,
  timezone: string
): string {
  const sched = formatTrainingSessionSchedule(days, timezone, "en-US");
  if (sched.perDay.length === 0) {
    return "Schedule: TBA";
  }
  if (sched.uniform && sched.dates && sched.time) {
    return `Dates: ${sched.dates}\nTime: ${sched.time}`;
  }
  const lines = sched.perDay.map((d) => {
    const base = `  ${d.date} · ${d.time}`;
    return d.label ? `${base} — ${d.label}` : base;
  });
  return `Schedule:\n${lines.join("\n")}`;
}

/** One-line summary used in schedule and course list cards. */
export function formatTrainingSessionListSummary(
  days: ReadonlyArray<TrainingSessionDay>,
  timezone: string,
  locale?: Intl.LocalesArgument
): string {
  const sched = formatTrainingSessionSchedule(days, timezone, locale ?? DEFAULT_LOCALE);
  if (sched.perDay.length === 0) return "Schedule TBA";
  if (sched.uniform && sched.dates && sched.time) {
    return `${sched.dates} · ${sched.time}`;
  }
  const first = sched.perDay[0];
  const last = sched.perDay[sched.perDay.length - 1];
  return `${first.date} – ${last.date} · multiple times`;
}

/** "Previous" / "Updated" summary for admin schedule-change emails. */
export function formatTrainingSessionChangeSummary(
  days: ReadonlyArray<TrainingSessionDay>,
  timezone: string,
  location: string
): string {
  const schedule = formatTrainingScheduleEmailBlock(days, timezone);
  return `${schedule}\nLocation: ${location || "TBA"}`;
}

/**
 * Stable, locale-independent compare key for change detection (e.g. "did the
 * schedule change between PATCH old and new?"). Sorted by (day_date, position)
 * with normalised HH:MM:SS times.
 */
export function trainingScheduleChangeKey(
  days: ReadonlyArray<TrainingSessionDay>
): string {
  return sortDays(days)
    .map((d) => {
      const start = normaliseTime(d.start_time);
      const end = normaliseTime(d.end_time);
      const label = (d.label ?? "").trim();
      return `${d.day_date}|${start}|${end}|${label}`;
    })
    .join("\n");
}

function normaliseTime(time: string): string {
  const { hour, minute } = parseTime(time);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hour)}:${pad(minute)}:00`;
}
