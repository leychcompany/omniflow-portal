import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getOptionalUserId } from "@/lib/verify-auth";
import { countRegistrations, getSessionDisplayTitle } from "@/lib/training-session-queries";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await getOptionalUserId(req);

    const { data: row, error } = await supabaseAdmin.from("training_sessions").select("*").eq("id", id).single();
    if (error || !row) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (["draft", "cancelled", "closed"].includes(row.status as string)) {
      return NextResponse.json({ error: "Session not available" }, { status: 404 });
    }

    const closes = row.registration_closes_at as string | null;
    if (closes && new Date(closes).getTime() <= Date.now()) {
      return NextResponse.json({ error: "Registration closed" }, { status: 404 });
    }

    const counts = await countRegistrations(id);
    const displayTitle = await getSessionDisplayTitle(row as Parameters<typeof getSessionDisplayTitle>[0]);

    let myRegistration: { status: string; id: string } | null = null;
    if (userId) {
      const { data: mine } = await supabaseAdmin
        .from("training_registrations")
        .select("id, status")
        .eq("session_id", id)
        .eq("user_id", userId)
        .in("status", ["registered", "waitlisted"])
        .maybeSingle();
      if (mine) myRegistration = { id: mine.id as string, status: mine.status as string };
    }

    return NextResponse.json({
      id: row.id,
      course_id: row.course_id,
      title: displayTitle,
      description: row.description,
      instructor: row.instructor ?? null,
      starts_at: row.starts_at,
      ends_at: row.ends_at,
      timezone: row.timezone,
      location: row.location,
      capacity: row.capacity,
      status: row.status,
      waitlist_enabled: row.waitlist_enabled,
      registration_closes_at: row.registration_closes_at,
      registered_count: counts.registered,
      waitlisted_count: counts.waitlisted,
      spots_remaining: Math.max(0, (row.capacity as number) - counts.registered),
      my_registration: myRegistration,
    });
  } catch (e: unknown) {
    console.error("GET /api/training/sessions/[id]:", e);
    return NextResponse.json({ error: "Failed to load session" }, { status: 500 });
  }
}
