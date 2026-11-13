# Switchboard

Inbox triage that classifies, routes, drafts, and never sends.

Standard library only. No mailbox and no API key needed to start, and none
needed to pass the verifier — both are injected fakes.

```bash
cd projects/04-switchboard
python -I verify.py
```

That fails at first. Twenty-three acceptance criteria are waiting for five
functions in `switchboard.py`, each marked `TODO` with the rules it has to
satisfy.

## Run it

```bash
cp inbox.example.json inbox.json
python -I switchboard.py --inbox inbox.json
```

The last line prints how many messages were sent. It must be zero, always.
That number is the whole project.

## The test that matters

One verifier test hands your code a `SendingMailbox` — a mailbox that returns
a perfectly normal draft id and then puts the message in the sent folder. Code
that trusts the return value of `create_draft` passes every other test and
fails this one.

That is not a contrived case. A wrong scope, a library default, a staging
config pointed at production: all of them look exactly like this. The only
thing that catches it is reading the draft back and checking the sent folder
yourself, every time.

## What the verifier does and does not tell you

It checks behaviour against the acceptance criteria on the project page. It
cannot check:

- Whether your sent folder is still empty after a week against a real mailbox.
  Go and look.
- Your classification accuracy on twenty messages you labelled by hand
  **before** the classifier saw them.
- Whether the approval request actually reaches a person who reads it. An
  approval gate nobody answers is a queue, not a gate.

## Write these down here as you go

**Your label set, and the one you were tempted to add.** Four or five labels
that cover most mail beats twelve that overlap. Which did you leave out, and
what happens to the mail that would have used it?

**What your unsure rate is.** If it is near zero, your threshold is too low
and the classifier is guessing. If it is near half, the labels are wrong.

**Who is on the approvers list, and who is not.** The constraint says the
record names a person, not a channel. Say who, and what happens when they are
on holiday.

<!-- your notes -->
