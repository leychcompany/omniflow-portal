/**
 * Single request for admin entry: profile + dashboard data.
 * Replaces two sequential calls (profile + dashboard) with one.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.ok) return auth.response;

  const { userId } = auth;
  const since14d = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const [profileRes, countsRes, chartEventsRes, adminAndRecentRes, manualTagsRes] =
      await Promise.all([
        supabaseAdmin
          .from("users")
          .select("id, email, name, first_name, last_name, company, title, role, locked, created_at, updated_at")
          .eq("id", userId)
          .single(),
        Promise.all([
          supabaseAdmin.from("users").select("id", { count: "exact", head: true }),
          supabaseAdmin.from("manuals").select("id", { count: "exact", head: true }),
          supabaseAdmin.from("courses").select("id", { count: "exact", head: true }),
          supabaseAdmin.from("news_articles").select("id", { count: "exact", head: true }),
          supabaseAdmin.from("software").select("id", { count: "exact", head: true }),
          supabaseAdmin.from("invites").select("id", { count: "exact", head: true }).is("used", false),
        ]),
        supabaseAdmin
          .from("activity_events")
          .select("event_type, created_at")
          .gte("created_at", since14d)
          .order("created_at", { ascending: true }),
        Promise.all([
          supabaseAdmin.from("users").select("id").eq("role", "admin"),
          supabaseAdmin
            .from("activity_events")
            .select("id, event_type, user_id, resource_type, resource_id, metadata, created_at")
            .order("created_at", { ascending: false })
            .limit(15),
        ]),
        supabaseAdmin.from("manual_tags").select("tag_id, tags(name)"),
      ]);

    if (profileRes.error || !profileRes.data) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const profile = profileRes.data;
    const usersCount = (countsRes[0] as { count?: number })?.count ?? 0;
    const manualsCount = (countsRes[1] as { count?: number })?.count ?? 0;
    const coursesCount = (countsRes[2] as { count?: number })?.count ?? 0;
    const newsCount = (countsRes[3] as { count?: number })?.count ?? 0;
    const softwareCount = (countsRes[4] as { count?: number })?.count ?? 0;
    const invitesCount = (countsRes[5] as { count?: number })?.count ?? 0;

    const recentEvents = (chartEventsRes as { data?: { event_type: string; created_at: string }[] }).data ?? [];
    const adminData = (adminAndRecentRes[0] as { data?: { id: string }[] }).data ?? [];
    const recentActivityRaw =
      (adminAndRecentRes[1] as {
        data?: {
          id: string;
          user_id: string;
          event_type: string;
          resource_type: string | null;
          resource_id: string | null;
          metadata: unknown;
          created_at: string;
        }[];
      }).data ?? [];
    const manualTagsData = (manualTagsRes as { data?: { tags: unknown }[] }).data ?? [];

    const adminCount = adminData.length;

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

    for (const e of recentEvents) {
      const dateStr = (e.created_at as string).slice(0, 10);
      const row = dayMap.get(dateStr);
      if (!row) continue;
      if (e.event_type === "login") row.logins += 1;
      else if (e.event_type === "document_download" || e.event_type === "software_download")
        row.downloads += 1;
    }

    const userIds = [...new Set(recentActivityRaw.map((e) => e.user_id).filter(Boolean))];
    const { data: usersData } =
      userIds.length > 0
        ? await supabaseAdmin.from("users").select("id, email, name").in("id", userIds)
        : { data: [] };
    const userMap = new Map(
      (usersData ?? []).map((u) => [u.id, { email: u.email, name: u.name }])
    );

    const recentActivity = recentActivityRaw.map((row) => {
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

    const tagCounts = new Map<string, number>();
    for (const row of manualTagsData) {
      const tags = row.tags as unknown;
      const name =
        tags && typeof tags === "object" && !Array.isArray(tags) && "name" in tags
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

    const dashboard = {
      counts: {
        users: usersCount,
        admins: adminCount,
        manuals: manualsCount,
        courses: coursesCount,
        news: newsCount,
        software: softwareCount,
        invites: invitesCount,
      },
      activityByDay: days,
      recentActivity,
      totals7d,
      topTags,
    };

    return NextResponse.json(
      { profile, dashboard },
      {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      }
    );
  } catch (error) {
    console.error("Admin bootstrap error:", error);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
