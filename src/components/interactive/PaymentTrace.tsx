"use client";

import { useState } from "react";

/**
 * One payment, five ways it goes wrong.
 *
 * The reason payment support is hard is that the customer, the merchant and
 * your own records can each hold a different, internally consistent belief
 * about the same payment. Choosing a failure point here shows all three at
 * once, which is the thing prose cannot do.
 */

type StageId =
  | "submit"
  | "charge"
  | "auth"
  | "issuer"
  | "result"
  | "webhook"
  | "return"
  | "settle";

type Stage = {
  id: StageId;
  label: string;
  actor: string;
  detail: string;
};

const STAGES: Stage[] = [
  {
    id: "submit",
    label: "Card details submitted",
    actor: "Customer → merchant page",
    detail: "Collected by the gateway's form, so the merchant never sees the full card number.",
  },
  {
    id: "charge",
    label: "Charge created",
    actor: "Merchant server → gateway",
    detail: "POST /charges with the amount, currency and a reference.",
  },
  {
    id: "auth",
    label: "Authorisation requested",
    actor: "Gateway → acquirer → card network",
    detail: "The request is routed to the bank that issued the card.",
  },
  {
    id: "issuer",
    label: "Issuer decides",
    actor: "Issuing bank",
    detail: "Checks funds, limits and fraud rules. Approves or declines with a code.",
  },
  {
    id: "result",
    label: "Result returned",
    actor: "Gateway → merchant server",
    detail: "Approved: the funds are now held on the card, not yet moved.",
  },
  {
    id: "webhook",
    label: "Webhook delivered",
    actor: "Gateway → merchant server",
    detail: "The authoritative notification. This is what should create the order.",
  },
  {
    id: "return",
    label: "Browser returns",
    actor: "Customer → merchant page",
    detail: "A redirect back to the shop. Convenience only — it proves nothing.",
  },
  {
    id: "settle",
    label: "Settlement",
    actor: "Acquirer → merchant bank",
    detail: "Batched, typically next working day. This is when money actually moves.",
  },
];

type Failure = {
  id: string;
  label: string;
  /** The stage that fails. Stages after it do not happen. */
  at: StageId;
  customer: string;
  merchant: string;
  truth: string;
  action: string;
  whose: string;
};

const FAILURES: Failure[] = [
  {
    id: "none",
    label: "Nothing fails",
    at: "settle",
    customer: "Sees a confirmation. Money shows as pending on the card, then posts.",
    merchant: "Order created, payment recorded, settled the next working day.",
    truth: "Everything agrees. This is the shape to hold in your head — every failure below is a departure from it.",
    action: "None.",
    whose: "—",
  },
  {
    id: "declined",
    label: "The issuer declines",
    at: "issuer",
    customer: '"Payment failed." No money leaves the account.',
    merchant: "No order, no payment record beyond a failed attempt.",
    truth: "Working correctly. The customer's own bank refused — insufficient funds, a limit, or its fraud rules.",
    action: "Tell them the decline code in plain language and suggest they contact their bank or try another card. You cannot see why the bank refused and neither can the gateway — only a reason code.",
    whose: "The issuing bank. Not a product bug.",
  },
  {
    id: "timeout",
    label: "The gateway times out",
    at: "result",
    customer: 'Spinner, then "Payment failed." Money may well be held on the card.',
    merchant: "No result received. Usually records the attempt as failed.",
    truth: "Dangerous. The authorisation may have succeeded at the issuer while the answer never got back, so the customer is held and the merchant believes it failed.",
    action: "Look the charge up at the gateway by reference before anything else. If it authorised, the customer must not retry — a retry is a second hold on their money. Tell them that first, then fix the order.",
    whose: "Gateway or network. Support must act immediately.",
  },
  {
    id: "webhook",
    label: "The webhook never arrives",
    at: "webhook",
    customer: "Charged. No confirmation email, no order in their account.",
    merchant: "No idea the payment happened. Nothing in their system.",
    truth: "The payment fully succeeded. Only the notification failed, so the merchant's system is simply unaware.",
    action: "Confirm the charge at the gateway, re-send the webhook or create the order manually, and tell the customer they are charged once and will not be charged again. The commonest hard ticket in payments.",
    whose: "Delivery, or the merchant's endpoint. Check which returned what.",
  },
  {
    id: "return",
    label: "The browser never returns",
    at: "return",
    customer: "Closed the tab, or lost signal. Has no idea whether it worked.",
    merchant: "Knows, if the webhook arrived. Order created normally.",
    truth: "Fine. The browser return is a convenience and nothing depends on it — which is exactly why the webhook, not the redirect, must be what creates the order.",
    action: "Reassure the customer with the reference. If the merchant's system depends on the redirect rather than the webhook, that is a design defect worth raising.",
    whose: "Nobody, unless the merchant built on the redirect.",
  },
  {
    id: "settle",
    label: "Settlement is late",
    at: "settle",
    customer: "Unaffected. Their money left days ago.",
    merchant: 'Sees "paid" transactions and no money in the bank. Reconciliation blocked.',
    truth: "Authorisation and settlement are different events. Payment success never meant the merchant has the money yet.",
    action: "Give the payout reference and the sent timestamp, explain the posting schedule, and give a date. Escalate to payments operations if it passes that date.",
    whose: "Acquirer, bank, or simply the schedule.",
  },
];

