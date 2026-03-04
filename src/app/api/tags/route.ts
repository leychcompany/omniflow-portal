import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("tags")
      .select("id, name")
      .order("name");

    if (error) {
      if (error.code === "42P01") return NextResponse.json([]);
      throw error;
    }

    return NextResponse.json(data ?? []);
  } catch (error: unknown) {
    console.error("Error fetching tags:", error);
    return NextResponse.json([]);
  }
}
