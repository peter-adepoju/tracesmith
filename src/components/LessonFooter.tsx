"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { dayKey, neighbours } from "@/lib/curriculum";
import { loadProgress, saveDay } from "@/lib/progress";

export function LessonFooter({
  week,
  day,
}: {
  week: number;
  day: number;
}) {
  const key = dayKey(week, day);
  const { previous, next } = neighbours(week, day);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    loadProgress().then((all) => {
      if (!active) return;
      setDone(Boolean(all[key]?.completedAt));
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [key]);

  async function toggle() {
    const nowDone = !done;
    setDone(nowDone);
    await saveDay({
      dayKey: key,
      completedAt: nowDone ? new Date().toISOString() : null,
      quizScore: null,
      quizTotal: null,
    });
  }

  return (
    <div className="mt-14 border-t border-border pt-6">
      <button
        type="button"
        onClick={toggle}
        disabled={!ready}
        className={`w-full rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
          done
            ? "border-ok/50 bg-ok-soft text-ok"
            : "border-border bg-surface hover:bg-surface-2"
        }`}
      >
        {done ? "Completed. Click to undo." : "Mark this day complete"}
      </button>

      <nav className="mt-4 flex items-stretch justify-between gap-3 text-sm">
        {previous ? (
          <Link
            href={`/day/${previous.week}/${previous.day}`}
            className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:bg-surface-2"
          >
            <div className="text-xs text-muted">Previous</div>
            <div className="font-medium">
              Week {previous.week}, day {previous.day}
            </div>
          </Link>
        ) : (
          <span className="flex-1" />
        )}
        {next ? (
          <Link
            href={`/day/${next.week}/${next.day}`}
            className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-right transition-colors hover:bg-surface-2"
          >
            <div className="text-xs text-muted">Next</div>
            <div className="font-medium">
              Week {next.week}, day {next.day}
            </div>
          </Link>
        ) : (
          <span className="flex-1" />
        )}
      </nav>
    </div>
  );
}
