import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAuth } from "@/lib/verify-auth";

const EXT_TO_MIME: Record<string, string> = {
  zip: "application/zip",
  exe: "application/x-msdownload",
};

function getContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  return (ext && EXT_TO_MIME[ext]) || "application/octet-stream";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuth(req);
  if (!auth.ok) return auth.response;

  const { data: userRow } = await supabaseAdmin
    .from("users")
    .select("locked")
    .eq("id", auth.userId)
    .single();
  if (userRow?.locked) {
    return NextResponse.json(
      { error: "Account pending approval. This feature will be available once an administrator unlocks your account." },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const { data: item, error } = await supabaseAdmin
      .from("software")
      .select("id, title, filename, storage_path")
      .eq("id", id)
      .single();

    if (error || !item) {
      return NextResponse.json({ error: "Software not found" }, { status: 404 });
    }

    const { data: blob, error: downloadError } = await supabaseAdmin.storage
      .from("software")
      .download(item.storage_path);

    if (downloadError || !blob) {
      console.error("Storage download error:", downloadError);
      return NextResponse.json(
        { error: "Failed to fetch file" },
        { status: 500 }
      );
    }

    await supabaseAdmin.from("activity_events").insert({
      event_type: "software_download",
      user_id: auth.userId,
      resource_type: "software",
      resource_id: item.id,
      metadata: { title: item.title, filename: item.filename },
    });

    const contentType = getContentType(item.filename);
    const disposition = `attachment; filename="${item.filename.replace(/"/g, '\\"')}"`;

    return new NextResponse(blob, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": disposition,
      },
    });
  } catch (error: unknown) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Failed to process download" },
      { status: 500 }
    );
  }
}
