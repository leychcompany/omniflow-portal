import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { DEFAULT_TRAINING_TIMEZONE } from "@/lib/training-timezones";
import { countRegistrations, getSessionDisplayTitle } from "@/lib/training-session-queries";

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

    const sessions = await Promise.all(
      (rows ?? []).map(async (row) => {
        const counts = await countRegistrations(row.id as string);
        const displayTitle = await getSessionDisplayTitle(row as Parameters<typeof getSessionDisplayTitle>[0]);
        return {
          ...row,
          display_title: displayTitle,
          registered_count: counts.registered,
          waitlisted_count: counts.waitlisted,
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
      starts_at,
      ends_at = null,
      timezone = DEFAULT_TRAINING_TIMEZONE,
      location = "",
      capacity,
      status = "draft",
      waitlist_enabled = true,
      registration_closes_at = null,
    } = body;

    if (!starts_at || typeof capacity !== "number" || capacity < 1) {
      return NextResponse.json({ error: "starts_at and positive capacity required" }, { status: 400 });
    }

    const allowed = ["draft", "open", "full", "closed", "cancelled"];
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("training_sessions")
      .insert({
        course_id: course_id || null,
        title: title || null,
        description,
        starts_at,
        ends_at,
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
    return NextResponse.json(data);
  } catch (e: unknown) {
    console.error("admin POST training session:", e);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
