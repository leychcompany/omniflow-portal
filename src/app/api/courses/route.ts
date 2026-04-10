import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";

function parseMoney(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("courses")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (error: unknown) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { sanitizeCourseHtml } = await import("@/lib/sanitize-course-html");
    const body = await req.json();
    const {
      id,
      title,
      description,
      duration,
      thumbnail,
      featured,
      sort_order,
      topics,
      price,
      early_bird_price,
      format,
      prerequisite_course_id,
    } = body;

    if (!id || !title) {
      return NextResponse.json(
        { error: "id and title are required" },
        { status: 400 }
      );
    }

    const newId = String(id).trim();
    const preId =
      typeof prerequisite_course_id === "string" && prerequisite_course_id.trim()
        ? prerequisite_course_id.trim()
        : null;
    if (preId === newId) {
      return NextResponse.json(
        { error: "Prerequisite cannot be the same course" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("courses")
      .insert({
        id: newId,
        title,
        description: sanitizeCourseHtml(description),
        duration:
          typeof duration === "string" && duration.trim()
            ? duration.trim()
            : null,
        thumbnail: thumbnail ?? null,
        featured: featured ?? false,
        sort_order: sort_order ?? 0,
        topics: sanitizeCourseHtml(
          typeof topics === "string" ? topics : null
        ),
        price: parseMoney(price),
        early_bird_price: parseMoney(early_bird_price),
        format:
          typeof format === "string" && format.trim() ? format.trim() : null,
        prerequisite_course_id: preId,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Error creating course:", error);
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 }
    );
  }
}
