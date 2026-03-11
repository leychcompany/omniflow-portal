import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";

async function assertAdmin(
  request: NextRequest
): Promise<{ errorResponse: NextResponse } | { userId: string }> {
  const auth = await verifyAdmin(request);
  if (!auth.ok) return { errorResponse: auth.response };
  return { userId: auth.userId };
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  try {
    const adminCheck = await assertAdmin(request);
    if ("errorResponse" in adminCheck) {
      return adminCheck.errorResponse;
    }

    const { inviteId } = await params;

    const { data: invite, error: inviteError } = await supabaseAdmin
      .from("invites")
      .select("id, email, used")
      .eq("id", inviteId)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    const { error: deleteInviteError } = await supabaseAdmin
      .from("invites")
      .delete()
      .eq("id", inviteId);

    if (deleteInviteError) {
      throw deleteInviteError;
    }

    let removedUserId: string | null = null;
    let authUserDeleted = false;

    if (!invite.used) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", invite.email)
        .single();

      if (!profileError && profile) {
        removedUserId = profile.id;

        const { error: deleteProfileError } = await supabaseAdmin
          .from("users")
          .delete()
          .eq("id", profile.id);

        if (deleteProfileError && deleteProfileError.code !== "PGRST116") {
          console.error(
            "Error deleting user profile for invite:",
            deleteProfileError
          );
        }

        const { error: deleteAuthError } =
          await supabaseAdmin.auth.admin.deleteUser(profile.id);
        if (deleteAuthError) {
          if (deleteAuthError.message !== "User not found") {
            console.error(
              "Error deleting auth user for invite:",
              deleteAuthError
            );
          }
        } else {
          authUserDeleted = true;
        }
      }
    }

    return NextResponse.json({
      success: true,
      removedUserId,
      authUserDeleted,
    });
  } catch (error: any) {
    console.error("Error canceling invite:", error);
    return NextResponse.json(
      {
        error: error?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
