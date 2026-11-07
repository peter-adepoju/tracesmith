"use client";

import { useState } from "react";

/**
 * Fifteen tickets, one morning, one of you.
 *
 * Triage is not sorting by arrival and it is not sorting by who shouted.
 * Two of these are the same incident, one is a bug rather than a support
 * request, and the loudest is not the worst — which is the arrangement a
 * real queue arrives in.
 */

type Priority = "P1" | "P2" | "P3" | "P4";

type Ticket = {
  id: string;
  at: string;
  from: string;
  text: string;
  correct: Priority;
  why: string;
  /** Tickets that are the same underlying incident. */
  group?: string;
};

const TICKETS: Ticket[] = [
  {
    id: "T-01",
    at: "08:02",
    from: "Retail merchant",
    text: "Card payments have been declining for all my customers since about 7:50 this morning. Nothing goes through.",
    correct: "P1",
    why: "Money stopped, and the wording suggests it is not only them. Treat as a possible incident until proven individual.",
    group: "outage",
  },
  {
    id: "T-02",
    at: "08:05",
    from: "Individual user",
    text: "How do I change the email address on my account?",
    correct: "P4",
    why: "A how-to question with no impact and a workaround of waiting. Answer it with a link once the queue is under control.",
  },
  {
    id: "T-03",
    at: "08:09",
    from: "Online store",
    text: "Checkout has been failing on card since just before 8. My customers are getting an error at the last step.",
    correct: "P1",
    why: "Same symptom, same start time, different merchant. Together with T-01 this is one incident, not two tickets.",
    group: "outage",
  },
  {
    id: "T-04",
    at: "08:14",
    from: "Individual user",
    text: "THIS IS COMPLETELY UNACCEPTABLE. I have been waiting TWO DAYS for a reply about my statement download being in the wrong order.",
    correct: "P4",
    why: "Furious, and cosmetic. Volume is not severity. The two-day wait is a genuine failure of process worth apologising for — it does not change the priority.",
  },
  {
    id: "T-05",
    at: "08:21",
    from: "Enterprise merchant",
    text: "A settlement of NGN 4,100,000 due yesterday has not arrived. Our reconciliation is blocked.",
    correct: "P1",
    why: "Missing money, a named amount, and a blocked business process at a large account. Severity does not depend on tone, and this one is quietly stated.",
  },
  {
    id: "T-06",
    at: "08:28",
    from: "Individual user",
    text: "I was charged twice for the same order. Two debits, same amount, same minute.",
    correct: "P2",
    why: "Real money taken wrongly, affecting one person. Urgent and bounded — a duplicate charge with a clear refund path.",
  },
  {
    id: "T-07",
    at: "08:33",
    from: "Small merchant",
    text: "The dashboard total on the home screen shows one figure and the report shows another.",
    correct: "P2",
    why: "Two sources disagreeing about money. Nothing is lost yet, but the merchant cannot trust either number until someone says which is right.",
  },
  {
    id: "T-08",
    at: "08:40",
    from: "Individual user",
    text: "The app logo looks blurry on my phone since the update.",
    correct: "P4",
    why: "Cosmetic, no impact. File it, do not drop it.",
  },
  {
    id: "T-09",
    at: "08:44",
    from: "Partner developer",
    text: "Your webhook has not delivered to our endpoint since 02:00. We have had no retries either.",
    correct: "P2",
    why: "An integration is silently not receiving events, so their system is wrong and nobody there knows. Six hours of missing data already.",
  },
  {
    id: "T-10",
    at: "08:51",
    from: "Individual user",
    text: "I cannot sign in. It says my password is wrong but I am sure it is right.",
    correct: "P3",
    why: "Blocked, one person, with a self-service workaround in the password reset. Common, and genuinely annoying.",
  },
  {
    id: "T-11",
    at: "08:55",
    from: "Internal — finance",
    text: "Can you pull a list of all transactions over NGN 1,000,000 for last month?",
    correct: "P4",
    why: "An internal request with no deadline stated. Ask when they need it; it is not competing with customers until they say so.",
  },
  {
    id: "T-12",
    at: "09:02",
    from: "Individual user",
    text: "My refund was approved eight days ago and I still have not received it. I was told three to five days.",
    correct: "P2",
    why: "Money owed, a promise already broken, and a customer who has waited past the stated window. Not an outage, and not something to leave another week.",
  },
  {
    id: "T-13",
    at: "09:08",
    from: "Online store",
    text: "The export button on the transactions page does nothing. No error, nothing downloads.",
    correct: "P3",
    why: "A broken feature with a workaround — the data can be read on screen. This is a bug to file as well as a ticket to answer.",
  },
  {
    id: "T-14",
    at: "09:15",
    from: "Individual user",
    text: "Do you support recurring payments?",
    correct: "P4",
    why: "A pre-sales question. Quick to answer, no impact in waiting.",
  },
  {
    id: "T-15",
    at: "09:20",
    from: "Enterprise merchant",
    text: "We are going live with a campaign at noon and want to confirm our rate limit will hold.",
    correct: "P3",
    why: "No failure yet, and a real deadline three hours away. A deadline is not an emergency, but it does expire — and this becomes a P1 at noon if ignored.",
  },
];

