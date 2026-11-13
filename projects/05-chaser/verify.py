"""
Verifier for Chaser.

    python -I verify.py

Checks behaviour against the acceptance criteria on the project page. Time is
injected, so a three-week ladder is tested in milliseconds. Payment lookups are
injected too, and one test counts the calls: the single most important thing
here is that you re-check payment immediately before drafting.

It checks that your code works, not that it is good. Passing is necessary and
not sufficient; the definition of done on the project page is the rest.
"""

from __future__ import annotations

import sys
from datetime import date
from pathlib import Path

# Windows consoles default to cp1252 and will mangle anything outside it.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except AttributeError:
        pass

sys.path.insert(0, str(Path(__file__).parent))

import chaser as C  # noqa: E402

PASSED: list[str] = []
FAILED: list[tuple[str, str]] = []
SKIPPED: list[str] = []


def check(milestone: int, name: str):
    """Decorator registering one acceptance criterion."""

    def wrap(fn):
        label = f"M{milestone}  {name}"
        try:
            fn()
        except NotImplementedError as exc:
            SKIPPED.append(f"{label}  (not implemented: {exc})")
        except AssertionError as exc:
            FAILED.append((label, str(exc) or "assertion failed"))
        except Exception as exc:  # noqa: BLE001
            FAILED.append((label, f"{type(exc).__name__}: {exc}"))
        else:
            PASSED.append(label)
        return fn

    return wrap


DUE = "2026-03-02"  # a Monday


def invoice(**over) -> C.Invoice:
    base = dict(id="INV-1", client="Ada Ltd", amount_minor=4850000, due_on=DUE)
    base.update(over)
    return C.Invoice(**base)


def payments(*paid: str):
    """A payment check that records every call, so we can prove it was made."""
    calls: list[str] = []

    def check_payment(invoice_id: str) -> bool:
        calls.append(invoice_id)
        return invoice_id in paid

    check_payment.calls = calls  # type: ignore[attr-defined]
    return check_payment


def expect_illegal(current: str, event: str) -> None:
    try:
        result = C.next_state(current, event)
    except NotImplementedError:
        raise
    except C.IllegalTransition:
        return
    raise AssertionError(
        f"{current} + {event} returned {result!r} instead of refusing. Silently "
        "ignoring an impossible event is how a bug hides for a month."
    )


# --- Milestone 1: the state machine ---------------------------------------

@check(1, "a sent reminder moves unpaid to reminded-1")
def _() -> None:
    assert C.next_state(C.UNPAID, C.SENT) == C.REMINDED_1


@check(1, "a second reminder moves reminded-1 to reminded-2")
def _() -> None:
    assert C.next_state(C.REMINDED_1, C.SENT) == C.REMINDED_2


@check(1, "payment moves any live state to paid")
def _() -> None:
    for state in (C.UNPAID, C.REMINDED_1, C.REMINDED_2, C.ESCALATED):
        assert C.next_state(state, C.PAYMENT) == C.PAID, f"from {state}"


@check(1, "paid is terminal")
def _() -> None:
    expect_illegal(C.PAID, C.SENT)
    expect_illegal(C.PAID, C.ESCALATE)


@check(1, "a late payment event cannot reopen a paid invoice")
def _() -> None:
    expect_illegal(C.PAID, C.PAYMENT)


@check(1, "written off is terminal")
def _() -> None:
    expect_illegal(C.WRITTEN_OFF, C.SENT)


@check(1, "reminded-2 escalates")
def _() -> None:
    assert C.next_state(C.REMINDED_2, C.ESCALATE) == C.ESCALATED


@check(1, "an impossible event is refused rather than ignored")
def _() -> None:
    expect_illegal(C.UNPAID, C.ESCALATE)


# --- Milestone 2: scheduling ----------------------------------------------

@check(2, "a working day is left alone")
def _() -> None:
    assert C.next_working_day(date(2026, 3, 4)) == date(2026, 3, 4)


@check(2, "Saturday moves to Monday")
def _() -> None:
    assert C.next_working_day(date(2026, 3, 7)) == date(2026, 3, 9)


@check(2, "Sunday moves to Monday")
def _() -> None:
    assert C.next_working_day(date(2026, 3, 8)) == date(2026, 3, 9)


@check(2, "a holiday is skipped")
def _() -> None:
    got = C.next_working_day(date(2026, 3, 9), holidays=["2026-03-09"])
    assert got == date(2026, 3, 10), got


@check(2, "a holiday on a Friday lands on the Monday")
def _() -> None:
    got = C.next_working_day(date(2026, 3, 6), holidays=["2026-03-06"])
    assert got == date(2026, 3, 9), f"{got} — Saturday and Sunday are not working days either"


@check(2, "nothing is due before the first rung's date")
def _() -> None:
    assert C.due_step(invoice(), date(2026, 3, 3), [3, 10, 21]) is None


@check(2, "the first rung is due on its date")
def _() -> None:
    # 2026-03-02 + 3 days = 2026-03-05, a Thursday.
    assert C.due_step(invoice(), date(2026, 3, 5), [3, 10, 21]) == 1


