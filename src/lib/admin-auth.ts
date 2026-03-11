import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function getUserIdFromCookies(req: NextRequest): Promise<string | null> {
  const response = NextResponse.next();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options ?? {});
        });
      },
    },
  });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user.id;
}

export async function verifyAdmin(req: NextRequest): Promise<
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse }
> {
  let userId: string | null = null;

  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!error && user) userId = user.id;
  }

  if (!userId && "cookies" in req) {
    userId = await getUserIdFromCookies(req);
  }

  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userData, error: userError } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (userError || !userData || userData.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      ),
    };
  }

  return { ok: true, userId };
}
