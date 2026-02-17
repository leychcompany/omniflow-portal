import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";

const SIGNED_URL_EXPIRY = 3600; // 1 hour

export async function GET() {
  try {
    const { data: manuals, error } = await supabaseAdmin
      .from("manuals")
      .select("*")
      .order("category")
      .order("title");

    if (error) throw error;

    const manualsWithUrls = await Promise.all(
      (manuals ?? []).map(async (manual) => {
        let downloadUrl = manual.storage_path;
        try {
          const { data: signed } = await supabaseAdmin.storage
            .from("manuals")
            .createSignedUrl(manual.storage_path, SIGNED_URL_EXPIRY);
          if (signed?.signedUrl) downloadUrl = signed.signedUrl;
        } catch {
          // If bucket doesn't exist or file missing, keep storage_path
        }
        return {
          ...manual,
          path: downloadUrl,
          download_url: downloadUrl,
        };
      })
    );

    return NextResponse.json(manualsWithUrls);
  } catch (error: unknown) {
    console.error("Error fetching manuals:", error);
    return NextResponse.json(
      { error: "Failed to fetch manuals" },
      { status: 500 }
    );
  }
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_TYPES = ["application/pdf"];

export async function POST(req: NextRequest) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const contentType = req.headers.get("content-type") ?? "";
    let title: string;
    let category: string;
    let filename: string;
    let storage_path: string;
    let size: string | null = null;
    let description: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      title = (formData.get("title") as string)?.trim();
      category = (formData.get("category") as string)?.trim();
      description = (formData.get("description") as string)?.trim() || null;
      const file = formData.get("file") as File | null;

      if (!title || !category) {
        return NextResponse.json(
          { error: "title and category are required" },
          { status: 400 }
        );
      }

      if (!file || !file.size) {
        return NextResponse.json(
          { error: "PDF file is required" },
          { status: 400 }
        );
      }

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

      filename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const safeCategory = category.replace(/[^a-zA-Z0-9_-]/g, "_");
      storage_path = `${safeCategory}/${filename}`;

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

      size = formatFileSize(file.size);
    } else {
      const body = await req.json();
      const b = body as {
        title?: string;
        category?: string;
        filename?: string;
        storage_path?: string;
        size?: string;
        description?: string;
      };
      title = b.title?.trim() ?? "";
      category = b.category?.trim() ?? "";
      filename = b.filename?.trim() ?? "";
      storage_path = b.storage_path?.trim() ?? "";
      size = b.size ?? null;
      description = b.description ?? null;

      if (!title || !category || !filename || !storage_path) {
        return NextResponse.json(
          { error: "title, category, filename, and storage_path are required" },
          { status: 400 }
        );
      }
    }

    const { data, error } = await supabaseAdmin
      .from("manuals")
      .insert({
        title,
        category,
        filename,
        storage_path,
        size: size ?? null,
        description: description ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Error creating manual:", error);
    return NextResponse.json(
      { error: "Failed to create manual" },
      { status: 500 }
    );
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
