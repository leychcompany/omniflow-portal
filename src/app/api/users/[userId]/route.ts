import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { sendAccountUnlockedWelcomeEmail } from "@/lib/send-account-unlocked-email";

async function assertAdmin(
  request: NextRequest
): Promise<{ errorResponse: NextResponse } | { userId: string }> {
  const auth = await verifyAdmin(request);
  if (!auth.ok) return { errorResponse: auth.response };
  return { userId: auth.userId };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const adminCheck = await assertAdmin(request);
  if ("errorResponse" in adminCheck) {
    return adminCheck.errorResponse;
  }

  try {
    const { userId } = await params;
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, email, name, role, created_at, locked, first_name, last_name, company, title, phone")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const adminCheck = await assertAdmin(request);
  if ("errorResponse" in adminCheck) {
    return adminCheck.errorResponse;
  }

  try {
    const { userId } = await params;
    const body = await request.json().catch(() => ({}));
    const { locked } = body;

    if (typeof locked !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request. 'locked' must be a boolean." },
        { status: 400 }
      );
    }

    const { data: targetUser } = await supabaseAdmin
      .from("users")
      .select("email, name, locked")
      .eq("id", userId)
      .single();

    const wasLocked = targetUser?.locked === true;

    const { error } = await supabaseAdmin
      .from("users")
      .update({ locked })
      .eq("id", userId);

    if (error) {
      throw error;
    }

    if (!locked && wasLocked && targetUser?.email) {
      const emailed = await sendAccountUnlockedWelcomeEmail({
        to: targetUser.email,
        name: targetUser.name,
      });
      if (!emailed.ok) {
        console.warn(
          "User unlocked but welcome email failed:",
          userId,
          emailed.error
        );
      }
    }

    await supabaseAdmin.from("activity_events").insert({
      event_type: locked ? "user_lock" : "user_unlock",
      user_id: adminCheck.userId,
      resource_type: "user",
      resource_id: userId,
      metadata: {
        target_user_id: userId,
        target_user_email: targetUser?.email ?? null,
        target_user_name: targetUser?.name ?? null,
        performed_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      locked,
      message: locked ? "User locked" : "User unlocked",
    });
  } catch (error: unknown) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const adminCheck = await assertAdmin(request);
    if ("errorResponse" in adminCheck) {
      return adminCheck.errorResponse;
    }

    const { userId } = await params;

    // Get user email before deletion to check for invites
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("email, role")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if this is the last admin
    if (userData.role === "admin") {
      const { data: adminUsers, error: adminError } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("role", "admin");

      if (!adminError && adminUsers && adminUsers.length <= 1) {
        return NextResponse.json(
          { error: "Cannot delete the last admin user" },
          { status: 400 }
        );
      }
    }

    // Delete invites associated with this user's email
    if (userData.email) {
      const normalizedEmail = userData.email.toLowerCase();
      await supabaseAdmin
        .from("invites")
        .delete()
        .or(`email.eq.${normalizedEmail},email.eq.${userData.email}`);
    }

    // Delete from users table
    const { error: deleteUserError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", userId);

    if (deleteUserError) {
      throw deleteUserError;
    }

    // Delete from auth.users
    const { error: deleteAuthError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      // Log but don't fail if auth user doesn't exist
      if (deleteAuthError.message !== "User not found") {
        console.error("Error deleting auth user:", deleteAuthError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      {
        error: error?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
