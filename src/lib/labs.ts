/**
 * The lab engine.
 *
 * A lab is a real, running copy of Meridian with specific defects switched on,
 * a brief, and a hidden answer key. You test it the way you would test a real
 * product — in a browser, with a console and a network panel — then file what
 * you found and the lab marks your coverage against the key.
 *
 * The answer key lives here, in the parent app. Meridian itself only ever
 * receives the list of defect ids to enable, never their descriptions, so
 * reading the page source cannot hand you the answers.
 */

export type Severity = "critical" | "high" | "medium" | "low";

export type Defect = {
  id: string;
  /** One line, as it would appear in a bug report title. */
  title: string;
  /** Where to look. Shown only after grading. */
  where: string;
  severity: Severity;
  /** Why that severity, in a sentence. Shown after grading. */
  reasoning: string;
  /** How a good tester would have found it. Shown after grading. */
  howToFind: string;
};

export type LabStage = {
  n: number;
  title: string;
  brief: string;
  /** What the tester is asked to do, in order. */
  steps: string[];
  /** Defect ids switched on in Meridian for this stage. */
  defects: string[];
};

export type Lab = {
  id: string;
  title: string;
  /** Which week of the course this belongs beside. */
  week: number;
  level: "beginner" | "intermediate" | "senior";
  summary: string;
  /** What skill this lab is really training. */
  trains: string;
  /** Minutes, honestly estimated. */
  minutes: number;
  stages: LabStage[];
};

/**
 * Every defect Meridian can be asked to exhibit.
 *
 * Adding one here is half the work; the other half is implementing the
 * behaviour in src/lib/meridian/. A defect with no implementation simply never
 * appears, which would make a lab unwinnable, so `npm run validate` checks
 * that every id referenced by a lab is implemented.
 */
export const DEFECTS: Record<string, Defect> = {
  "price-rounding": {
    id: "price-rounding",
    title: "Prices with a trailing zero display with one decimal place",
    where: "Catalogue and product page, any item priced like 12,500.50",
    severity: "medium",
    reasoning:
      "Money shown wrong erodes trust immediately, and it is visible to every customer. It is not critical because the amount charged is correct; only the display is wrong.",
    howToFind:
      "Scan the catalogue for prices that do not all have the same number of decimal places. Inconsistent formatting in a column is a strong smell.",
  },
  "oos-addable": {
    id: "oos-addable",
    title: "An out-of-stock item can still be added to the cart",
    where: "Product card marked Out of stock, and its product page",
    severity: "high",
    reasoning:
      "The customer completes a purchase for something that cannot be shipped, which produces a refund, a complaint and a support ticket.",
    howToFind:
      "Never trust a disabled-looking control. Find the item the UI says is unavailable and try to buy it anyway.",
  },
  "qty-ignored": {
    id: "qty-ignored",
    title: "Cart total ignores quantity for items added more than once",
    where: "Cart, after adding the same product twice",
    severity: "critical",
    reasoning:
      "The customer is charged less than they owe, or more, depending on the path. Money is wrong, which is always the top band.",
    howToFind:
      "Add the same item twice rather than once. Arithmetic you can do in your head is the easiest thing in the world to check, and it is skipped constantly.",
  },
  "badge-stale": {
    id: "badge-stale",
    title: "Cart badge does not update until the page is reloaded",
    where: "Header, after adding an item",
    severity: "low",
    reasoning:
      "Nothing is lost and the cart is correct underneath. It is a confidence problem rather than a money problem.",
    howToFind:
      "Watch the whole screen after an action, not just the part you clicked.",
  },
  "email-unvalidated": {
    id: "email-unvalidated",
    title: "Checkout accepts an email address with no @ sign",
    where: "Checkout form, email field",
    severity: "high",
    reasoning:
      "The order succeeds but no confirmation can ever reach the customer, and support has no way to contact them.",
    howToFind:
      "Boundary and negative input. Put obviously invalid data in every field and see which ones the server actually refuses.",
  },
  "qty-negative": {
    id: "qty-negative",
    title: "Quantity accepts zero and negative numbers",
    where: "Product page quantity field",
    severity: "high",
    reasoning:
      "A negative quantity produces a negative line total, which reduces the order value. That is a money defect reachable by any customer.",
    howToFind:
      "Type into a number field rather than only using the arrows. Try 0, -1, and 9999.",
  },
  "double-submit": {
    id: "double-submit",
    title: "Double-clicking Place order creates two orders",
    where: "Checkout, the submit button",
    severity: "critical",
    reasoning:
      "The customer is charged twice. This is the classic non-idempotent POST and it is the single most expensive bug on this list.",
    howToFind:
      "Click submit twice, quickly. Then check the network panel for two POSTs and the confirmation for two order ids.",
  },
  "discount-stacks": {
    id: "discount-stacks",
    title: "The same discount code can be applied repeatedly",
    where: "Cart, discount field",
    severity: "critical",
    reasoning:
      "Applied enough times the order total reaches zero. Anyone who notices can take goods for free.",
    howToFind:
      "Do the allowed thing twice. Most validation checks that a code is valid, not that it has already been used.",
  },
  "console-error": {
    id: "console-error",
    title: "Product page logs an uncaught TypeError on load",
    where: "Console, on any product page",
    severity: "medium",
    reasoning:
      "Nothing visibly breaks today, but an uncaught error means a code path is failing and the next change may surface it to customers.",
    howToFind:
      "Open the console before you navigate, not after. Red lines are evidence even when the page looks fine.",
  },
  "stock-not-decremented": {
    id: "stock-not-decremented",
    title: "Stock count does not decrease after an order is placed",
    where: "Catalogue, after completing checkout",
    severity: "high",
    reasoning:
      "The shop will oversell. Every subsequent customer can buy inventory that no longer exists.",
    howToFind:
      "Check the state of the world after an action, not just the success message. Note the stock, buy one, go back.",
  },
};

