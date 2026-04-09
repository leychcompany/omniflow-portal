"use client";

import type { ReactNode } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Strikethrough,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      title={title}
      className={cn(
        "h-8 w-8 shrink-0 p-0",
        active && "bg-zinc-200 dark:bg-white/15"
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}

type RichTextEditorProps = {
  initialContent: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  placeholder?: string;
  "aria-label"?: string;
  minHeight?: string;
};

export function RichTextEditor({
  initialContent,
  onChange,
  disabled,
  placeholder,
  "aria-label": ariaLabel,
  minHeight = "160px",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "",
      }),
    ],
    content: initialContent?.trim() ? initialContent : "<p></p>",
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  if (!editor) {
    return (
      <div
        className="rounded-lg border border-zinc-200 bg-zinc-50 dark:border-white/[0.12] dark:bg-white/[0.04]"
        style={{ minHeight }}
      />
    );
  }

  return (
    <div className="rich-text-editor overflow-hidden rounded-lg border border-zinc-200 dark:border-white/[0.12]">
      <div
        className="flex flex-wrap gap-0.5 border-b border-zinc-200 bg-zinc-50 px-1.5 py-1 dark:border-white/[0.08] dark:bg-white/[0.04]"
        role="toolbar"
        aria-label={ariaLabel ? `${ariaLabel} toolbar` : "Text formatting"}
      >
        <ToolbarButton
          title="Bold"
          active={editor.isActive("bold")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Italic"
          active={editor.isActive("italic")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Strikethrough"
          active={editor.isActive("strike")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <div className="mx-0.5 w-px self-stretch bg-zinc-200 dark:bg-white/10" />
        <ToolbarButton
          title="Bullet list"
          active={editor.isActive("bulletList")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Numbered list"
          active={editor.isActive("orderedList")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <div className="mx-0.5 w-px self-stretch bg-zinc-200 dark:bg-white/10" />
        <ToolbarButton
          title="Undo"
          disabled={disabled}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Redo"
          disabled={disabled}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>
      </div>
      <EditorContent
        editor={editor}
        className="course-tiptap-editor max-w-none bg-white px-3 py-2 text-sm text-zinc-900 dark:bg-white/[0.04] dark:text-zinc-100"
        style={{ minHeight }}
      />
    </div>
  );
}
