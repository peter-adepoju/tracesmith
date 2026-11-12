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
