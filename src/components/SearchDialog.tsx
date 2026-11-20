"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { SearchEntry, SearchKind } from "@content/search-titles";

/**
 * Search, across everything.
 *
 * The index arrives in two pieces. Titles are a tenth of the weight and answer
 * most searches on their own, so they load the moment the dialog opens and the
 * box is useful immediately. The bodies are most of a megabyte and follow in
 * the background, upgrading the same query to full text without anyone
 * watching a spinner. The footer says which of the two you are getting, because
 * "I searched and it found nothing" means different things before and after.
 *
 * Your own notebook is searched too, from IndexedDB. It is part of the course
 * by the time you have written in it, and it is the thing you are most likely
 * to be looking for.
 */

type Hit = {
  entry: SearchEntry;
  score: number;
  snippet: string;
};

const KIND_LABEL: Record<SearchKind | "note", string> = {
  lesson: "Lesson",
  section: "Section",
  week: "Week",
  lab: "Lab",
  build: "Build",
  page: "Page",
  note: "Your notes",
};

const KIND_TONE: Record<string, string> = {
  lesson: "text-accent",
  section: "text-muted",
  week: "text-muted-2",
  lab: "text-ok",
  build: "text-warn",
  page: "text-muted",
  note: "text-bad",
};

/** Words worth matching on. Single characters match everything and help nobody. */
function terms(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 1);
}

/**
 * A readable piece of the body around the match.
 *
 * Showing the first 150 characters of a section would be the easy version and
 * usually shows nothing of why it matched.
 */
function snippetAround(
  display: string,
  lower: string,
  phrase: string,
  words: string[],
): string {
  if (!display) return "";
  // Positions are found in the lowercased copy and used to cut the original,
  // which is why the two must stay the same length — they do, because one is
  // just the other lowercased.
  let at = lower.indexOf(phrase);
  if (at < 0) {
    for (const word of words) {
      at = lower.indexOf(word);
      if (at >= 0) break;
    }
  }
  if (at < 0) return display.slice(0, 160).trim();
  const start = Math.max(0, at - 70);
  const piece = display.slice(start, start + 200).trim();
  return (start > 0 ? "…" : "") + piece + (start + 200 < display.length ? "…" : "");
}

