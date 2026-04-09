import DOMPurify from "isomorphic-dompurify";

/** Allowed tags for course description / topics (TipTap StarterKit subset). */
const SANITIZE: Parameters<typeof DOMPurify.sanitize>[1] = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "s",
    "u",
    "ul",
    "ol",
    "li",
    "span",
  ],
  ALLOWED_ATTR: ["class"],
};

export function sanitizeCourseHtml(
  input: string | null | undefined
): string | null {
  if (input == null) return null;
  const raw = String(input).trim();
  if (raw === "") return null;
  const cleaned = DOMPurify.sanitize(raw, SANITIZE).trim();
  if (cleaned === "" || cleaned === "<p></p>") return null;
  return cleaned;
}
