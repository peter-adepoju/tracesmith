"""
Watchman — an uptime and API health monitor that never cries wolf.

Standard library only. Run it with:

    python -I watchman.py --config config.json

Four functions are left for you. They are marked TODO and currently raise
NotImplementedError, so `python -I verify.py` fails until you write them.
Everything else — config loading, the run loop, the log file — is done, because
boilerplate is not what this project is teaching.

The design detail worth noticing: `check_target` takes `fetch` and `sleep` as
arguments rather than calling urllib and time.sleep directly. That is what lets
the verifier test your retry logic in milliseconds without touching the
network, and it is the same trick that makes real systems testable.
"""

from __future__ import annotations

import argparse
import json
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Callable, Literal

Status = Literal["OK", "DEGRADED", "FAILED", "PAUSED", "NOTHING_TO_DO"]

LOG_PATH = Path("run-log.jsonl")


@dataclass
class Target:
    name: str
    url: str
    budget_ms: int = 1000
    retries: int = 2
    paused: bool = False


@dataclass
class CheckResult:
    target: str
    status: Status
    latency_ms: int
    attempts: int
    detail: str


@dataclass
class Response:
    """What a fetch returns. `error` is set instead of `status` on failure."""

    status: int | None
    latency_ms: int
    error: str | None = None


# ---------------------------------------------------------------------------
# Milestone 1 — classify one result
# ---------------------------------------------------------------------------

def classify(response: Response, budget_ms: int) -> Status:
    """Turn one response into a status.

    TODO (milestone 1)

    The rules you are implementing:
      - a 2xx inside the budget is OK
      - a 2xx that took longer than the budget is DEGRADED
      - a 5xx, a timeout or a connection error is FAILED
      - a 4xx is your call: decide, implement it, and write down in the README
        why you chose what you chose. There is a defensible argument both ways
        and having to justify it is the point.
    """
    raise NotImplementedError("classify")


# ---------------------------------------------------------------------------
# Milestone 2 — retry, then give up honestly
# ---------------------------------------------------------------------------

def check_target(
    target: Target,
    fetch: Callable[[str], Response],
    sleep: Callable[[float], None] = time.sleep,
) -> CheckResult:
    """Check one target, retrying a failure with increasing backoff.

    TODO (milestone 2)

    What this must do:
      - if the target is paused, return PAUSED immediately without fetching
      - call `fetch(target.url)` and classify the result
      - on FAILED, retry up to `target.retries` more times
      - wait longer between each attempt, using `sleep`
      - stop early the moment a check succeeds
      - report the final status, and how many attempts it actually took

    Use the injected `fetch` and `sleep`. Calling urllib or time.sleep directly
    here is the one way to make this untestable.
    """
    raise NotImplementedError("check_target")


# ---------------------------------------------------------------------------
# Milestone 4 — alerts that stay useful
# ---------------------------------------------------------------------------

def should_alert(previous: Status | None, current: Status) -> bool:
    """Decide whether this transition deserves a message.

    TODO (milestone 4)

    An outage lasting four hours must produce one message, not two hundred.
      - the first transition into FAILED alerts
      - FAILED following FAILED does not
      - returning to OK after FAILED alerts, because recovery is news
      - PAUSED never alerts
      - think about what DEGRADED should do, and justify it in the README
    """
    raise NotImplementedError("should_alert")


# ---------------------------------------------------------------------------
# Milestone 5 — the heartbeat
# ---------------------------------------------------------------------------

def is_stale(last_run_epoch: float | None, expected_every_s: int, now: float) -> bool:
    """Has Watchman itself failed to run inside its expected window?

    TODO (milestone 5)

    A monitor that silently stops is worse than no monitor, because you believe
    everything is fine. Never having run counts as stale.
    """
    raise NotImplementedError("is_stale")


# ---------------------------------------------------------------------------
# Given to you below this line
# ---------------------------------------------------------------------------

def real_fetch(url: str, timeout_s: float = 10.0) -> Response:
    """Fetch a URL and time it. Never raises; failures come back as Response."""
    started = time.perf_counter()
    try:
        request = urllib.request.Request(url, headers={"User-Agent": "Watchman/1.0"})
        with urllib.request.urlopen(request, timeout=timeout_s) as response:
            response.read(2048)
            elapsed = int((time.perf_counter() - started) * 1000)
            return Response(status=response.status, latency_ms=elapsed)
    except urllib.error.HTTPError as exc:
        elapsed = int((time.perf_counter() - started) * 1000)
        return Response(status=exc.code, latency_ms=elapsed)
    except Exception as exc:
        elapsed = int((time.perf_counter() - started) * 1000)
        return Response(status=None, latency_ms=elapsed, error=type(exc).__name__)


def load_config(path: Path) -> list[Target]:
    data = json.loads(path.read_text(encoding="utf-8"))
    return [Target(**item) for item in data["targets"]]


def append_log(results: list[CheckResult]) -> None:
    """One JSON object per line. Append only, flushed per row."""
    stamp = time.strftime("%Y-%m-%dT%H:%M:%S%z")
    with LOG_PATH.open("a", encoding="utf-8") as handle:
        for result in results:
            handle.write(json.dumps({"at": stamp, **asdict(result)}) + "\n")
            handle.flush()


def read_previous() -> dict[str, Status]:
    """The last status seen per target, for alert de-duplication."""
    if not LOG_PATH.exists():
        return {}
    previous: dict[str, Status] = {}
    for line in LOG_PATH.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            row = json.loads(line)
        except json.JSONDecodeError:
            continue
        previous[row["target"]] = row["status"]
    return previous


def run(targets: list[Target], fetch: Callable[[str], Response] = real_fetch) -> list[CheckResult]:
    previous = read_previous()
    results = [check_target(target, fetch) for target in targets]
    append_log(results)

    for result in results:
        if should_alert(previous.get(result.target), result.status):
            # TODO (milestone 4): send this somewhere real — Slack, email, both.
            # Printing is fine while you build; it is not fine when you finish.
            print(f"ALERT  {result.target}: {result.status} — {result.detail}")
    return results


def main() -> int:
    parser = argparse.ArgumentParser(description="Watchman")
    parser.add_argument("--config", default="config.json")
    args = parser.parse_args()

    targets = load_config(Path(args.config))
    results = run(targets)

    for result in results:
        print(
            f"{result.status:<14} {result.target:<24} "
            f"{result.latency_ms:>6}ms  attempts={result.attempts}"
        )
    return 0 if all(r.status != "FAILED" for r in results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
