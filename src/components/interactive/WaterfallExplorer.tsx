"use client";

import { useState } from "react";

/**
 * A page load as a waterfall, with something wrong in it.
 *
 * Reading a waterfall is a skill that only comes from looking at them. This
 * one is a realistic load with three genuine problems buried in twelve
 * requests: a 500, a request that waits three seconds on the server, and a
 * 2 MB image. The filter box takes the same syntax as DevTools, so learning
 * `status-code:500` here is learning it for real.
 */

type Req = {
  name: string;
  path: string;
  method: string;
  status: number;
  type: "doc" | "css" | "js" | "img" | "xhr" | "font";
  /** Milliseconds from the start of the load. */
  start: number;
  queued: number;
  connect: number;
  waiting: number;
  download: number;
  sizeKb: number;
};

const REQUESTS: Req[] = [
  { name: "orders", path: "/orders", method: "GET", status: 200, type: "doc", start: 0, queued: 2, connect: 38, waiting: 120, download: 18, sizeKb: 14 },
  { name: "app.css", path: "/_next/static/app.css", method: "GET", status: 200, type: "css", start: 182, queued: 1, connect: 2, waiting: 24, download: 12, sizeKb: 48 },
  { name: "app.js", path: "/_next/static/app.js", method: "GET", status: 200, type: "js", start: 184, queued: 1, connect: 2, waiting: 30, download: 96, sizeKb: 310 },
  { name: "inter.woff2", path: "/fonts/inter.woff2", method: "GET", status: 200, type: "font", start: 220, queued: 1, connect: 4, waiting: 18, download: 22, sizeKb: 38 },
  { name: "session", path: "/api/session", method: "GET", status: 200, type: "xhr", start: 320, queued: 1, connect: 2, waiting: 64, download: 3, sizeKb: 1 },
  { name: "orders", path: "/api/orders?page=1", method: "GET", status: 200, type: "xhr", start: 392, queued: 1, connect: 2, waiting: 210, download: 14, sizeKb: 22 },
  { name: "summary", path: "/api/summary", method: "GET", status: 200, type: "xhr", start: 394, queued: 1, connect: 2, waiting: 3020, download: 9, sizeKb: 4 },
  { name: "hero.png", path: "/img/hero.png", method: "GET", status: 200, type: "img", start: 400, queued: 2, connect: 3, waiting: 40, download: 1180, sizeKb: 2048 },
  { name: "avatar.png", path: "/img/avatar.png", method: "GET", status: 200, type: "img", start: 404, queued: 2, connect: 3, waiting: 28, download: 36, sizeKb: 18 },
  { name: "logo.svg", path: "/img/logo.svg", method: "GET", status: 200, type: "img", start: 406, queued: 1, connect: 2, waiting: 16, download: 6, sizeKb: 3 },
  { name: "recommendations", path: "/api/recommendations", method: "GET", status: 500, type: "xhr", start: 620, queued: 1, connect: 2, waiting: 240, download: 2, sizeKb: 1 },
  { name: "track", path: "/api/track", method: "POST", status: 204, type: "xhr", start: 980, queued: 1, connect: 2, waiting: 54, download: 0, sizeKb: 0 },
];

const total = (r: Req) => r.queued + r.connect + r.waiting + r.download;
const END = Math.max(...REQUESTS.map((r) => r.start + total(r)));

function tone(status: number) {
  if (status >= 500) return "text-bad";
  if (status >= 400) return "text-warn";
  return "text-ok";
}

/** Supports the DevTools filter syntax the lesson teaches. */
function matches(req: Req, filter: string): boolean {
  const f = filter.trim().toLowerCase();
  if (!f) return true;
  if (f.startsWith("status-code:")) {
    return String(req.status) === f.slice(12).trim();
  }
  if (f.startsWith("method:")) {
    return req.method.toLowerCase() === f.slice(7).trim();
  }
  if (f.startsWith("larger-than:")) {
    const raw = f.slice(12).trim();
    const kb = raw.endsWith("m")
      ? parseFloat(raw) * 1024
      : parseFloat(raw);
    return req.sizeKb > (Number.isFinite(kb) ? kb : Infinity);
  }
  if (f.startsWith("-")) return !req.path.toLowerCase().includes(f.slice(1));
  return req.path.toLowerCase().includes(f);
}

