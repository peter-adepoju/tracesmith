"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthBadge } from "@/components/AuthBadge";
import { useEffect, useState } from "react";
import { InstallButton } from "@/components/InstallButton";
import { SearchButton } from "@/components/SearchButton";
import { SearchDialog } from "@/components/SearchDialog";
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
  { href: "/course", label: "Course" },
  { href: "/lab", label: "Labs" },
  { href: "/build", label: "Build" },
  { href: "/notebook", label: "Notebook" },
  { href: "/review", label: "Review" },
  { href: "/sandbox", label: "Sandbox" },
];

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = pathname?.startsWith("/meridian");

  /* Search lives here because this is the one component rendered exactly
     once. There are two triggers on screen and only ever one dialog. */
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setSearchOpen((was) => !was);
        return;
      }
      // "/" is the other shortcut fingers already know — but not while they
      // are busy typing a "/" into something.
      if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const target = event.target as HTMLElement | null;
        const typing =
          target?.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "");
        if (!typing) {
          event.preventDefault();
          setSearchOpen(true);
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Meridian is the product under test and gets none of this chrome — but the
  // hooks above must still run, so this check stays below them.
  if (bare) return <>{children}</>;

  return (
    <>
      <header
        className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-5 px-4">
          <Link href="/" className="font-display text-xl">
            Tracesmith
          </Link>

          <nav className="ml-auto hidden items-center gap-1 text-sm md:flex">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-2.5 py-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-text"
              >
                {link.label}
              </Link>
            ))}
            <SearchButton onOpen={() => setSearchOpen(true)} />
            <InstallButton />
            <AuthBadge />
          </nav>

          {/* On a phone the labelled button would crowd the bar, so search
              becomes an icon — but it stays in the top bar rather than moving
              into the tab row, which is already full. */}
          <div className="ml-auto flex items-center gap-1 md:hidden">
            <SearchButton compact onOpen={() => setSearchOpen(true)} />
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

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
