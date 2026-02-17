import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";

const normalizeSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await req.json();

    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.slug !== undefined) updates.slug = normalizeSlug(body.slug);
    else if (body.title !== undefined) updates.slug = normalizeSlug(body.title);
    if (body.excerpt !== undefined) updates.excerpt = body.excerpt;
    if (body.content !== undefined) updates.content = body.content;
    if (body.image_url !== undefined) updates.image_url = body.image_url;
    if (body.featured !== undefined) updates.featured = body.featured;
    if (body.published_at !== undefined) updates.published_at = body.published_at;

    const { data, error } = await supabaseAdmin
      .from("news_articles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Error updating news article:", error);
    return NextResponse.json(
      { error: "Failed to update article" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(_req);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from("news_articles")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting news article:", error);
    return NextResponse.json(
      { error: "Failed to delete article" },
      { status: 500 }
    );
  }
}
