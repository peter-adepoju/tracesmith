"use client";

import { useState } from "react";

/**
 * Say who should be allowed to do what, then see what the server allows.
 *
 * Access control is tested as a grid, not as a feeling, and the grid is the
 * artefact. The gap between the two sides is the finding — including the
 * quieter direction, where a role that should be able to work cannot.
 */

type Role = "guest" | "customer" | "support" | "admin";

type Action = {
  id: string;
  label: string;
  endpoint: string;
  /** What the product's rules say, by role. */
  should: Record<Role, boolean>;
  /** What the server actually does, by role. */
  actual: Record<Role, boolean>;
  note: string;
};

const ROLES: Role[] = ["guest", "customer", "support", "admin"];

const ROLE_LABEL: Record<Role, string> = {
  guest: "Guest",
  customer: "Customer",
  support: "Support",
  admin: "Admin",
};

const ACTIONS: Action[] = [
  {
    id: "view-own",
    label: "View their own order",
    endpoint: "GET /orders/{id}",
    should: { guest: false, customer: true, support: true, admin: true },
    actual: { guest: false, customer: true, support: true, admin: true },
    note: "Correct. Signed out gets 401; everyone else can see what they are entitled to.",
  },
  {
    id: "list-all",
    label: "List every customer's orders",
    endpoint: "GET /admin/orders",
    should: { guest: false, customer: false, support: true, admin: true },
    actual: { guest: false, customer: true, support: true, admin: true },
    note: "FINDING. A signed-in customer gets 200 and the whole table. Authentication was checked; authorisation was not.",
  },
  {
    id: "refund",
    label: "Refund an order",
    endpoint: "POST /orders/{id}/refund",
    should: { guest: false, customer: false, support: true, admin: true },
    actual: { guest: false, customer: false, support: true, admin: true },
    note: "Correct. A customer refunding their own order would be a money defect, and the server refuses it.",
  },
  {
    id: "change-price",
    label: "Change a product's price",
    endpoint: "PUT /admin/products/{id}",
    should: { guest: false, customer: false, support: false, admin: true },
    actual: { guest: false, customer: false, support: true, admin: true },
    note: "FINDING. Support can reprice the catalogue. Nothing in the interface offers it, which is why only an API test finds it.",
  },
  {
    id: "export",
    label: "Export the customer list",
    endpoint: "GET /admin/export/customers",
    should: { guest: false, customer: false, support: false, admin: true },
    actual: { guest: false, customer: false, support: false, admin: true },
    note: "Correct. Bulk personal data is admin-only, as it should be.",
  },
  {
    id: "deactivate",
    label: "Deactivate another user",
    endpoint: "POST /admin/users/{id}/deactivate",
    should: { guest: false, customer: false, support: false, admin: true },
    actual: { guest: false, customer: false, support: false, admin: false },
    note: "FINDING, the quiet kind. Even admin gets 403, so nobody can deactivate anyone. Not a security hole — a broken feature, found by the same test.",
  },
];

export function AccessMatrix() {
  const [expected, setExpected] = useState<Record<string, Set<Role>>>(() =>
    Object.fromEntries(ACTIONS.map((a) => [a.id, new Set<Role>()])),
  );
  const [shown, setShown] = useState(false);

  const toggle = (actionId: string, role: Role) => {
    setShown(false);
    setExpected((previous) => {
      const next = new Set(previous[actionId]);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return { ...previous, [actionId]: next };
    });
  };

  const findings = ACTIONS.filter((action) =>
    ROLES.some((role) => action.should[role] !== action.actual[role]),
  );

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          Access control matrix
        </span>
      </div>

      <p className="border-b border-border px-3 py-2 text-xs text-muted">
        Tick who <strong>should</strong> be able to do each action, then
        compare with what the server actually allows.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-2">
            <tr>
              <th className="px-3 py-2 font-semibold">Action</th>
              {ROLES.map((role) => (
                <th key={role} className="px-2 py-2 text-center font-semibold">
                  {ROLE_LABEL[role]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="no-touch-target">
            {ACTIONS.map((action) => (
              <tr key={action.id} className="border-t border-border align-top">
                <td className="px-3 py-2">
                  <span className="block font-medium">{action.label}</span>
                  <code className="text-[0.625rem] text-muted">
                    {action.endpoint}
                  </code>
                </td>
                {ROLES.map((role) => {
                  const ticked = expected[action.id].has(role);
                  const allows = action.actual[role];
                  const shouldAllow = action.should[role];
                  return (
                    <td key={role} className="px-2 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={ticked}
                        onChange={() => toggle(action.id, role)}
                        aria-label={`${ROLE_LABEL[role]} should be able to ${action.label}`}
                      />
                      {shown ? (
                        <span
                          className={`mt-1 block text-[0.625rem] font-semibold ${
                            allows === shouldAllow ? "text-muted" : "text-bad"
                          }`}
                        >
                          {allows ? "allows" : "refuses"}
                        </span>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border p-3">
        <button
          type="button"
          onClick={() => setShown(true)}
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white"
        >
          Show what the server does
        </button>
      </div>

      {shown ? (
        <div className="border-t border-border p-3 text-sm">
          <p className="mb-2 font-medium">
            {findings.length} of {ACTIONS.length} rows disagree with the rules.
          </p>
          <ul className="space-y-2">
            {ACTIONS.map((action) => {
              const broken = findings.includes(action);
              return (
                <li
                  key={action.id}
                  className={`rounded-lg border p-2.5 ${
                    broken
                      ? "border-bad/40 bg-bad-soft"
                      : "border-border bg-surface-2"
                  }`}
                >
                  <strong>{action.label}.</strong> {action.note}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <figcaption className="border-t border-border p-3 text-sm text-muted">
        Six actions, four roles, twenty-four cells. Two cells are security
        findings and one is a broken feature — and none of the three is
        visible from the interface, because the interface simply does not
        offer the buttons.
      </figcaption>
    </figure>
  );
}
