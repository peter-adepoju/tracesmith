"use client";

import type { JSONContent } from "@tiptap/core";

/**
 * Notebook storage.
 *
 * IndexedDB rather than localStorage, for one reason: images. A notebook you
 * can paste a screenshot into outgrows localStorage's five megabytes in a
 * handful of entries, and localStorage has no way to fail gracefully — it
 * throws mid-write and you lose the note you were typing.
 *
 * Notes live in this browser only. That is a deliberate trade and the export
 * is the answer to it: a notebook you cannot get out of the tool that made it
 * is not a record of anything. Export early, export often; the page says so.
 */

const DB_NAME = "tracesmith-notebook";
const DB_VERSION = 1;
const STORE = "notes";

export type NoteSource = {
  /** w05d02, so a clipping can link back to the lesson it came from. */
  dayKey: string;
  week: number;
  day: number;
  title: string;
};

export type Note = {
  id: string;
  title: string;
  /** The ProseMirror document, which is what every exporter walks. */
  doc: JSONContent;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  /** Present when the note was started by clipping from a lesson. */
  source?: NoteSource;
};

export type NoteSummary = Omit<Note, "doc"> & { words: number };

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt");
        // Clipping twice from one lesson should land in one note, not two.
        store.createIndex("sourceDayKey", "source.dayKey");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

function run<T>(
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = work(tx.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
  );
}

export function emptyDoc(): JSONContent {
  return { type: "doc", content: [{ type: "paragraph" }] };
}

export function newId(): string {
  // Date-prefixed so a plain key listing is roughly chronological, with
  // enough randomness that two notes made in the same millisecond differ.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Plain text of a document, for word counts and search. */
export function textOf(node: JSONContent | undefined): string {
  if (!node) return "";
  if (node.type === "text") return node.text ?? "";
  const inner = (node.content ?? []).map(textOf).join(" ");
  return inner;
}

export function countWords(doc: JSONContent): number {
  const text = textOf(doc).trim();
  return text ? text.split(/\s+/).length : 0;
}

export async function listNotes(): Promise<NoteSummary[]> {
  const all = await run<Note[]>("readonly", (store) => store.getAll());
  return all
    .map(({ doc, ...rest }) => ({ ...rest, words: countWords(doc) }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function allNotes(): Promise<Note[]> {
  const all = await run<Note[]>("readonly", (store) => store.getAll());
  return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getNote(id: string): Promise<Note | undefined> {
  return run<Note | undefined>("readonly", (store) => store.get(id));
}

export async function putNote(note: Note): Promise<void> {
  await run("readwrite", (store) => store.put(note));
}

export async function deleteNote(id: string): Promise<void> {
  await run("readwrite", (store) => store.delete(id));
}

export async function createNote(partial: Partial<Note> = {}): Promise<Note> {
  const now = new Date().toISOString();
  const note: Note = {
    id: newId(),
    title: partial.title ?? "Untitled note",
    doc: partial.doc ?? emptyDoc(),
    createdAt: now,
    updatedAt: now,
    tags: partial.tags ?? [],
    ...(partial.source ? { source: partial.source } : {}),
  };
  await putNote(note);
  return note;
}

/**
 * The note a lesson's clippings belong in, created on first clip.
 *
 * Keyed on the lesson rather than the moment, so a day's worth of highlights
 * collects into one readable page instead of scattering into twenty.
 */
export async function noteForSource(source: NoteSource): Promise<Note> {
  const db = await open();
  const existing = await new Promise<Note | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx
      .objectStore(STORE)
      .index("sourceDayKey")
      .get(source.dayKey);
    request.onsuccess = () => resolve(request.result as Note | undefined);
    request.onerror = () => reject(request.error);
  });
  if (existing) return existing;

  return createNote({
    title: source.title,
    source,
    doc: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              marks: [{ type: "italic" }],
              text: `Clipped from week ${source.week}, day ${source.day}.`,
            },
          ],
        },
      ],
    },
  });
}

/** Append a quoted passage, with a note of where it came from. */
export async function appendClipping(
  source: NoteSource,
  quote: string,
): Promise<Note> {
  const note = await noteForSource(source);
  const content = note.doc.content ?? [];
  const updated: Note = {
    ...note,
    updatedAt: new Date().toISOString(),
    doc: {
      ...note.doc,
      content: [
        ...content,
        {
          type: "blockquote",
          content: [
            { type: "paragraph", content: [{ type: "text", text: quote }] },
          ],
        },
        { type: "paragraph" },
      ],
    },
  };
  await putNote(updated);
  return updated;
}

/** Whole-notebook backup. The shape is the import format too. */
export type Backup = {
  format: "tracesmith-notebook";
  version: 1;
  exportedAt: string;
  notes: Note[];
};

export async function exportBackup(): Promise<Backup> {
  return {
    format: "tracesmith-notebook",
    version: 1,
    exportedAt: new Date().toISOString(),
    notes: await allNotes(),
  };
}

/**
 * Restore a backup without destroying what is already here.
 *
 * A note whose id already exists is kept as a copy rather than overwritten:
 * an import that silently replaced a newer note with an older one would be
 * the worst possible bug in something whose whole job is not losing writing.
 */
export async function importBackup(
  backup: Backup,
): Promise<{ added: number; copied: number }> {
  if (backup?.format !== "tracesmith-notebook") {
    throw new Error("That file is not a Tracesmith notebook backup.");
  }

  let added = 0;
  let copied = 0;
  for (const note of backup.notes ?? []) {
    const existing = await getNote(note.id);
    if (!existing) {
      await putNote(note);
      added += 1;
      continue;
    }
    if (existing.updatedAt === note.updatedAt) continue;
    await putNote({
      ...note,
      id: newId(),
      title: `${note.title} (imported)`,
    });
    copied += 1;
  }
  return { added, copied };
}