/** Split a string so the matched parts can be marked without using innerHTML. */
function pieces(text: string, words: string[]): { s: string; hit: boolean }[] {
  if (!words.length) return [{ s: text, hit: false }];
  const pattern = new RegExp(
    `(${words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi",
  );
  return text
    .split(pattern)
    .filter((part) => part !== "")
    .map((part) => ({ s: part, hit: words.some((word) => part.toLowerCase() === word) }));
}

export function SearchDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [titles, setTitles] = useState<SearchEntry[] | null>(null);
  const [bodies, setBodies] = useState<string[] | null>(null);
  const [notes, setNotes] = useState<
    { entry: SearchEntry; text: string; lower: string }[]
  >([]);
  const listRef = useRef<HTMLUListElement>(null);

  // Titles first, bodies after. Both are content-hashed chunks, so the service
  // worker keeps them and the second search of the week costs nothing.
  //
  // Guarded by a ref rather than by `titles`, and with no cleanup. Depending
  // on `titles` meant the effect re-ran the moment they arrived, and its
  // cleanup then discarded the still-in-flight body import — the megabyte
  // downloaded and the result was dropped on the floor, leaving search stuck
  // on titles for ever. This component stays mounted while the dialog is
  // closed, so the index also survives closing and reopening.
  const loading = useRef(false);
  useEffect(() => {
    if (!open || loading.current) return;
    loading.current = true;
    import("@content/search-titles").then((module) => setTitles(module.SEARCH_TITLES));
    import("@content/search-text").then((module) => setBodies(module.SEARCH_TEXT));
  }, [open]);

  // The notebook lives in this browser, so it is read here rather than built
  // into the index.
  useEffect(() => {
    if (!open) return;
    let live = true;
    (async () => {
      try {
        const { allNotes, textOf } = await import("@/lib/notebook/store");
        const found = await allNotes();
        if (!live) return;
        setNotes(
          found.map((note) => ({
            entry: {
              k: "page" as SearchKind,
              t: note.title || "Untitled note",
              c: note.source
                ? `Your notes · week ${note.source.week}, day ${note.source.day}`
                : "Your notes",
              u: `/notebook?note=${note.id}`,
            },
            text: `${note.title} ${textOf(note.doc)}`,
            lower: `${note.title} ${textOf(note.doc)}`.toLowerCase(),
          })),
        );
      } catch {
        // No notebook yet, or site data blocked. Search the course anyway.
      }
    })();
    return () => {
      live = false;
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
    }
  }, [open]);

  /* Matched against lower case, displayed in the case it was written in.
     Lowercasing a megabyte once on load costs a few milliseconds; doing it
     per keystroke would not, and storing a second lowercased copy in the
     bundle would double the download for nothing. */
  const lowered = useMemo(
    () => bodies?.map((body) => body.toLowerCase()) ?? null,
    [bodies],
  );

  const hits = useMemo<Hit[]>(() => {
    const phrase = query.trim().toLowerCase();
    const words = terms(query);
    if (!phrase || !titles) return [];

    const scored: Hit[] = [];

    const consider = (
      entry: SearchEntry,
      /** Lower case, for matching. */
      body: string | undefined,
      /** The same text as written, for the snippet. */
      display: string | undefined,
      isNote: boolean,
    ) => {
      const title = entry.t.toLowerCase();
      const context = entry.c.toLowerCase();
      let score = 0;

      if (title === phrase) score += 200;
      else if (title.startsWith(phrase)) score += 140;
      else if (title.includes(phrase)) score += 100;

      for (const word of words) {
        if (title.includes(word)) score += 14;
        if (context.includes(word)) score += 3;
      }

      if (body) {
        if (body.includes(phrase)) score += 24;
        for (const word of words) if (body.includes(word)) score += 4;
      }

      if (!score) return;
      // Every word must appear somewhere, or "json array" matches every page
      // that merely says "json".
      const haystack = `${title} ${context} ${body ?? ""}`;
      if (!words.every((word) => haystack.includes(word))) return;

      if (isNote) score += 30; // Your own writing, when it matches, is the point.
      if (entry.k === "lesson") score += 6;

      scored.push({
        entry,
        score,
        snippet:
          body && display ? snippetAround(display, body, phrase, words) : entry.c,
      });
    };

    titles.forEach((entry, index) =>
      consider(entry, lowered?.[index], bodies?.[index], false),
    );
    for (const note of notes) consider(note.entry, note.lower, note.text, true);

    return scored.sort((a, b) => b.score - a.score).slice(0, 40);
  }, [query, titles, bodies, lowered, notes]);

  const go = useCallback(
    (hit: Hit) => {
      onClose();
      router.push(hit.entry.u);
    },
    [onClose, router],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive((n) => Math.min(n + 1, hits.length - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive((n) => Math.max(n - 1, 0));
      } else if (event.key === "Enter" && hits[active]) {
        event.preventDefault();
        go(hits[active]);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, hits, active, go, onClose]);

  useEffect(() => setActive(0), [query]);

  // Keep the highlighted row on screen when arrowing past the fold.
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-row="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open || typeof document === "undefined") return null;

  const words = terms(query);

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex justify-center px-4 pt-[10vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Search the course"
    >
      <button
        type="button"
        aria-label="Close search"
        onClick={onClose}
        className="absolute inset-0 bg-bg/85 backdrop-blur-sm"
      />

      <div className="relative flex max-h-[76dvh] w-full max-w-2xl flex-col overflow-hidden border border-border bg-panel shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border px-4">
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 shrink-0 text-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search lessons, labs, projects and your notes"
            aria-label="Search the course"
            className="min-w-0 flex-1 bg-transparent py-4 text-[0.9375rem] text-text placeholder:text-muted focus:outline-none"
          />
          <kbd className="hidden shrink-0 border border-border px-1.5 py-0.5 font-mono text-[0.625rem] text-muted sm:block">
            esc
          </kbd>
        </div>

        <ul ref={listRef} className="min-h-0 flex-1 overflow-y-auto">
          {hits.map((hit, index) => (
            <li key={`${hit.entry.u}-${index}`}>
              <button
                type="button"
                data-row={index}
                onMouseEnter={() => setActive(index)}
                onClick={() => go(hit)}
                className={`w-full border-l-2 px-4 py-3 text-left transition-colors ${
                  index === active
                    ? "border-accent bg-surface"
                    : "border-transparent hover:bg-surface/50"
                }`}
              >
                <div className="flex items-baseline gap-2">
                  <span
                    className={`shrink-0 text-[0.5625rem] uppercase tracking-[0.16em] ${
                      KIND_TONE[hit.entry.k] ?? "text-muted"
                    }`}
                  >
                    {KIND_LABEL[hit.entry.c.startsWith("Your notes") ? "note" : hit.entry.k]}
                  </span>
                  <span className="truncate font-display text-base text-text">
                    {pieces(hit.entry.t, words).map((part, n) =>
                      part.hit ? (
                        <mark key={n} className="bg-transparent text-accent">
                          {part.s}
                        </mark>
                      ) : (
                        <span key={n}>{part.s}</span>
                      ),
                    )}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[0.6875rem] text-muted">
                  {hit.entry.c}
                </p>
                {hit.snippet && hit.snippet !== hit.entry.c ? (
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-2">
                    {pieces(hit.snippet, words).map((part, n) =>
                      part.hit ? (
                        <mark key={n} className="bg-accent-soft text-accent">
                          {part.s}
                        </mark>
                      ) : (
                        <span key={n}>{part.s}</span>
                      ),
                    )}
                  </p>
                ) : null}
              </button>
            </li>
          ))}

          {query.trim() && !hits.length ? (
            <li className="px-4 py-10 text-center text-sm text-muted">
              {titles ? (
                <>
                  Nothing matches “{query.trim()}”.
                  {!bodies ? " Still loading the lesson text — try again in a moment." : ""}
                </>
              ) : (
                "Loading the index…"
              )}
            </li>
          ) : null}

          {!query.trim() ? (
            <li className="px-4 py-10 text-center text-sm text-muted">
              Search every lesson, lab, project and note.
            </li>
          ) : null}
        </ul>

        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2 text-[0.625rem] text-muted">
          <span className="hidden sm:block">
            <kbd className="font-mono">↑↓</kbd> move · <kbd className="font-mono">↵</kbd> open
          </span>
          <span className="truncate">
            {!titles
              ? "loading…"
              : bodies
                ? `${hits.length ? hits.length : "no"} result${hits.length === 1 ? "" : "s"} · full text`
                : "titles only · lesson text still loading"}
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