@check(2, "a rung already sent is not due again")
def _() -> None:
    sent_one = invoice(messages_sent=1, state=C.REMINDED_1)
    assert C.due_step(sent_one, date(2026, 3, 5), [3, 10, 21]) is None


@check(2, "the next unsent rung is returned, not the last one that passed")
def _() -> None:
    sent_one = invoice(messages_sent=1, state=C.REMINDED_1)
    got = C.due_step(sent_one, date(2026, 4, 30), [3, 10, 21])
    assert got == 2, f"got {got} — after rung 1, the next due rung is 2"


@check(2, "nothing is due once every rung has been sent")
def _() -> None:
    done = invoice(messages_sent=3, state=C.ESCALATED)
    assert C.due_step(done, date(2026, 6, 1), [3, 10, 21]) is None


@check(2, "the schedule is configurable, not hard-coded")
def _() -> None:
    # With a one-day schedule the first rung is due the day after due date.
    got = C.due_step(invoice(), date(2026, 3, 3), [1, 2, 3])
    assert got == 1, (
        f"got {got} — the passed-in schedule was ignored, which means the "
        "timings are baked into the logic"
    )


# --- Milestone 3: stopping --------------------------------------------------

@check(3, "payment is re-checked immediately before drafting")
def _() -> None:
    check_payment = payments()
    C.may_draft(invoice(), check_payment)
    assert check_payment.calls, (
        "check_payment was never called. Trusting invoice.state is exactly the "
        "bug this project exists to prevent"
    )


@check(3, "a payment that arrived since the last run stops the draft")
def _() -> None:
    check_payment = payments("INV-1")
    allowed, reason = C.may_draft(invoice(state=C.REMINDED_1, messages_sent=1), check_payment)
    assert allowed is False, "it drafted a chaser for an invoice that is paid"
    assert reason, "no reason given"


@check(3, "an unpaid invoice under the cap may be drafted")
def _() -> None:
    allowed, _reason = C.may_draft(invoice(messages_sent=1, state=C.REMINDED_1), payments())
    assert allowed is True


@check(3, "the message cap stops further drafts")
def _() -> None:
    allowed, reason = C.may_draft(
        invoice(messages_sent=3, state=C.ESCALATED), payments(), max_messages=3
    )
    assert allowed is False, "it drafted a fourth message past a cap of three"
    assert reason, "no reason given"


@check(3, "a terminal invoice is never drafted for")
def _() -> None:
    allowed, _reason = C.may_draft(invoice(state=C.WRITTEN_OFF), payments())
    assert allowed is False


@check(3, "a due first rung produces a draft")
def _() -> None:
    plan = C.plan_for(invoice(), date(2026, 3, 5), payments(), [3, 10, 21])
    assert plan.action == "draft", f"got {plan.action!r}"
    assert plan.step == 1, f"step={plan.step}"


@check(3, "nothing due means wait, not draft")
def _() -> None:
    plan = C.plan_for(invoice(), date(2026, 3, 3), payments(), [3, 10, 21])
    assert plan.action == "wait", f"got {plan.action!r}"


@check(3, "the third rung escalates to a person instead of sending itself")
def _() -> None:
    two_sent = invoice(messages_sent=2, state=C.REMINDED_2)
    plan = C.plan_for(two_sent, date(2026, 4, 30), payments(), [3, 10, 21])
    assert plan.action == "escalate-to-human", (
        f"got {plan.action!r} — the third message is a person's job"
    )
    assert plan.step == 3, f"step={plan.step}"


@check(3, "a payment mid-ladder halts it in the same cycle")
def _() -> None:
    mid = invoice(messages_sent=1, state=C.REMINDED_1)
    plan = C.plan_for(mid, date(2026, 4, 30), payments("INV-1"), [3, 10, 21])
    assert plan.action == "stop", (
        f"got {plan.action!r} — a rung was due and the invoice was paid; "
        "paid wins, within one cycle"
    )


# --- Report ---------------------------------------------------------------

def main() -> int:
    total = len(PASSED) + len(FAILED) + len(SKIPPED)

    for label in PASSED:
        print(f"  pass    {label}")
    for label, reason in FAILED:
        print(f"  FAIL    {label}\n            {reason}")
    for label in SKIPPED:
        print(f"  todo    {label}")

    print()
    print(f"  {len(PASSED)} passed, {len(FAILED)} failed, {len(SKIPPED)} not written, of {total}")

    if SKIPPED and not FAILED:
        print("\n  Nothing is wrong yet — there is just code still to write.")
    if FAILED:
        print("\n  Read the first failure above. Fix that one, then run this again.")
    if not FAILED and not SKIPPED:
        print("\n  All acceptance criteria pass.")
        print("  Now the part no verifier can check: the definition of done.")
        print("  Have you marked an invoice paid between two runs and watched it stop?")

    return 1 if FAILED or SKIPPED else 0


if __name__ == "__main__":
    raise SystemExit(main())