export function PaymentTrace() {
  const [index, setIndex] = useState(0);
  const failure = FAILURES[index];
  const stopAt = STAGES.findIndex((s) => s.id === failure.at);
  const clean = failure.id === "none";

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          One payment, end to end
        </span>
        <select
          value={index}
          onChange={(event) => setIndex(Number(event.target.value))}
          className="ml-auto max-w-[13rem] rounded border border-border bg-bg px-1.5 py-1 text-xs"
          aria-label="Choose what fails"
        >
          {FAILURES.map((f, i) => (
            <option key={f.id} value={i}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <ol className="divide-y divide-border">
        {STAGES.map((stage, i) => {
          const failedHere = !clean && i === stopAt;
          const neverHappened = !clean && i > stopAt;
          return (
            <li
              key={stage.id}
              className={`flex gap-3 p-3 ${
                failedHere ? "bg-bad-soft" : neverHappened ? "opacity-40" : ""
              }`}
            >
              <span className="font-mono text-xs text-muted">{i + 1}</span>
              <span className="flex-1">
                <span className="block text-sm font-medium">
                  {stage.label}
                  {failedHere ? (
                    <span className="ml-2 rounded bg-bad px-1.5 py-0.5 text-[0.5625rem] font-semibold uppercase tracking-wider text-white">
                      fails here
                    </span>
                  ) : neverHappened ? (
                    <span className="ml-2 text-[0.625rem] font-normal text-muted">
                      never happens
                    </span>
                  ) : null}
                </span>
                <span className="block text-[0.6875rem] text-muted">
                  {stage.actor} — {stage.detail}
                </span>
              </span>
            </li>
          );
        })}
      </ol>

      <div className="grid gap-2 border-t border-border p-3 text-sm sm:grid-cols-3">
        {[
          ["The customer believes", failure.customer],
          ["The merchant believes", failure.merchant],
          ["What is actually true", failure.truth],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-border bg-surface-2 p-2.5"
          >
            <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted">
              {label}
            </p>
            <p className="mt-1 text-xs">{value}</p>
          </div>
        ))}
      </div>

      {!clean ? (
        <div className="border-t border-border p-3 text-sm">
          <p className="rounded-lg border border-ok/40 bg-ok-soft p-2.5">
            <strong>What support does:</strong> {failure.action}
          </p>
          <p className="mt-2 text-xs text-muted">
            <strong>Whose problem:</strong> {failure.whose}
          </p>
        </div>
      ) : null}

      <figcaption className="border-t border-border p-3 text-sm text-muted">
        Compare the three beliefs in each case. They are each internally
        consistent, which is why a payment ticket cannot be resolved by
        asking anyone what they think happened — only by looking the charge
        up at the gateway.
      </figcaption>
    </figure>
  );
}
