import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered, Heading2, Heading3, Undo2, Redo2, Quote, Code } from "lucide-react";

function ToolbarBtn({ active, onClick, title, children, testid }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      data-testid={testid}
      className={`p-1.5 rounded hover:bg-slate-100 text-slate-600 ${active ? "bg-slate-200 text-slate-900" : ""}`}
    >
      {children}
    </button>
  );
}

/**
 * Rich text editor built on TipTap. Emits HTML via onChange.
 * Supports markdown-style shortcuts (**bold**, *italic*, - list, ## H2, etc.) from StarterKit.
 */
export default function RichTextEditor({ value, onChange, placeholder = "Skriv note…", testid = "rich-editor" }) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] } })],
    content: value || "",
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[180px] px-3 py-2 text-slate-800",
        "data-placeholder": placeholder,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html === "<p></p>" ? "" : html);
    },
  });

  useEffect(() => {
    if (editor && value !== undefined && editor.getHTML() !== (value || "")) {
      editor.commands.setContent(value || "", false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border border-slate-300 rounded-md bg-white overflow-hidden" data-testid={testid}>
      <div className="flex items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-2 py-1 flex-wrap">
        <ToolbarBtn testid={`${testid}-bold`} title="Fed (Ctrl+B)" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-3.5 w-3.5" /></ToolbarBtn>
        <ToolbarBtn testid={`${testid}-italic`} title="Kursiv (Ctrl+I)" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-3.5 w-3.5" /></ToolbarBtn>
        <div className="w-px h-4 bg-slate-300 mx-1" />
        <ToolbarBtn testid={`${testid}-h2`} title="Overskrift (##)" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-3.5 w-3.5" /></ToolbarBtn>
        <ToolbarBtn testid={`${testid}-h3`} title="Underoverskrift (###)" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-3.5 w-3.5" /></ToolbarBtn>
        <div className="w-px h-4 bg-slate-300 mx-1" />
        <ToolbarBtn testid={`${testid}-bullet`} title="Punktopstilling (-)" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-3.5 w-3.5" /></ToolbarBtn>
        <ToolbarBtn testid={`${testid}-ordered`} title="Nummereret liste (1.)" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-3.5 w-3.5" /></ToolbarBtn>
        <ToolbarBtn testid={`${testid}-quote`} title="Citat" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-3.5 w-3.5" /></ToolbarBtn>
        <ToolbarBtn testid={`${testid}-code`} title="Kode" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}><Code className="h-3.5 w-3.5" /></ToolbarBtn>
        <div className="w-px h-4 bg-slate-300 mx-1" />
        <ToolbarBtn testid={`${testid}-undo`} title="Fortryd" onClick={() => editor.chain().focus().undo().run()}><Undo2 className="h-3.5 w-3.5" /></ToolbarBtn>
        <ToolbarBtn testid={`${testid}-redo`} title="Gendan" onClick={() => editor.chain().focus().redo().run()}><Redo2 className="h-3.5 w-3.5" /></ToolbarBtn>
        <span className="ml-auto text-xs text-slate-400 hidden sm:block">Tip: **fed**, *kursiv*, - liste, ## overskrift</span>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
