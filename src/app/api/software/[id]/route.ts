import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { getStorageErrorMessage } from "@/lib/storage-error-message";

const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1 GB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(_req);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const { data: item, error } = await supabaseAdmin
      .from("software")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !item) {
      return NextResponse.json({ error: "Software not found" }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error: unknown) {
    console.error("Error fetching software:", error);
    return NextResponse.json(
      { error: "Failed to fetch software" },
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
    const { id } = await params;
    const contentType = req.headers.get("content-type") ?? "";
    const updates: Record<string, unknown> = {};

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const title = (formData.get("title") as string)?.trim();
      const description = (formData.get("description") as string)?.trim() || null;
      const image_url = (formData.get("image_url") as string)?.trim() || null;
      const file = formData.get("file") as File | null;

      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (image_url !== undefined) updates.image_url = image_url;

      if (file && file.size) {
        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: "File size must be under 1 GB" },
            { status: 400 }
          );
        }
        const isZip =
          file.type === "application/zip" ||
          file.type === "application/x-zip-compressed" ||
          file.name.toLowerCase().endsWith(".zip");
        if (!isZip) {
          return NextResponse.json(
            { error: "Only ZIP files are allowed" },
            { status: 400 }
          );
        }

        const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storage_path = filename;

        const { error: uploadError } = await supabaseAdmin.storage
          .from("software")
          .upload(storage_path, file, {
            contentType: file.type,
            upsert: true,
          });

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          return NextResponse.json(
            { error: getStorageErrorMessage(uploadError) },
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
      if (body.description !== undefined) updates.description = body.description;
      if (body.image_url !== undefined) updates.image_url = body.image_url;
      if (body.filename !== undefined) updates.filename = body.filename;
      if (body.storage_path !== undefined) updates.storage_path = body.storage_path;
      if (body.size !== undefined) updates.size = body.size;
    }

    const { data, error } = await supabaseAdmin
      .from("software")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Error updating software:", error);
    return NextResponse.json(
      { error: "Failed to update software" },
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

    const { error } = await supabaseAdmin.from("software").delete().eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting software:", error);
    return NextResponse.json(
      { error: "Failed to delete software" },
      { status: 500 }
    );
  }
}
