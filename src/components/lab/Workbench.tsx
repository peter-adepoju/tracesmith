"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  DEFECTS,
  SEVERITY_ORDER,
  matchReport,
  type Lab,
  type Severity,
} from "@/lib/labs";

/**
 * The lab workbench.
 *
 * Meridian runs in an iframe on the left; the tools are on the right. Because
 * the iframe is same-origin, the workbench can instrument it directly — patch
 * its console, wrap its fetch, listen for its uncaught errors — without
 * putting any test code inside the product itself, which is how you would
 * want it at work.
 *
 * Real DevTools still work on the iframe too. The panels here are a
 * convenience, not a replacement: press F12 whenever you want the real thing.
 */

type ConsoleEntry = { level: string; text: string; at: string };
type NetEntry = {
  method: string;
  url: string;
  status: number;
  ms: number;
  at: string;
  requestBody?: string;
  responseBody?: string;
};

type Report = {
  id: number;
  title: string;
  steps: string;
  expected: string;
  actual: string;
  severity: Severity;
};

type Graded = {
  found: string[];
  missed: string[];
  unmatched: Report[];
  severityRight: number;
  severityTotal: number;
};

export function Workbench({ lab }: { lab: Lab }) {
  const [stageNumber, setStageNumber] = useState(1);
  const stage = lab.stages.find((item) => item.n === stageNumber) ?? lab.stages[0];

  const frameRef = useRef<HTMLIFrameElement>(null);
  // useId, not Math.random: a value randomised during render differs between
  // the server and the client and produces a hydration mismatch. useId is
  // generated identically on both sides and is still unique per mount.
  const sessionId = "lab_" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const [consoleLog, setConsoleLog] = useState<ConsoleEntry[]>([]);
  const [network, setNetwork] = useState<NetEntry[]>([]);
  const [tab, setTab] = useState<"brief" | "console" | "network" | "report">("brief");
  const [reloadKey, setReloadKey] = useState(0);
  // A phone cannot show the app and the tools at once and have either be
  // usable, so on small screens they take turns at full width.
  const [mobileView, setMobileView] = useState<"app" | "tools">("app");

  const [reports, setReports] = useState<Report[]>([]);
  const [draft, setDraft] = useState<Omit<Report, "id">>({
    title: "",
    steps: "",
    expected: "",
    actual: "",
    severity: "medium",
  });
  const [graded, setGraded] = useState<Graded | null>(null);
  const [overrides, setOverrides] = useState<string[]>([]);

  const src = `/meridian?defects=${encodeURIComponent(
    stage.defects.join(","),
  )}&session=${sessionId}&v=${reloadKey}`;

  /** Patch the iframe's console, fetch and error handler. */
  const instrument = useCallback(() => {
    const frame = frameRef.current;
    const win = frame?.contentWindow as (Window & typeof globalThis) | null;
    if (!win) return;

    const stamp = () => new Date().toLocaleTimeString();

    for (const level of ["log", "warn", "error", "info"] as const) {
      const original = win.console[level].bind(win.console);
      win.console[level] = (...args: unknown[]) => {
        setConsoleLog((previous) =>
          [
            ...previous,
            {
              level,
              text: args
                .map((arg) =>
                  typeof arg === "string" ? arg : JSON.stringify(arg),
                )
                .join(" "),
              at: stamp(),
            },
          ].slice(-200),
        );
        original(...args);
      };
    }

    win.addEventListener("error", (event: ErrorEvent) => {
      setConsoleLog((previous) =>
        [
          ...previous,
          {
            // Chrome already prefixes ErrorEvent.message with "Uncaught".
            level: "error",
            text: event.message,
            at: stamp(),
          },
        ].slice(-200),
      );
    });

    const originalFetch = win.fetch.bind(win);
    win.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const started = performance.now();
      const method = (init?.method ?? "GET").toUpperCase();
      const url = typeof input === "string" ? input : String(input);
      const response = await originalFetch(input, init);
      const clone = response.clone();
      let responseBody = "";
      try {
        responseBody = (await clone.text()).slice(0, 4000);
      } catch {
        responseBody = "(unreadable)";
      }
      setNetwork((previous) =>
        [
          ...previous,
          {
            method,
            url,
            status: response.status,
            ms: Math.round(performance.now() - started),
            at: stamp(),
            requestBody:
              typeof init?.body === "string" ? init.body.slice(0, 2000) : undefined,
            responseBody,
          },
        ].slice(-200),
      );
      return response;
    };
  }, []);

  function reset() {
    setConsoleLog([]);
    setNetwork([]);
    void fetch("/api/meridian/session/reset", {
      method: "POST",
      headers: { "x-meridian-session": sessionId },
    }).finally(() => setReloadKey((key) => key + 1));
  }

  // Changing stage changes which defects are live, so start clean.
  useEffect(() => {
    setConsoleLog([]);
    setNetwork([]);
    setGraded(null);
    setReports([]);
    setOverrides([]);
  }, [stageNumber]);

  function addReport() {
    if (!draft.title.trim()) return;
    setReports((previous) => [...previous, { ...draft, id: Date.now() }]);
    setDraft({ title: "", steps: "", expected: "", actual: "", severity: "medium" });
  }

  function grade() {
    const planted = stage.defects;
    const found = new Set<string>();
    const unmatched: Report[] = [];
    let severityRight = 0;
    let severityTotal = 0;

    for (const report of reports) {
      const text = `${report.title} ${report.steps} ${report.expected} ${report.actual}`;
      const hits = matchReport(text).filter((id) => planted.includes(id));
      if (hits.length === 0) {
        unmatched.push(report);
        continue;
      }
      for (const id of hits) {
        if (!found.has(id)) {
          found.add(id);
          severityTotal += 1;
          if (DEFECTS[id].severity === report.severity) severityRight += 1;
        }
      }
    }

    for (const id of overrides) found.add(id);

    setGraded({
      found: [...found],
      missed: planted.filter((id) => !found.has(id)),
      unmatched,
      severityRight,
      severityTotal,
    });
  }

  const statusTone = (status: number) =>
    status >= 500
      ? "text-bad"
      : status >= 400
        ? "text-warn"
        : "text-ok";

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      {/* Phone: one at a time, switched here. */}
      <div className="no-touch-target sticky top-14 z-30 -mx-4 flex gap-1 border-b border-border bg-bg/95 px-4 py-2 backdrop-blur lg:hidden">
        {(["app", "tools"] as const).map((view) => (
          <button
            key={view}
            type="button"
            onClick={() => setMobileView(view)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors ${
              mobileView === view
                ? "bg-accent text-white"
                : "bg-surface-2 text-muted"
            }`}
          >
            {view === "app" ? "The shop" : "Tools"}
            {view === "tools" && reports.length > 0 ? ` (${reports.length})` : ""}
          </button>
        ))}
      </div>

      {/* The product under test */}
      <section
        className={`space-y-2 ${mobileView === "app" ? "" : "hidden lg:block"}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Meridian
          </span>
          <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.625rem] text-muted">
            stage {stage.n}
          </span>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={reset}
              className="rounded-md border border-border px-2 py-1 text-xs"
            >
              Reset shop
            </button>
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-border px-2 py-1 text-xs"
            >
              Open in a tab
            </a>
          </div>
        </div>
        <iframe
          key={reloadKey}
          ref={frameRef}
          src={src}
          onLoad={instrument}
          title="Meridian, the product under test"
          className="h-[30rem] w-full rounded-xl border border-border bg-white sm:h-[36rem]"
        />
        <p className="text-xs text-muted">
          This is a real page. Press <kbd>F12</kbd> and the browser&apos;s own
          DevTools work on it exactly as they would on any site — the panels
          beside it are a convenience, not a substitute.
        </p>
      </section>

      {/* The tools */}
      <section
        className={`rounded-xl border border-border bg-surface ${
          mobileView === "tools" ? "" : "hidden lg:block"
        }`}
      >
        <div className="flex gap-1 border-b border-border bg-surface-2 px-2 py-1.5">
          {(["brief", "console", "network", "report"] as const).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setTab(name)}
              className={`rounded px-2.5 py-1 text-xs capitalize ${
                tab === name ? "bg-bg font-medium" : "text-muted hover:text-text"
              }`}
            >
              {name}
              {name === "console" && consoleLog.length ? ` (${consoleLog.length})` : ""}
              {name === "network" && network.length ? ` (${network.length})` : ""}
              {name === "report" && reports.length ? ` (${reports.length})` : ""}
            </button>
          ))}
        </div>

        <div className="max-h-[36rem] overflow-y-auto p-4 text-sm">
          {tab === "brief" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {lab.stages.map((item) => (
                  <button
                    key={item.n}
                    type="button"
                    onClick={() => setStageNumber(item.n)}
                    className={`rounded-lg border px-2.5 py-1 text-xs ${
                      item.n === stageNumber
                        ? "border-accent bg-accent-soft font-medium"
                        : "border-border"
                    }`}
                  >
                    {item.n}. {item.title}
                  </button>
                ))}
              </div>
              <h3 className="font-semibold">{stage.title}</h3>
              <p className="text-muted">{stage.brief}</p>
              <ol className="list-decimal space-y-1.5 pl-5 text-[0.9375rem]">
                {stage.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              {stage.defects.length > 0 ? (
                <p className="rounded-lg border border-border bg-surface-2 p-3 text-xs text-muted">
                  There are <strong>{stage.defects.length}</strong> defects
                  planted in this stage. You are not told what they are. File
                  each one in the Report tab, in your own words.
                </p>
              ) : (
                <p className="rounded-lg border border-ok/40 bg-ok-soft p-3 text-xs">
                  Nothing is broken in this stage. Learn the product.
                </p>
              )}
            </div>
          ) : null}

          {tab === "console" ? (
            consoleLog.length === 0 ? (
              <p className="text-muted">
                Nothing logged yet. The console is captured from the moment the
                shop loads, so errors on page load are caught too.
              </p>
            ) : (
              <ul className="space-y-1 font-mono text-xs">
                {consoleLog.map((entry, index) => (
                  <li
                    key={index}
                    className={entry.level === "error" ? "text-bad" : "text-muted"}
                  >
                    <span className="opacity-60">{entry.at} </span>
                    {entry.text}
                  </li>
                ))}
              </ul>
            )
          ) : null}

          {tab === "network" ? (
            network.length === 0 ? (
              <p className="text-muted">
                No requests captured yet. Interact with the shop.
              </p>
            ) : (
              <ul className="space-y-2">
                {network.map((entry, index) => (
                  <li key={index} className="rounded-lg border border-border p-2">
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="font-semibold">{entry.method}</span>
                      <span className="truncate">{entry.url}</span>
                      <span className={`ml-auto font-semibold ${statusTone(entry.status)}`}>
                        {entry.status}
                      </span>
                      <span className="text-muted">{entry.ms}ms</span>
                    </div>
                    {entry.requestBody ? (
                      <pre className="mt-1.5 overflow-x-auto rounded bg-surface-2 p-1.5 font-mono text-[0.6875rem]">
                        → {entry.requestBody}
                      </pre>
                    ) : null}
                    {entry.responseBody ? (
                      <pre className="mt-1 overflow-x-auto rounded bg-surface-2 p-1.5 font-mono text-[0.6875rem]">
                        ← {entry.responseBody}
                      </pre>
                    ) : null}
                  </li>
                ))}
              </ul>
            )
          ) : null}

          {tab === "report" ? (
            <div className="space-y-4">
              {!graded ? (
                <>
                  <div className="space-y-2">
                    <input
                      value={draft.title}
                      onChange={(event) =>
                        setDraft({ ...draft, title: event.target.value })
                      }
                      placeholder="Title: what, and where"
                      className="w-full rounded-lg border border-border bg-bg px-2.5 py-2 text-sm"
                    />
                    <textarea
                      value={draft.steps}
                      onChange={(event) =>
                        setDraft({ ...draft, steps: event.target.value })
                      }
                      rows={3}
                      placeholder="Steps to reproduce, numbered"
                      className="w-full rounded-lg border border-border bg-bg px-2.5 py-2 text-sm"
                    />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <textarea
                        value={draft.expected}
                        onChange={(event) =>
                          setDraft({ ...draft, expected: event.target.value })
                        }
                        rows={2}
                        placeholder="Expected"
                        className="rounded-lg border border-border bg-bg px-2.5 py-2 text-sm"
                      />
                      <textarea
                        value={draft.actual}
                        onChange={(event) =>
                          setDraft({ ...draft, actual: event.target.value })
                        }
                        rows={2}
                        placeholder="Actual"
                        className="rounded-lg border border-border bg-bg px-2.5 py-2 text-sm"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="text-xs text-muted">Severity</label>
                      <select
                        value={draft.severity}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            severity: event.target.value as Severity,
                          })
                        }
                        className="rounded-lg border border-border bg-bg px-2 py-1.5 text-sm capitalize"
                      >
                        {SEVERITY_ORDER.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={addReport}
                        className="ml-auto rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white"
                      >
                        File it
                      </button>
                    </div>
                  </div>

                  {reports.length > 0 ? (
                    <>
                      <ul className="space-y-1.5">
                        {reports.map((report) => (
                          <li
                            key={report.id}
                            className="flex items-start gap-2 rounded-lg border border-border p-2 text-sm"
                          >
                            <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[0.625rem] uppercase">
                              {report.severity}
                            </span>
                            <span className="flex-1">{report.title}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setReports((previous) =>
                                  previous.filter((item) => item.id !== report.id),
                                )
                              }
                              className="text-xs text-muted"
                            >
                              remove
                            </button>
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={grade}
                        className="w-full rounded-lg border border-accent bg-accent-soft px-3 py-2 text-sm font-medium"
                      >
                        Submit {reports.length}{" "}
                        {reports.length === 1 ? "report" : "reports"} for marking
                      </button>
                    </>
                  ) : (
                    <p className="text-xs text-muted">
                      No reports filed yet. Write them as you find them.
                    </p>
                  )}
                </>
              ) : (
                <Results
                  graded={graded}
                  stageDefects={stage.defects}
                  onRetry={() => {
                    setGraded(null);
                  }}
                  onOverride={(id) => {
                    setOverrides((previous) => [...previous, id]);
                    setGraded(null);
                  }}
                />
              )}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function Results({
  graded,
  stageDefects,
  onRetry,
  onOverride,
}: {
  graded: Graded;
  stageDefects: string[];
  onRetry: () => void;
  onOverride: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-surface-2 p-3">
        <div className="font-mono text-sm">
          Found{" "}
          <strong>
            {graded.found.length} / {stageDefects.length}
          </strong>
          {graded.severityTotal > 0 ? (
            <>
              {" · "}severity {graded.severityRight} / {graded.severityTotal} correct
            </>
          ) : null}
        </div>
      </div>

      {graded.unmatched.length > 0 ? (
        <div className="rounded-lg border border-warn/40 bg-warn-soft p-3">
          <p className="text-xs font-semibold uppercase tracking-wider">
            Could not match
          </p>
          <p className="mt-1 text-xs text-muted">
            Keyword matching is imperfect. If one of these really does describe
            a planted defect, say so and it will count.
          </p>
          <ul className="mt-2 space-y-1.5">
            {graded.unmatched.map((report) => (
              <li key={report.id} className="text-sm">
                &ldquo;{report.title}&rdquo;
              </li>
            ))}
          </ul>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {graded.missed.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => onOverride(id)}
                className="rounded border border-border bg-bg px-2 py-1 text-xs"
              >
                I found: {DEFECTS[id].title.slice(0, 38)}…
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          The answer key
        </p>
        <ul className="mt-2 space-y-2.5">
          {stageDefects.map((id) => {
            const defect = DEFECTS[id];
            const got = graded.found.includes(id);
            return (
              <li
                key={id}
                className={`rounded-lg border p-3 ${
                  got ? "border-ok/40 bg-ok-soft" : "border-bad/40 bg-bad-soft"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xs font-semibold uppercase">
                    {got ? "found" : "missed"}
                  </span>
                  <span className="ml-auto rounded bg-bg/60 px-1.5 py-0.5 text-[0.625rem] uppercase">
                    {defect.severity}
                  </span>
                </div>
                <p className="mt-1 font-medium">{defect.title}</p>
                <p className="mt-1 text-xs text-muted">{defect.where}</p>
                <p className="mt-1.5 text-xs">
                  <strong>Why that severity. </strong>
                  {defect.reasoning}
                </p>
                {!got ? (
                  <p className="mt-1 text-xs">
                    <strong>How to find it. </strong>
                    {defect.howToFind}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="w-full rounded-lg border border-border px-3 py-2 text-sm"
      >
        Back to my reports
      </button>
    </div>
  );
}
