"use client";

import { useEffect, useState } from "react";

/**
 * An offer to install, shown once.
 *
 * Chrome on Android fires beforeinstallprompt, so there we can trigger the
 * real install dialog. iOS Safari has no such event and installing is a
 * manual Share -> Add to Home Screen, so there we show the instruction
 * instead of a button that would do nothing.
 *
 * Dismissed once, it stays dismissed.
 */

const KEY = "tracesmith:install-dismissed";

type Choice = { outcome: "accepted" | "dismissed" };
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<Choice>;
};

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY)) return;
    } catch {
      return;
    }

    // Already installed: nothing to offer.
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS: no install event exists, so detect and instruct instead.
    const ua = navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|Android/.test(ua);
    if (isIos && isSafari) {
      const id = setTimeout(() => setIosHint(true), 4000);
      return () => {
        clearTimeout(id);
        window.removeEventListener("beforeinstallprompt", onPrompt);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // Nothing to do; it will simply offer again next time.
    }
    setDeferred(null);
    setIosHint(false);
  }

  if (!deferred && !iosHint) return null;

  return (
    <div
      className="fixed inset-x-3 z-[60] rounded-2xl border border-border bg-surface p-4 shadow-lg md:left-auto md:right-4 md:max-w-sm"
      style={{ bottom: "calc(4.25rem + env(safe-area-inset-bottom))" }}
      role="dialog"
      aria-label="Install Tracesmith"
    >
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon-192.png"
          alt=""
          className="h-10 w-10 shrink-0 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Install Tracesmith</p>
          {deferred ? (
            <p className="mt-0.5 text-xs text-muted">
              Add it to your home screen. Lessons you have read stay available
              offline.
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-muted">
              Tap <strong>Share</strong>, then{" "}
              <strong>Add to Home Screen</strong>. Lessons you have read stay
              available offline.
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        {deferred ? (
          <button
            type="button"
            onClick={async () => {
              await deferred.prompt();
              await deferred.userChoice;
              dismiss();
            }}
            className="flex-1 rounded-xl bg-accent px-3 py-2.5 text-sm font-medium text-white"
          >
            Install
          </button>
        ) : null}
        <button
          type="button"
          onClick={dismiss}
          className={`rounded-xl border border-border px-3 py-2.5 text-sm ${deferred ? "" : "flex-1"}`}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
