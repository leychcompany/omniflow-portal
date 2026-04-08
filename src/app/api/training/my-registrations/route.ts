import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/verify-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessionDisplayTitle } from "@/lib/training-session-queries";

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const { data: regs, error } = await supabaseAdmin
      .from("training_registrations")
      .select("id, status, created_at, session_id")
      .eq("user_id", auth.userId)
      .in("status", ["registered", "waitlisted"])
      .order("created_at", { ascending: false });

    if (error) throw error;

    const sessionIds = [...new Set((regs ?? []).map((r) => r.session_id as string))];
    const sessionMap = new Map<string, Record<string, unknown>>();
    if (sessionIds.length > 0) {
      const { data: sessions } = await supabaseAdmin
        .from("training_sessions")
        .select("*")
        .in("id", sessionIds);
      for (const s of sessions ?? []) sessionMap.set(s.id as string, s as Record<string, unknown>);
    }

    const items = await Promise.all(
      (regs ?? []).map(async (r) => {
        const sess = sessionMap.get(r.session_id as string);
        if (!sess) return null;
        const title = await getSessionDisplayTitle(sess as unknown as Parameters<typeof getSessionDisplayTitle>[0]);
        return {
          registration_id: r.id,
          status: r.status,
          created_at: r.created_at,
          session: {
            id: sess.id,
            title,
            instructor: (sess.instructor as string | null | undefined) ?? null,
            starts_at: sess.starts_at,
            ends_at: sess.ends_at,
            timezone: sess.timezone,
            location: sess.location,
            status: sess.status,
          },
        };
      })
    );

    return NextResponse.json({ items: items.filter(Boolean) });
  } catch (e: unknown) {
    console.error("GET my-registrations:", e);
    return NextResponse.json({ error: "Failed to load registrations" }, { status: 500 });
  }
}
