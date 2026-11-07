"use client";

import { useState } from "react";

/**
 * Place real bugs on the severity and priority grid.
 *
 * The distinction is simple to state and hard to apply, and the corners that
 * teach it are the awkward ones: high severity with low priority, and low
 * severity with high priority. Getting those two right is the test of
 * whether someone has actually understood it.
 */

type Bug = {
  id: string;
  text: string;
  severity: 0 | 1;
  priority: 0 | 1;
  why: string;
};

const BUGS: Bug[] = [
  {
    id: "double",
    text: "Clicking Place order twice charges the customer twice",
    severity: 1,
    priority: 1,
    why: "Money taken wrongly, reachable by any customer, and it damages trust the moment it happens. Terrible and urgent.",
  },
  {
    id: "crash-admin",
    text: "The admin bulk-export crashes when a report covers more than 5 years",
    severity: 1,
    priority: 0,
    why: "A crash and data loss, so severity is high. But only staff hit it, only on an unusual range, and there is a workaround — export in two halves. Bad, and it can wait.",
  },
  {
    id: "logo",
    text: "The wrong company logo appears on the checkout page",
    severity: 0,
    priority: 1,
    why: "Nothing breaks and no data is wrong, so severity is low. Every paying customer sees it and it looks like a scam site, so it is fixed today.",
  },
  {
    id: "typo",
    text: "A typo in an internal tooltip only staff can see",
    severity: 0,
    priority: 0,
    why: "Harmless and almost invisible. Fix it when someone is passing.",
  },
  {
    id: "leak",
    text: "The orders API returns another customer's email in every response",
    severity: 1,
    priority: 1,
    why: "A data leak affecting everyone, invisible on screen, and reportable to a regulator. Both axes at maximum.",
  },
  {
    id: "slow-report",
    text: "A monthly report takes 40 seconds to load instead of 4",
    severity: 0,
    priority: 0,
    why: "Nothing is wrong with the data and it is used once a month. Annoying; neither severe nor urgent.",
  },
];

const CORNERS: { s: 0 | 1; p: 0 | 1; label: string; tone: string }[] = [
  { s: 1, p: 1, label: "High severity, high priority", tone: "border-bad/50 bg-bad-soft" },
  { s: 1, p: 0, label: "High severity, low priority", tone: "border-warn/50 bg-warn-soft" },
  { s: 0, p: 1, label: "Low severity, high priority", tone: "border-warn/50 bg-warn-soft" },
  { s: 0, p: 0, label: "Low severity, low priority", tone: "border-border bg-surface-2" },
];

export function SeverityGrid() {
  const [placed, setPlaced] = useState<Record<string, { s: 0 | 1; p: 0 | 1 }>>({});
  const [checked, setChecked] = useState(false);
  const [open, setOpen] = useState<Bug | null>(null);

  const unplaced = BUGS.filter((b) => !placed[b.id]);
  const correct = BUGS.filter(
    (b) => placed[b.id]?.s === b.severity && placed[b.id]?.p === b.priority,
  );

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          Severity against priority
        </span>
        <div className="ml-auto flex gap-1.5">
          <button
            type="button"
            onClick={() => setChecked(true)}
            disabled={unplaced.length > 0}
            className="rounded bg-accent px-2.5 py-1 text-xs font-medium text-white disabled:opacity-40"
          >
            Check
          </button>
          <button
            type="button"
            onClick={() => {
              setPlaced({});
              setChecked(false);
              setOpen(null);
            }}
            className="rounded border border-border px-2 py-1 text-xs"
          >
            Reset
          </button>
        </div>
      </div>

      {unplaced.length > 0 ? (
        <div className="space-y-2 border-b border-border p-3">
          <p className="text-xs text-muted">
            {unplaced.length} left to place. Pick a corner for each.
          </p>
          {unplaced.map((bug) => (
            <div key={bug.id} className="rounded-lg border border-border p-2.5">
              <p className="text-sm">{bug.text}</p>
              <div className="no-touch-target mt-2 grid grid-cols-2 gap-1.5">
                {CORNERS.map((corner) => (
                  <button
                    key={corner.label}
                    type="button"
                    onClick={() =>
                      setPlaced((previous) => ({
                        ...previous,
                        [bug.id]: { s: corner.s, p: corner.p },
                      }))
                    }
                    className="rounded border border-border px-2 py-1.5 text-[0.6875rem] hover:bg-surface-2"
                  >
                    {corner.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 p-3">
        {CORNERS.map((corner) => {
          const here = BUGS.filter(
            (b) => placed[b.id]?.s === corner.s && placed[b.id]?.p === corner.p,
          );
          return (
            <div
              key={corner.label}
              className={`min-h-24 rounded-lg border p-2 ${corner.tone}`}
            >
              <p className="text-[0.625rem] font-semibold uppercase tracking-wider opacity-70">
                {corner.label}
              </p>
              <ul className="mt-1.5 space-y-1">
                {here.map((bug) => {
                  const right =
                    bug.severity === corner.s && bug.priority === corner.p;
                  return (
                    <li key={bug.id}>
                      <button
                        type="button"
                        onClick={() => setOpen(bug)}
                        className={`block w-full rounded border bg-bg/70 p-1.5 text-left text-xs ${
                          checked
                            ? right
                              ? "border-ok"
                              : "border-bad"
                            : "border-transparent"
                        }`}
                      >
                        {bug.text}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <figcaption className="border-t border-border p-3 text-sm">
        {checked ? (
          <>
            <p className="font-mono text-xs">
              <span className={correct.length === BUGS.length ? "text-ok" : "text-warn"}>
                {correct.length}/{BUGS.length} placed correctly
              </span>
            </p>
            <p className="mt-1.5 text-muted">
              Click any bug for the reasoning. The two awkward corners are the
              real test: a crash only staff can work around is severe and not
              urgent, and a wrong logo is trivial and must be fixed today.
            </p>
          </>
        ) : open ? (
          <p>
            <strong>Why. </strong>
            {open.why}
          </p>
        ) : (
          <p className="text-muted">
            Severity is how much damage it does. Priority is how soon it must
            be fixed. They are independent, and the corners where they
            disagree are the ones worth arguing about.
          </p>
        )}
      </figcaption>
    </figure>
  );
}
