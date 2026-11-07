"use client";

import { useState } from "react";

/**
 * Pick a locator, then change the page under it.
 *
 * Every locator here finds the right button today. The difference only shows
 * up when a developer does something ordinary — renames a class, wraps a
 * div, adds a second button — which is exactly when a suite either keeps
 * working or starts costing more than it saves.
 */

type ChangeId = "class" | "wrap" | "copy" | "second";

type Change = {
  id: ChangeId;
  label: string;
  detail: string;
};

const CHANGES: Change[] = [
  {
    id: "class",
    label: "A class is renamed",
    detail:
      "btn-primary becomes button--primary during a design-system migration. Nothing visible changed.",
  },
  {
    id: "wrap",
    label: "The markup is restructured",
    detail:
      "A developer wraps the button in an extra div for layout. The page looks identical.",
  },
  {
    id: "copy",
    label: "The wording changes",
    detail: 'Marketing changes "Place order" to "Complete purchase".',
  },
  {
    id: "second",
    label: "A second button appears",
    detail:
      "A sticky bar adds a duplicate Place order button at the bottom of the page.",
  },
];

type Locator = {
  id: string;
  code: string;
  kind: "brittle" | "fragile" | "good" | "best";
  /** Which changes break it. */
  breaks: ChangeId[];
  /** What happens when it breaks, by change. */
  note: string;
};

const LOCATORS: Locator[] = [
  {
    id: "xpath",
    code: "page.locator('//div[2]/div/form/div[3]/button[1]')",
    kind: "brittle",
    breaks: ["wrap", "second"],
    note: "An absolute path through the document. It encodes the shape of the page, so any structural change breaks it — and the failure says nothing about what went wrong.",
  },
  {
    id: "css-class",
    code: "page.locator('.btn-primary.checkout-submit')",
    kind: "fragile",
    breaks: ["class", "second"],
    note: "Classes are for styling, and styling is changed by people who have never heard of your test suite. It also silently matches both buttons once a second one appears.",
  },
  {
    id: "text",
    code: "page.getByText('Place order')",
    kind: "fragile",
    breaks: ["copy", "second"],
    note: "Readable, and tied to wording that marketing owns. It also matches any element containing the text, not only the button.",
  },
  {
    id: "role",
    code: "page.getByRole('button', { name: 'Place order' })",
    kind: "good",
    breaks: ["copy", "second"],
    note: "The best default. It finds the element the way a screen reader does, so it survives restructuring and restyling — and if it breaks because the name changed, that is a real change a user would notice too.",
  },
  {
    id: "testid",
    code: "page.getByTestId('checkout-submit')",
    kind: "best",
    breaks: [],
    note: "An attribute that exists only for testing, so nothing else has a reason to change it. The cost is that it must be added to the markup, and it tests an attribute rather than anything a user can perceive.",
  },
];

const KIND_LABEL: Record<Locator["kind"], string> = {
  brittle: "Brittle",
  fragile: "Fragile",
  good: "Good",
  best: "Most stable",
};

export function SelectorLab() {
  const [applied, setApplied] = useState<ChangeId[]>([]);

  const toggle = (id: ChangeId) =>
    setApplied((previous) =>
      previous.includes(id)
        ? previous.filter((p) => p !== id)
        : [...previous, id],
    );

  const broken = (locator: Locator) =>
    locator.breaks.filter((b) => applied.includes(b));

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          Which locator survives?
        </span>
      </div>

      <p className="border-b border-border px-3 py-2 text-xs text-muted">
        All five find the <strong>Place order</strong> button on today&apos;s
        page. Apply the changes a developer might make next sprint.
      </p>

      <div className="no-touch-target grid gap-2 border-b border-border p-3 sm:grid-cols-2">
        {CHANGES.map((change) => (
          <label
            key={change.id}
            className="flex cursor-pointer items-start gap-2 rounded-lg border border-border p-2.5 text-xs hover:bg-surface-2"
          >
            <input
              type="checkbox"
              checked={applied.includes(change.id)}
              onChange={() => toggle(change.id)}
              className="mt-0.5"
            />
            <span>
              <strong className="block">{change.label}</strong>
              <span className="text-muted">{change.detail}</span>
            </span>
          </label>
        ))}
      </div>

      <ul className="divide-y divide-border">
        {LOCATORS.map((locator) => {
          const hits = broken(locator);
          const failed = hits.length > 0;
          return (
            <li
              key={locator.id}
              className={`p-3 ${failed ? "bg-bad-soft" : ""}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <code className="min-w-0 flex-1 break-all font-mono text-[0.6875rem]">
                  {locator.code}
                </code>
                <span
                  className={`rounded px-1.5 py-0.5 text-[0.5625rem] font-semibold uppercase tracking-wider ${
                    failed
                      ? "bg-bad text-white"
                      : "bg-surface-2 text-muted"
                  }`}
                >
                  {failed ? "broken" : KIND_LABEL[locator.kind]}
                </span>
              </div>
              {failed ? (
                <p className="mt-1.5 text-xs">
                  <strong>
                    Broken by:{" "}
                    {hits
                      .map((h) => CHANGES.find((c) => c.id === h)!.label.toLowerCase())
                      .join(", ")}
                    .
                  </strong>{" "}
                  {locator.note}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      <figcaption className="border-t border-border p-3 text-sm text-muted">
        Apply all four. Only the test id survives everything — but notice
        that <code>getByRole</code> breaks on exactly the two changes a user
        would also notice, which is a failure worth having. A test that
        breaks when nothing a user cares about changed is the one that
        teaches a team to ignore red.
      </figcaption>
    </figure>
  );
}
