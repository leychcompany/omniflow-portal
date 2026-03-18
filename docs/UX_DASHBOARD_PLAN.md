# UX Dashboard Improvements – Planning

Planning document for implementing all UX enhancements on the home dashboard.

---

## 1. Dark Mode

**Status:** [ ] Not started  
**Priority:** High  
**Effort:** Medium

### Description
Toggle between light and dark theme across the portal.

### Technical Notes
- Project already uses `next-themes`
- Check if dark mode is wired in layout/root
- Define CSS variables for light/dark (colors, backgrounds, borders)
- Persist preference (localStorage)

### Tasks
- [ ] Audit current theme setup
- [ ] Define design tokens (light + dark palette)
- [ ] Add theme toggle in header/settings
- [ ] Apply dark styles to: sidebar, cards, carousels, stats, modals
- [ ] Ensure contrast and readability
- [ ] Test with `prefers-color-scheme`

### Dependencies
- None

---

## 2. Draggable Widgets

**Status:** [ ] Not started  
**Priority:** Medium  
**Effort:** High

### Description
Allow users to reorder dashboard blocks (stats row, Software carousel, News carousel, Quick access).

### Technical Notes
- Use `@dnd-kit/core` + `@dnd-kit/sortable` (already in package.json)
- Persist layout in localStorage per user
- Fallback to default order if no saved layout

### Tasks
- [ ] Identify all draggable sections
- [ ] Wrap sections in DnD context
- [ ] Implement drag handles (subtle, non-intrusive)
- [ ] Save order to localStorage
- [ ] Load saved order on mount
- [ ] Add “Reset to default” in settings
- [ ] (Optional) Save to backend for cross-device sync

### Dependencies
- None

---

## 3. Mini Charts in Stats

**Status:** [ ] Not started  
**Priority:** Medium  
**Effort:** Medium

### Description
Small sparklines or mini charts in stat cards showing trends (e.g. downloads over last 7 days).

### Technical Notes
- Use `recharts` (already in package.json)
- Need API: `/api/analytics/trends` or similar
- Consider: document downloads, software downloads, logins
- Sparkline only (no axes, minimal styling)

### Tasks
- [ ] Define metrics per stat (e.g. Documents = doc downloads)
- [ ] Create/adapt API for trend data
- [ ] Add mini chart component (sparkline)
- [ ] Integrate into stat cards
- [ ] Handle empty/zero data
- [ ] Keep cards accessible (no critical info only in chart)

### Dependencies
- Backend: analytics/trends data

---

## 4. Empty States

**Status:** [ ] Not started  
**Priority:** High  
**Effort:** Low–Medium

### Description
Replace “No software yet” / “No courses yet” with clear, friendly empty states (illustration + copy).

### Locations
- Software carousel (no software)
- News carousel (no news)
- Documents page
- Training page
- Software page
- Quick access (if filtered to empty)

### Tasks
- [ ] Choose illustration style (e.g. Lucide icons, simple SVG, or external)
- [ ] Write copy for each empty state
- [ ] Create `EmptyState` component
- [ ] Add CTA where relevant (e.g. “Contact admin to add software”)
- [ ] Apply to all empty states

### Dependencies
- None (or optional illustration assets)

---

## 5. Skeleton Loading

**Status:** [ ] Not started  
**Priority:** High  
**Effort:** Low

### Description
Replace spinners with skeleton placeholders for stats, carousels, and lists.

### Locations
- Stats row (5 skeleton cards)
- Software carousel (skeleton cards)
- News carousel (skeleton cards)
- Quick access grid
- Any list/tables (documents, software, etc.)

### Tasks
- [ ] Create `Skeleton` or `SkeletonCard` component
- [ ] Match dimensions to real content
- [ ] Add shimmer animation (optional)
- [ ] Replace Loader2 with skeletons in home
- [ ] Apply to other pages (documents, software, news, training)
- [ ] Ensure no layout shift when content loads

### Dependencies
- None

---

## Implementation Order

Suggested order by impact vs effort:

| Order | Item         | Rationale                        |
|-------|--------------|----------------------------------|
| 1     | Skeleton     | Quick win, immediate UX gain      |
| 2     | Empty States | Easy, improves perceived quality  |
| 3     | Dark Mode    | Strong visual impact, common ask  |
| 4     | Mini Charts  | Requires backend, good differentiator |
| 5     | Draggable    | Most complex, nice-to-have        |

---

## Notes

- Keep components small and reusable
- All copy in English
- Test on mobile for all changes
- Consider `prefers-reduced-motion` for animations
