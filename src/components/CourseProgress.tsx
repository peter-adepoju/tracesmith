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
    <section className="mt-10 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">Your progress</span>
        <span className="text-muted">
          {done.length} of {TOTAL_DAYS} days · {percent}%
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-ok transition-[width]"
          style={{ width: `${Math.max(1, percent)}%` }}
        />
      </div>
    </section>
  );
}
