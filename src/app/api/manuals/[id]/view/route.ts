import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";

const SIGNED_URL_EXPIRY = 3600;

/**
 * Creates a signed URL and redirects - used for "Open PDF" in admin list.
 * Avoids creating N signed URLs when loading the list.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const { data: manual, error } = await supabaseAdmin
      .from("manuals")
      .select("storage_path")
      .eq("id", id)
      .single();

    if (error || !manual?.storage_path) {
      return NextResponse.json({ error: "Manual not found" }, { status: 404 });
    }

    const { data: signed } = await supabaseAdmin.storage
      .from("manuals")
      .createSignedUrl(manual.storage_path, SIGNED_URL_EXPIRY);

    if (!signed?.signedUrl) {
      return NextResponse.json({ error: "Failed to create view URL" }, { status: 500 });
    }

    return NextResponse.redirect(signed.signedUrl);
  } catch (error: unknown) {
    console.error("Manuals view error:", error);
    return NextResponse.json(
      { error: "Failed to open document" },
      { status: 500 }
    );
  }
}
