import { LiveRefresher } from "@/app/livescore/LiveRefresher";

export const metadata = { title: "Rwanda Premier League — MIE Sport", description: "Rwanda National League standings, results and stats" };

export default function RwandaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "60vh", background: "var(--bg-page)", color: "var(--t-primary)" }}>
      <LiveRefresher />
      {children}
    </div>
  );
}
