"""
Prospector — your first real agent: it researches, follows evidence, and cites
everything.

Standard library only. Run it with:

    python -I prospector.py --topic "waxed cotton suppliers in Lagos"

Five functions are left for you. They are marked TODO and currently raise
NotImplementedError, so `python -I verify.py` fails until you write them.

This is the first project where the steps genuinely cannot be written in
advance, which is the only honest reason to use an agent. Milestone 1 is
writing that argument down. If you cannot make it, build the workflow instead
— that is a pass, not a failure.

Three things separate an agent you can run unattended from one you cannot:

  Budgets enforced in code. Not asked for in the prompt. A prompt that says
  "use at most five searches" is a suggestion; `check_budget` is a rule.

  Tools with narrow hands. The model names a tool and passes arguments. It
  never sees a credential, never names a path, never gets a shell.

  Citations or nothing. An uncited claim is a defect, not a rough edge. A
  fabricated source is the failure mode that makes research agents worthless,
  and it is caught here by resolving every source before the claim ships.

Everything that reaches the outside world is injected, so the verifier runs
the whole agent in milliseconds with no network and no spend.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

REPORT_PATH = Path("report.md")

# Argument names that must never appear in a tool call. The model has no
# business holding any of these, and seeing one means something upstream
# leaked a secret into its context.
FORBIDDEN_ARGS = {"api_key", "apikey", "token", "secret", "password", "authorization", "cookie"}


class ToolError(RuntimeError):
    """A tool call that must not proceed. Refuse, do not improvise."""


@dataclass
class Budget:
    """Hard caps. Checked before every model call, never after."""

    max_steps: int = 8
    max_seconds: float = 60.0
    max_cost: float = 0.50
    steps_used: int = 0
    seconds_used: float = 0.0
    cost_used: float = 0.0


@dataclass
class Tool:
    """One narrow capability."""

    name: str
    required: tuple[str, ...]
    run: Callable[..., Any]
    writes_to_scratch: bool = False


@dataclass
class Action:
    tool: str
    arguments: dict[str, Any]


@dataclass
class Claim:
    text: str
    source: str | None = None


@dataclass
class Report:
    topic: str
    claims: list[Claim] = field(default_factory=list)
    dropped: list[Claim] = field(default_factory=list)
    unestablished: list[str] = field(default_factory=list)
    stopped_because: str = ""
    complete: bool = False


# ---------------------------------------------------------------------------
# Milestone 3 — bounds that hold
# ---------------------------------------------------------------------------

def check_budget(budget: Budget) -> tuple[bool, str]:
    """May the agent make another call? And if not, why not?

    TODO (milestone 3)

    Return (True, "") or (False, reason).

    - no more calls once `steps_used` has reached `max_steps`
    - nor once `seconds_used` has reached `max_seconds`
    - nor once `cost_used` has reached `max_cost`
    - the reason must say which cap was hit and what the numbers were. A run
      that stops with "budget exceeded" tells you nothing on a Monday morning.

    Use >=, not >. A budget of eight steps means eight calls happened, and the
    ninth must not. Off by one here costs real money.

    This is called BEFORE each call, which is the whole point. Checking after
    means the call you could not afford has already been made.
    """
    raise NotImplementedError("check_budget")


def detect_loop(history: list[Action], window: int = 3) -> bool:
    """Has the agent started going in circles?

    TODO (milestone 3)

    - True when the last `window` actions are all the same tool with the same
      arguments. An agent re-reading the same page four times has stopped
      making progress and is spending your money to do it.
    - False when there is not yet enough history to tell
    - the same tool with *different* arguments is not a loop; that is
      research.

    Compare arguments by value. Two dicts with the same contents are the same
    call however they were built.
    """
    raise NotImplementedError("detect_loop")


# ---------------------------------------------------------------------------
# Milestone 2 — tools with narrow hands
# ---------------------------------------------------------------------------

def call_tool(
    action: Action, tools: dict[str, Tool], scratch: Path
) -> Any:
    """Run one tool call, refusing anything that is not clearly safe.

    TODO (milestone 2)

    Refuse, by raising ToolError, when:
      - the tool is not in `tools`. The model inventing a tool name is not a
        prompt to improvise one.
      - a required argument is missing
      - any argument name is in FORBIDDEN_ARGS. The agent gets tools, never
        credentials; a key appearing in its arguments means one leaked.
      - the tool writes to scratch and the `path` argument escapes it. Resolve
        the path and check it is inside `scratch` — "../../.ssh/id_rsa" is the
        classic, and string prefix checks do not catch it.

    Otherwise call `tool.run(**action.arguments)` and return what it gives.

    Every refusal is a ToolError with a message a human can act on. Never
    return a silent None: the caller cannot tell that from a tool that
    genuinely found nothing.
    """
    raise NotImplementedError("call_tool")


# ---------------------------------------------------------------------------
# Milestone 4 — citations or nothing
# ---------------------------------------------------------------------------

def verify_citations(
    claims: list[Claim], resolve: Callable[[str], bool]
) -> tuple[list[Claim], list[Claim]]:
    """Separate the claims you can stand behind from the ones you cannot.

    TODO (milestone 4)

    Return (kept, dropped).

    - a claim with no source, or an empty one, is dropped
    - a claim whose source does not resolve is dropped. `resolve` is injected
      so the verifier can hand you a fabricated URL; a model citing a
      plausible-looking page that does not exist is the single failure that
      makes research agents worthless, and this is where it is caught.
    - everything else is kept

    Dropped claims are returned, not discarded: the report says what it could
    not establish, and that section is often the most useful part.
    """
    raise NotImplementedError("verify_citations")


# ---------------------------------------------------------------------------
# Milestone 3 and 4 — the loop, with its stop conditions
# ---------------------------------------------------------------------------

def run_agent(
    topic: str,
    decide: Callable[[str, list[Action]], Action | None],
    tools: dict[str, Tool],
    budget: Budget,
    scratch: Path,
    resolve: Callable[[str], bool],
    cost_per_step: float = 0.01,
) -> Report:
    """Run the agent until it finishes or runs out of room.

    TODO (milestones 3 and 4)

    Each turn, in this order:
      1. check the budget. If it is spent, stop and record why, with whatever
         has been gathered so far — a partial result that says it is partial,
         never a silent failure and never an exception.
      2. check for a loop with `detect_loop`. If it is looping, stop and say
         so.
      3. ask `decide(topic, history)` for the next action. None means the
         agent considers itself finished: stop, and mark the report complete.
      4. run it with `call_tool`. A ToolError is recorded and the run
         continues — one bad tool call is not a reason to lose the work.
      5. charge the budget: one step, and `cost_per_step`.

    A tool returning a Claim, or a list of them, adds to the report.

    At the end, run every claim through `verify_citations` and fill in
    `claims`, `dropped` and `unestablished` (the text of each dropped claim).

    `complete` is True only when the agent stopped because it was finished.
    Stopping on a cap or a loop is not completion, and a report that says
    otherwise is lying to whoever reads it.
    """
    raise NotImplementedError("run_agent")


# ---------------------------------------------------------------------------
# Given to you below this line
# ---------------------------------------------------------------------------

def render_report(report: Report) -> str:
    """The report, as Markdown, with its limits stated at the bottom."""
    nl = chr(10)
    lines = [f"# {report.topic}", ""]

    if report.claims:
        lines += ["## What we established", ""]
        for claim in report.claims:
            lines.append(f"- {claim.text}  <{claim.source}>")
    else:
        lines += ["## What we established", "", "Nothing that could be sourced."]

    lines += ["", "## What we could not establish", ""]
    if report.unestablished:
        for text in report.unestablished:
            lines.append(f"- {text}")
    else:
        lines.append("Every claim gathered carried a source that resolved.")

    lines += ["", "## How this run ended", ""]
    lines.append(
        "Finished." if report.complete else f"Stopped early: {report.stopped_because}"
    )
    lines += ["", "This is a draft. Nothing here has been sent anywhere.", ""]
    return nl.join(lines)


def make_scratch(root: Path | None = None) -> Path:
    scratch = (root or Path.cwd()) / "scratch"
    scratch.mkdir(exist_ok=True)
    return scratch


def canned_corpus() -> dict[str, list[tuple[str, str]]]:
    """A tiny offline 'web', so the scaffold runs with no network.

    Maps a query to (claim text, source url). Replace with a real search tool
    when the loop and the budgets behave.
    """
    return {
        "suppliers": [
            ("Waxed cotton is milled in Lagos by two named mills.", "https://example.test/mills"),
            ("Minimum order quantities start near 200 metres.", "https://example.test/moq"),
        ],
        "pricing": [
            ("Mill-direct pricing is quoted per metre, not per roll.", "https://example.test/pricing"),
        ],
    }


def build_tools(corpus: dict[str, list[tuple[str, str]]], scratch: Path) -> dict[str, Tool]:
    """Three narrow tools. None of them holds a credential."""

    def search(query: str) -> list[Claim]:
        found = corpus.get(query, [])
        return [Claim(text=text, source=source) for text, source in found]

    def note(path: str, text: str) -> str:
        target = scratch / Path(path).name
        target.write_text(text, encoding="utf-8")
        return str(target)

    def summarise(text: str) -> Claim:
        return Claim(text=text[:200], source=None)

    return {
        "search": Tool("search", ("query",), search),
        "note": Tool("note", ("path", "text"), note, writes_to_scratch=True),
        "summarise": Tool("summarise", ("text",), summarise),
    }


def scripted_agent(plan: list[Action | None]) -> Callable[[str, list[Action]], Action | None]:
    """A stand-in for a model: it follows a fixed plan, then stops.

    Replace with a real model call. The signature is what matters — it is
    handed the topic and what has happened, and returns one next action.
    """
    remaining = list(plan)

    def decide(_topic: str, _history: list[Action]) -> Action | None:
        return remaining.pop(0) if remaining else None

    return decide


def main() -> int:
    parser = argparse.ArgumentParser(description="Prospector")
    parser.add_argument("--topic", default="waxed cotton suppliers in Lagos")
    parser.add_argument("--max-steps", type=int, default=8)
    args = parser.parse_args()

    scratch = make_scratch()
    tools = build_tools(canned_corpus(), scratch)
    plan: list[Action | None] = [
        Action("search", {"query": "suppliers"}),
        Action("search", {"query": "pricing"}),
        Action("note", {"path": "findings.md", "text": "draft notes"}),
    ]

    report = run_agent(
        topic=args.topic,
        decide=scripted_agent(plan),
        tools=tools,
        budget=Budget(max_steps=args.max_steps),
        scratch=scratch,
        resolve=lambda url: url.startswith("https://example.test/"),
    )

    text = render_report(report)
    REPORT_PATH.write_text(text, encoding="utf-8")
    print(text)
    print(f"Written to {REPORT_PATH}. Steps used: {report.stopped_because or 'finished'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
