import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";

const SIGNED_URL_EXPIRY = 3600;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(_req);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const { data: manual, error } = await supabaseAdmin
      .from("manuals")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !manual) {
      return NextResponse.json({ error: "Manual not found" }, { status: 404 });
    }

    let downloadUrl = manual.storage_path;
    try {
      const { data: signed } = await supabaseAdmin.storage
        .from("manuals")
        .createSignedUrl(manual.storage_path, SIGNED_URL_EXPIRY);
      if (signed?.signedUrl) downloadUrl = signed.signedUrl;
    } catch {
      // keep storage_path if bucket/file missing
    }

    return NextResponse.json({
      ...manual,
      path: downloadUrl,
      download_url: downloadUrl,
    });
  } catch (error: unknown) {
    console.error("Error fetching manual:", error);
    return NextResponse.json(
      { error: "Failed to fetch manual" },
      { status: 500 }
    );
  }
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_TYPES = ["application/pdf"];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const contentType = req.headers.get("content-type") ?? "";
    const updates: Record<string, unknown> = {};

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const title = (formData.get("title") as string)?.trim();
      const category = (formData.get("category") as string)?.trim();
      const description = (formData.get("description") as string)?.trim() || null;
      const file = formData.get("file") as File | null;

      if (title !== undefined) updates.title = title;
      if (category !== undefined) updates.category = category;
      if (description !== undefined) updates.description = description;

      if (file && file.size) {
        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: "File size must be under 50 MB" },
            { status: 400 }
          );
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
          return NextResponse.json(
            { error: "Only PDF files are allowed" },
            { status: 400 }
          );
        }

        const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const safeCategory = (updates.category as string)?.replace(/[^a-zA-Z0-9_-]/g, "_") ?? "general";
        const storage_path = `${safeCategory}/${filename}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from("manuals")
          .upload(storage_path, file, {
            contentType: file.type,
            upsert: true,
          });

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          return NextResponse.json(
            { error: "Failed to upload file: " + uploadError.message },
            { status: 500 }
          );
        }

        updates.filename = filename;
        updates.storage_path = storage_path;
        updates.size = formatFileSize(file.size);
      }
    } else {
      const body = await req.json();
      if (body.title !== undefined) updates.title = body.title;
      if (body.category !== undefined) updates.category = body.category;
      if (body.filename !== undefined) updates.filename = body.filename;
      if (body.storage_path !== undefined) updates.storage_path = body.storage_path;
      if (body.size !== undefined) updates.size = body.size;
      if (body.description !== undefined) updates.description = body.description;
    }

    const { data, error } = await supabaseAdmin
      .from("manuals")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Error updating manual:", error);
    return NextResponse.json(
      { error: "Failed to update manual" },
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

    const { error } = await supabaseAdmin.from("manuals").delete().eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting manual:", error);
    return NextResponse.json(
      { error: "Failed to delete manual" },
      { status: 500 }
    );
  }
}
