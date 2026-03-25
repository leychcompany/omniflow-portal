import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";

/**
 * Bulk lock users. Accepts an array of user IDs.
 * Logs analytics for each lock.
 */
export async function POST(req: NextRequest) {
  const adminCheck = await verifyAdmin(req);
  if (!adminCheck.ok) return adminCheck.response;

  try {
    const body = await req.json().catch(() => ({}));
    const userIds = Array.isArray(body.userIds) ? body.userIds.filter((id: unknown) => typeof id === "string") : [];

    if (userIds.length === 0) {
      return NextResponse.json(
        { error: "No user IDs provided", locked: 0 },
        { status: 400 }
      );
    }

    const { data: usersData } = await supabaseAdmin
      .from("users")
      .select("id, email, name, role, locked")
      .in("id", userIds);

    const toLock = (usersData ?? []).filter(
      (u) => u.role !== "admin" && u.locked !== true
    );
    const idsToLock = toLock.map((u) => u.id);

    if (idsToLock.length === 0) {
      return NextResponse.json({
        success: true,
        locked: 0,
        message: "No unlocked non-admin users to lock",
      });
    }

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ locked: true })
      .in("id", idsToLock);

    if (updateError) throw updateError;

    for (const u of toLock) {
      await supabaseAdmin.from("activity_events").insert({
        event_type: "user_lock",
        user_id: adminCheck.userId,
        resource_type: "user",
        resource_id: u.id,
        metadata: {
          target_user_id: u.id,
          target_user_email: u.email ?? null,
          target_user_name: u.name ?? null,
          performed_at: new Date().toISOString(),
          bulk: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      locked: idsToLock.length,
      message: `Locked ${idsToLock.length} user(s)`,
    });
  } catch (error: unknown) {
    console.error("Bulk lock error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to lock users" },
      { status: 500 }
    );
  }
}
