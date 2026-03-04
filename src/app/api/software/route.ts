import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { getStorageErrorMessage } from "@/lib/storage-error-message";

const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1 GB
const ALLOWED_TYPES = ["application/zip", "application/x-zip-compressed"];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export async function GET() {
  try {
    const { data: software, error } = await supabaseAdmin
      .from("software")
      .select("*")
      .order("title");

    if (error) throw error;
    return NextResponse.json(software ?? []);
  } catch (error: unknown) {
    console.error("Error fetching software:", error);
    return NextResponse.json(
      { error: "Failed to fetch software" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "multipart/form-data required" },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const title = (formData.get("title") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || null;
    const image_url = (formData.get("image_url") as string)?.trim() || null;
    const file = formData.get("file") as File | null;

    if (!title) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    if (!file || !file.size) {
      return NextResponse.json(
        { error: "ZIP file is required" },
        { status: 400 }
      );
    }

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

    const size = formatFileSize(file.size);

    const { data: item, error } = await supabaseAdmin
      .from("software")
      .insert({
        title,
        filename,
        storage_path,
        size,
        description,
        image_url,
      })
      .select()
      .single();

    if (error) throw error;
    if (!item) throw new Error("Insert failed");

    return NextResponse.json(item);
  } catch (error: unknown) {
    console.error("Error creating software:", error);
    return NextResponse.json(
      { error: "Failed to create software" },
      { status: 500 }
    );
  }
}
