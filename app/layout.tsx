import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

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
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        {/* Hidden Google Translate mount point */}
        <div id="gt_root" style={{ display: "none" }} />
        {children}

        {/* Google Translate — init function must load before the element script */}
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
