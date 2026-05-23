import { SportsNav } from "./SportsNav";
import { Sidebar } from "./Sidebar";
import { LiveRefresher } from "./LiveRefresher";

export default function LivescoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "60vh", background: "#111", color: "#e8e8e8" }}>
      <LiveRefresher />

      {/* Sport tabs */}
      <div style={{ background: "#1a1a1a", borderBottom: "1px solid rgba(255,255,255,0.06)", overflowX: "auto" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1rem" }}>
          <SportsNav />
        </div>
      </div>

      {/* Body */}
      <div className="ls-body">
        <aside className="ls-sidebar">
          <Sidebar />
        </aside>
        <main className="ls-main">
          {children}
        </main>
      </div>
    </div>
  );
}
