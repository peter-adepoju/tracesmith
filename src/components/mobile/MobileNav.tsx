"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The bottom tab bar, phones only.
 *
 * Thumbs reach the bottom of a phone, not the top, so the primary navigation
 * lives there. Four destinations is the most that stays comfortable; anything
 * else is reached from inside a section.
 *
 * It sits above the home indicator using env(safe-area-inset-bottom), and
 * every target is at least 44px tall.
 */

type Tab = {
  href: string;
  label: string;
  icon: React.ReactNode;
  /** Also highlight for these path prefixes. */
  match: string[];
};

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const TABS: Tab[] = [
  {
    href: "/",
    label: "Course",
    match: ["/day"],
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" {...stroke}>
        <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5Z" />
        <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5Z" />
      </svg>
    ),
  },
  {
    href: "/lab",
    label: "Labs",
    match: ["/lab"],
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" {...stroke}>
        <path d="M9 3v6.2L4.6 17A2 2 0 0 0 6.3 20h11.4a2 2 0 0 0 1.7-3L15 9.2V3" />
        <path d="M8 3h8M7.5 14h9" />
      </svg>
    ),
  },
  {
    href: "/build",
    label: "Build",
    match: ["/build"],
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" {...stroke}>
        <path d="m8 9-4 3 4 3M16 9l4 3-4 3M13.5 6l-3 12" />
      </svg>
    ),
  },
  {
    href: "/review",
    label: "Review",
    match: ["/review"],
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" {...stroke}>
        <rect x="3" y="6" width="14" height="12" rx="2" />
        <path d="M7 3h11a3 3 0 0 1 3 3v9" />
      </svg>
    ),
  },
];

export function MobileNav() {
  const pathname = usePathname() ?? "/";

  const isActive = (tab: Tab) =>
    tab.href === "/"
      ? pathname === "/" || tab.match.some((p) => pathname.startsWith(p))
      : tab.match.some((p) => pathname.startsWith(p));

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-bg/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Main"
    >
      <ul className="mx-auto flex max-w-lg">
        {TABS.map((tab) => {
          const active = isActive(tab);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 text-[0.625rem] font-medium transition-colors ${
                  active ? "text-accent" : "text-muted"
                }`}
              >
                {tab.icon}
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
