/**
 * Sort manuals: pinned first (lower pinned_rank first), then title A–Z.
 * Matches public GET /api/manuals ordering for client-side filtering.
 */
export function sortManualsPinnedFirst<
  T extends { pinned_rank?: number | null; title: string },
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ar = a.pinned_rank;
    const br = b.pinned_rank;
    const aPinned = ar != null && Number.isFinite(Number(ar));
    const bPinned = br != null && Number.isFinite(Number(br));
    if (aPinned && bPinned) {
      const diff = Number(ar) - Number(br);
      if (diff !== 0) return diff;
    } else if (aPinned !== bPinned) {
      return aPinned ? -1 : 1;
    }
    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  });
}
