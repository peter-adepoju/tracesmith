"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { NOTES_TABLE_SQL, type SyncState } from "@/lib/notebook/sync";

/**
 * What sync is doing, said plainly.
 *
 * Every state here is a different thing to tell someone, and collapsing them
 * into one "not synced" would be the unhelpful choice: not signed in is a
 * thing you can fix in a second, the table not existing is a thing only you
 * can fix once, and a note too large to send is a thing you should know about
 * before you trust the copy on the server.
 */
export function SyncBadge({
  state,
  onSync,
}: {
  state: SyncState;
  onSync: () => void;
}) {
  const [showSql, setShowSql] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Escape closes it, as it does in every other dialog anyone has used.
  useEffect(() => {
    if (!showSql) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowSql(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showSql]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(NOTES_TABLE_SQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  if (state.kind === "off") {
    return (
      <span className="text-[0.6875rem] text-muted">
        {state.reason === "signed-out"
          ? "Saved on this device · sign in to sync"
          : "Saved on this device"}
      </span>
    );
  }

  if (state.kind === "syncing") {
    return <span className="text-[0.6875rem] text-muted">Syncing…</span>;
  }

  if (state.kind === "missing-table") {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowSql(true)}
          className="text-[0.6875rem] text-warn hover:underline"
        >
          Sync needs one setup step
        </button>

        {/* Through a portal to the body, and not optional. The notebook
            header uses backdrop-blur, and a backdrop-filter makes that header
            the containing block for position:fixed descendants — so rendered
            in place this dialog is trapped inside the header and clipped to
            it, which is exactly what it did. */}
        {showSql && mounted
          ? createPortal(
              <div
                className="fixed inset-0 z-[70] flex items-center justify-center p-4"
                role="dialog"
                aria-modal="true"
                aria-label="Create the notes table"
              >
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setShowSql(false)}
                  className="absolute inset-0 bg-bg/85"
                />
                <div className="relative flex max-h-[85dvh] w-full max-w-xl flex-col overflow-hidden border border-border bg-panel p-5">
                  <h2 className="font-display text-xl">Create the notes table</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-2">
                    Your notes are safe on this device. To make them follow you
                    between devices, run this once in your Supabase project,
                    under <span className="text-text">SQL Editor → New query</span>.
                    It only adds a table — nothing already there is touched.
                  </p>
                  {/* min-h-0 so the pre shrinks inside the flex column rather
                      than pushing the buttons off the bottom. */}
                  <pre className="mt-3 min-h-0 flex-1 overflow-auto border-l-2 border-border-2 bg-[var(--code-bg)] p-3 text-[0.6875rem] leading-relaxed text-[var(--code-text)]">
                    {NOTES_TABLE_SQL}
                  </pre>
                  <div className="mt-3 flex shrink-0 flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void copy()}
                      className="bg-accent px-3 py-2 text-xs font-medium"
                    >
                      {copied ? "Copied" : "Copy the SQL"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSql(false);
                        onSync();
                      }}
                      className="border border-border px-3 py-2 text-xs text-muted-2"
                    >
                      I have run it — try again
                    </button>
                  </div>
                </div>
              </div>,
              document.body,
            )
          : null}
      </>
    );
  }

  if (state.kind === "error") {
    return (
      <button
        type="button"
        onClick={onSync}
        title={state.message}
        className="text-[0.6875rem] text-bad hover:underline"
      >
        Sync failed — retry
      </button>
    );
  }

  const time = new Date(state.at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <button
      type="button"
      onClick={onSync}
      className="text-left text-[0.6875rem] text-muted transition-colors hover:text-text"
    >
      {state.skipped.length
        ? `Synced ${time} · ${state.skipped.length} note${state.skipped.length === 1 ? "" : "s"} too large to send`
        : `Synced ${time}`}
    </button>
  );
}
