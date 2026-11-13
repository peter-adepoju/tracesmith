"use client";

import { useEffect, useState } from "react";
import { TOTAL_DAYS } from "@/lib/curriculum";
import { loadProgress } from "@/lib/progress";

/**
 * Overall progress, plus the ticks on the course map.
 *
 * The map itself is rendered on the server so it is fast and indexable; this
 * component marks the completed days once progress has loaded.
 */
export function CourseProgress() {
  const [done, setDone] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    loadProgress().then((all) => {
      if (!active) return;
      const completed = Object.values(all)
        .filter((entry) => entry.completedAt)
        .map((entry) => entry.dayKey);
      setDone(completed);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    for (const key of done) {
      const card = document.querySelector(`[data-day="${key}"]`);
      if (!card) continue;
      card.classList.add("is-done");
      const tick = card.querySelector("[data-tick]");
      tick?.classList.remove("hidden");
    }
  }, [done, ready]);

  if (!ready || done.length === 0) return null;

  const percent = Math.round((done.length / TOTAL_DAYS) * 100);

  return (
    /* Same shape as HomeProgress: a rule and a hairline meter rather than a
       panel. The two sit on sibling pages and should not look unrelated. */
    <section className="mt-10 border-t border-border pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <span className="text-[0.625rem] font-medium uppercase tracking-[0.18em] text-muted">
          Your progress
        </span>
        <span className="font-mono text-xs tabular-nums text-muted-2">
          {done.length} of {TOTAL_DAYS} · {percent}%
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
    </section>
  );
}
