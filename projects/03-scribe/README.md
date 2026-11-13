# Scribe

Turn messy text into structured data you can actually trust.

Standard library only. No API key needed to start, and none needed to pass the
verifier — every test injects a fake model.

```bash
cd projects/03-scribe
python -I verify.py
```

That fails at first. Twenty-eight acceptance criteria are waiting for five
functions in `scribe.py`, each marked `TODO` with the rules it has to satisfy.

## Do milestone 1 first, properly

`evalset.json` ships with three worked examples to show the shape. Milestone 1
is getting it to **twenty, before you write a prompt**, with at least four
deliberately awkward ones — a missing field, an odd format, two plausible
readings, a number that looks like the answer and is not.

The verifier checks your scoring script. It does **not** check that you wrote
twenty examples, because it cannot check the thing that matters: whether they
are honest. Eighteen easy examples and a 97% score fools nobody but you.

Write the eval set first and the prompt second. Do it the other way round and
the prompt becomes the thing you score against.

## Run it

```bash
python -I scribe.py --doc samples/invoice-01.txt
python -I scribe.py --evalset
```

Both use `echo_model`, a stand-in that returns the same wrong answer for every
document. That is on purpose: it gives you a working pipeline and a terrible
score, so the accuracy number means something the moment you plug a real model
in. Replace `echo_model` with a real call and run `--evalset` again.

## What the verifier does and does not tell you

It checks behaviour against the acceptance criteria on the project page. It
cannot check:

- Your accuracy on a held-out set with a real model, per field.
- What one document actually costs, and what 40,000 a month would cost.
- Whether a human ever looks at the review queue. A flag nobody reads is the
  same as no flag.

## Write these down here as you go

**Which field is your worst, and why.** Per-field accuracy exists so you can
answer this. Usually it is dates or totals, and usually for a reason you can
fix with code rather than a better prompt.

**What you replaced with code.** Milestone 4 asks for at least one step moved
from the model to a regular expression or a lookup, with accuracy unchanged.
Say which, and what it saved.

**What happens when the model is confidently wrong.** Low confidence routes to
review. High confidence and wrong does not. What catches that?

<!-- your notes -->
