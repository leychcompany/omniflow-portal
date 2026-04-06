import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Next rank appended after current pinned manuals (for quick "pin" without a number).
 */
export async function getNextPinnedRank(): Promise<number> {
  const { data } = await supabaseAdmin
    .from("manuals")
    .select("pinned_rank")
    .not("pinned_rank", "is", null)
    .order("pinned_rank", { ascending: false })
    .limit(1)
    .maybeSingle();

  const max = data?.pinned_rank as number | null | undefined;
  return typeof max === "number" && Number.isFinite(max) ? max + 1 : 0;
}