export const LABS: Lab[] = [
  {
    id: "meridian-smoke",
    title: "Meridian: first contact",
    week: 4,
    level: "beginner",
    summary:
      "Your first pass over the product you will be testing for the rest of the course. Learn the shop, then find what is wrong with it.",
    trains:
      "Exploratory testing, and the habit of checking arithmetic and state rather than trusting a success message.",
    minutes: 45,
    stages: [
      {
        n: 1,
        title: "Learn the product",
        brief:
          "Before you can test something you have to know what it is meant to do. Walk the whole happy path once, without trying to break anything. Buy one item, start to finish.",
        steps: [
          "Open the catalogue and read it. Note what each product card shows you.",
          "Open one product. Note every control on the page.",
          "Add it to the cart and go to the cart.",
          "Complete checkout with sensible details and reach the confirmation.",
          "Write down, in one sentence each, what the five screens are for.",
        ],
        defects: [],
      },
      {
        n: 2,
        title: "Surface defects",
        brief:
          "Now test it. Everything on this stage is visible from the catalogue, the product page and the cart, without touching checkout. Find what is wrong and file each one.",
        steps: [
          "Compare every price in the catalogue. Are they formatted consistently?",
          "Find the item marked out of stock and try to buy it.",
          "Add the same item to your cart twice and check the total by hand.",
          "Watch the header carefully as you add something.",
          "Open the console before you load a product page.",
        ],
        defects: [
          "price-rounding",
          "oos-addable",
          "qty-ignored",
          "badge-stale",
          "console-error",
        ],
      },
      {
        n: 3,
        title: "Input and money",
        brief:
          "The expensive ones. Everything here involves a field that accepts something it should not, or money that comes out wrong. Two of these are critical.",
        steps: [
          "Type directly into the quantity field. Try 0 and -1.",
          "Try to check out with an email address that is not an address.",
          "Apply the discount code SAVE10, then apply it again.",
          "Click Place order twice, quickly, and watch the network panel.",
          "Note the stock of an item, buy it, then go back to the catalogue.",
        ],
        defects: [
          "qty-negative",
          "email-unvalidated",
          "discount-stacks",
          "double-submit",
          "stock-not-decremented",
        ],
      },
    ],
  },

  {
    id: "meridian-money",
    title: "Meridian: follow the money",
    week: 11,
    level: "intermediate",
    summary:
      "Three defects that all end with a wrong number. Find each one, then write the report an engineer could act on without asking you anything.",
    trains:
      "Checking arithmetic by hand rather than trusting a total, and writing the report that makes a defect fixable.",
    minutes: 60,
    stages: [
      {
        n: 1,
        title: "Check every total by hand",
        brief:
          "A total is the easiest thing in a shop to get wrong and the hardest to notice, because a plausible number looks exactly like a correct one. Do the arithmetic yourself at every step.",
        steps: [
          "Add one item. Write down the price you expect and compare it with the cart.",
          "Add the same item again. Multiply it out on paper first.",
          "Apply SAVE10 and calculate the discount yourself before you look.",
          "Apply SAVE10 a second time and work out what the total should now be.",
          "For each disagreement, record the expected and the actual as exact figures.",
        ],
        defects: ["qty-ignored", "discount-stacks", "price-rounding"],
      },
      {
        n: 2,
        title: "Reduce each one",
        brief:
          "You now have three defects found by exploring. Nobody can act on twenty minutes of clicking, so cut each to the shortest sequence that still triggers it.",
        steps: [
          "Take one defect and write down every step you took.",
          "Remove a step. Does it still happen? Keep removing until it stops.",
          "Note what the removal taught you about the real cause.",
          "Do the same for the other two.",
          "Check whether any two are the same defect wearing different clothes.",
        ],
        defects: ["qty-ignored", "discount-stacks", "price-rounding"],
      },
      {
        n: 3,
        title: "Write them up",
        brief:
          "Three reports, to the week 11 standard. Someone who has never seen Meridian should be able to reproduce each one without asking you a single question.",
        steps: [
          "Write a title for each: what happens, where, under what condition.",
          "Give the environment, the minimal steps, expected and actual with exact figures.",
          "Rate severity and priority, and say why in one line if they differ.",
          "Describe the system, never the person who wrote it.",
          "Check every report for a credential before you call it finished.",
        ],
        defects: ["qty-ignored", "discount-stacks", "price-rounding"],
      },
    ],
  },

  {
    id: "meridian-api",
    title: "Meridian: below the screen",
    week: 13,
    level: "intermediate",
    summary:
      "Test the orders endpoint directly. The screen refuses things the server happily accepts, and the only way to see that is to stop using the screen.",
    trains:
      "API testing: asserting on status, shape and value, and on the side effect rather than only the response.",
    minutes: 75,
    stages: [
      {
        n: 1,
        title: "Read the endpoint",
        brief:
          "Before testing an API you have to know what it promises. Use the browser console and fetch — no tool and no account needed.",
        steps: [
          "GET /api/meridian/products and read the shape of one product.",
          "Note that money is an integer in minor units. 4850000 is NGN 48,500.00.",
          "POST a valid order and record the status and the whole response body.",
          "GET the orders list and find the order you just created.",
          "Write down, for a valid order, what status and which fields you expect.",
        ],
        defects: [],
      },
      {
        n: 2,
        title: "Send what the form refuses",
        brief:
          "Client validation is convenience, not a control. Everything the checkout form blocks, send directly and see whether the server also refuses it.",
        steps: [
          "POST an order with quantity 0, then -1. Expect 422, not 201.",
          "POST with an email that has no @ sign.",
          "POST with no items at all, and with a productId that does not exist.",
          "POST deliberately malformed JSON. A 500 here is a finding on its own.",
          "After every rejection, GET the orders list and confirm nothing was created.",
        ],
        defects: ["qty-negative", "email-unvalidated"],
      },
      {
        n: 3,
        title: "Assert on the side effect",
        brief:
          "The response can be perfectly correct while the stored state is wrong. These two are invisible from the response alone, which is the whole lesson.",
        steps: [
          "Record a product's stock. Order two of it. Read the stock again.",
          "Send the same order twice in quick succession and count the orders.",
          "For each, say whether the response was correct and whether the state was.",
          "Write the case that would have caught each, including its second call.",
          "Decide which layer each defect belongs to: the screen, or the server.",
        ],
        defects: ["stock-not-decremented", "double-submit"],
      },
    ],
  },

  {
    id: "meridian-regression",
    title: "Meridian: the regression pass",
    week: 12,
    level: "senior",
    summary:
      "A change has shipped to the discount handler. You have forty minutes before the release window closes. Decide what to re-run, run it, and write the summary.",
    trains:
      "Choosing a regression set you can defend, and reporting what you did not test as deliberately as what you did.",
    minutes: 60,
    stages: [
      {
        n: 1,
        title: "Choose the set",
        brief:
          "The change is one line in the cart's discount handler. You cannot re-run everything, so decide what to run before you run anything — and be able to say why.",
        steps: [
          "List what the change can reach through code, and through data.",
          "Decide which areas are high risk regardless of what changed.",
          "Write your set down, with a minute estimate against each.",
          "Write down what you are deliberately not running, and why.",
          "Check the total fits inside forty minutes before you start.",
        ],
        defects: [],
      },
      {
        n: 2,
        title: "Run the smoke test first",
        brief:
          "Ten minutes, wide and shallow: one path through every major area. If something fundamental is broken, stop and reject the build rather than testing around it.",
        steps: [
          "Catalogue loads and prices are formatted consistently.",
          "A product page opens without console errors.",
          "Add to cart updates the cart and the header.",
          "Checkout reaches payment and an order completes.",
          "Record pass, fail or blocked for each as you go, not at the end.",
        ],
        defects: ["price-rounding", "badge-stale", "console-error"],
      },
      {
        n: 3,
        title: "Run the set and write the summary",
        brief:
          "Now the areas you chose. Then the deliverable: a summary a release decision can be made from, including an assessment that is yours to make.",
        steps: [
          "Re-run the discount cases, including applying a code twice.",
          "Check the cart total and the tax line, which the discount feeds.",
          "Smoke the checkout path, since it is downstream of the total.",
          "Write the counts: cases run, passed, failed, blocked.",
          "State what you did not run and why, then give a ready or not-ready call.",
        ],
        defects: ["discount-stacks", "qty-ignored", "double-submit"],
      },
    ],
  },

  {
    id: "meridian-markup",
    title: "Meridian: read the page",
    week: 2,
    level: "beginner",
    summary:
      "Open the Elements panel on a real shop and learn to read what a page is actually made of, before you try to test one.",
    trains:
      "Reading HTML in DevTools, and telling what a page says from what it renders.",
    minutes: 40,
    stages: [
      {
        n: 1,
        title: "Find the structure",
        brief:
          "Every page is a tree. Open Elements and find the trunk before you worry about the leaves.",
        steps: [
          "Open DevTools and select the Elements panel.",
          "Find the header, the main region and the list of products.",
          "Expand one product card and write down every element inside it.",
          "Use the picker to click a price, and note which element it lands on.",
          "Say in one sentence what the page would look like with CSS removed.",
        ],
        defects: [],
      },
      {
        n: 2,
        title: "Attributes carry the meaning",
        brief:
          "The tag says what something is; the attributes say which one it is and what it does. Testers live in the attributes.",
        steps: [
          "Find the Add to cart button and read all of its attributes.",
          "Find an image and check whether it has an alt attribute.",
          "Find a link and note where its href points.",
          "Find anything with a data- attribute and work out what it is for.",
          "Identify one element you could use to find this button reliably.",
        ],
        defects: [],
      },
      {
        n: 3,
        title: "What the markup already tells you",
        brief:
          "You have not tested anything yet and the page has already admitted to one problem. Read carefully.",
        steps: [
          "Find the item marked out of stock and read its card's markup.",
          "Check whether its button is disabled, or only looks unavailable.",
          "Try the button and see which of the two it was.",
          "Open the console as a product page loads and read what appears.",
          "File both as bug reports with the markup as your evidence.",
        ],
        defects: ["oos-addable", "console-error"],
      },
    ],
  },

  {
    id: "meridian-network",
    title: "Meridian: watch the traffic",
    week: 5,
    level: "beginner",
    summary:
      "Every click is a request. Open the Network panel and learn to read what the shop actually sends and what comes back.",
    trains:
      "Reading the Network panel: method, path, status, payload, and the timing of a request.",
    minutes: 45,
    stages: [
      {
        n: 1,
        title: "One request, end to end",
        brief:
          "Before you look for problems, watch one ordinary request all the way through.",
        steps: [
          "Open the Network panel and tick Preserve log before you start.",
          "Load the catalogue and count the requests the page makes.",
          "Find the request that fetches the products and open it.",
          "Read its method, path and status, then read the response body.",
          "Write down which part of the page each field in that body became.",
        ],
        defects: [],
      },
      {
        n: 2,
        title: "Status and payload",
        brief:
          "A status tells you what kind of thing happened. A payload tells you what actually happened. You need both.",
        steps: [
          "Place a valid order and find the POST in the panel.",
          "Record its status, then read every field in the request body.",
          "Read the response body and check the total against your own arithmetic.",
          "Note how money is represented, and why it is not a decimal.",
          "Compare what the screen showed you with what the response said.",
        ],
        defects: ["price-rounding"],
      },
      {
        n: 3,
        title: "When the screen and the traffic disagree",
        brief:
          "The panel is the referee. Where the page and the network tell different stories, the network is the one to believe.",
        steps: [
          "Add an item and watch the header count as the request completes.",
          "Reload, and see whether the header now agrees with the cart.",
          "Decide from the traffic whether the data or the display is wrong.",
          "Add the same item twice and check the total against the payload.",
          "File each one, saying which side of the screen the defect is on.",
        ],
        defects: ["badge-stale", "qty-ignored"],
      },
    ],
  },

  {
    id: "meridian-console",
    title: "Meridian: the console and what is stored",
    week: 6,
    level: "beginner",
    summary:
      "Errors nobody reads, and the data a site keeps in your browser. Two panels, and both are checked in seconds.",
    trains:
      "Treating console errors as defects, and auditing what a product stores client-side.",
    minutes: 35,
    stages: [
      {
        n: 1,
        title: "Open the console first",
        brief:
          "A console error that nobody looks at is a bug nobody files. Open it before you load the page, not after.",
        steps: [
          "Open the console and clear it.",
          "Load a product page and read everything that appears.",
          "Note the error type, the message, and the file and line.",
          "Decide whether the page still works despite it.",
          "Write the report, with the stack as evidence.",
        ],
        defects: ["console-error"],
      },
      {
        n: 2,
        title: "What the shop keeps",
        brief:
          "Open Application and look at storage. You are checking for anything that should not be sitting in a browser.",
        steps: [
          "List every key in localStorage and sessionStorage.",
          "For each, say in a word what it is for.",
          "Look for anything that resembles a credential or personal data.",
          "Check the cookies, and note any flags you can see.",
          "Say which of these would matter on a shared computer.",
        ],
        defects: [],
      },
      {
        n: 3,
        title: "State that outlives the page",
        brief:
          "Stored state is where stale data hides. Change something, reload, and see whether the two agree.",
        steps: [
          "Add an item, then reload and compare the header with the cart.",
          "Work out which of the two is reading stale state.",
          "Clear storage, reload, and see whether the symptom changes.",
          "Say whether this is a data defect or a display defect, with evidence.",
          "File it, naming exactly what disagrees with what.",
        ],
        defects: ["badge-stale"],
      },
    ],
  },

  {
    id: "meridian-curl",
    title: "Meridian: call the API by hand",
    week: 8,
    level: "beginner",
    summary:
      "Leave the browser. Talk to the shop's API directly, and find out what it will accept when no form is in the way.",
    trains:
      "Composing requests by hand, reading a JSON response, and understanding path, query and body.",
    minutes: 45,
    stages: [
      {
        n: 1,
        title: "Read before you write",
        brief:
          "Start with the safe verb. A GET cannot break anything, and it teaches you the shape of everything else.",
        steps: [
          "GET /api/meridian/products from the console with fetch.",
          "Print the status, then the body, then one product on its own.",
          "Identify which field is the id, and which is the price.",
          "GET a single order by its reference and compare the shapes.",
          "Write down the three fields you would assert on for any product.",
        ],
        defects: [],
      },
      {
        n: 2,
        title: "Build a POST",
        brief:
          "Now write. Compose the order request yourself, field by field, and watch what the server makes of it.",
        steps: [
          "POST a valid order with one item and a sensible email address.",
          "Note the status, and find the new order in the orders list.",
          "Change the quantity and send it again; check the total yourself.",
          "Note which values you sent and which the server decided.",
          "Say which of those the server should never trust a client for.",
        ],
        defects: [],
      },
      {
        n: 3,
        title: "Send what the form would not",
        brief:
          "The checkout form refuses some things. The server is a separate question, and it is the one that matters.",
        steps: [
          "POST an order with an email address that has no @ sign.",
          "POST one with a quantity of -1.",
          "Record the status and body for each, and whether an order appeared.",
          "Check the orders list to confirm whether anything was written.",
          "File each case where the server accepted what the form refused.",
        ],
        defects: ["email-unvalidated", "qty-negative"],
      },
    ],
  },

  {
    id: "meridian-risk",
    title: "Meridian: where to look first",
    week: 9,
    level: "intermediate",
    summary:
      "You have thirty minutes and a whole shop. Rank the product by risk, test in that order, and find out whether your ranking was right.",
    trains:
      "Risk-based testing: deciding what to test first, and being able to defend the order afterwards.",
    minutes: 50,
    stages: [
      {
        n: 1,
        title: "Rank before you test",
        brief:
          "Testing time is always shorter than the list of things that could be tested, so the real skill is choosing. Choose first, in writing.",
        steps: [
          "List the areas of the shop: catalogue, product, cart, checkout, orders.",
          "Give each a likelihood of being broken, from 1 to 3.",
          "Give each an impact if it is broken, from 1 to 3.",
          "Multiply, and write your test order down before you open anything.",
          "Note which area you expect to hold the worst defect, and why.",
        ],
        defects: [],
      },
      {
        n: 2,
        title: "Test in that order",
        brief:
          "Work your ranking, highest first, and stop when the thirty minutes are gone — not when you feel finished.",
        steps: [
          "Start a timer and work the top area first.",
          "Record every defect with the area it was in and the minute you found it.",
          "Do not skip ahead to something that looks more interesting.",
          "Stop at thirty minutes even if an area is unfinished.",
          "Write down which areas you never reached.",
        ],
        defects: [
          "qty-ignored",
          "discount-stacks",
          "double-submit",
          "stock-not-decremented",
          "price-rounding",
        ],
      },
      {
        n: 3,
        title: "Score your own ranking",
        brief:
          "The point of the exercise is not the defects. It is whether your ranking put the expensive ones first.",
        steps: [
          "Sort what you found by real severity, ignoring the order you found it.",
          "Compare that with the order you planned.",
          "Name the area you under-rated, and say what misled you.",
          "Say which defect you would have missed entirely at twenty minutes.",
          "Rewrite the ranking as you would give it to someone else.",
        ],
        defects: [],
      },
    ],
  },

  {
    id: "meridian-cases",
    title: "Meridian: write the cases",
    week: 10,
    level: "intermediate",
    summary:
      "Turn one feature into a set of test cases somebody else could run, then run a colleague's version of them and see what breaks.",
    trains:
      "Writing repeatable test cases, and using boundary and equivalence thinking to keep the set short.",
    minutes: 55,
    stages: [
      {
        n: 1,
        title: "Cover the checkout",
        brief:
          "Write cases for checkout. Aim for a set short enough to run in fifteen minutes and complete enough to trust.",
        steps: [
          "Write the happy path as one case, with numbered steps and an expected result.",
          "Partition the quantity field and pick one value from each partition.",
          "Add the boundary values at each edge of the valid range.",
          "Write one case per negative input you can think of.",
          "Stop at twelve cases and say what you chose to leave out.",
        ],
        defects: [],
      },
      {
        n: 2,
        title: "Run them exactly as written",
        brief:
          "Follow your own steps literally, without filling gaps from memory. Every gap you have to fill is a defect in the case.",
        steps: [
          "Run each case and record pass, fail or blocked as you finish it.",
          "Note every point where you had to guess what you meant.",
          "Where a case fails, confirm it before writing it up.",
          "Record the exact expected and actual values, not a description.",
          "Count how many of your twelve found something.",
        ],
        defects: ["qty-negative", "email-unvalidated", "qty-ignored"],
      },
      {
        n: 3,
        title: "Fix the cases, not the product",
        brief:
          "The deliverable is the set, not the bugs. Rewrite it so a stranger could run it tomorrow and get your results.",
        steps: [
          "Rewrite every step that needed interpretation.",
          "Replace any vague expected result with an exact value.",
          "Give every case a stable id and a title that says what it checks.",
          "Add a case for anything you found by accident rather than by plan.",
          "Delete any case that could never fail.",
        ],
        defects: [],
      },
    ],
  },

  {
    id: "meridian-responsive",
    title: "Meridian: three widths",
    week: 12,
    level: "intermediate",
    summary:
      "The same shop at phone, tablet and desktop width. Find the breakpoints first, then test either side of each one.",
    trains:
      "Responsive testing, and the discipline of testing a boundary rather than a comfortable middle.",
    minutes: 45,
    stages: [
      {
        n: 1,
        title: "Find the breakpoints",
        brief:
          "You cannot test either side of a line you have not located. Drag the width slowly and watch for the jumps.",
        steps: [
          "Open device mode and drag the width from 320px upward.",
          "Note every width at which the layout changes.",
          "Write the breakpoints down; these are the values you will test.",
          "Decide which of them is likeliest to be wrong, and why.",
          "Check whether anything scrolls sideways at any width.",
        ],
        defects: [],
      },
      {
        n: 2,
        title: "Either side of each line",
        brief:
          "Boundary thinking applies to pixels too. The bug lives at 767 or 769 far more often than at exactly 768.",
        steps: [
          "At each breakpoint, test one pixel below and one pixel above.",
          "Check the catalogue grid, the product page and the cart at each.",
          "Check that every price and total is fully visible, not clipped.",
          "Check that touch targets are reachable at 375px.",
          "Note anything that is merely ugly, separately from anything broken.",
        ],
        defects: ["price-rounding"],
      },
      {
        n: 3,
        title: "Does it still work small?",
        brief:
          "A layout can survive a narrow screen and still lose a feature. Complete a purchase at phone width, carefully.",
        steps: [
          "At 375px, add an item and watch the header count.",
          "Add the same item twice and check the total.",
          "Complete checkout end to end without widening the window.",
          "Note any step that was harder rather than impossible, and say why.",
          "File anything that fails at one width and not another, naming both.",
        ],
        defects: ["badge-stale", "qty-ignored"],
      },
    ],
  },

  {
    id: "meridian-a11y",
    title: "Meridian: the keyboard pass",
    week: 12,
    level: "intermediate",
    summary:
      "Put the mouse away and buy something. Four accessibility checks you can run on any screen in ten minutes.",
    trains:
      "Keyboard-only navigation, visible focus, accessible names, and writing an accessibility finding.",
    minutes: 40,
    stages: [
      {
        n: 1,
        title: "Tab through the whole thing",
        brief:
          "Hands off the mouse from here. You are checking four things: can you reach it, can you see where you are, does the order make sense, can you get out.",
        steps: [
          "Tab through the catalogue and write the focus order down.",
          "Note any control you cannot reach at all.",
          "Note any control that takes focus invisibly.",
          "Check whether the order matches what you see on screen.",
          "Try to complete a purchase without touching the mouse.",
        ],
        defects: [],
      },
      {
        n: 2,
        title: "Names, images and contrast",
        brief:
          "What a screen reader would announce, and what a reader with low vision would struggle with.",
        steps: [
          "Check every image for an alt attribute, and judge whether it is useful.",
          "Find any icon-only control and work out what it would be announced as.",
          "Use DevTools to check the contrast of the prices and the muted text.",
          "Set the browser to 200% zoom and check nothing is clipped or overlapping.",
          "Note which of these is a Level A failure rather than a preference.",
        ],
        defects: [],
      },
      {
        n: 3,
        title: "Write one properly",
        brief:
          "Pick the worst thing you found and write it up to the standard an accessibility finding needs.",
        steps: [
          "Name who it affects, and whether they are blocked or inconvenienced.",
          "Give the steps, using keys rather than clicks.",
          "Say what should happen instead, concretely.",
          "Cite the guideline if you know it, and the level.",
          "Rate severity on whether the feature exists at all for that user.",
        ],
        defects: ["oos-addable", "console-error"],
      },
    ],
  },

  {
    id: "meridian-security",
    title: "Meridian: the five-check sweep",
    week: 14,
    level: "senior",
    summary:
      "Ninety minutes, five questions, one shop. The sweep that finds most of what is seriously wrong, with no special tools.",
    trains:
      "Testing authorisation, isolation, exposure and input validation — and stopping at one proof.",
    minutes: 90,
    stages: [
      {
        n: 1,
        title: "What reaches the browser",
        brief:
          "Open the Network panel and read the responses the shop actually sends, rather than what the page chooses to draw.",
        steps: [
          "Read every response body on the catalogue and a product page.",
          "List any field the page never displays.",
          "Look for anything resembling a credential, a key or personal data.",
          "Check an error response for internal detail: paths, queries, stack traces.",
          "Note that the UI not showing a field is no defence.",
        ],
        defects: [],
      },
      {
        n: 2,
        title: "Does the server validate?",
        brief:
          "Client-side validation is convenience, not a control. Everything the form refuses, send directly.",
        steps: [
          "Remove the required attribute on a checkout field and submit.",
          "Send a quantity of -1 straight to the API and check the status.",
          "Send an email with no @ sign the same way.",
          "After each, check the orders list to see whether anything was written.",
          "Try a value a form could never produce, like a 10,000 character name.",
        ],
        defects: ["qty-negative", "email-unvalidated"],
      },
      {
        n: 3,
        title: "Write the sweep up",
        brief:
          "The deliverable is a summary a release decision can be made from, ranked by damage rather than by how clever the bug is.",
        steps: [
          "List findings as critical, high, medium, with one line of reasoning each.",
          "Include a Not found section for the checks that came back clean.",
          "Include a Not tested section, and say why.",
          "Use field names, never values, for anything sensitive.",
          "End with a one-sentence assessment: release, or do not.",
        ],
        defects: ["qty-negative", "email-unvalidated", "stock-not-decremented"],
      },
    ],
  },

  {
    id: "meridian-automate",
    title: "Meridian: automate the smoke test",
    week: 15,
    level: "senior",
    summary:
      "Turn the ten-minute manual smoke test into a suite that runs in seconds, then break it on purpose to prove it works.",
    trains:
      "Writing durable selectors, auto-waiting instead of sleeping, and proving a suite can actually fail.",
    minutes: 90,
    stages: [
      {
        n: 1,
        title: "Write the smoke test down first",
        brief:
          "Automating an undefined process gives you an undefined process that runs faster. Define it by hand first.",
        steps: [
          "List the wide-and-shallow path: one trip through every major area.",
          "Run it manually once and time it.",
          "For each step, write the assertion that proves it worked.",
          "Choose a locator for every element you will touch.",
          "Prefer a role and an accessible name over a CSS class, and say why.",
        ],
        defects: [],
      },
      {
        n: 2,
        title: "Make it run",
        brief:
          "Now write it. Every wait should be a condition, never a fixed sleep, and every assertion should fail usefully.",
        steps: [
          "Write the test: open the catalogue, open a product, add it, check out.",
          "Assert on what a user sees, not on an internal class name.",
          "Replace any sleep with a wait for the thing you actually need.",
          "Run it three times and confirm the same result each time.",
          "Make one assertion name the expected and actual values when it fails.",
        ],
        defects: [],
      },
      {
        n: 3,
        title: "Prove it can fail",
        brief:
          "A suite you have never seen fail is a suite you have no reason to trust. Break things deliberately and watch.",
        steps: [
          "Turn on a defect and confirm the matching assertion goes red.",
          "Change an expected string and confirm the test fails, not errors.",
          "Remove an await and observe a test that passes when it should not.",
          "Record which defects your smoke test would never catch.",
          "Decide which of those deserve a test, and which do not.",
        ],
        defects: ["qty-ignored", "badge-stale", "console-error"],
      },
    ],
  },

  {
    id: "meridian-diagnose",
    title: "Meridian: diagnose from a ticket",
    week: 17,
    level: "intermediate",
    summary:
      "Four customer messages, no diagnosis. Work out what actually happened in each, decide who owns it, and write the escalation.",
    trains:
      "Turning a description into a diagnosis, and routing from evidence rather than from a guess.",
    minutes: 60,
    stages: [
      {
        n: 1,
        title: "Reproduce what they describe",
        brief:
          "A customer describes a symptom, not a cause. Your first job is to see it yourself, in the data rather than in their words.",
        steps: [
          "“I was charged for two orders but I only clicked once.” Reproduce it.",
          "“I bought the last one and it is still showing as in stock.” Reproduce it.",
          "“The cart total is wrong when I buy two of something.” Reproduce it.",
          "For each, record the exact steps that produced the symptom.",
          "Note any report whose symptom is not what the customer thinks it is.",
        ],
        defects: ["double-submit", "stock-not-decremented", "qty-ignored"],
      },
      {
        n: 2,
        title: "Front end or back end",
        brief:
          "The Network panel decides this in ten seconds, and getting it right routes the ticket correctly first time.",
        steps: [
          "For each, note whether a request was sent at all.",
          "Record the status, and whether the response was correct.",
          "Decide whether the data was wrong or only the display was.",
          "Name the owning team for each, with the evidence for that choice.",
          "Identify the one where the response is right and the screen is wrong.",
        ],
        defects: ["double-submit", "stock-not-decremented", "qty-ignored"],
      },
      {
        n: 3,
        title: "Write the escalation",
        brief:
          "An engineer should be able to start work from your message without replying to it.",
        steps: [
          "Give the instance: the exact reference, time and account.",
          "Give what you checked and what you ruled out.",
          "Give the scope: one customer, or everyone.",
          "Say what the customer has been told, and when you promised an update.",
          "State what you need from the engineer, specifically.",
        ],
        defects: ["double-submit", "stock-not-decremented"],
      },
    ],
  },

  {
    id: "meridian-reliability",
    title: "Meridian: run it twice",
    week: 22,
    level: "senior",
    summary:
      "The defects that only appear when something happens twice. Prove each one, then design the guard that would stop it.",
    trains:
      "Idempotency, the run-twice test, and asserting on state rather than on a response.",
    minutes: 60,
    stages: [
      {
        n: 1,
        title: "Count before and after",
        brief:
          "A duplicate is invisible in a response and obvious in a count. Measure the state on both sides of every action.",
        steps: [
          "Count the orders. Place one order. Count again.",
          "Count the orders. Double-click Place order. Count again.",
          "Record the status of both requests in the second case.",
          "Note that both responses can look entirely correct.",
          "Say which number told you the truth.",
        ],
        defects: ["double-submit"],
      },
      {
        n: 2,
        title: "Repeat what should not repeat",
        brief:
          "Some actions are safe to repeat and some are not. Find out which is which by repeating them.",
        steps: [
          "Apply a discount code, then apply the same code again.",
          "Work out the total by hand after each application.",
          "Keep going and record what happens at the extreme.",
          "Order an item twice and check the stock after each.",
          "For each, say whether repeating changed the state or only the response.",
        ],
        defects: ["discount-stacks", "stock-not-decremented"],
      },
      {
        n: 3,
        title: "Design the guard",
        brief:
          "You have three defects that all come from the same shape. Say what would have prevented each, precisely.",
        steps: [
          "For the duplicate order, write the idempotency key you would use.",
          "Say where it must be derived from, and why not from a timestamp.",
          "For the discount, say what the server should check and when.",
          "For the stock, say which assertion a test should have made.",
          "Write the run-twice test that would catch all three.",
        ],
        defects: ["double-submit", "discount-stacks", "stock-not-decremented"],
      },
    ],
  },
];

