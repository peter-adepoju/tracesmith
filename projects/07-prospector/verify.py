"""
Verifier for Prospector.

    python -I verify.py

Checks behaviour against the acceptance criteria on the project page. There is
no network and no model: the agent's decisions are a scripted list and every
source resolves through an injected function. One test gives the agent a
fabricated URL; another tries to write outside the scratch directory; a third
makes it loop on purpose.

It checks that your code works, not that it is good. Passing is necessary and
not sufficient; the definition of done on the project page is the rest —
starting with milestone 1, which is an argument you write, not code.
"""

from __future__ import annotations

import sys
import tempfile
from pathlib import Path

# Windows consoles default to cp1252 and will mangle anything outside it.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except AttributeError:
        pass

sys.path.insert(0, str(Path(__file__).parent))

import prospector as P  # noqa: E402

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


SCRATCH = Path(tempfile.mkdtemp(prefix="prospector-verify-"))


def tools_for(scratch: Path) -> dict[str, P.Tool]:
    return P.build_tools(P.canned_corpus(), scratch)


def expect_tool_error(action: P.Action, tools, scratch, why: str) -> None:
    try:
        result = P.call_tool(action, tools, scratch)
    except NotImplementedError:
        raise
    except P.ToolError:
        return
    raise AssertionError(f"{why} — it returned {result!r} instead of refusing")


def resolves_example(url: str) -> bool:
    return url.startswith("https://example.test/")


# --- Milestone 3: budgets -------------------------------------------------

@check(3, "a fresh budget allows a call")
def _() -> None:
    allowed, _why = P.check_budget(P.Budget())
    assert allowed is True


@check(3, "the step cap stops the call that would exceed it")
def _() -> None:
    allowed, why = P.check_budget(P.Budget(max_steps=8, steps_used=8))
    assert allowed is False, (
        "eight calls have happened and the ninth was allowed — use >=, not >"
    )
    assert why, "no reason given"


@check(3, "the reason names the cap that was hit")
def _() -> None:
    _allowed, why = P.check_budget(P.Budget(max_steps=8, steps_used=8))
    assert "step" in why.lower(), f"the reason does not say which cap: {why!r}"


@check(3, "the time cap is enforced")
def _() -> None:
    allowed, why = P.check_budget(P.Budget(max_seconds=60, seconds_used=61))
    assert allowed is False, "the time cap was ignored"
    assert "time" in why.lower() or "second" in why.lower(), why


@check(3, "the cost cap is enforced")
def _() -> None:
    allowed, why = P.check_budget(P.Budget(max_cost=0.5, cost_used=0.5))
    assert allowed is False, "the cost cap was ignored"
    assert "cost" in why.lower(), why


@check(3, "three identical actions in a row is a loop")
def _() -> None:
    same = [P.Action("search", {"query": "x"}) for _ in range(3)]
    assert P.detect_loop(same, window=3) is True


@check(3, "the same tool with different arguments is not a loop")
def _() -> None:
    varied = [P.Action("search", {"query": value}) for value in ("a", "b", "c")]
    assert P.detect_loop(varied, window=3) is False, "that is research, not a loop"


@check(3, "too little history is not a loop")
def _() -> None:
    assert P.detect_loop([P.Action("search", {"query": "x"})], window=3) is False


@check(3, "only the most recent actions count")
def _() -> None:
    history = [P.Action("search", {"query": "old"})] + [
        P.Action("search", {"query": "x"}) for _ in range(3)
    ]
    assert P.detect_loop(history, window=3) is True


# --- Milestone 2: tools ---------------------------------------------------

@check(2, "a well-formed tool call runs")
def _() -> None:
    tools = tools_for(SCRATCH)
    result = P.call_tool(P.Action("search", {"query": "suppliers"}), tools, SCRATCH)
    assert result, "the search tool returned nothing for a known query"


@check(2, "an unknown tool is refused")
def _() -> None:
    expect_tool_error(
        P.Action("rm_rf", {"path": "/"}), tools_for(SCRATCH), SCRATCH,
        "the model invented a tool name and it was run",
    )


@check(2, "a missing required argument is refused")
def _() -> None:
    expect_tool_error(
        P.Action("search", {}), tools_for(SCRATCH), SCRATCH,
        "a tool ran without its required argument",
    )


@check(2, "a credential in the arguments is refused")
def _() -> None:
    expect_tool_error(
        P.Action("search", {"query": "x", "api_key": "sk-live-123"}),
        tools_for(SCRATCH), SCRATCH,
        "an API key reached a tool call; the agent gets tools, never credentials",
    )


@check(2, "a path escaping the scratch area is refused")
def _() -> None:
    expect_tool_error(
        P.Action("note", {"path": "../../escaped.txt", "text": "nope"}),
        tools_for(SCRATCH), SCRATCH,
        "a write escaped the scratch directory",
    )


