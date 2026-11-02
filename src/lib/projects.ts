/**
 * The automation track.
 *
 * Ten projects you build on your own machine with real tools — n8n, Python,
 * real APIs — not simulated in this page. n8n cannot run inside a browser
 * tab, and an agent that only works in a demo is not an agent you can sell or
 * rely on.
 *
 * So the site holds the brief, the constraints, the acceptance criteria and
 * the review checklist. The repo holds a starter scaffold per project, with
 * the interesting parts left as TODOs and a `verify.py` that runs real
 * assertions against what you built.
 *
 * The order is deliberate. Reliability comes before intelligence, because an
 * unreliable agent is worse than no agent: it fails quietly and you find out
 * from a customer. Every project after the third ends at a draft that a named
 * human approves, which is the rule that makes any of this safe to point at
 * real people.
 */

export type Stack = "python" | "n8n" | "both";

export type Milestone = {
  n: number;
  title: string;
  /** What you are building in this step. */
  brief: string;
  /** Objectively checkable. The verifier tests these where it can. */
  acceptance: string[];
};

export type Project = {
  id: string;
  name: string;
  tagline: string;
  /** Course week this sits beside. Projects can be started earlier. */
  week: number;
  level: "foundation" | "intermediate" | "senior";
  stack: Stack;
  /** Honest estimate for someone who has done the lessons. */
  hours: number;
  /** Why this is worth building rather than reading about. */
  why: string;
  /** The commercial angle, stated plainly and without overselling. */
  sellable: string;
  /** The ideas this project exists to teach. */
  teaches: string[];
  /** Hard rules the build must respect. */
  constraints: string[];
  milestones: Milestone[];
  /** Folder in the repo, or null where the scaffold is not written yet. */
  scaffold: string | null;
};

/**
 * The definition of done, applied to every project.
 *
 * Taken from how production automation is actually reviewed. A project that
 * works once on your laptop but fails none of these is not finished.
 */
export const DEFINITION_OF_DONE = [
  "It runs on a schedule or a trigger, not because you pressed something.",
  "Every external call has a timeout and a retry.",
  "Running it twice produces no duplicates.",
  "It writes a log row for every run, success or failure.",
  "It alerts on failure, on two channels, and you have proved this by breaking it on purpose.",
  "A deliberate pause or an empty result is reported as such, never as a failure.",
  "No secret is in the code. Credentials come from the environment.",
  "Anything reaching a person outside your team stops as a draft for a named human.",
  "One page of documentation: what it does, where it lives, what breaks it, how to fix it.",
];

