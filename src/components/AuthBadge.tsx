"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient, isConfigured } from "@/lib/supabase/client";

/** Shows who is signed in, or a link to sign in. Hidden until Supabase is set up. */
export function AuthBadge() {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setReady(true);
      return;
    }
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setEmail(data.user?.email ?? null);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!isConfigured()) {
    return (
      <span
        className="ml-2 rounded-md border border-border px-2 py-1 text-xs text-muted"
        title="Add your Supabase keys to .env.local to save progress across devices."
      >
        Guest
      </span>
    );
  }

  if (!ready) {
    return <span className="ml-2 w-16" aria-hidden />;
  }

  if (!email) {
    return (
      <Link
        href="/login"
        className="ml-2 rounded-md bg-accent px-2.5 py-1.5 text-xs font-medium text-white"
      >
        Sign in
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={async () => {
        await getSupabaseBrowserClient()?.auth.signOut();
        location.reload();
      }}
      className="ml-2 max-w-[11rem] truncate rounded-md border border-border px-2 py-1 text-xs text-muted transition-colors hover:text-text"
      title={`Signed in as ${email}. Click to sign out.`}
    >
      {email}
    </button>
  );
}
