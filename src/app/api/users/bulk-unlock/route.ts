import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";

/**
 * Bulk unlock users. Accepts an array of user IDs.
 * Logs analytics for each unlock.
 */
export async function POST(req: NextRequest) {
  const adminCheck = await verifyAdmin(req);
  if (!adminCheck.ok) return adminCheck.response;

  try {
    const body = await req.json().catch(() => ({}));
    const userIds = Array.isArray(body.userIds) ? body.userIds.filter((id: unknown) => typeof id === "string") : [];

    if (userIds.length === 0) {
      return NextResponse.json(
        { error: "No user IDs provided", unlocked: 0 },
        { status: 400 }
      );
    }

    const { data: usersData } = await supabaseAdmin
      .from("users")
      .select("id, email, name, role, locked")
      .in("id", userIds);

    const toUnlock = (usersData ?? []).filter(
      (u) => u.role !== "admin" && u.locked === true
    );
    const idsToUnlock = toUnlock.map((u) => u.id);

    if (idsToUnlock.length === 0) {
      return NextResponse.json({
        success: true,
        unlocked: 0,
        message: "No locked non-admin users to unlock",
      });
    }

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ locked: false })
      .in("id", idsToUnlock);

    if (updateError) throw updateError;

    for (const u of toUnlock) {
      await supabaseAdmin.from("activity_events").insert({
        event_type: "user_unlock",
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
      unlocked: idsToUnlock.length,
      message: `Unlocked ${idsToUnlock.length} user(s)`,
    });
  } catch (error: unknown) {
    console.error("Bulk unlock error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to unlock users" },
      { status: 500 }
    );
  }
}
