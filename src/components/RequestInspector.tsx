"use client";

import { useState } from "react";
import {
  PRESETS,
  PUBLIC_KEY,
  SECRET_KEY,
  send,
  type MockRequest,
  type MockResponse,
} from "@/lib/mockApi";

type LogEntry = {
  id: number;
  name: string;
  method: string;
  request: MockRequest;
  response: MockResponse;
  at: string;
};

function statusTone(status: number): string {
  if (status >= 500) return "text-bad";
  if (status >= 400) return "text-warn";
  if (status >= 300) return "text-muted";
  return "text-ok";
}

function pretty(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

function headerLines(headers: Record<string, string>): string {
  const names = Object.keys(headers);
  if (!names.length) return "(none)";
  return names.map((name) => `${name}: ${headers[name]}`).join("\n");
}

/**
 * A practice Network tab.
 *
 * Send requests to the in-browser fake API and read the result the way you
 * would read a real request in DevTools: status first, then headers, payload,
 * response and timing. Nothing leaves your machine.
 */
export function RequestInspector({
  preset,
  compact = false,
}: {
  /** Label of a preset to load on mount. */
  preset?: string;
  compact?: boolean;
}) {
  const initial =
    PRESETS.find((item) => item.label === preset)?.request ?? PRESETS[0].request;

  const [method, setMethod] = useState(initial.method);
  const [path, setPath] = useState(initial.path);
  const [auth, setAuth] = useState(initial.headers.Authorization ?? "");
  const [body, setBody] = useState(initial.body);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [tab, setTab] = useState<"headers" | "payload" | "response" | "timing">(
    "headers",
  );

  const current = log.find((entry) => entry.id === selected) ?? null;

  function run() {
    const headers: Record<string, string> = {};
    if (auth.trim()) headers.Authorization = auth.trim();
    if (method !== "GET" && body.trim()) {
      headers["Content-Type"] = "application/json";
    }

    const request: MockRequest = { method, path, headers, body };
    const response = send(request);
    const id = Date.now() + Math.floor(Math.random() * 1000);

    setLog((previous) =>
      [
        {
          id,
          name: path.split("?")[0].split("/").filter(Boolean).slice(-1)[0] || "/",
          method,
          request,
          response,
          at: new Date().toLocaleTimeString(),
        },
        ...previous,
      ].slice(0, 25),
    );
    setSelected(id);
    setTab("headers");
  }

  function load(label: string) {
    const found = PRESETS.find((item) => item.label === label);
    if (!found) return;
    setMethod(found.request.method);
    setPath(found.request.path);
    setAuth(found.request.headers.Authorization ?? "");
    setBody(found.request.body);
  }

  const total = current
    ? current.response.timing.queued +
      current.response.timing.connect +
      current.response.timing.waiting +
      current.response.timing.download
    : 0;

  return (
    <div className="my-7 overflow-hidden rounded-xl border border-border bg-surface text-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          Request inspector
        </span>
        <select
          onChange={(event) => load(event.target.value)}
          defaultValue=""
          className="ml-auto max-w-[14rem] rounded-md border border-border bg-bg px-2 py-1 text-xs"
          aria-label="Load a preset request"
        >
          <option value="" disabled>
            Load a scenario…
          </option>
          {PRESETS.map((item) => (
            <option key={item.label} value={item.label}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {/* Builder */}
      <div className="space-y-2 border-b border-border p-3">
        <div className="flex flex-wrap gap-2">
          <select
            value={method}
            onChange={(event) => setMethod(event.target.value)}
            className="rounded-md border border-border bg-bg px-2 py-1.5 font-mono text-xs"
            aria-label="HTTP method"
          >
            {["GET", "POST", "PUT", "PATCH", "DELETE"].map((verb) => (
              <option key={verb}>{verb}</option>
            ))}
          </select>
          <input
            value={path}
            onChange={(event) => setPath(event.target.value)}
            spellCheck={false}
            className="min-w-[12rem] flex-1 rounded-md border border-border bg-bg px-2 py-1.5 font-mono text-xs"
            aria-label="Path"
          />
          <button
            type="button"
            onClick={run}
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white"
          >
            Send
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="font-mono text-xs text-muted">Authorization</label>
          <input
            value={auth}
            onChange={(event) => setAuth(event.target.value)}
            placeholder="(no key)"
            spellCheck={false}
            className="min-w-[12rem] flex-1 rounded-md border border-border bg-bg px-2 py-1.5 font-mono text-xs"
          />
          <button
            type="button"
            onClick={() => setAuth(PUBLIC_KEY)}
            className="rounded-md border border-border px-2 py-1 text-xs"
          >
            public
          </button>
          <button
            type="button"
            onClick={() => setAuth(SECRET_KEY)}
            className="rounded-md border border-border px-2 py-1 text-xs"
          >
            secret
          </button>
          <button
            type="button"
            onClick={() => setAuth("")}
            className="rounded-md border border-border px-2 py-1 text-xs"
          >
            none
          </button>
        </div>

        {method !== "GET" ? (
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={compact ? 3 : 5}
            spellCheck={false}
            className="w-full rounded-md border border-border bg-bg p-2 font-mono text-xs"
            aria-label="Request body"
          />
        ) : null}
      </div>

      {/* Log */}
      <div className="max-h-44 overflow-y-auto border-b border-border">
        <table className="w-full">
          <thead className="sticky top-0 bg-surface-2 text-[0.6875rem] uppercase tracking-wider text-muted">
            <tr>
              <th className="px-3 py-1.5 text-left font-medium">Name</th>
              <th className="px-3 py-1.5 text-left font-medium">Status</th>
              <th className="hidden px-3 py-1.5 text-left font-medium sm:table-cell">
                Method
              </th>
              <th className="px-3 py-1.5 text-right font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {log.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-xs text-muted">
                  No requests yet. Press Send.
                </td>
              </tr>
            ) : (
              log.map((entry) => {
                const ms =
                  entry.response.timing.queued +
                  entry.response.timing.connect +
                  entry.response.timing.waiting +
                  entry.response.timing.download;
                return (
                  <tr
                    key={entry.id}
                    onClick={() => setSelected(entry.id)}
                    className={`cursor-pointer border-t border-border text-xs hover:bg-surface-2 ${
                      selected === entry.id ? "bg-surface-2" : ""
                    }`}
                  >
                    <td className="px-3 py-1.5 font-mono">{entry.name}</td>
                    <td
                      className={`px-3 py-1.5 font-mono font-semibold ${statusTone(
                        entry.response.status,
                      )}`}
                    >
                      {entry.response.status}
                    </td>
                    <td className="hidden px-3 py-1.5 font-mono text-muted sm:table-cell">
                      {entry.method}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-muted">
                      {ms} ms
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Detail */}
      {current ? (
        <div>
          <div className="flex gap-1 border-b border-border bg-surface-2 px-2 py-1.5">
            {(["headers", "payload", "response", "timing"] as const).map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setTab(name)}
                className={`rounded px-2.5 py-1 text-xs capitalize ${
                  tab === name
                    ? "bg-bg font-medium"
                    : "text-muted hover:text-text"
                }`}
              >
                {name}
              </button>
            ))}
            <span
              className={`ml-auto self-center px-2 font-mono text-xs font-semibold ${statusTone(
                current.response.status,
              )}`}
            >
              {current.response.status} {current.response.statusText}
            </span>
          </div>

          <div className="max-h-80 overflow-auto p-3">
            {tab === "headers" ? (
              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
{`General
  Request URL:    https://api.example.test${current.request.path}
  Request Method: ${current.request.method}
  Status Code:    ${current.response.status} ${current.response.statusText}

Request headers
${headerLines(current.request.headers)
  .split("\n")
  .map((line) => "  " + line)
  .join("\n")}

Response headers
${headerLines(current.response.headers)
  .split("\n")
  .map((line) => "  " + line)
  .join("\n")}`}
              </pre>
            ) : null}

            {tab === "payload" ? (
              current.request.body ? (
                <pre className="whitespace-pre-wrap font-mono text-xs">
                  {current.request.body}
                </pre>
              ) : (
                <p className="text-xs text-muted">
                  This request sent no payload. A GET usually has none, which is
                  why real DevTools hides the Payload tab for it.
                </p>
              )
            ) : null}

            {tab === "response" ? (
              <pre className="whitespace-pre-wrap font-mono text-xs">
                {pretty(current.response.body)}
              </pre>
            ) : null}

            {tab === "timing" ? (
              <div className="space-y-2">
                {(
                  [
                    ["Queued", current.response.timing.queued],
                    ["Connecting", current.response.timing.connect],
                    ["Waiting for server response", current.response.timing.waiting],
                    ["Content download", current.response.timing.download],
                  ] as const
                ).map(([label, ms]) => (
                  <div key={label}>
                    <div className="flex justify-between font-mono text-xs">
                      <span>{label}</span>
                      <span className="text-muted">{ms} ms</span>
                    </div>
                    <div className="mt-1 h-2 rounded bg-surface-2">
                      <div
                        className="h-2 rounded bg-accent"
                        style={{ width: `${Math.max(2, (ms / total) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
                <p className="pt-2 text-xs text-muted">
                  Total {total} ms. When someone says a page is slow, this is the
                  tab that tells you whether to blame the network or the server.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
