/** IANA zones stored on `training_sessions.timezone`. Default matches DB/API default. */
export const DEFAULT_TRAINING_TIMEZONE = "America/Chicago";

/** Short list for admin class forms (US-centric + UTC). */
export const TRAINING_TIMEZONE_OPTIONS: readonly { value: string; label: string }[] = [
  { value: "America/Chicago", label: "Central Time" },
  { value: "America/New_York", label: "Eastern Time" },
  { value: "America/Denver", label: "Mountain Time" },
  { value: "America/Phoenix", label: "Arizona (no DST)" },
  { value: "America/Los_Angeles", label: "Pacific Time" },
  { value: "America/Anchorage", label: "Alaska Time" },
  { value: "Pacific/Honolulu", label: "Hawaii Time" },
  { value: "UTC", label: "UTC" },
];

export function trainingTimezoneLabel(iana: string): string {
  const o = TRAINING_TIMEZONE_OPTIONS.find((x) => x.value === iana);
  return o?.label ?? iana;
}

export function trainingTimezoneSelectOptions(
  currentTimezone: string | undefined
): { value: string; label: string }[] {
  const list = TRAINING_TIMEZONE_OPTIONS.map((o) => ({ ...o }));
  const cur = (currentTimezone ?? "").trim();
  if (cur && !list.some((o) => o.value === cur)) {
    list.push({ value: cur, label: cur });
  }
  return list;
}
