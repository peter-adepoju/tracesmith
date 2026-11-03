"use client";

import { useState } from "react";

/**
 * An Application panel with things wrong in it.
 *
 * Five findings are planted: a session cookie with no HttpOnly, a cookie with
 * no Secure flag, a password in Local Storage, a card number in Local
 * Storage, and a session cookie with an absurd expiry. Click anything you
 * think is a problem; the panel tells you whether it is and why.
 */

type Row = {
  id: string;
  store: "cookies" | "local";
  key: string;
  value: string;
  flags?: string;
  problem: string | null;
};

const ROWS: Row[] = [
  {
    id: "sid",
    store: "cookies",
    key: "session_id",
    value: "s%3Aa7f2…redacted",
    flags: "Secure · SameSite=Lax",
    problem:
      "No HttpOnly. Any script on the page can read this session cookie, so a single cross-site scripting flaw becomes a full account takeover. HttpOnly is the flag that prevents it.",
  },
  {
    id: "pref",
    store: "cookies",
    key: "theme",
    value: "dark",
    flags: "SameSite=Lax",
    problem: null,
  },
  {
    id: "csrf",
    store: "cookies",
    key: "csrf_token",
    value: "8f41c2…redacted",
    flags: "HttpOnly · SameSite=Strict",
    problem:
      "No Secure flag. Without it the browser will send this cookie over plain HTTP, where anyone on the network can read it.",
  },
  {
    id: "longsid",
    store: "cookies",
    key: "remember_me",
    value: "r%3A91bb…redacted",
    flags: "HttpOnly · Secure · Expires 2036-01-01",
    problem:
      "A ten-year expiry on an authentication cookie. If it is ever stolen it stays valid for a decade. Worth raising even though the flags themselves are right.",
  },
  {
    id: "token",
    store: "local",
    key: "auth_token",
    value: "eyJhbGciOi…redacted",
    problem:
      "Not automatically a defect, since this is extremely common. The risk is that Local Storage is readable by any script on the page, where an HttpOnly cookie would not be. Report it as a risk observation with that reasoning.",
  },
  {
    id: "cart",
    store: "local",
    key: "cart",
    value: '[{"id":"mer-02","qty":1}]',
    problem: null,
  },
  {
    id: "pwd",
    store: "local",
    key: "user_password",
    value: "••••••••••",
    problem:
      "A password in Local Storage. Serious, immediately reportable, and no justification makes it acceptable. Redact the value in your evidence: you are proving the key exists, not republishing the secret.",
  },
  {
    id: "card",
    store: "local",
    key: "saved_card",
    value: "4111••••••••1111",
    problem:
      "A card number in Local Storage. A serious finding and almost certainly a compliance breach. Escalate as security, and do not copy the value into the ticket.",
  },
  {
    id: "last",
    store: "local",
    key: "last_viewed",
    value: "mer-04",
    problem: null,
  },
];

export function StorageAudit() {
  const [checked, setChecked] = useState<string[]>([]);
  const [open, setOpen] = useState<Row | null>(null);

  const problems = ROWS.filter((r) => r.problem);
  const found = checked.filter((id) =>
    problems.some((p) => p.id === id),
  ).length;
  const wrong = checked.length - found;

  function inspect(row: Row) {
    setOpen(row);
    if (!checked.includes(row.id)) setChecked((c) => [...c, row.id]);
  }

  const Section = ({
    store,
    title,
  }: {
    store: Row["store"];
    title: string;
  }) => (
    <div>
      <p className="px-3 pt-2 text-[0.625rem] font-semibold uppercase tracking-wider text-muted">
        {title}
      </p>
      <table className="w-full text-xs">
        <tbody>
          {ROWS.filter((r) => r.store === store).map((row) => {
            const seen = checked.includes(row.id);
            return (
              <tr
                key={row.id}
                onClick={() => inspect(row)}
                className={`cursor-pointer border-t border-border hover:bg-surface-2 ${
                  open?.id === row.id ? "bg-surface-2" : ""
                }`}
              >
                <td className="px-3 py-1.5 font-mono">{row.key}</td>
                <td className="px-3 py-1.5 font-mono text-muted">{row.value}</td>
                <td className="px-3 py-1.5 text-right font-mono text-[0.625rem] text-muted">
                  {row.flags ?? ""}
                </td>
                <td className="w-6 px-2 py-1.5 text-right">
                  {seen ? (row.problem ? "⚠" : "·") : ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          Application panel
        </span>
        <span className="ml-auto font-mono text-xs">
          <span className="text-ok">{found}</span>
          <span className="text-muted">/{problems.length} found</span>
          {wrong > 0 ? (
            <span className="text-muted"> · {wrong} clear</span>
          ) : null}
        </span>
      </div>

      <div className="overflow-x-auto">
        <Section store="cookies" title="Cookies" />
        <Section store="local" title="Local Storage" />
      </div>

      <figcaption className="border-t border-border p-3 text-sm">
        {open ? (
          <>
            <p className="font-mono text-xs">{open.key}</p>
            <p
              className={`mt-1.5 ${open.problem ? "" : "text-muted"}`}
            >
              {open.problem ?? "Nothing wrong with this one. A preference or a convenience, no sensitive value, and nothing an attacker gains from."}
            </p>
          </>
        ) : (
          <p className="text-muted">
            Five of these are findings. Click each row to check your judgement.
            Two of them you would escalate as security the same day.
          </p>
        )}
        {found === problems.length ? (
          <p className="mt-2 rounded-lg border border-ok/40 bg-ok-soft p-2.5 text-xs">
            All five found. Note that they are not equal: a password and a card
            number are escalate-now; the missing flags are report-today; the
            token in Local Storage is a risk observation, not a defect.
          </p>
        ) : null}
      </figcaption>
    </figure>
  );
}
