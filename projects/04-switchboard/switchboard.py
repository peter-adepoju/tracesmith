"""
Switchboard — inbox triage that classifies, routes, drafts, and never sends.

Standard library only. Run it with:

    python -I switchboard.py --inbox inbox.example.json

Five functions are left for you. They are marked TODO and currently raise
NotImplementedError, so `python -I verify.py` fails until you write them.

The rule this project is built around: draft-and-hold is not a safety setting
you remove once you trust it. It is the design. An agent that can send mail on
your behalf is one bad classification away from an apology you have to write
yourself.

The second rule, which people skip: after creating a draft, read it back and
confirm it is still a draft. "I called the create_draft endpoint" is not
evidence. A misconfigured client, a wrong scope, a helpful library default —
any of these turn a draft into a sent message, silently. Check.

The mailbox is injected, like Watchman's `fetch` and Scribe's `call_model`,
which is how the verifier can hand you a deliberately broken mailbox and see
whether your code notices.
"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Iterable

LOG_PATH = Path("triage-log.jsonl")

# Labels live in config, not in code — the project page is explicit about it.
# This is the fallback used when no config file is given.
DEFAULT_LABELS = ["billing", "bug", "how-to", "sales", "other"]

# Routing rules, also configuration. Content and risk decide, never the
# sender: "this address is usually fine" is how an angry customer gets a bot.
DEFAULT_RULES: list[dict[str, Any]] = [
    {"queue": "human-urgent", "any_of": ["refund", "chargeback", "lawyer", "legal", "invoice"]},
    {"queue": "human-urgent", "any_of": ["furious", "appalling", "unacceptable", "disgusted"]},
    {"queue": "human-review", "labels": ["unsure"]},
    {"queue": "auto-draft", "labels": ["how-to", "bug", "sales", "billing", "other"]},
]

UNSURE = "unsure"


@dataclass
class Message:
    id: str
    sender: str
    subject: str
    body: str


@dataclass
class Classification:
    label: str
    confidence: float


@dataclass
class ApprovalRecord:
    draft_id: str
    approver: str
    at: str
    body_hash: str


@dataclass
class TriageResult:
    message_id: str
    label: str
    confidence: float
    queue: str
    draft_id: str | None = None
    state: str = "triaged"
    notes: list[str] = field(default_factory=list)


class NotApproved(RuntimeError):
    """Raised when someone not on the approvers list tries to approve."""


class DraftWasSent(RuntimeError):
    """Raised when a read-back shows the 'draft' actually went out."""


# ---------------------------------------------------------------------------
# Milestone 1 — classify
# ---------------------------------------------------------------------------

def classify(
    message: Message,
    call_model: Callable[[str], str],
    labels: list[str] | None = None,
    threshold: float = 0.6,
) -> Classification:
    """Put the message in one of the configured labels, or say you are unsure.

    TODO (milestone 1)

    What this must do:
      - ask the model, using `build_prompt`, and read back a JSON object with
        `label` and `confidence`
      - return the label when it is one of the configured labels AND the
        confidence is at or above `threshold`
      - return UNSURE in every other case: below threshold, a label the model
        invented, a reply that is not JSON, a missing confidence

    The trap, and it is the whole milestone: "unsure" must be a real outcome,
    not a quiet fallback to the most common label. If an unparseable reply
    becomes "other" because other is the catch-all, you have built a system
    that is confidently wrong and silent about it. UNSURE goes to a person.

    Labels come from the argument, which comes from config. Hard-coding them
    here is the thing the acceptance criteria are checking against.
    """
    raise NotImplementedError("classify")


# ---------------------------------------------------------------------------
# Milestone 2 — draft, and prove you did not send
# ---------------------------------------------------------------------------

def draft_reply(mailbox: Any, message: Message, body: str) -> str:
    """Create a draft reply, then prove by reading it back that it is a draft.

    TODO (milestone 2)

    The sequence:
      - note how many messages are in the sent folder before you start
      - call `mailbox.create_draft(message.id, body)` and keep the id it gives
      - read it back with `mailbox.get_draft(draft_id)`. A draft that cannot
        be read back did not survive, whatever the create call returned.
      - check the sent folder again. If anything new is there, raise
        DraftWasSent — loudly, immediately, before anything else happens.
      - return the draft id

    The verifier hands you a mailbox that sends instead of drafting. Code that
    trusts the create call will pass every other test and fail this one, which
    is exactly the bug this milestone exists to teach.
    """
    raise NotImplementedError("draft_reply")


# ---------------------------------------------------------------------------
# Milestone 3 — the approval gate
# ---------------------------------------------------------------------------

def record_approval(
    draft_id: str,
    approver: str,
    body: str,
    approvers: Iterable[str],
    now: str,
) -> ApprovalRecord:
    """Record that a named human approved this exact draft.

    TODO (milestone 3)

    - an approver not on the list raises NotApproved. Not a warning, not a
      log line: the send does not happen.
    - the record names a person, a time, and *what* they approved. `body_hash`
      exists so that a draft edited after approval is detectable — use
      `hash_body`, which is given to you below.
    - matching should not fail over letter case or stray whitespace in an
      email address, because it will.

    The reason the hash matters: approval of a draft that then changes is not
    approval of anything. This is how "the bot sent something I never saw"
    happens in systems that do have an approval step.
    """
    raise NotImplementedError("record_approval")


# ---------------------------------------------------------------------------
# Milestone 4 — escalate, and close the loop
# ---------------------------------------------------------------------------

def route(message: Message, classification: Classification, rules: list[dict[str, Any]]) -> str:
    """Decide which queue this message belongs in.

    TODO (milestone 4)

    - rules are tried in order and the first match wins, so the urgent ones
      sit at the top of the list
    - `any_of` matches when any of those words appears in the subject or the
      body, case-insensitively
    - `labels` matches when the classification's label is in that list
    - anything matching no rule still gets a queue: return "human-review"
      rather than None. The acceptance criterion is that no message is ever
      silently dropped, and a None queue is exactly how one is.

    Route on content and risk, never on who sent it.
    """
    raise NotImplementedError("route")


def summarise(results: Iterable[TriageResult]) -> dict[str, Any]:
    """The weekly report: volume by label, and how much we are trusting it.

    TODO (milestone 4)

    Return a dict with:
      - "total": how many messages
      - "by_label": {label: count}
      - "by_queue": {queue: count}
      - "unsure_rate": the fraction that came back UNSURE, 0.0 to 1.0
      - "drafted": how many got a draft

    An empty week returns zeros, not a crash and not an empty dict. A report
    that only works when there is data is a report that breaks on the quiet
    week and gets switched off.
    """
    raise NotImplementedError("summarise")


# ---------------------------------------------------------------------------
# Given to you below this line
# ---------------------------------------------------------------------------

def hash_body(body: str) -> str:
    """A short, stable fingerprint of a draft body."""
    import hashlib

    return hashlib.sha256(body.strip().encode("utf-8")).hexdigest()[:16]


def build_prompt(message: Message, labels: list[str]) -> str:
    """A classification prompt written as a specification."""
    return f"""You triage a shared support inbox.

