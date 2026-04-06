/**
 * Combine legacy `manuals.category` with junction-table tag names.
 * Previously the API used only junction tags when any existed, which hid values still stored on `category` (e.g. product line "4000").
 */
export function mergeManualTagNames(
  category: string | null | undefined,
  junctionTagNames: string[]
): string[] {
  const trimmedCat =
    typeof category === "string" && category.trim() ? category.trim() : null;
  const fromCategory = trimmedCat ? [trimmedCat] : [];
  const merged = [...fromCategory, ...junctionTagNames.map((t) => String(t).trim()).filter(Boolean)];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of merged) {
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}
