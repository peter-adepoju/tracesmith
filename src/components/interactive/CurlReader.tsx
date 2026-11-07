"use client";

import { useMemo, useState } from "react";

/**
 * Take a cURL command apart.
 *
 * Somebody will paste one of these into a ticket and expect you to know what
 * it says. Reading one is a small, learnable skill, and the component also
 * does the thing you must do before pasting one anywhere: it marks the parts
 * that are live credentials.
 */

type Parsed = {
  method: string;
  url: string;
  headers: { name: string; value: string; secret: boolean }[];
  body: string | null;
  flags: string[];
  warnings: string[];
};

const SAMPLES: { label: string; command: string }[] = [
  {
    label: "A simple GET",
    command: `curl https://api.example.test/v1/ping`,
  },
  {
    label: "With a secret key",
    command: `curl -X GET https://api.example.test/v1/customers \\
  -H "Authorization: sk_live_9f2a8c41bd77e0" \\
  -H "Accept: application/json"`,
  },
  {
    label: "A POST with a body",
    command: `curl -X POST https://api.example.test/v1/payments/initiate \\
  -H "Authorization: pk_test_trace_8f41c2" \\
  -H "Content-Type: application/json" \\
  -d '{"amount":4850000,"currency":"NGN","reference":"ORDER-1001"}'`,
  },
  {
    label: "Copied from DevTools",
    command: `curl 'https://api.example.test/v1/orders?status=paid' \\
  -H 'authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJjdXMifQ.sig' \\
  -H 'cookie: session=s%3Aa7f2e91c' \\
  -H 'user-agent: Mozilla/5.0' \\
  --compressed`,
  },
  {
    label: "Insecure, and why that matters",
    command: `curl -k -X POST https://api.example.test/v1/payments/initiate \\
  -H "Authorization: sk_live_9f2a8c41bd77e0" \\
  -d '{"amount":1}'`,
  },
];

const SECRET_HEADERS = ["authorization", "cookie", "x-api-key", "api-key", "x-auth-token"];

/** Split a command into tokens, respecting quotes and line continuations. */
function tokenise(command: string): string[] {
  const text = command.replace(/\\\r?\n/g, " ");
  const out: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quote) {
      if (char === quote) quote = null;
      else current += char;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (/\s/.test(char)) {
      if (current) out.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  if (current) out.push(current);
  return out;
}

function parse(command: string): Parsed {
  const tokens = tokenise(command.trim());
  const result: Parsed = {
    method: "",
    url: "",
    headers: [],
    body: null,
    flags: [],
    warnings: [],
  };

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token === "curl") continue;

    if (token === "-X" || token === "--request") {
      result.method = (tokens[++i] ?? "").toUpperCase();
    } else if (token === "-H" || token === "--header") {
      const raw = tokens[++i] ?? "";
      const at = raw.indexOf(":");
      const name = at >= 0 ? raw.slice(0, at).trim() : raw;
      const value = at >= 0 ? raw.slice(at + 1).trim() : "";
      result.headers.push({
        name,
        value,
        secret: SECRET_HEADERS.includes(name.toLowerCase()),
      });
    } else if (token === "-d" || token === "--data" || token === "--data-raw") {
      result.body = tokens[++i] ?? "";
    } else if (token === "-k" || token === "--insecure") {
      result.flags.push("-k (insecure)");
      result.warnings.push(
        "-k disables certificate checking. It makes a TLS error go away without fixing it, and a request sent with it could have been intercepted. Never use it against production, and never leave it in a command you share.",
      );
    } else if (token === "-L" || token === "--location") {
      result.flags.push("-L (follow redirects)");
    } else if (token === "--compressed" || token === "-s" || token === "-v" || token === "-i") {
      result.flags.push(token);
    } else if (/^https?:\/\//.test(token)) {
      result.url = token;
    }
  }

  if (!result.method) result.method = result.body ? "POST" : "GET";

  if (result.body && result.method === "GET") {
    result.warnings.push(
      "A body on a GET. cURL will quietly switch to POST when you use -d without -X, so this command may not do what it looks like.",
    );
  }
  if (result.headers.some((h) => h.secret)) {
    result.warnings.push(
      "This command carries a live credential. Anyone who runs it acts as that account. Redact it before pasting this anywhere.",
    );
  }
  if (/sk_live_/.test(command)) {
    result.warnings.push(
      "That is a production secret key. If this command has been shared, the key must be rotated.",
    );
  }

  return result;
}

