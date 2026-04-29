import { supabaseAdmin } from "@/lib/supabase-admin";
import type { TrainingSessionDay } from "@/lib/format-training-session-schedule";

export interface TrainingSessionRow {
  id: string;
  course_id: string | null;
  title: string | null;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  location: string;
  capacity: number;
  status: string;
  waitlist_enabled: boolean;
  registration_closes_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Load the per-day schedule for a class, ordered by day then position.
 * Returns [] when the row hasn't been backfilled yet (e.g. fresh insert
 * before the days have been written) so callers can fall back gracefully.
 */
export async function loadTrainingSessionDays(
  sessionId: string
): Promise<TrainingSessionDay[]> {
  const { data, error } = await supabaseAdmin
    .from("training_session_days")
    .select("position, day_date, start_time, end_time, label")
    .eq("session_id", sessionId)
    .order("day_date", { ascending: true })
    .order("position", { ascending: true });
  if (error) {
    console.error("loadTrainingSessionDays:", error);
    return [];
  }
  return (data ?? []).map((row) => ({
    position: Number(row.position ?? 0),
    day_date: String(row.day_date),
    start_time: String(row.start_time),
    end_time: String(row.end_time),
    label: (row.label as string | null) ?? null,
  }));
}

/**
 * Load days for a batch of session ids in a single query (used by list endpoints).
 */
export async function loadTrainingSessionDaysMap(
  sessionIds: ReadonlyArray<string>
): Promise<Map<string, TrainingSessionDay[]>> {
  const out = new Map<string, TrainingSessionDay[]>();
  if (sessionIds.length === 0) return out;
  const { data, error } = await supabaseAdmin
    .from("training_session_days")
    .select("session_id, position, day_date, start_time, end_time, label")
    .in("session_id", [...sessionIds])
    .order("day_date", { ascending: true })
    .order("position", { ascending: true });
  if (error) {
    console.error("loadTrainingSessionDaysMap:", error);
    return out;
  }
  for (const row of data ?? []) {
    const id = String(row.session_id);
    if (!out.has(id)) out.set(id, []);
    out.get(id)!.push({
      position: Number(row.position ?? 0),
      day_date: String(row.day_date),
      start_time: String(row.start_time),
      end_time: String(row.end_time),
      label: (row.label as string | null) ?? null,
    });
  }
  return out;
}

/** Display title: session title or linked course title */
export async function getSessionDisplayTitle(session: TrainingSessionRow): Promise<string> {
  if (session.title?.trim()) return session.title.trim();
  if (session.course_id) {
    const { data } = await supabaseAdmin.from("courses").select("title").eq("id", session.course_id).maybeSingle();
    if (data?.title) return data.title as string;
  }
  return "Training class";
}

export async function countRegistrations(sessionId: string): Promise<{ registered: number; waitlisted: number }> {
  const { count: registered } = await supabaseAdmin
    .from("training_registrations")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("status", "registered");

  const { count: waitlisted } = await supabaseAdmin
    .from("training_registrations")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("status", "waitlisted");

  return {
    registered: registered ?? 0,
    waitlisted: waitlisted ?? 0,
  };
}

export async function loadUserNotifyFields(userId: string): Promise<{ email: string; name: string | null }> {
  const { data } = await supabaseAdmin
    .from("users")
    .select("email, name, first_name, last_name")
    .eq("id", userId)
    .maybeSingle();
  if (!data?.email) return { email: "", name: null };
  const name =
    (data.name as string) ||
    [data.first_name, data.last_name].filter(Boolean).join(" ").trim() ||
    null;
  return { email: data.email as string, name };
}
