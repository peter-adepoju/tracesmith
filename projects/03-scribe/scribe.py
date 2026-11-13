"""
Scribe — turn messy text into structured data you can actually trust.

Standard library only. Run it with:

    python -I scribe.py --doc samples/invoice-01.txt

Five functions are left for you. They are marked TODO and currently raise
NotImplementedError, so `python -I verify.py` fails until you write them.

The discipline this project teaches, in one sentence: a model's output is
untrusted input until something has validated it. Everybody nods at that and
then ships `json.loads(response)` straight into a database.

`extract` takes `call_model` as an argument rather than calling an API
directly. That is what lets the verifier test your retry and validation logic
in milliseconds, with no key and no spend — and it is also what will let you
swap models later without rewriting anything. Same trick as Watchman's
`fetch`.

The evaluation set comes first, in `evalset.json`, before you write a prompt.
That ordering is not bureaucracy: a prompt written first becomes the thing you
score against, and you will mark your own homework every time.
"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Iterable

EVALSET_PATH = Path("evalset.json")

# A field is declared with a type and whether it may be missing. Keep the
# schema here, in code, not in the prompt: the prompt asks, the schema decides.
SCHEMA: dict[str, dict[str, Any]] = {
    "invoice_no": {"type": "string", "required": True},
    "supplier": {"type": "string", "required": True},
    "total_minor": {"type": "integer", "required": True},
    "currency": {"type": "string", "required": True, "choices": ["NGN", "USD", "GBP", "EUR"]},
    "issued_on": {"type": "date", "required": True},
    "po_number": {"type": "string", "required": False},
}

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


class ExtractionError(RuntimeError):
    """Raised when output could not be made to fit the schema. Fail loudly."""


@dataclass
class Extraction:
    data: dict[str, Any]
    confidence: dict[str, float] = field(default_factory=dict)
    attempts: int = 1
    errors: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Milestone 2 — extract and validate
# ---------------------------------------------------------------------------

def validate(data: dict[str, Any], schema: dict[str, dict[str, Any]]) -> list[str]:
    """Return a list of human-readable problems. Empty means the data fits.

    TODO (milestone 2)

    What this must catch:
      - a required field that is missing entirely
      - a field whose value is the wrong type: `integer` must be a real int,
        not "1250" and not 12.5; `string` must be a str; `date` must match
        YYYY-MM-DD (DATE_RE is there for you)
      - a value outside `choices`, where the schema gives choices
      - a field the schema never declared — a model inventing an extra key is
        a signal something is wrong, not a bonus

    A required field that is present but explicitly null is NOT an error here.
    That is the model saying "I do not know", which is exactly the behaviour
    milestone 3 wants. Missing and null are different things, and conflating
    them is how you end up with fabricated data.

    The messages are read by a human at 2am. Say which field and what was
    wrong with it.
    """
    raise NotImplementedError("validate")


def extract(
    document: str,
    call_model: Callable[[str], str],
    schema: dict[str, dict[str, Any]] = SCHEMA,
    max_retries: int = 1,
) -> Extraction:
    """Ask the model for structured data, and refuse it if it does not fit.

    TODO (milestone 2)

    The loop you are implementing:
      - build a prompt with `build_prompt` and call `call_model`
      - parse the reply as JSON; a reply that is not JSON at all is a failure
        like any other, not a crash
      - validate the parsed object against the schema
      - if it does not fit, retry up to `max_retries` more times, and put the
        actual error messages into the next prompt. A retry that asks the same
        question the same way is just a slower failure.
      - when the retries run out, raise ExtractionError with the last errors.
        Do not return the bad data with a warning; nothing downstream should
        ever see output that did not validate.
      - record how many attempts it took, so you can see later how often the
        first try is wrong

    Confidence, if the model supplied it, lives under `_confidence`. Pull it
    out before validating — it is metadata about the answer, not part of it.
    """
    raise NotImplementedError("extract")


# ---------------------------------------------------------------------------
# Milestone 3 — know what you do not know
# ---------------------------------------------------------------------------

def needs_review(extraction: Extraction, threshold: float = 0.8) -> bool:
    """Should a human look at this before anything uses it?

    TODO (milestone 3)

    Route it to a person when:
      - any required field came back null — the model said it did not know,
        and guessing on its behalf is the exact failure this project exists
        to prevent
      - any field's confidence is below `threshold`
      - a field has no confidence score at all and the schema says it is
        required: absent is not the same as high

    An optional field being null is fine and must not trigger review, or
    everything goes to review and the queue becomes noise nobody reads.
    """
    raise NotImplementedError("needs_review")


# ---------------------------------------------------------------------------
# Milestone 1 and 4 — measure it
# ---------------------------------------------------------------------------

def per_field_accuracy(
    expected: Iterable[dict[str, Any]], actual: Iterable[dict[str, Any]]
) -> dict[str, float]:
    """Accuracy per field across the evaluation set, from 0.0 to 1.0.

    TODO (milestone 1)

    - compare field by field, not record by record: "87% of documents were
      perfect" hides which field is broken, and one bad field is usually the
      whole problem
    - a field the extraction missed entirely counts as wrong, not as absent
    - compare values, not formatting: "NGN" and "ngn" are the same answer, and
      marking that wrong will send you optimising the wrong thing
    - an empty evaluation set returns an empty dict rather than dividing by
      zero
    """
    raise NotImplementedError("per_field_accuracy")


def cost_per_document(
    tokens_in: int, tokens_out: int, price_in_per_1k: float, price_out_per_1k: float
) -> float:
    """What one document costs to process, in whatever currency the prices are.

    TODO (milestone 4)

    Unglamorous and the reason a pilot dies at scale: 40,000 documents a month
    at a price nobody measured. Round to something you would put in a quote.
    """
    raise NotImplementedError("cost_per_document")


# ---------------------------------------------------------------------------
# Given to you below this line
# ---------------------------------------------------------------------------

def build_prompt(
    document: str, schema: dict[str, dict[str, Any]], errors: list[str] | None = None
) -> str:
    """A prompt written as a specification: role, input, rules, output shape."""
    fields = "\n".join(
        f"  - {name}: {spec['type']}"
        f"{' (required)' if spec.get('required') else ' (optional, null if absent)'}"
        f"{' one of ' + ', '.join(spec['choices']) if spec.get('choices') else ''}"
        for name, spec in schema.items()
    )
    retry = ""
    if errors:
        retry = (
            "\nYour previous answer was rejected for these reasons. "
            "Fix exactly these and change nothing else:\n"
            + "\n".join(f"  - {e}" for e in errors)
            + "\n"
        )
    return f"""You extract fields from supplier invoices.

