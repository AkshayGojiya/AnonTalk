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
        className="flex flex-col overflow-hidden overscroll-none bg-background text-foreground"
        style={{ height: "var(--app-vh, 100%)" }}
      >
        <ViewportHeightSync />
        <SocketProvider>{children}</SocketProvider>
      </body>
    </html>
  );
}
