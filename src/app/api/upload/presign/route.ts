import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";

const BUCKET = "images";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

export async function POST(req: NextRequest) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json().catch(() => ({}));
    const folder = (body.folder as string)?.trim();
    const filename = (body.filename as string)?.trim() || "image.jpg";
    const fileSize = typeof body.fileSize === "number" ? body.fileSize : 0;
    const contentType = (body.contentType as string)?.trim() || "";

    if (!folder || !["news", "training", "software"].includes(folder)) {
      return NextResponse.json(
        { error: "folder must be 'news', 'training', or 'software'" },
        { status: 400 }
      );
    }

    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size must be under 5 MB" },
        { status: 400 }
      );
    }

    if (contentType && !ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, GIF, and WebP images are allowed" },
        { status: 400 }
      );
    }

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${folder}/${Date.now()}-${safeName}`;

    const { data: signData, error: signError } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUploadUrl(path, { upsert: true });

    if (signError || !signData?.token) {
      console.error("Presign error:", signError);
      return NextResponse.json(
        { error: "Failed to create upload URL" },
        { status: 500 }
      );
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(path);

    return NextResponse.json({
      bucket: BUCKET,
      path,
      token: signData.token,
      publicUrl: urlData.publicUrl,
    });
  } catch (error: unknown) {
    console.error("Presign error:", error);
    return NextResponse.json(
      { error: "Failed to create upload URL" },
      { status: 500 }
    );
  }
}
