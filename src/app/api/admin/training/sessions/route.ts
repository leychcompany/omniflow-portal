import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { DEFAULT_TRAINING_TIMEZONE } from "@/lib/training-timezones";
import {
  countRegistrations,
  getSessionDisplayTitle,
  loadTrainingSessionDays,
  loadTrainingSessionDaysMap,
} from "@/lib/training-session-queries";
import {
  parseTrainingSessionDaysInput,
  type ValidatedTrainingSessionDay,
} from "@/lib/training-session-days-input";

export async function GET(req: NextRequest) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const upcoming = searchParams.get("upcoming") === "1";

    let q = supabaseAdmin.from("training_sessions").select("*").order("starts_at", { ascending: false });
    if (upcoming) {
      q = q.gte("starts_at", new Date().toISOString());
    }

    const { data: rows, error } = await q;
    if (error) throw error;

    const ids = (rows ?? []).map((r) => r.id as string);
    const daysMap = await loadTrainingSessionDaysMap(ids);

    const sessions = await Promise.all(
      (rows ?? []).map(async (row) => {
        const counts = await countRegistrations(row.id as string);
        const displayTitle = await getSessionDisplayTitle(row as Parameters<typeof getSessionDisplayTitle>[0]);
        return {
          ...row,
          display_title: displayTitle,
          registered_count: counts.registered,
          waitlisted_count: counts.waitlisted,
          days: daysMap.get(row.id as string) ?? [],
        };
      })
    );

    return NextResponse.json(sessions);
  } catch (e: unknown) {
    console.error("admin GET training sessions:", e);
    return NextResponse.json({ error: "Failed to list sessions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const {
      course_id = null,
      title = null,
      description = null,
      timezone = DEFAULT_TRAINING_TIMEZONE,
      location = "",
      capacity,
      status = "draft",
      waitlist_enabled = true,
      registration_closes_at = null,
      days,
    } = body;

    if (typeof capacity !== "number" || capacity < 1) {
      return NextResponse.json({ error: "Positive capacity required" }, { status: 400 });
    }

    const allowed = ["draft", "open", "full", "closed", "cancelled"];
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    let validatedDays: ValidatedTrainingSessionDay[];
    try {
      validatedDays = parseTrainingSessionDaysInput(days);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Invalid days" },
        { status: 400 }
      );
    }

    const insertWindow = computeWindowFromDays(validatedDays, timezone);

    const { data: created, error } = await supabaseAdmin
      .from("training_sessions")
      .insert({
        course_id: course_id || null,
        title: title || null,
        description,
        starts_at: insertWindow.starts_at,
        ends_at: insertWindow.ends_at,
        timezone,
        location: location ?? "",
        capacity,
        status,
        waitlist_enabled,
        registration_closes_at,
      })
      .select()
      .single();

    if (error) throw error;

    const dayRows = validatedDays.map((d, idx) => ({
      session_id: created.id as string,
      position: idx,
      day_date: d.day_date,
      start_time: d.start_time,
      end_time: d.end_time,
      label: d.label,
    }));

    const { error: daysErr } = await supabaseAdmin
      .from("training_session_days")
      .insert(dayRows);
    if (daysErr) {
      // Roll back the parent row so we never leave a class with no schedule.
      await supabaseAdmin.from("training_sessions").delete().eq("id", created.id);
      throw daysErr;
    }

    const { data: refreshed } = await supabaseAdmin
      .from("training_sessions")
      .select("*")
      .eq("id", created.id)
      .single();

    const days_out = await loadTrainingSessionDays(created.id as string);

    return NextResponse.json({ ...(refreshed ?? created), days: days_out });
  } catch (e: unknown) {
    console.error("admin POST training session:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create session" },
      { status: 500 }
    );
  }
}

/**
 * Compute initial starts_at / ends_at for the INSERT in the API timezone,
 * because the row is created before any training_session_days rows exist
 * and the sync trigger hasn't run yet. The trigger will recompute these
 * to identical values as soon as the days are inserted.
 */
function computeWindowFromDays(
  days: ReadonlyArray<ValidatedTrainingSessionDay>,
  timezone: string
): { starts_at: string; ends_at: string } {
  const sorted = [...days].sort((a, b) => {
    if (a.day_date < b.day_date) return -1;
    if (a.day_date > b.day_date) return 1;
    return 0;
  });
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const starts_at = isoFromZonedLocal(first.day_date, first.start_time, timezone);
  const ends_at = isoFromZonedLocal(last.day_date, last.end_time, timezone);
  return { starts_at, ends_at };
}

/**
 * Convert "YYYY-MM-DD" + "HH:MM[:SS]" interpreted in `timezone` to a UTC ISO string.
 * Iteratively probes the offset using Intl.DateTimeFormat so we don't need an
 * external timezone library.
 */
function isoFromZonedLocal(dateStr: string, timeStr: string, timezone: string): string {
  const [y, m, d] = dateStr.split("-").map((s) => parseInt(s, 10));
  const [hh = "0", mm = "0"] = timeStr.split(":");
  const hour = parseInt(hh, 10) || 0;
  const minute = parseInt(mm, 10) || 0;

  // Initial guess: treat the wall-clock as if it were UTC.
  let utcMs = Date.UTC(y, m - 1, d, hour, minute, 0);
  for (let i = 0; i < 3; i++) {
    const offsetMs = zoneOffsetMs(utcMs, timezone);
    const correctedMs = Date.UTC(y, m - 1, d, hour, minute, 0) - offsetMs;
    if (correctedMs === utcMs) break;
    utcMs = correctedMs;
  }
  return new Date(utcMs).toISOString();
}

function zoneOffsetMs(utcMs: number, timezone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(new Date(utcMs));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);
  const hour = get("hour");
  const localUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    hour === 24 ? 0 : hour,
    get("minute"),
    get("second")
  );
  return localUtc - utcMs;
}
