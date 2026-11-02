"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatMoney, type Product } from "@/lib/meridian/catalog";

/**
 * Meridian: the shop under test.
 *
 * A real client application making real HTTP calls to /api/meridian. Which
 * defects are active comes in on the query string, set by the lab. Nothing
 * here knows what a defect "means" — the descriptions and the answer key stay
 * in the parent app, so reading this source gives nothing away beyond the
 * behaviour you could observe anyway.
 */

type CartLine = { productId: string; quantity: number };
type View = "catalogue" | "product" | "cart" | "checkout" | "done";

function MeridianShop() {
  const search = useSearchParams();
  const defects = new Set(
    (search.get("defects") ?? "").split(",").filter(Boolean),
  );
  const sessionId = search.get("session") ?? "anonymous";

  const [products, setProducts] = useState<Product[]>([]);
  const [view, setView] = useState<View>("catalogue");
  const [openId, setOpenId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [badgeCount, setBadgeCount] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedPercent, setAppliedPercent] = useState(0);
  const [appliedCodes, setAppliedCodes] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderIds, setOrderIds] = useState<string[]>([]);
  const [error, setError] = useState("");

  const headers = useCallback(
    (): Record<string, string> => ({
      "Content-Type": "application/json",
      "x-meridian-defects": [...defects].join(","),
      "x-meridian-session": sessionId,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [search],
  );

  const loadProducts = useCallback(async () => {
    const response = await fetch("/api/meridian/products", {
      headers: headers(),
    });
    const body = await response.json();
    setProducts(body.data ?? []);
  }, [headers]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  // The badge is meant to track the cart. With the defect on it is only
  // synced when the catalogue loads, so it lags behind until a reload.
  const liveCount = cart.reduce((total, line) => total + line.quantity, 0);
  const shownCount = defects.has("badge-stale") ? badgeCount : liveCount;

  useEffect(() => {
    if (!defects.has("badge-stale")) setBadgeCount(liveCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveCount]);

  const open = products.find((product) => product.id === openId) ?? null;

  function money(minor: number): string {
    return formatMoney(minor, defects.has("price-rounding"));
  }

  function addToCart(product: Product, qty: number) {
    setCart((previous) => {
      const existing = previous.find((line) => line.productId === product.id);
      if (existing) {
        return previous.map((line) =>
          line.productId === product.id
            ? { ...line, quantity: line.quantity + qty }
            : line,
        );
      }
      return [...previous, { productId: product.id, quantity: qty }];
    });
    setView("cart");
  }

  function lineTotal(line: CartLine): number {
    const product = products.find((item) => item.id === line.productId);
    if (!product) return 0;
    // Correct: price times quantity. With the defect, a line of more than one
    // is still billed as a single unit.
    const billed = defects.has("qty-ignored") && line.quantity > 1 ? 1 : line.quantity;
    return product.priceMinor * billed;
  }

  const subtotal = cart.reduce((total, line) => total + lineTotal(line), 0);
  const discountValue = Math.round((subtotal * appliedPercent) / 100);
  const total = Math.max(0, subtotal - discountValue);

  function applyDiscount() {
    const code = discountCode.trim().toUpperCase();
    const known: Record<string, number> = { SAVE10: 10, WELCOME5: 5 };
    if (!known[code]) {
      setError("That code is not recognised.");
      return;
    }
    // Correct: a code may be used once. With the defect it stacks every time.
    if (!defects.has("discount-stacks") && appliedCodes.includes(code)) {
      setError("That code has already been applied.");
      return;
    }
    setAppliedCodes((previous) => [...previous, code]);
    setAppliedPercent((previous) => previous + known[code]);
    setError("");
    setDiscountCode("");
  }

  async function placeOrder() {
    setError("");
    // Correct: block a second submit while the first is in flight.
    if (submitting && !defects.has("double-submit")) return;
    setSubmitting(true);

    try {
      const response = await fetch("/api/meridian/orders", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          items: cart,
          email,
          discountCode: appliedCodes[0] ?? "",
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.message ?? "Order failed.");
        setSubmitting(false);
        return;
      }
      setOrderIds((previous) => [...previous, body.id]);
      setView("done");
      void loadProducts();
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  // A real uncaught error, thrown outside React so it reaches the console
  // exactly as a production bug would.
  useEffect(() => {
    if (view === "product" && defects.has("console-error")) {
      setTimeout(() => {
        const pricing = null as unknown as { amount: number };
        void pricing.amount;
      }, 0);
    }
  }, [view, openId, defects]);

  return (
    <div className="min-h-dvh bg-[#faf9f7] text-[#1b1a17]">
      <header className="border-b border-[#e4e0d9] bg-white">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-4 px-4">
          <button
            type="button"
            onClick={() => setView("catalogue")}
            className="text-lg font-semibold tracking-tight"
          >
            Meridian
          </button>
          <nav className="ml-auto flex items-center gap-3 text-sm">
            <button type="button" onClick={() => setView("catalogue")}>
              Shop
            </button>
            <button
              type="button"
              onClick={() => setView("cart")}
              data-testid="cart-badge"
              className="rounded-full border border-[#e4e0d9] px-3 py-1"
            >
              Cart ({shownCount})
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {error ? (
          <p className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        {view === "catalogue" ? (
          <>
            <h1 className="text-2xl font-semibold">Everything</h1>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="flex flex-col rounded-xl border border-[#e4e0d9] bg-white p-4"
                >
                  <h2 className="font-medium">{product.name}</h2>
                  <p className="mt-1 flex-1 text-sm text-[#6b6559]">
                    {product.blurb}
                  </p>
                  <p className="mt-3 font-semibold">{money(product.priceMinor)}</p>
                  <p className="mt-1 text-xs text-[#6b6559]">
                    {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenId(product.id);
                      setQuantity(1);
                      setView("product");
                    }}
                    className="mt-3 rounded-lg bg-[#1b1a17] px-3 py-2 text-sm text-white"
                  >
                    View
                  </button>
                </article>
              ))}
            </div>
          </>
        ) : null}

        {view === "product" && open ? (
          <article className="max-w-xl">
            <button
              type="button"
              onClick={() => setView("catalogue")}
              className="text-sm text-[#6b6559]"
            >
              ← Back
            </button>
            <h1 className="mt-3 text-2xl font-semibold">{open.name}</h1>
            <p className="mt-2 text-[#6b6559]">{open.blurb}</p>
            <p className="mt-4 text-xl font-semibold">{money(open.priceMinor)}</p>
            <p className="mt-1 text-sm text-[#6b6559]">
              {open.stock > 0 ? `${open.stock} in stock` : "Out of stock"}
            </p>

            <div className="mt-5 flex items-end gap-3">
              <label className="text-sm">
                Quantity
                <input
                  type="number"
                  value={quantity}
                  onChange={(event) => {
                    const raw = Number(event.target.value);
                    // Correct: a quantity below one is meaningless.
                    setQuantity(defects.has("qty-negative") ? raw : Math.max(1, raw));
                  }}
                  className="mt-1 block w-24 rounded-lg border border-[#e4e0d9] px-2 py-1.5"
                />
              </label>
              <button
                type="button"
                disabled={open.stock === 0 && !defects.has("oos-addable")}
                onClick={() => addToCart(open, quantity)}
                className="rounded-lg bg-[#1b1a17] px-4 py-2 text-sm text-white disabled:opacity-40"
              >
                Add to cart
              </button>
            </div>
          </article>
        ) : null}

        {view === "cart" ? (
          <>
            <h1 className="text-2xl font-semibold">Your cart</h1>
            {cart.length === 0 ? (
              <p className="mt-3 text-[#6b6559]">Nothing in it yet.</p>
            ) : (
              <>
                <table className="mt-5 w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#e4e0d9] text-left">
                      <th className="py-2">Item</th>
                      <th className="py-2">Qty</th>
                      <th className="py-2 text-right">Line total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((line) => {
                      const product = products.find((p) => p.id === line.productId);
                      return (
                        <tr key={line.productId} className="border-b border-[#eeebe5]">
                          <td className="py-2">{product?.name}</td>
                          <td className="py-2">{line.quantity}</td>
                          <td className="py-2 text-right">{money(lineTotal(line))}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="mt-4 flex flex-wrap items-end gap-2">
                  <label className="text-sm">
                    Discount code
                    <input
                      value={discountCode}
                      onChange={(event) => setDiscountCode(event.target.value)}
                      placeholder="SAVE10"
                      className="mt-1 block w-40 rounded-lg border border-[#e4e0d9] px-2 py-1.5"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={applyDiscount}
                    className="rounded-lg border border-[#1b1a17] px-3 py-2 text-sm"
                  >
                    Apply
                  </button>
                </div>

                <dl className="mt-5 ml-auto max-w-xs space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt>Subtotal</dt>
                    <dd>{money(subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Discount {appliedPercent ? `(${appliedPercent}%)` : ""}</dt>
                    <dd>−{money(discountValue)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-[#e4e0d9] pt-1 font-semibold">
                    <dt>Total</dt>
                    <dd data-testid="cart-total">{money(total)}</dd>
                  </div>
                </dl>

                <button
                  type="button"
                  onClick={() => setView("checkout")}
                  className="mt-5 rounded-lg bg-[#1b1a17] px-4 py-2 text-sm text-white"
                >
                  Checkout
                </button>
              </>
            )}
          </>
        ) : null}

        {view === "checkout" ? (
          <form
            className="max-w-md space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void placeOrder();
            }}
          >
            <h1 className="text-2xl font-semibold">Checkout</h1>
            <label className="block text-sm">
              Full name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-[#e4e0d9] px-2 py-2"
              />
            </label>
            <label className="block text-sm">
              Email
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                type={defects.has("email-unvalidated") ? "text" : "email"}
                className="mt-1 w-full rounded-lg border border-[#e4e0d9] px-2 py-2"
              />
            </label>
            <p className="text-sm">
              Paying <strong>{money(total)}</strong>
            </p>
            <button
              type="submit"
              disabled={submitting && !defects.has("double-submit")}
              className="rounded-lg bg-[#1b1a17] px-4 py-2 text-sm text-white disabled:opacity-40"
            >
              Place order
            </button>
          </form>
        ) : null}

        {view === "done" ? (
          <div className="max-w-md">
            <h1 className="text-2xl font-semibold">Thank you</h1>
            <p className="mt-2 text-[#6b6559]">
              {orderIds.length === 1
                ? "Your order is confirmed."
                : `${orderIds.length} orders were created.`}
            </p>
            <ul className="mt-3 space-y-1 font-mono text-sm">
              {orderIds.map((id) => (
                <li key={id}>{id}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => {
                setCart([]);
                setAppliedCodes([]);
                setAppliedPercent(0);
                setOrderIds([]);
                setView("catalogue");
                void loadProducts();
              }}
              className="mt-5 rounded-lg border border-[#1b1a17] px-3 py-2 text-sm"
            >
              Back to the shop
            </button>
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default function MeridianPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm">Loading Meridian…</div>}>
      <MeridianShop />
    </Suspense>
  );
}
