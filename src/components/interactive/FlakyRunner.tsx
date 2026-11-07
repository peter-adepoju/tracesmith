"use client";

import { useState } from "react";

/**
 * Run the same test fifty times and watch the pass rate.
 *
 * Flakiness is a statistical property, so it cannot be felt from one run —
 * which is precisely why teams live with it. Each strategy here is given a
 * randomised page-load time and judged on whether it would have found the
 * element, so the numbers come out different every time, as they should.
 */

type Strategy = {
  id: string;
  code: string;
  /** Does this strategy pass, given a load time in ms? */
  passes: (loadMs: number) => boolean;
  /** Wall-clock cost of one run, given a load time. */
  cost: (loadMs: number) => number;
  verdict: string;
};

const STRATEGIES: Strategy[] = [
  {
    id: "none",
    code: "await page.click('#submit')",
    passes: (loadMs) => loadMs < 150,
    cost: () => 150,
    verdict:
      "No wait at all. It passes often enough to look written-correctly and fails often enough to be useless — which is exactly how a suite earns the reputation of being 'just flaky' rather than being fixed.",
  },
  {
    id: "sleep",
    code: "await page.waitForTimeout(1000)\nawait page.click('#submit')",
    passes: (loadMs) => loadMs < 1000,
    cost: () => 1000,
    verdict:
      "A fixed sleep. It mostly works, it always costs a full second even when the page was ready in 80ms, and it still fails the day the page takes 1100ms. Both slow and unreliable — the worst trade in test automation.",
  },
  {
    id: "sleep-long",
    code: "await page.waitForTimeout(5000)\nawait page.click('#submit')",
    passes: (loadMs) => loadMs < 5000,
    cost: () => 5000,
    verdict:
      "A longer sleep. Nearly always passes, and still not always — and five seconds per test. Across 200 tests that is sixteen minutes of waiting for nothing, every single run — which is how a suite stops being run on every push.",
  },
  {
    id: "auto",
    code: "await page.getByRole('button', { name: 'Submit' }).click()",
    passes: () => true,
    cost: (loadMs) => loadMs + 20,
    verdict:
      "Auto-waiting. Playwright polls until the element exists, is visible, is stable and is enabled, then clicks — returning as soon as it is ready. Fast when the page is fast, patient when it is not. This is the answer.",
  },
];

/** A plausible spread of page-load times, mostly fast with a long tail. */
function loadTime(): number {
  const r = Math.random();
  if (r < 0.75) return 40 + Math.random() * 200;
  if (r < 0.97) return 240 + Math.random() * 900;
  return 1200 + Math.random() * 4200;
}

type Result = { passes: number; runs: number; totalMs: number };

export function FlakyRunner() {
  const [results, setResults] = useState<Record<string, Result> | null>(null);
  const RUNS = 50;

  const run = () => {
    const loads = Array.from({ length: RUNS }, loadTime);
    const next: Record<string, Result> = {};
    for (const strategy of STRATEGIES) {
      let passes = 0;
      let totalMs = 0;
      for (const load of loads) {
        if (strategy.passes(load)) passes += 1;
        totalMs += strategy.cost(load);
      }
      next[strategy.id] = { passes, runs: RUNS, totalMs };
    }
    setResults(next);
  };

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          Fifty runs, four waiting strategies
        </span>
      </div>

      <p className="border-b border-border px-3 py-2 text-xs text-muted">
        The same test, against a page that usually loads in under 250ms and
        occasionally takes several seconds — a normal CI runner under load.
      </p>

      <div className="border-b border-border p-3">
        <button
          type="button"
          onClick={run}
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white"
        >
          {results ? "Run the suite again" : "Run the suite 50 times"}
        </button>
      </div>

      <ul className="divide-y divide-border">
        {STRATEGIES.map((strategy) => {
          const result = results?.[strategy.id];
          const rate = result ? (result.passes / result.runs) * 100 : null;
          const clean = rate === 100;
          return (
            <li key={strategy.id} className="p-3">
              <pre className="overflow-x-auto font-mono text-[0.6875rem] text-muted">
                {strategy.code}
              </pre>
              {result ? (
                <>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <div
                      className="h-2 min-w-[6rem] flex-1 overflow-hidden rounded-full bg-surface-2"
                      role="img"
                      aria-label={`${rate!.toFixed(0)} percent passing`}
                    >
                      <div
                        className={`h-full ${clean ? "bg-ok" : "bg-bad"}`}
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                    <span
                      className={`font-mono text-xs font-semibold ${
                        clean ? "text-ok" : "text-bad"
                      }`}
                    >
                      {result.passes}/{result.runs}
                    </span>
                    <span className="font-mono text-xs text-muted">
                      {(result.totalMs / 1000).toFixed(1)}s total
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted">
                    {strategy.verdict}
                  </p>
                </>
              ) : null}
            </li>
          );
        })}
      </ul>

      <figcaption className="border-t border-border p-3 text-sm text-muted">
        Run it several times. The sleeps change their pass rate between runs
        and the auto-waiting one does not, which is the entire difference
        between a suite people trust and a suite people re-run until it is
        green.
      </figcaption>
    </figure>
  );
}
