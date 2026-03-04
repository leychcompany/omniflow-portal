import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";

const DEFAULT_LIMIT = 100;

export async function GET(req: NextRequest) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const eventType = searchParams.get("event_type");
    const userId = searchParams.get("user_id");
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
      500
    );
    const offset = parseInt(searchParams.get("offset") ?? "0", 10) || 0;

    let query = supabaseAdmin
      .from("activity_events")
      .select("id, event_type, user_id, resource_type, resource_id, metadata, created_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (eventType) {
      query = query.eq("event_type", eventType);
    }
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data: events, error, count } = await query;

    if (error) {
      console.error("Analytics events error:", error);
      return NextResponse.json(
        { error: "Failed to fetch events" },
        { status: 500 }
      );
    }

    const userIds = [...new Set((events ?? []).map((e) => e.user_id))];
    const { data: usersData } = userIds.length
      ? await supabaseAdmin
          .from("users")
          .select("id, email, name")
          .in("id", userIds)
      : { data: [] };
    const userMap = new Map(
      (usersData ?? []).map((u) => [u.id, { email: u.email, name: u.name }])
    );

    const rows = (events ?? []).map((row) => {
      const user = userMap.get(row.user_id);
      const metadata = (row.metadata as Record<string, unknown>) ?? {};
      const resourceLabel =
        row.resource_type === "manual" && metadata.title
          ? String(metadata.title)
          : row.resource_type && row.resource_id
            ? `${row.resource_type}:${row.resource_id}`
            : "-";

      return {
        id: row.id,
        event_type: row.event_type,
        user_id: row.user_id,
        user_email: user?.email ?? null,
        user_name: user?.name ?? null,
        resource_type: row.resource_type,
        resource_id: row.resource_id,
        resource_label: resourceLabel,
        metadata,
        created_at: row.created_at,
      };
    });

    return NextResponse.json({
      events: rows,
      total: count ?? rows.length,
    });
  } catch (error: unknown) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
