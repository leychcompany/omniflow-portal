import { supabaseAdmin } from "@/lib/supabase-admin";

/** Total users with role `admin` (entire table, not the current list page). */
export async function countGlobalAdmins(): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("role", "admin");

  if (error) throw error;
  return count ?? 0;
}
