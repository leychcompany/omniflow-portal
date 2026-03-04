import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const tagId = body.tagId ?? body.tag_id;
    const tagName = typeof body.tag === "string" ? body.tag.trim() : null;

    if (!tagId && !tagName) {
      return NextResponse.json(
        { error: "tagId or tag (name) is required" },
        { status: 400 }
      );
    }

    let tag: { id: string } | null = null;
    if (tagId) {
      const { data } = await supabaseAdmin
        .from("tags")
        .select("id")
        .eq("id", tagId)
        .single();
      tag = data;
    } else if (tagName) {
      const { data: rows } = await supabaseAdmin
        .from("tags")
        .select("id, name");
      const found = (rows ?? []).find(
        (r: { name: string }) =>
          r.name.toLowerCase() === (tagName ?? "").toLowerCase()
      );
      tag = found ?? null;
    }

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    const { error: unlinkError } = await supabaseAdmin
      .from("manual_tags")
      .delete()
      .eq("tag_id", tag.id);

    if (unlinkError) throw unlinkError;

    const { error: deleteError } = await supabaseAdmin
      .from("tags")
      .delete()
      .eq("id", tag.id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting tag:", error);
    return NextResponse.json(
      { error: "Failed to delete tag" },
      { status: 500 }
    );
  }
}
