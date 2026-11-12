"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TOTAL_DAYS, WEEKS, dayKey } from "@/lib/curriculum";
import { loadProgress } from "@/lib/progress";

type Next = { week: number; day: number; title: string } | null;

/**
 * Where you are, on the landing page.
 *
 * Renders nothing until progress has loaded and there is some, so a first
 * visit stays a clean hero and a returning reader lands on a Continue
 * button instead of hunting for their place in a list of 156.
 */
export function HomeProgress() {
  const [done, setDone] = useState<Set<string> | null>(null);

  useEffect(() => {
    let active = true;
    loadProgress()
      .then((all) => {
        if (!active) return;
        setDone(
          new Set(
            Object.values(all)
              .filter((entry) => entry.completedAt)
              .map((entry) => entry.dayKey),
          ),
        );
      })
      .catch(() => {
        if (active) setDone(new Set());
      });
    return () => {
      active = false;
    };
  }, []);

  if (!done || done.size === 0) return null;

  // The first day not yet finished, in course order.
  let next: Next = null;
  for (const week of WEEKS) {
    for (const day of week.days) {
      if (!done.has(dayKey(week.n, day.n))) {
        next = { week: week.n, day: day.n, title: day.title };
        break;
      }
    }
    if (next) break;
  }

  const percent = Math.round((done.size / TOTAL_DAYS) * 100);

  return (
    <section className="mt-12 border-t border-border pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <span className="text-[0.625rem] font-medium uppercase tracking-[0.18em] text-muted">
          Your progress
        </span>
        <span className="font-mono text-xs tabular-nums text-muted-2">
          {done.size} of {TOTAL_DAYS} · {percent}%
        </span>
      </div>

      <div
        className="mt-3 h-[3px] w-full bg-surface-2"
        role="img"
        aria-label={`${percent} per cent complete`}
      >
        <div
          className="h-full bg-accent transition-[width] duration-500"
          style={{ width: `${Math.max(1, percent)}%` }}
        />
      </div>

      {next ? (
        <Link
          href={`/day/${next.week}/${next.day}`}
          className="group mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1"
        >
          <span className="text-[0.625rem] font-medium uppercase tracking-[0.18em] text-accent">
            Continue
          </span>
          <span className="font-mono text-xs text-muted">
            W{String(next.week).padStart(2, "0")} · Day {next.day}
          </span>
          <span className="font-display text-xl text-muted-2 group-hover:text-text">
            {next.title}
          </span>
        </Link>
      ) : (
        <p className="mt-5 font-display text-xl text-accent">
          All 156 done. That is the whole course.
        </p>
      )}
    </section>
  );
}
