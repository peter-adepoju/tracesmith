"use client";

import { useRef, useState } from "react";

/**
 * Tab through a real toolbar and watch what the keyboard can reach.
 *
 * These are live DOM nodes, not a picture of them, so the browser's own
 * focus rules decide the outcome — which is the point. The three faults are
 * the three you will actually meet: a div used as a button, a removed focus
 * ring, and a control moved visually by CSS while the tab order keeps
 * following the DOM.
 */

type Faults = {
  divButton: boolean;
  noOutline: boolean;
  cssOrder: boolean;
};

export function KeyboardPass() {
  const [faults, setFaults] = useState<Faults>({
    divButton: true,
    noOutline: true,
    cssOrder: true,
  });
  const [order, setOrder] = useState<string[]>([]);
  const region = useRef<HTMLDivElement>(null);

  const toggle = (key: keyof Faults) => {
    setOrder([]);
    setFaults((previous) => ({ ...previous, [key]: !previous[key] }));
  };

  // focusin bubbles, unlike focus, so one listener on the wrapper sees every
  // element the browser hands focus to.
  const onFocus = (event: React.FocusEvent<HTMLDivElement>) => {
    const label =
      event.target.getAttribute("data-stop") ?? event.target.tagName.toLowerCase();
    setOrder((previous) =>
      previous[previous.length - 1] === label ? previous : [...previous, label],
    );
  };

  const findings = [
    faults.divButton
      ? "Filter is a <div> with a click handler. The keyboard cannot reach it at all, so the feature does not exist for anyone not using a mouse."
      : null,
    faults.noOutline
      ? "Sort has outline: none. It still takes focus, but nothing on screen says so — a sighted keyboard user is lost after the first Tab."
      : null,
    faults.cssOrder
      ? "Buy is moved to the front of the row by CSS, but the tab order follows the DOM, so it is focused last. The order on screen and the order by keyboard disagree."
      : null,
  ].filter(Boolean) as string[];

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          Keyboard-only pass
        </span>
      </div>

      <div className="no-touch-target flex flex-wrap gap-x-4 gap-y-2 border-b border-border p-3 text-sm">
        {(
          [
            ["divButton", "Filter is a div"],
            ["noOutline", "Sort has outline: none"],
            ["cssOrder", "Buy moved by CSS order"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={faults[key]}
              onChange={() => toggle(key)}
            />
            <span className="text-xs">{label}</span>
          </label>
        ))}
      </div>

      <p className="border-b border-border px-3 py-2 text-xs text-muted">
        Click <strong>Start here</strong>, then press Tab repeatedly. Do not
        touch the mouse again — that is the whole method.
      </p>

      <div
        ref={region}
        onFocus={onFocus}
        className="flex flex-wrap items-center gap-2 border-b border-border p-3"
      >
        <button
          type="button"
          data-stop="Start here"
          onClick={() => setOrder([])}
          className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-sm"
        >
          Start here
        </button>

        <input
          data-stop="Search"
          placeholder="Search"
          aria-label="Search"
          className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-sm"
        />

        {faults.divButton ? (
          <div
            data-stop="Filter"
            role="button"
            onClick={() => undefined}
            className="cursor-pointer rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-sm"
          >
            Filter
          </div>
        ) : (
          <button
            type="button"
            data-stop="Filter"
            className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-sm"
          >
            Filter
          </button>
        )}

        <button
          type="button"
          data-stop="Sort"
          style={faults.noOutline ? { outline: "none", boxShadow: "none" } : undefined}
          className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-sm"
        >
          Sort
        </button>

        <button
          type="button"
          data-stop="Help"
          className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-sm"
        >
          Help
        </button>

        <button
          type="button"
          data-stop="Buy"
          style={faults.cssOrder ? { order: -1 } : undefined}
          className="rounded-lg bg-accent px-2.5 py-1.5 text-sm font-medium text-white"
        >
          Buy
        </button>
      </div>

      <div className="grid gap-3 p-3 sm:grid-cols-2">
        <div>
          <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted">
            Focus order, as it happened
          </p>
          {order.length === 0 ? (
            <p className="mt-1.5 text-sm text-muted">
              Nothing focused yet.
            </p>
          ) : (
            <ol className="mt-1.5 space-y-1 text-sm">
              {order.map((stop, i) => (
                <li key={`${stop}-${i}`} className="font-mono text-xs">
                  {i + 1}. {stop}
                </li>
              ))}
            </ol>
          )}
        </div>

        <div>
          <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted">
            What you would write up
          </p>
          {findings.length === 0 ? (
            <p className="mt-1.5 rounded-lg border border-ok/40 bg-ok-soft p-2.5 text-sm">
              Every control is reachable, visibly focused, and in the order it
              appears on screen. Tab through it again and compare — that is
              what a clean pass feels like.
            </p>
          ) : (
            <ul className="mt-1.5 space-y-2 text-sm">
              {findings.map((finding) => (
                <li
                  key={finding}
                  className="rounded-lg border border-bad/40 bg-bad-soft p-2.5"
                >
                  {finding}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <figcaption className="border-t border-border p-3 text-sm text-muted">
        Turn the faults off one at a time and Tab again after each. The
        keyboard pass costs two minutes per screen and finds more than any
        automated scanner, because the scanner cannot tell that the order
        makes no sense.
      </figcaption>
    </figure>
  );
}
