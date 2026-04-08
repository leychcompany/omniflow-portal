import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { buildSessionContext, notifyTrainingAttendee } from "@/lib/training-notify-email";
import { getSessionDisplayTitle, loadUserNotifyFields } from "@/lib/training-session-queries";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; regId: string }> }
) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { id: sessionId, regId } = await params;
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const raw =
      body && typeof body === "object" && "attendance_status" in body
        ? (body as { attendance_status: unknown }).attendance_status
        : undefined;
    const attendanceNorm =
      typeof raw === "string" ? raw.trim().toLowerCase() : "";
    if (attendanceNorm !== "scheduled" && attendanceNorm !== "confirmed") {
      return NextResponse.json(
        { error: "attendance_status must be scheduled or confirmed" },
        { status: 400 }
      );
    }
    const attendance = attendanceNorm;

    const { data: reg, error: rErr } = await supabaseAdmin
      .from("training_registrations")
      .select("id, session_id, status")
      .eq("id", regId)
      .eq("session_id", sessionId)
      .single();

    if (rErr || !reg) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }
    if (!["registered", "waitlisted"].includes(reg.status as string)) {
      return NextResponse.json({ error: "Not an active roster row" }, { status: 400 });
    }

    const { data: updated, error: uErr } = await supabaseAdmin
      .from("training_registrations")
      .update({ attendance_status: attendance })
      .eq("id", regId)
      .select("id, attendance_status")
      .single();

    if (uErr) {
      console.error("PATCH registration attendance:", uErr);
      return NextResponse.json({ error: uErr.message || "Failed to update" }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (e: unknown) {
    console.error("admin PATCH registration:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; regId: string }> }
) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { id: sessionId, regId } = await params;

    const { data: reg, error: rErr } = await supabaseAdmin
      .from("training_registrations")
      .select("*")
      .eq("id", regId)
      .eq("session_id", sessionId)
      .single();

    if (rErr || !reg) return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    if (!["registered", "waitlisted"].includes(reg.status as string)) {
      return NextResponse.json({ error: "Not active" }, { status: 400 });
    }

    const wasRegistered = reg.status === "registered";
    const userId = reg.user_id as string;

    const { data: sess } = await supabaseAdmin.from("training_sessions").select("*").eq("id", sessionId).single();

    await supabaseAdmin
      .from("training_registrations")
      .update({ status: "cancelled", waitlist_position: null })
      .eq("id", regId);

    let promotedUserId: string | null = null;
    if (wasRegistered) {
      const { data: promoted } = await supabaseAdmin.rpc("training_session_after_registered_drop", {
        p_session_id: sessionId,
      });
      promotedUserId =
        typeof promoted === "string"
          ? promoted
          : Array.isArray(promoted) && typeof promoted[0] === "string"
            ? promoted[0]
            : null;
    }

    if (sess) {
      const title = await getSessionDisplayTitle(sess as Parameters<typeof getSessionDisplayTitle>[0]);
      const ctx = buildSessionContext(sessionId, {
        title,
        starts_at: sess.starts_at as string,
        ends_at: sess.ends_at as string | null,
        timezone: sess.timezone as string,
        location: sess.location as string,
      });
      const removed = await loadUserNotifyFields(userId);
      if (removed.email) notifyTrainingAttendee("removed_by_admin", removed.email, removed.name, ctx);
      if (promotedUserId) {
        const promoted = await loadUserNotifyFields(promotedUserId);
        if (promoted.email) notifyTrainingAttendee("promoted_from_waitlist", promoted.email, promoted.name, ctx);
      }
    }

    return NextResponse.json({ success: true, promoted_user_id: promotedUserId });
  } catch (e: unknown) {
    console.error("admin DELETE registration:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
