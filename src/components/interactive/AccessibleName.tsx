"use client";

import { useState } from "react";

/**
 * What a screen reader will actually announce.
 *
 * The Accessibility tab in DevTools computes this for you, and almost nobody
 * opens it. Toggling the sources here shows the precedence: aria-labelledby
 * beats aria-label, which beats the element's own text, which beats title.
 *
 * Simplified deliberately — the full specification has more sources and more
 * edge cases — but the precedence shown is the one that decides real buttons.
 */

type Sources = {
  text: boolean;
  ariaLabel: boolean;
  ariaLabelledby: boolean;
  title: boolean;
};

export function AccessibleName() {
  const [on, setOn] = useState<Sources>({
    text: false,
    ariaLabel: false,
    ariaLabelledby: false,
    title: false,
  });

  const toggle = (key: keyof Sources) =>
    setOn((previous) => ({ ...previous, [key]: !previous[key] }));

  // The precedence, highest first.
  const name = on.ariaLabelledby
    ? "Delete order"
    : on.ariaLabel
      ? "Delete this order"
      : on.text
        ? "Delete"
        : on.title
          ? "Delete order permanently"
          : "";

  const from = on.ariaLabelledby
    ? "aria-labelledby"
    : on.ariaLabel
      ? "aria-label"
      : on.text
        ? "its own text content"
        : on.title
          ? "title"
          : null;

  const markup = [
    "<button",
    on.ariaLabelledby ? '  aria-labelledby="lbl"' : null,
    on.ariaLabel ? '  aria-label="Delete this order"' : null,
    on.title ? '  title="Delete order permanently"' : null,
    ">",
    on.text ? "  Delete" : "  <svg>…</svg>",
    "</button>",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          Computed accessible name
        </span>
      </div>

      <div className="no-touch-target flex flex-wrap gap-x-4 gap-y-2 p-3 text-sm">
        {(
          [
            ["text", "visible text"],
            ["ariaLabel", "aria-label"],
            ["ariaLabelledby", "aria-labelledby"],
            ["title", "title"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={on[key]}
              onChange={() => toggle(key)}
            />
            <code className="text-xs">{label}</code>
          </label>
        ))}
      </div>

      <div className="grid gap-3 border-t border-border p-3 sm:grid-cols-2">
        <div>
          <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted">
            The markup
          </p>
          <pre className="mt-1.5 overflow-x-auto rounded-lg bg-[var(--code-bg)] p-2.5 font-mono text-[0.6875rem] text-[var(--code-text)]">
            {markup}
          </pre>
        </div>

        <div>
          <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted">
            What a screen reader says
          </p>
          <div
            className={`mt-1.5 rounded-lg border p-3 ${
              name ? "border-ok/40 bg-ok-soft" : "border-bad/40 bg-bad-soft"
            }`}
          >
            <p className="font-medium">
              {name ? `"${name}, button"` : '"button"'}
            </p>
            <p className="mt-1 text-xs text-muted">
              {from
                ? `Taken from ${from}.`
                : "No accessible name at all. The user is told there is a button and nothing about what it does."}
            </p>
          </div>
        </div>
      </div>

      <figcaption className="border-t border-border p-3 text-sm text-muted">
        Turn everything off: that is an icon-only button with no label, and it
        is a real finding you will meet constantly. Then turn several on and
        watch which one wins — the lower sources are not read at all, so a
        helpful <code>title</code> under an <code>aria-label</code> is never
        heard. Check any element yourself in DevTools under{" "}
        <strong>Elements → Accessibility</strong>.
      </figcaption>
    </figure>
  );
}
