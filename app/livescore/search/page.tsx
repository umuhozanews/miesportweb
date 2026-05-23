export const dynamic = "force-dynamic";
import Link from "next/link";
import { espnSearchTeams } from "@/lib/espn";
import { TeamImg } from "@/app/livescore/TeamImg";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const teams = query ? await espnSearchTeams(query) : [];

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "1.5rem 1rem" }}>
      {/* Search form */}
      <form action="/livescore/search" method="get" style={{ display: "flex", gap: 8, marginBottom: "1.5rem" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: "#1a1a1a", border: "1px solid #242424", borderRadius: 9, padding: "10px 14px" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            name="q"
            defaultValue={query}
            placeholder="Search teams…"
            autoFocus
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#e8e8e8", fontSize: 14 }}
          />
        </div>
        <button type="submit" style={{
          background: "#1e3a6e", color: "#60a5fa", border: "1px solid #1e3a6e",
          borderRadius: 9, padding: "10px 22px", fontWeight: 700, fontSize: 13,
          cursor: "pointer", flexShrink: 0,
        }}>
          Search
        </button>
      </form>

      {!query && (
        <p style={{ color: "#3a3a3a", textAlign: "center", padding: "3rem 0", fontSize: 13 }}>Enter a team name above.</p>
      )}
      {query && teams.length === 0 && (
        <p style={{ color: "#3a3a3a", textAlign: "center", padding: "3rem 0", fontSize: 13 }}>No results for &ldquo;{query}&rdquo;</p>
      )}

      {teams.length > 0 && (
        <section style={{ marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#3a3a3a", letterSpacing: 1.5, textTransform: "uppercase" }}>
              Teams
            </span>
            <div style={{ flex: 1, height: 1, background: "#1e1e1e" }} />
          </div>
          <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
            {teams.map((t) => (
              <Link
                key={`${t.league}-${t.id}`}
                href={`/livescore/team/espn/${t.league}/${t.id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  className="search-row"
                  style={{
                    display: "flex", alignItems: "center", gap: 13,
                    padding: "11px 15px", borderBottom: "1px solid #181818",
                    background: "#1c1c1c", cursor: "pointer",
                  }}
                >
                  <TeamImg src={t.logo} name={t.name} size={32} radius="50%" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#e0e0e0" }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: "#484848", marginTop: 1 }}>{t.leagueName}</div>
                  </div>
                  <span style={{ color: "#2a2a2a", fontSize: 16 }}>›</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
