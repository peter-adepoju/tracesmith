"use client";

import Link from "next/link";
import { useState } from "react";
import { getSupabaseBrowserClient, isConfigured } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  const configured = isConfigured();

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setStatus("sending");
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl}/auth/callback` },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    setStatus("sent");
  }

  return (
    <main className="mx-auto max-w-md px-4 py-20">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-muted">
        Signing in saves your progress, quiz scores and flashcard schedule so
        they follow you between devices.
      </p>

      {!configured ? (
        <div className="mt-6 rounded-xl border border-border bg-surface p-4 text-sm">
          <p className="font-medium">Supabase is not configured yet.</p>
          <p className="mt-2 text-muted">
            Copy <code>.env.example</code> to <code>.env.local</code> and fill
            in the two Supabase values, then run <code>supabase/schema.sql</code>{" "}
            in your project&apos;s SQL editor. Until then the course works fine
            as a guest and progress is kept in this browser only.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white"
          >
            Back to the course
          </Link>
        </div>
      ) : status === "sent" ? (
        <div className="mt-6 rounded-xl border border-ok/40 bg-ok-soft p-4 text-sm">
          <p className="font-medium">Check your email.</p>
          <p className="mt-1 text-muted">
            We sent a sign-in link to {email}. It opens this site already signed
            in.
          </p>
        </div>
      ) : (
        <form onSubmit={send} className="mt-6 space-y-3">
          <label htmlFor="email" className="block text-sm font-medium">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {status === "sending" ? "Sending…" : "Email me a sign-in link"}
          </button>
          {status === "error" ? (
            <p className="text-sm text-bad">{message}</p>
          ) : null}
          <p className="pt-2 text-xs text-muted">
            No password. We email a one-time link.
          </p>
        </form>
      )}
    </main>
  );
}