export function WaterfallExplorer() {
  const [filter, setFilter] = useState("");
  const [picked, setPicked] = useState<Req | null>(null);

  const shown = REQUESTS.filter((r) => matches(r, filter));

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          A page load, as a waterfall
        </span>
        <span className="ml-auto font-mono text-xs text-muted">
          {shown.length}/{REQUESTS.length} · {END} ms
        </span>
      </div>

      <div className="no-touch-target border-b border-border p-2">
        <input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter: status-code:500, method:POST, larger-than:1M, -.png"
          spellCheck={false}
          className="w-full rounded-md border border-border bg-bg px-2 py-2 font-mono text-xs"
          aria-label="Filter requests"
        />
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {["status-code:500", "larger-than:1M", "method:POST", ""].map((f) => (
            <button
              key={f || "clear"}
              type="button"
              onClick={() => setFilter(f)}
              className="rounded border border-border px-1.5 py-0.5 font-mono text-[0.625rem] text-muted"
            >
              {f || "clear"}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] text-xs">
          <thead className="bg-surface-2 text-[0.625rem] uppercase tracking-wider text-muted">
            <tr>
              <th className="px-2 py-1.5 text-left font-medium">Name</th>
              <th className="px-2 py-1.5 text-left font-medium">Status</th>
              <th className="px-2 py-1.5 text-right font-medium">Size</th>
              <th className="px-2 py-1.5 text-right font-medium">Time</th>
              <th className="w-1/2 px-2 py-1.5 text-left font-medium">Waterfall</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((req) => {
              const ms = total(req);
              return (
                <tr
                  key={req.path}
                  onClick={() => setPicked(req)}
                  className={`cursor-pointer border-t border-border hover:bg-surface-2 ${
                    picked?.path === req.path ? "bg-surface-2" : ""
                  }`}
                >
                  <td className="px-2 py-1.5 font-mono">{req.name}</td>
                  <td className={`px-2 py-1.5 font-mono font-semibold ${tone(req.status)}`}>
                    {req.status}
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono text-muted">
                    {req.sizeKb >= 1024
                      ? `${(req.sizeKb / 1024).toFixed(1)} MB`
                      : `${req.sizeKb} kB`}
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono text-muted">
                    {ms} ms
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="relative h-3 w-full rounded bg-surface-2">
                      <div
                        className={`absolute h-3 rounded ${
                          req.status >= 500 ? "bg-bad" : "bg-accent"
                        }`}
                        style={{
                          left: `${(req.start / END) * 100}%`,
                          width: `${Math.max(0.8, (ms / END) * 100)}%`,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <figcaption className="border-t border-border p-3 text-sm">
        {picked ? (
          <>
            <p className="font-mono text-xs">
              {picked.method} {picked.path} —{" "}
              <span className={tone(picked.status)}>{picked.status}</span>
            </p>
            <div className="mt-2 space-y-1">
              {(
                [
                  ["Queued", picked.queued],
                  ["Connecting", picked.connect],
                  ["Waiting for server response", picked.waiting],
                  ["Content download", picked.download],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <div className="flex justify-between font-mono text-[0.6875rem]">
                    <span>{label}</span>
                    <span className="text-muted">{value} ms</span>
                  </div>
                  <div className="mt-0.5 h-1.5 rounded bg-surface-2">
                    <div
                      className="h-1.5 rounded bg-accent"
                      style={{
                        width: `${Math.max(1, (value / total(picked)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              {picked.status >= 500
                ? "A 5xx. Nothing you send will change this. Collect the path and the time, and escalate."
                : picked.waiting > 1000
                  ? "Almost all of this is waiting on the server, not the network. That points at the back end, and the figure is what makes the report useful."
                  : picked.download > 500
                    ? "The time is in the download, not the wait. The server answered quickly; the response is simply enormous."
                    : "Unremarkable, which is most requests. The skill is finding the few that are not."}
            </p>
          </>
        ) : (
          <p className="text-muted">
            Three things are wrong here: one request fails, one waits a very
            long time on the server, and one is far too large. Find each,
            click it, and say from the Timing breakdown whose problem it is.
            Try <code>status-code:500</code> first.
          </p>
        )}
      </figcaption>
    </figure>
  );
}
