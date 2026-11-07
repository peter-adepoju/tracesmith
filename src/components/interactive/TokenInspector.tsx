"use client";

import { useMemo, useState } from "react";

/**
 * Decode a JSON Web Token in the page.
 *
 * The lesson this teaches by doing: a JWT is **encoded, not encrypted**.
 * Anyone holding one can read every claim inside it without a key, which
 * surprises nearly everyone the first time they watch it happen.
 *
 * The samples are invented and signed with nothing. The component warns
 * against pasting a real token, because that warning is itself the lesson.
 */

type Sample = { label: string; token: string; note: string };

/** Build a fake token. Signature is decorative; nothing here verifies it. */
function make(payload: Record<string, unknown>): string {
  const enc = (value: unknown) =>
    btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return [
    enc({ alg: "HS256", typ: "JWT" }),
    enc(payload),
    "c2lnbmF0dXJlLW5vdC12ZXJpZmllZC1oZXJl",
  ].join(".");
}

const now = Math.floor(Date.now() / 1000);

const SAMPLES: Sample[] = [
  {
    label: "A normal token",
    note: "Valid for another hour. Read the claims — none of this is hidden from anyone holding the token.",
    token: make({
      sub: "cus_01",
      email: "ada@example.com",
      role: "customer",
      iat: now - 300,
      exp: now + 3600,
    }),
  },
  {
    label: "Expired an hour ago",
    note: "The commonest cause of a 401 on a request that worked earlier. Nothing changed except the clock.",
    token: make({
      sub: "cus_01",
      email: "ada@example.com",
      role: "customer",
      iat: now - 7200,
      exp: now - 3600,
    }),
  },
  {
    label: "Carries too much",
    note: "A finding. The token has been used as a database row: anyone who obtains it learns the person's phone number, address and internal risk score.",
    token: make({
      sub: "cus_01",
      email: "ada@example.com",
      phone: "+234 801 234 5678",
      address: "14 Awolowo Road, Ikoyi, Lagos",
      internal_risk_score: 0.82,
      role: "customer",
      iat: now - 60,
      exp: now + 3600,
    }),
  },
  {
    label: "Claims to be an admin",
    note: "The role sits in the payload, which anyone can edit before re-encoding. Only the signature stops that — so a server that does not verify the signature is wide open.",
    token: make({
      sub: "cus_01",
      email: "ada@example.com",
      role: "admin",
      iat: now - 60,
      exp: now + 3600,
    }),
  },
];

function decode(part: string): unknown {
  const padded = part.replace(/-/g, "+").replace(/_/g, "/");
  const text = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  return JSON.parse(text);
}

function when(seconds: unknown): string | null {
  if (typeof seconds !== "number") return null;
  const date = new Date(seconds * 1000);
  const diff = seconds - Math.floor(Date.now() / 1000);
  const mins = Math.round(Math.abs(diff) / 60);
  const rel =
    Math.abs(diff) < 60
      ? "just now"
      : diff > 0
        ? `in ${mins} minute${mins === 1 ? "" : "s"}`
        : `${mins} minute${mins === 1 ? "" : "s"} ago`;
  return `${date.toLocaleString()} (${rel})`;
}

export function TokenInspector() {
  const [token, setToken] = useState(SAMPLES[0].token);
  const [note, setNote] = useState(SAMPLES[0].note);

  const parsed = useMemo(() => {
    const parts = token.trim().split(".");
    if (parts.length !== 3) {
      return { ok: false as const, error: "A JWT has three parts separated by dots." };
    }
    try {
      return {
        ok: true as const,
        header: decode(parts[0]),
        payload: decode(parts[1]) as Record<string, unknown>,
        signature: parts[2],
      };
    } catch {
      return { ok: false as const, error: "Could not decode. Check the token is complete." };
    }
  }, [token]);

  const exp = parsed.ok ? parsed.payload.exp : null;
  const expired = typeof exp === "number" && exp < Math.floor(Date.now() / 1000);

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          Token inspector
        </span>
        <select
          defaultValue="0"
          onChange={(event) => {
            const sample = SAMPLES[Number(event.target.value)];
            setToken(sample.token);
            setNote(sample.note);
          }}
          className="ml-auto max-w-[12rem] rounded border border-border bg-bg px-1.5 py-1 text-xs"
          aria-label="Load a sample token"
        >
          {SAMPLES.map((sample, index) => (
            <option key={sample.label} value={index}>
              {sample.label}
            </option>
          ))}
        </select>
      </div>

      <p className="border-b border-border bg-bad-soft px-3 py-2 text-xs">
        <strong>Never paste a real token here, or into any online decoder.</strong>{" "}
        A token is a live credential. These samples are invented and signed
        with nothing.
      </p>

      <textarea
        value={token}
        onChange={(event) => setToken(event.target.value)}
        spellCheck={false}
        rows={3}
        className="w-full resize-y border-b border-border bg-[var(--code-bg)] p-3 font-mono text-[0.6875rem] leading-relaxed break-all text-[var(--code-text)] outline-none"
        aria-label="Token"
      />

      {!parsed.ok ? (
        <p className="p-3 text-sm text-bad">{parsed.error}</p>
      ) : (
        <div className="grid gap-3 p-3 md:grid-cols-2">
          <div>
            <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted">
              Header
            </p>
            <pre className="mt-1 overflow-x-auto rounded-lg bg-surface-2 p-2.5 font-mono text-[0.6875rem]">
              {JSON.stringify(parsed.header, null, 2)}
            </pre>
            <p className="mt-2 text-[0.625rem] font-semibold uppercase tracking-wider text-muted">
              Signature
            </p>
            <pre className="mt-1 overflow-x-auto rounded-lg bg-surface-2 p-2.5 font-mono text-[0.6875rem] break-all">
              {parsed.signature}
            </pre>
          </div>

          <div>
            <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted">
              Payload — readable by anyone holding the token
            </p>
            <pre className="mt-1 overflow-x-auto rounded-lg bg-surface-2 p-2.5 font-mono text-[0.6875rem]">
              {JSON.stringify(parsed.payload, null, 2)}
            </pre>
            {typeof exp === "number" ? (
              <p
                className={`mt-2 rounded-lg border p-2 text-xs ${
                  expired
                    ? "border-bad/40 bg-bad-soft"
                    : "border-ok/40 bg-ok-soft"
                }`}
              >
                <strong>{expired ? "Expired" : "Expires"}: </strong>
                {when(exp)}
              </p>
            ) : null}
          </div>
        </div>
      )}

      <figcaption className="border-t border-border p-3 text-sm text-muted">
        {note}
      </figcaption>
    </figure>
  );
}
