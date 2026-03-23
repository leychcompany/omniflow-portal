/**
 * Builds an iframe src for inline PDF preview so the page fits the viewer width.
 * Uses Adobe-style hash params; Chrome/Edge often honor zoom=page-width better than view=FitH.
 */
export function buildPdfInlinePreviewSrc(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed
  const base = trimmed.replace(/#.*$/, '')
  // zoom=page-width: fit width in Chrome/Edge built-in PDF viewer
  return `${base}#toolbar=1&zoom=page-width`
}
