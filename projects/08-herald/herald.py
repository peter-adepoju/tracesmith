"""
Herald — an outreach agent with a safety pause and a human on every message.

Standard library only. Run it with:

    python -I herald.py --campaign campaign.example.json

Five functions are left for you. They are marked TODO and currently raise
NotImplementedError, so `python -I verify.py` fails until you write them.

This is the highest-risk thing in the track, because it touches real people
who did not ask to hear from you. Build it exactly once, properly.

Three rules hold the whole thing up, and none of them is a setting:

  The suppression list is permanent and checked before every draft. Not at
  the start of the batch. A "no" is a no for ever, and the cost of getting
  this wrong is not a bug report — it is a person who asked you to stop and
  heard from you again.

  Nothing sends. Every message is a draft until a named human approves that
  specific message, as in Switchboard.

  The kill switch halts everything within one cycle, and PAUSED is reported
  as a state, not an error. A pause that looks like a crash gets "fixed" by
  someone restarting it.

And the rule that makes the rest worth doing: a message that could have been
sent to anyone should not be sent to anyone. `draft_for` returns None when
there is no genuine hook, and None means do not contact this person — not
"pad it out with their company name".
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from typing import Any, Iterable

LOG_PATH = Path("herald-log.jsonl")
SUPPRESSION_PATH = Path("suppression.txt")

RUNNING = "running"
PAUSED = "paused"

# Words that make a reply a refusal. Deliberately broad: a false positive
# costs you one prospect, a false negative costs you a complaint.
REFUSAL_WORDS = (
    "unsubscribe", "stop", "remove me", "not interested", "no thanks",
    "take me off", "do not contact", "don't contact", "opt out", "leave me alone",
)
INTEREST_WORDS = ("interested", "tell me more", "sounds good", "let's talk", "call me")


@dataclass
class Recipient:
    id: str
    email: str
    name: str
    company: str = ""


@dataclass
class Research:
    """What you actually found out about this person. The hook is the point."""

    hook: str | None = None
    source: str | None = None


@dataclass
class Caps:
    per_day: int = 20
    per_recipient_total: int = 2
    min_days_between: int = 14


@dataclass
class Campaign:
    state: str = RUNNING
    kill_switch: bool = False
    sent_today: int = 0


@dataclass
class Contact:
    """What we have already done to one recipient."""

    recipient_id: str
    messages: int = 0
    last_contacted: str | None = None


@dataclass
class Outcome:
    recipient_id: str
    action: str  # "draft", "skip", "paused"
    reason: str = ""
    body: str | None = None


# ---------------------------------------------------------------------------
# Milestone 1 — the rules, in code
# ---------------------------------------------------------------------------

def is_suppressed(email: str, suppression: Iterable[str]) -> bool:
    """Has this person told us to stop?

    TODO (milestone 1)

    - matching ignores case and surrounding whitespace, because addresses
      arrive formatted however the sender's mail client felt like it
    - an empty or missing address counts as suppressed. If you do not know
      who you are about to contact, you do not contact them.

    This is checked before every draft, every time. Caching it for the
    duration of a batch is how somebody who unsubscribed at 09:01 gets a
    message at 09:04.
    """
    raise NotImplementedError("is_suppressed")


# ---------------------------------------------------------------------------
# Milestone 2 — research, then draft
# ---------------------------------------------------------------------------

def draft_for(recipient: Recipient, research: Research, template: str) -> str | None:
    """Write the message, or decide this person should not be contacted.

    TODO (milestone 2)

    Return None when there is no genuine hook — no `hook`, an empty one, or
    no `source` to back it up. None means skip this person entirely. It does
    not mean "send the generic one".

    Otherwise fill `template` with `name`, `company`, `hook` and `source`.

    The acceptance criterion is that each draft cites the specific thing it
    is responding to, so the hook and the source must both appear in the text
    you return. A message that could have been sent to anyone should not be
    sent to anyone — and the honest version of that rule is that most of your
    list will produce None, which is the system working.
    """
    raise NotImplementedError("draft_for")


# ---------------------------------------------------------------------------
# Milestone 3 — the pause and the gate
# ---------------------------------------------------------------------------

def may_draft(
    campaign: Campaign,
    recipient: Recipient,
    contact: Contact,
    caps: Caps,
    suppression: Iterable[str],
    today: date,
) -> tuple[bool, str]:
    """May we draft for this person, in this cycle? And if not, why not?

    TODO (milestone 3)

    Return (True, "") or (False, reason). Check in this order — the order is
    the safety argument:

      1. the kill switch. If it is on, nothing proceeds, whatever else is
         true. It must halt everything within one cycle.
      2. the campaign being PAUSED. Same answer, different reason: a pause is
         a state someone chose, and the reason must say so rather than
         reading like a fault.
      3. suppression, via is_suppressed. Before anything else about volume.
      4. the per-recipient total cap
      5. the minimum days between messages to the same person
      6. the per-day cap across the whole campaign

    Every reason is one a human can read in a log and act on.
    """
    raise NotImplementedError("may_draft")


# ---------------------------------------------------------------------------
# Milestone 4 — reply handling
# ---------------------------------------------------------------------------

def classify_reply(text: str) -> str:
    """Return "negative", "positive" or "neutral".

    TODO (milestone 4)

    - any of REFUSAL_WORDS makes it negative, wherever it appears and in any
      case. Negative wins over everything: "this sounds interesting but please
      unsubscribe me" is a no.
    - INTEREST_WORDS, with no refusal present, make it positive
    - anything else is neutral
    - an empty reply is neutral, not positive

    Lean towards negative when unsure. A false positive costs you one
    prospect; a false negative costs you a complaint and deserves to.
    """
    raise NotImplementedError("classify_reply")


def apply_reply(
    email: str, text: str, suppression: set[str]
) -> tuple[str, set[str], bool]:
    """Handle one reply. Returns (classification, suppression, route_to_human).

    TODO (milestone 4)

    - classify it
    - a negative reply adds the address to suppression **permanently**, as a
      normalised lowercase address so the next match cannot miss it
    - every reply routes to a human: that is the third item in the tuple, and
      it is True for all three classifications. A reply is a person talking to
      you.
    - this function never produces a message. No automated message ever
      follows a reply — not an acknowledgement, not a "sorry to see you go".
      That is an acceptance criterion and it is also just manners.

    Return the suppression set, so the caller can persist it.
    """
    raise NotImplementedError("apply_reply")


# ---------------------------------------------------------------------------
# Given to you below this line
# ---------------------------------------------------------------------------

DEFAULT_TEMPLATE = (
    "Hello {name},\n\n"
    "I saw {hook} ({source}).\n\n"
    "I help {company} sort out exactly that kind of thing. Worth a short "
    "conversation?\n\n"
    "If not, reply with 'stop' and you will not hear from me again."
)


def load_campaign(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def load_suppression(path: Path = SUPPRESSION_PATH) -> set[str]:
    if not path.exists():
        return set()
    return {
        line.strip().lower()
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    }


def save_suppression(suppression: set[str], path: Path = SUPPRESSION_PATH) -> None:
    """Append-only in spirit: this file only ever grows."""
    nl = chr(10)
    path.write_text(nl.join(sorted(suppression)) + nl, encoding="utf-8")


def append_log(outcomes: list[Outcome]) -> None:
    with LOG_PATH.open("a", encoding="utf-8") as handle:
        for outcome in outcomes:
            handle.write(json.dumps(outcome.__dict__) + "\n")
            handle.flush()


def run_cycle(
    campaign: Campaign,
    recipients: list[Recipient],
    research: dict[str, Research],
    contacts: dict[str, Contact],
    caps: Caps,
    suppression: set[str],
    today: date,
    template: str = DEFAULT_TEMPLATE,
) -> list[Outcome]:
    """One cycle. Drafts only — nothing here sends anything, ever."""
    outcomes: list[Outcome] = []

    for recipient in recipients:
        contact = contacts.get(recipient.id, Contact(recipient_id=recipient.id))
        allowed, reason = may_draft(
            campaign, recipient, contact, caps, suppression, today
        )
        if not allowed:
            action = "paused" if campaign.kill_switch or campaign.state == PAUSED else "skip"
            outcomes.append(Outcome(recipient.id, action, reason))
            continue

        body = draft_for(recipient, research.get(recipient.id, Research()), template)
        if body is None:
            outcomes.append(
                Outcome(recipient.id, "skip", "no genuine hook; not contacting")
            )
            continue

        outcomes.append(Outcome(recipient.id, "draft", "", body))
        campaign.sent_today += 1

    append_log(outcomes)
    return outcomes


def main() -> int:
    parser = argparse.ArgumentParser(description="Herald")
    parser.add_argument("--campaign", default="campaign.example.json")
    parser.add_argument("--kill", action="store_true", help="pull the kill switch")
    parser.add_argument("--today", default=date.today().isoformat())
    args = parser.parse_args()

    data = load_campaign(Path(args.campaign))
    recipients = [Recipient(**item) for item in data["recipients"]]
    research = {
        key: Research(**value) for key, value in data.get("research", {}).items()
    }
    contacts = {
        key: Contact(recipient_id=key, **value)
        for key, value in data.get("contacts", {}).items()
    }
    suppression = load_suppression() | {
        item.strip().lower() for item in data.get("suppression", [])
    }

    campaign = Campaign(kill_switch=args.kill)
    outcomes = run_cycle(
        campaign, recipients, research, contacts, Caps(),
        suppression, date.fromisoformat(args.today),
    )

    for outcome in outcomes:
        line = f"{outcome.action:<8} {outcome.recipient_id:<10}"
        if outcome.reason:
            line += f"  {outcome.reason}"
        print(line)

    drafted = sum(1 for item in outcomes if item.action == "draft")
    print(f"\ndrafted {drafted}, sent 0")
    print("Run again with --kill. Everything must report paused, and nothing")
    print("may be drafted. That is the switch you will one day need in a hurry.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
