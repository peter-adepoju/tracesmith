"use client";

import type { Editor } from "@tiptap/react";
import { useRef, useState } from "react";
import { fileToImage } from "@/lib/notebook/images";

/**
 * The formatting bar.
 *
 * Grouped the way a writer reaches for things rather than the way the editor
 * organises them: undo, then what kind of block this is, then how the words
 * look, then lists and alignment, then the things you insert. It wraps rather
 * than scrolls, so nothing is hidden off the right edge on a narrow screen.
 */

const ICONS: Record<string, string> = {
  undo: "M3 7v6h6M3 13a9 9 0 1 0 3-7",
  redo: "M21 7v6h-6M21 13a9 9 0 1 1-3-7",
  bulletList: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  orderedList: "M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M4 15.5a1.5 1.5 0 1 1 2.5 1.1L4 19h3",
  taskList: "M3 7l2 2 3-3M3 17l2 2 3-3M12 6h9M12 18h9",
  alignLeft: "M3 6h18M3 12h12M3 18h15",
  alignCenter: "M3 6h18M6 12h12M5 18h14",
  alignRight: "M3 6h18M9 12h12M6 18h15",
  alignJustify: "M3 6h18M3 12h18M3 18h18",
  link: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1",
  image: "M3 5h18v14H3zM3 15l5-5 4 4 3-3 6 6",
  table: "M3 5h18v14H3zM3 10h18M9 10v9M15 10v9",
  rule: "M3 12h18",
  quote: "M7 7v5H4c0-3 1-5 3-5zM17 7v5h-3c0-3 1-5 3-5zM4 12v5h3v-5M14 12v5h3v-5",
  code: "M8 6l-5 6 5 6M16 6l5 6-5 6",
  clear: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
};

