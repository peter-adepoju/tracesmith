# Herald

An outreach agent with a safety pause and a human on every message.

Standard library only. Nothing here can reach a person: there is no mail
client, and the only thing the code produces is text.

```bash
cd projects/08-herald
python -I verify.py
```

Twenty-eight acceptance criteria are waiting for five functions in
`herald.py`.

## Milestone 1 is a policy, not code

Before any of this, write the rules of engagement: who you may contact, how
often, and how someone opts out for ever. The test is in the acceptance
criteria and it is a good one — **would you be comfortable showing this policy
to a recipient?**

Write it here:

> **Who I may contact, and why they would not mind:**
>
> **How often, and the gap between messages:**
>
> **How someone opts out, in one step, permanently:**

## Run it, then pull the switch

```bash
cp campaign.example.json campaign.json
python -I herald.py --campaign campaign.json --today 2026-03-10
python -I herald.py --campaign campaign.json --today 2026-03-10 --kill
```

The example campaign is built so the first run already shows four behaviours:
one person drafted, one skipped for having no genuine hook, one suppressed,
one too recently contacted.

The second run must report **paused** for everyone and draft nothing. That is
the switch you will one day need in a hurry, and the only way to know it works
is to pull it.

## The three rules that hold this up

**Suppression is permanent and checked before every draft.** Not once per
batch. Caching it is how somebody who unsubscribed at 09:01 hears from you at
09:04, and the cost of that is not a bug report — it is a person who asked you
to stop and was ignored.

**Nothing sends.** Every message is a draft until a named human approves that
specific message.

**PAUSED is a state, not an error.** A pause that reads like a crash gets
"fixed" by someone restarting it.

## The rule that makes it worth doing

A message that could have been sent to anyone should not be sent to anyone.
`draft_for` returns `None` when there is no genuine hook, and `None` means do
not contact this person — not "pad it out with their company name".

Most of a bought list will produce `None`. That is the system working.

## What the verifier does and does not tell you

It cannot check whether your hooks are real or whether your messages read like
a human wrote them. Read them aloud. If you would be embarrassed to have sent
one, do not send it.

## Write these down here as you go

**What your reply rate was**, and what you changed after.

**The first person who asked you to stop**, and how long it took to honour.

**What you would say** if a recipient asked how you got their address.

<!-- your notes -->
