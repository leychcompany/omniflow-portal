import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { countRegistrations, getSessionDisplayTitle } from "@/lib/training-session-queries";

/** Public list: upcoming sessions (excludes draft). Full / closed / cancelled still listed for visibility. */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("course_id");
    const now = new Date().toISOString();

    let query = supabaseAdmin
      .from("training_sessions")
      .select("*")
      .gte("starts_at", now)
      .in("status", ["open", "full", "closed", "cancelled"])
      .order("starts_at", { ascending: true });

    if (courseId) query = query.eq("course_id", courseId);

    const { data: rows, error } = await query;
    if (error) throw error;

    const nowMs = Date.now();
    const upcomingRows = (rows ?? []).filter((row) => {
      const status = String(row.status ?? "");
      if (["cancelled", "closed", "full"].includes(status)) return true;
      const closes = row.registration_closes_at as string | null;
      if (!closes) return true;
      return new Date(closes).getTime() > nowMs;
    });

    const sessions = await Promise.all(
      upcomingRows.map(async (row) => {
        const counts = await countRegistrations(row.id as string);
        const displayTitle = await getSessionDisplayTitle(row as Parameters<typeof getSessionDisplayTitle>[0]);
        return {
          id: row.id,
          course_id: row.course_id,
          title: displayTitle,
          description: row.description,
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
        };
      })
    );

    return NextResponse.json(sessions);
  } catch (e: unknown) {
    console.error("GET /api/training/sessions:", e);
    return NextResponse.json({ error: "Failed to list sessions" }, { status: 500 });
  }
}
