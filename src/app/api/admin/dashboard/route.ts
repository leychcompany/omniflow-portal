import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const [
      { count: usersCount },
      { count: manualsCount },
      { count: coursesCount },
      { count: newsCount },
      { count: softwareCount },
      { count: invitesCount },
      { data: recentEvents },
    ] = await Promise.all([
      supabaseAdmin.from("users").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("manuals").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("courses").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("news_articles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("software").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("invites").select("id", { count: "exact", head: true }).is("used", false),
      supabaseAdmin
        .from("activity_events")
        .select("event_type, created_at")
        .gte("created_at", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: true }),
    ]);

    const days: { date: string; label: string; logins: number; downloads: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        date: dateStr,
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        logins: 0,
        downloads: 0,
      });
    }
    const dayMap = new Map(days.map((d) => [d.date, d]));

    for (const e of recentEvents ?? []) {
      const dateStr = (e.created_at as string).slice(0, 10);
      const row = dayMap.get(dateStr);
      if (!row) continue;
      if (e.event_type === "login") row.logins += 1;
      else if (e.event_type === "document_download" || e.event_type === "software_download") row.downloads += 1;
    }

    const [
      { data: adminData },
      { data: recentActivityRaw },
    ] = await Promise.all([
      supabaseAdmin.from("users").select("id").eq("role", "admin"),
      supabaseAdmin
        .from("activity_events")
        .select("id, event_type, user_id, resource_type, resource_id, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(15),
    ]);
    const adminCount = adminData?.length ?? 0;

    const userIds = [...new Set((recentActivityRaw ?? []).map((e) => e.user_id).filter(Boolean))];
    const { data: usersData } = userIds.length
      ? await supabaseAdmin.from("users").select("id, email, name").in("id", userIds)
      : { data: [] };
    const userMap = new Map(
      (usersData ?? []).map((u) => [u.id, { email: u.email, name: u.name }])
    );

    const recentActivity = (recentActivityRaw ?? []).map((row) => {
      const user = userMap.get(row.user_id);
      const metadata = (row.metadata as Record<string, unknown>) ?? {};
      const resourceLabel =
        (row.resource_type === "manual" || row.resource_type === "software") && metadata.title
          ? String(metadata.title)
          : row.resource_type && row.resource_id
            ? `${row.resource_type}:${row.resource_id}`
            : null;
      return {
        id: row.id,
        event_type: row.event_type,
        user_email: user?.email ?? null,
        user_name: user?.name ?? null,
        resource_label: resourceLabel,
        created_at: row.created_at,
      };
    });

    const last7Days = days.slice(-7);
    const totals7d = {
      logins: last7Days.reduce((s, d) => s + d.logins, 0),
      downloads: last7Days.reduce((s, d) => s + d.downloads, 0),
    };

    const { data: manualTagsData } = await supabaseAdmin
      .from("manual_tags")
      .select("tag_id, tags(name)");
    const tagCounts = new Map<string, number>();
    for (const row of manualTagsData ?? []) {
      const tags = row.tags as unknown;
      const name = (tags && typeof tags === "object" && !Array.isArray(tags) && "name" in tags)
        ? String((tags as { name: unknown }).name || "").trim()
        : null;
      if (name) {
        tagCounts.set(name, (tagCounts.get(name) ?? 0) + 1);
      }
    }
    const topTags = [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    return NextResponse.json({
      counts: {
        users: usersCount ?? 0,
        admins: adminCount,
        manuals: manualsCount ?? 0,
        courses: coursesCount ?? 0,
        news: newsCount ?? 0,
        software: softwareCount ?? 0,
        invites: invitesCount ?? 0,
      },
      activityByDay: days,
      recentActivity,
      totals7d,
      topTags,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
