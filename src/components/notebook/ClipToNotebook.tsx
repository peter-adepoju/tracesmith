"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { appendClipping, type NoteSource } from "@/lib/notebook/store";

/**
 * Highlight a passage, keep it.
 *
 * This is the reason the notebook is part of the course rather than a
 * separate app: the gap between reading something worth keeping and having
 * kept it should be one click, taken without leaving the sentence.
 *
 * A lesson's clippings all collect in one note named after the lesson, so a
 * day of reading produces a page you can actually re-read, with a link back
 * to where each passage came from.
 */

type Position = { x: number; y: number; text: string };

export function ClipToNotebook({ source }: { source: NoteSource }) {
  const [at, setAt] = useState<Position | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const check = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim() ?? "";

    // Short selections are usually a mis-drag rather than an intent to keep
    // something, and an offer that appears constantly is an annoyance.
    if (!selection || selection.isCollapsed || text.length < 12) {
      setAt(null);
      return;
    }

    // Only inside the lesson itself: selecting the navigation or the footer
    // is not a clipping.
    const node = selection.anchorNode;
    const element = node?.nodeType === 1 ? (node as Element) : node?.parentElement;
    if (!element?.closest("[data-lesson-body]")) {
      setAt(null);
      return;
    }

    const rect = selection.getRangeAt(0).getBoundingClientRect();
    if (!rect.width && !rect.height) return;
    setAt({ x: rect.left + rect.width / 2, y: rect.top, text });
  }, []);

  useEffect(() => {
    // pointerup and keyup rather than selectionchange: the latter fires on
    // every pixel of a drag, so the button would flicker under the cursor.
    document.addEventListener("pointerup", check);
    document.addEventListener("keyup", check);
    const dismiss = () => setAt(null);
    window.addEventListener("scroll", dismiss, { passive: true });
    return () => {
      document.removeEventListener("pointerup", check);
      document.removeEventListener("keyup", check);
      window.removeEventListener("scroll", dismiss);
    };
  }, [check]);

  async function keep() {
    if (!at) return;
    try {
      const note = await appendClipping(source, at.text);
      setSaved(note.id);
      setAt(null);
      window.getSelection()?.removeAllRanges();
      setTimeout(() => setSaved(null), 5000);
    } catch {
      window.alert("That could not be saved. Your browser may be blocking site data.");
    }
  }

  return (
    <>
      {at ? (
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => void keep()}
          className="fixed z-50 -translate-x-1/2 -translate-y-full border border-accent bg-panel px-3 py-1.5 text-xs text-accent shadow-lg"
          style={{ left: at.x, top: at.y - 8 }}
        >
          Save to notebook
        </button>
      ) : null}

      {saved ? (
        <div
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-1/2 z-50 -translate-x-1/2 border border-border bg-panel px-4 py-2.5 text-xs shadow-lg md:bottom-6"
          role="status"
        >
          Saved to your notebook.{" "}
          <Link href={`/notebook?note=${saved}`} className="text-accent hover:underline">
            Open it
          </Link>
        </div>
      ) : null}
    </>
  );
}
