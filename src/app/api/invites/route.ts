import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Server-side Supabase client with service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface Payload {
  email: string;
  role?: string;
  password?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Verify the user is authenticated and admin
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create a client to verify the user session
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin in database
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !userData || userData.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const body: Payload = await req.json();
    const { email, role = "client", password } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (password !== undefined && password !== null && String(password).trim() !== "") {
      const pwd = String(password).trim();
      if (pwd.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }
    }

    const normalizedEmail = email.trim().toLowerCase();
    const createWithPassword = Boolean(password && String(password).trim().length >= 6);

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    let createdUserId: string | undefined;

    let isExistingUser = false;

    const ensureProfile = async (userId: string) => {
      const { error: updateError } = await supabaseAdmin
        .from("users")
        .update({ role: role as "admin" | "client", email: normalizedEmail })
        .eq("id", userId)
        .select()
        .single();

      if (updateError && updateError.code === "PGRST116") {
        const { error: insertError } = await supabaseAdmin
          .from("users")
          .insert({
            id: userId,
            email: normalizedEmail,
            role: role as "admin" | "client",
          });
        if (insertError && insertError.code === "23505") {
          await supabaseAdmin
            .from("users")
            .update({ role: role as "admin" | "client", email: normalizedEmail })
            .eq("id", userId);
        }
      }
    };

    if (existing) {
      isExistingUser = true;
      createdUserId = existing.id;

      if (createWithPassword) {
        // Update existing user's password
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          existing.id,
          { password: String(password).trim() }
        );
        if (updateError) throw updateError;
        await ensureProfile(existing.id);
      } else {
        // User exists: send password reset email instead
        const { data: existingProfile } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("id", existing.id)
          .single();

        if (existingProfile) {
          const { error: roleError } = await supabaseAdmin
            .from("users")
            .update({ role: role as "admin" | "client" })
            .eq("id", existing.id);
          if (roleError) console.error("Error updating role:", roleError);
        } else {
          const { error: profileError } = await supabaseAdmin
            .from("users")
            .insert({
              id: existing.id,
              email: normalizedEmail,
              role: role as "admin" | "client",
            });
          if (profileError && profileError.code === "23505") {
            await supabaseAdmin
              .from("users")
              .update({ role: role as "admin" | "client" })
              .eq("id", existing.id);
          }
        }

        const redirectUrl = process.env.NEXT_PUBLIC_APP_URL
          ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`
          : `${req.nextUrl.origin}/auth/reset-password`;

        const { error: inviteError } =
          await supabaseAdmin.auth.admin.inviteUserByEmail(normalizedEmail, {
            redirectTo: redirectUrl,
          });

        if (inviteError) {
          console.error("Error resending invite email:", inviteError);
        }
      }
    } else {
      if (createWithPassword) {
        // Create new user with password, no email verification
        const { data: createData, error: createError } =
          await supabaseAdmin.auth.admin.createUser({
            email: normalizedEmail,
            password: String(password).trim(),
            email_confirm: true,
          });

        if (createError) throw createError;
        createdUserId = createData?.user?.id;

        if (createdUserId) {
          await ensureProfile(createdUserId);
        }
      } else {
        // Create new user using inviteUserByEmail
        const redirectUrl = process.env.NEXT_PUBLIC_APP_URL
          ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`
          : `${req.nextUrl.origin}/auth/reset-password`;

        const { data: inviteData, error: inviteError } =
          await supabaseAdmin.auth.admin.inviteUserByEmail(normalizedEmail, {
            redirectTo: redirectUrl,
          });

        if (inviteError) throw inviteError;
        createdUserId = inviteData?.user?.id;

        if (createdUserId) {
          await ensureProfile(createdUserId);
        }
      }
    }

    // Generate invite token (for tracking purposes)
    const inviteToken = `${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

    // Create invite record (audit trail)
    const { data: inviteData, error: inviteRecordError } = await supabaseAdmin
      .from("invites")
      .insert({
        email: normalizedEmail,
        used: isExistingUser || createWithPassword,
        created_by: user.id,
        token: inviteToken,
        expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
      })
      .select()
      .single();

    if (inviteRecordError) {
      console.error("Error creating invite:", inviteRecordError);
      // Don't fail if invite creation fails, user is already created
    }

    return NextResponse.json({
      success: true,
      userId: createdUserId,
      inviteId: inviteData?.id,
      message: createWithPassword
        ? "User created. They can sign in with their email and the password you set."
        : "User created and email sent successfully",
    });
  } catch (error: any) {
    console.error("Error in invite API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !userData || userData.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const includeUsed = req.nextUrl.searchParams.get("includeUsed") === "true";

    let query = supabaseAdmin
      .from("invites")
      .select("*")
      .order("created_at", { ascending: false });

    if (!includeUsed) {
      query = query.eq("used", false);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      invites: (data || []).map((invite) => ({
        ...invite,
        email: invite.email?.toLowerCase() ?? invite.email,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching invites:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
