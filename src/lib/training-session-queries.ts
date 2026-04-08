import { supabaseAdmin } from "@/lib/supabase-admin";

export interface TrainingSessionRow {
  id: string;
  course_id: string | null;
  title: string | null;
  description: string | null;
  instructor?: string | null;
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
