import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import { SocketProvider } from "@/components/socket-provider";
import { ViewportHeightSync } from "@/components/viewport-height-sync";
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
  // Without this, mobile browsers keep the layout viewport full-height and
  // just pan the visual viewport to reveal a focused input above the
  // keyboard -- which drags our fixed header along with it since the pan
  // isn't a DOM scroll our overflow-hidden rules can contain. Resizing the
  // layout viewport itself instead means our flex column (header / scroll
  // region / input) reflows to the smaller height, so the header and input
  // bar stay pinned exactly where they are.
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
      {/* height: var(--app-vh, 100%) + overflow-hidden here (not min-h-full) is
          deliberate: it caps the page to exactly the visible viewport so the
          document itself never grows or scrolls. --app-vh (set by
          ViewportHeightSync from visualViewport.height) keeps that cap correct
          even when a mobile keyboard is open and shrinks what's actually
          visible; 100% is the fallback before that JS runs. Each page is
          responsible for its own single internal scroll region (header/input
          bars stay outside it, pinned by normal flex layout) -- without this
          cap, a page with more content than fits on screen just grows the
          whole document instead. */}
      <body
        className="flex flex-col overflow-hidden overscroll-none bg-background text-foreground"
        style={{ height: "var(--app-vh, 100%)" }}
      >
        <ViewportHeightSync />
        <SocketProvider>{children}</SocketProvider>
      </body>
    </html>
  );
}
