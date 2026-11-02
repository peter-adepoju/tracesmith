# Watchman

An uptime and API health monitor that never cries wolf.

Standard library only. Nothing to install.

```bash
cd projects/01-watchman
python -I verify.py          # see what is left to write
cp config.example.json config.json
python -I watchman.py --config config.json
```

`verify.py` fails on a fresh checkout. That is correct: four functions in
`watchman.py` are yours to write. Work through them in milestone order and the
verifier will tell you when each one is right.

## What you are writing

| Function | Milestone | What it decides |
| --- | --- | --- |
| `classify` | 1 | One response becomes one status |
| `check_target` | 2 | Retries, backoff, and when to stop trying |
| `should_alert` | 4 | Whether a transition deserves a message |
| `is_stale` | 5 | Whether Watchman itself has stopped running |

Everything else — config loading, the run loop, the append-only log — is
already written. Boilerplate is not what this project teaches.

## Two decisions the verifier will not make for you

**What is a 4xx?** The verifier only checks that you return *something*
sensible and do not crash. A 404 on a page that should exist is a real
failure; a 401 on an endpoint that needs a key you did not supply is your
configuration being wrong, not the service being down. Decide, implement it,
and write your reasoning below.

**What should DEGRADED do about alerting?** Alerting on every slow response
will drown you. Never alerting on slowness means you miss a service dying
gradually. Decide, and justify it below.

> Replace this line with your two decisions and why.

## Why `fetch` and `sleep` are arguments

`check_target` takes them rather than calling `urllib` and `time.sleep`
directly. That is the only reason the verifier can test your retry and backoff
logic in milliseconds without network access.

This is worth internalising beyond this project: code that reaches out to the
world directly is code nobody can test. Pass the outside world in, and the
same function works in production and in a test.

## Before you call it done

The verifier checks behaviour. These are yours:

- [ ] It runs on a schedule — cron, Task Scheduler, a systemd timer — not when you remember.
- [ ] Alerts reach somewhere real, on two channels, not `print`.
- [ ] You have broken it on purpose and both alerts arrived.
- [ ] The heartbeat has caught Watchman itself failing to run.
- [ ] No URL or credential is hard-coded.
- [ ] A one-page runbook exists: what it does, what breaks it, how to recover.

## Where this goes next

Watchman is the foundation for the rest of the track. Ledger reuses its run
log, Switchboard reuses its alerting, and Sentinel is Watchman pointed at a
test suite instead of a URL. Build it properly once.
