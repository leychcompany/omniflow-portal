import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAuth } from "@/lib/verify-auth";

async function getAuthUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!error && user) return user.id;
  }
  const auth = await verifyAuth(req);
  return auth.ok ? auth.userId : null;
}

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, email, name, first_name, last_name, company, title, role, locked, created_at, updated_at")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err) {
    console.error("Error fetching profile:", err);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const userId = await getAuthUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { first_name, last_name, company, title } = body;

    const { data: existing } = await supabaseAdmin
      .from("users")
      .select("first_name, last_name, company, title")
      .eq("id", userId)
      .single();

    const merged = {
      first_name: typeof first_name === "string" ? first_name.trim() || null : (existing?.first_name ?? null),
      last_name: typeof last_name === "string" ? last_name.trim() || null : (existing?.last_name ?? null),
      company: typeof company === "string" ? company.trim() || null : (existing?.company ?? null),
      title: typeof title === "string" ? title.trim() || null : (existing?.title ?? null),
    };

    const hasChanges =
      (typeof first_name === "string" && first_name.trim() !== (existing?.first_name ?? "")) ||
      (typeof last_name === "string" && last_name.trim() !== (existing?.last_name ?? "")) ||
      (typeof company === "string" && company.trim() !== (existing?.company ?? "")) ||
      (typeof title === "string" && title.trim() !== (existing?.title ?? ""));

    if (!hasChanges) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const name = [merged.first_name ?? "", merged.last_name ?? ""].filter(Boolean).join(" ").trim() || null;

    const { data, error } = await supabaseAdmin
      .from("users")
      .update({
        first_name: merged.first_name,
        last_name: merged.last_name,
        company: merged.company,
        title: merged.title,
        name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error updating profile:", err);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
