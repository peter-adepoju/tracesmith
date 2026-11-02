"use client";

import { useState } from "react";

/**
 * A status code reference you poke rather than read.
 *
 * Every code answers the one question that matters in a ticket: whose problem
 * is this? Filtering by family makes the 4xx/5xx boundary visible rather than
 * stated.
 */

type Code = {
  code: number;
  name: string;
  means: string;
  owner: "you" | "them" | "neither";
  fix: string;
};

const CODES: Code[] = [
  { code: 200, name: "OK", means: "It worked.", owner: "neither", fix: "Nothing to do. Check the body is actually what you expected." },
  { code: 201, name: "Created", means: "It worked and something new exists.", owner: "neither", fix: "Usually the answer to a POST. Note the id it returns." },
  { code: 204, name: "No Content", means: "It worked and there is deliberately nothing to send back.", owner: "neither", fix: "Common after a DELETE. An empty body is correct here." },
  { code: 301, name: "Moved Permanently", means: "The thing lives somewhere else now.", owner: "neither", fix: "Follow it. Hard-coded old URLs are worth reporting." },
  { code: 400, name: "Bad Request", means: "The request itself was malformed.", owner: "you", fix: "Usually invalid JSON. Check for a trailing comma or an unclosed quote before you check your fields." },
  { code: 401, name: "Unauthorized", means: "We do not know who you are.", owner: "you", fix: "Missing or unrecognised credential. Send a valid one, or refresh an expired token." },
  { code: 403, name: "Forbidden", means: "We know who you are, and you may not do this.", owner: "you", fix: "A permissions problem, not an identity one. Different key, different role, or stop." },
  { code: 404, name: "Not Found", means: "There is nothing at that address.", owner: "you", fix: "Check the path, including the version prefix. A typo in /v1/ is the classic." },
  { code: 405, name: "Method Not Allowed", means: "Right address, wrong verb.", owner: "you", fix: "Mildly good news: the endpoint exists. Check the allowed methods in the response." },
  { code: 409, name: "Conflict", means: "This clashes with the current state.", owner: "you", fix: "Often a duplicate, or an edit against stale data. Re-read, then retry." },
  { code: 422, name: "Unprocessable Content", means: "It parsed, then broke a rule.", owner: "you", fix: "A missing field or an out-of-range value. The response usually names the field." },
  { code: 429, name: "Too Many Requests", means: "You are going too fast.", owner: "you", fix: "Back off and retry later. Check for a Retry-After header." },
  { code: 500, name: "Internal Server Error", means: "Something broke on their side.", owner: "them", fix: "Stop changing your request. Collect the time, path and request id, and escalate." },
  { code: 502, name: "Bad Gateway", means: "A server behind the server failed.", owner: "them", fix: "Theirs. Escalate with timing; often transient." },
  { code: 503, name: "Service Unavailable", means: "Overloaded or down for maintenance.", owner: "them", fix: "Theirs. Check whether it is every request or only some." },
  { code: 504, name: "Gateway Timeout", means: "Something upstream took too long.", owner: "them", fix: "Theirs. Note how long it waited; that figure is useful to them." },
];

const OWNER = {
  you: { label: "Your request was wrong", tone: "border-warn/50 bg-warn-soft" },
  them: { label: "Their server failed", tone: "border-bad/50 bg-bad-soft" },
  neither: { label: "Success", tone: "border-ok/50 bg-ok-soft" },
};

const FAMILIES = ["all", "2xx", "3xx", "4xx", "5xx"] as const;

export function StatusExplorer() {
  const [family, setFamily] = useState<(typeof FAMILIES)[number]>("all");
  const [picked, setPicked] = useState<Code>(CODES[5]);

  const shown =
    family === "all"
      ? CODES
      : CODES.filter((c) => String(c.code)[0] === family[0]);

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          Status codes
        </span>
        <div className="ml-auto flex gap-1">
          {FAMILIES.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFamily(f)}
              className={`rounded px-2 py-0.5 font-mono text-xs ${
                family === f ? "bg-accent text-white" : "text-muted hover:text-text"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 p-3">
        {shown.map((code) => (
          <button
            key={code.code}
            type="button"
            onClick={() => setPicked(code)}
            className={`rounded-lg border px-2.5 py-1 font-mono text-sm transition-colors ${
              picked.code === code.code
                ? "border-accent bg-accent-soft font-semibold"
                : "border-border hover:bg-surface-2"
            }`}
          >
            {code.code}
          </button>
        ))}
      </div>

      <figcaption className={`border-t border-border p-4`}>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-mono text-2xl font-semibold">{picked.code}</span>
          <span className="text-lg">{picked.name}</span>
          <span
            className={`ml-auto rounded-full border px-2.5 py-0.5 text-xs font-medium ${OWNER[picked.owner].tone}`}
          >
            {OWNER[picked.owner].label}
          </span>
        </div>
        <p className="mt-2 text-sm">{picked.means}</p>
        <p className="mt-2 text-sm text-muted">
          <strong className="text-text">What to do. </strong>
          {picked.fix}
        </p>
      </figcaption>
    </figure>
  );
}
