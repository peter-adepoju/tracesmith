"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PHASES, WEEKS, dayKey } from "@/lib/curriculum";
import { loadProgress } from "@/lib/progress";

/**
 * The course, always on the left.
 *
 * The point is that you never have to go back to an index to see where you
 * are. Brass marks the week you are reading and fills each week's meter as
 * you finish its days; blue is reserved for things you can click.
 *
 * Below 1024px it becomes a drawer, because a 260px rail on a phone leaves
 * no room for the lesson.
 */
export function CourseRail({ currentWeek }: { currentWeek: number }) {
  const [done, setDone] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadProgress()
      .then((all) => {
        if (cancelled) return;
        const keys = Object.values(all)
          .filter((entry) => entry.completedAt)
          .map((entry) => entry.dayKey);
        setDone(new Set(keys));
      })
      .catch(() => {
        // Progress is best-effort; the rail is still useful without it.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Close the drawer when the week changes, i.e. after navigating from it.
  useEffect(() => {
    setOpen(false);
  }, [currentWeek]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="no-touch-target fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-4 z-40 rounded-full border border-border-2 bg-panel px-4 py-2 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-muted-2 shadow-lg lg:hidden"
      >
        {open ? "Close" : "Course"}
      </button>

      {open ? (
        <button
          type="button"
          aria-label="Close the course menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      ) : null}

      <aside
        className={`${
          open ? "translate-x-0" : "-translate-x-[102%]"
        } fixed bottom-0 left-0 top-0 z-30 w-[min(300px,86vw)] overflow-y-auto border-r border-border bg-panel pb-24 pt-[calc(3.5rem+env(safe-area-inset-top))] transition-transform duration-200 lg:sticky lg:top-14 lg:z-0 lg:h-[calc(100dvh-3.5rem)] lg:w-auto lg:translate-x-0 lg:bg-transparent lg:pb-16 lg:pt-0 lg:transition-none`}
      >
        {PHASES.map((phase) => (
          <div key={phase.n}>
            <div className="flex items-baseline gap-2 px-5 pb-1.5 pt-5">
              <span className="font-mono text-[0.625rem] text-muted">
                {String(phase.n).padStart(2, "0")}
              </span>
              <span className="text-[0.625rem] font-medium uppercase tracking-[0.18em] text-muted">
                {phase.title}
              </span>
            </div>

            {WEEKS.filter(
              (week) => week.n >= phase.from && week.n <= phase.to,
            ).map((week) => {
              const total = week.days.length;
              const finished = week.days.filter((day) =>
                done.has(dayKey(week.n, day.n)),
              ).length;
              const here = week.n === currentWeek;
              const complete = finished === total;

              return (
                <Link
                  key={week.n}
                  href={`/day/${week.n}/1`}
                  aria-current={here ? "true" : undefined}
                  className={`grid grid-cols-[1fr_auto] items-center gap-2.5 border-l-2 py-1.5 pl-5 pr-4 transition-colors ${
                    here
                      ? "border-prog bg-prog-soft text-prog"
                      : "border-transparent text-muted-2 hover:bg-surface hover:text-text"
                  }`}
                >
                  <span className="text-[0.9375rem]">{week.title}</span>
                  <span
                    className="relative h-[2px] w-11 shrink-0 bg-surface-2"
                    aria-hidden="true"
                  >
                    <span
                      className={`absolute inset-y-0 left-0 ${
                        complete ? "bg-ok/60" : "bg-prog"
                      }`}
                      style={{ width: `${(finished / total) * 100}%` }}
                    />
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </aside>
    </>
  );
}
