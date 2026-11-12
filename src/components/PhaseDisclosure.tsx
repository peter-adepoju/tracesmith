"use client";

import { useEffect, useState, type ReactNode } from "react";

const KEY = "trace:phases-open";

function readOpen(): Record<string, boolean> | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : null;
  } catch {
    return null;
  }
}

/**
 * One phase on the course page, collapsed by default.
 *
 * All 156 days at once is a wall. Each phase now opens on demand and
 * remembers that choice, so the page you come back to is the shape you
 * left it in. The weeks still render on the server inside the closed
 * phase, so the page stays indexable and in-page anchors still resolve.
 */
export function PhaseDisclosure({
  phase,
  title,
  eyebrow,
  blurb,
  weeks,
  days,
  defaultOpen = false,
  children,
}: {
  phase: number;
  title: string;
  eyebrow: string;
  blurb: string;
  weeks: number;
  days: number;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  // Restore the reader's own choice once mounted. Doing it in an effect
  // keeps the server and first client render identical.
  useEffect(() => {
    const saved = readOpen();
    if (saved && typeof saved[phase] === "boolean") setOpen(saved[phase]);
  }, [phase]);

  function toggle() {
    const next = !open;
    setOpen(next);
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({ ...(readOpen() ?? {}), [phase]: next }),
      );
    } catch {
      // Private window. The phase still opens; it just will not be remembered.
    }
  }

  return (
    <section>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="no-touch-target group grid w-full grid-cols-[1fr_auto] items-start gap-4 border-b border-border pb-4 text-left"
      >
        <span>
          <span className="text-[0.625rem] font-medium uppercase tracking-[0.18em] text-accent">
            {eyebrow}
          </span>
          <span className="mt-1.5 block font-display text-2xl group-hover:text-accent">
            {title}
          </span>
          <span className="mt-2 block max-w-3xl text-sm text-muted">
            {blurb}
          </span>
        </span>

        <span className="flex items-center gap-3 pt-1">
          <span className="whitespace-nowrap font-mono text-[0.6875rem] text-muted">
            {weeks} weeks · {days} days
          </span>
          <span
            aria-hidden="true"
            className={`text-muted transition-transform duration-200 group-hover:text-accent ${
              open ? "rotate-90" : ""
            }`}
          >
            ›
          </span>
        </span>
      </button>

      <div hidden={!open} className="mt-6 space-y-8">
        {children}
      </div>
    </section>
  );
}
