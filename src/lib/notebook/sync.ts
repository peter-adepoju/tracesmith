"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { allRows, putMany, type Note } from "./store";

/**
 * Notebook sync.
 *
 * Local-first, like the rest of the app: IndexedDB is always the thing you
 * are reading and writing, and the server is a copy that catches up. Nothing
 * here blocks typing, and signing out leaves every note where it is.
 *
 * The merge rule is last-write-wins on updatedAt, per note. That is the right
 * rule for one person on several devices — you want your most recent edit —
 * and the wrong one for two people editing the same paragraph, which is not
 * what this is. Deletions travel as tombstones rather than absences, because
 * "this row is missing" and "this row was deleted" look identical otherwise,
 * and guessing wrong resurrects notes you threw away.
 */

/**
 * Supabase rejects very large request bodies, and a note full of photographs
 * can reach that on its own. Such a note stays local and is reported rather
 * than failing the whole sync silently.
 */
const MAX_NOTE_BYTES = 4_000_000;

export type SyncState =
  | { kind: "off"; reason: "unconfigured" | "signed-out" }
  | { kind: "missing-table" }
  | { kind: "syncing" }
  | { kind: "ok"; at: string; pushed: number; pulled: number; skipped: string[] }
  | { kind: "error"; message: string };

type Row = {
  id: string;
  title: string;
  doc: Note["doc"];
  tags: string[];
  source: Note["source"] | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

function toRow(note: Note, userId: string) {
  return {
    user_id: userId,
    id: note.id,
    title: note.title,
    doc: note.doc,
    tags: note.tags,
    source: note.source ?? null,
    created_at: note.createdAt,
    updated_at: note.updatedAt,
    deleted_at: note.deletedAt ?? null,
  };
}

function toNote(row: Row): Note {
  return {
    id: row.id,
    title: row.title,
    doc: row.doc,
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    ...(row.source ? { source: row.source } : {}),
  };
}

function sizeOf(note: Note): number {
  // A rough but consistent measure; what matters is catching the note that
  // would be rejected, not the exact byte count on the wire.
  return JSON.stringify(note).length;
}

/** Is the error PostgREST telling us the table has not been created yet? */
function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    /relation .*notes.* does not exist|could not find the table/i.test(error.message ?? "")
  );
}

export async function syncNotebook(): Promise<SyncState> {

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { kind: "off", reason: "unconfigured" };

  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return { kind: "off", reason: "signed-out" };

  const local = await allRows();
  const localById = new Map(local.map((note) => [note.id, note]));

  const { data, error } = await supabase
    .from("notes")
    .select("id, title, doc, tags, source, created_at, updated_at, deleted_at");

  if (error) {
    if (isMissingTable(error)) return { kind: "missing-table" };
    return { kind: "error", message: error.message };
  }

  const remote = (data ?? []) as Row[];
  const remoteById = new Map(remote.map((row) => [row.id, row]));

  // Pull: anything the server has that is newer here, tombstones included.
  const incoming: Note[] = [];
  for (const row of remote) {
    const mine = localById.get(row.id);
    if (!mine || row.updated_at > mine.updatedAt) incoming.push(toNote(row));
  }

  // Push: anything we hold that the server lacks or holds an older copy of.
  const outgoing: Note[] = [];
  const skipped: string[] = [];
  for (const note of local) {
    const theirs = remoteById.get(note.id);
    if (theirs && theirs.updated_at >= note.updatedAt) continue;
    if (sizeOf(note) > MAX_NOTE_BYTES) {
      skipped.push(note.title || "Untitled note");
      continue;
    }
    outgoing.push(note);
  }

  if (incoming.length) await putMany(incoming);

  if (outgoing.length) {
    // In batches: one request carrying every note at once is the request most
    // likely to be refused for its size.
    for (let i = 0; i < outgoing.length; i += 10) {
      const batch = outgoing.slice(i, i + 10).map((note) => toRow(note, user.id));
      const { error: writeError } = await supabase
        .from("notes")
        .upsert(batch, { onConflict: "user_id,id" });
      if (writeError) {
        if (isMissingTable(writeError)) return { kind: "missing-table" };
        return { kind: "error", message: writeError.message };
      }
    }
  }

  return {
    kind: "ok",
    at: new Date().toISOString(),
    pushed: outgoing.length,
    pulled: incoming.length,
    skipped,
  };
}

/** The SQL to run, shown in the app when the table is not there yet. */
export const NOTES_TABLE_SQL = `create table if not exists public.notes (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  id         text        not null,
  title      text        not null default '',
  doc        jsonb       not null,
  tags       text[]      not null default '{}',
  source     jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, id)
);

alter table public.notes enable row level security;

drop policy if exists "own notes" on public.notes;
create policy "own notes" on public.notes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists notes_updated_idx on public.notes (user_id, updated_at desc);`;
