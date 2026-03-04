import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";

const SIGNED_URL_EXPIRY = 3600;

async function getOrCreateTagIds(tagNames: string[]): Promise<string[]> {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const name of tagNames) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const { data: all } = await supabaseAdmin
      .from("tags")
      .select("id, name");
    const found = (all ?? []).find(
      (t: { name: string }) => t.name.toLowerCase() === key
    );
    if (found) {
      ids.push(found.id);
      continue;
    }
    const { data: inserted, error } = await supabaseAdmin
      .from("tags")
      .insert({ name: trimmed })
      .select("id")
      .single();
    if (inserted) {
      ids.push(inserted.id);
    } else if (error) {
      const { data: retry } = await supabaseAdmin
        .from("tags")
        .select("id, name");
      const retryFound = (retry ?? []).find(
        (t: { name: string }) => t.name.toLowerCase() === key
      );
      if (retryFound) ids.push(retryFound.id);
    }
  }
  return ids;
}

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
      .select(`
        *,
        manual_tags (
          tag_id,
          tags (id, name)
        )
      `)
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

    const tagNames = ((manual.manual_tags as { tags: { name: string } | null }[]) ?? [])
      .map((mt) => mt?.tags?.name)
      .filter(Boolean) as string[];
    const tags = tagNames.length ? tagNames : (manual.category ? [manual.category] : []);
    const { manual_tags: _mt, ...rest } = manual as { manual_tags?: unknown };
    return NextResponse.json({
      ...rest,
      tags,
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
    let tagsToSet: string[] | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const title = (formData.get("title") as string)?.trim();
      const tagsRaw = formData.get("tags");
      const tags = Array.isArray(tagsRaw)
        ? tagsRaw.map((t) => String(t).trim()).filter(Boolean)
        : typeof tagsRaw === "string"
          ? (() => {
              try {
                const parsed = JSON.parse(tagsRaw) as unknown;
                return Array.isArray(parsed)
                  ? parsed.map((t) => String(t).trim()).filter(Boolean)
                  : [];
              } catch {
                return tagsRaw ? [tagsRaw.trim()] : [];
              }
            })()
          : [];
      const description = (formData.get("description") as string)?.trim() || null;
      const file = formData.get("file") as File | null;

      if (title !== undefined) updates.title = title;
      if (tagsRaw !== undefined) {
        tagsToSet = tags;
        updates.category = tags.length > 0 ? tags[0] : null;
      }
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
        const folder = tags[0]
          ? tags[0].replace(/[^a-zA-Z0-9_-]/g, "_")
          : "uncategorized";
        const storage_path = `${folder}/${filename}`;

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
      if (body.tags !== undefined) {
        const tagsArr = Array.isArray(body.tags) ? body.tags : [];
        tagsToSet = tagsArr;
        updates.category = tagsArr.length > 0 ? tagsArr[0] : null;
      }
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

    if (tagsToSet !== undefined) {
      const { error: delError } = await supabaseAdmin
        .from("manual_tags")
        .delete()
        .eq("manual_id", id);
      if (delError) throw delError;
      const tagIds = await getOrCreateTagIds(tagsToSet);
      if (tagIds.length > 0) {
        const { error: mtError } = await supabaseAdmin
          .from("manual_tags")
          .insert(tagIds.map((tag_id) => ({ manual_id: id, tag_id })));
        if (mtError) throw mtError;
      }
    }

    let tags = tagsToSet;
    if (tags === undefined) {
      const { data: mtData } = await supabaseAdmin
        .from("manual_tags")
        .select("tag_id, tags(name)")
        .eq("manual_id", id);
      const rows = (mtData ?? []) as unknown as { tags: { name: string } | null }[];
      tags = rows.map((r) => r?.tags?.name).filter(Boolean) as string[];
      if (tags.length === 0 && (data as { category?: string })?.category) {
        tags = [(data as { category: string }).category];
      }
    }
    return NextResponse.json({ ...data, tags });
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
