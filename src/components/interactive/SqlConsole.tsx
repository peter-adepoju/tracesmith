"use client";

import { useEffect, useRef, useState } from "react";
import type { Database } from "sql.js";

/**
 * A real SQLite database, in the page.
 *
 * Not a simulation: sql.js is SQLite compiled to WebAssembly, so the errors
 * are SQLite's errors and a query that works here works against a real
 * database. The seed data carries one deliberate inconsistency, because the
 * reason a tester learns SQL is to check whether the screen is telling the
 * truth.
 */

const SCHEMA = `
CREATE TABLE customers (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  city       TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE products (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,
  price_minor INTEGER NOT NULL,
  stock       INTEGER NOT NULL
);

CREATE TABLE orders (
  id          TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  status      TEXT NOT NULL,
  total_minor INTEGER NOT NULL,
  created_at  TEXT NOT NULL
);

CREATE TABLE order_items (
  order_id         TEXT NOT NULL REFERENCES orders(id),
  product_id       TEXT NOT NULL REFERENCES products(id),
  quantity         INTEGER NOT NULL,
  unit_price_minor INTEGER NOT NULL
);

INSERT INTO customers VALUES
  ('cus_01','Ada Nwosu','ada@example.com','Lagos','2026-09-02'),
  ('cus_02','Bola Adeyemi','bola@example.com','Abuja','2026-09-11'),
  ('cus_03','Chidi Okeke','chidi@example.com','Lagos','2026-09-14'),
  ('cus_04','Fatima Bello','fatima@example.com','Kano','2026-10-01'),
  ('cus_05','Emeka Obi','emeka@example.com','Enugu','2026-10-03'),
  ('cus_06','Zainab Yusuf','zainab@example.com','Lagos','2026-10-19'),
  ('cus_07','Tunde Bakare','tunde@example.com','Ibadan','2026-10-22');

INSERT INTO products VALUES
  ('mer-01','Harmattan Field Jacket','Outerwear',4850000,12),
  ('mer-02','Lagos Canvas Holdall','Bags',2750050,4),
  ('mer-03','Jos Plateau Wool Scarf','Accessories',985000,0),
  ('mer-04','Calabar Leather Satchel','Bags',6200000,7),
  ('mer-05','Enugu Linen Shirt','Shirts',1850000,23),
  ('mer-06','Kano Indigo Throw','Home',3400050,2),
  ('mer-07','Benin Brass Desk Clock','Home',2250000,9),
  ('mer-08','Obudu Trail Cap','Accessories',750000,31);

INSERT INTO orders VALUES
  ('ORD-1001','cus_01','paid',      7600050,'2026-10-02'),
  ('ORD-1002','cus_02','paid',      1850000,'2026-10-04'),
  ('ORD-1003','cus_01','refunded',   750000,'2026-10-07'),
  ('ORD-1004','cus_03','paid',     12400000,'2026-10-09'),
  ('ORD-1005','cus_04','pending',   3400050,'2026-10-12'),
  ('ORD-1006','cus_05','paid',      4850000,'2026-10-15'),
  ('ORD-1007','cus_06','paid',      2250000,'2026-10-18'),
  ('ORD-1008','cus_01','paid',      5100000,'2026-10-21'),
  ('ORD-1009','cus_07','cancelled', 1850000,'2026-10-24'),
  ('ORD-1010','cus_06','paid',      9700000,'2026-10-28');

INSERT INTO order_items VALUES
  ('ORD-1001','mer-02',1,2750050),
  ('ORD-1001','mer-01',1,4850000),
  ('ORD-1002','mer-05',1,1850000),
  ('ORD-1003','mer-08',1,750000),
  ('ORD-1004','mer-04',2,6200000),
  ('ORD-1005','mer-06',1,3400050),
  ('ORD-1006','mer-01',1,4850000),
  ('ORD-1007','mer-07',1,2250000),
  ('ORD-1008','mer-05',2,1850000),
  ('ORD-1008','mer-08',1,750000),
  ('ORD-1009','mer-05',1,1850000),
  ('ORD-1010','mer-01',2,4850000);
`;

type Task = {
  prompt: string;
  /** The answer, run against the same database rather than written out. */
  reference: string;
  /** True when the row sequence is part of the answer. */
  ordered: boolean;
  hint: string;
};

const TASKS: Task[] = [
  {
    prompt: "Every product in the Bags category, cheapest first.",
    reference:
      "SELECT name, price_minor FROM products WHERE category = 'Bags' ORDER BY price_minor",
    ordered: true,
    hint: "SELECT … FROM products WHERE … ORDER BY …",
  },
  {
    prompt: "The name and email of every customer in Lagos.",
    reference: "SELECT name, email FROM customers WHERE city = 'Lagos'",
    ordered: false,
    hint: "Strings go in single quotes, and = is exact.",
  },
  {
    prompt:
      "Every paid order over NGN 50,000.00, with the customer's name. Remember money is in minor units.",
    reference:
      "SELECT o.id, c.name, o.total_minor FROM orders o JOIN customers c ON c.id = o.customer_id WHERE o.status = 'paid' AND o.total_minor > 5000000",
    ordered: false,
    hint: "JOIN customers ON customers.id = orders.customer_id. 50,000.00 is 5000000 minor.",
  },
  {
    prompt:
      "How many orders each customer has placed, most first. Include the customer's name.",
    reference:
      "SELECT c.name, COUNT(*) AS n FROM orders o JOIN customers c ON c.id = o.customer_id GROUP BY c.id ORDER BY n DESC, c.name",
    ordered: false,
    hint: "COUNT(*) with GROUP BY.",
  },
  {
    prompt:
      "The real one: find any order whose total_minor does not equal the sum of its items. There is exactly one.",
    reference:
      "SELECT o.id, o.total_minor, SUM(i.quantity * i.unit_price_minor) AS items_total FROM orders o JOIN order_items i ON i.order_id = o.id GROUP BY o.id HAVING o.total_minor != SUM(i.quantity * i.unit_price_minor)",
    ordered: false,
    hint: "GROUP BY the order, then HAVING to compare the stored total with the sum.",
  },
];

