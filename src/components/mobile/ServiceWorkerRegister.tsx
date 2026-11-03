"use client";

import { useEffect } from "react";

/**
 * Registers the service worker, in production only.
 *
 * Kept out of development deliberately: a service worker caching pages while
 * you are editing them produces baffling stale results, and the hour lost to
 * that is an hour nobody enjoys.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // An unavailable service worker costs offline support and nothing else.
      });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