@check(2, "an absolute path outside scratch is refused")
def _() -> None:
    outside = str(Path(tempfile.gettempdir()) / "prospector-escape.txt")
    expect_tool_error(
        P.Action("note", {"path": outside, "text": "nope"}),
        tools_for(SCRATCH), SCRATCH,
        "an absolute path outside scratch was written",
    )


@check(2, "a write inside the scratch area is allowed")
def _() -> None:
    tools = tools_for(SCRATCH)
    result = P.call_tool(
        P.Action("note", {"path": "findings.md", "text": "hello"}), tools, SCRATCH
    )
    assert result, "a legitimate write was refused"


# --- Milestone 4: citations -----------------------------------------------

@check(4, "a claim with a resolvable source is kept")
def _() -> None:
    kept, dropped = P.verify_citations(
        [P.Claim("Mills exist.", "https://example.test/mills")], resolves_example
    )
    assert len(kept) == 1, f"kept={len(kept)}"
    assert dropped == [], dropped


@check(4, "a claim with no source is dropped")
def _() -> None:
    kept, dropped = P.verify_citations([P.Claim("Trust me.", None)], resolves_example)
    assert kept == [], "an uncited claim was kept; an uncited claim is a defect"
    assert len(dropped) == 1, dropped


@check(4, "a claim with an empty source is dropped")
def _() -> None:
    kept, _dropped = P.verify_citations([P.Claim("Trust me.", "   ")], resolves_example)
    assert kept == [], "whitespace is not a citation"


@check(4, "a fabricated source is caught")
def _() -> None:
    kept, dropped = P.verify_citations(
        [P.Claim("Plausible.", "https://totally-real.test/report-2026")], resolves_example
    )
    assert kept == [], (
        "a source that does not resolve was accepted. A model citing a "
        "plausible page that does not exist is the failure that makes "
        "research agents worthless"
    )
    assert len(dropped) == 1, dropped


# --- Milestones 3 and 4: the loop together --------------------------------

@check(3, "a finished agent completes and says so")
def _() -> None:
    report = P.run_agent(
        "topic",
        P.scripted_agent([P.Action("search", {"query": "suppliers"})]),
        tools_for(SCRATCH),
        P.Budget(max_steps=8),
        SCRATCH,
        resolves_example,
    )
    assert report.complete is True, f"stopped_because={report.stopped_because!r}"
    assert report.claims, "the search produced claims and none reached the report"


@check(3, "hitting the step cap gives a partial result, not an exception")
def _() -> None:
    plan = [P.Action("search", {"query": "suppliers"}) for _ in range(10)]
    report = P.run_agent(
        "topic", P.scripted_agent(plan), tools_for(SCRATCH),
        P.Budget(max_steps=2), SCRATCH, resolves_example,
    )
    assert report.complete is False, "a run stopped by a cap claimed to be complete"
    assert report.stopped_because, "it stopped silently, with no reason recorded"
    assert report.claims, "the work done before the cap was thrown away"


@check(3, "a deliberate loop is caught and stopped")
def _() -> None:
    plan = [P.Action("search", {"query": "suppliers"}) for _ in range(8)]
    report = P.run_agent(
        "topic", P.scripted_agent(plan), tools_for(SCRATCH),
        P.Budget(max_steps=8), SCRATCH, resolves_example,
    )
    assert report.complete is False, "the agent looped and reported success"
    assert "loop" in report.stopped_because.lower(), (
        f"stopped for {report.stopped_because!r}, which does not mention a loop"
    )


@check(3, "a failing tool call does not lose the work already done")
def _() -> None:
    plan = [
        P.Action("search", {"query": "suppliers"}),
        P.Action("nonexistent", {}),
        P.Action("search", {"query": "pricing"}),
    ]
    report = P.run_agent(
        "topic", P.scripted_agent(plan), tools_for(SCRATCH),
        P.Budget(max_steps=8), SCRATCH, resolves_example,
    )
    assert len(report.claims) >= 3, (
        f"{len(report.claims)} claims — one bad tool call cost the whole run"
    )


@check(4, "the report states what it could not establish")
def _() -> None:
    plan = [P.Action("summarise", {"text": "An uncited thought."})]
    report = P.run_agent(
        "topic", P.scripted_agent(plan), tools_for(SCRATCH),
        P.Budget(max_steps=8), SCRATCH, resolves_example,
    )
    assert report.unestablished, (
        "an uncited claim was produced and the report does not mention it"
    )
    assert not report.claims, "an uncited claim reached the body of the report"


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
        print("  Milestone 1 is an argument, not code. Have you written it?")

    return 1 if FAILED or SKIPPED else 0


if __name__ == "__main__":
    raise SystemExit(main())
