import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, JetBrains_Mono, Jost } from "next/font/google";
import "./globals.css";
import { SiteChrome } from "@/components/SiteChrome";
import { InstallPrompt } from "@/components/InstallPrompt";
import { ServiceWorkerRegister } from "@/components/mobile/ServiceWorkerRegister";

/**
 * Catch beforeinstallprompt before anything else runs.
 *
 * The browser fires it once, early — on desktop, before React has hydrated —
 * so a listener added inside a component misses it entirely and the app looks
 * uninstallable when it is not. This runs inline, ahead of hydration, parks
 * the event on window and announces it; useInstall reads both.
 */
const CAPTURE_INSTALL = `(function(){
  window.__tsInstall = null;
  addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    window.__tsInstall = e;
    dispatchEvent(new Event('ts:installable'));
  });
  addEventListener('appinstalled', function () {
    window.__tsInstall = null;
    dispatchEvent(new Event('ts:installed'));
  });
})();`;

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
  // One colour: the theme is dark only, and this is the top bar's panel.
  themeColor: "#111113",
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
      <head>
        <script dangerouslySetInnerHTML={{ __html: CAPTURE_INSTALL }} />
      </head>
      <body className="min-h-dvh">
        <SiteChrome>{children}</SiteChrome>
        <InstallPrompt />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
