"use client";

import { useState } from "react";

/**
 * Rank what to test first.
 *
 * Testing time is always shorter than the list of things that could be
 * tested, so the real skill is choosing. Drag each area to a likelihood and
 * impact, and the order falls out — then compare it with how an experienced
 * tester would have ranked the same set, and why.
 */

type Area = {
  id: string;
  label: string;
  /** What an experienced tester would say, 1 to 3. */
  trueLikelihood: number;
  trueImpact: number;
  reason: string;
};

const AREAS: Area[] = [
  {
    id: "checkout",
    label: "Checkout and payment",
    trueLikelihood: 2,
    trueImpact: 3,
    reason:
      "Changed often, touches money, and a failure is unrecoverable for the customer. Even a modest chance of breaking makes this first.",
  },
  {
    id: "login",
    label: "Sign in and sessions",
    trueLikelihood: 2,
    trueImpact: 3,
    reason:
      "If this breaks, nothing else can be used at all. It gates everything, so its impact is the sum of everything behind it.",
  },
  {
    id: "search",
    label: "Product search",
    trueLikelihood: 3,
    trueImpact: 2,
    reason:
      "Fiddly, frequently changed and full of edge cases, so it breaks often. Annoying rather than catastrophic — people can still browse.",
  },
  {
    id: "admin-refund",
    label: "Admin refunds",
    trueLikelihood: 1,
    trueImpact: 3,
    reason:
      "Rarely touched, so unlikely to break. When it does, money moves wrongly and only staff can see it, which means it can run wrong for weeks.",
  },
  {
    id: "profile",
    label: "Edit your profile",
    trueLikelihood: 2,
    trueImpact: 1,
    reason:
      "Ordinary form work. Breaks at a normal rate and costs a customer some inconvenience, not money.",
  },
  {
    id: "footer",
    label: "Footer links",
    trueLikelihood: 1,
    trueImpact: 1,
    reason:
      "Static, almost never changed, and a broken link is embarrassing rather than expensive. Worth one minute, not one hour.",
  },
];

const SCALE = ["low", "medium", "high"];

export function RiskMatrix() {
  const [scores, setScores] = useState<Record<string, { l: number; i: number }>>(
    Object.fromEntries(AREAS.map((a) => [a.id, { l: 2, i: 2 }])),
  );
  const [revealed, setRevealed] = useState(false);
  const [open, setOpen] = useState<Area | null>(null);

  const ranked = [...AREAS].sort((a, b) => {
    const sa = scores[a.id].l * scores[a.id].i;
    const sb = scores[b.id].l * scores[b.id].i;
    if (sb !== sa) return sb - sa;
    return scores[b.id].i - scores[a.id].i;
  });

  const trueRanked = [...AREAS].sort(
    (a, b) =>
      b.trueLikelihood * b.trueImpact - a.trueLikelihood * a.trueImpact ||
      b.trueImpact - a.trueImpact,
  );

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          What would you test first?
        </span>
        <button
          type="button"
          onClick={() => setRevealed((r) => !r)}
          className="ml-auto rounded bg-accent px-2.5 py-1 text-xs font-medium text-white"
        >
          {revealed ? "Hide" : "Compare"}
        </button>
      </div>

      <div className="no-touch-target space-y-2 p-3">
        {AREAS.map((area) => (
          <div key={area.id} className="rounded-lg border border-border p-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{area.label}</span>
              <span className="ml-auto font-mono text-xs text-muted">
                score {scores[area.id].l * scores[area.id].i}
              </span>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {(["l", "i"] as const).map((axis) => (
                <label key={axis} className="text-xs">
                  <span className="text-muted">
                    {axis === "l" ? "Chance it breaks" : "Damage if it does"}:{" "}
                    {SCALE[scores[area.id][axis] - 1]}
                  </span>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    value={scores[area.id][axis]}
                    onChange={(event) =>
                      setScores((previous) => ({
                        ...previous,
                        [area.id]: {
                          ...previous[area.id],
                          [axis]: Number(event.target.value),
                        },
                      }))
                    }
                    className="mt-0.5 w-full accent-[var(--accent)]"
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 border-t border-border p-3 sm:grid-cols-2">
        <div>
          <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted">
            Your order
          </p>
          <ol className="mt-1.5 space-y-1 text-sm">
            {ranked.map((area, index) => (
              <li key={area.id} className="font-mono text-xs">
                {index + 1}. {area.label}
              </li>
            ))}
          </ol>
        </div>
        {revealed ? (
          <div>
            <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted">
              A tester with scars
            </p>
            <ol className="mt-1.5 space-y-1 text-sm">
              {trueRanked.map((area, index) => (
                <li key={area.id}>
                  <button
                    type="button"
                    onClick={() => setOpen(area)}
                    className="font-mono text-xs underline decoration-dotted"
                  >
                    {index + 1}. {area.label}
                  </button>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>

      <figcaption className="border-t border-border p-3 text-sm">
        {open ? (
          <p>
            <strong>{open.label}. </strong>
            {open.reason}
          </p>
        ) : revealed ? (
          <p className="text-muted">
            Click any item for the reasoning. Where you disagree, work out
            which of the two numbers you scored differently — that is usually
            where the real argument is.
          </p>
        ) : (
          <p className="text-muted">
            Score each area, then compare. The two numbers are independent:
            something can be very likely to break and barely matter, or almost
            never break and be catastrophic when it does.
          </p>
        )}
      </figcaption>
    </figure>
  );
}
