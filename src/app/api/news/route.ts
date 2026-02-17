import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("news_articles")
      .select("*")
      .order("published_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (error: unknown) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}

const normalizeSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export async function POST(req: NextRequest) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { title, excerpt, content, image_url, featured, published_at } = body;

    if (!title || !published_at) {
      return NextResponse.json(
        { error: "title and published_at are required" },
        { status: 400 }
      );
    }

    const slug = body.slug ? normalizeSlug(body.slug) : normalizeSlug(title);

    const { data, error } = await supabaseAdmin
      .from("news_articles")
      .insert({
        title,
        slug,
        excerpt: excerpt ?? null,
        content: content ?? null,
        image_url: image_url ?? null,
        featured: featured ?? false,
        published_at,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Error creating news article:", error);
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
}
