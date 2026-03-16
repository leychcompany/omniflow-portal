import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { getStorageErrorMessage } from "@/lib/storage-error-message";

const SIGNED_URL_EXPIRY = 3600; // 1 hour

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

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10)));
    const q = (searchParams.get("q") ?? "").trim();

    let query = supabaseAdmin
      .from("manuals")
      .select(`
        *,
        manual_tags (
          tag_id,
          tags (id, name)
        )
      `, { count: "exact" })
      .order("title");

    if (q) {
      const safe = q.replace(/,/g, " ");
      const term = `%${safe}%`;
      query = query.or(`title.ilike.${term},description.ilike.${term},filename.ilike.${term}`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data: manuals, error, count } = await query.range(from, to);

    if (error) throw error;

    const total = count ?? 0;

    const result = (manuals ?? []).map((manual) => {
      const mtList = (manual as { manual_tags?: { tags: { name: string } | null }[] }).manual_tags ?? [];
      const tagNames = mtList.map((mt) => mt?.tags?.name).filter(Boolean) as string[];
      const tags = tagNames.length ? tagNames : (manual.category ? [manual.category] : []);
      const { manual_tags: _mt, storage_path: storagePath, ...rest } = manual as { manual_tags?: unknown; storage_path?: string };
      return {
        ...rest,
        tags,
        path: storagePath,
        download_url: null as string | null,
      };
    });

    return NextResponse.json({
      items: result,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error: unknown) {
    console.error("Error fetching manuals:", error);
    return NextResponse.json(
      { error: "Failed to fetch manuals" },
      { status: 500 }
    );
  }
}

const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1 GB
const ALLOWED_TYPES = ["application/pdf"];

export async function POST(req: NextRequest) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const contentType = req.headers.get("content-type") ?? "";
    let title: string;
    let tags: string[];
    let filename: string;
    let storage_path: string;
    let size: string | null = null;
    let description: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      title = (formData.get("title") as string)?.trim();
      const tagsRaw = formData.get("tags");
      const categoryRaw = (formData.get("category") as string)?.trim();
      tags = Array.isArray(tagsRaw)
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
      if (tags.length === 0 && categoryRaw) tags = [categoryRaw];
      description = (formData.get("description") as string)?.trim() || null;
      const file = formData.get("file") as File | null;

      if (!title) {
        return NextResponse.json(
          { error: "title is required" },
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
          { error: "File size must be under 1 GB" },
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
      const folder = tags[0]
        ? tags[0].replace(/[^a-zA-Z0-9_-]/g, "_")
        : "uncategorized";
      storage_path = `${folder}/${filename}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("manuals")
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

      size = formatFileSize(file.size);
    } else {
      const body = await req.json();
      const b = body as {
        title?: string;
        tags?: string[];
        filename?: string;
        storage_path?: string;
        size?: string;
        description?: string;
      };
      title = b.title?.trim() ?? "";
      const categoryFromBody = (b as { category?: string }).category?.trim();
      tags = Array.isArray(b.tags)
        ? b.tags.map((t) => String(t).trim()).filter(Boolean)
        : [];
      if (tags.length === 0 && categoryFromBody) tags = [categoryFromBody];
      filename = b.filename?.trim() ?? "";
      storage_path = b.storage_path?.trim() ?? "";
      size = b.size ?? null;
      description = b.description ?? null;

      if (!title || !filename || !storage_path) {
        return NextResponse.json(
          { error: "title, filename, and storage_path are required" },
          { status: 400 }
        );
      }
    }

    const category = tags.length > 0 ? tags[0] : null;
    const { data: manual, error } = await supabaseAdmin
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
    if (!manual) throw new Error("Insert failed");

    const tagIds = await getOrCreateTagIds(tags);
    if (tagIds.length > 0) {
      const { error: mtError } = await supabaseAdmin
        .from("manual_tags")
        .insert(tagIds.map((tag_id) => ({ manual_id: manual.id, tag_id })));
      if (mtError) throw mtError;
    }

    return NextResponse.json({ ...manual, tags });
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
