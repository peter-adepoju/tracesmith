"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthBadge } from "@/components/AuthBadge";

/**
 * The site header and footer.
 *
 * Hidden on /meridian, because that route is the product under test and is
 * loaded inside an iframe in the lab. Course chrome inside the thing you are
 * testing would be confusing and would get in the way of real DevTools work.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = pathname?.startsWith("/meridian");

  if (bare) return <>{children}</>;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-5 px-4">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="text-lg font-semibold tracking-tight">Tracesmith</span>
            <span className="hidden text-xs text-muted sm:inline">
              QA · Support · Automation
            </span>
          </Link>
          <nav className="ml-auto flex items-center gap-1 text-sm">
            <Link
              href="/"
              className="rounded-md px-2.5 py-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              Course
            </Link>
            <Link
              href="/lab"
              className="rounded-md px-2.5 py-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              Labs
            </Link>
            <Link
              href="/build"
              className="rounded-md px-2.5 py-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              Build
            </Link>
            <Link
              href="/review"
              className="rounded-md px-2.5 py-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              Review
            </Link>
            <Link
              href="/sandbox"
              className="rounded-md px-2.5 py-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              Sandbox
            </Link>
            <AuthBadge />
          </nav>
        </div>
      </header>
      {children}
      <footer className="mt-20 border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-4 text-xs text-muted">
          Tracesmith — a course on QA testing, technical support and AI
          automation. Progress saves to your account when you are signed in.
        </div>
      </footer>
    </>
  );
}