function Icon({ name }: { name: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[15px] w-[15px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

function Btn({
  on,
  onClick,
  title,
  disabled,
  children,
}: {
  on?: boolean;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      // The editor loses its selection on blur, which would make every button
      // act on nothing. Preventing the default mousedown keeps focus put.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={on}
      className={`flex h-8 min-w-8 items-center justify-center px-1.5 text-sm transition-colors disabled:opacity-30 ${
        on ? "bg-accent-soft text-accent" : "text-muted-2 hover:bg-surface-2 hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-border" aria-hidden />;
}

const TEXT_COLOURS = ["#fafafa", "#c8a45c", "#f08fb0", "#4cc48a", "#7aa7e0", "#6e6e78"];
const HIGHLIGHTS = ["#fff2a8", "#c8f0d8", "#ffd4e2", "#d8e4ff", "#e8e0c0"];

export function Toolbar({ editor }: { editor: Editor }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [palette, setPalette] = useState<"text" | "mark" | null>(null);

  const blockValue = editor.isActive("heading", { level: 1 })
    ? "h1"
    : editor.isActive("heading", { level: 2 })
      ? "h2"
      : editor.isActive("heading", { level: 3 })
        ? "h3"
        : editor.isActive("codeBlock")
          ? "code"
          : "p";

  function setBlock(value: string) {
    const chain = editor.chain().focus();
    if (value === "p") chain.setParagraph().run();
    else if (value === "code") chain.toggleCodeBlock().run();
    else chain.setHeading({ level: Number(value.slice(1)) as 1 | 2 | 3 }).run();
  }

  async function insertFiles(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) {
      try {
        const image = await fileToImage(file);
        editor.chain().focus().setImage(image).run();
      } catch {
        // One unreadable file should not stop the rest.
      }
    }
  }

  function toggleLink() {
    const existing = editor.getAttributes("link").href as string | undefined;
    if (existing) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const href = window.prompt("Link address");
    if (!href) return;
    editor.chain().focus().setLink({ href, target: "_blank" }).run();
  }

  return (
    <div className="sticky top-14 z-20 flex flex-wrap items-center gap-0.5 border-b border-border bg-bg/95 py-1.5 backdrop-blur">
      <Btn title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
        <Icon name="undo" />
      </Btn>
      <Btn title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
        <Icon name="redo" />
      </Btn>

      <Divider />

      <select
        value={blockValue}
        onChange={(event) => setBlock(event.target.value)}
        aria-label="Paragraph style"
        className="h-8 border border-border bg-surface px-1.5 text-xs text-muted-2"
      >
        <option value="p">Body text</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
        <option value="code">Code block</option>
      </select>

      <Divider />

      <Btn title="Bold" on={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <span className="font-semibold">B</span>
      </Btn>
      <Btn title="Italic" on={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <span className="font-serif italic">I</span>
      </Btn>
      <Btn
        title="Underline"
        on={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <span className="underline underline-offset-2">U</span>
      </Btn>
      <Btn title="Strikethrough" on={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <span className="line-through">S</span>
      </Btn>
      <Btn title="Inline code" on={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
        <span className="font-mono text-xs">{"<>"}</span>
      </Btn>

      <div className="relative">
        <Btn title="Text colour" on={palette === "text"} onClick={() => setPalette(palette === "text" ? null : "text")}>
          <span className="border-b-2 border-accent leading-none">A</span>
        </Btn>
        {palette === "text" ? (
          <div className="absolute left-0 top-9 z-30 flex gap-1 border border-border bg-panel p-1.5 shadow-lg">
            {TEXT_COLOURS.map((colour) => (
              <button
                key={colour}
                type="button"
                title={colour}
                aria-label={`Text colour ${colour}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  editor.chain().focus().setColor(colour).run();
                  setPalette(null);
                }}
                className="h-5 w-5 border border-border-2"
                style={{ background: colour }}
              />
            ))}
            <button
              type="button"
              title="Default colour"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                editor.chain().focus().unsetColor().run();
                setPalette(null);
              }}
              className="h-5 px-1.5 text-[0.625rem] text-muted"
            >
              reset
            </button>
          </div>
        ) : null}
      </div>

      <div className="relative">
        <Btn
          title="Highlight"
          on={editor.isActive("highlight") || palette === "mark"}
          onClick={() => setPalette(palette === "mark" ? null : "mark")}
        >
          <span className="bg-[#fff2a8] px-1 leading-none text-[#141008]">H</span>
        </Btn>
        {palette === "mark" ? (
          <div className="absolute left-0 top-9 z-30 flex gap-1 border border-border bg-panel p-1.5 shadow-lg">
            {HIGHLIGHTS.map((colour) => (
              <button
                key={colour}
                type="button"
                title={colour}
                aria-label={`Highlight ${colour}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  editor.chain().focus().setHighlight({ color: colour }).run();
                  setPalette(null);
                }}
                className="h-5 w-5 border border-border-2"
                style={{ background: colour }}
              />
            ))}
            <button
              type="button"
              title="Remove highlight"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                editor.chain().focus().unsetHighlight().run();
                setPalette(null);
              }}
              className="h-5 px-1.5 text-[0.625rem] text-muted"
            >
              none
            </button>
          </div>
        ) : null}
      </div>

      <Divider />

      <Btn title="Bulleted list" on={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <Icon name="bulletList" />
      </Btn>
      <Btn title="Numbered list" on={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <Icon name="orderedList" />
      </Btn>
      <Btn title="Checklist" on={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()}>
        <Icon name="taskList" />
      </Btn>
      <Btn title="Quote" on={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Icon name="quote" />
      </Btn>

      <Divider />

      {(["left", "center", "right", "justify"] as const).map((side) => (
        <Btn
          key={side}
          title={`Align ${side}`}
          on={editor.isActive({ textAlign: side })}
          onClick={() => editor.chain().focus().setTextAlign(side).run()}
        >
          <Icon name={`align${side[0].toUpperCase()}${side.slice(1)}`} />
        </Btn>
      ))}

      <Divider />

      <Btn title={editor.isActive("link") ? "Remove link" : "Add link"} on={editor.isActive("link")} onClick={toggleLink}>
        <Icon name="link" />
      </Btn>
      <Btn title="Insert image" onClick={() => fileInput.current?.click()}>
        <Icon name="image" />
      </Btn>
      <Btn
        title="Insert table"
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
      >
        <Icon name="table" />
      </Btn>
      <Btn title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Icon name="rule" />
      </Btn>

      <Divider />

      <Btn
        title="Clear formatting"
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
      >
        <Icon name="clear" />
      </Btn>

      {editor.isActive("table") ? (
        <>
          <Divider />
          <Btn title="Add row" onClick={() => editor.chain().focus().addRowAfter().run()}>
            <span className="text-[0.625rem]">+row</span>
          </Btn>
          <Btn title="Add column" onClick={() => editor.chain().focus().addColumnAfter().run()}>
            <span className="text-[0.625rem]">+col</span>
          </Btn>
          <Btn title="Delete row" onClick={() => editor.chain().focus().deleteRow().run()}>
            <span className="text-[0.625rem]">−row</span>
          </Btn>
          <Btn title="Delete column" onClick={() => editor.chain().focus().deleteColumn().run()}>
            <span className="text-[0.625rem]">−col</span>
          </Btn>
          <Btn title="Delete table" onClick={() => editor.chain().focus().deleteTable().run()}>
            <span className="text-[0.625rem]">−table</span>
          </Btn>
        </>
      ) : null}

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          void insertFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}
