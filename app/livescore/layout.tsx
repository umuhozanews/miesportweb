import { SportsNav } from "./SportsNav";
import { Sidebar } from "./Sidebar";
import { LiveRefresher } from "./LiveRefresher";

export default function LivescoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "60vh", background: "var(--bg-page)", color: "var(--t-primary)" }}>
      <LiveRefresher />

      {/* Sport tabs */}
      <div style={{ background: "#0a1628", borderBottom: "1px solid #0f2040", overflowX: "auto" }}>
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
