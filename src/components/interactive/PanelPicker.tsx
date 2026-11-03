"use client";

import { useState } from "react";

/**
 * Which panel do you open first?
 *
 * Knowing what the panels do is easy. Choosing the right one in the first ten
 * seconds of a ticket is the skill, and it only comes from practice. Each
 * answer explains itself whether you were right or wrong, because an
 * unexplained wrong answer teaches nothing.
 */

const PANELS = [
  "Elements",
  "Console",
  "Network",
  "Application",
  "Performance",
  "Security",
] as const;

type Panel = (typeof PANELS)[number];

type Case = {
  symptom: string;
  answer: Panel;
  why: string;
  nearMiss?: { panel: Panel; note: string };
};

const CASES: Case[] = [
  {
    symptom:
      "A merchant says their order total shows as blank, but they can see the order exists.",
    answer: "Network",
    why: "Find the response that should carry the total. If the value is there, the page failed to render it and the bug is front-end; if it is absent, the server never sent it. That one check assigns the ticket.",
    nearMiss: {
      panel: "Elements",
      note: "Reasonable, and it tells you the element exists. But it cannot tell you whether the data arrived, which is the question that decides the owner.",
    },
  },
  {
    symptom: "A customer clicks Submit and absolutely nothing happens.",
    answer: "Console",
    why: "A click handler that throws leaves no visible trace at all. A red error names the file and the line, and if the console is clean you have learned something too: look at Network next to see whether a request fired.",
  },
  {
    symptom:
      "A user reports being logged out every time they open a new tab.",
    answer: "Application",
    why: "Session state lives in cookies or storage. Session Storage is cleared per tab, and a cookie with the wrong expiry or SameSite behaves exactly like this.",
  },
  {
    symptom:
      "A button is visible in a screenshot but the customer says they cannot click it.",
    answer: "Elements",
    why: "Something is probably sitting on top of it, or it is disabled. Inspect it, check for an overlay, and look at the computed styles — an invisible element with opacity 0 above it will swallow every click.",
  },
  {
    symptom: "The dashboard takes eight seconds to appear on a good connection.",
    answer: "Network",
    why: "Open it and sort by time. You are looking for one slow request rather than many; the Timing tab then tells you whether it was the server or the download.",
    nearMiss: {
      panel: "Performance",
      note: "The right panel for rendering and scripting cost, but start with Network: a single slow request explains most 'the page is slow' reports and takes ten seconds to rule out.",
    },
  },
  {
    symptom:
      "On the checkout page the browser shows 'Not secure' even though the URL starts with https.",
    answer: "Security",
    why: "It will name the cause: an invalid or expired certificate, or mixed content — an HTTP resource loaded on an HTTPS page. On a payment page that is a real finding.",
  },
  {
    symptom:
      "A signup bug that several users report, which you cannot reproduce at all.",
    answer: "Application",
    why: "You are almost certainly not in a first-visit state. Clear site data to wipe cookies, storage and caches for the origin, then try again as a genuine new user.",
  },
];

export function PanelPicker() {
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<Panel | null>(null);
  const [score, setScore] = useState({ right: 0, asked: 0 });

  const current = CASES[index];
  const answered = choice !== null;
  const correct = choice === current.answer;

  function next() {
    setChoice(null);
    setIndex((i) => (i + 1) % CASES.length);
  }

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          Which panel first?
        </span>
        <span className="ml-auto font-mono text-xs text-muted">
          {score.right}/{score.asked}
        </span>
      </div>

      <div className="p-4">
        <p className="text-[0.9375rem]">{current.symptom}</p>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PANELS.map((panel) => {
            const isAnswer = panel === current.answer;
            const isChoice = panel === choice;
            let tone = "border-border hover:bg-surface-2";
            if (answered && isAnswer) tone = "border-ok/50 bg-ok-soft";
            else if (answered && isChoice) tone = "border-bad/50 bg-bad-soft";
            else if (answered) tone = "border-border opacity-50";

            return (
              <button
                key={panel}
                type="button"
                disabled={answered}
                onClick={() => {
                  setChoice(panel);
                  setScore((s) => ({
                    right: s.right + (panel === current.answer ? 1 : 0),
                    asked: s.asked + 1,
                  }));
                }}
                className={`rounded-lg border px-3 py-2.5 text-sm transition-colors disabled:cursor-default ${tone}`}
              >
                {panel}
              </button>
            );
          })}
        </div>

        {answered ? (
          <div className="mt-3 space-y-2 text-sm">
            <p className={correct ? "text-ok" : "text-bad"}>
              {correct ? "Yes." : `The first stop is ${current.answer}.`}
            </p>
            <p>{current.why}</p>
            {current.nearMiss && choice === current.nearMiss.panel ? (
              <p className="rounded-lg bg-surface-2 p-2.5 text-xs text-muted">
                <strong>On {current.nearMiss.panel}. </strong>
                {current.nearMiss.note}
              </p>
            ) : null}
            <button
              type="button"
              onClick={next}
              className="mt-1 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white"
            >
              Next symptom
            </button>
          </div>
        ) : null}
      </div>
    </figure>
  );
}