export function CurlReader() {
  const [command, setCommand] = useState(SAMPLES[2].command);
  const parsed = useMemo(() => parse(command), [command]);

  const redacted = useMemo(() => {
    let out = command;
    for (const header of parsed.headers) {
      if (header.secret && header.value) {
        out = out.split(header.value).join("REDACTED");
      }
    }
    return out;
  }, [command, parsed.headers]);

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          Read a cURL command
        </span>
        <select
          defaultValue="2"
          onChange={(event) => setCommand(SAMPLES[Number(event.target.value)].command)}
          className="ml-auto max-w-[12rem] rounded border border-border bg-bg px-1.5 py-1 text-xs"
          aria-label="Load a sample command"
        >
          {SAMPLES.map((sample, index) => (
            <option key={sample.label} value={index}>
              {sample.label}
            </option>
          ))}
        </select>
      </div>

      <textarea
        value={command}
        onChange={(event) => setCommand(event.target.value)}
        spellCheck={false}
        rows={5}
        className="w-full resize-y border-b border-border bg-[var(--code-bg)] p-3 font-mono text-xs leading-relaxed text-[var(--code-text)] outline-none"
        aria-label="cURL command"
      />

      <div className="space-y-2 p-3 text-sm">
        <div className="flex flex-wrap gap-2">
          <span className="rounded bg-accent px-2 py-0.5 font-mono text-xs text-white">
            {parsed.method}
          </span>
          <code className="min-w-0 flex-1 break-all text-xs">
            {parsed.url || <span className="text-bad">no URL found</span>}
          </code>
        </div>

        {parsed.headers.length > 0 ? (
          <div>
            <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted">
              Headers
            </p>
            <ul className="mt-1 space-y-0.5 font-mono text-xs">
              {parsed.headers.map((header, index) => (
                <li key={index} className="break-all">
                  <span className="text-muted">{header.name}: </span>
                  <span className={header.secret ? "rounded bg-bad-soft px-1 text-bad" : ""}>
                    {header.value}
                  </span>
                  {header.secret ? (
                    <span className="ml-1 text-[0.625rem] uppercase text-bad">
                      credential
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {parsed.body ? (
          <div>
            <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted">
              Body
            </p>
            <pre className="mt-1 overflow-x-auto rounded bg-surface-2 p-2 font-mono text-xs">
              {parsed.body}
            </pre>
          </div>
        ) : null}

        {parsed.flags.length > 0 ? (
          <p className="font-mono text-xs text-muted">
            Flags: {parsed.flags.join(", ")}
          </p>
        ) : null}
      </div>

      {parsed.warnings.length > 0 ? (
        <div className="space-y-1.5 border-t border-border p-3">
          {parsed.warnings.map((warning) => (
            <p
              key={warning}
              className="rounded-lg border border-bad/40 bg-bad-soft p-2.5 text-xs"
            >
              {warning}
            </p>
          ))}
        </div>
      ) : null}

      {parsed.headers.some((h) => h.secret) ? (
        <figcaption className="border-t border-border p-3">
          <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted">
            Safe to paste into a ticket
          </p>
          <pre className="mt-1 overflow-x-auto rounded-lg bg-surface-2 p-2.5 font-mono text-[0.6875rem]">
            {redacted}
          </pre>
        </figcaption>
      ) : null}
    </figure>
  );
}
