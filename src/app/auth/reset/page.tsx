"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient, isConfigured } from "@/lib/supabase/client";

/**
 * Set a new password.
 *
 * Reached from the emailed reset link, which lands on /auth/callback first.
 * That route exchanges the code for a session, so by the time you are here
 * you are briefly signed in and may simply update the password.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setHasSession(false);
      return;
    }
    supabase.auth.getUser().then(({ data }) => setHasSession(Boolean(data.user)));
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Use at least six characters.");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setBusy(true);
    const { error: failure } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (failure) {
      setError(
        failure.message.toLowerCase().includes("session")
          ? "That reset link has expired. Request a new one from the sign-in page."
          : failure.message,
      );
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/"), 1800);
  }

  if (!isConfigured()) {
    return (
      <main className="mx-auto w-full max-w-sm px-5 py-10 text-sm text-muted">
        Supabase is not configured, so there is no account to reset.
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-sm px-5 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">
        Set a new password
      </h1>

      {hasSession === false ? (
        <div className="mt-4 rounded-xl border border-warn/40 bg-warn-soft p-3 text-sm">
          <p>
            This page needs a valid reset link. Open the most recent link from
            your email, or request a new one.
          </p>
          <Link
            href="/login"
            className="mt-3 inline-block rounded-xl border border-border bg-bg px-3 py-2 text-sm"
          >
            Back to sign in
          </Link>
        </div>
      ) : done ? (
        <p className="mt-4 rounded-xl border border-ok/40 bg-ok-soft p-3 text-sm">
          Password updated. Taking you back to the course…
        </p>
      ) : (
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="new" className="block text-sm font-medium">
              New password
            </label>
            <div className="relative mt-1.5">
              <input
                id="new"
                type={show ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-3 pr-16 text-base outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="no-touch-target absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1.5 text-xs text-muted"
              >
                {show ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm" className="block text-sm font-medium">
              Confirm it
            </label>
            <input
              id="confirm"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-3 text-base outline-none focus:border-accent"
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-bad/40 bg-bad-soft p-3 text-sm"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-accent px-4 py-3.5 text-base font-medium text-white disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save new password"}
          </button>
        </form>
      )}
    </main>
  );
}
