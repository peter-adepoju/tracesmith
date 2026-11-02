/**
 * A fake API to practise against.
 *
 * It runs entirely in the browser: no network, no server, nothing to install
 * and nothing that can cost money or touch real data. It behaves like a small
 * payments API because that is the shape you meet most often in QA, support
 * and automation work.
 *
 * It is deliberately strict about the things real APIs are strict about:
 * the right key for the right call, the right method, required fields, and a
 * body that is actually valid JSON.
 */

export const PUBLIC_KEY = "pk_test_trace_8f41c2";
export const SECRET_KEY = "sk_test_trace_93ba07";

export type MockRequest = {
  method: string;
  path: string;
  headers: Record<string, string>;
  body: string;
};

export type MockResponse = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
  /** Milliseconds, invented but plausible, so the Timing tab has something real to show. */
  timing: { queued: number; connect: number; waiting: number; download: number };
};

const CUSTOMERS = [
  { id: "cus_01", name: "Ada Obi", email: "ada@example.com", created: "2026-09-02" },
  { id: "cus_02", name: "Bola Ade", email: "bola@example.com", created: "2026-09-14" },
  { id: "cus_03", name: "Chidi Eze", email: "chidi@example.com", created: "2026-10-01" },
];

const PAYMENTS: Record<
  string,
  { reference: string; status: string; paid: boolean; amount: number; currency: string; channel: string }
> = {
  "ORDER-1001": {
    reference: "ORDER-1001",
    status: "success",
    paid: true,
    amount: 5000,
    currency: "NGN",
    channel: "card",
  },
  "ORDER-1002": {
    reference: "ORDER-1002",
    status: "pending",
    paid: false,
    amount: 12500,
    currency: "NGN",
    channel: "bank_transfer",
  },
  "ORDER-1003": {
    reference: "ORDER-1003",
    status: "failed",
    paid: false,
    amount: 800,
    currency: "NGN",
    channel: "card",
  },
};

function timing(waiting: number) {
  return {
    queued: Math.round(1 + Math.random() * 4),
    connect: Math.round(8 + Math.random() * 20),
    waiting,
    download: Math.round(2 + Math.random() * 9),
  };
}

function reply(
  status: number,
  statusText: string,
  body: unknown,
  waiting = 60,
  extraHeaders: Record<string, string> = {},
): MockResponse {
  return {
    status,
    statusText,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "x-request-id": "req_" + Math.random().toString(36).slice(2, 12),
      date: new Date().toUTCString(),
      ...extraHeaders,
    },
    body,
    timing: timing(waiting),
  };
}

function authOf(headers: Record<string, string>): string | null {
  const key = Object.keys(headers).find(
    (name) => name.toLowerCase() === "authorization",
  );
  if (!key) return null;
  const raw = headers[key].trim();
  if (!raw) return null;
  return raw.replace(/^Bearer\s+/i, "").trim();
}

