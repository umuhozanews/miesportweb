"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  {
    href: "/livescore",
    label: "Scores",
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
        <circle cx={12} cy={12} r={10} />
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" strokeWidth={0} />
        <path d="M12 6l2 4h4l-3.2 2.4L16 17l-4-2.6L8 17l1.2-4.6L6 10h4z" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    href: "/rwanda",
    label: "Rwanda",
    icon: <span style={{ fontSize: 20, lineHeight: 1 }}>🇷🇼</span>,
  },
  {
    href: "/worldcup",
    label: "World Cup",
    icon: <span style={{ fontSize: 20, lineHeight: 1 }}>🏆</span>,
  },
  {
    href: "/",
    label: "Watch",
    watch: true,
    icon: (
      <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z" />
      </svg>
    ),
  },
];

export function MobileNav() {
  const path = usePathname();

  return (
    <nav className="mob-bottom-nav" aria-label="Navigation">
      {NAV.map((item) => {
        const active = item.href === "/"
          ? path === "/" || path.startsWith("/watch")
          : path.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`mob-nav-item${item.watch ? " mob-nav-watch" : ""}${active ? " active" : ""}`}
          >
            <span className="mob-nav-icon">{item.icon}</span>
            <span className="mob-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