type Grid = { columns: string[]; rows: unknown[][] } | null;

/** Compare two result sets by value, forgiving column order and naming. */
function normalise(grid: NonNullable<Grid>, ordered: boolean): string {
  const rows = grid.rows.map((row) =>
    row.map((cell) => String(cell)).sort().join("\u0001"),
  );
  if (!ordered) rows.sort();
  return rows.join("\u0002");
}

export function SqlConsole() {
  const db = useRef<Database | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sql, setSql] = useState("SELECT * FROM products");
  const [grid, setGrid] = useState<Grid>(null);
  const [error, setError] = useState<string | null>(null);
  const [task, setTask] = useState(0);
  const [verdict, setVerdict] = useState<"right" | "wrong" | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Loaded on demand: the engine is about 650KB of WebAssembly, and only
    // this one lesson needs it.
    import("sql.js")
      .then((mod) =>
        mod.default({ locateFile: () => "/sql-wasm.wasm" }),
      )
      .then((SQL) => {
        if (cancelled) return;
        const database = new SQL.Database();
        database.run(SCHEMA);
        db.current = database;
        setReady(true);
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setLoadError(
            cause instanceof Error ? cause.message : "Could not load SQLite.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const execute = (query: string): Grid => {
    const results = db.current!.exec(query);
    if (results.length === 0) return { columns: [], rows: [] };
    const last = results[results.length - 1];
    return { columns: last.columns, rows: last.values as unknown[][] };
  };

  const run = () => {
    if (!db.current) return;
    setVerdict(null);
    try {
      const result = execute(sql);
      setGrid(result);
      setError(null);

      const expected = execute(TASKS[task].reference);
      setVerdict(
        normalise(result!, TASKS[task].ordered) ===
          normalise(expected!, TASKS[task].ordered)
          ? "right"
          : "wrong",
      );
    } catch (cause) {
      setGrid(null);
      setVerdict(null);
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          SQL console — real SQLite
        </span>
        <select
          value={task}
          onChange={(event) => {
            setTask(Number(event.target.value));
            setVerdict(null);
          }}
          className="ml-auto max-w-[13rem] rounded border border-border bg-bg px-1.5 py-1 text-xs"
          aria-label="Choose a task"
        >
          {TASKS.map((t, i) => (
            <option key={t.prompt} value={i}>
              Task {i + 1}
            </option>
          ))}
        </select>
      </div>

      <div className="border-b border-border p-3">
        <p className="text-sm">
          <strong>Task {task + 1}.</strong> {TASKS[task].prompt}
        </p>
        <p className="mt-1 text-xs text-muted">{TASKS[task].hint}</p>
      </div>

      <div className="border-b border-border px-3 py-2 text-[0.6875rem] text-muted">
        <code>customers</code> (id, name, email, city, created_at) ·{" "}
        <code>products</code> (id, name, category, price_minor, stock) ·{" "}
        <code>orders</code> (id, customer_id, status, total_minor, created_at) ·{" "}
        <code>order_items</code> (order_id, product_id, quantity,
        unit_price_minor)
      </div>

      <textarea
        value={sql}
        onChange={(event) => setSql(event.target.value)}
        spellCheck={false}
        rows={4}
        className="w-full resize-y border-b border-border bg-[var(--code-bg)] p-3 font-mono text-xs leading-relaxed text-[var(--code-text)] outline-none"
        aria-label="SQL query"
      />

      <div className="flex flex-wrap items-center gap-3 border-b border-border p-3">
        <button
          type="button"
          onClick={run}
          disabled={!ready}
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {ready ? "Run" : "Loading SQLite…"}
        </button>
        {loadError ? (
          <span className="text-sm text-bad">{loadError}</span>
        ) : null}
        {verdict === "right" ? (
          <span className="text-sm text-ok">
            That matches the answer for task {task + 1}.
          </span>
        ) : verdict === "wrong" ? (
          <span className="text-sm text-muted">
            Valid SQL, but not the rows task {task + 1} asked for.
          </span>
        ) : null}
      </div>

      {error ? (
        <pre className="overflow-x-auto p-3 font-mono text-xs text-bad">
          {error}
        </pre>
      ) : grid ? (
        grid.rows.length === 0 ? (
          <p className="p-3 text-sm text-muted">
            No rows. That is a result, not an error — and sometimes it is the
            finding.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2">
                <tr>
                  {grid.columns.map((column) => (
                    <th
                      key={column}
                      className="whitespace-nowrap px-3 py-2 font-semibold"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.rows.map((row, i) => (
                  <tr key={i} className="border-t border-border">
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className="whitespace-nowrap px-3 py-1.5 font-mono"
                      >
                        {cell === null ? "NULL" : String(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-3 py-2 text-xs text-muted">
              {grid.rows.length} row{grid.rows.length === 1 ? "" : "s"}
            </p>
          </div>
        )
      ) : null}

      <figcaption className="border-t border-border p-3 text-sm text-muted">
        Everything here runs against real SQLite, so the error messages are the
        ones you will meet on the job. Writes work too — but you are a tester
        on someone else&apos;s data, so read the warning in the lesson before
        you type UPDATE anywhere that matters.
      </figcaption>
    </figure>
  );
}
