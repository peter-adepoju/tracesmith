"use client";

import { useEffect, useState } from "react";

/**
 * The eight steps of a request, animated.
 *
 * Play it, step through it, or scrub. Each step says where it happens and what
 * can go wrong there, because "which step broke?" is the question the whole
 * course is built around.
 */

type Step = {
  n: number;
  where: "browser" | "network" | "server";
  title: string;
  detail: string;
  breaks: string;
};

const STEPS: Step[] = [
  {
    n: 1,
    where: "browser",
    title: "Read the URL",
    detail: "The browser splits it into scheme, host and path.",
    breaks: "A typo in the address. Nothing has left the machine yet.",
  },
  {
    n: 2,
    where: "network",
    title: "Look up the address (DNS)",
    detail: "example.com becomes an IP address a computer can connect to.",
    breaks: "DNS failure: the name cannot be resolved. No request is sent.",
  },
  {
    n: 3,
    where: "network",
    title: "Open a connection",
    detail: "A TCP connection, and over HTTPS a negotiated encryption layer.",
    breaks: "Connection refused, or an invalid certificate.",
  },
  {
    n: 4,
    where: "browser",
    title: "Send the request",
    detail: "Method, path, headers, and sometimes a body.",
    breaks: "A missing credential here produces a 401 at step 6.",
  },
  {
    n: 5,
    where: "server",
    title: "The server works",
    detail: "Checks who you are, reads a database, decides what you may see.",
    breaks: "A crash here is a 5xx. Nothing you send will fix it.",
  },
  {
    n: 6,
    where: "server",
    title: "Send the response",
    detail: "A status code, headers, and usually a body.",
    breaks: "4xx means your request was wrong; 5xx means theirs failed.",
  },
  {
    n: 7,
    where: "browser",
    title: "Build the page",
    detail: "Parse the HTML, then request every stylesheet, image and script.",
    breaks: "One page is dozens of requests. Any of them can fail alone.",
  },
  {
    n: 8,
    where: "browser",
    title: "Scripts run",
    detail: "JavaScript executes and fetches more data in the background.",
    breaks: "A console error here leaves the page looking half-finished.",
  },
];

const LANE: Record<Step["where"], { label: string; tone: string }> = {
  browser: { label: "Your browser", tone: "bg-accent" },
  network: { label: "The network", tone: "bg-warn" },
  server: { label: "The server", tone: "bg-ok" },
};

export function RequestJourney() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => {
      setActive((current) => {
        if (current >= STEPS.length - 1) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1600);
    return () => clearTimeout(id);
  }, [playing, active]);

  const step = STEPS[active];

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          One request, step by step
        </span>
        <div className="ml-auto flex gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActive(0);
              setPlaying(true);
            }}
            className="rounded bg-accent px-2.5 py-1 text-xs font-medium text-white"
          >
            {playing ? "Playing…" : "Play"}
          </button>
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setActive((c) => Math.max(0, c - 1));
            }}
            className="rounded border border-border px-2 py-1 text-xs"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setActive((c) => Math.min(STEPS.length - 1, c + 1));
            }}
            className="rounded border border-border px-2 py-1 text-xs"
          >
            Step
          </button>
        </div>
      </div>

      {/* Three lanes, with the packet sitting in whichever one is active */}
      <div className="space-y-2 p-4">
        {(["browser", "network", "server"] as const).map((lane) => (
          <div key={lane} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs text-muted">
              {LANE[lane].label}
            </span>
            <div className="relative h-9 flex-1 rounded-lg border border-border bg-surface-2">
              <div
                className={`absolute top-1 h-7 rounded-md transition-all duration-500 ease-out ${LANE[lane].tone} ${
                  step.where === lane ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  left: `calc(${(active / (STEPS.length - 1)) * 88}% + 4px)`,
                  width: "11%",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Step chips */}
      <div className="flex flex-wrap gap-1 border-t border-border px-4 py-2">
        {STEPS.map((item, index) => (
          <button
            key={item.n}
            type="button"
            onClick={() => {
              setPlaying(false);
              setActive(index);
            }}
            className={`h-6 w-6 rounded text-xs transition-colors ${
              index === active
                ? "bg-accent font-semibold text-white"
                : index < active
                  ? "bg-surface-2 text-text"
                  : "bg-surface-2 text-muted"
            }`}
            aria-label={`Step ${item.n}: ${item.title}`}
          >
            {item.n}
          </button>
        ))}
      </div>

      <figcaption className="border-t border-border p-4">
        <p className="text-sm font-semibold">
          {step.n}. {step.title}
        </p>
        <p className="mt-1 text-sm text-muted">{step.detail}</p>
        <p className="mt-2 rounded-lg bg-bad-soft px-2.5 py-1.5 text-xs">
          <strong>What breaks here. </strong>
          {step.breaks}
        </p>
      </figcaption>
    </figure>
  );
}
