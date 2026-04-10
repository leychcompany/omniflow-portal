import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";

function parseMoney(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

/** Public read (same as GET /api/courses). Admin not required. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin
      .from("courses")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const preId = data.prerequisite_course_id as string | null | undefined;
    let prerequisite: { id: string; title: string } | null = null;
    if (preId) {
      const { data: pre } = await supabaseAdmin
        .from("courses")
        .select("id, title")
        .eq("id", preId)
        .single();
      if (pre) prerequisite = pre;
    }

    return NextResponse.json({ ...data, prerequisite });
  } catch (error: unknown) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      { error: "Failed to fetch course" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { sanitizeCourseHtml } = await import("@/lib/sanitize-course-html");
    const { id } = await params;
    const body = await req.json();

    const patch: Record<string, unknown> = {
      title: body.title,
      duration: body.duration,
      thumbnail: body.thumbnail,
      featured: body.featured,
      sort_order: body.sort_order,
    };

    if ("description" in body) {
      patch.description = sanitizeCourseHtml(body.description);
    }
    if ("topics" in body) {
      patch.topics = sanitizeCourseHtml(
        typeof body.topics === "string" ? body.topics : null
      );
    }
    if ("price" in body) {
      patch.price = parseMoney(body.price);
    }
    if ("early_bird_price" in body) {
      patch.early_bird_price = parseMoney(body.early_bird_price);
    }
    if ("format" in body) {
      patch.format =
        typeof body.format === "string" && body.format.trim()
          ? body.format.trim()
          : null;
    }
    if ("prerequisite_course_id" in body) {
      const preRaw = body.prerequisite_course_id;
      if (preRaw === null || preRaw === undefined || preRaw === "") {
        patch.prerequisite_course_id = null;
      } else {
        const s = String(preRaw).trim();
        if (s === id) {
          return NextResponse.json(
            { error: "Prerequisite cannot be the same course" },
            { status: 400 }
          );
        }
        patch.prerequisite_course_id = s || null;
      }
    }

    const { data, error } = await supabaseAdmin
      .from("courses")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    let prerequisite: { id: string; title: string } | null = null;
    if (data?.prerequisite_course_id) {
      const { data: pre } = await supabaseAdmin
        .from("courses")
        .select("id, title")
        .eq("id", data.prerequisite_course_id)
        .single();
      if (pre) prerequisite = pre;
    }

    return NextResponse.json({ ...data, prerequisite });
  } catch (error: unknown) {
    console.error("Error updating course:", error);
    return NextResponse.json(
      { error: "Failed to update course" },
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

    const { error } = await supabaseAdmin.from("courses").delete().eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting course:", error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 }
    );
  }
}
