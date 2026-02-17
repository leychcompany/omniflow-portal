import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";

const BUCKET = "images";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function POST(req: NextRequest) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string)?.trim();

    if (!file || !file.size) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (!folder || !["news", "training"].includes(folder)) {
      return NextResponse.json(
        { error: "folder must be 'news' or 'training'" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size must be under 5 MB" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, GIF, and WebP images are allowed" },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop() || "jpg";
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${folder}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload: " + uploadError.message },
        { status: 500 }
      );
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(path);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error: unknown) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload" },
      { status: 500 }
    );
  }
}
