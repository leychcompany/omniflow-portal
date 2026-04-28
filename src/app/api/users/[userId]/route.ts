import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { countGlobalAdmins } from "@/lib/count-global-admins";
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
    const [{ data, error }, adminCount] = await Promise.all([
      supabaseAdmin
        .from("users")
        .select(
          "id, email, name, role, created_at, locked, first_name, last_name, company, title, phone"
        )
        .eq("id", userId)
        .single(),
      countGlobalAdmins(),
    ]);

    if (error || !data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ ...data, adminCount });
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
    const locked = body.locked;
    const role = body.role as string | undefined;

    const wantsLock = typeof locked === "boolean";
    const wantsRole =
      typeof role === "string" &&
      (role === "admin" || role === "client");

    if (!wantsLock && !wantsRole) {
      return NextResponse.json(
        {
          error:
            "Invalid request. Send 'locked' (boolean) and/or 'role' ('admin' | 'client').",
        },
        { status: 400 }
      );
    }

    const { data: targetUser, error: fetchErr } = await supabaseAdmin
      .from("users")
      .select("email, name, locked, role")
      .eq("id", userId)
      .single();

    if (fetchErr || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (wantsRole) {
      if (
        targetUser.role === "admin" &&
        role === "client"
      ) {
        const { data: adminRows, error: adminErr } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("role", "admin");
        if (!adminErr && adminRows && adminRows.length <= 1) {
          return NextResponse.json(
            { error: "Cannot remove the last admin" },
            { status: 400 }
          );
        }
      }
    }

    const wasLocked = targetUser.locked === true;
    const patch: { locked?: boolean; role?: string } = {};
    if (wantsLock) patch.locked = locked;
    if (wantsRole) patch.role = role;

    const { error: updateErr } = await supabaseAdmin
      .from("users")
      .update(patch)
      .eq("id", userId);

    if (updateErr) {
      throw updateErr;
    }

    if (wantsLock) {
      const newLocked = locked as boolean;
      if (!newLocked && wasLocked && targetUser.email) {
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
        event_type: newLocked ? "user_lock" : "user_unlock",
        user_id: adminCheck.userId,
        resource_type: "user",
        resource_id: userId,
        metadata: {
          target_user_id: userId,
          target_user_email: targetUser.email ?? null,
          target_user_name: targetUser.name ?? null,
          performed_at: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      ...(wantsLock && { locked }),
      ...(wantsRole && { role }),
      message: wantsRole
        ? `Role updated to ${role}`
        : locked
          ? "User locked"
          : "User unlocked",
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
