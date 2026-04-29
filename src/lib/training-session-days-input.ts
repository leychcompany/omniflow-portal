/**
 * Validation for `days[]` payloads coming from the admin form into the API.
 * Times and dates are stored exactly as authored (in the class timezone) — we
 * do not perform any timezone math here. Throws Error with a user-readable
 * message; the API translates it into a 400.
 */

export type ValidatedTrainingSessionDay = {
  day_date: string;
  start_time: string;
  end_time: string;
  label: string | null;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{1,2}:\d{2}(?::\d{2})?$/;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function normaliseTime(value: string): string {
  if (!TIME_RE.test(value)) {
    throw new Error(`Invalid time "${value}" (use HH:MM)`);
  }
  const [hh, mm] = value.split(":");
  const hour = parseInt(hh, 10);
  const minute = parseInt(mm, 10);
  if (Number.isNaN(hour) || Number.isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error(`Invalid time "${value}"`);
  }
  return `${pad2(hour)}:${pad2(minute)}:00`;
}

function compareTime(a: string, b: string): number {
  return a.localeCompare(b);
}

export function parseTrainingSessionDaysInput(input: unknown): ValidatedTrainingSessionDay[] {
  if (!Array.isArray(input) || input.length === 0) {
    throw new Error("Add at least one class day.");
  }
  if (input.length > 30) {
    throw new Error("A class can have at most 30 days.");
  }

  const out: ValidatedTrainingSessionDay[] = [];
  const seenDates = new Set<string>();

  for (const raw of input) {
    if (!raw || typeof raw !== "object") {
      throw new Error("Each day must include a date and time range.");
    }
    const obj = raw as Record<string, unknown>;
    const day_date = String(obj.day_date ?? "").trim();
    const start_time_raw = String(obj.start_time ?? "").trim();
    const end_time_raw = String(obj.end_time ?? "").trim();
    const label_raw = obj.label == null ? null : String(obj.label).trim();

    if (!DATE_RE.test(day_date)) {
      throw new Error("Each day needs a valid date.");
    }
    if (!start_time_raw || !end_time_raw) {
      throw new Error("Each day needs a start and end time.");
    }

    const start_time = normaliseTime(start_time_raw);
    const end_time = normaliseTime(end_time_raw);

    if (compareTime(end_time, start_time) <= 0) {
      throw new Error(`End time must be after start time on ${day_date}.`);
    }
    if (seenDates.has(day_date)) {
      throw new Error(`Duplicate date ${day_date} — combine those entries.`);
    }
    seenDates.add(day_date);

    out.push({
      day_date,
      start_time,
      end_time,
      label: label_raw && label_raw.length > 0 ? label_raw.slice(0, 200) : null,
    });
  }

  out.sort((a, b) => (a.day_date < b.day_date ? -1 : a.day_date > b.day_date ? 1 : 0));
  return out;
}
