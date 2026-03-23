import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { CookieOptions } from "@supabase/ssr";

/**
 * Updates the current user's password. Runs server-side to avoid
 * browser->Supabase connectivity issues (proxy, firewall, etc).
 *
 * Important: session cookies from `updateUser` must be applied to the SAME
 * NextResponse we return. Previously we built a throwaway response for setAll
 * then returned a new JSON body — Set-Cookie never reached the browser, so
 * server-side checks (admin guard, /api/profile) saw a stale session.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const password = typeof body?.password === "string" ? body.password.trim() : "";
    const notifyInviteAccepted = body?.notifyInviteAccepted === true;
    const userName = typeof body?.name === "string" ? body.name.trim() : undefined;

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const pendingCookies = new Map<string, { value: string; options?: CookieOptions }>();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              pendingCookies.set(name, { value, options });
            });
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Not authenticated. Please wait for the page to load and try again." },
        { status: 401 }
      );
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    if (notifyInviteAccepted && user.email) {
      const { notifyHelpdesk } = await import("@/lib/notify-helpdesk");
      notifyHelpdesk("invite_accepted", {
        email: user.email,
        name: userName,
      }).catch((e) => console.error("Helpdesk notify failed:", e));
    }

    const out = NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email ?? undefined },
    });

    pendingCookies.forEach(({ value, options }, name) => {
      out.cookies.set(name, value, options);
    });

    return out;
  } catch {
    return NextResponse.json(
      { error: "Server error. Please try again." },
      { status: 500 }
    );
  }
}
