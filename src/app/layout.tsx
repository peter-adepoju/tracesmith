import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, JetBrains_Mono, Jost } from "next/font/google";
import "./globals.css";
import { SiteChrome } from "@/components/SiteChrome";
import { InstallPrompt } from "@/components/mobile/InstallPrompt";
import { ServiceWorkerRegister } from "@/components/mobile/ServiceWorkerRegister";

/* Self-hosted by next/font, so they are part of the build and keep working
   offline in the installed app — a Google Fonts link would not. */
const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--f-display",
  display: "swap",
});

const sans = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--f-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--f-mono",
  display: "swap",
});

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
  // One colour now: Meridian is dark only, and this is the top bar's panel.
  themeColor: "#131c30",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body className="min-h-dvh">
        <SiteChrome>{children}</SiteChrome>
        <InstallPrompt />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
