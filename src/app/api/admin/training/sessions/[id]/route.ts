import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  buildSessionContext,
  notifyTrainingAttendee,
} from "@/lib/training-notify-email";
import { countRegistrations, getSessionDisplayTitle, loadUserNotifyFields } from "@/lib/training-session-queries";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin.from("training_sessions").select("*").eq("id", id).single();
    if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const title = await getSessionDisplayTitle(data as Parameters<typeof getSessionDisplayTitle>[0]);
    return NextResponse.json({ ...data, display_title: title });
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

    const body = await req.json();
    const patch: Record<string, unknown> = {};
    const fields = [
      "course_id",
      "title",
      "description",
      "instructor",
      "starts_at",
      "ends_at",
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

    const { data: updatedRow, error } = await supabaseAdmin
      .from("training_sessions")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    let data = updatedRow;

    if (
      data?.status === "full" &&
      "capacity" in patch &&
      typeof patch.capacity === "number" &&
      patch.capacity > (oldRow.capacity as number)
    ) {
      const { registered } = await countRegistrations(id);
      if (registered < (data.capacity as number)) {
        const { data: reopened } = await supabaseAdmin
          .from("training_sessions")
          .update({ status: "open" })
          .eq("id", id)
          .select()
          .single();
        if (reopened) data = reopened;
      }
    }

    const material =
      (patch.starts_at != null && patch.starts_at !== oldRow.starts_at) ||
      (patch.ends_at !== undefined && patch.ends_at !== oldRow.ends_at) ||
      (patch.timezone != null && patch.timezone !== oldRow.timezone) ||
      (patch.location != null && patch.location !== oldRow.location);

    const becameCancelled = patch.status === "cancelled" && oldRow.status !== "cancelled";

    if (material && !becameCancelled && data.status !== "cancelled") {
      const { data: attendees } = await supabaseAdmin
        .from("training_registrations")
        .select("user_id")
        .eq("session_id", id)
        .in("status", ["registered", "waitlisted"]);

      const newTitle = await getSessionDisplayTitle(data as Parameters<typeof getSessionDisplayTitle>[0]);
      const oldSummary = `When: ${oldRow.starts_at}${oldRow.ends_at ? ` – ${oldRow.ends_at}` : ""} (${oldRow.timezone})\nLocation: ${oldRow.location}`;
      const newSummary = `When: ${data.starts_at}${data.ends_at ? ` – ${data.ends_at}` : ""} (${data.timezone})\nLocation: ${data.location}`;
      const ctx = buildSessionContext(id, {
        title: newTitle,
        starts_at: data.starts_at as string,
        ends_at: data.ends_at as string | null,
        timezone: data.timezone as string,
        location: data.location as string,
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
        starts_at: oldRow.starts_at as string,
        ends_at: oldRow.ends_at as string | null,
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

    return NextResponse.json(data);
  } catch (e: unknown) {
    console.error("admin PATCH session:", e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
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
