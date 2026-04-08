import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/verify-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  buildSessionContext,
  notifyInternalTrainingSignup,
  notifyTrainingAttendee,
} from "@/lib/training-notify-email";
import { getSessionDisplayTitle, loadUserNotifyFields } from "@/lib/training-session-queries";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const { id: sessionId } = await params;
    const { data: rows, error } = await supabaseAdmin.rpc("register_for_training_session", {
      p_session_id: sessionId,
      p_user_id: auth.userId,
    });

    if (error) {
      console.error("register_for_training_session:", error);
      return NextResponse.json({ error: error.message || "Registration failed" }, { status: 500 });
    }

    const row = (Array.isArray(rows) ? rows[0] : rows) as Record<string, unknown> | undefined | null;
    const outError = row?.out_error as string | undefined | null;
    if (outError) {
      return NextResponse.json({ error: outError }, { status: 400 });
    }

    const regId = row?.out_registration_id as string | undefined;
    const regStatus = row?.out_status as string | undefined;
    const wlPos = row?.out_waitlist_position as number | null | undefined;

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
      const user = await loadUserNotifyFields(auth.userId);
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
      message:
        regStatus === "registered"
          ? "You’re registered for this class."
          : regStatus === "waitlisted"
            ? "You’re on the waitlist."
            : "OK",
    });
  } catch (e: unknown) {
    console.error("POST register:", e);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const { id: sessionId } = await params;

    const { data: beforeSess } = await supabaseAdmin.from("training_sessions").select("*").eq("id", sessionId).single();

    const { data: rows, error } = await supabaseAdmin.rpc("cancel_my_training_registration", {
      p_session_id: sessionId,
      p_user_id: auth.userId,
    });

    if (error) {
      console.error("cancel_my_training_registration:", error);
      return NextResponse.json({ error: error.message || "Cancel failed" }, { status: 500 });
    }

    const crow = (Array.isArray(rows) ? rows[0] : rows) as Record<string, unknown> | undefined | null;
    const cancelErr = crow?.out_error as string | undefined | null;
    if (cancelErr) {
      return NextResponse.json({ error: cancelErr }, { status: 400 });
    }

    const promotedUserId = crow?.out_promoted_user_id as string | null | undefined;

    if (beforeSess) {
      const title = await getSessionDisplayTitle(beforeSess as Parameters<typeof getSessionDisplayTitle>[0]);
      const ctx = buildSessionContext(sessionId, {
        title,
        starts_at: beforeSess.starts_at as string,
        ends_at: beforeSess.ends_at as string | null,
        timezone: beforeSess.timezone as string,
        location: beforeSess.location as string,
      });
      const canceller = await loadUserNotifyFields(auth.userId);
      notifyTrainingAttendee("registration_cancelled_self", canceller.email, canceller.name, ctx);

      if (promotedUserId) {
        const promoted = await loadUserNotifyFields(promotedUserId);
        notifyTrainingAttendee("promoted_from_waitlist", promoted.email, promoted.name, ctx);
      }
    }

    return NextResponse.json({ success: true, promoted_user_id: promotedUserId ?? null });
  } catch (e: unknown) {
    console.error("DELETE register:", e);
    return NextResponse.json({ error: "Cancel failed" }, { status: 500 });
  }
}
