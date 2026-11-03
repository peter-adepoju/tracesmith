"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthBadge } from "@/components/AuthBadge";
import { MobileNav } from "@/components/mobile/MobileNav";

/**
 * The app shell.
 *
 * Two different layouts, not one squeezed layout. On a phone the primary
 * navigation is a bottom tab bar where thumbs reach, and the top bar shrinks
 * to a title. On a wider screen the top bar carries everything and the tab
 * bar disappears.
 *
 * Hidden entirely on /meridian, which is the product under test and loads
 * inside an iframe in the lab.
 */

const LINKS = [
  { href: "/", label: "Course" },
  { href: "/lab", label: "Labs" },
  { href: "/build", label: "Build" },
  { href: "/review", label: "Review" },
  { href: "/sandbox", label: "Sandbox" },
];

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = pathname?.startsWith("/meridian");

  if (bare) return <>{children}</>;

  return (
    <>
      <header
        className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-5 px-4">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="text-lg font-semibold tracking-tight">
              Tracesmith
            </span>
            <span className="hidden text-xs text-muted sm:inline">
              QA · Support · Automation
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 text-sm md:flex">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-2.5 py-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-text"
              >
                {link.label}
              </Link>
            ))}
            <AuthBadge />
          </nav>

          <div className="ml-auto md:hidden">
            <AuthBadge />
          </div>
        </div>
      </header>

      {/* Room for the tab bar so it never covers the last line of a lesson. */}
      <div className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </div>

      <footer className="mt-16 hidden border-t border-border py-8 md:block">
        <div className="mx-auto max-w-6xl px-4 text-xs text-muted">
          Tracesmith — a course on QA testing, technical support and AI
          automation. Progress saves to your account when you are signed in.
        </div>
      </footer>

      <MobileNav />
    </>
  );
}
