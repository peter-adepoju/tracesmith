"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { getSupabaseBrowserClient, isConfigured } from "@/lib/supabase/client";

/**
 * Email and password sign-in.
 *
 * Deliberately not a magic link. An emailed link opens the system browser,
 * not the installed app, so on a phone you sign in somewhere you are not —
 * and Supabase's built-in email service is rate limited to a handful of
 * messages an hour, which makes the whole flow feel broken.
 *
 * Password sign-in needs no email at all once an account exists.
 */

type Mode = "signin" | "signup" | "forgot";

/** Supabase's errors are terse. Say what to actually do. */
function explain(message: string, mode: Mode): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) {
    return "That email and password do not match an account. Check for a typo, or create an account below.";
  }
  if (m.includes("email not confirmed")) {
    return "This account exists but the email has not been confirmed. Check your inbox, or turn off email confirmation in Supabase under Authentication → Sign In / Providers.";
  }
  if (m.includes("user already registered") || m.includes("already been registered")) {
    return "An account with that email already exists. Sign in instead, or reset the password.";
  }
  if (m.includes("password should be at least")) {
    return "That password is too short. Supabase requires at least six characters by default.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Too many attempts for now. Supabase rate limits this; wait a minute and try again.";
  }
  if (m.includes("fetch")) {
    return "Could not reach Supabase. Check your internet connection and that the project URL is correct.";
  }
  return message || (mode === "signup" ? "Could not create the account." : "Could not sign in.");
}

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") ?? "/";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const configured = isConfigured();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);

    try {
      if (mode === "signin") {
        const { error: failure } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (failure) {
          setError(explain(failure.message, mode));
          return;
        }
        router.push(next);
        router.refresh();
        return;
      }

      if (mode === "signup") {
        const { data, error: failure } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (failure) {
          setError(explain(failure.message, mode));
          return;
        }
        // With email confirmation off, a session comes back straight away.
        if (data.session) {
          router.push(next);
          router.refresh();
          return;
        }
        setNotice(
          "Account created. Supabase is set to confirm emails, so check your inbox for the confirmation link before signing in.",
        );
        setMode("signin");
        return;
      }

      // Forgot password.
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
      const { error: failure } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${siteUrl}/auth/callback?next=/auth/reset` },
      );
      if (failure) {
        setError(explain(failure.message, mode));
        return;
      }
      setNotice(
        "If an account exists for that address, a reset link is on its way. The link expires in an hour.",
      );
    } catch (exception) {
      setError(
        exception instanceof Error
          ? explain(exception.message, mode)
          : "Something went wrong.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!configured) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 text-sm">
        <p className="font-medium">Supabase is not configured.</p>
        <p className="mt-2 text-muted">
          The course works fully as a guest and keeps progress in this browser.
          To sync between devices, set{" "}
          <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>, then run{" "}
          <code>supabase/schema.sql</code>.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white"
        >
          Back to the course
        </Link>
      </div>
    );
  }

  const title =
    mode === "signin"
      ? "Sign in"
      : mode === "signup"
        ? "Create your account"
        : "Reset your password";

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted">
        {mode === "forgot"
          ? "Enter your email and we will send a link to set a new password."
          : "Your progress, quiz scores and flashcard schedule follow you between your phone and your laptop."}
      </p>

      {/* Mode switch */}
      {mode !== "forgot" ? (
        <div className="no-touch-target mt-5 grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError("");
                setNotice("");
              }}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                mode === m ? "bg-bg shadow-sm" : "text-muted"
              }`}
            >
              {m === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>
      ) : null}

      <form onSubmit={submit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-3 text-base outline-none focus:border-accent"
          />
        </div>

        {mode !== "forgot" ? (
          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              {mode === "signin" ? (
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setError("");
                    setNotice("");
                  }}
                  className="no-touch-target text-xs text-muted underline"
                >
                  Forgot?
                </button>
              ) : null}
            </div>
            <div className="relative mt-1.5">
              <input
                id="password"
                type={show ? "text" : "password"}
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
                className="w-full rounded-xl border border-border bg-surface px-3 py-3 pr-16 text-base outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="no-touch-target absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1.5 text-xs text-muted"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="rounded-xl border border-bad/40 bg-bad-soft p-3 text-sm"
          >
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="rounded-xl border border-ok/40 bg-ok-soft p-3 text-sm">
            {notice}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-accent px-4 py-3.5 text-base font-medium text-white disabled:opacity-60"
        >
          {busy
            ? "Working…"
            : mode === "signin"
              ? "Sign in"
              : mode === "signup"
                ? "Create account"
                : "Send reset link"}
        </button>

        {mode === "forgot" ? (
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError("");
              setNotice("");
            }}
            className="w-full rounded-xl border border-border px-4 py-3 text-sm"
          >
            Back to sign in
          </button>
        ) : null}
      </form>

      <p className="mt-6 text-xs text-muted">
        Guest mode works fully and keeps progress in this browser. Signing in
        only adds syncing between devices.
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <main className="mx-auto w-full max-w-sm px-5 py-10">
      <Suspense
        fallback={<p className="text-sm text-muted">Loading…</p>}
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
