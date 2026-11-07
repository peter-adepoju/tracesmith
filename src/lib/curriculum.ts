/**
 * The whole course, as data.
 *
 * One merged path from zero to expert. Twenty-six weeks, six days a week,
 * 156 days. Five phases, each building on the one before: you cannot test an
 * API you cannot read, you cannot support a payment you cannot trace, and you
 * cannot automate a process you have never done by hand.
 *
 * A day is written once a lesson file exists for it in content/. Until then it
 * shows in the map with its title and reads as planned.
 */

export type Day = {
  n: number;
  title: string;
  /** What you can do by the end. Shown at the top of the lesson. */
  objectives: string[];
};

export type Week = {
  n: number;
  title: string;
  summary: string;
  days: Day[];
};

export type Phase = {
  n: number;
  title: string;
  blurb: string;
  /** Week numbers, inclusive range. */
  from: number;
  to: number;
};

export const PHASES: Phase[] = [
  {
    n: 1,
    title: "How the web actually works",
    blurb:
      "Before any role makes sense you need the machinery underneath it: what a browser sends, what a server answers with, and how a page is built. Everything later is a variation on this.",
    from: 1,
    to: 4,
  },
  {
    n: 2,
    title: "Data, APIs and evidence",
    blurb:
      "The language systems talk to each other in. Endpoints, payloads, responses, keys and webhooks, and how to call an API yourself instead of guessing what it did.",
    from: 5,
    to: 8,
  },
  {
    n: 3,
    title: "Quality assurance",
    blurb:
      "Finding problems before customers do, and proving them. Test cases, bug reports, regression, API testing, the five security checks, and your first automated tests.",
    from: 9,
    to: 15,
  },
  {
    n: 4,
    title: "Technical support",
    blurb:
      "The craft of being the useful human in the middle. Triage, diagnosis from evidence, writing to customers and engineers, and the payments domain where most support jobs live.",
    from: 16,
    to: 19,
  },
  {
    n: 5,
    title: "AI automation",
    blurb:
      "Moving repeatable work onto a system that runs itself, keeps receipts, and stops for a human before anything leaves the building. Workflows, reliability, models, agents and governance.",
    from: 20,
    to: 26,
  },
];

