# UX Dashboard Improvements – Planning

Planning document for implementing all UX enhancements on the home dashboard.

---

## 1. Dark Mode

**Status:** [x] Done  
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
- [x] Audit current theme setup
- [x] Define design tokens (light + dark palette)
- [x] Add theme toggle in header/settings
- [x] Apply dark styles to: sidebar, cards, carousels, stats, modals
- [x] Ensure contrast and readability
- [x] Test with `prefers-color-scheme`

### Dependencies
- None

---

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

**Status:** [x] Done  
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
- [x] Create `Skeleton` or `SkeletonCard` component
- [x] Match dimensions to real content
- [x] Add shimmer animation (optional)
- [x] Replace Loader2 with skeletons in home
- [x] Apply to other pages (documents, software, news, training)
- [x] Ensure no layout shift when content loads

### Dependencies
- None

---

## Implementation Order

Suggested order by impact vs effort:

| Order | Item         | Rationale                        |
|-------|--------------|----------------------------------|
| 1     | Skeleton     | Quick win, immediate UX gain [x]   |
| 2     | Dark Mode    | Strong visual impact, common ask [x] |
| 3     | Mini Charts  | Requires backend, good differentiator |

---

## Notes

- Keep components small and reusable
- All copy in English
- Test on mobile for all changes
- Consider `prefers-reduced-motion` for animations
