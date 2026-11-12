"use client";

import { useEffect, useRef, useState } from "react";
import {
  notebookToMarkdown,
  toHtmlDocument,
  toMarkdown,
} from "@/lib/notebook/export-text";
import { download, slug } from "@/lib/notebook/download";
import { allNotes, exportBackup, type Note } from "@/lib/notebook/store";

/**
 * Getting the writing out.
 *
 * Five formats, because they answer different questions. Word and PDF are for
 * handing to someone or keeping a fixed copy; Markdown and HTML are for
 * keeping it readable and editable in anything, decades from now, with no
 * software to still exist; JSON is the only one that restores back into here
 * exactly as it was.
 */

type Scope = "note" | "all";

function printHtml(html: string) {
  // A hidden iframe rather than window.open: popup blockers do not touch it,
  // and the print styles come from the generated document, so the PDF is a
  // clean black-on-white page rather than a screenshot of a dark app.
  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  frame.srcdoc = html;
  frame.onload = () => {
    const win = frame.contentWindow;
    if (!win) return;
    win.focus();
    win.print();
    // Left in place long enough for the print dialog to read it; removing it
    // immediately cancels the job in several browsers.
    setTimeout(() => frame.remove(), 60_000);
  };
  document.body.appendChild(frame);
}

export function ExportMenu({ note }: { note: Note }) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<Scope>("note");
  const [busy, setBusy] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  async function notes(): Promise<Note[]> {
    return scope === "all" ? allNotes() : [note];
  }

  async function run(label: string, work: () => Promise<void>) {
    setBusy(label);
    try {
      await work();
      setOpen(false);
    } catch (error) {
      window.alert(
        `The ${label} export failed: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    } finally {
      setBusy(null);
    }
  }

  const name = scope === "all" ? "tracesmith-notebook" : slug(note.title);
  const title = scope === "all" ? "Tracesmith notebook" : note.title;

  const actions: { key: string; label: string; hint: string; go: () => Promise<void> }[] = [
    {
      key: "pdf",
      label: "PDF",
      hint: "Opens your print dialog — choose Save as PDF",
      go: async () => printHtml(toHtmlDocument(await notes(), title)),
    },
    {
      key: "word",
      label: "Word (.docx)",
      hint: "A real Word file, images included",
      go: async () => {
        // Loaded only when someone actually exports to Word: the OOXML writer
        // is the largest thing here and most visits never touch it.
        const { toDocxBlob } = await import("@/lib/notebook/export-docx");
        download(await toDocxBlob(await notes()), `${name}.docx`);
      },
    },
    {
      key: "markdown",
      label: "Markdown (.md)",
      hint: "Plain text that stays readable anywhere",
      go: async () => {
        const list = await notes();
        const text = scope === "all" ? notebookToMarkdown(list) : toMarkdown(list[0]);
        download(new Blob([text], { type: "text/markdown" }), `${name}.md`);
      },
    },
    {
      key: "html",
      label: "Web page (.html)",
      hint: "One self-contained file, opens in any browser",
      go: async () => {
        const html = toHtmlDocument(await notes(), title);
        download(new Blob([html], { type: "text/html" }), `${name}.html`);
      },
    },
    {
      key: "json",
      label: "Backup (.json)",
      hint: "The whole notebook, restorable back into here",
      go: async () => {
        const backup = await exportBackup();
        download(
          new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }),
          `tracesmith-notebook-${backup.exportedAt.slice(0, 10)}.json`,
        );
      },
    },
  ];

  return (
    <div className="relative" ref={box}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="border border-border px-3 py-1.5 text-xs text-muted-2 transition-colors hover:border-accent hover:text-text"
      >
        Export
      </button>

      {open ? (
        <div className="absolute right-0 top-9 z-40 w-72 border border-border bg-panel shadow-xl">
          <div className="flex border-b border-border text-xs">
            {(["note", "all"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setScope(value)}
                className={`flex-1 px-3 py-2 transition-colors ${
                  scope === value ? "bg-accent-soft text-accent" : "text-muted hover:text-text"
                }`}
              >
                {value === "note" ? "This note" : "Whole notebook"}
              </button>
            ))}
          </div>

          <ul>
            {actions.map((action) => (
              <li key={action.key}>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void run(action.label, action.go)}
                  className="w-full px-3 py-2.5 text-left transition-colors hover:bg-surface-2 disabled:opacity-50"
                >
                  <span className="block text-sm">
                    {busy === action.label ? `${action.label}…` : action.label}
                  </span>
                  <span className="mt-0.5 block text-[0.6875rem] leading-snug text-muted">
                    {action.hint}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <p className="border-t border-border px-3 py-2 text-[0.6875rem] leading-relaxed text-muted">
            Notes live in this browser. Export a backup now and then — that copy
            is yours wherever you keep it.
          </p>
        </div>
      ) : null}
    </div>
  );
}
