import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function verifyAdmin(req: Request): Promise<
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse }
> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
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
    .eq("id", user.id)
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

  return { ok: true, userId: user.id };
}
