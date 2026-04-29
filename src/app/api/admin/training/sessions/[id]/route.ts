import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  formatTrainingSessionChangeSummary,
  trainingScheduleChangeKey,
} from "@/lib/format-training-session-schedule";
import {
  buildSessionContext,
  notifyTrainingAttendee,
} from "@/lib/training-notify-email";
import {
  countRegistrations,
  getSessionDisplayTitle,
  loadTrainingSessionDays,
  loadUserNotifyFields,
} from "@/lib/training-session-queries";
import { parseTrainingSessionDaysInput } from "@/lib/training-session-days-input";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin.from("training_sessions").select("*").eq("id", id).single();
    if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const title = await getSessionDisplayTitle(data as Parameters<typeof getSessionDisplayTitle>[0]);
    const days = await loadTrainingSessionDays(id);
    return NextResponse.json({ ...data, display_title: title, days });
  } catch (e: unknown) {
    console.error("admin GET session:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const { data: oldRow, error: loadErr } = await supabaseAdmin
      .from("training_sessions")
      .select("*")
      .eq("id", id)
      .single();
    if (loadErr || !oldRow) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const oldDays = await loadTrainingSessionDays(id);

    const body = await req.json();
    const patch: Record<string, unknown> = {};
    const fields = [
      "course_id",
      "title",
      "description",
      "timezone",
      "location",
      "capacity",
      "status",
      "waitlist_enabled",
      "registration_closes_at",
    ] as const;
    for (const k of fields) {
      if (k in body) patch[k] = body[k];
    }

    let nextDays = oldDays;
    if ("days" in body) {
      try {
        const validated = parseTrainingSessionDaysInput(body.days);
        nextDays = validated.map((d, idx) => ({
          position: idx,
          day_date: d.day_date,
          start_time: d.start_time,
          end_time: d.end_time,
          label: d.label,
        }));
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : "Invalid days" },
          { status: 400 }
        );
      }
    }

    if (Object.keys(patch).length > 0) {
      const { error: updErr } = await supabaseAdmin
        .from("training_sessions")
        .update(patch)
        .eq("id", id);
      if (updErr) throw updErr;
    }

    if ("days" in body) {
      const { error: delErr } = await supabaseAdmin
        .from("training_session_days")
        .delete()
        .eq("session_id", id);
      if (delErr) throw delErr;
      const insertRows = nextDays.map((d, idx) => ({
        session_id: id,
        position: idx,
        day_date: d.day_date,
        start_time: d.start_time,
        end_time: d.end_time,
        label: d.label,
      }));
      const { error: insErr } = await supabaseAdmin
        .from("training_session_days")
        .insert(insertRows);
      if (insErr) throw insErr;
    }

    let { data: updatedRow, error: refreshErr } = await supabaseAdmin
      .from("training_sessions")
      .select("*")
      .eq("id", id)
      .single();
    if (refreshErr || !updatedRow) {
      return NextResponse.json({ error: "Failed to reload session" }, { status: 500 });
    }

    if (
      updatedRow.status === "full" &&
      "capacity" in patch &&
      typeof patch.capacity === "number" &&
      patch.capacity > (oldRow.capacity as number)
    ) {
      const { registered } = await countRegistrations(id);
      if (registered < (updatedRow.capacity as number)) {
        const { data: reopened } = await supabaseAdmin
          .from("training_sessions")
          .update({ status: "open" })
          .eq("id", id)
          .select()
          .single();
        if (reopened) updatedRow = reopened;
      }
    }

    const scheduleChanged =
      "days" in body && trainingScheduleChangeKey(nextDays) !== trainingScheduleChangeKey(oldDays);
    const tzChanged = patch.timezone != null && patch.timezone !== oldRow.timezone;
    const locationChanged = patch.location != null && patch.location !== oldRow.location;

    const material = scheduleChanged || tzChanged || locationChanged;
    const becameCancelled = patch.status === "cancelled" && oldRow.status !== "cancelled";

    if (material && !becameCancelled && updatedRow.status !== "cancelled") {
      const { data: attendees } = await supabaseAdmin
        .from("training_registrations")
        .select("user_id")
        .eq("session_id", id)
        .in("status", ["registered", "waitlisted"]);

      const newTitle = await getSessionDisplayTitle(updatedRow as Parameters<typeof getSessionDisplayTitle>[0]);
      const oldSummary = formatTrainingSessionChangeSummary(
        oldDays,
        oldRow.timezone as string,
        oldRow.location as string
      );
      const newSummary = formatTrainingSessionChangeSummary(
        nextDays,
        updatedRow.timezone as string,
        updatedRow.location as string
      );
      const ctx = buildSessionContext(id, {
        title: newTitle,
        days: nextDays,
        timezone: updatedRow.timezone as string,
        location: updatedRow.location as string,
      });

      const seen = new Set<string>();
      for (const row of attendees ?? []) {
        const uid = row.user_id as string;
        if (seen.has(uid)) continue;
        seen.add(uid);
        const u = await loadUserNotifyFields(uid);
        if (u.email) {
          notifyTrainingAttendee("session_updated", u.email, u.name, ctx, {
            oldSummary,
            newSummary,
          });
        }
      }
    }

    if (becameCancelled) {
      const { data: attendees } = await supabaseAdmin
        .from("training_registrations")
        .select("user_id")
        .eq("session_id", id)
        .in("status", ["registered", "waitlisted"]);

      await supabaseAdmin
        .from("training_registrations")
        .update({ status: "cancelled", waitlist_position: null })
        .eq("session_id", id)
        .in("status", ["registered", "waitlisted"]);

      const title = await getSessionDisplayTitle(oldRow as Parameters<typeof getSessionDisplayTitle>[0]);
      const ctx = buildSessionContext(id, {
        title,
        days: oldDays,
        timezone: oldRow.timezone as string,
        location: oldRow.location as string,
      });

      const seenCancel = new Set<string>();
      for (const row of attendees ?? []) {
        const uid = row.user_id as string;
        if (seenCancel.has(uid)) continue;
        seenCancel.add(uid);
        const u = await loadUserNotifyFields(uid);
        if (u.email) notifyTrainingAttendee("session_cancelled", u.email, u.name, ctx);
      }
    }

    const days_out = await loadTrainingSessionDays(id);
    return NextResponse.json({ ...updatedRow, days: days_out });
  } catch (e: unknown) {
    console.error("admin PATCH session:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const { error } = await supabaseAdmin.from("training_sessions").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    console.error("admin DELETE session:", e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
