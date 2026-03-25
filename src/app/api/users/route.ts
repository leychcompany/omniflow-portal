import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(req: NextRequest) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10)));
    const q = (searchParams.get("q") ?? "").trim();
    const emailDomain = (searchParams.get("email_domain") ?? "").trim();
    const sortBy = searchParams.get("sort_by") ?? "created_at";
    const sortOrder = searchParams.get("sort") === "asc" ? "asc" : "desc";

    const validSortColumns = ["created_at", "email", "name", "locked", "role"];
    const orderBy = validSortColumns.includes(sortBy) ? sortBy : "created_at";

    let query = supabaseAdmin
      .from("users")
      .select("*", { count: "exact" })
      .order(orderBy, { ascending: sortOrder === "asc" });

    if (q) {
      const safe = q.replace(/,/g, " ");
      const term = `%${safe}%`;
      query = query.or(`email.ilike.${term},name.ilike.${term},first_name.ilike.${term},last_name.ilike.${term}`);
    }

    if (emailDomain) {
      // Partial domain match (typeahead): "exxon" matches user@exxonmobil.com
      const fragment = emailDomain
        .replace(/^@+/, "")
        .trim()
        .replace(/[%_]/g, "");
      if (fragment) {
        const pattern = `%@${fragment}%`;
        query = query.ilike("email", pattern);
      }
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, error, count } = await query.range(from, to);

    if (error) throw error;

    const total = count ?? 0;

    return NextResponse.json({
      users: data ?? [],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error: unknown) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
