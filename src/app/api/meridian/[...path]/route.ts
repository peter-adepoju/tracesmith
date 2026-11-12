import { NextResponse } from "next/server";
import {
  CATALOGUE,
  DISCOUNTS,
  getSession,
  productById,
  resetSession,
  type Order,
  type OrderItem,
} from "@/lib/meridian/catalog";

/**
 * Meridian's API.
 *
 * Real HTTP, so every call the shop makes shows up in the browser's own
 * Network tab as well as in the lab's panel. Defects are switched on per
 * request through the x-meridian-defects header, which is how a lab makes the
 * same codebase behave differently for different exercises.
 */

function defectsOf(request: Request): Set<string> {
  const header = request.headers.get("x-meridian-defects") ?? "";
  return new Set(header.split(",").map((item) => item.trim()).filter(Boolean));
}

function sessionIdOf(request: Request): string {
  return request.headers.get("x-meridian-session") ?? "anonymous";
}

/** Who the caller claims to be. Defaults to the first customer. */
function customerOf(request: Request): string {
  return request.headers.get("x-meridian-customer") ?? "cus_01";
}

function roleOf(request: Request): string {
  return request.headers.get("x-meridian-role") ?? "customer";
}

/** Strip the internal fields unless the exposure defect is switched on. */
function present(order: Order, defects: Set<string>) {
  if (defects.has("pii-overexposed")) return order;
  const { internalRiskScore, internalNote, ...safe } = order;
  void internalRiskScore;
  void internalNote;
  return safe;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "x-request-id": "mer_" + Math.random().toString(36).slice(2, 11) },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const session = getSession(sessionIdOf(request));
  const defects = defectsOf(request);
  const customer = customerOf(request);
  const route = path.join("/");

  if (route === "products") {
    return json({
      data: CATALOGUE.map((product) => ({
        ...product,
        stock: session.stock[product.id] ?? product.stock,
      })),
    });
  }

  // Admin: every order, for every customer. Correct behaviour requires the
  // admin role; with admin-unauthenticated on, the check is skipped entirely
  // and anyone who knows the path gets the lot.
  if (route === "admin/orders") {
    if (!defects.has("admin-unauthenticated") && roleOf(request) !== "admin") {
      return json(
        { error: "forbidden", message: "Admin role required." },
        403,
      );
    }
    return json({ data: session.orders.map((o) => present(o, defects)) });
  }

  if (route.startsWith("orders/")) {
    const id = path[1];
    const order = session.orders.find((item) => item.id === id);

    // Correct behaviour: an order you do not own is indistinguishable from
    // one that does not exist, so a guess tells an attacker nothing. With
    // order-idor on, ownership is never checked.
    const mine = order && order.customerId === customer;
    if (!order || (!mine && !defects.has("order-idor"))) {
      return json({ error: "not_found", message: `No order ${id}.` }, 404);
    }
    return json(present(order, defects));
  }

  if (route === "orders") {
    const mine = session.orders.filter(
      (order) => order.customerId === customer || defects.has("order-idor"),
    );
    return json({ data: mine.map((order) => present(order, defects)) });
  }

  return json({ error: "unknown_endpoint", message: `No route /${route}.` }, 404);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const route = path.join("/");
  const defects = defectsOf(request);
  const sessionId = sessionIdOf(request);
  const session = getSession(sessionId);

  if (route === "session/reset") {
    resetSession(sessionId);
    return json({ status: "reset" });
  }

  if (route !== "orders") {
    return json({ error: "unknown_endpoint", message: `No route /${route}.` }, 404);
  }

  // Eight seconds is past most default timeouts, which is the point: it lets
  // a lab exercise a retry policy against something genuinely slow.
  if (defects.has("slow-checkout")) await sleep(8000);

  // Fails roughly two times in five. Enough to be unmistakable over twenty
  // attempts, not so much that the shop is unusable.
  if (defects.has("flaky-orders") && Math.random() < 0.4) {
    return json(
      { error: "upstream_unavailable", message: "Payment provider did not respond." },
      503,
    );
  }

  let body: { items?: OrderItem[]; email?: string; discountCode?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json", message: "Body is not valid JSON." }, 400);
  }

  const items = body.items ?? [];
  if (!items.length) {
    return json(
      {
        error: "validation_failed",
        message: "An order needs at least one item.",
        fields: ["items"],
      },
      422,
    );
  }

  const email = (body.email ?? "").trim();
  // Correct behaviour: reject anything that is not plausibly an address.
  // With the defect on, only emptiness is checked, so "notanemail" is accepted.
  const emailOk = defects.has("email-unvalidated")
    ? email.length > 0
    : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    return json(
      {
        error: "validation_failed",
        // Correct behaviour says what the caller must fix and nothing about
        // how the shop is built. error-leaks-internals returns the database's
        // own complaint instead, which names the engine, the table and the
        // column to anyone who sends a bad address.
        message: defects.has("error-leaks-internals")
          ? 'PG::CheckViolation: new row for relation "orders" violates check constraint "orders_email_format" (DETAIL: Failing row contains (ORD-xxxxx, ' +
            email +
            ")) at /srv/meridian/app/models/order.rb:118"
          : "A valid email address is required.",
        fields: ["email"],
      },
      422,
    );
  }

  let subtotal = 0;
  for (const item of items) {
    const product = productById(item.productId);
    if (!product) {
      return json(
        {
          error: "validation_failed",
          message: `No product ${item.productId}.`,
          fields: ["items"],
        },
        422,
      );
    }
    subtotal += product.priceMinor * item.quantity;
  }

  let discount = 0;
  const code = (body.discountCode ?? "").toUpperCase();
  if (code && DISCOUNTS[code]) {
    discount = Math.round((subtotal * DISCOUNTS[code]) / 100);
  }

  const order: Order = {
    id: "ORD-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
    customerId: customerOf(request),
    items,
    email,
    subtotalMinor: subtotal,
    discountMinor: discount,
    totalMinor: Math.max(0, subtotal - discount),
    createdAt: new Date().toISOString(),
    internalRiskScore: Math.round(Math.random() * 60 + 20) / 100,
    internalNote: "Flagged for manual review on a previous order.",
  };

  session.orders.push(order);

  // Correct behaviour: taking payment for stock means removing it from stock.
  if (!defects.has("stock-not-decremented")) {
    for (const item of items) {
      const current = session.stock[item.productId] ?? 0;
      session.stock[item.productId] = Math.max(0, current - item.quantity);
    }
  }

  // Through present(), like every other order response: the internal fields
  // must be absent unless pii-overexposed is switched on. Returning the raw
  // order here leaked them on every create, defect or not.
  return json(present(order, defects), 201);
}
