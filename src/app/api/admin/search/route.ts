import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";

const SEARCH_LIMIT = 5;

export async function GET(req: NextRequest) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) return auth.response;

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({
      users: [],
      manuals: [],
      courses: [],
      news: [],
      software: [],
    });
  }

  const term = `%${q.replace(/,/g, " ")}%`;

  try {
    const [usersRes, manualsRes, coursesRes, newsRes, softwareRes] = await Promise.all([
      // Users: email, name, first_name, last_name
      supabaseAdmin
        .from("users")
        .select("id, email, name, first_name, last_name")
        .or(`email.ilike.${term},name.ilike.${term},first_name.ilike.${term},last_name.ilike.${term}`)
        .limit(SEARCH_LIMIT),
      // Manuals
      supabaseAdmin
        .from("manuals")
        .select("id, title, filename")
        .or(`title.ilike.${term},description.ilike.${term},filename.ilike.${term}`)
        .order("title")
        .limit(SEARCH_LIMIT),
      // Courses
      supabaseAdmin
        .from("courses")
        .select("id, title")
        .or(`title.ilike.${term},description.ilike.${term},topics.ilike.${term},format.ilike.${term}`)
        .limit(SEARCH_LIMIT),
      // News articles
      supabaseAdmin
        .from("news_articles")
        .select("id, title, excerpt")
        .or(`title.ilike.${term},excerpt.ilike.${term}`)
        .limit(SEARCH_LIMIT),
      // Software
      supabaseAdmin
        .from("software")
        .select("id, title")
        .or(`title.ilike.${term},description.ilike.${term}`)
        .limit(SEARCH_LIMIT),
    ]);

    const users = (usersRes.data ?? []).map((u: Record<string, unknown>) => {
      const name = (u.name as string) || [u.first_name, u.last_name].filter(Boolean).join(" ") || String(u.email || "").split("@")[0] || "—";
      return {
        id: u.id,
        label: name,
        sublabel: u.email,
        href: `/admin/users/${u.id}`,
      };
    });

    const manuals = (manualsRes.data ?? []).map((m: Record<string, unknown>) => ({
      id: m.id,
      label: m.title,
      sublabel: m.filename,
      href: `/admin/documents/${encodeURIComponent(String(m.id))}/edit`,
    }));

    const courses = (coursesRes.data ?? []).map((c: Record<string, unknown>) => ({
      id: c.id,
      label: c.title,
      sublabel: null,
      href: `/admin/training?edit=${encodeURIComponent(String(c.id))}`,
    }));

    const news = (newsRes.data ?? []).map((n: Record<string, unknown>) => ({
      id: n.id,
      label: n.title,
      sublabel: n.excerpt ? String(n.excerpt).slice(0, 60) + "…" : null,
      href: `/admin/news?edit=${encodeURIComponent(String(n.id))}`,
    }));

    const software = (softwareRes.data ?? []).map((s: Record<string, unknown>) => ({
      id: s.id,
      label: s.title,
      sublabel: null,
      href: `/admin/software?edit=${encodeURIComponent(String(s.id))}`,
    }));

    return NextResponse.json({
      users,
      manuals,
      courses,
      news,
      software,
    });
  } catch (err) {
    console.error("Admin search error:", err);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
