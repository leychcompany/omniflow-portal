import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";

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
    const body = await req.json();
    const { id, title, description, duration, thumbnail, instructor, featured, sort_order } = body;

    if (!id || !title) {
      return NextResponse.json(
        { error: "id and title are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("courses")
      .insert({
        id: String(id).trim(),
        title,
        description: description ?? null,
        duration: duration ?? "In Person",
        thumbnail: thumbnail ?? null,
        instructor: instructor ?? null,
        featured: featured ?? false,
        sort_order: sort_order ?? 0,
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
