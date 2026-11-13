"""
Chaser — a polite, escalating follow-up ladder that stops the moment you are paid.

Standard library only. Run it with:

    python -I chaser.py --invoices invoices.example.json

Five functions are left for you. They are marked TODO and currently raise
NotImplementedError, so `python -I verify.py` fails until you write them.

The failure this project is built to prevent: chasing someone who has already
paid. It is worse than sending nothing. It costs you the client, and it is
almost always caused by the same thing — a payment state read once at the top
of the run and trusted twenty minutes later.

So `may_draft` takes `check_payment` as an argument and must call it every
time, immediately before drafting. Not at the start of the batch. Not from a
dict you filled earlier. Every time.

`today` is injected for the same reason Watchman injects `fetch`: a ladder you
can only test by waiting three days is a ladder you will not test.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass, field
from datetime import date, timedelta
from pathlib import Path
from typing import Any, Callable, Iterable

LOG_PATH = Path("chaser-log.jsonl")

# The states. Paid and written-off are terminal: nothing leaves them.
UNPAID = "unpaid"
REMINDED_1 = "reminded-1"
REMINDED_2 = "reminded-2"
ESCALATED = "escalated"
PAID = "paid"
WRITTEN_OFF = "written-off"

TERMINAL = {PAID, WRITTEN_OFF}

# Events that can move an invoice.
SENT = "reminder-sent"
PAYMENT = "payment-received"
ESCALATE = "escalate"
WRITE_OFF = "write-off"

# The ladder, in days after the due date. Configurable, never hard-coded in
# the logic — the project page is explicit about it.
DEFAULT_SCHEDULE = [3, 10, 21]

# A hard cap. After this many messages a person takes over, full stop.
DEFAULT_MAX_MESSAGES = 3


@dataclass
class Invoice:
    id: str
    client: str
    amount_minor: int
    due_on: str
    state: str = UNPAID
    messages_sent: int = 0
    last_sent_on: str | None = None


@dataclass
class Plan:
    invoice_id: str
    action: str  # "draft", "escalate-to-human", "stop", "wait"
    step: int | None = None
    reason: str = ""
    notes: list[str] = field(default_factory=list)


class IllegalTransition(RuntimeError):
    """Raised when an event would move an invoice somewhere it cannot go."""


# ---------------------------------------------------------------------------
# Milestone 1 — the state machine
# ---------------------------------------------------------------------------

def next_state(current: str, event: str) -> str:
    """Apply one event to one state and return the new state.

    TODO (milestone 1)

    The transitions:
      - PAYMENT moves any non-terminal state to PAID
      - SENT moves UNPAID to REMINDED_1, and REMINDED_1 to REMINDED_2
      - SENT from REMINDED_2 is NOT a third reminder — the ladder is three
        messages and the third is a person's job. Decide what it does and be
        able to defend it; raising IllegalTransition is defensible.
      - ESCALATE moves REMINDED_2 to ESCALATED
      - WRITE_OFF moves any non-terminal state to WRITTEN_OFF
      - anything leaving a terminal state raises IllegalTransition. PAID is
        terminal: that is the acceptance criterion, and it is what stops a
        late-arriving webhook resurrecting a closed invoice.
      - an event that makes no sense from the current state raises
        IllegalTransition rather than returning the state unchanged. Silently
        ignoring an impossible event is how a bug hides for a month.
    """
    raise NotImplementedError("next_state")


# ---------------------------------------------------------------------------
# Milestone 2 — the ladder
# ---------------------------------------------------------------------------

def next_working_day(day: date, holidays: Iterable[str] = ()) -> date:
    """The first working day on or after `day`.

    TODO (milestone 2)

    - Saturday and Sunday are not working days
    - a date in `holidays` (ISO strings, "2026-12-25") is not a working day
    - a day that is already a working day comes back unchanged
    - keep stepping: Christmas on a Friday means the answer is the Monday

    Chasing somebody about money at 9am on a public holiday is the kind of
    detail that decides whether this reads as professional or automated.
    """
    raise NotImplementedError("next_working_day")


def due_step(
    invoice: Invoice,
    today: date,
    schedule: list[int] | None = None,
    holidays: Iterable[str] = (),
) -> int | None:
    """Which rung of the ladder is due now — 1, 2, 3 — or None if none is.

    TODO (milestone 2)

    - the schedule is days after the due date: [3, 10, 21] means the first
      message three days after due, the second at ten, the third at
      twenty-one
    - each rung's date is moved to the next working day before comparing
    - a rung is due when today is on or after that date AND that rung has not
      already been sent — `messages_sent` tells you how many have gone
    - return the next unsent rung that is due, not the last one that passed
    - nothing is due before the first date, or once every rung is sent
    """
    raise NotImplementedError("due_step")


# ---------------------------------------------------------------------------
# Milestone 3 — stop reliably
# ---------------------------------------------------------------------------

def may_draft(
    invoice: Invoice,
    check_payment: Callable[[str], bool],
    max_messages: int = DEFAULT_MAX_MESSAGES,
) -> tuple[bool, str]:
    """May we draft a message for this invoice right now? And why not?

    TODO (milestone 3)

    Return (True, "") or (False, reason).

    The order matters, and it is the point of the milestone:
      - if the invoice is already in a terminal state, no
      - CALL `check_payment(invoice.id)` — every time, right now, not from
        anything cached. If it says paid, the answer is no and the reason
        says so. This is the check that stops you chasing someone who paid
        four minutes ago.
      - if `messages_sent` has reached `max_messages`, no: a person takes over
      - otherwise yes

    The verifier asserts that `check_payment` was actually called. Code that
    trusts `invoice.state` and skips the call will pass every other test.
    """
    raise NotImplementedError("may_draft")


def plan_for(
    invoice: Invoice,
    today: date,
    check_payment: Callable[[str], bool],
    schedule: list[int] | None = None,
    max_messages: int = DEFAULT_MAX_MESSAGES,
    holidays: Iterable[str] = (),
) -> Plan:
    """Decide what should happen to one invoice today.

    TODO (milestone 3)

    Put the other four together:
      - not allowed to draft -> Plan(action="stop", reason=...)
      - allowed, but nothing is due -> Plan(action="wait")
      - rung 1 or 2 is due -> Plan(action="draft", step=...)
      - rung 3 is due -> Plan(action="escalate-to-human", step=3). The third
        message does not send itself; that is an acceptance criterion.

    Nothing here sends anything. Drafting and approval live elsewhere, as they
    did in Switchboard.
    """
    raise NotImplementedError("plan_for")


# ---------------------------------------------------------------------------
# Given to you below this line
# ---------------------------------------------------------------------------

LADDER_TEXT = {
    1: (
        "Hello {client},\n\nA gentle note that invoice {id} for {amount} was due "
        "on {due}. If it is already on its way, please ignore this.\n\nThank you."
    ),
    2: (
        "Hello {client},\n\nInvoice {id} for {amount}, due {due}, is still "
        "outstanding. Could you let me know when it is scheduled for payment?"
        "\n\nThank you."
    ),
    3: (
        "Hello {client},\n\nInvoice {id} for {amount} was due on {due} and "
        "remains unpaid. I would like to resolve this — could we agree a date "
        "this week?\n\nThank you."
    ),
}


def money(minor: int) -> str:
    return f"NGN {minor / 100:,.2f}"


def compose(invoice: Invoice, step: int) -> str:
    """The message body for a rung. Firm, never rude — read them aloud."""
    return LADDER_TEXT[step].format(
        client=invoice.client,
        id=invoice.id,
        amount=money(invoice.amount_minor),
        due=invoice.due_on,
    )


def load_invoices(path: Path) -> list[Invoice]:
    data = json.loads(path.read_text(encoding="utf-8"))
    return [Invoice(**item) for item in data["invoices"]]


def append_log(plans: list[Plan]) -> None:
    with LOG_PATH.open("a", encoding="utf-8") as handle:
        for plan in plans:
            handle.write(json.dumps(plan.__dict__) + "\n")
            handle.flush()


def ledger_payment_check(paid_ids: set[str]) -> Callable[[str], bool]:
    """A stand-in for a real payment lookup, so the scaffold runs today.

    Replace it with a call to your accounting system. Keep the shape: a
    function of one invoice id that answers now, not a dict you filled
    earlier. The shape is the lesson.
    """

    def check(invoice_id: str) -> bool:
        return invoice_id in paid_ids

    return check


def run(
    invoices: list[Invoice],
    today: date,
    check_payment: Callable[[str], bool],
    schedule: list[int] | None = None,
    holidays: Iterable[str] = (),
) -> list[Plan]:
    plans = [
        plan_for(invoice, today, check_payment, schedule, DEFAULT_MAX_MESSAGES, holidays)
        for invoice in invoices
    ]
    append_log(plans)
    return plans


def main() -> int:
    parser = argparse.ArgumentParser(description="Chaser")
    parser.add_argument("--invoices", default="invoices.example.json")
    parser.add_argument("--today", default=date.today().isoformat())
    parser.add_argument("--paid", default="", help="comma-separated ids already paid")
    args = parser.parse_args()

    invoices = load_invoices(Path(args.invoices))
    paid = {item for item in args.paid.split(",") if item}
    plans = run(invoices, date.fromisoformat(args.today), ledger_payment_check(paid))

    for plan, invoice in zip(plans, invoices):
        line = f"{plan.action:<18} {invoice.id:<10} {invoice.state:<12}"
        if plan.step:
            line += f" step={plan.step}"
        if plan.reason:
            line += f"  ({plan.reason})"
        print(line)

    print("\nNow run it again with --paid on one of the ids that was about to be")
    print("chased. Nothing should be drafted for it. That is the whole project.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