const ORDER: Priority[] = ["P1", "P2", "P3", "P4"];

export function QueueTriage() {
  const [chosen, setChosen] = useState<Record<string, Priority>>({});
  const [shown, setShown] = useState(false);

  const set = (id: string, p: Priority) => {
    setShown(false);
    setChosen((previous) => ({ ...previous, [id]: p }));
  };

  const answered = Object.keys(chosen).length;
  const right = TICKETS.filter((t) => chosen[t.id] === t.correct).length;
  const missedP1 = TICKETS.filter(
    (t) => t.correct === "P1" && chosen[t.id] && chosen[t.id] !== "P1",
  );
  const inflated = TICKETS.filter(
    (t) =>
      chosen[t.id] &&
      ORDER.indexOf(chosen[t.id]) < ORDER.indexOf(t.correct) &&
      t.correct !== "P1",
  );

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          Monday, 09:30. Fifteen tickets, one of you.
        </span>
      </div>

      <ul className="divide-y divide-border">
        {TICKETS.map((ticket) => {
          const pick = chosen[ticket.id];
          const correct = shown && pick === ticket.correct;
          const wrong = shown && pick && pick !== ticket.correct;
          return (
            <li key={ticket.id} className="p-3">
              <div className="flex flex-wrap items-baseline gap-x-2 text-xs text-muted">
                <code>{ticket.id}</code>
                <span>{ticket.at}</span>
                <span className="font-medium text-text">{ticket.from}</span>
              </div>
              <p className="mt-1 text-sm">{ticket.text}</p>

              <div className="no-touch-target mt-2 flex flex-wrap gap-1.5">
                {ORDER.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => set(ticket.id, p)}
                    className={`rounded-lg border px-2.5 py-1 font-mono text-xs ${
                      pick === p
                        ? "border-accent bg-accent-soft font-semibold"
                        : "border-border bg-surface-2"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                {shown ? (
                  <span
                    className={`self-center text-xs font-semibold ${
                      correct ? "text-ok" : wrong ? "text-bad" : "text-muted"
                    }`}
                  >
                    {correct
                      ? "correct"
                      : pick
                        ? `should be ${ticket.correct}`
                        : `not triaged — should be ${ticket.correct}`}
                  </span>
                ) : null}
              </div>

              {shown ? (
                <p className="mt-1.5 text-xs text-muted">{ticket.why}</p>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-3 border-t border-border p-3">
        <button
          type="button"
          onClick={() => setShown(true)}
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white"
        >
          Check the queue
        </button>
        <span className="text-sm text-muted">
          {answered} of {TICKETS.length} triaged
        </span>
      </div>

      {shown ? (
        <div className="space-y-2 border-t border-border p-3 text-sm">
          <p className="font-medium">
            {right} of {TICKETS.length} correct.
          </p>

          {missedP1.length > 0 ? (
            <p className="rounded-lg border border-bad/40 bg-bad-soft p-2.5">
              <strong>
                You under-rated {missedP1.length} P1
                {missedP1.length === 1 ? "" : "s"} (
                {missedP1.map((t) => t.id).join(", ")}).
              </strong>{" "}
              This is the expensive direction. Everything else can wait an
              hour; money that has stopped cannot.
            </p>
          ) : null}

          {inflated.length > 0 ? (
            <p className="rounded-lg border border-warn/40 bg-warn-soft p-2.5">
              <strong>
                You over-rated {inflated.length} ticket
                {inflated.length === 1 ? "" : "s"} (
                {inflated.map((t) => t.id).join(", ")}).
              </strong>{" "}
              Inflating priority feels safe and is not: if everything is
              urgent, the ordering carries no information and the real P1
              waits behind a blurry logo.
            </p>
          ) : null}

          <p className="rounded-lg border border-border bg-surface-2 p-2.5">
            <strong>T-01 and T-03 are one incident.</strong> Same symptom,
            same start time, two merchants. Link them, raise a single
            incident, and reply to both — and once you have seen two, start
            looking for the third rather than waiting for it.
          </p>

          <p className="rounded-lg border border-border bg-surface-2 p-2.5">
            <strong>T-04 is the test of your judgement.</strong> It is the
            angriest message in the queue and the lowest priority in it. The
            two-day silence deserves a genuine apology; it does not deserve a
            place ahead of a stopped settlement.
          </p>
        </div>
      ) : null}

      <figcaption className="border-t border-border p-3 text-sm text-muted">
        Triage once, quickly, across the whole queue before working any of
        it. Fifteen tickets take about four minutes to triage and the order
        you produce decides the rest of your morning.
      </figcaption>
    </figure>
  );
}
