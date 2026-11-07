"use client";

import { useState } from "react";

/**
 * When is this actually due?
 *
 * An SLA measured in business hours is the single most misread number in
 * support. "Four hours" on a Friday afternoon is not Friday evening, and a
 * customer told the wrong deadline is a complaint you created yourself.
 *
 * Every instant here is fixed, so the figure renders identically on the
 * server and the client — no clock is read during render.
 */

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const OPEN = 9;
const CLOSE = 17;

type Priority = "P1" | "P2" | "P3" | "P4";

const RESPONSE_HOURS: Record<Priority, number> = {
  P1: 1,
  P2: 4,
  P3: 8,
  P4: 24,
};

const PRIORITY_NOTE: Record<Priority, string> = {
  P1: "One business hour. Many teams run P1 around the clock instead, precisely because business hours make no sense when money is stopped.",
  P2: "Four business hours.",
  P3: "Eight business hours — one full working day.",
  P4: "Twenty-four business hours — three working days.",
};

type Arrival = { label: string; iso: string };

const ARRIVALS: Arrival[] = [
  { label: "Tuesday 10:15", iso: "2026-11-10T10:15:00Z" },
  { label: "Tuesday 16:30", iso: "2026-11-10T16:30:00Z" },
  { label: "Friday 15:00", iso: "2026-11-13T15:00:00Z" },
  { label: "Friday 18:40 (after close)", iso: "2026-11-13T18:40:00Z" },
  { label: "Saturday 11:00", iso: "2026-11-14T11:00:00Z" },
  { label: "Monday 07:30 (before open)", iso: "2026-11-16T07:30:00Z" },
];

function isWorkday(d: Date) {
  const day = d.getUTCDay();
  return day >= 1 && day <= 5;
}

/** Move to the next moment the clock is running, if it is not already. */
function startOfClock(from: Date): { at: Date; waited: string | null } {
  const at = new Date(from);
  let waited: string | null = null;

  if (!isWorkday(at) || at.getUTCHours() >= CLOSE) {
    // Next working day at opening.
    do {
      at.setUTCDate(at.getUTCDate() + 1);
    } while (!isWorkday(at));
    at.setUTCHours(OPEN, 0, 0, 0);
    waited = `Outside business hours, so the clock does not start until ${DAYS[at.getUTCDay()]} ${OPEN}:00.`;
  } else if (at.getUTCHours() < OPEN) {
    at.setUTCHours(OPEN, 0, 0, 0);
    waited = `Before opening, so the clock starts at ${DAYS[at.getUTCDay()]} ${OPEN}:00.`;
  }

  return { at, waited };
}

/** Add business hours, skipping evenings and weekends. */
function addBusinessHours(from: Date, hours: number): Date {
  const at = new Date(from);
  let remaining = hours * 60;

  while (remaining > 0) {
    const close = new Date(at);
    close.setUTCHours(CLOSE, 0, 0, 0);
    const availableToday = (close.getTime() - at.getTime()) / 60000;

    if (remaining <= availableToday) {
      at.setTime(at.getTime() + remaining * 60000);
      remaining = 0;
    } else {
      remaining -= availableToday;
      do {
        at.setUTCDate(at.getUTCDate() + 1);
      } while (!isWorkday(at));
      at.setUTCHours(OPEN, 0, 0, 0);
    }
  }

  return at;
}

function format(d: Date) {
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} Nov, ${hh}:${mm}`;
}

export function SlaClock() {
  const [arrival, setArrival] = useState(0);
  const [priority, setPriority] = useState<Priority>("P2");

  const raw = new Date(ARRIVALS[arrival].iso);
  const { at: start, waited } = startOfClock(raw);
  const due = addBusinessHours(start, RESPONSE_HOURS[priority]);

  const elapsedDays = Math.round(
    (due.getTime() - raw.getTime()) / 86400000,
  );
  const surprising = elapsedDays >= 1;

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          When is the first response due?
        </span>
      </div>

      <p className="border-b border-border px-3 py-2 text-xs text-muted">
        Business hours: Monday to Friday, {OPEN}:00 to {CLOSE}:00 WAT. No
        weekends, no public holidays.
      </p>

      <div className="grid gap-3 border-b border-border p-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted">
            The ticket arrives
          </span>
          <select
            value={arrival}
            onChange={(event) => setArrival(Number(event.target.value))}
            className="mt-1 w-full rounded border border-border bg-bg px-2 py-1.5 text-sm"
          >
            {ARRIVALS.map((a, i) => (
              <option key={a.iso} value={i}>
                {a.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted">
            Priority
          </span>
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as Priority)}
            className="mt-1 w-full rounded border border-border bg-bg px-2 py-1.5 text-sm"
          >
            {(Object.keys(RESPONSE_HOURS) as Priority[]).map((p) => (
              <option key={p} value={p}>
                {p} — {RESPONSE_HOURS[p]} business hour
                {RESPONSE_HOURS[p] === 1 ? "" : "s"}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="p-3">
        <ol className="space-y-2 text-sm">
          <li>
            <span className="text-muted">Arrived:</span>{" "}
            <strong>{format(raw)}</strong>
          </li>
          {waited ? (
            <li className="rounded-lg border border-warn/40 bg-warn-soft p-2.5">
              {waited}
            </li>
          ) : (
            <li>
              <span className="text-muted">Clock starts:</span> immediately —
              the ticket arrived during business hours.
            </li>
          )}
          <li>
            <span className="text-muted">
              Add {RESPONSE_HOURS[priority]} business hour
              {RESPONSE_HOURS[priority] === 1 ? "" : "s"}:
            </span>{" "}
            <strong className="text-ok">{format(due)}</strong>
          </li>
        </ol>

        <p
          className={`mt-3 rounded-lg border p-2.5 text-sm ${
            surprising
              ? "border-bad/40 bg-bad-soft"
              : "border-border bg-surface-2"
          }`}
        >
          {surprising ? (
            <>
              <strong>
                That is {elapsedDays} calendar day
                {elapsedDays === 1 ? "" : "s"} after the ticket arrived.
              </strong>{" "}
              The customer is not counting business hours — they are counting
              days. This gap is where complaints come from, which is why the
              first response says when you will come back rather than leaving
              them to guess.
            </>
          ) : (
            <>Same day. {PRIORITY_NOTE[priority]}</>
          )}
        </p>
      </div>

      <figcaption className="border-t border-border p-3 text-sm text-muted">
        Try Friday 15:00 at P3, then Saturday 11:00 at P2. Both are
        comfortably within SLA and both feel, to the person waiting, like
        being ignored for most of a weekend.
      </figcaption>
    </figure>
  );
}
