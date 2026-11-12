"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Whether this browser will install the app, and how to ask it to.
 *
 * The timing is the whole problem. Chrome fires beforeinstallprompt once,
 * early — on desktop, reliably before React has hydrated. A listener added
 * in an effect therefore misses it and the offer never appears, which is why
 * installing worked on Android and not on a laptop. The inline script in the
 * root layout catches the event before anything else runs and parks it on
 * window; this hook reads what was parked and listens for the custom event
 * the script dispatches, so it is correct whichever order they happen in.
 *
 * Browsers with no install flow (Firefox, desktop Safari) never fire the
 * event, canInstall stays false, and nothing is offered — which is right,
 * since a button there would do nothing.
 */

type Choice = { outcome: "accepted" | "dismissed" };

export type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<Choice>;
};

declare global {
  interface Window {
    __tsInstall?: InstallEvent | null;
  }
}

export function useInstall() {
  const [ready, setReady] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const sync = () => setReady(Boolean(window.__tsInstall));
    const onInstalled = () => {
      setReady(false);
      setInstalled(true);
    };

    sync();
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    window.addEventListener("ts:installable", sync);
    window.addEventListener("ts:installed", onInstalled);
    return () => {
      window.removeEventListener("ts:installable", sync);
      window.removeEventListener("ts:installed", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    const event = window.__tsInstall;
    if (!event) return "unavailable" as const;
    await event.prompt();
    const { outcome } = await event.userChoice;
    // A deferred prompt can only be used once, accepted or not. Several
    // components call this hook, each with its own state, so clearing ours
    // is not enough — without the announcement the header kept offering an
    // Install button after the app was already installed.
    window.__tsInstall = null;
    if (outcome === "accepted") {
      window.dispatchEvent(new Event("ts:installed"));
    } else {
      setReady(false);
      window.dispatchEvent(new Event("ts:installable"));
    }
    return outcome;
  }, []);

  return { canInstall: ready && !installed, installed, install };
}
