import Link from "next/link";
import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-inner">
        <div className="lp-footer-logo">
          <Image src="/mie-logo.png" alt="MIE Sport" width={28} height={28} style={{ borderRadius: 6, display: "block" }} />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#fff" }}>MIE Sport</span>
          <span style={{ fontSize: 12, color: "var(--lp-muted-fg)" }}>© {new Date().getFullYear()}</span>
        </div>
        <div className="lp-footer-links">
          <Link href="/livescore">Livescore</Link>
          <Link href="/#matches">Watch</Link>
          <Link href="/worldcup">World Cup</Link>
          <span>Special thanks to{" "}
            <span style={{ color: "#f5a623", fontWeight: 700 }}>GACONDO Tech</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
