import sanitizeHtml from "sanitize-html";

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
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
  allowedAttributes: { span: ["class"] },
};

export function sanitizeCourseHtml(
  input: string | null | undefined
): string | null {
  if (input == null) return null;
  const raw = String(input).trim();
  if (raw === "") return null;
  const cleaned = sanitizeHtml(raw, SANITIZE_OPTIONS).trim();
  if (cleaned === "" || cleaned === "<p></p>") return null;
  return cleaned;
}
