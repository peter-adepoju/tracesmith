"use client";

import { useInstall } from "@/lib/use-install";

/**
 * A permanent way back to the install dialog.
 *
 * The banner can be dismissed for good, and on a laptop the browser's own
 * install control is a small icon in the address bar that is easy to miss.
 * This renders only while the browser will actually install — once installed,
 * or in a browser with no install flow, it disappears rather than lying.
 */
export function InstallButton({ className = "" }: { className?: string }) {
  const { canInstall, install } = useInstall();

  if (!canInstall) return null;

  return (
    <button
      type="button"
      onClick={() => void install()}
      className={`px-2.5 py-1.5 text-sm text-accent transition-colors hover:text-text ${className}`}
    >
      Install
    </button>
  );
}
