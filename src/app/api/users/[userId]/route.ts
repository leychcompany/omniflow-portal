import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function assertAdmin(
  request: NextRequest
): Promise<{ errorResponse: NextResponse } | { userId: string }> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return {
      errorResponse: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      errorResponse: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  const { data: userData, error: userError } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userError || !userData || userData.role !== "admin") {
    return {
      errorResponse: NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      ),
    };
  }

  return { userId: user.id };
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
      .select("id, email, name, role, created_at")
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
