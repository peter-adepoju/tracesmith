# Prospector

Your first real agent: it researches, follows evidence, and cites everything.

Standard library only. No network, no model, no key — the agent's decisions
are injected, so the whole thing runs offline until you wire a model in.

```bash
cd projects/07-prospector
python -I verify.py
python -I prospector.py --topic "waxed cotton suppliers in Lagos"
```

Twenty-five acceptance criteria are waiting for five functions in
`prospector.py`.

## Milestone 1 is not code

Before any of this, write the argument that this task **cannot be a fixed
workflow**. Steps that can be written in advance should be written in
advance: a workflow is cheaper, faster, debuggable, and does not surprise
you at 3am.

If you cannot make the argument, build the workflow instead. That is a pass,
not a failure, and it is the most valuable thing this project can teach you.

Write it here, and write the workflow you rejected:

> **Why this is an agent:**
>
> **The fixed workflow I rejected, and why:**

## The three things that make it safe to run unattended

**Budgets enforced in code.** Not asked for in the prompt. A prompt saying
"use at most five searches" is a suggestion. `check_budget` is a rule, checked
*before* every call — checking after means the call you could not afford has
already happened.

**Tools with narrow hands.** The model names a tool and passes arguments. It
never sees a credential, never gets a shell, and cannot write outside the
scratch directory. The verifier tries `../../escaped.txt` and an absolute path;
a string prefix check does not catch either.

**Citations or nothing.** An uncited claim is a defect, not a rough edge. The
verifier hands you a fabricated URL that looks entirely plausible — a model
citing a page that does not exist is the single failure that makes research
agents worthless.

## What the verifier does and does not tell you

It checks behaviour against the acceptance criteria on the project page. It
cannot check:

- Whether a real model loops in ways your `detect_loop` does not catch. Watch
  a real run before you leave one unattended.
- Whether the sources are any good. Resolvable is not the same as reliable.
- Whether your budget is the right size. Run it ten times and look at the bill.

## Write these down here as you go

**What a run costs**, and what you capped it at.

**The loop you did not catch.** There will be one. An agent that alternates
between two actions passes `detect_loop` as written. What did you do?

**What it got confidently wrong**, and how you found out.

<!-- your notes -->
