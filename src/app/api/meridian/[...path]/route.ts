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
  const route = path.join("/");

  if (route === "products") {
    return json({
      data: CATALOGUE.map((product) => ({
        ...product,
        stock: session.stock[product.id] ?? product.stock,
      })),
    });
  }

  if (route.startsWith("orders/")) {
    const id = path[1];
    const order = session.orders.find((item) => item.id === id);
    if (!order) return json({ error: "not_found", message: `No order ${id}.` }, 404);
    return json(order);
  }

  if (route === "orders") {
    return json({ data: session.orders });
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
        message: "A valid email address is required.",
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
    items,
    email,
    subtotalMinor: subtotal,
    discountMinor: discount,
    totalMinor: Math.max(0, subtotal - discount),
    createdAt: new Date().toISOString(),
  };

  session.orders.push(order);

  // Correct behaviour: taking payment for stock means removing it from stock.
  if (!defects.has("stock-not-decremented")) {
    for (const item of items) {
      const current = session.stock[item.productId] ?? 0;
      session.stock[item.productId] = Math.max(0, current - item.quantity);
    }
  }

  return json(order, 201);
}