export const WEEKS: Week[] = [
  {
    n: 1,
    title: "The web, end to end",
    summary:
      "One request, followed all the way from a click to a response and back. The single most reusable picture in this whole course.",
    days: [
      {
        n: 1,
        title: "What happens when you type a URL",
        objectives: [
          "Name every step between pressing Enter and seeing a page",
          "Explain what DNS does, in one sentence",
          "Point at the part of the journey your future job touches",
        ],
      },
      {
        n: 2,
        title: "Clients, servers and the request-response cycle",
        objectives: [
          "Define client and server without using either word",
          "Describe the request-response cycle as a loop",
          "Say why a server never speaks first",
        ],
      },
      {
        n: 3,
        title: "HTTP methods: GET, POST, PUT, PATCH, DELETE",
        objectives: [
          "Choose the right method for a given action",
          "Explain why a GET should never change anything",
          "Spot a wrong method from a 405 response",
        ],
      },
      {
        n: 4,
        title: "Status codes, and what each family means",
        objectives: [
          "Recall what 2xx, 3xx, 4xx and 5xx each mean",
          "Tell a client mistake from a server failure",
          "Decide, from a code alone, whose problem it is",
        ],
      },
      {
        n: 5,
        title: "Headers: the envelope around every message",
        objectives: [
          "Read the headers of a real request",
          "Explain Content-Type, Authorization and User-Agent",
          "Redact a header safely before sharing it",
        ],
      },
      {
        n: 6,
        title: "Practice: read ten real requests",
        objectives: [
          "Work the request inspector unaided",
          "Classify ten responses by code and cause",
          "Write one sentence of evidence per request",
        ],
      },
    ],
  },
  {
    n: 2,
    title: "The page itself: HTML",
    summary:
      "The document every website is made of. You will read far more HTML than you write, and reading it is what finds bugs.",
    days: [
      {
        n: 1,
        title: "What HTML is and how a browser reads it",
        objectives: [
          "Describe HTML as structure, not appearance",
          "Write a valid minimal page from memory",
          "Explain what the browser does with a tag it does not know",
        ],
      },
      {
        n: 2,
        title: "Elements, attributes and nesting",
        objectives: [
          "Name the parts of an element",
          "Use attributes correctly, including id and class",
          "Spot broken nesting in someone else's markup",
        ],
      },
      {
        n: 3,
        title: "Text, links, images and lists",
        objectives: [
          "Mark up a realistic page of content",
          "Explain relative and absolute links",
          "Say why every image needs alt text",
        ],
      },
      {
        n: 4,
        title: "Forms and inputs, the part QA breaks most",
        objectives: [
          "Build a form with several input types",
          "Explain what a form actually sends, and where",
          "List five ways a form can be broken",
        ],
      },
      {
        n: 5,
        title: "Tables, semantics and accessibility basics",
        objectives: [
          "Choose semantic elements over generic ones",
          "Build an accessible table",
          "Run a keyboard-only pass over a page",
        ],
      },
      {
        n: 6,
        title: "Practice: build a page, then inspect it",
        objectives: [
          "Hand-write a small page end to end",
          "Find your own mistakes in the Elements panel",
          "Fix three deliberate defects",
        ],
      },
    ],
  },
  {
    n: 3,
    title: "Styling and structure: CSS and the DOM",
    summary:
      "Why a page looks the way it does, and why an element can be present but invisible. Half of all UI bugs live here.",
    days: [
      {
        n: 1,
        title: "What CSS is and how rules are applied",
        objectives: [
          "Attach styles three different ways",
          "Read a rule and name its parts",
          "Predict which rule wins",
        ],
      },
      {
        n: 2,
        title: "Selectors, the cascade and specificity",
        objectives: [
          "Write selectors that target exactly what you mean",
          "Explain the cascade in plain words",
          "Debug a style that is being overridden",
        ],
      },
      {
        n: 3,
        title: "The box model and layout",
        objectives: [
          "Explain margin, border, padding and content",
          "Use flexbox for a simple layout",
          "Diagnose an element that is the wrong size",
        ],
      },
      {
        n: 4,
        title: "The DOM: the page as a live tree",
        objectives: [
          "Describe the difference between HTML and the DOM",
          "Explain why 'view source' can disagree with Elements",
          "Find an element that JavaScript added",
        ],
      },
      {
        n: 5,
        title: "Responsive layout, and why mobile bugs happen",
        objectives: [
          "Use the device toolbar to test widths",
          "Explain a media query",
          "Find a bug that only exists at phone width",
        ],
      },
      {
        n: 6,
        title: "Practice: find five layout bugs",
        objectives: [
          "Work from a broken page to five written findings",
          "Prove each with an Elements screenshot",
          "Rank them by user impact",
        ],
      },
    ],
  },
  {
    n: 4,
    title: "The browser's own toolkit: DevTools",
    summary:
      "The single most useful tool you will own in any of the three roles. Every panel, and when each one earns its place.",
    days: [
      {
        n: 1,
        title: "Opening DevTools and the panel map",
        objectives: [
          "Open DevTools three ways",
          "Name every panel and its job",
          "Dock, undock and resize without losing your place",
        ],
      },
      {
        n: 2,
        title: "Elements: inspecting and editing live",
        objectives: [
          "Jump from any pixel to its markup",
          "Edit text and styles temporarily to test a fix",
          "Find an element that is present but hidden",
        ],
      },
      {
        n: 3,
        title: "Console: errors are evidence",
        objectives: [
          "Read a red error and say what failed",
          "Filter by level and clear noise",
          "Capture a console error for a bug report",
        ],
      },
      {
        n: 4,
        title: "Network: every request the page makes",
        objectives: [
          "Filter to Fetch/XHR and read the columns",
          "Preserve log across a redirect",
          "Open one request and read all six of its tabs",
        ],
      },
      {
        n: 5,
        title: "Application, Security and the device toolbar",
        objectives: [
          "Find a login token in storage",
          "Clear site data to retest cleanly",
          "Confirm a page is served over valid HTTPS",
        ],
      },
      {
        n: 6,
        title: "Practice: a DevTools scavenger hunt",
        objectives: [
          "Answer twelve questions using only DevTools",
          "Produce one redacted capture as evidence",
          "Time yourself, then beat it",
        ],
      },
    ],
  },
  {
    n: 5,
    title: "JSON and data shapes",
    summary:
      "The format almost every API answers in. Reading a response confidently is the skill this week buys you.",
    days: [
      {
        n: 1,
        title: "Why machines need a data format",
        objectives: [
          "Explain why HTML is wrong for machine-to-machine data",
          "Name three formats and when each is used",
          "Read a tiny JSON document aloud",
        ],
      },
      {
        n: 2,
        title: "JSON syntax: objects, arrays and types",
        objectives: [
          "Write valid JSON by hand",
          "Name all six JSON types",
          "Find the syntax error in a broken document",
        ],
      },
      {
        n: 3,
        title: "Nesting, and reading a deep response",
        objectives: [
          "Walk a path into a nested object",
          "Describe a shape in words",
          "Pull one value out of a hundred-line response",
        ],
      },
      {
        n: 4,
        title: "Null, missing and empty, and why they differ",
        objectives: [
          "Distinguish null, absent, empty string and zero",
          "Explain why the difference causes real bugs",
          "Write the test that catches each",
        ],
      },
      {
        n: 5,
        title: "Reading a schema, and spotting a wrong shape",
        objectives: [
          "Read a simple schema document",
          "Compare a response against its promised shape",
          "Report a shape mismatch precisely",
        ],
      },
      {
        n: 6,
        title: "Practice: ten malformed payloads",
        objectives: [
          "Diagnose ten broken documents",
          "Say what the sender did wrong in each",
          "Propose the corrected payload",
        ],
      },
    ],
  },
  {
    n: 6,
    title: "APIs and endpoints",
    summary:
      "The vocabulary interviewers ask about and the thing every integration is made of. Endpoint, payload, response, and the conventions around them.",
    days: [
      {
        n: 1,
        title: "What an API really is",
        objectives: [
          "Define an API without jargon",
          "Give three everyday examples",
          "Explain why a company exposes one at all",
        ],
      },
      {
        n: 2,
        title: "Endpoints, paths and resources",
        objectives: [
          "Read an endpoint and predict what it returns",
          "Explain the resource idea behind a path",
          "Spot the endpoint in an error message",
        ],
      },
      {
        n: 3,
        title: "Query strings, path parameters and bodies",
        objectives: [
          "Tell the three ways to pass data apart",
          "Build a URL with query parameters",
          "Choose the right place for a given value",
        ],
      },
      {
        n: 4,
        title: "The payload: what you send and what comes back",
        objectives: [
          "Define payload precisely",
          "Read a request payload and a response body",
          "Catch a wrong amount or missing field in a payload",
        ],
      },
      {
        n: 5,
        title: "REST conventions, and where real APIs break them",
        objectives: [
          "List the REST conventions you will actually meet",
          "Recognise a non-REST API without panicking",
          "Read documentation for an unfamiliar API",
        ],
      },
      {
        n: 6,
        title: "Practice: map an API from its docs",
        objectives: [
          "Turn a documentation page into an endpoint table",
          "Write one example call per endpoint",
          "Note every required field and auth rule",
        ],
      },
    ],
  },
  {
    n: 7,
    title: "Authentication and keys",
    summary:
      "How a system knows who is calling, and what you must never put in a screenshot, a ticket or a chat message.",
    days: [
      {
        n: 1,
        title: "Who are you: authentication vs authorization",
        objectives: [
          "Define both and keep them apart",
          "Map each to a status code",
          "Explain why logging in is not permission",
        ],
      },
      {
        n: 2,
        title: "API keys, public and secret",
        objectives: [
          "Explain what a key proves",
          "Say which key belongs in a browser and which never does",
          "Describe what to do when a secret leaks",
        ],
      },
      {
        n: 3,
        title: "Tokens, bearer auth and expiry",
        objectives: [
          "Read an Authorization header",
          "Explain why tokens expire",
          "Diagnose a 401 caused by an expired token",
        ],
      },
      {
        n: 4,
        title: "OAuth in plain words",
        objectives: [
          "Describe the consent flow without diagrams",
          "Explain what a refresh token is for",
          "Recognise an OAuth failure in a log",
        ],
      },
      {
        n: 5,
        title: "Handling secrets safely, and redaction",
        objectives: [
          "List what must never be collected or pasted",
          "Redact a request capture correctly",
          "Refuse a customer's offered password politely",
        ],
      },
      {
        n: 6,
        title: "Practice: diagnose six 401s and 403s",
        objectives: [
          "Separate missing, wrong, expired and forbidden",
          "Name the fix for each",
          "Write one escalation for the one that is not yours",
        ],
      },
    ],
  },
  {
    n: 8,
    title: "Calling APIs yourself",
    summary:
      "The moment you stop reading about requests and start sending them. Postman, cURL and webhooks.",
    days: [
      {
        n: 1,
        title: "Postman: your first request",
        objectives: [
          "Send a GET and read the response pane",
          "Set headers and a JSON body",
          "Save a request you can run again",
        ],
      },
      {
        n: 2,
        title: "Collections, environments and variables",
        objectives: [
          "Organise requests into a collection",
          "Swap environments without editing requests",
          "Keep a key out of the request itself",
        ],
      },
      {
        n: 3,
        title: "cURL, and reading a command someone sent you",
        objectives: [
          "Read any cURL command aloud",
          "Convert between cURL and Postman",
          "Strip secrets before sharing one",
        ],
      },
      {
        n: 4,
        title: "Chaining requests and using a response",
        objectives: [
          "Take a value from one response into the next request",
          "Explain why order matters",
          "Build a two-step flow",
        ],
      },
      {
        n: 5,
        title: "Webhooks: being told instead of asking",
        objectives: [
          "Explain webhook, callback and verify, and how they differ",
          "Say why a browser return is not proof of payment",
          "Inspect a webhook with a request bin",
        ],
      },
      {
        n: 6,
        title: "Practice: build a small collection",
        objectives: [
          "Cover one resource end to end",
          "Include a negative case per endpoint",
          "Hand it to someone else to run",
        ],
      },
    ],
  },
  {
    n: 9,
    title: "What QA is",
    summary:
      "The job, the mindset and the stakes. Why a bug in a payments system is not the same as a bug in a blog.",
    days: [
      {
        n: 1,
        title: "Quality, risk and the cost of a missed bug",
        objectives: [
          "Define quality assurance in one sentence",
          "Explain why finding a defect late costs so much more",
          "Phrase a defect so a developer can act on it without defensiveness",
        ],
      },
      {
        n: 2,
        title: "Where testing sits, and the environments it moves through",
        objectives: [
          "Name the four environments and who uses each",
          "List what staging can never tell you",
          "Say what shifting left means, and ask one question early",
        ],
      },
      {
        n: 3,
        title: "The types of testing",
        objectives: [
          "Name ten types and give an example of each",
          "Choose the right types for a given change",
          "Decide what belongs to automation and what stays manual",
        ],
      },
      {
        n: 4,
        title: "The tester's mindset",
        objectives: [
          "Treat every claim on screen as a hypothesis",
          "Generate twenty cases from the eleven heuristics",
          "Rank what to test first by likelihood and impact",
        ],
      },
      {
        n: 5,
        title: "Test data",
        objectives: [
          "Build a reusable set of awkward values",
          "Explain why real customer data is never used",
          "Keep runs repeatable as data goes stale",
        ],
      },
      {
        n: 6,
        title: "Practice: plan the testing for one feature",
        objectives: [
          "Turn a feature into a ranked test plan",
          "Choose the types each area needs",
          "State what you will not test, and why",
        ],
      },
    ],
  },
  {
    n: 10,
    title: "Test cases",
    summary:
      "Turning a vague feature into tests anyone can run and get the same answer from.",
    days: [
      {
        n: 1,
        title: "Anatomy of a test case",
        objectives: [
          "Name all seven parts of a case",
          "Write an ID scheme that scales",
          "Judge whether a case is repeatable",
        ],
      },
      {
        n: 2,
        title: "Preconditions and setup",
        objectives: [
          "State preconditions precisely",
          "Describe the state a case starts from",
          "Explain why real customer data is never used",
        ],
      },
      {
        n: 3,
        title: "Writing steps anyone can follow",
        objectives: [
          "Write steps with no assumed knowledge",
          "Keep one action per step",
          "Hand a case to someone else successfully",
        ],
      },
      {
        n: 4,
        title: "Expected versus actual, and Pass, Fail, Blocked",
        objectives: [
          "Write an expected result that cannot be argued with",
          "Use Blocked correctly",
          "Explain why Blocked matters to a reader",
        ],
      },
      {
        n: 5,
        title: "Test suites and coverage",
        objectives: [
          "Group cases into a suite",
          "Spot a gap in coverage",
          "Explain why 100 percent coverage is not the goal",
        ],
      },
      {
        n: 6,
        title: "Practice: write a suite of twelve",
        objectives: [
          "Cover one feature properly",
          "Include negative and boundary cases",
          "Run your own suite and record results",
        ],
      },
    ],
  },
  {
    n: 11,
    title: "Bugs",
    summary:
      "The most valuable thing a tester produces is a report an engineer can act on without asking a single question.",
    days: [
      {
        n: 1,
        title: "The bug lifecycle",
        objectives: [
          "Name every stage from New to Closed",
          "Explain who moves each stage",
          "Say why only QA may close a bug",
        ],
      },
      {
        n: 2,
        title: "Severity versus priority",
        objectives: [
          "Define both and keep them apart",
          "Place four real bugs in the right quadrant",
          "Explain a high-severity, low-priority bug",
        ],
      },
      {
        n: 3,
        title: "Reproducing reliably",
        objectives: [
          "Reduce a vague report to exact steps",
          "Identify the smallest reproduction",
          "Handle a bug you cannot reproduce",
        ],
      },
      {
        n: 4,
        title: "Evidence: screenshots, recordings, captures",
        objectives: [
          "Annotate a screenshot usefully",
          "Capture a network request as proof",
          "Redact every secret before attaching",
        ],
      },
      {
        n: 5,
        title: "Writing a report that needs no follow-up",
        objectives: [
          "Write all seven sections well",
          "Title a bug so it is findable",
          "Judge your own report against the no-questions test",
        ],
      },
      {
        n: 6,
        title: "Practice: three reports from recordings",
        objectives: [
          "Watch, reproduce and write",
          "Classify severity and priority honestly",
          "Have each report graded",
        ],
      },
    ],
  },
  {
    n: 12,
    title: "Testing the web",
    summary:
      "A full manual pass over a real feature, the way it is actually done on the job.",
    days: [
      {
        n: 1,
        title: "Functional testing in the browser",
        objectives: [
          "Execute a suite against a live page",
          "Record results as you go",
          "Keep evidence organised",
        ],
      },
      {
        n: 2,
        title: "Regression testing and what to re-run",
        objectives: [
          "Choose a regression set for a given change",
          "Explain the cost of re-running everything",
          "Build a smoke test that takes ten minutes",
        ],
      },
      {
        n: 3,
        title: "Cross-browser and responsive testing",
        objectives: [
          "Test the same flow at three widths",
          "Explain why browsers differ",
          "Report a browser-specific bug properly",
        ],
      },
      {
        n: 4,
        title: "Forms, validation and boundary values",
        objectives: [
          "Apply boundary value analysis",
          "Use equivalence partitioning to cut cases",
          "Break a form in six documented ways",
        ],
      },
      {
        n: 5,
        title: "Accessibility checks you can run today",
        objectives: [
          "Run a keyboard-only pass",
          "Check contrast and alt text",
          "Write an accessibility finding",
        ],
      },
      {
        n: 6,
        title: "Practice: a full feature pass",
        objectives: [
          "Plan, execute and report in one sitting",
          "Produce a results summary with counts",
          "State what you could not test, and why",
        ],
      },
    ],
  },
  {
    n: 13,
    title: "API and data testing",
    summary:
      "Testing below the screen, where the screen can lie to you. Plus the SQL a tester actually needs.",
    days: [
      {
        n: 1,
        title: "Testing an endpoint, not a screen",
        objectives: [
          "Explain what API testing catches that UI testing misses",
          "Write an API test case",
          "Decide which layer a given test belongs in",
        ],
      },
      {
        n: 2,
        title: "Status, schema and value assertions",
        objectives: [
          "Assert on three levels",
          "Write assertions that fail usefully",
          "Catch a correct status with wrong data",
        ],
      },
      {
        n: 3,
        title: "Negative testing and bad input",
        objectives: [
          "Design inputs a server should reject",
          "Check the error body, not just the code",
          "Report a server that accepts nonsense",
        ],
      },
      {
        n: 4,
        title: "Idempotency and running twice",
        objectives: [
          "Define idempotency",
          "Design the run-twice test",
          "Explain the risk of a duplicate payment",
        ],
      },
      {
        n: 5,
        title: "SQL for testers: reading the data behind the screen",
        objectives: [
          "Write SELECT with WHERE and ORDER BY",
          "Join two tables",
          "Confirm from the database what the UI claims",
        ],
      },
      {
        n: 6,
        title: "Practice: twenty API cases",
        objectives: [
          "Cover positive, negative and boundary",
          "Automate the assertions you repeat",
          "Report two real defects",
        ],
      },
    ],
  },
  {
    n: 14,
    title: "Security testing basics",
    summary:
      "Five questions you can ask of any web product without being a hacker. These are the findings that stop a release.",
    days: [
      {
        n: 1,
        title: "Access control: can a low role act high",
        objectives: [
          "Define RBAC",
          "Test a low-privilege account against a high action",
          "Explain why login is not permission",
        ],
      },
      {
        n: 2,
        title: "Tenant isolation, and changing an ID",
        objectives: [
          "Explain multi-tenancy",
          "Run the changed-ID test",
          "Recognise an IDOR when you see one",
        ],
      },
      {
        n: 3,
        title: "Sensitive data in responses",
        objectives: [
          "Read a raw response for things that should not be there",
          "List what must never reach a browser",
          "Write this finding without leaking it again",
        ],
      },
      {
        n: 4,
        title: "Authentication: is every door locked",
        objectives: [
          "Retry a request with the auth removed",
          "Test a deactivated account",
          "Report an open endpoint responsibly",
        ],
      },
      {
        n: 5,
        title: "Input validation and uploads",
        objectives: [
          "Send input a server should reject",
          "Test an upload with a wrong type and size",
          "Explain why browser validation is not enough",
        ],
      },
      {
        n: 6,
        title: "Practice: the five-check sweep",
        objectives: [
          "Run all five checks on one product",
          "Rank findings by damage, not visibility",
          "Write the summary a decision-maker can act on",
        ],
      },
    ],
  },
  {
    n: 15,
    title: "Automated testing",
    summary:
      "Where manual testing stops scaling. Enough JavaScript to be dangerous, then Playwright.",
    days: [
      {
        n: 1,
        title: "Why automate, and what never to automate",
        objectives: [
          "Choose automation candidates by repetition and stability",
          "Name three things to keep manual",
          "Explain the maintenance cost honestly",
        ],
      },
      {
        n: 2,
        title: "The JavaScript you need for test scripts",
        objectives: [
          "Use variables, functions, arrays and objects",
          "Read async code without fear",
          "Debug a script from its error",
        ],
      },
      {
        n: 3,
        title: "Playwright: your first script",
        objectives: [
          "Install and run a test",
          "Navigate, click and type in code",
          "Read a failure report",
        ],
      },
      {
        n: 4,
        title: "Selectors that do not break",
        objectives: [
          "Prefer roles and labels over CSS paths",
          "Explain why a brittle selector costs more than it saves",
          "Fix a flaky test",
        ],
      },
      {
        n: 5,
        title: "Assertions, fixtures and CI",
        objectives: [
          "Assert on visible outcomes",
          "Set up and tear down state",
          "Run the suite on every push",
        ],
      },
      {
        n: 6,
        title: "Practice: automate a login flow",
        objectives: [
          "Cover success and three failure paths",
          "Keep credentials out of the code",
          "Make it pass twice in a row",
        ],
      },
    ],
  },
  {
    n: 16,
    title: "The support function",
    summary:
      "How work reaches you, how you order it, and how nothing gets silently dropped.",
    days: [
      {
        n: 1,
        title: "What technical support actually does",
        objectives: [
          "Describe the role to someone outside tech",
          "Draw the line between support and engineering",
          "Name the judgement you are paid for",
        ],
      },
      {
        n: 2,
        title: "Channels, triage and one record per customer",
        objectives: [
          "Explain why first-come-first-served fails",
          "Triage by urgency and impact",
          "Say why every channel must land in one record",
        ],
      },
      {
        n: 3,
        title: "Tickets, categories and ownership",
        objectives: [
          "Write a ticket a colleague could pick up cold",
          "Categorise accurately",
          "Keep ownership clear through a handoff",
        ],
      },
      {
        n: 4,
        title: "Priority, SLAs and business hours",
        objectives: [
          "Place a ticket in P1 to P4 correctly",
          "Explain an SLA measured in business hours",
          "Defend a priority decision",
        ],
      },
      {
        n: 5,
        title: "The five-step resolution framework",
        objectives: [
          "Apply the framework to an unfamiliar problem",
          "State closure criteria before you start",
          "Know when step four is the right answer",
        ],
      },
      {
        n: 6,
        title: "Practice: triage a queue of fifteen",
        objectives: [
          "Order a realistic queue and justify it",
          "Spot the two that are actually one problem",
          "Draft first responses for the top three",
        ],
      },
    ],
  },
  {
    n: 17,
    title: "Diagnosing",
    summary:
      "Turning 'it's broken' into a specific, evidenced statement about what failed and where.",
    days: [
      {
        n: 1,
        title: "The question that saves an hour",
        objectives: [
          "Ask for the exact error, time and account every time",
          "Avoid the guessing trap",
          "Write a first reply that gathers everything at once",
        ],
      },
      {
        n: 2,
        title: "Reproducing a customer's problem",
        objectives: [
          "Rebuild their conditions safely",
          "Decide when not to reproduce on live",
          "Handle 'works for me'",
        ],
      },
      {
        n: 3,
        title: "Reading logs",
        objectives: [
          "Find the relevant lines in a wall of output",
          "Correlate a log entry to a request",
          "Quote a log safely in a ticket",
        ],
      },
      {
        n: 4,
        title: "Frontend or backend: deciding from evidence",
        objectives: [
          "Use the Network tab to assign a problem",
          "Tell 'no request sent' from 'request failed'",
          "Route to the right team first time",
        ],
      },
      {
        n: 5,
        title: "Known issues and user error",
        objectives: [
          "Check the knowledge base before investigating",
          "Tell a user they made a mistake, kindly",
          "Turn a repeated user error into a product finding",
        ],
      },
      {
        n: 6,
        title: "Practice: six tickets, six diagnoses",
        objectives: [
          "Diagnose each from evidence alone",
          "Name the owning team for each",
          "Write the escalation for the two that need it",
        ],
      },
    ],
  },
  {
    n: 18,
    title: "Writing and escalating",
    summary:
      "The same facts, written for two completely different readers. Most of your influence travels through your writing.",
    days: [
      {
        n: 1,
        title: "Writing to a worried customer",
        objectives: [
          "Acknowledge, own, next step, time",
          "Write without jargon",
          "Calm a situation in three sentences",
        ],
      },
      {
        n: 2,
        title: "Writing to a busy engineer",
        objectives: [
          "Give steps, expected, actual and evidence",
          "Cut everything they do not need",
          "Pass the no-follow-up-questions test",
        ],
      },
      {
        n: 3,
        title: "Delivering bad news and setting expectations",
        objectives: [
          "Say no early, plainly and kindly",
          "Promise a time and keep it",
          "Update when there is no news",
        ],
      },
      {
        n: 4,
        title: "The escalation matrix",
        objectives: [
          "Map problem types to owners",
          "Include impact in every escalation",
          "Keep the customer informed while escalated",
        ],
      },
      {
        n: 5,
        title: "Closure criteria and follow-up",
        objectives: [
          "Close only when the condition is met",
          "Confirm with the customer first",
          "Record the fix for the next person",
        ],
      },
      {
        n: 6,
        title: "Practice: rewrite ten bad replies",
        objectives: [
          "Diagnose what each reply does wrong",
          "Rewrite for the right audience",
          "Compare against a model answer",
        ],
      },
    ],
  },
  {
    n: 19,
    title: "The domain: money and systems",
    summary:
      "Most technical support jobs sit near payments. This week makes you fluent in the questions customers actually ask.",
    days: [
      {
        n: 1,
        title: "How an online payment moves",
        objectives: [
          "Name the four parties in a card payment",
          "Follow one payment end to end",
          "Explain what a gateway does and does not do",
        ],
      },
      {
        n: 2,
        title: "Authorization versus settlement",
        objectives: [
          "Explain the difference in one sentence",
          "Answer 'it says success but I have no money'",
          "Say why settlement runs on a schedule",
        ],
      },
      {
        n: 3,
        title: "Webhooks, callbacks and verification",
        objectives: [
          "Name which of the three is the source of truth",
          "Diagnose 'paid but the order is not marked paid'",
          "Explain why a browser return proves nothing",
        ],
      },
      {
        n: 4,
        title: "Refunds, chargebacks and disputes",
        objectives: [
          "Tell the three apart",
          "Explain the timeline of a chargeback",
          "Handle a dispute between two customers",
        ],
      },
      {
        n: 5,
        title: "Identity, KYC and why documents are asked for",
        objectives: [
          "Explain KYC without apologising for it",
          "List what a business must usually provide",
          "Handle a customer who refuses",
        ],
      },
      {
        n: 6,
        title: "Practice: ten payment tickets",
        objectives: [
          "Resolve or escalate each correctly",
          "Write the customer reply for each",
          "Spot the one that is a compliance matter",
        ],
      },
    ],
  },
  {
    n: 20,
    title: "Thinking in automation",
    summary:
      "The judgement half. Choosing what to automate is worth more than knowing any tool.",
    days: [
      {
        n: 1,
        title: "What is worth automating",
        objectives: [
          "Score a process by frequency, stability and cost",
          "Reject a bad candidate with reasons",
          "Explain why fewer working pieces beat many broken ones",
        ],
      },
      {
        n: 2,
        title: "Triggers, schedules and events",
        objectives: [
          "Choose between schedule, webhook and manual",
          "Explain timezones and why they bite",
          "Design a trigger that cannot fire twice",
        ],
      },
      {
        n: 3,
        title: "Mapping a process before building it",
        objectives: [
          "Draw a process as steps, owners and systems",
          "Find the step that has no owner",
          "Spot the decision nobody writes down",
        ],
      },
      {
        n: 4,
        title: "Sources of truth and where records live",
        objectives: [
          "Name the one system that owns each fact",
          "Recognise a missing-record problem",
          "Explain why two sources always drift",
        ],
      },
      {
        n: 5,
        title: "The cost of a bad automation",
        objectives: [
          "List the ways automation makes things worse",
          "Explain silent failure",
          "Decide when manual is the right answer",
        ],
      },
      {
        n: 6,
        title: "Practice: map and score five processes",
        objectives: [
          "Map each as a diagram",
          "Score and rank them",
          "Write the one-paragraph proposal for the winner",
        ],
      },
    ],
  },
  {
    n: 21,
    title: "Building workflows",
    summary:
      "Hands on the canvas. n8n, because it is the spine most small teams actually run.",
    days: [
      {
        n: 1,
        title: "n8n: the canvas and your first workflow",
        objectives: [
          "Create, run and read a workflow",
          "Understand items flowing between nodes",
          "Save and name it to a convention",
        ],
      },
      {
        n: 2,
        title: "Nodes, connections and data flow",
        objectives: [
          "Pass data between nodes",
          "Use expressions to reference earlier output",
          "Debug by reading each node's output",
        ],
      },
      {
        n: 3,
        title: "The HTTP Request node: calling any API",
        objectives: [
          "Call an API with auth from a credential",
          "Send a JSON body built from earlier data",
          "Handle a non-200 response deliberately",
        ],
      },
      {
        n: 4,
        title: "Code nodes: when logic leaves the canvas",
        objectives: [
          "Apply the rule that code decides and the canvas moves data",
          "Write a Code node that transforms items",
          "Explain why ten nested IFs are a smell",
        ],
      },
      {
        n: 5,
        title: "Data tables and shared state",
        objectives: [
          "Design a table two workflows can share",
          "Upsert without creating duplicates",
          "Explain why state does not live in a document",
        ],
      },
      {
        n: 6,
        title: "Practice: build a three-step workflow",
        objectives: [
          "Trigger, call, record",
          "Run it twice with no duplicates",
          "Document it on one page",
        ],
      },
    ],
  },
  {
    n: 22,
    title: "Reliability",
    summary:
      "The difference between a demo and something a business can depend on. This week is why people get hired.",
    days: [
      {
        n: 1,
        title: "Retries, timeouts and backoff",
        objectives: [
          "Set retries on every external call",
          "Choose a sensible timeout",
          "Explain why retrying a POST is dangerous",
        ],
      },
      {
        n: 2,
        title: "Idempotency: running twice safely",
        objectives: [
          "Design an idempotency key",
          "Make a workflow safe to re-run",
          "Prove it with the run-twice test",
        ],
      },
      {
        n: 3,
        title: "Error workflows and alerting",
        objectives: [
          "Attach an error handler to everything",
          "Alert on two channels, and verify delivery",
          "Avoid alert fatigue",
        ],
      },
      {
        n: 4,
        title: "Run logs and what to record",
        objectives: [
          "Decide what every run must write",
          "Explain why execution history is not a record",
          "Query your own log to answer a question",
        ],
      },
      {
        n: 5,
        title: "Heartbeats and expected windows",
        objectives: [
          "Detect a job that never ran",
          "Give each job an expected frequency",
          "Distinguish paused, nothing-to-do, skipped and failed",
        ],
      },
      {
        n: 6,
        title: "Practice: break it on purpose",
        objectives: [
          "Cause a real failure",
          "Confirm the alert arrived on both channels",
          "Write the runbook entry from what you learned",
        ],
      },
    ],
  },
  {
    n: 23,
    title: "AI in a workflow",
    summary:
      "Using a model as one reliable step among many, not as magic. Including when to use no model at all.",
    days: [
      {
        n: 1,
        title: "What a language model can and cannot do",
        objectives: [
          "Describe what a model is actually doing",
          "List tasks it suits and tasks it does not",
          "Explain why it must never be trusted to count",
        ],
      },
      {
        n: 2,
        title: "Prompts as specifications",
        objectives: [
          "Write a prompt with role, input, rules and output",
          "Version a prompt like code",
          "Test a prompt against edge cases",
        ],
      },
      {
        n: 3,
        title: "Structured output you can trust",
        objectives: [
          "Require a fixed JSON shape",
          "Validate the output before using it",
          "Handle the case where the model returns nonsense",
        ],
      },
      {
        n: 4,
        title: "When to use no model at all",
        objectives: [
          "Spot arithmetic dressed up as a reasoning task",
          "Replace a model step with code",
          "Explain the cost of an unnecessary model call",
        ],
      },
      {
        n: 5,
        title: "Cost, latency and model routing",
        objectives: [
          "Estimate the cost of a workflow run",
          "Route easy steps to cheaper models",
          "Batch and cache sensibly",
        ],
      },
      {
        n: 6,
        title: "Practice: a classifier step",
        objectives: [
          "Classify inbound messages into four buckets",
          "Measure accuracy on twenty held-out examples",
          "Decide whether it is good enough to ship",
        ],
      },
    ],
  },
  {
    n: 24,
    title: "Agents",
    summary:
      "The part everyone wants to build first and should build last. What an agent is, and how to bound one.",
    days: [
      {
        n: 1,
        title: "Workflow versus agent: the test",
        objectives: [
          "Apply the test: can the steps be written in advance",
          "Classify five tasks correctly",
          "Explain why calling everything an agent is a problem",
        ],
      },
      {
        n: 2,
        title: "Tools, and giving an agent safe hands",
        objectives: [
          "Expose a capability as a narrow tool",
          "Explain why an agent never holds raw credentials",
          "Design a tool that cannot do damage",
        ],
      },
      {
        n: 3,
        title: "Bounding an agent: budgets and stop conditions",
        objectives: [
          "Cap steps, time and spend",
          "Write a stop condition",
          "Handle an agent that loops",
        ],
      },
      {
        n: 4,
        title: "Human approval gates",
        objectives: [
          "Build a gate that pauses for a named person",
          "Record who approved and when",
          "Prevent the wrong person approving",
        ],
      },
      {
        n: 5,
        title: "Drafting, never sending",
        objectives: [
          "Explain draft-and-hold as a permanent design, not a safety setting",
          "Verify a draft was created and not sent",
          "Design the check that catches a send-by-accident",
        ],
      },
      {
        n: 6,
        title: "Practice: design an agent brief",
        objectives: [
          "Justify the agent against the test",
          "Specify its tools, bounds and gate",
          "Write what it must never do",
        ],
      },
    ],
  },
  {
    n: 25,
    title: "Trust and governance",
    summary:
      "What separates an automation a business will run from a clever demo nobody is allowed to turn on.",
    days: [
      {
        n: 1,
        title: "Never invent data",
        objectives: [
          "Explain why fabricated test data is still a defect",
          "Flag missing as missing",
          "Spot a system presenting a guess as a fact",
        ],
      },
      {
        n: 2,
        title: "Audit trails and naming the approver",
        objectives: [
          "Record who did what, when, and from what evidence",
          "Explain why a channel is not a person",
          "Reconstruct a decision from the log",
        ],
      },
      {
        n: 3,
        title: "Secrets, credentials and rotation",
        objectives: [
          "Store credentials correctly",
          "Make an expiry loud instead of silent",
          "Audit where secrets are exposed today",
        ],
      },
      {
        n: 4,
        title: "Data protection and adding a new tool",
        objectives: [
          "Ask the questions before connecting anything",
          "Explain training and retention risk",
          "Write the one-page request for approval",
        ],
      },
      {
        n: 5,
        title: "Evals: proving a prompt still works",
        objectives: [
          "Write a fixed test case for a model step",
          "Run evals automatically on change",
          "Decide a pass threshold",
        ],
      },
      {
        n: 6,
        title: "Practice: write five eval cases",
        objectives: [
          "Cover a rule, an edge case and a refusal",
          "Use only invented data",
          "Run them and record the baseline",
        ],
      },
    ],
  },
  {
    n: 26,
    title: "Shipping and handover",
    summary:
      "Work that survives you. The final week turns everything built into something a team can own.",
    days: [
      {
        n: 1,
        title: "Documentation a stranger can follow",
        objectives: [
          "Write what it does, where it lives, what breaks it, how to fix it, who to call",
          "Open every document with an executive summary",
          "Test a page by handing it to someone else",
        ],
      },
      {
        n: 2,
        title: "Runbooks for when it breaks",
        objectives: [
          "Write recovery steps for three failure modes",
          "Include how to re-run safely",
          "Prove the runbook by following it",
        ],
      },
      {
        n: 3,
        title: "Versioning and a repo as source of truth",
        objectives: [
          "Use git for config and prompts",
          "Explain why the repo beats the platform",
          "Mirror a live system into version control",
        ],
      },
      {
        n: 4,
        title: "Measuring whether it helped",
        objectives: [
          "Pick a metric before you build",
          "Measure the before and after honestly",
          "Resist gaming your own number",
        ],
      },
      {
        n: 5,
        title: "Teaching someone else to own it",
        objectives: [
          "Run a walkthrough where they drive",
          "Write the knowledge down as you go",
          "Explain why being replaceable makes you valuable",
        ],
      },
      {
        n: 6,
        title: "Capstone: ship one automation end to end",
        objectives: [
          "Build, test, document and hand over one real workflow",
          "Meet the full definition of done",
          "Present it in five minutes",
        ],
      },
    ],
  },
];

