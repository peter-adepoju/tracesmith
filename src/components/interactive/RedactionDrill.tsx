"use client";

import { useState } from "react";

/**
 * Redact a request capture before sharing it.
 *
 * A habit, not a fact, so it has to be practised rather than read. You are
 * given a realistic capture and asked to click everything that must be
 * removed before this goes into a ticket. Over-redacting is scored too,
 * because a report with the endpoint blacked out is useless.
 */

type Token = {
  id: string;
  text: string;
  /** Must be redacted before sharing. */
  secret: boolean;
  why: string;
};

const LINES: (string | Token)[][] = [
  [{ id: "m", text: "POST", secret: false, why: "The method. Keep it — it is half the diagnosis." },
   " ",
   { id: "u", text: "/v1/payments/initiate", secret: false, why: "The endpoint. Keep it. Without this nobody can act on the report." }],
  [],
  ["Request headers"],
  ["  authorization: ",
   { id: "auth", text: "Bearer sk_live_9f2a8c41bd77e0", secret: true, why: "A live secret key. The single most important thing to remove: anyone with this can act as the merchant." }],
  ["  content-type: ",
   { id: "ct", text: "application/json", secret: false, why: "Keep it — a wrong content type is itself a common cause of a 400." }],
  ["  x-request-id: ",
   { id: "rid", text: "req_8fa0c21b", secret: false, why: "Keep it, and quote it in the escalation. It is how an engineer finds this exact request in the logs." }],
  ["  cookie: ",
   { id: "ck", text: "session=s%3Aa7f2e91c...", secret: true, why: "A session cookie is a live credential. Anyone holding it is signed in as that user." }],
  [],
  ["Payload"],
  ["  {"],
  ['    "amount": ', { id: "amt", text: "4850000", secret: false, why: "Keep it. The amount is usually the point of the report." }],
  ['    "reference": ', { id: "ref", text: '"ORDER-1001"', secret: false, why: "Keep it. A reference is how the two sides match up records." }],
  ['    "card": { "number": ',
   { id: "pan", text: '"4111111111111111"', secret: true, why: "A card number. Never shared, never stored, never pasted — regardless of whether it is a test card, because nobody reading the ticket can tell." },
   " }"],
  ['    "customer": { "email": ',
   { id: "em", text: '"ada@example.com"', secret: true, why: "Personal data. Not a credential, but it identifies a real person and does not belong in a ticket. Use the customer id instead." },
   " }"],
  ["  }"],
  [],
  ["Response"],
  ['  { "error": ', { id: "err", text: '"invalid_key"', secret: false, why: "Keep it. The error code is the most useful line in the whole capture." }, " }"],
];

export function RedactionDrill() {
  const [hidden, setHidden] = useState<string[]>([]);
  const [picked, setPicked] = useState<Token | null>(null);
  const [checked, setChecked] = useState(false);

  const all = LINES.flat().filter((t): t is Token => typeof t !== "string");
  const secrets = all.filter((t) => t.secret);
  const caught = secrets.filter((t) => hidden.includes(t.id));
  const overRedacted = all.filter((t) => !t.secret && hidden.includes(t.id));

  const toggle = (token: Token) => {
    setPicked(token);
    setHidden((previous) =>
      previous.includes(token.id)
        ? previous.filter((id) => id !== token.id)
        : [...previous, token.id],
    );
  };

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          Redact before you share
        </span>
        <button
          type="button"
          onClick={() => setChecked(true)}
          className="ml-auto rounded bg-accent px-2.5 py-1 text-xs font-medium text-white"
        >
          Check
        </button>
        <button
          type="button"
          onClick={() => {
            setHidden([]);
            setChecked(false);
            setPicked(null);
          }}
          className="rounded border border-border px-2 py-1 text-xs"
        >
          Reset
        </button>
      </div>

      <p className="border-b border-border px-3 py-2 text-xs text-muted">
        This capture is going into a ticket. Click everything that must be
        removed first — and nothing that must not.
      </p>

      <div className="overflow-x-auto bg-[var(--code-bg)] p-3 font-mono text-xs leading-relaxed text-[var(--code-text)]">
        {LINES.map((line, index) => (
          <div key={index} className="whitespace-pre">
            {line.length === 0 ? " " : null}
            {line.map((part, partIndex) =>
              typeof part === "string" ? (
                <span key={partIndex}>{part}</span>
              ) : (
                <button
                  key={part.id}
                  type="button"
                  onClick={() => toggle(part)}
                  className={`rounded px-1 transition-colors ${
                    hidden.includes(part.id)
                      ? "bg-white/80 text-transparent"
                      : "underline decoration-dotted underline-offset-2 hover:bg-white/15"
                  } ${
                    checked && hidden.includes(part.id) && !part.secret
                      ? "ring-2 ring-amber-400"
                      : ""
                  } ${
                    checked && !hidden.includes(part.id) && part.secret
                      ? "ring-2 ring-red-500"
                      : ""
                  }`}
                >
                  {part.text}
                </button>
              ),
            )}
          </div>
        ))}
      </div>

      <figcaption className="border-t border-border p-3 text-sm">
        {checked ? (
          <div className="space-y-2">
            <p className="font-mono text-xs">
              <span className={caught.length === secrets.length ? "text-ok" : "text-bad"}>
                {caught.length}/{secrets.length} secrets redacted
              </span>
              {overRedacted.length > 0 ? (
                <span className="text-warn">
                  {" "}· {overRedacted.length} over-redacted
                </span>
              ) : null}
            </p>
            {caught.length < secrets.length ? (
              <p className="rounded-lg border border-bad/40 bg-bad-soft p-2.5 text-xs">
                Outlined in red: left in, and should not have been. Any one of
                these turns your bug report into a second incident.
              </p>
            ) : null}
            {overRedacted.length > 0 ? (
              <p className="rounded-lg border border-warn/40 bg-warn-soft p-2.5 text-xs">
                Outlined in amber: removed, and should have stayed. Redacting
                the endpoint, the error code or the request id leaves a report
                nobody can act on. The goal is a capture that proves the bug
                and leaks nothing — not a black rectangle.
              </p>
            ) : null}
            {caught.length === secrets.length && overRedacted.length === 0 ? (
              <p className="rounded-lg border border-ok/40 bg-ok-soft p-2.5 text-xs">
                Exactly right. Every credential and every piece of personal
                data is gone, and everything an engineer needs is still there.
              </p>
            ) : null}
          </div>
        ) : picked ? (
          <p>
            <strong>{picked.secret ? "Redact. " : "Keep. "}</strong>
            {picked.why}
          </p>
        ) : (
          <p className="text-muted">
            Click any underlined value to black it out, and read why it does
            or does not need to go. Press Check when you are done.
          </p>
        )}
      </figcaption>
    </figure>
  );
}
