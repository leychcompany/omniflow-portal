import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  buildSessionContext,
  notifyTrainingAttendee,
} from "@/lib/training-notify-email";
import {
  getSessionDisplayTitle,
  loadTrainingSessionDays,
  loadUserNotifyFields,
} from "@/lib/training-session-queries";

function authorizeCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn("CRON_SECRET not set; refusing cron");
    return false;
  }
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/**
 * Daily: 7d and 1d reminders for confirmed registrations.
 * Narrow windows avoid duplicate sends across daily runs.
 */
export async function GET(req: NextRequest) {
  if (!authorizeCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const hourMs = 60 * 60 * 1000;
  const dayMs = 24 * hourMs;

  const window7low = new Date(now + 7 * dayMs - 2 * hourMs).toISOString();
  const window7high = new Date(now + 7 * dayMs + 2 * hourMs).toISOString();
  const window1low = new Date(now + 1 * dayMs - 2 * hourMs).toISOString();
  const window1high = new Date(now + 1 * dayMs + 2 * hourMs).toISOString();

  let sent7 = 0;
  let sent1 = 0;

  try {
    const { data: sessions7 } = await supabaseAdmin
      .from("training_sessions")
      .select("id, title, course_id, starts_at, ends_at, timezone, location, status")
      .gte("starts_at", window7low)
      .lte("starts_at", window7high)
      .neq("status", "cancelled");

    for (const sess of sessions7 ?? []) {
      const { data: regs } = await supabaseAdmin
        .from("training_registrations")
        .select("id, user_id")
        .eq("session_id", sess.id)
        .eq("status", "registered")
        .is("reminder_7d_sent_at", null);

      const title = await getSessionDisplayTitle(sess as Parameters<typeof getSessionDisplayTitle>[0]);
      const days = await loadTrainingSessionDays(sess.id as string);
      const ctx = buildSessionContext(sess.id as string, {
        title,
        days,
        timezone: sess.timezone as string,
        location: sess.location as string,
      });

      for (const r of regs ?? []) {
        const u = await loadUserNotifyFields(r.user_id as string);
        if (u.email) {
          notifyTrainingAttendee("reminder_7d", u.email, u.name, ctx);
          await supabaseAdmin
            .from("training_registrations")
            .update({ reminder_7d_sent_at: new Date().toISOString() })
            .eq("id", r.id);
          sent7++;
        }
      }
    }

    const { data: sessions1 } = await supabaseAdmin
      .from("training_sessions")
      .select("id, title, course_id, starts_at, ends_at, timezone, location, status")
      .gte("starts_at", window1low)
      .lte("starts_at", window1high)
      .neq("status", "cancelled");

    for (const sess of sessions1 ?? []) {
      const { data: regs } = await supabaseAdmin
        .from("training_registrations")
        .select("id, user_id")
        .eq("session_id", sess.id)
        .eq("status", "registered")
        .is("reminder_1d_sent_at", null);

      const title = await getSessionDisplayTitle(sess as Parameters<typeof getSessionDisplayTitle>[0]);
      const days = await loadTrainingSessionDays(sess.id as string);
      const ctx = buildSessionContext(sess.id as string, {
        title,
        days,
        timezone: sess.timezone as string,
        location: sess.location as string,
      });

      for (const r of regs ?? []) {
        const u = await loadUserNotifyFields(r.user_id as string);
        if (u.email) {
          notifyTrainingAttendee("reminder_1d", u.email, u.name, ctx);
          await supabaseAdmin
            .from("training_registrations")
            .update({ reminder_1d_sent_at: new Date().toISOString() })
            .eq("id", r.id);
          sent1++;
        }
      }
    }

    return NextResponse.json({ ok: true, reminder_7d: sent7, reminder_1d: sent1 });
  } catch (e: unknown) {
    console.error("cron training-reminders:", e);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