/**
 * How a free-text bug report is matched to a planted defect.
 *
 * You write your report in your own words, as you would at work. The lab then
 * matches it by keyword: a report counts as matching a defect when at least
 * two of that defect's keywords appear in your title and steps.
 *
 * This is deliberately imperfect and the lab says so. A correctly-worded
 * report can fail to match, which is why every unmatched report is shown back
 * to you with an "I did find this" override rather than being scored as wrong.
 * A machine that silently marked good work as a miss would teach you to write
 * for the matcher instead of for an engineer.
 */
export const MATCHERS: Record<string, string[]> = {
  "price-rounding": ["price", "decimal", "rounding", "format", "zero", "kobo"],
  "oos-addable": ["out of stock", "stock", "add", "cart", "unavailable", "sold out"],
  "qty-ignored": ["total", "quantity", "qty", "twice", "cart", "multiplied"],
  "badge-stale": ["badge", "header", "count", "refresh", "reload", "update"],
  "email-unvalidated": ["email", "invalid", "validation", "@", "accepted"],
  "qty-negative": ["negative", "quantity", "qty", "zero", "minus", "-1"],
  "double-submit": ["double", "twice", "duplicate", "two orders", "submit", "idempot"],
  "discount-stacks": ["discount", "code", "twice", "stack", "repeat", "again"],
  "console-error": ["console", "typeerror", "uncaught", "error", "red"],
  "stock-not-decremented": ["stock", "decrement", "decrease", "after", "order", "inventory"],
};

/** Returns the defect ids a free-text report plausibly describes. */
export function matchReport(text: string): string[] {
  const haystack = text.toLowerCase();
  const hits: string[] = [];
  for (const [id, keywords] of Object.entries(MATCHERS)) {
    const found = keywords.filter((word) => haystack.includes(word)).length;
    if (found >= 2) hits.push(id);
  }
  return hits;
}

export function getLab(id: string): Lab | undefined {
  return LABS.find((lab) => lab.id === id);
}

export function getStage(labId: string, stageNumber: number): LabStage | undefined {
  return getLab(labId)?.stages.find((stage) => stage.n === stageNumber);
}

export const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low"];
