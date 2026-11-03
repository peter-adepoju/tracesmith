"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient, isConfigured } from "@/lib/supabase/client";
import { syncLocalToAccount } from "@/lib/sync";

/** Shows who is signed in, or a way in. Hidden until Supabase is set up. */
export function AuthBadge() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [menu, setMenu] = useState(false);
  const [synced, setSynced] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setReady(true);
      return;
    }
    let active = true;

    /** Lift any guest progress into the account, and say so if there was some. */
    const lift = async () => {
      const result = await syncLocalToAccount();
      if (!active || !result) return;
      if (result.progress === 0 && result.cards === 0) return;
      const parts = [
        result.progress ? `${result.progress} day${result.progress > 1 ? "s" : ""}` : null,
        result.cards ? `${result.cards} card${result.cards > 1 ? "s" : ""}` : null,
      ].filter(Boolean);
      setSynced(`Moved ${parts.join(" and ")} into your account.`);
      setTimeout(() => active && setSynced(null), 6000);
    };

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setEmail(data.user?.email ?? null);
      setReady(true);
      if (data.user) void lift();
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setEmail(session?.user?.email ?? null);
      if (event === "SIGNED_IN") void lift();
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
        title="Add your Supabase keys to .env.local to sync progress across devices."
      >
        Guest
      </span>
    );
  }

  if (!ready) return <span className="ml-2 w-16" aria-hidden />;

  if (!email) {
    // Come back to the page they were reading.
    const next = pathname.startsWith("/login") ? "/" : pathname;
    return (
      <Link
        href={`/login?next=${encodeURIComponent(next)}`}
        className="ml-2 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white"
      >
        Sign in
      </Link>
    );
  }

  const initial = email[0]?.toUpperCase() ?? "?";

  return (
    <div className="relative ml-2">
      {synced ? (
        <p
          role="status"
          className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 rounded-xl border border-ok/40 bg-ok-soft p-3 text-center text-xs md:inset-x-auto md:right-4 md:bottom-4 md:max-w-xs"
        >
          {synced}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => setMenu((open) => !open)}
        className="grid h-8 w-8 place-items-center rounded-full bg-accent text-xs font-semibold text-white"
        aria-haspopup="menu"
        aria-expanded={menu}
        aria-label={`Signed in as ${email}`}
      >
        {initial}
      </button>

      {menu ? (
        <>
          {/* Tap anywhere else to close, which matters most on a phone. */}
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setMenu(false)}
            aria-hidden
            tabIndex={-1}
          />
          <div
            role="menu"
            className="absolute right-0 top-10 z-50 w-56 rounded-xl border border-border bg-surface p-1.5 shadow-lg"
          >
            <p className="truncate px-2.5 py-2 text-xs text-muted" title={email}>
              {email}
            </p>
            <hr className="my-1 border-border" />
            <button
              type="button"
              onClick={async () => {
                await getSupabaseBrowserClient()?.auth.signOut();
                setMenu(false);
                router.refresh();
              }}
              className="w-full rounded-lg px-2.5 py-2 text-left text-sm hover:bg-surface-2"
            >
              Sign out
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
