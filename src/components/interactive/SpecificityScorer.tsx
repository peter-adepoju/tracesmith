"use client";

import { useState } from "react";

/**
 * Score two selectors and see which wins.
 *
 * Specificity looks arbitrary until you count it once. Typing your own
 * selectors and watching the three columns fill in is the fastest way to stop
 * guessing.
 */

type Score = { ids: number; classes: number; elements: number };

/**
 * Count a selector as ids, classes and elements.
 *
 * Good enough for every selector you will meet in a lesson or a stylesheet,
 * and deliberately simple: it strips pseudo-elements, counts #id, then
 * .class, [attr] and :pseudo-class together, then bare element names.
 */
function score(selector: string): Score {
  const cleaned = selector
    .replace(/\s*[>+~]\s*/g, " ")
    .replace(/\*/g, " ")
    .trim();
  if (!cleaned) return { ids: 0, classes: 0, elements: 0 };

  const ids = (cleaned.match(/#[\w-]+/g) ?? []).length;
  const elementsFromPseudo = (cleaned.match(/::[\w-]+/g) ?? []).length;
  const withoutPseudoElements = cleaned.replace(/::[\w-]+/g, " ");
  const classes =
    (withoutPseudoElements.match(/\.[\w-]+/g) ?? []).length +
    (withoutPseudoElements.match(/\[[^\]]+\]/g) ?? []).length +
    (withoutPseudoElements.match(/:(?!:)[\w-]+(\([^)]*\))?/g) ?? []).length;
  const elements =
    (withoutPseudoElements
      .replace(/#[\w-]+/g, " ")
      .replace(/\.[\w-]+/g, " ")
      .replace(/\[[^\]]+\]/g, " ")
      .replace(/:(?!:)[\w-]+(\([^)]*\))?/g, " ")
      .match(/\b[a-zA-Z][\w-]*/g) ?? []).length + elementsFromPseudo;

  return { ids, classes, elements };
}

function compare(a: Score, b: Score): number {
  if (a.ids !== b.ids) return a.ids - b.ids;
  if (a.classes !== b.classes) return a.classes - b.classes;
  return a.elements - b.elements;
}

const EXAMPLES: [string, string][] = [
  ["#main .btn", ".page .card .btn.primary"],
  ["nav a:hover", ".nav-link"],
  ["ul li", "li"],
  ["[disabled]", "button:disabled"],
];

export function SpecificityScorer() {
  const [a, setA] = useState("#main .btn");
  const [b, setB] = useState(".page .card .btn.primary");
  const [importantA, setImportantA] = useState(false);
  const [importantB, setImportantB] = useState(false);

  const sa = score(a);
  const sb = score(b);

  let winner: "a" | "b" | "tie";
  let because: string;

  if (importantA !== importantB) {
    winner = importantA ? "a" : "b";
    because =
      "An !important declaration is resolved before specificity is even looked at. That is why it wins, and why the next person who needs to override it has only one tool left.";
  } else {
    const diff = compare(sa, sb);
    if (diff > 0) {
      winner = "a";
    } else if (diff < 0) {
      winner = "b";
    } else {
      winner = "tie";
    }
    const column =
      sa.ids !== sb.ids
        ? "ids"
        : sa.classes !== sb.classes
          ? "classes"
          : sa.elements !== sb.elements
            ? "elements"
            : null;
    because =
      winner === "tie"
        ? "Identical scores, so neither wins on specificity. Whichever is written last in the stylesheet applies."
        : `Decided on the ${column} column. Comparison runs left to right and stops at the first difference, which is why any number of classes never beats a single id.`;
  }

  const Row = ({
    label,
    value,
    onChange,
    s,
    important,
    onImportant,
    won,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    s: Score;
    important: boolean;
    onImportant: (v: boolean) => void;
    won: boolean;
  }) => (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        won ? "border-ok/50 bg-ok-soft" : "border-border"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-muted">{label}</span>
        {won ? (
          <span className="rounded bg-ok/20 px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-ok">
            wins
          </span>
        ) : null}
      </div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        className="mt-1.5 w-full rounded-md border border-border bg-bg px-2 py-1.5 font-mono text-sm"
        aria-label={`Selector ${label}`}
      />
      <div className="mt-2 flex items-center gap-3">
        <div className="flex gap-1 font-mono text-sm">
          {([
            ["ids", s.ids],
            ["classes", s.classes],
            ["elements", s.elements],
          ] as const).map(([name, n]) => (
            <span
              key={name}
              title={name}
              className={`grid h-8 w-8 place-items-center rounded ${
                n > 0 ? "bg-accent text-white" : "bg-surface-2 text-muted"
              }`}
            >
              {n}
            </span>
          ))}
        </div>
        <label className="ml-auto flex items-center gap-1.5 text-xs text-muted">
          <input
            type="checkbox"
            checked={important}
            onChange={(event) => onImportant(event.target.checked)}
          />
          !important
        </label>
      </div>
    </div>
  );

  return (
    <figure className="no-touch-target my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          Which selector wins
        </span>
        <select
          className="ml-auto max-w-[12rem] rounded border border-border bg-bg px-1.5 py-1 text-xs"
          defaultValue=""
          onChange={(event) => {
            const pair = EXAMPLES[Number(event.target.value)];
            if (!pair) return;
            setA(pair[0]);
            setB(pair[1]);
            setImportantA(false);
            setImportantB(false);
          }}
          aria-label="Load an example pair"
        >
          <option value="" disabled>
            Examples…
          </option>
          {EXAMPLES.map(([x, y], index) => (
            <option key={x + y} value={index}>
              {x} vs {y}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 p-3">
        <Row
          label="A"
          value={a}
          onChange={setA}
          s={sa}
          important={importantA}
          onImportant={setImportantA}
          won={winner === "a"}
        />
        <Row
          label="B"
          value={b}
          onChange={setB}
          s={sb}
          important={importantB}
          onImportant={setImportantB}
          won={winner === "b"}
        />
      </div>

      <figcaption className="border-t border-border p-3 text-sm">
        <p className="font-mono text-xs text-muted">
          {sa.ids}-{sa.classes}-{sa.elements} versus {sb.ids}-{sb.classes}-
          {sb.elements}
        </p>
        <p className="mt-1.5">{because}</p>
        <p className="mt-2 text-xs text-muted">
          An inline <code>style</code> attribute beats every selector here, and{" "}
          <code>!important</code> beats even that.
        </p>
      </figcaption>
    </figure>
  );
}
