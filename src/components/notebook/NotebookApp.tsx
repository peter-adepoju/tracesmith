"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Editor } from "@/components/notebook/Editor";
import { ExportMenu } from "@/components/notebook/ExportMenu";
import { SyncBadge } from "@/components/notebook/SyncBadge";
import { syncNotebook, type SyncState } from "@/lib/notebook/sync";
import {
  createNote,
  deleteNote,
  getNote,
  importBackup,
  listNotes,
  purgeTombstones,
  putNote,
  type Note,
  type NoteSummary,
} from "@/lib/notebook/store";

/**
 * The notebook.
 *
 * A list on the left, one note open on the right. Saving is automatic and
 * debounced — a notebook that needs a Save button is a notebook that loses
 * writing — and the header says plainly when the last save happened, because
 * "it saves automatically" is only reassuring if you can see it happen.
 */

const SAVE_DELAY = 700;

function when(iso: string): string {
  const date = new Date(iso);
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days === 0) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString([], { day: "numeric", month: "short" });
}

export function NotebookApp() {
  const [summaries, setSummaries] = useState<NoteSummary[]>([]);
  const [current, setCurrent] = useState<Note | null>(null);
  const [query, setQuery] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [sync, setSync] = useState<SyncState>({ kind: "off", reason: "unconfigured" });
  const syncing = useRef(false);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<Note | null>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const currentRef = useRef<Note | null>(null);
  currentRef.current = current;

  /**
   * Bumped only when the open note is replaced from outside the editor —
   * switching notes, or a sync bringing down a newer copy. The editor reloads
   * its content on this rather than on every change, or it would fight the
   * person typing.
   */
  const [revision, setRevision] = useState(0);

  const refresh = useCallback(async () => {
    setSummaries(await listNotes());
  }, []);

  /**
   * Sync, never more than once at a time.
   *
   * Two runs at once would race on last-write-wins and could push a note the
   * other run had just pulled a newer copy of, so overlapping calls are
   * dropped rather than queued — the next one along does the same work.
   */
  const runSync = useCallback(async () => {
    if (syncing.current) return;
    syncing.current = true;
    setSync({ kind: "syncing" });
    try {
      const result = await syncNotebook();
      setSync(result);
      if (result.kind === "ok" && result.pulled > 0) {
        await refresh();

        // The note on screen may be one of the ones that just came down. An
        // unsaved local edit wins — the person typing is the most recent
        // writer — but otherwise show them the newer version rather than
        // letting their next keystroke overwrite it with what is on screen.
        const open = currentRef.current;
        if (open && !pending.current) {
          const fresh = await getNote(open.id);
          if (fresh && fresh.updatedAt > open.updatedAt) {
            if (fresh.deletedAt) {
              // Deleted on another device while open here.
              const list = await listNotes();
              const next = list[0] ? await getNote(list[0].id) : await createNote();
              setCurrent(next ?? null);
            } else {
              setCurrent(fresh);
            }
            setRevision((n) => n + 1);
          }
        }
      }
    } catch (error) {
      setSync({
        kind: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      syncing.current = false;
    }
  }, [refresh]);

  // Open whatever was last worked on, or make the first note.
  useEffect(() => {
    let live = true;
    (async () => {
      const list = await listNotes();
      if (!live) return;
      setSummaries(list);
      const wanted = new URLSearchParams(window.location.search).get("note");
      const first = (wanted && (await getNote(wanted))) || (list[0] && (await getNote(list[0].id)));
      setCurrent(first ?? (await createNote({ title: "First note" })));
      if (!list.length) await refresh();
      setReady(true);
      void runSync();
      // Housekeeping, not urgent: tombstones every device has long since
      // seen are just clutter in the local database.
      void purgeTombstones();
    })();
    return () => {
      live = false;
    };
  }, [refresh, runSync]);

  // Sync when the tab comes back to the front and when the network returns —
  // the two moments when the server is most likely to have moved on.
  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState === "visible") void runSync();
    };
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("online", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("online", onFocus);
    };
  }, [runSync]);

  /** Write the note that is waiting, if any. Used by the timer and on exit. */
  const flush = useCallback(async () => {
    const note = pending.current;
    if (!note) return;
    pending.current = null;
    await putNote(note);
    setSavedAt(note.updatedAt);
    await refresh();
    // Push shortly after the local write lands, not on every keystroke.
    void runSync();
  }, [refresh, runSync]);

  // An unsaved edit must not die with the tab. Both events are needed:
  // phones often fire only visibilitychange, desktops often only pagehide.
  useEffect(() => {
    const save = () => void flush();
    window.addEventListener("pagehide", save);
    document.addEventListener("visibilitychange", save);
    return () => {
      window.removeEventListener("pagehide", save);
      document.removeEventListener("visibilitychange", save);
    };
  }, [flush]);

  const queueSave = useCallback(
    (next: Note) => {
      setCurrent(next);
      pending.current = next;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), SAVE_DELAY);
    },
    [flush],
  );

  async function open(id: string) {
    await flush();
    const note = await getNote(id);
    if (note) {
      setCurrent(note);
      setRevision((n) => n + 1);
      setListOpen(false);
    }
  }

  async function addNote() {
    await flush();
    const note = await createNote();
    setCurrent(note);
    setRevision((n) => n + 1);
    setListOpen(false);
    await refresh();
  }

  async function removeNote(note: Note) {
    const ok = window.confirm(
      `Delete "${note.title}"? This cannot be undone, and it is not in any export you have not already taken.`,
    );
    if (!ok) return;
    pending.current = null;
    await deleteNote(note.id);
    const list = await listNotes();
    setSummaries(list);
    setCurrent(list[0] ? ((await getNote(list[0].id)) ?? null) : await createNote());
    setRevision((n) => n + 1);
    void runSync();
  }

  async function restore(file: File) {
    try {
      const result = await importBackup(JSON.parse(await file.text()));
      await refresh();
      window.alert(
        `Restored ${result.added} note${result.added === 1 ? "" : "s"}` +
          (result.copied ? `, and kept ${result.copied} as copies to avoid overwriting newer work.` : "."),
      );
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "That file could not be read.");
    }
  }

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return summaries;
    return summaries.filter((note) => note.title.toLowerCase().includes(needle));
  }, [summaries, query]);

  const words = current ? summaries.find((s) => s.id === current.id)?.words ?? 0 : 0;

  if (!ready || !current) {
    return <p className="px-4 py-20 text-center text-sm text-muted">Opening your notebook…</p>;
  }

  const list = (
    <div className="flex h-full flex-col">
      <div className="flex gap-1.5 px-3 pb-2.5">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search titles"
          aria-label="Search notes"
          className="min-w-0 flex-1 border border-border bg-surface px-2.5 py-1.5 text-xs text-text placeholder:text-muted"
        />
        <button
          type="button"
          onClick={() => void addNote()}
          title="New note"
          className="border border-border px-2.5 text-sm text-muted-2 transition-colors hover:border-accent hover:text-text"
        >
          +
        </button>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto">
        {filtered.map((note) => (
          <li key={note.id}>
            <button
              type="button"
              onClick={() => void open(note.id)}
              className={`w-full border-l-2 px-3 py-2.5 text-left transition-colors ${
                note.id === current.id
                  ? "border-accent bg-surface"
                  : "border-transparent hover:border-border-2 hover:bg-surface/50"
              }`}
            >
              <span className="block truncate text-sm text-muted-2">{note.title}</span>
              <span className="mt-0.5 block text-[0.6875rem] text-muted">
                {when(note.updatedAt)} · {note.words} word{note.words === 1 ? "" : "s"}
                {note.source ? ` · W${note.source.week}D${note.source.day}` : ""}
              </span>
            </button>
          </li>
        ))}
        {filtered.length === 0 ? (
          <li className="px-3 py-6 text-xs text-muted">Nothing matches that.</li>
        ) : null}
      </ul>

      <div className="border-t border-border px-3 py-2.5">
        <button
          type="button"
          onClick={() => importInput.current?.click()}
          className="text-[0.6875rem] text-muted transition-colors hover:text-text"
        >
          Restore from a backup file
        </button>
        <input
          ref={importInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void restore(file);
            event.target.value = "";
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="mx-auto grid max-w-6xl lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] border-r border-border pt-4 lg:block">
        {list}
      </aside>

      {listOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close the notes list"
            onClick={() => setListOpen(false)}
            className="absolute inset-0 bg-bg/80"
          />
          <div className="absolute inset-y-0 left-0 w-[17rem] border-r border-border bg-panel pt-4">
            {list}
          </div>
        </div>
      ) : null}

      <main className="min-w-0 px-4 pb-16 lg:px-8">
        {/* Wraps to a second line on a phone rather than hiding anything.
            Sync state is the last thing to hide on the device you most want
            your notes to have reached. */}
        <div className="sticky top-14 z-30 flex flex-wrap items-center gap-x-2 gap-y-1.5 bg-bg/95 py-3 backdrop-blur">
          <button
            type="button"
            onClick={() => setListOpen(true)}
            className="order-1 border border-border px-2.5 py-1.5 text-xs text-muted-2 lg:hidden"
          >
            Notes
          </button>

          <div className="order-3 flex w-full min-w-0 items-center gap-2 sm:order-2 sm:w-auto">
            <span className="shrink-0 text-[0.6875rem] text-muted">
              {words} word{words === 1 ? "" : "s"}
              {savedAt ? ` · saved ${when(savedAt)}` : " · not yet saved"}
            </span>
            <span className="min-w-0 truncate">
              <SyncBadge state={sync} onSync={() => void runSync()} />
            </span>
          </div>

          <div className="order-2 ml-auto flex items-center gap-1.5 sm:order-3">
            <ExportMenu note={current} />
            <button
              type="button"
              onClick={() => void removeNote(current)}
              className="border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-bad hover:text-bad"
            >
              Delete
            </button>
          </div>
        </div>

        <input
          value={current.title}
          onChange={(event) =>
            queueSave({
              ...current,
              title: event.target.value,
              updatedAt: new Date().toISOString(),
            })
          }
          aria-label="Note title"
          placeholder="Untitled note"
          className="w-full border-0 bg-transparent py-2 font-display text-[clamp(1.8rem,4vw,2.5rem)] leading-tight text-text placeholder:text-muted focus:outline-none"
        />

        {current.source ? (
          <p className="pb-3 text-xs text-muted">
            Clipped from{" "}
            <Link
              href={`/day/${current.source.week}/${current.source.day}`}
              className="text-accent hover:underline"
            >
              week {current.source.week}, day {current.source.day} — {current.source.title}
            </Link>
          </p>
        ) : null}

        <Editor
          note={current}
          revision={revision}
          onChange={({ doc }) =>
            queueSave({ ...current, doc, updatedAt: new Date().toISOString() })
          }
        />
      </main>
    </div>
  );
}
