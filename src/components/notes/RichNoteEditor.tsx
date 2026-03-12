import { useEffect } from "react";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading1,
  Heading2,
  Highlighter,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
  Underline as UnderlineIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RichNoteEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export function RichNoteEditor({ content, onChange }: RichNoteEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: "list-disc pl-5",
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal pl-5",
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: "border-l-4 border-primary/30 pl-4 italic text-foreground/80",
          },
        },
      }),
      Placeholder.configure({
        placeholder: "Write freely. Capture long-form notes, meeting recaps, research, or drafts...",
      }),
      Underline,
      Highlight.configure({
        multicolor: false,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "notey-editor min-h-[420px] w-full rounded-[28px] border border-white/80 bg-white/80 px-6 py-5 text-[15px] leading-7 text-foreground shadow-soft focus:outline-none",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    if (editor.getHTML() !== content) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const tools = [
    {
      icon: Bold,
      label: "Bold",
      active: editor.isActive("bold"),
      onClick: () => editor.chain().focus().toggleBold().run(),
    },
    {
      icon: Italic,
      label: "Italic",
      active: editor.isActive("italic"),
      onClick: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      icon: UnderlineIcon,
      label: "Underline",
      active: editor.isActive("underline"),
      onClick: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      icon: Heading1,
      label: "Heading 1",
      active: editor.isActive("heading", { level: 1 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      icon: Heading2,
      label: "Heading 2",
      active: editor.isActive("heading", { level: 2 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      icon: List,
      label: "Bullet list",
      active: editor.isActive("bulletList"),
      onClick: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      icon: ListOrdered,
      label: "Ordered list",
      active: editor.isActive("orderedList"),
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      icon: Quote,
      label: "Quote",
      active: editor.isActive("blockquote"),
      onClick: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      icon: Highlighter,
      label: "Highlight",
      active: editor.isActive("highlight"),
      onClick: () => editor.chain().focus().toggleHighlight().run(),
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap gap-2 rounded-[24px] border border-white/80 bg-white/75 p-3 shadow-soft">
        {tools.map(({ icon: Icon, label, active, onClick }) => (
          <Button
            key={label}
            type="button"
            variant={active ? "secondary" : "ghost"}
            size="sm"
            className={cn("rounded-2xl", active && "border border-white/70")}
            onClick={onClick}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        ))}
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="ghost" size="sm" className="rounded-2xl" onClick={() => editor.chain().focus().undo().run()}>
            <Undo2 className="h-4 w-4" />
            Undo
          </Button>
          <Button type="button" variant="ghost" size="sm" className="rounded-2xl" onClick={() => editor.chain().focus().redo().run()}>
            <Redo2 className="h-4 w-4" />
            Redo
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
