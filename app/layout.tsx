import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { MobileNav } from "./MobileNav";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap", weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  title: "MIE Sport — Live Football",
  description: "Live football scores, standings and results — Rwanda Premier League, World Cup and more.",
  icons: {
    icon: [{ url: "/mie-logo.png", type: "image/png" }],
    apple: "/mie-logo.png",
    shortcut: "/mie-logo.png",
  },
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className={inter.className}>
        <div id="gt_root" style={{ display: "none" }} />
        <SiteHeader />
        {children}
        <SiteFooter />
        <MobileNav />

        <Script id="gt-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{
          __html: `function googleTranslateElementInit(){new google.translate.TranslateElement({pageLanguage:'en',includedLanguages:'en,fr,rw',autoDisplay:false},'gt_root');}`,
        }} />
        <Script
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
