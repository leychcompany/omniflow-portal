import { TRAINING_TIMEZONE_OPTIONS } from "@/lib/training-timezones";

export function trainingTimezoneLabel(iana: string): string {
  const o = TRAINING_TIMEZONE_OPTIONS.find((x) => x.value === iana);
  return o?.label ?? iana;
}

function sameCalendarDayInZone(startMs: number, endMs: number, timeZone: string): boolean {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date(startMs)) === fmt.format(new Date(endMs));
}

const DISPLAY_OPTS: Intl.DateTimeFormatOptions = {
  dateStyle: "full",
  timeStyle: "short",
};

/**
 * Formats a single instant in the session timezone (locale-aware when `locale` is omitted).
 */
export function formatTrainingSessionInstant(
  iso: string,
  timeZone: string,
  locale?: Intl.LocalesArgument
): string {
  return new Date(iso).toLocaleString(locale, {
    ...DISPLAY_OPTS,
    timeZone,
  });
}

function formatTrainingSessionTimeOnly(
  iso: string,
  timeZone: string,
  locale?: Intl.LocalesArgument
): string {
  return new Date(iso).toLocaleString(locale, {
    timeStyle: "short",
    timeZone,
  });
}

export type TrainingScheduleParts = {
  /** Full wording for the start instant */
  startDisplay: string;
  /** End time/datetime, or null if no end */
  endDisplay: string | null;
  /** e.g. "Times in Central Time" */
  timezoneNote: string;
};

/**
 * User-friendly start/end lines in the class timezone. When end falls on the same calendar
 * day as start (in that zone), the end is shown as time only.
 */
export function formatTrainingScheduleParts(
  startsAtIso: string,
  endsAtIso: string | null | undefined,
  timeZone: string,
  locale?: Intl.LocalesArgument
): TrainingScheduleParts {
  const timezoneNote = `Times in ${trainingTimezoneLabel(timeZone)}`;
  const startDisplay = formatTrainingSessionInstant(startsAtIso, timeZone, locale);

  const rawEnd = endsAtIso?.trim();
  if (!rawEnd) {
    return { startDisplay, endDisplay: null, timezoneNote };
  }
  const endMs = new Date(rawEnd).getTime();
  if (Number.isNaN(endMs)) {
    return { startDisplay, endDisplay: null, timezoneNote };
  }

  const startMs = new Date(startsAtIso).getTime();
  const endDisplay = sameCalendarDayInZone(startMs, endMs, timeZone)
    ? formatTrainingSessionTimeOnly(rawEnd, timeZone, locale)
    : formatTrainingSessionInstant(rawEnd, timeZone, locale);

  return { startDisplay, endDisplay, timezoneNote };
}

/** Plain-text block for emails (en-US for consistent copy). */
export function formatTrainingScheduleEmailBlock(
  startsAtIso: string,
  endsAtIso: string | null | undefined,
  timeZone: string
): string {
  const { startDisplay, endDisplay, timezoneNote } = formatTrainingScheduleParts(
    startsAtIso,
    endsAtIso,
    timeZone,
    "en-US"
  );
  let block = `Starts: ${startDisplay}\n`;
  if (endDisplay) block += `Ends: ${endDisplay}\n`;
  block += timezoneNote;
  return block;
}

/** One-line summary for schedule / course cards */
export function formatTrainingSessionListSummary(
  startsAtIso: string,
  endsAtIso: string | null | undefined,
  timeZone: string,
  locale?: Intl.LocalesArgument
): string {
  const start = new Date(startsAtIso);
  const rawEnd = endsAtIso?.trim();
  if (!rawEnd) {
    return start.toLocaleString(locale, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone,
    });
  }
  const end = new Date(rawEnd);
  if (Number.isNaN(end.getTime())) {
    return start.toLocaleString(locale, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone,
    });
  }
  if (sameCalendarDayInZone(start.getTime(), end.getTime(), timeZone)) {
    const datePart = start.toLocaleString(locale, { dateStyle: "medium", timeZone });
    const t1 = formatTrainingSessionTimeOnly(startsAtIso, timeZone, locale);
    const t2 = formatTrainingSessionTimeOnly(rawEnd, timeZone, locale);
    return `${datePart} · ${t1} – ${t2}`;
  }
  const a = start.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short", timeZone });
  const b = end.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short", timeZone });
  return `${a} – ${b}`;
}

/** Admin email “previous / updated” summary (session update notifications). */
export function formatTrainingSessionChangeSummary(
  startsAtIso: string,
  endsAtIso: string | null | undefined,
  timeZone: string,
  location: string
): string {
  const schedule = formatTrainingScheduleEmailBlock(startsAtIso, endsAtIso, timeZone);
  return `${schedule}\nLocation: ${location || "TBA"}`;
}
