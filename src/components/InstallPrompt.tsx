"use client";

import { useEffect, useState } from "react";
import { useInstall } from "@/lib/use-install";

/**
 * An offer to install, shown once.
 *
 * Three different situations, not one message squeezed to fit. Chrome and Edge
 * fire beforeinstallprompt on both phone and laptop, so there a real button
 * opens the browser's own install dialog — but what installing *means* differs
 * (a home-screen icon against a window of its own), so the wording differs
 * too. iOS Safari has no such event and installing is a manual Share -> Add to
 * Home Screen, so there we show the instruction rather than a button that
 * would do nothing.
 *
 * Dismissed once, it stays dismissed — the header keeps an Install link for
 * as long as the browser will still install, so dismissing costs nothing.
 */

const KEY = "tracesmith:install-dismissed";

export function InstallPrompt() {
  const { canInstall, install } = useInstall();
  const [dismissed, setDismissed] = useState(true);
  const [iosHint, setIosHint] = useState(false);
  const [wide, setWide] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY)) return;
    } catch {
      return;
    }
    setDismissed(false);

    const query = window.matchMedia("(min-width: 768px)");
    setWide(query.matches);
    const onResize = () => setWide(query.matches);
    query.addEventListener("change", onResize);

    // iOS: no install event exists, so detect and instruct instead.
    const ua = navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|Android/.test(ua);
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (isIos && isSafari && !standalone) {
      timer = setTimeout(() => setIosHint(true), 4000);
    }

    return () => {
      if (timer) clearTimeout(timer);
      query.removeEventListener("change", onResize);
    };
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // Nothing to do; it will simply offer again next time.
    }
    setDismissed(true);
    setIosHint(false);
  }

  if (dismissed) return null;
  if (!canInstall && !iosHint) return null;

  return (
    <div
      className="fixed inset-x-3 z-[60] border border-border bg-surface p-4 shadow-lg md:left-auto md:right-4 md:max-w-sm"
      // On a phone the tab bar owns the bottom of the screen; on a laptop
      // there is no tab bar to clear.
      style={{
        bottom: wide ? "1rem" : "calc(4.25rem + env(safe-area-inset-bottom))",
      }}
      role="dialog"
      aria-label="Install Tracesmith"
    >
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="" className="h-10 w-10 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Install Tracesmith</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">
            {!canInstall ? (
              <>
                Tap <strong className="text-muted-2">Share</strong>, then{" "}
                <strong className="text-muted-2">Add to Home Screen</strong>.
                Lessons you have read stay available offline.
              </>
            ) : wide ? (
              <>
                It opens in its own window, off the tab strip. Lessons you have
                read stay available offline.
              </>
            ) : (
              <>
                Add it to your home screen. Lessons you have read stay available
                offline.
              </>
            )}
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        {canInstall ? (
          <button
            type="button"
            onClick={async () => {
              await install();
              dismiss();
            }}
            className="flex-1 bg-accent px-3 py-2.5 text-sm font-medium"
          >
            Install
          </button>
        ) : null}
        <button
          type="button"
          onClick={dismiss}
          className={`border border-border px-3 py-2.5 text-sm text-muted-2 ${canInstall ? "" : "flex-1"}`}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