/** Send a request to the fake API and get a response back. */
export function send(request: MockRequest): MockResponse {
  const method = request.method.toUpperCase();
  const path = request.path.split("?")[0].replace(/\/+$/, "") || "/";
  const token = authOf(request.headers);

  // A health check anyone may call.
  if (path === "/v1/ping") {
    if (method !== "GET") {
      return reply(405, "Method Not Allowed", {
        error: "method_not_allowed",
        message: `Use GET for /v1/ping, not ${method}.`,
        allowed: ["GET"],
      }, 12);
    }
    return reply(200, "OK", { status: "ok", time: new Date().toISOString() }, 14);
  }

  // Deliberate server failure, for practising 5xx.
  if (path === "/v1/boom") {
    return reply(500, "Internal Server Error", {
      error: "internal_error",
      message: "Something broke on our side. This is not your fault.",
      request_id: "req_" + Math.random().toString(36).slice(2, 10),
    }, 1840);
  }

  // Everything below needs a key.
  if (!token) {
    return reply(401, "Unauthorized", {
      error: "missing_authorization",
      message: "No Authorization header was sent.",
    }, 22);
  }

  const looksLikeKey = /^(pk|sk)_test_/.test(token);
  if (!looksLikeKey || (token !== PUBLIC_KEY && token !== SECRET_KEY)) {
    return reply(401, "Unauthorized", {
      error: "invalid_key",
      message: "That key is not recognised. Check for a typo or a stale copy.",
    }, 25);
  }

  const isSecret = token === SECRET_KEY;

  // Start a payment. Public key, because this is called from a browser.
  if (path === "/v1/payments/initiate") {
    if (method !== "POST") {
      return reply(405, "Method Not Allowed", {
        error: "method_not_allowed",
        message: `Use POST to start a payment, not ${method}.`,
        allowed: ["POST"],
      }, 15);
    }
    if (isSecret) {
      return reply(403, "Forbidden", {
        error: "wrong_key_type",
        message:
          "This endpoint takes the public key. The secret key must never reach a browser.",
      }, 18);
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(request.body || "{}") as Record<string, unknown>;
    } catch {
      return reply(400, "Bad Request", {
        error: "invalid_json",
        message: "The request body is not valid JSON.",
      }, 11);
    }

    const missing = ["amount", "currency", "reference"].filter(
      (field) => parsed[field] === undefined || parsed[field] === "",
    );
    if (missing.length) {
      return reply(422, "Unprocessable Content", {
        error: "validation_failed",
        message: "Some required fields are missing.",
        fields: missing,
      }, 19);
    }
    if (typeof parsed.amount !== "number" || parsed.amount <= 0) {
      return reply(422, "Unprocessable Content", {
        error: "validation_failed",
        message: "amount must be a positive number, in the smallest currency unit.",
        fields: ["amount"],
      }, 19);
    }

    return reply(200, "OK", {
      status: "success",
      reference: parsed.reference,
      amount: parsed.amount,
      currency: parsed.currency,
      checkout_url: `https://checkout.example.test/pay/${String(parsed.reference)}`,
    }, 240);
  }

  // Confirm a payment. Secret key, because this decides whether to ship goods.
  if (path.startsWith("/v1/payments/verify/")) {
    if (method !== "GET") {
      return reply(405, "Method Not Allowed", {
        error: "method_not_allowed",
        message: `Use GET to verify, not ${method}.`,
        allowed: ["GET"],
      }, 13);
    }
    if (!isSecret) {
      return reply(403, "Forbidden", {
        error: "wrong_key_type",
        message:
          "Verification needs the secret key, so it can only be done from your server.",
      }, 17);
    }
    const reference = decodeURIComponent(path.split("/v1/payments/verify/")[1] ?? "");
    const payment = PAYMENTS[reference];
    if (!payment) {
      return reply(404, "Not Found", {
        error: "payment_not_found",
        message: `No payment with reference ${reference}.`,
      }, 31);
    }
    return reply(200, "OK", payment, 96);
  }

  if (path === "/v1/customers") {
    if (method !== "GET") {
      return reply(405, "Method Not Allowed", {
        error: "method_not_allowed",
        message: `Use GET to list customers, not ${method}.`,
        allowed: ["GET"],
      }, 12);
    }
    if (!isSecret) {
      return reply(403, "Forbidden", {
        error: "wrong_key_type",
        message: "Customer data needs the secret key.",
      }, 16);
    }
    return reply(200, "OK", { data: CUSTOMERS, count: CUSTOMERS.length }, 74);
  }

  if (path.startsWith("/v1/customers/")) {
    const id = path.split("/v1/customers/")[1];
    if (!isSecret) {
      return reply(403, "Forbidden", {
        error: "wrong_key_type",
        message: "Customer data needs the secret key.",
      }, 16);
    }
    const customer = CUSTOMERS.find((item) => item.id === id);
    if (!customer) {
      return reply(404, "Not Found", {
        error: "customer_not_found",
        message: `No customer with id ${id}.`,
      }, 28);
    }
    return reply(200, "OK", customer, 61);
  }

  return reply(404, "Not Found", {
    error: "unknown_endpoint",
    message: `There is no endpoint at ${path}. Check the path and the version prefix.`,
  }, 20);
}

/** Ready-made requests, each one teaching a different response. */
export const PRESETS: {
  label: string;
  teaches: string;
  request: MockRequest;
}[] = [
  {
    label: "Health check",
    teaches: "A plain 200. The simplest possible exchange.",
    request: { method: "GET", path: "/v1/ping", headers: {}, body: "" },
  },
  {
    label: "Start a payment",
    teaches: "A POST with a JSON payload, answered with a checkout link.",
    request: {
      method: "POST",
      path: "/v1/payments/initiate",
      headers: { Authorization: PUBLIC_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(
        { amount: 5000, currency: "NGN", reference: "ORDER-1001" },
        null,
        2,
      ),
    },
  },
  {
    label: "Verify a payment",
    teaches: "The server-side check that decides whether a customer gets their goods.",
    request: {
      method: "GET",
      path: "/v1/payments/verify/ORDER-1001",
      headers: { Authorization: SECRET_KEY },
      body: "",
    },
  },
  {
    label: "No key at all",
    teaches: "401. You did not say who you are.",
    request: { method: "GET", path: "/v1/customers", headers: {}, body: "" },
  },
  {
    label: "Right call, wrong key",
    teaches: "403. We know who you are; this key is not allowed to do that.",
    request: {
      method: "GET",
      path: "/v1/customers",
      headers: { Authorization: PUBLIC_KEY },
      body: "",
    },
  },
  {
    label: "Wrong method",
    teaches: "405. Right address, wrong verb.",
    request: {
      method: "GET",
      path: "/v1/payments/initiate",
      headers: { Authorization: PUBLIC_KEY },
      body: "",
    },
  },
  {
    label: "Typo in the path",
    teaches: "404. The endpoint does not exist.",
    request: {
      method: "GET",
      path: "/v1/customer",
      headers: { Authorization: SECRET_KEY },
      body: "",
    },
  },
  {
    label: "Missing a required field",
    teaches: "422. Valid JSON, but the server will not accept it.",
    request: {
      method: "POST",
      path: "/v1/payments/initiate",
      headers: { Authorization: PUBLIC_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 5000 }, null, 2),
    },
  },
  {
    label: "Broken JSON",
    teaches: "400. The body never parsed, so no field checking even happened.",
    request: {
      method: "POST",
      path: "/v1/payments/initiate",
      headers: { Authorization: PUBLIC_KEY, "Content-Type": "application/json" },
      body: '{ "amount": 5000, "currency": "NGN", }',
    },
  },
  {
    label: "Server failure",
    teaches: "500. Nothing you send can fix this. Escalate it.",
    request: {
      method: "GET",
      path: "/v1/boom",
      headers: { Authorization: SECRET_KEY },
      body: "",
    },
  },
];
