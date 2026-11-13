"""
Verifier for Switchboard.

    python -I verify.py

Checks behaviour against the acceptance criteria on the project page. It never
touches a real mailbox and never calls a model: both are injected fakes, which
is why nothing can escape and the run takes no time.

One test hands your code a mailbox that sends instead of drafting. That is the
deliberate misconfiguration milestone 2 asks you to catch.

It checks that your code works, not that it is good. Passing is necessary and
not sufficient; the definition of done on the project page is the rest.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

# Windows consoles default to cp1252 and will mangle anything outside it.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except AttributeError:
        pass

sys.path.insert(0, str(Path(__file__).parent))

import switchboard as S  # noqa: E402

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


NOW = "2026-02-10T09:00:00Z"
LABELS = ["billing", "bug", "how-to", "sales", "other"]

PLAIN = S.Message("m1", "ada@example.test", "How do I export?", "Where is the export button?")
ANGRY = S.Message(
    "m2", "vip@example.test", "This is unacceptable", "I am furious. Fix it today."
)
MONEY = S.Message("m3", "ada@example.test", "Refund please", "I want a refund for invoice 88.")


def says(label: str, confidence: float) -> str:
    return json.dumps({"label": label, "confidence": confidence})


def model(reply: str):
    def call_model(_prompt: str) -> str:
        return reply

    return call_model


class SendingMailbox(S.LocalMailbox):
    """A mailbox misconfigured to send. Your code must notice."""

    def create_draft(self, in_reply_to: str, body: str) -> str:
        draft_id = f"draft-{self._next}"
        self._next += 1
        # It returns an id exactly as the good one does, and then sends.
        self.sent.append({"id": draft_id, "in_reply_to": in_reply_to, "body": body})
        return draft_id


class VanishingMailbox(S.LocalMailbox):
    """A mailbox whose create succeeds and whose draft is not there after."""

    def create_draft(self, in_reply_to: str, body: str) -> str:
        del in_reply_to, body
        draft_id = f"draft-{self._next}"
        self._next += 1
        return draft_id


# --- Milestone 1: classification ------------------------------------------

@check(1, "a confident, known label is returned")
def _() -> None:
    result = S.classify(PLAIN, model(says("how-to", 0.9)), LABELS, threshold=0.6)
    assert result.label == "how-to", result.label


@check(1, "a low-confidence answer becomes unsure")
def _() -> None:
    result = S.classify(PLAIN, model(says("how-to", 0.2)), LABELS, threshold=0.6)
    assert result.label == S.UNSURE, (
        f"got {result.label!r} at confidence 0.2 with a 0.6 threshold"
    )


@check(1, "a label the model invented becomes unsure, not the closest match")
def _() -> None:
    result = S.classify(PLAIN, model(says("complaint", 0.95)), LABELS, threshold=0.6)
    assert result.label == S.UNSURE, (
        f"got {result.label!r} — 'complaint' is not a configured label"
    )


@check(1, "an unparseable reply becomes unsure, not the catch-all label")
def _() -> None:
    result = S.classify(PLAIN, model("sorry, I can't"), LABELS, threshold=0.6)
    assert result.label == S.UNSURE, (
        f"got {result.label!r}. Falling back to a real label hides the failure — "
        "this is the trap the milestone is about"
    )


@check(1, "a reply with no confidence becomes unsure")
def _() -> None:
    result = S.classify(PLAIN, model(json.dumps({"label": "how-to"})), LABELS, threshold=0.6)
    assert result.label == S.UNSURE, f"got {result.label!r} with no confidence given"


@check(1, "labels come from the argument, not from hard-coded values")
def _() -> None:
    custom = ["apples", "pears"]
    result = S.classify(PLAIN, model(says("apples", 0.9)), custom, threshold=0.6)
    assert result.label == "apples", (
        f"got {result.label!r} — the configured label set was ignored"
    )


# --- Milestone 2: draft and prove -----------------------------------------

@check(2, "a draft is created and its id returned")
def _() -> None:
    box = S.LocalMailbox()
    draft_id = S.draft_reply(box, PLAIN, "Hello there")
    assert draft_id, "no draft id returned"
    assert box.get_draft(draft_id), "the draft cannot be read back"


@check(2, "drafting leaves the sent folder untouched")
def _() -> None:
    box = S.LocalMailbox()
    S.draft_reply(box, PLAIN, "Hello there")
    assert box.sent == [], f"something was sent: {box.sent}"


@check(2, "a mailbox that sends instead of drafting is caught")
def _() -> None:
    box = SendingMailbox()
    try:
        S.draft_reply(box, PLAIN, "Hello there")
    except S.DraftWasSent:
        return
    raise AssertionError(
        "the misconfigured mailbox sent the message and your code did not "
        "notice. Reading the draft back is the only thing that catches this."
    )


@check(2, "a draft that cannot be read back is caught")
def _() -> None:
    box = VanishingMailbox()
    try:
        S.draft_reply(box, PLAIN, "Hello there")
    except NotImplementedError:
        # NotImplementedError subclasses RuntimeError, so a broad except here
        # would swallow it and report this check as passing against the
        # untouched scaffold. Let it through to be counted as not written.
        raise
    except (S.DraftWasSent, RuntimeError, AssertionError, ValueError):
        return
    raise AssertionError(
        "create_draft returned an id but the draft is not there, and your "
        "code accepted it. The returned id is not evidence."
    )


# --- Milestone 3: approval ------------------------------------------------

@check(3, "an approver on the list is recorded")
def _() -> None:
    record = S.record_approval("draft-1", "peter@example.test", "Hello", ["peter@example.test"], NOW)
    assert record.approver == "peter@example.test", record
    assert record.at == NOW, record
    assert record.draft_id == "draft-1", record


@check(3, "the record fingerprints what was approved")
def _() -> None:
    record = S.record_approval("draft-1", "peter@example.test", "Hello", ["peter@example.test"], NOW)
    assert record.body_hash == S.hash_body("Hello"), (
        "without a fingerprint, a draft edited after approval is undetectable"
    )


@check(3, "someone not on the approvers list is refused")
def _() -> None:
    try:
        S.record_approval("draft-1", "stranger@example.test", "Hello", ["peter@example.test"], NOW)
    except S.NotApproved:
        return
    raise AssertionError("an unlisted approver was accepted")


@check(3, "approver matching survives case and whitespace")
def _() -> None:
    record = S.record_approval(
        "draft-1", "  Peter@Example.test ", "Hello", ["peter@example.test"], NOW
    )
    assert record.approver, "a real address was refused over formatting"


@check(3, "an empty approvers list approves nobody")
def _() -> None:
    try:
        S.record_approval("draft-1", "peter@example.test", "Hello", [], NOW)
    except S.NotApproved:
        return
    raise AssertionError("with no approvers configured, nothing may be approved")


# --- Milestone 4: routing and the report ----------------------------------

@check(4, "money words go to a human, whoever sent them")
def _() -> None:
    queue = S.route(MONEY, S.Classification("billing", 0.95), S.DEFAULT_RULES)
    assert queue == "human-urgent", f"got {queue!r}"


@check(4, "anger goes to a human even when confidently classified")
def _() -> None:
    queue = S.route(ANGRY, S.Classification("bug", 0.99), S.DEFAULT_RULES)
    assert queue == "human-urgent", f"got {queue!r}"


@check(4, "unsure goes to a human")
def _() -> None:
    queue = S.route(PLAIN, S.Classification(S.UNSURE, 0.2), S.DEFAULT_RULES)
    assert queue.startswith("human"), f"got {queue!r}"


@check(4, "an ordinary message is drafted")
def _() -> None:
    queue = S.route(PLAIN, S.Classification("how-to", 0.9), S.DEFAULT_RULES)
    assert queue == "auto-draft", f"got {queue!r}"


@check(4, "routing does not depend on the sender")
def _() -> None:
    same_words = S.Message("m9", "nobody@example.test", ANGRY.subject, ANGRY.body)
    assert S.route(same_words, S.Classification("bug", 0.99), S.DEFAULT_RULES) == S.route(
        ANGRY, S.Classification("bug", 0.99), S.DEFAULT_RULES
    ), "two identical messages routed differently because of who sent them"


@check(4, "a message matching no rule still gets a queue")
def _() -> None:
    queue = S.route(PLAIN, S.Classification("how-to", 0.9), [])
    assert queue, "a message fell through to no queue, which is a silent drop"
    assert queue == "human-review", f"got {queue!r}, expected 'human-review'"


@check(4, "the summary counts volume by label and queue")
def _() -> None:
    results = [
        S.TriageResult("m1", "how-to", 0.9, "auto-draft", draft_id="d1"),
        S.TriageResult("m2", "how-to", 0.8, "auto-draft", draft_id="d2"),
        S.TriageResult("m3", S.UNSURE, 0.2, "human-review"),
    ]
    report = S.summarise(results)
    assert report["total"] == 3, report
    assert report["by_label"]["how-to"] == 2, report
    assert report["by_queue"]["auto-draft"] == 2, report
    assert report["drafted"] == 2, report
    assert abs(report["unsure_rate"] - (1 / 3)) < 1e-9, report


@check(4, "a quiet week reports zeros rather than crashing")
def _() -> None:
    report = S.summarise([])
    assert report["total"] == 0, report
    assert report["unsure_rate"] == 0, report
    assert report["by_label"] == {}, report


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
        print("  Against your real mailbox, is the sent folder still empty?")

    return 1 if FAILED or SKIPPED else 0


if __name__ == "__main__":
    raise SystemExit(main())
