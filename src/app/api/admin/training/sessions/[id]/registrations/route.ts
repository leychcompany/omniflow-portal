import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
import {
  buildSessionContext,
  notifyInternalTrainingSignup,
  notifyTrainingAttendee,
} from "@/lib/training-notify-email";
import { getSessionDisplayTitle, loadUserNotifyFields } from "@/lib/training-session-queries";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { id: sessionId } = await params;
    const { data: regs, error } = await supabaseAdmin
      .from("training_registrations")
      .select("*")
      .eq("session_id", sessionId)
      .in("status", ["registered", "waitlisted"])
      .order("status", { ascending: true })
      .order("waitlist_position", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: true });

    if (error) throw error;

    const userIds = [...new Set((regs ?? []).map((r) => r.user_id as string))];
    const userMap = new Map<string, { email: string; name: string | null }>();
    if (userIds.length) {
      const { data: users } = await supabaseAdmin
        .from("users")
        .select("id, email, name, first_name, last_name")
        .in("id", userIds);
      for (const u of users ?? []) {
        const name =
          (u.name as string) ||
          [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
          null;
        userMap.set(u.id as string, { email: u.email as string, name });
      }
    }

    const items = (regs ?? []).map((r) => ({
      ...r,
      user: userMap.get(r.user_id as string) ?? { email: "", name: null },
    }));

    return NextResponse.json({ items });
  } catch (e: unknown) {
    console.error("admin GET registrations:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/** Add an existing portal user (users row) to the roster or waitlist. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { id: sessionId } = await params;
    const body = await req.json();
    const userId = typeof body?.user_id === "string" ? body.user_id.trim() : "";
    if (!userId) {
      return NextResponse.json({ error: "user_id required" }, { status: 400 });
    }

    const { data: rows, error } = await supabaseAdmin.rpc("admin_add_user_to_training_session", {
      p_session_id: sessionId,
      p_user_id: userId,
    });

    if (error) {
      console.error("admin_add_user_to_training_session:", error);
      return NextResponse.json({ error: error.message || "Failed to add" }, { status: 500 });
    }

    const row = (Array.isArray(rows) ? rows[0] : rows) as Record<string, unknown> | undefined | null;
    const outError = row?.out_error as string | undefined | null;
    if (outError) {
      return NextResponse.json({ error: outError }, { status: 400 });
    }

    const regId = row?.out_registration_id as string | undefined | null;
    const regStatus = row?.out_status as string | undefined | null;
    const wlPos = row?.out_waitlist_position as number | null | undefined;

    if (!regId || !regStatus) {
      console.error("admin_add_user_to_training_session: missing out row", { rows, row });
      return NextResponse.json(
        { error: "Enrollment did not return a registration. Check server logs or try again." },
        { status: 500 }
      );
    }

    const { data: sess } = await supabaseAdmin.from("training_sessions").select("*").eq("id", sessionId).single();
    if (sess && regId) {
      const title = await getSessionDisplayTitle(sess as Parameters<typeof getSessionDisplayTitle>[0]);
      const ctx = buildSessionContext(sessionId, {
        title,
        starts_at: sess.starts_at as string,
        ends_at: sess.ends_at as string | null,
        timezone: sess.timezone as string,
        location: sess.location as string,
      });
      const user = await loadUserNotifyFields(userId);
      if (regStatus === "registered") {
        notifyTrainingAttendee("registration_confirmed", user.email, user.name, ctx);
        notifyInternalTrainingSignup([], {
          attendeeEmail: user.email,
          attendeeName: user.name,
          sessionTitle: title,
          status: "registered",
        });
      } else if (regStatus === "waitlisted") {
        notifyTrainingAttendee("waitlist_joined", user.email, user.name, ctx, {
          waitlistPosition: wlPos ?? undefined,
        });
        notifyInternalTrainingSignup([], {
          attendeeEmail: user.email,
          attendeeName: user.name,
          sessionTitle: title,
          status: "waitlisted",
        });
      }
    }

    return NextResponse.json({
      registration_id: regId,
      status: regStatus,
      waitlist_position: wlPos ?? null,
    });
  } catch (e: unknown) {
    console.error("admin POST registration:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
