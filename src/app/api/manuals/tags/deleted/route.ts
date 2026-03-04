import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("deleted_tags")
      .select("tag_lower")
      .order("tag_lower");

    if (error) {
      if (error.code === "42P01") return NextResponse.json([]);
      throw error;
    }

    const deleted = (data ?? []).map((r) => r.tag_lower);
    return NextResponse.json(deleted);
  } catch (error: unknown) {
    console.error("Error fetching deleted tags:", error);
    return NextResponse.json([]);
  }
}
