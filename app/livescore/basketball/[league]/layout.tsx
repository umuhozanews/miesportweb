import { BBALL_LEAGUES } from "@/lib/espn";
import { BballLeagueNav } from "./BballLeagueNav";

type Props = { params: Promise<{ league: string }>; children: React.ReactNode };

export default async function BballLeagueLayout({ params, children }: Props) {
  const { league } = await params;
  const info = BBALL_LEAGUES[league];
  const base = `/livescore/basketball/${league}`;

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 12, display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ color: "#60a5fa" }}>Basketball</span>
        <span>›</span>
        {info?.country && <><span style={{ color: "#60a5fa" }}>{info.country}</span><span>›</span></>}
        <span style={{ color: "#fff" }}>{info?.name ?? league.toUpperCase()}</span>
      </div>

      {/* League header */}
      <div style={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "14px 18px", marginBottom: 0, display: "flex", alignItems: "center", gap: 14, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {info?.logo && <img src={info.logo} alt={info?.name} width={40} height={40} style={{ objectFit: "contain", borderRadius: 6 }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>{info?.name ?? league.toUpperCase()}</div>
          {info?.country && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{info.country}</div>}
        </div>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </div>

      {/* Tab nav */}
      <div style={{ background: "#181818", border: "1px solid rgba(255,255,255,0.07)", borderTop: "none", marginBottom: "1rem" }}>
        <BballLeagueNav base={base} />
      </div>

      {children}
    </div>
  );
}
