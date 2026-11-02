import type { Metadata } from "next";
import "./globals.css";
import { SiteChrome } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: {
    default: "Tracesmith",
    template: "%s · Tracesmith",
  },
  description:
    "A course on QA testing, technical support and AI automation, from zero. Twenty-six weeks, one merged path, with labs on a real product.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