Return ONLY a JSON object. No prose, no code fence.

Fields:
{fields}

Rules:
  - Use null for any field you cannot find. Never invent a value.
  - total_minor is an integer in minor units: 1250.50 becomes 125050.
  - issued_on is YYYY-MM-DD.
  - Add "_confidence": an object mapping each field to a number from 0 to 1.
{retry}
Invoice:
---
{document}
---"""


def parse_json_object(reply: str) -> dict[str, Any]:
    """Pull a JSON object out of a reply, tolerating a code fence around it."""
    text = reply.strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
        text = re.sub(r"\n?```$", "", text).strip()
    data = json.loads(text)
    if not isinstance(data, dict):
        raise ValueError(f"expected a JSON object, got {type(data).__name__}")
    return data


def load_evalset(path: Path = EVALSET_PATH) -> list[dict[str, Any]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    return data["examples"]


def echo_model(prompt: str) -> str:
    """A stand-in model, so the scaffold runs before you have an API key.

    It is deliberately bad: it returns a fixed answer regardless of the
    invoice. Replace it with a real call, and watch the accuracy number you
    built in milestone 1 finally mean something.
    """
    del prompt
    return json.dumps(
        {
            "invoice_no": "INV-0001",
            "supplier": "Unknown Supplier Ltd",
            "total_minor": 0,
            "currency": "NGN",
            "issued_on": "2026-01-01",
            "po_number": None,
            "_confidence": {
                "invoice_no": 0.2,
                "supplier": 0.2,
                "total_minor": 0.1,
                "currency": 0.5,
                "issued_on": 0.2,
                "po_number": 0.9,
            },
        }
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Scribe")
    parser.add_argument("--doc", help="a text file holding one invoice")
    parser.add_argument("--evalset", action="store_true", help="score the evaluation set")
    args = parser.parse_args()

    if args.evalset:
        examples = load_evalset()
        actual = []
        for example in examples:
            try:
                actual.append(extract(example["input"], echo_model).data)
            except ExtractionError as exc:
                print(f"  extraction failed: {exc}")
                actual.append({})
        scores = per_field_accuracy([e["expected"] for e in examples], actual)
        for name, score in sorted(scores.items()):
            print(f"  {name:<14} {score:6.1%}")
        print("\n  That is the stand-in model. Plug in a real one and run it again.")
        return 0

    if not args.doc:
        parser.error("give --doc or --evalset")

    document = Path(args.doc).read_text(encoding="utf-8")
    result = extract(document, echo_model)
    print(json.dumps(result.data, indent=2))
    print(f"\nattempts={result.attempts}")
    print(f"needs_review={needs_review(result)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