export const TOTAL_DAYS = WEEKS.reduce((sum, week) => sum + week.days.length, 0);

export function getWeek(n: number): Week | undefined {
  return WEEKS.find((week) => week.n === n);
}

export function getDay(weekNumber: number, dayNumber: number): Day | undefined {
  return getWeek(weekNumber)?.days.find((day) => day.n === dayNumber);
}

export function phaseOf(weekNumber: number): Phase | undefined {
  return PHASES.find((phase) => weekNumber >= phase.from && weekNumber <= phase.to);
}

/** Stable key used for progress rows and lesson lookup, e.g. "w03d05". */
export function dayKey(weekNumber: number, dayNumber: number): string {
  return `w${String(weekNumber).padStart(2, "0")}d${String(dayNumber).padStart(2, "0")}`;
}

/** The day before and after, for lesson navigation. */
export function neighbours(weekNumber: number, dayNumber: number) {
  const flat = WEEKS.flatMap((week) =>
    week.days.map((day) => ({ week: week.n, day: day.n })),
  );
  const index = flat.findIndex(
    (item) => item.week === weekNumber && item.day === dayNumber,
  );
  return {
    previous: index > 0 ? flat[index - 1] : null,
    next: index >= 0 && index < flat.length - 1 ? flat[index + 1] : null,
    index,
    total: flat.length,
  };
}
