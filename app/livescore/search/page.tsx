export const dynamic = "force-dynamic";
import Link from "next/link";
import { getLsSearch, lsTeamImg, lsCompImg } from "@/lib/livescoreCom";
import { TeamImg, CompImg } from "@/app/livescore/TeamImg";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const { teams, comps } = query ? await getLsSearch(query) : { teams: [], comps: [] };

  const hasResults = teams.length > 0 || comps.length > 0;

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
            placeholder="Search teams, leagues…"
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
        <p style={{ color: "#3a3a3a", textAlign: "center", padding: "3rem 0", fontSize: 13 }}>Enter a team or league name above.</p>
      )}
      {query && !hasResults && (
        <p style={{ color: "#3a3a3a", textAlign: "center", padding: "3rem 0", fontSize: 13 }}>No results for &ldquo;{query}&rdquo;</p>
      )}

      {teams.length > 0 && (
        <ResultSection title="Teams">
          {teams.map((t) => (
            <Link key={t.Sid} href={`/livescore/team/${t.Sid}`} style={{ textDecoration: "none" }}>
              <ResultRow
                imgSrc={lsTeamImg(t.Img ?? "", t.Sid)}
                name={t.Nm}
                sub={t.Cnm ?? ""}
              />
            </Link>
          ))}
        </ResultSection>
      )}

      {comps.length > 0 && (
        <ResultSection title="Leagues &amp; Cups">
          {comps.map((c) => (
            <Link key={c.Sid} href={`/livescore/tournament/${c.CompId ?? c.Sid}/${c.Sid}`} style={{ textDecoration: "none" }}>
              <ResultRow
                imgSrc={lsCompImg(c.badgeUrl ?? "")}
                name={c.Nm}
                sub={c.Cnm ?? ""}
                square
              />
            </Link>
          ))}
        </ResultSection>
      )}
    </div>
  );
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: "#3a3a3a", letterSpacing: 1.5, textTransform: "uppercase" }}
          dangerouslySetInnerHTML={{ __html: title }}
        />
        <div style={{ flex: 1, height: 1, background: "#1e1e1e" }} />
      </div>
      <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
        {children}
      </div>
    </section>
  );
}

function ResultRow({ imgSrc, name, sub, square }: { imgSrc: string; name: string; sub: string; square?: boolean }) {
  return (
    <div
      className="search-row"
      style={{ display: "flex", alignItems: "center", gap: 13, padding: "11px 15px", borderBottom: "1px solid #181818", background: "#1c1c1c", cursor: "pointer" }}
    >
      {square ? (
        <CompImg src={imgSrc} size={32} radius={6} />
      ) : (
        <TeamImg src={imgSrc} name={name} size={32} radius="50%" />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: "#e0e0e0" }}>{name}</div>
        {sub && <div style={{ fontSize: 11, color: "#484848", marginTop: 1 }}>{sub}</div>}
      </div>
      <span style={{ color: "#2a2a2a", fontSize: 16 }}>›</span>
    </div>
  );
}
