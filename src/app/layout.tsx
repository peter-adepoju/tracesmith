import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteChrome } from "@/components/SiteChrome";
import { InstallPrompt } from "@/components/mobile/InstallPrompt";
import { ServiceWorkerRegister } from "@/components/mobile/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: {
    default: "Tracesmith",
    template: "%s · Tracesmith",
  },
  description:
    "A course on QA testing, technical support and AI automation, from zero. Twenty-six weeks, one merged path, with labs on a real product.",
  manifest: "/manifest.webmanifest",
  applicationName: "Tracesmith",
  appleWebApp: {
    capable: true,
    title: "Tracesmith",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets the page paint under the notch and the home indicator, which is what
  // makes an installed PWA feel like an app rather than a web page.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#14130f" },
  ],
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
        <InstallPrompt />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
