"use client";

import { useEffect, useState } from "react";

/**
 * A way in to search. There are two of these on screen — a labelled button in
 * the desktop bar and an icon on a phone — which is exactly why this is only a
 * trigger.
 *
 * It owned the open state and the keyboard shortcut once, and the result was
 * two dialogs: the shortcut toggled both, typing went to whichever input won
 * the focus race, and closing one left the other sitting over the page. The
 * state and the listener belong to the one component that is rendered once,
 * which is SiteChrome.
 */
export function SearchButton({
  compact = false,
  onOpen,
}: {
  compact?: boolean;
  onOpen: () => void;
}) {
  const [mac, setMac] = useState(false);

  useEffect(() => {
    setMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
  }, []);

  return (
    <>
      {compact ? (
        <button
          type="button"
          onClick={onOpen}
          aria-label="Search the course"
          className="grid h-8 w-8 place-items-center text-muted transition-colors hover:text-text"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-[18px] w-[18px]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
        </button>
      ) : (
        <button
          type="button"
          onClick={onOpen}
          className="group flex items-center gap-2 border border-border px-2.5 py-1.5 text-muted transition-colors hover:border-border-2 hover:text-text"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-[15px] w-[15px]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <span className="text-xs">Search</span>
          <kbd className="border border-border px-1 font-mono text-[0.625rem] text-muted">
            {mac ? "⌘" : "Ctrl "}K
          </kbd>
        </button>
      )}

    </>
  );
}
