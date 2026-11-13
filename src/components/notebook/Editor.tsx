"use client";

import { Placeholder } from "@tiptap/extensions";
import { Highlight } from "@tiptap/extension-highlight";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TableKit } from "@tiptap/extension-table";
import { TextAlign } from "@tiptap/extension-text-align";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import { EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { useEffect, useRef } from "react";
import { Toolbar } from "@/components/notebook/Toolbar";
import { fileToImage, imageFilesFrom } from "@/lib/notebook/images";
import { countWords, type Note } from "@/lib/notebook/store";

/**
 * The writing surface.
 *
 * Built on ProseMirror through TipTap rather than contenteditable and
 * execCommand. The shortcut would have been execCommand — fewer dependencies,
 * an afternoon's work — but it is deprecated, it disagrees with itself across
 * browsers on anything involving nested lists, and it has no document model,
 * so there would be nothing to export from except scraped HTML. Everything
 * here walks a real document, which is what makes Word and Markdown exports
 * faithful rather than approximate.
 */

/** Image that remembers its own size, so exports can lay it out. */
const SizedImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: null },
      height: { default: null },
    };
  },
});

const EXTENSIONS = [
  // StarterKit already brings bold, italic, underline, strike, code, headings,
  // both lists, link, quote, code block, rule and undo — so only what is
  // genuinely missing is added below, or the editor warns about duplicates.
  StarterKit.configure({
    link: { openOnClick: false, autolink: true },
    codeBlock: { HTMLAttributes: { class: "notebook-code" } },
  }),
  SizedImage.configure({ allowBase64: true }),
  TaskList,
  TaskItem.configure({ nested: true }),
  TableKit.configure({ table: { resizable: true } }),
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Highlight.configure({ multicolor: true }),
  TextStyle,
  Color,
  // StarterKit does not carry this one, and without it the empty-state CSS
  // has nothing to hang on — an empty note just looks broken.
  Placeholder.configure({ placeholder: "Write what you learnt…" }),
];

export function Editor({
  note,
  revision,
  onChange,
}: {
  note: Note;
  /** Changes only when the note is replaced from outside the editor. */
  revision: number;
  onChange: (patch: { doc: Note["doc"]; words: number }) => void;
}) {
  const loaded = useRef(revision);

  const editor = useEditor({
    extensions: EXTENSIONS,
    content: note.doc,
    // Next renders this on the server first; rendering the editor immediately
    // would produce markup the client then disagrees with.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "notebook-prose focus:outline-none",
        spellcheck: "true",
      },
      handlePaste: (view, event) => {
        const files = imageFilesFrom(event.clipboardData);
        if (!files.length) return false;
        event.preventDefault();
        void insertImages(files);
        return true;
      },
      handleDrop: (view, event) => {
        const files = imageFilesFrom((event as DragEvent).dataTransfer);
        if (!files.length) return false;
        event.preventDefault();
        void insertImages(files);
        return true;
      },
    },
    onUpdate: ({ editor: instance }) => {
      const doc = instance.getJSON();
      onChange({ doc, words: countWords(doc) });
    },
  });

  async function insertImages(files: File[]) {
    for (const file of files) {
      try {
        const image = await fileToImage(file);
        editor?.chain().focus().setImage(image).run();
      } catch {
        // Skip what cannot be read; the rest still land.
      }
    }
  }

  // Replace the document rather than remounting the editor, which would throw
  // away undo history and the scroll position together. Keyed on revision and
  // never on note.doc: reloading whenever the document changed would mean
  // reloading on every keystroke, since each one produces a new doc object.
  useEffect(() => {
    if (!editor || revision === loaded.current) return;
    loaded.current = revision;
    editor.commands.setContent(note.doc, { emitUpdate: false });
  }, [editor, revision, note.doc]);

  if (!editor) {
    return (
      <div className="py-16 text-center text-sm text-muted">Loading the editor…</div>
    );
  }

  return (
    <div>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} className="notebook-editor" />
    </div>
  );
}
