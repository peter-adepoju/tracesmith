"use client";

import { useState } from "react";

/**
 * A form you can misconfigure, and the payload it actually sends.
 *
 * The screen tells you almost nothing about a form. The payload tells you
 * everything. Removing a name attribute here and watching the field vanish
 * from the submission — while still looking perfectly normal — teaches the
 * lesson better than any amount of prose.
 */

type Field = {
  key: string;
  label: string;
  type: string;
  value: string;
  hasName: boolean;
  required: boolean;
  disabled: boolean;
};

const INITIAL: Field[] = [
  {
    key: "email",
    label: "Email",
    type: "email",
    value: "ada@example.com",
    hasName: true,
    required: true,
    disabled: false,
  },
  {
    key: "quantity",
    label: "Quantity",
    type: "number",
    value: "2",
    hasName: true,
    required: false,
    disabled: false,
  },
  {
    key: "reference",
    label: "Reference",
    type: "text",
    value: "ORDER-1001",
    hasName: true,
    required: false,
    disabled: false,
  },
];

export function FormLab() {
  const [fields, setFields] = useState<Field[]>(INITIAL);
  const [payload, setPayload] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);

  const update = (key: string, patch: Partial<Field>) =>
    setFields((previous) =>
      previous.map((f) => (f.key === key ? { ...f, ...patch } : f)),
    );

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setBlocked(null);

    // What the browser would refuse, before anything is sent.
    const emptyRequired = fields.find(
      (f) => f.required && !f.disabled && f.value.trim() === "",
    );
    if (emptyRequired) {
      setPayload(null);
      setBlocked(
        `The browser blocked this: "${emptyRequired.label}" is required and empty. Nothing was sent. A server must still check this itself — anyone can remove the attribute in DevTools.`,
      );
      return;
    }

    // What a browser actually packages up: named, enabled fields only.
    const body: Record<string, string> = {};
    for (const field of fields) {
      if (!field.hasName) continue;
      if (field.disabled) continue;
      body[field.key] = field.value;
    }
    setPayload(JSON.stringify(body, null, 2));
  }

  const dropped = fields.filter((f) => !f.hasName || f.disabled);

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          What a form actually sends
        </span>
      </div>

      <form onSubmit={submit} className="space-y-3 p-3">
        {fields.map((field) => (
          <div key={field.key} className="rounded-lg border border-border p-3">
            <label className="block text-sm font-medium">
              {field.label}
              <input
                type={field.type}
                value={field.value}
                required={field.required}
                disabled={field.disabled}
                onChange={(event) =>
                  update(field.key, { value: event.target.value })
                }
                className="mt-1 w-full rounded-md border border-border bg-bg px-2 py-2 text-sm disabled:opacity-40"
              />
            </label>

            <div className="no-touch-target mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {([
                ["hasName", "name"],
                ["required", "required"],
                ["disabled", "disabled"],
              ] as const).map(([prop, label]) => (
                <label key={prop} className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={field[prop]}
                    onChange={(event) =>
                      update(field.key, { [prop]: event.target.checked })
                    }
                  />
                  <code>{label}</code>
                </label>
              ))}
              <span className="ml-auto font-mono text-muted">
                {field.hasName ? `name="${field.key}"` : "(no name)"}
              </span>
            </div>
          </div>
        ))}

        <button
          type="submit"
          className="w-full rounded-lg bg-accent px-3 py-2.5 text-sm font-medium text-white"
        >
          Submit
        </button>
      </form>

      <figcaption className="border-t border-border p-3 text-sm">
        {blocked ? (
          <p className="rounded-lg border border-warn/40 bg-warn-soft p-2.5 text-xs">
            {blocked}
          </p>
        ) : payload ? (
          <>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
              Request payload
            </p>
            <pre className="mt-1.5 overflow-x-auto rounded-lg bg-[var(--code-bg)] p-3 font-mono text-xs text-[var(--code-text)]">
              {payload}
            </pre>
            {dropped.length > 0 ? (
              <p className="mt-2 rounded-lg border border-bad/40 bg-bad-soft p-2.5 text-xs">
                <strong>
                  {dropped.length} field{dropped.length > 1 ? "s" : ""} never
                  left the browser:
                </strong>{" "}
                {dropped.map((f) => f.label).join(", ")}. Each one still looks
                completely normal on screen. This is why you read the Payload
                tab rather than trusting the form.
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-muted">
            Submit to see the payload. Then untick <code>name</code> on a field
            and submit again — the field still looks fine, and its value
            silently disappears from the request.
          </p>
        )}
      </figcaption>
    </figure>
  );
}
