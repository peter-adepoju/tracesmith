"""
Verifier for Herald.

    python -I verify.py

Checks behaviour against the acceptance criteria on the project page. Nothing
here can reach a person: there is no mail client, and the only thing the code
produces is text.

The tests that matter most are the ones that try to get a message past a
suppression list and the one that pulls the kill switch mid-cycle.

It checks that your code works, not that it is good. Passing is necessary and
not sufficient; the definition of done on the project page is the rest —
starting with milestone 1, which is a written policy, not code.
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

import herald as H  # noqa: E402

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


TODAY = date(2026, 3, 10)
ADA = H.Recipient("r1", "ada@example.test", "Ada", "Harmattan Supplies")
GOOD = H.Research(hook="your note about waxed cotton lead times", source="https://example.test/post")
NO_HOOK = H.Research(hook=None, source=None)


def contact(**over) -> H.Contact:
    base = dict(recipient_id="r1", messages=0, last_contacted=None)
    base.update(over)
    return H.Contact(**base)


# --- Milestone 1: suppression ---------------------------------------------

@check(1, "a suppressed address is recognised")
def _() -> None:
    assert H.is_suppressed("ada@example.test", {"ada@example.test"}) is True


@check(1, "suppression ignores case")
def _() -> None:
    assert H.is_suppressed("Ada@Example.TEST", {"ada@example.test"}) is True, (
        "an address that differs only in case got through"
    )


@check(1, "suppression ignores surrounding whitespace")
def _() -> None:
    assert H.is_suppressed("  ada@example.test ", {"ada@example.test"}) is True


@check(1, "an address not on the list is not suppressed")
def _() -> None:
    assert H.is_suppressed("grace@example.test", {"ada@example.test"}) is False


@check(1, "an unknown address is treated as suppressed")
def _() -> None:
    assert H.is_suppressed("", {"ada@example.test"}) is True, (
        "if you do not know who you are about to contact, you do not contact them"
    )


# --- Milestone 2: research, then draft ------------------------------------

@check(2, "a draft cites the specific thing it responds to")
def _() -> None:
    body = H.draft_for(ADA, GOOD, H.DEFAULT_TEMPLATE)
    assert body, "no draft produced for a recipient with a genuine hook"
    assert GOOD.hook in body, "the hook is not in the message"
    assert GOOD.source in body, "the source is not in the message"


@check(2, "a recipient with no hook is skipped, not padded")
def _() -> None:
    assert H.draft_for(ADA, NO_HOOK, H.DEFAULT_TEMPLATE) is None, (
        "a message with no genuine hook was written anyway. None means do not "
        "contact this person, not send the generic one"
    )


@check(2, "a hook with no source is not good enough")
def _() -> None:
    hookless = H.Research(hook="something I half remember", source=None)
    assert H.draft_for(ADA, hookless, H.DEFAULT_TEMPLATE) is None


@check(2, "an empty hook is not a hook")
def _() -> None:
    assert H.draft_for(ADA, H.Research(hook="   ", source="https://x.test"), H.DEFAULT_TEMPLATE) is None


# --- Milestone 3: the pause and the gate ----------------------------------

@check(3, "an ordinary recipient may be drafted for")
def _() -> None:
    allowed, _why = H.may_draft(
        H.Campaign(), ADA, contact(), H.Caps(), set(), TODAY
    )
    assert allowed is True


@check(3, "the kill switch halts everything")
def _() -> None:
    allowed, why = H.may_draft(
        H.Campaign(kill_switch=True), ADA, contact(), H.Caps(), set(), TODAY
    )
    assert allowed is False, "the kill switch was on and a draft proceeded"
    assert why, "no reason given"


@check(3, "the kill switch beats everything else")
def _() -> None:
    # Everything else about this recipient is fine; the switch still wins.
    allowed, _why = H.may_draft(
        H.Campaign(kill_switch=True, state=H.RUNNING), ADA, contact(),
        H.Caps(per_day=1000), set(), TODAY,
    )
    assert allowed is False


@check(3, "paused is reported as a state, not as an error")
def _() -> None:
    allowed, why = H.may_draft(
        H.Campaign(state=H.PAUSED), ADA, contact(), H.Caps(), set(), TODAY
    )
    assert allowed is False, "a paused campaign drafted anyway"
    assert "paus" in why.lower(), (
        f"the reason is {why!r}, which does not say it was paused. A pause "
        "that reads like a fault gets 'fixed' by someone restarting it"
    )


@check(3, "a suppressed recipient is refused before any volume rule")
def _() -> None:
    allowed, why = H.may_draft(
        H.Campaign(), ADA, contact(), H.Caps(), {"ada@example.test"}, TODAY
    )
    assert allowed is False, "a message was drafted for someone who said stop"
    assert "suppress" in why.lower() or "opted out" in why.lower(), why


@check(3, "the per-recipient total cap is enforced")
def _() -> None:
    allowed, why = H.may_draft(
        H.Campaign(), ADA, contact(messages=2), H.Caps(per_recipient_total=2),
        set(), TODAY,
    )
    assert allowed is False, "a third message went to someone capped at two"
    assert why, "no reason given"


@check(3, "the minimum gap between messages is enforced")
def _() -> None:
    recent = contact(messages=1, last_contacted="2026-03-08")
    allowed, _why = H.may_draft(
        H.Campaign(), ADA, recent, H.Caps(min_days_between=14), set(), TODAY
    )
    assert allowed is False, "a follow-up went out two days after the last one"


@check(3, "a gap longer than the minimum is allowed")
def _() -> None:
    old = contact(messages=1, last_contacted="2026-01-01")
    allowed, _why = H.may_draft(
        H.Campaign(), ADA, old, H.Caps(min_days_between=14), set(), TODAY
    )
    assert allowed is True


@check(3, "the per-day cap is enforced")
def _() -> None:
    allowed, _why = H.may_draft(
        H.Campaign(sent_today=20), ADA, contact(), H.Caps(per_day=20), set(), TODAY
    )
    assert allowed is False, "the daily cap was exceeded"


@check(3, "a kill switch mid-cycle stops the rest of the cycle")
def _() -> None:
    people = [H.Recipient(f"r{n}", f"p{n}@example.test", f"P{n}") for n in range(5)]
    research = {p.id: H.Research(hook="a thing", source="https://x.test") for p in people}
    campaign = H.Campaign(kill_switch=True)
    outcomes = H.run_cycle(
        campaign, people, research, {}, H.Caps(), set(), TODAY
    )
    assert all(o.action == "paused" for o in outcomes), (
        f"actions were {[o.action for o in outcomes]} — with the switch pulled, "
        "every recipient in the cycle must report paused"
    )
    assert not any(o.body for o in outcomes), "a body was written with the switch on"


# --- Milestone 4: replies -------------------------------------------------

@check(4, "a refusal is negative")
def _() -> None:
    assert H.classify_reply("please unsubscribe me") == "negative"


@check(4, "a refusal is detected in any case")
def _() -> None:
    assert H.classify_reply("STOP") == "negative"


@check(4, "interest is positive")
def _() -> None:
    assert H.classify_reply("This sounds good, call me") == "positive"


@check(4, "a refusal wrapped in politeness is still a refusal")
def _() -> None:
    got = H.classify_reply("This sounds interesting but please take me off your list")
    assert got == "negative", (
        f"classified as {got!r}. Negative wins over everything; leaning the "
        "other way costs you a complaint and deserves to"
    )


@check(4, "an empty reply is neutral")
def _() -> None:
    assert H.classify_reply("") == "neutral"


@check(4, "a negative reply suppresses the address permanently")
def _() -> None:
    kind, suppression, _route = H.apply_reply("Ada@Example.test", "stop", set())
    assert kind == "negative", kind
    assert H.is_suppressed("ada@example.test", suppression), (
        "the address was not added to suppression"
    )


@check(4, "every reply routes to a human")
def _() -> None:
    for text in ("stop", "sounds good", "who is this?"):
        _kind, _suppression, route = H.apply_reply("ada@example.test", text, set())
        assert route is True, f"a {text!r} reply was not routed to a person"


@check(4, "a positive reply does not suppress")
def _() -> None:
    _kind, suppression, _route = H.apply_reply("ada@example.test", "call me", set())
    assert not H.is_suppressed("ada@example.test", suppression)


@check(4, "suppression already held is not lost")
def _() -> None:
    _kind, suppression, _route = H.apply_reply(
        "grace@example.test", "stop", {"ada@example.test"}
    )
    assert H.is_suppressed("ada@example.test", suppression), (
        "an earlier opt-out was dropped while recording a new one"
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
        print("  Would you be comfortable showing your policy to a recipient?")

    return 1 if FAILED or SKIPPED else 0


if __name__ == "__main__":
    raise SystemExit(main())
