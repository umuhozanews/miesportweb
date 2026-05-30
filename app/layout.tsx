import type { Metadata } from "next";
import { Inter, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { MobileNav } from "./MobileNav";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { TickerBar } from "./TickerBar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const barlowCondensed = Barlow_Condensed({ subsets: ["latin"], variable: "--font-display", display: "swap", weight: ["600", "700", "800"] });

export const metadata: Metadata = {
  title: "MIE SPORT — Live Football & Sports",
  description: "Live scores, free HD streams and full World Cup coverage — all in one fast, clean place.",
  icons: {
    icon: [{ url: "/mie-logo.png", type: "image/png" }],
    apple: "/mie-logo.png",
    shortcut: "/mie-logo.png",
  },
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${barlowCondensed.variable}`}>
      <head>
        <link rel="preload" as="image" href="/foot.png" fetchPriority="high" />
      </head>
      <body className={inter.className}>
        <SiteHeader />
        <TickerBar />
        {children}
        <SiteFooter />
        <MobileNav />
      </body>
    </html>
  );
}
