/**
 * Meridian: the product you will test for twenty-six weeks.
 *
 * A small but genuinely realistic shop. The catalogue is fixed; stock and
 * orders live in a per-session store on the server, so placing an order has
 * real consequences you can go back and check — which is exactly where several
 * planted defects hide.
 */

export type Product = {
  id: string;
  name: string;
  blurb: string;
  /** Minor units, so 1250050 is 12,500.50. Money is never a float. */
  priceMinor: number;
  currency: "NGN";
  stock: number;
  category: string;
};

export const CATALOGUE: Product[] = [
  {
    id: "mer-01",
    name: "Harmattan Field Jacket",
    blurb: "Waxed cotton, two-layer lining, built for the dry season.",
    priceMinor: 4850000,
    currency: "NGN",
    stock: 12,
    category: "Outerwear",
  },
  {
    id: "mer-02",
    name: "Lagos Canvas Holdall",
    blurb: "Forty litres, leather base, brass hardware.",
    priceMinor: 2750050,
    currency: "NGN",
    stock: 4,
    category: "Bags",
  },
  {
    id: "mer-03",
    name: "Jos Plateau Wool Scarf",
    blurb: "Hand-woven, undyed highland wool.",
    priceMinor: 985000,
    currency: "NGN",
    stock: 0,
    category: "Accessories",
  },
  {
    id: "mer-04",
    name: "Calabar Leather Satchel",
    blurb: "Full-grain, hand-stitched, fits a 14-inch laptop.",
    priceMinor: 6200000,
    currency: "NGN",
    stock: 7,
    category: "Bags",
  },
  {
    id: "mer-05",
    name: "Enugu Linen Shirt",
    blurb: "Midweight linen, mother-of-pearl buttons.",
    priceMinor: 1850000,
    currency: "NGN",
    stock: 23,
    category: "Shirts",
  },
  {
    id: "mer-06",
    name: "Kano Indigo Throw",
    blurb: "Naturally dyed, 150 by 200 centimetres.",
    priceMinor: 3400050,
    currency: "NGN",
    stock: 2,
    category: "Home",
  },
  {
    id: "mer-07",
    name: "Benin Brass Desk Clock",
    blurb: "Solid brass case, quartz movement.",
    priceMinor: 2250000,
    currency: "NGN",
    stock: 9,
    category: "Home",
  },
  {
    id: "mer-08",
    name: "Obudu Trail Cap",
    blurb: "Six-panel, waxed brim, adjustable.",
    priceMinor: 750000,
    currency: "NGN",
    stock: 31,
    category: "Accessories",
  },
];

export const DISCOUNTS: Record<string, number> = {
  // Percentage off the subtotal.
  SAVE10: 10,
  WELCOME5: 5,
};

export type OrderItem = { productId: string; quantity: number };

export type Order = {
  id: string;
  items: OrderItem[];
  email: string;
  subtotalMinor: number;
  discountMinor: number;
  totalMinor: number;
  createdAt: string;
};

type Session = {
  stock: Record<string, number>;
  orders: Order[];
};

/**
 * Per-session state, in memory.
 *
 * A restart of the dev server clears it, which is fine: a lab session is
 * minutes long. Keeping it server-side is what makes "stock did not decrease"
 * a real behaviour you can catch rather than a trick of the UI.
 */
const SESSIONS = new Map<string, Session>();

export function getSession(id: string): Session {
  let session = SESSIONS.get(id);
  if (!session) {
    session = {
      stock: Object.fromEntries(CATALOGUE.map((p) => [p.id, p.stock])),
      orders: [],
    };
    SESSIONS.set(id, session);
  }
  return session;
}

export function resetSession(id: string): void {
  SESSIONS.delete(id);
}

export function productById(id: string): Product | undefined {
  return CATALOGUE.find((product) => product.id === id);
}

/**
 * Format money for display.
 *
 * `roundingDefect` reproduces a real and very common mistake: using a plain
 * number conversion, which silently drops a trailing zero so 27,500.50 renders
 * as 27,500.5 while every other price keeps two decimals.
 */
export function formatMoney(minor: number, roundingDefect = false): string {
  const major = minor / 100;
  if (roundingDefect) {
    return `₦${major.toLocaleString("en-NG")}`;
  }
  return `₦${major.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
