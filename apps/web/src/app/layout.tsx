import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import { SocketProvider } from "@/components/socket-provider";
import { ViewportHeightSync } from "@/components/viewport-height-sync";
import { PinchZoomGuard } from "@/components/pinch-zoom-guard";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "AnonTalk",
  description: "Verified Students. Real Conversations.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Chromium-only opt-in; Safari doesn't implement interactive-widget at all
  // (ViewportHeightSync is the real cross-browser fix).
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${jetbrainsMono.variable} overflow-hidden antialiased`}
      style={{ height: "var(--app-vh, 100%)" }}
    >
      <body
        // `fixed` (not just overflow-hidden) removes body from iOS's page-scroll
        // model entirely -- overflow-hidden alone still lets iOS pan the whole
        // page to keep a focused input visible above the keyboard, even when
        // there's no scrollable content anywhere on the page.
        className="fixed inset-x-0 top-0 flex flex-col overflow-hidden overscroll-none bg-background text-foreground"
        style={{ height: "var(--app-vh, 100%)" }}
      >
        <ViewportHeightSync />
        <PinchZoomGuard />
        {/* Transform target for ViewportHeightSync -- kept as a wrapper
            (not applied to body itself) so Radix/base-ui dialog portals,
            which mount as siblings of this div directly under body, keep
            their `fixed` positioning relative to the real viewport. */}
        <div id="viewport-shell" className="flex flex-1 flex-col overflow-hidden">
          <SocketProvider>{children}</SocketProvider>
        </div>
      </body>
    </html>
  );
}