export const PROJECTS: Project[] = [
  {
    id: "watchman",
    name: "Watchman",
    tagline: "An uptime and API health monitor that never cries wolf.",
    week: 20,
    level: "foundation",
    stack: "python",
    hours: 6,
    why: "Every later project depends on you being able to tell a real failure from an expected one. This is the smallest honest system that teaches it, and it has no AI in it at all — on purpose.",
    sellable:
      "Small agencies and freelancers run client sites with no monitoring at all. A tidy monitor with a weekly report is a real, modest recurring service, and it is the easiest first thing to sell because the value is obvious the first time it catches an outage.",
    teaches: [
      "Schedules, timeouts and retries with backoff",
      "The status taxonomy: OK, DEGRADED, NOTHING_TO_DO, PAUSED, FAILED",
      "Heartbeats and expected windows, so a job that never ran is noticed",
      "Alert de-duplication, so one outage is one message and not two hundred",
      "A run log you can query, separate from the tool's own history",
    ],
    constraints: [
      "Standard library only. No dependencies to install.",
      "Configuration in a file, secrets in the environment, never in code.",
      "A check that cannot run is not a check that passed.",
    ],
    milestones: [
      {
        n: 1,
        title: "Check one endpoint",
        brief:
          "Read a config file, call one URL, and classify the result. Get the taxonomy right before you add anything else.",
        acceptance: [
          "Returns OK for a 2xx inside the latency budget",
          "Returns DEGRADED for a 2xx that was slower than the budget",
          "Returns FAILED for a 5xx, a timeout, or a connection error",
          "A 4xx is classified deliberately, and your README says why you chose what you chose",
        ],
      },
      {
        n: 2,
        title: "Retry, then give up honestly",
        brief:
          "One blip is not an outage. Retry with backoff, and report what actually happened across the attempts.",
        acceptance: [
          "Retries a failed check a configurable number of times",
          "Waits longer between each attempt",
          "Reports the final state, and how many attempts it took",
          "Total time spent is bounded, so one dead host cannot stall the whole run",
        ],
      },
      {
        n: 3,
        title: "The run log",
        brief:
          "Write one row per check per run to a file you can query later. This is the record; the console output is not.",
        acceptance: [
          "Every run appends rows, never overwrites",
          "A row carries the timestamp, target, status, latency and attempt count",
          "The log survives a crash mid-run",
        ],
      },
      {
        n: 4,
        title: "Alerts that stay useful",
        brief:
          "The hard part. An outage lasting four hours must not produce two hundred messages, and recovery must be announced.",
        acceptance: [
          "The first transition into FAILED alerts",
          "Repeated FAILED checks do not alert again",
          "The transition back to OK sends a recovery message",
          "A target marked paused in config is skipped and reported as PAUSED, not FAILED",
        ],
      },
      {
        n: 5,
        title: "Heartbeat and proof",
        brief:
          "Prove the whole thing works by breaking it deliberately, which is the only way anyone should trust a monitor.",
        acceptance: [
          "A separate check notices when Watchman itself has not run inside its expected window",
          "You have broken it on purpose and the alert arrived",
          "A one-page runbook exists: what it does, what breaks it, how to recover",
        ],
      },
    ],
    scaffold: "projects/01-watchman",
  },
  {
    id: "ledger",
    name: "Ledger",
    tagline: "A sync between two systems that can run twice and never duplicate.",
    week: 21,
    level: "foundation",
    stack: "both",
    hours: 7,
    why: "Idempotency is the single idea that separates automation people trust from automation people turn off. Almost every real integration failure is a duplicate or a silent drop.",
    sellable:
      "Every small business has two systems that disagree: a form and a spreadsheet, a CRM and an invoicing tool. A sync that is genuinely safe to re-run is a service you can charge a setup fee for.",
    teaches: [
      "Idempotency keys and natural keys",
      "Upsert followed by reconcile, so records that disappear upstream are marked rather than left stale",
      "Watermarks and cursors, so you move only what changed",
      "Why deleting is almost always the wrong answer",
    ],
    constraints: [
      "Never delete a row. Mark it.",
      "The sync must be safe to run twice in a row, and you must prove it.",
      "A partial failure must leave the system in a state the next run can finish.",
    ],
    milestones: [
      {
        n: 1,
        title: "One-way sync, naively",
        brief: "Move records from A to B. Watch it duplicate on the second run.",
        acceptance: [
          "Records appear in B",
          "You have run it twice and documented exactly what went wrong",
        ],
      },
      {
        n: 2,
        title: "Make it idempotent",
        brief: "Give every record a stable key and upsert on it.",
        acceptance: [
          "Running twice leaves the same number of rows as running once",
          "A changed record updates rather than inserting a second copy",
          "The key is derived from the data, not from a counter",
        ],
      },
      {
        n: 3,
        title: "Reconcile the leavers",
        brief:
          "Upsert alone never removes anything. Mark what the source stopped sending, and never delete it.",
        acceptance: [
          "A record removed from A is marked inactive in B within one run",
          "Its history is still readable",
          "The run log says how many were added, updated and marked",
        ],
      },
      {
        n: 4,
        title: "Move only what changed",
        brief: "Add a watermark so a full scan is not needed every time.",
        acceptance: [
          "The second run transfers substantially less data",
          "An interrupted run resumes without skipping records",
        ],
      },
    ],
    scaffold: null,
  },
  {
    id: "scribe",
    name: "Scribe",
    tagline: "Turn messy text into structured data you can actually trust.",
    week: 23,
    level: "intermediate",
    stack: "python",
    hours: 8,
    why: "Your first AI step, and the one that teaches the discipline: a model's output is untrusted input until something has validated it. Most people skip the validation and ship a system that fails strangely.",
    sellable:
      "Extraction is the most reliably paid AI work there is, because the output is checkable. Invoices to a spreadsheet, CVs to a database, receipts to an expense report.",
    teaches: [
      "Prompts written as specifications, with role, input, rules and output shape",
      "Requiring and validating structured output against a schema",
      "What to do when the model returns something that does not fit",
      "Measuring accuracy on a held-out set rather than trusting a demo",
      "When a regular expression is the right answer and a model is not",
    ],
    constraints: [
      "No output is used before it validates against the schema.",
      "A field the model is unsure about is flagged, never guessed.",
      "The evaluation set is written before the prompt.",
    ],
    milestones: [
      {
        n: 1,
        title: "The evaluation set first",
        brief:
          "Twenty examples with correct answers, written before you touch a prompt. This is what stops you fooling yourself.",
        acceptance: [
          "Twenty inputs with expected outputs, all invented, no real personal data",
          "At least four are deliberately awkward: missing fields, odd formats, two plausible readings",
          "A scoring script reports per-field accuracy",
        ],
      },
      {
        n: 2,
        title: "Extract and validate",
        brief: "Get structured output, then refuse it if it does not fit the schema.",
        acceptance: [
          "Output is parsed against a declared schema",
          "Invalid output triggers one retry with the error fed back, then fails loudly",
          "Nothing downstream ever sees unvalidated output",
        ],
      },
      {
        n: 3,
        title: "Know what you do not know",
        brief: "An unsure field must say so rather than inventing a plausible value.",
        acceptance: [
          "Each field carries a confidence or a null",
          "Low-confidence records are routed for human review instead of being used",
          "Nothing is ever fabricated to fill a required field",
        ],
      },
      {
        n: 4,
        title: "Measure and cut cost",
        brief:
          "Report accuracy honestly, then make it cheaper without making it worse.",
        acceptance: [
          "Accuracy on the held-out set is reported per field",
          "Cost per document is measured",
          "At least one step has been replaced by code, and accuracy did not drop",
        ],
      },
    ],
    scaffold: null,
  },
  {
    id: "switchboard",
    name: "Switchboard",
    tagline: "Inbox triage that classifies, routes, drafts, and never sends.",
    week: 23,
    level: "intermediate",
    stack: "both",
    hours: 9,
    why: "The first project with a human in the loop. Draft-and-hold is not a safety setting you remove later; it is the design.",
    sellable:
      "Very sellable, and immediately useful to you. Any business with a shared inbox is drowning in it. Classification plus a good draft reply is most of the value of a support hire for a fraction of the cost.",
    teaches: [
      "Classification with a small, fixed label set",
      "Draft-and-hold, and verifying a draft was created rather than sent",
      "Approval gates that record who approved and when",
      "Routing rules kept in configuration, not in code",
      "Handling the message that fits no category",
    ],
    constraints: [
      "Nothing is ever sent automatically. Every outbound message is a draft.",
      "The approval record names a person, not a channel.",
      "After creating a draft, read it back and confirm it was not sent.",
    ],
    milestones: [
      {
        n: 1,
        title: "Classify",
        brief: "Four or five labels, and an explicit 'unsure' that routes to a human.",
        acceptance: [
          "Accuracy measured on twenty held-out messages",
          "Unsure is a real outcome, not a fallback to the most common label",
          "Labels live in config",
        ],
      },
      {
        n: 2,
        title: "Draft, and prove you did not send",
        brief:
          "Create a reply as a draft. Then verify, by reading it back, that it is a draft.",
        acceptance: [
          "A draft exists in the mailbox",
          "The sent folder is unchanged, and your code checks this",
          "A deliberate misconfiguration is caught by that check",
        ],
      },
      {
        n: 3,
        title: "The approval gate",
        brief:
          "A named human approves before anything goes out, and the decision is recorded.",
        acceptance: [
          "The request goes to a specific person, not an open channel",
          "The log records who approved, when, and what they approved",
          "An approval from someone not on the approvers list is refused",
        ],
      },
      {
        n: 4,
        title: "Escalate and close the loop",
        brief: "Anything unsure, angry, or about money goes to a person immediately.",
        acceptance: [
          "Rules route by content and risk, not by sender",
          "Every message ends in a tracked state; none is silently dropped",
          "A weekly summary reports volume by label and how often drafts were edited",
        ],
      },
    ],
    scaffold: null,
  },
  {
    id: "chaser",
    name: "Chaser",
    tagline: "A polite, escalating follow-up ladder that stops the moment you are paid.",
    week: 24,
    level: "intermediate",
    stack: "both",
    hours: 6,
    why: "Teaches state machines, scheduling, and the discipline of stopping. An automation that keeps chasing someone who already paid is worse than no automation.",
    sellable:
      "This is the easiest thing on the list to sell to freelancers and small agencies, because it is directly tied to money they are already owed. People pay for getting paid.",
    teaches: [
      "Modelling a process as states and transitions",
      "Time-based escalation with a cap",
      "The stop condition, and verifying it before every send",
      "Writing three messages with escalating firmness and no rudeness",
    ],
    constraints: [
      "Check payment state immediately before drafting, never from a cached value.",
      "A hard cap on total messages, after which a human takes over.",
      "Every message is a draft until approved.",
    ],
    milestones: [
      {
        n: 1,
        title: "The state machine",
        brief: "Draw it before you build it: unpaid, reminded once, twice, escalated, paid, written off.",
        acceptance: [
          "Every state has defined entry and exit conditions",
          "No state can be reached by two paths with different meanings",
          "Paid is terminal",
        ],
      },
      {
        n: 2,
        title: "The ladder",
        brief: "Three messages, increasingly firm, correctly spaced.",
        acceptance: [
          "Timing is configurable, not hard-coded",
          "Weekends and holidays are respected",
          "The third message escalates to a person rather than sending itself",
        ],
      },
      {
        n: 3,
        title: "Stop reliably",
        brief: "The expensive failure here is chasing someone who has paid.",
        acceptance: [
          "Payment state is re-checked immediately before each draft",
          "A payment arriving mid-ladder halts it within one cycle",
          "You have tested this by marking an invoice paid between runs",
        ],
      },
    ],
    scaffold: null,
  },
  {
    id: "recap",
    name: "Recap",
    tagline: "A weekly digest where every claim carries its evidence.",
    week: 24,
    level: "intermediate",
    stack: "both",
    hours: 7,
    why: "The project that teaches you to use no model where counting will do. Half of this is arithmetic, and putting a model anywhere near the arithmetic only adds a way to be wrong.",
    sellable:
      "Agencies spend hours a week writing client updates. A digest that assembles the evidence and drafts the summary saves a genuine half-day, and the time saved is easy to point at.",
    teaches: [
      "Separating gathering from writing, and using AI only for the second",
      "Citing a source for every line",
      "Stating what could not be counted instead of quietly under-reporting",
      "Scheduling around the people who read it",
    ],
    constraints: [
      "No model touches the counting half.",
      "Every item in the digest carries a link or an id.",
      "Sources you cannot see are named as gaps in the output itself.",
    ],
    milestones: [
      {
        n: 1,
        title: "Gather, with evidence",
        brief: "Pull activity from two or three sources into one table. No AI at all.",
        acceptance: [
          "One row per item, with a source and a reference",
          "An item with no verifiable reference is excluded and counted as excluded",
          "The table is reproducible: the same week produces the same rows",
        ],
      },
      {
        n: 2,
        title: "Name the gaps",
        brief:
          "Anything you cannot see must appear in the output as a stated limitation.",
        acceptance: [
          "The digest lists which sources were unreachable",
          "A failed source never silently becomes a zero",
        ],
      },
      {
        n: 3,
        title: "Draft the summary",
        brief: "Now, and only now, a model turns the table into prose.",
        acceptance: [
          "Every sentence traces to a row in the table",
          "No number in the prose was produced by the model",
          "The draft is held for approval",
        ],
      },
    ],
    scaffold: null,
  },
  {
    id: "prospector",
    name: "Prospector",
    tagline: "Your first real agent: it researches, follows evidence, and cites everything.",
    week: 25,
    level: "senior",
    stack: "python",
    hours: 10,
    why: "The first task where the steps genuinely cannot be written in advance, which is the only honest reason to use an agent. Everything before this was a workflow.",
    sellable:
      "Research-as-a-service: market scans, competitor briefs, prospect dossiers. Sold per report rather than per seat, which suits a one-person operation.",
    teaches: [
      "The agent test, and applying it honestly",
      "Tools as narrow capabilities rather than raw credentials",
      "Budgets: a cap on steps, time and spend, enforced in code",
      "Stop conditions, and handling an agent that loops",
      "Never inventing a figure; an uncited claim is a bug",
    ],
    constraints: [
      "Every factual claim carries a source URL, or it is removed.",
      "Hard caps on steps, wall-clock time and cost, enforced before each call.",
      "The agent gets tools, never API keys.",
      "Output is a draft.",
    ],
    milestones: [
      {
        n: 1,
        title: "Justify the agent",
        brief:
          "Write the argument that this cannot be a fixed workflow. If you cannot, build the workflow instead; that is a pass, not a failure.",
        acceptance: [
          "A written argument against the agent test",
          "A description of the fixed workflow you rejected, and why",
        ],
      },
      {
        n: 2,
        title: "Tools with narrow hands",
        brief: "Three or four tools, each doing one safe thing.",
        acceptance: [
          "Each tool validates its own inputs",
          "No tool can write anywhere outside a scratch area",
          "No credential is reachable from the model's context",
        ],
      },
      {
        n: 3,
        title: "Bounds that hold",
        brief: "Caps enforced in code, not requested in the prompt.",
        acceptance: [
          "Step, time and cost caps are checked before every model call",
          "Hitting a cap produces a partial result and says so, rather than failing silently",
          "A deliberate loop is caught and stopped",
        ],
      },
      {
        n: 4,
        title: "Citations or nothing",
        brief: "An uncited claim is a defect. Strip it or fail the run.",
        acceptance: [
          "Every claim in the output has a resolvable source",
          "A fabricated-source test case is caught",
          "The report states what it could not establish",
        ],
      },
    ],
    scaffold: null,
  },
  {
    id: "herald",
    name: "Herald",
    tagline: "An outreach agent with a safety pause and a human on every message.",
    week: 25,
    level: "senior",
    stack: "both",
    hours: 10,
    why: "The highest-risk thing in this track, because it touches real people who did not ask to hear from you. Build it exactly once, properly, and you will understand why every rule exists.",
    sellable:
      "The most commercially valuable project here and the easiest to do badly. Sold as a done-for-you service rather than software, because the judgement is the product.",
    teaches: [
      "Rate limits, randomised delays and why bursts get you blocked",
      "A kill switch that genuinely stops the system mid-flight",
      "Personalisation that is researched rather than mail-merged",
      "Suppression lists, and honouring a no permanently",
      "Reporting a pause as PAUSED, not as a failure",
    ],
    constraints: [
      "Nothing sends without a named human approving that specific message.",
      "A suppression list is checked before every draft, and it is permanent.",
      "A kill switch halts everything within one cycle, and is tested weekly.",
      "Volume caps per day and per recipient, enforced in code.",
    ],
    milestones: [
      {
        n: 1,
        title: "Rules before code",
        brief:
          "Write the rules of engagement first: who you may contact, how often, how someone opts out forever.",
        acceptance: [
          "A written policy covering consent, frequency and opt-out",
          "The opt-out path is one step and permanent",
          "You would be comfortable showing the policy to a recipient",
        ],
      },
      {
        n: 2,
        title: "Research, then draft",
        brief: "A message that could have been sent to anyone should not be sent to anyone.",
        acceptance: [
          "Each draft cites the specific thing it is responding to",
          "A draft with no genuine hook is discarded rather than padded",
          "Drafts are held, never sent",
        ],
      },
      {
        n: 3,
        title: "The pause and the gate",
        brief: "Prove you can stop it, and that only the right person can start it.",
        acceptance: [
          "A kill switch halts all sending within one cycle",
          "PAUSED is reported as a state, not an error",
          "Approvals record the approver's identity",
        ],
      },
      {
        n: 4,
        title: "Reply handling",
        brief: "A reply must reach a human fast, and an unsubscribe must be honoured instantly.",
        acceptance: [
          "Replies are detected and routed within one cycle",
          "Any negative reply adds the recipient to suppression permanently",
          "No automated message ever follows a reply",
        ],
      },
    ],
    scaffold: null,
  },
  {
    id: "sentinel",
    name: "Sentinel",
    tagline: "A regression bot that runs your tests, triages the failures, and files the bugs.",
    week: 26,
    level: "senior",
    stack: "both",
    hours: 9,
    why: "Where the two halves of this course meet. You will have written Playwright tests in week 15 and learned reliability in week 22; this joins them into something a team would actually run.",
    sellable:
      "Agencies maintaining many client sites have no QA capacity at all. Nightly regression with triaged, readable bug reports is a service with an obvious price.",
    teaches: [
      "Running a suite on a schedule and in CI",
      "Telling a real regression from a flaky test",
      "Turning a failure into a bug report an engineer can act on",
      "Grouping failures by probable cause instead of filing forty tickets",
      "Never filing a duplicate",
    ],
    constraints: [
      "A flaky test is quarantined, not deleted, and the quarantine is reported.",
      "A failure already filed is updated, never filed again.",
      "Every report carries evidence, with secrets redacted.",
    ],
    milestones: [
      {
        n: 1,
        title: "Nightly run",
        brief: "The suite runs on a schedule and the result is recorded.",
        acceptance: [
          "Runs unattended and writes a run-log row",
          "Artefacts are kept: screenshots, traces, console output",
          "A failure to run at all is distinguished from a failing test",
        ],
      },
      {
        n: 2,
        title: "Flaky or broken",
        brief: "Re-run failures. What passes on retry is flaky; what does not is a regression.",
        acceptance: [
          "Failures are retried a bounded number of times",
          "Flaky tests are quarantined and listed in the report",
          "The quarantine list is visible, so it cannot quietly grow forever",
        ],
      },
      {
        n: 3,
        title: "File it well",
        brief: "Turn a genuine regression into the bug report you learned to write in week 11.",
        acceptance: [
          "Title, environment, steps, expected, actual and evidence are all present",
          "Secrets are redacted from every attachment",
          "A failure matching an open report updates it instead of filing a duplicate",
        ],
      },
      {
        n: 4,
        title: "Group by cause",
        brief: "Forty failures from one broken endpoint is one bug, not forty.",
        acceptance: [
          "Failures sharing a probable cause are grouped into one report",
          "The grouping logic is explainable in a sentence",
          "The nightly summary fits on one screen",
        ],
      },
    ],
    scaffold: null,
  },
  {
    id: "capstone",
    name: "Capstone",
    tagline: "Take one of these and make it something another person can actually use.",
    week: 26,
    level: "senior",
    stack: "both",
    hours: 12,
    why: "Building something is a different skill from shipping it. The gap between a script that works for you and a thing someone else can run is where most side projects die.",
    sellable:
      "This is the project whose entire purpose is to be sellable. Pick the one with a buyer you can name.",
    teaches: [
      "Onboarding someone who has never seen your system",
      "Pricing, and what is actually being paid for",
      "Documentation a stranger can follow",
      "Handover, and why being replaceable makes you valuable",
      "Measuring whether it helped, honestly",
    ],
    constraints: [
      "Someone other than you must complete setup without your help.",
      "It meets every line of the definition of done.",
      "You can state in one sentence what the buyer is paying for.",
    ],
    milestones: [
      {
        n: 1,
        title: "Pick one, and name the buyer",
        brief: "Not a market. One person or business you could actually approach.",
        acceptance: [
          "A named buyer and the specific pain this removes",
          "A one-sentence description of what they are paying for",
          "An honest estimate of what it saves them, in hours or money",
        ],
      },
      {
        n: 2,
        title: "Make it installable",
        brief: "Setup from nothing, by someone who is not you.",
        acceptance: [
          "A README someone followed successfully without asking you a question",
          "Configuration is separate from code",
          "A failure during setup produces a message that says what to do",
        ],
      },
      {
        n: 3,
        title: "Operate it for two weeks",
        brief: "Run it for real. Find out what breaks when you are not watching.",
        acceptance: [
          "Two weeks of run logs",
          "Every failure has a runbook entry written after the fact",
          "You know its cost per month",
        ],
      },
      {
        n: 4,
        title: "Hand it over",
        brief: "Teach someone else to own it, and watch them drive.",
        acceptance: [
          "A recorded walkthrough where the other person operates it",
          "They recovered from a deliberate failure using your runbook alone",
          "A measured before and after",
        ],
      },
    ],
    scaffold: null,
  },
];

export function getProject(id: string): Project | undefined {
  return PROJECTS.find((project) => project.id === id);
}

export const LEVEL_LABEL: Record<Project["level"], string> = {
  foundation: "Foundation",
  intermediate: "Intermediate",
  senior: "Senior",
};

export const STACK_LABEL: Record<Stack, string> = {
  python: "Python",
  n8n: "n8n",
  both: "n8n + Python",
};
