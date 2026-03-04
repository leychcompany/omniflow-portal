import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { isBlockedEmailDomain, getBlockedDomainsMessage } from "@/lib/blocked-email-domains";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * Supabase Before User Created Auth Hook endpoint.
 * Validates that self-registering users use company emails (not free providers like Gmail).
 * Admin-invited users bypass: (a) app_metadata.invited_by_admin for createUser, or
 * (b) recent invite record in invites table for inviteUserByEmail.
 *
 * Configure in Supabase Dashboard: Authentication → Hooks → Before User Created
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const user = body?.user;
    const email = (user?.email ?? "").trim().toLowerCase();
    const appMetadata = user?.app_metadata ?? {};

    // Admin createUser: app_metadata.invited_by_admin (only service role can set)
    if (appMetadata.invited_by_admin === true) {
      return NextResponse.json({});
    }

    // Admin inviteUserByEmail: check for recent invite record (created before user)
    const { data: recentInvite } = await supabaseAdmin
      .from("invites")
      .select("id")
      .eq("email", email)
      .gte("created_at", new Date(Date.now() - 2 * 60 * 1000).toISOString())
      .limit(1)
      .maybeSingle();

    if (recentInvite) {
      return NextResponse.json({});
    }

    if (!email) {
      return NextResponse.json(
        {
          error: {
            http_code: 400,
            message: "Invalid signup request.",
          },
        },
        { status: 400 }
      );
    }

    if (isBlockedEmailDomain(email)) {
      return NextResponse.json(
        {
          error: {
            http_code: 400,
            message: getBlockedDomainsMessage(),
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({});
  } catch (error) {
    console.error("validate-signup hook error:", error);
    return NextResponse.json(
      {
        error: {
          http_code: 500,
          message: "Internal server error",
        },
      },
      { status: 500 }
    );
  }
}
