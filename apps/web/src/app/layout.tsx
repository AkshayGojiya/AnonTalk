import type { Metadata } from "next";
import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import { SocketProvider } from "@/components/socket-provider";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bricolage.variable} ${jetbrainsMono.variable} h-full overflow-hidden antialiased`}>
      {/* h-full + overflow-hidden here (not min-h-full) is deliberate: it caps
          the page to exactly the viewport so the document itself never grows
          or scrolls. Each page is responsible for its own single internal
          scroll region (header/input bars stay outside it, pinned by normal
          flex layout) -- without this cap, a page with more content than fits
          on screen just grows the whole document instead. */}
      <body className="flex h-full flex-col overflow-hidden overscroll-none bg-background text-foreground">
        <SocketProvider>{children}</SocketProvider>
      </body>
    </html>
  );
}
