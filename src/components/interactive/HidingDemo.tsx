"use client";

import { useState } from "react";

/**
 * The three ways to hide something, side by side, with proof.
 *
 * Reading that opacity:0 leaves an element clickable is one thing. Clicking
 * where it is and watching the counter go up is another. The neighbour box
 * shows which methods still occupy space.
 */

type Method = "visible" | "display" | "visibility" | "opacity";

const METHODS: {
  id: Method;
  css: string;
  takesSpace: boolean;
  clickable: boolean;
  inDom: boolean;
}[] = [
  { id: "visible", css: "(none)", takesSpace: true, clickable: true, inDom: true },
  { id: "display", css: "display: none", takesSpace: false, clickable: false, inDom: true },
  { id: "visibility", css: "visibility: hidden", takesSpace: true, clickable: false, inDom: true },
  { id: "opacity", css: "opacity: 0", takesSpace: true, clickable: true, inDom: true },
];

const STYLE: Record<Method, React.CSSProperties> = {
  visible: {},
  display: { display: "none" },
  visibility: { visibility: "hidden" },
  opacity: { opacity: 0 },
};

export function HidingDemo() {
  const [method, setMethod] = useState<Method>("opacity");
  const [hits, setHits] = useState(0);
  const [missed, setMissed] = useState(0);

  const current = METHODS.find((m) => m.id === method)!;

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          Three ways to hide a button
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 p-3">
        {METHODS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setMethod(m.id);
              setHits(0);
              setMissed(0);
            }}
            className={`rounded-lg border px-2.5 py-1.5 font-mono text-xs transition-colors ${
              method === m.id
                ? "border-accent bg-accent-soft font-semibold"
                : "border-border hover:bg-surface-2"
            }`}
          >
            {m.css}
          </button>
        ))}
      </div>

      {/* The stage. A click anywhere in here that is not the button counts as
          a miss, which is how you feel the difference between the methods. */}
      <div
        onClick={() => setMissed((n) => n + 1)}
        className="relative mx-3 mb-3 cursor-pointer rounded-lg border border-dashed border-border bg-surface-2 p-4"
      >
        <p className="mb-2 text-xs text-muted">
          Click where the orange button is, or should be.
        </p>
        <button
          type="button"
          style={STYLE[method]}
          onClick={(event) => {
            event.stopPropagation();
            setHits((n) => n + 1);
          }}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white"
        >
          Buy now
        </button>
        <p className="mt-2 rounded border border-border bg-bg px-2 py-1 text-xs">
          A neighbour, to show whether the button still takes up space.
        </p>
      </div>

      <figcaption className="border-t border-border p-4 text-sm">
        <div className="flex flex-wrap gap-4 font-mono text-xs">
          <span className="text-ok">button clicked: {hits}</span>
          <span className="text-muted">clicked past it: {missed}</span>
          {hits > 0 && method === "opacity" ? (
            <span className="text-bad">
              you clicked an invisible button
            </span>
          ) : null}
        </div>

        <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          {[
            ["In the DOM", current.inDom],
            ["Takes up space", current.takesSpace],
            ["Still clickable", current.clickable],
          ].map(([label, value]) => (
            <div
              key={label as string}
              className={`rounded-lg border p-2 ${
                value ? "border-ok/40 bg-ok-soft" : "border-border bg-surface-2"
              }`}
            >
              <dt className="text-muted">{label as string}</dt>
              <dd className="mt-0.5 font-semibold">{value ? "yes" : "no"}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-3 text-muted">
          {method === "display"
            ? "Removed from the layout entirely. The neighbour moves up. A test can still find it in the DOM, which is why 'the element is missing' and 'the element is hidden' are different findings."
            : method === "visibility"
              ? "Invisible, but still occupying its space. That unexplained gap in a layout is very often this."
              : method === "opacity"
                ? "Fully transparent, still in the layout, and still receiving clicks. An invisible button sitting on top of your interface and swallowing taps is one of the nastiest bugs on this list."
                : "Nothing applied. This is the baseline to compare the others against."}
        </p>
      </figcaption>
    </figure>
  );
}
