"use client";

import { useState } from "react";

/**
 * Assemble a URL and watch where each value lands.
 *
 * Path parameter, query string or body is the distinction people get wrong
 * most often, and it is hard to see from prose. Here you move a value between
 * the three and the request redraws, with a note on why that placement is
 * right or wrong.
 */

type Placement = "path" | "query" | "body";

type Param = {
  key: string;
  value: string;
  placement: Placement;
  /** Where it belongs, and why. */
  belongs: Placement;
  reason: string;
};

const START: Param[] = [
  {
    key: "customerId",
    value: "cus_01",
    placement: "path",
    belongs: "path",
    reason:
      "It identifies which resource you want. A path parameter names a thing, and /v1/customers/cus_01 reads as an address for exactly one customer.",
  },
  {
    key: "status",
    value: "pending",
    placement: "query",
    belongs: "query",
    reason:
      "It filters a collection rather than naming one item. Filtering, sorting and paging all belong in the query string, where they can be combined and left out freely.",
  },
  {
    key: "limit",
    value: "25",
    placement: "query",
    belongs: "query",
    reason:
      "Paging is a query parameter for the same reason: it modifies the request rather than identifying the resource.",
  },
  {
    key: "note",
    value: "Ship before Friday",
    placement: "body",
    belongs: "body",
    reason:
      "Free text that the customer typed. It can be long, it can contain anything, and it is data being sent rather than a selector — so it goes in the body.",
  },
];

const METHODS = ["GET", "POST", "PATCH", "DELETE"] as const;

export function EndpointBuilder() {
  const [method, setMethod] = useState<(typeof METHODS)[number]>("GET");
  const [params, setParams] = useState<Param[]>(START);
  const [picked, setPicked] = useState<Param | null>(null);

  const move = (key: string, placement: Placement) =>
    setParams((previous) =>
      previous.map((p) => (p.key === key ? { ...p, placement } : p)),
    );

  const base = "https://api.example.test/v1/customers";
  const pathParams = params.filter((p) => p.placement === "path");
  const queryParams = params.filter((p) => p.placement === "query");
  const bodyParams = params.filter((p) => p.placement === "body");

  const url =
    base +
    pathParams.map((p) => "/" + encodeURIComponent(p.value)).join("") +
    (queryParams.length
      ? "?" +
        queryParams
          .map((p) => `${p.key}=${encodeURIComponent(p.value)}`)
          .join("&")
      : "");

  const body = bodyParams.length
    ? JSON.stringify(
        Object.fromEntries(bodyParams.map((p) => [p.key, p.value])),
        null,
        2,
      )
    : null;

  const misplaced = params.filter((p) => p.placement !== p.belongs);
  const bodyOnGet = method === "GET" && bodyParams.length > 0;

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          Where does each value go?
        </span>
        <div className="no-touch-target ml-auto flex gap-1">
          {METHODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={`rounded px-2 py-0.5 font-mono text-xs ${
                method === m ? "bg-accent text-white" : "text-muted"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 p-3">
        {params.map((param) => (
          <div
            key={param.key}
            className={`rounded-lg border p-2.5 ${
              param.placement === param.belongs
                ? "border-border"
                : "border-warn/50 bg-warn-soft"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <code className="text-sm font-semibold">{param.key}</code>
              <code className="text-xs text-muted">{param.value}</code>
              <div className="no-touch-target ml-auto flex gap-1">
                {(["path", "query", "body"] as const).map((place) => (
                  <button
                    key={place}
                    type="button"
                    onClick={() => {
                      move(param.key, place);
                      setPicked({ ...param, placement: place });
                    }}
                    className={`rounded px-2 py-1 text-xs ${
                      param.placement === place
                        ? "bg-accent text-white"
                        : "bg-surface-2 text-muted"
                    }`}
                  >
                    {place}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border bg-[var(--code-bg)] p-3">
        <pre className="overflow-x-auto font-mono text-xs text-[var(--code-text)]">
{`${method} ${url}${body ? `\n\n${body}` : ""}`}
        </pre>
      </div>

      <figcaption className="border-t border-border p-3 text-sm">
        {bodyOnGet ? (
          <p className="mb-2 rounded-lg border border-bad/40 bg-bad-soft p-2.5 text-xs">
            <strong>A GET with a body.</strong> Technically possible and almost
            always wrong: caches, proxies and many servers quietly discard it,
            so the value simply never arrives. If you need to send data, use
            POST.
          </p>
        ) : null}

        {picked ? (
          <p>
            <strong className="capitalize">{picked.placement}. </strong>
            {picked.placement === picked.belongs
              ? picked.reason
              : `Not where this belongs. ${picked.reason}`}
          </p>
        ) : (
          <p className="text-muted">
            Move a value between path, query and body and watch the request
            redraw. {misplaced.length === 0
              ? "All four are where they belong right now."
              : `${misplaced.length} ${misplaced.length === 1 ? "is" : "are"} currently misplaced.`}
          </p>
        )}
      </figcaption>
    </figure>
  );
}