Return ONLY a JSON object: {{"label": "...", "confidence": 0.0}}

Allowed labels: {", ".join(labels)}
Use a confidence from 0 to 1. If the message fits none of the labels, or you
are not sure, say so with a low confidence rather than picking the closest.

Subject: {message.subject}
From: {message.sender}

{message.body}"""


def parse_json_object(reply: str) -> dict[str, Any]:
    text = reply.strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
        text = re.sub(r"\n?```$", "", text).strip()
    data = json.loads(text)
    if not isinstance(data, dict):
        raise ValueError("expected a JSON object")
    return data


class LocalMailbox:
    """A mailbox on disk, so the scaffold runs before you connect a real one.

    A real implementation needs the same three methods and nothing more.
    """

    def __init__(self) -> None:
        self.drafts: dict[str, dict[str, Any]] = {}
        self.sent: list[dict[str, Any]] = []
        self._next = 1

    def create_draft(self, in_reply_to: str, body: str) -> str:
        draft_id = f"draft-{self._next}"
        self._next += 1
        self.drafts[draft_id] = {"id": draft_id, "in_reply_to": in_reply_to, "body": body}
        return draft_id

    def get_draft(self, draft_id: str) -> dict[str, Any] | None:
        return self.drafts.get(draft_id)

    def sent_ids(self) -> list[str]:
        return [item["id"] for item in self.sent]


def keyword_model(prompt: str) -> str:
    """A stand-in classifier, so the pipeline runs before you wire up a model.

    Deliberately crude. It exists so you can see the whole flow work, and so
    the accuracy you measure in milestone 1 starts from an honest baseline.
    """
    text = prompt.lower()
    for label, words in {
        "billing": ("invoice", "refund", "charge", "payment", "card"),
        "bug": ("error", "broken", "crash", "not working", "500"),
        "how-to": ("how do i", "how to", "where is", "can i"),
        "sales": ("pricing", "quote", "demo", "buy"),
    }.items():
        if any(word in text for word in words):
            return json.dumps({"label": label, "confidence": 0.75})
    return json.dumps({"label": "other", "confidence": 0.4})


def load_inbox(path: Path) -> list[Message]:
    data = json.loads(path.read_text(encoding="utf-8"))
    return [Message(**item) for item in data["messages"]]


def append_log(results: list[TriageResult]) -> None:
    with LOG_PATH.open("a", encoding="utf-8") as handle:
        for result in results:
            handle.write(json.dumps(result.__dict__) + "\n")
            handle.flush()


def triage(
    messages: list[Message],
    mailbox: Any,
    call_model: Callable[[str], str] = keyword_model,
    labels: list[str] | None = None,
    rules: list[dict[str, Any]] | None = None,
) -> list[TriageResult]:
    """Classify, route, and draft where a draft is wanted. Never send."""
    labels = labels or DEFAULT_LABELS
    rules = rules or DEFAULT_RULES
    results: list[TriageResult] = []

    for message in messages:
        found = classify(message, call_model, labels)
        queue = route(message, found, rules)
        result = TriageResult(
            message_id=message.id,
            label=found.label,
            confidence=found.confidence,
            queue=queue,
        )
        if queue == "auto-draft":
            body = f"Hello,\n\nThanks for getting in touch about: {message.subject}\n\n[reply here]\n"
            result.draft_id = draft_reply(mailbox, message, body)
            result.state = "awaiting-approval"
        else:
            result.state = "with-human"
        results.append(result)

    append_log(results)
    return results


def main() -> int:
    parser = argparse.ArgumentParser(description="Switchboard")
    parser.add_argument("--inbox", default="inbox.example.json")
    args = parser.parse_args()

    messages = load_inbox(Path(args.inbox))
    mailbox = LocalMailbox()
    results = triage(messages, mailbox)

    for result in results:
        print(
            f"{result.queue:<14} {result.label:<10} {result.confidence:>4.2f}  "
            f"{result.message_id:<8} {result.state}"
        )

    report = summarise(results)
    print(f"\n{report}")
    print(f"\ndrafts created: {len(mailbox.drafts)}   messages sent: {len(mailbox.sent)}")
    print("That second number must be zero. It is the whole project.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
