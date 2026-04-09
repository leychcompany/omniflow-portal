"use client";

import { useMemo } from "react";
import DOMPurify from "isomorphic-dompurify";
import { cn } from "@/lib/utils";

const CONFIG: Parameters<typeof DOMPurify.sanitize>[1] = {
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

type SafeHtmlProps = {
  html: string | null | undefined;
  className?: string;
};

export function SafeHtml({ html, className }: SafeHtmlProps) {
  const safe = useMemo(() => {
    if (!html?.trim()) return null;
    return DOMPurify.sanitize(html, CONFIG);
  }, [html]);

  if (!safe) return null;

  return (
    <div
      className={cn(
        "course-safe-html text-slate-700 dark:text-zinc-300 [&_a]:text-blue-600 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_li]:my-0.5 [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_strong]:font-semibold",
        className
      )}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
