export const dynamic = "force-dynamic";

export default function StatsPage() {
  return (
    <div style={{ textAlign: "center", padding: "3rem", color: "#444", fontSize: 13 }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
      <p style={{ fontWeight: 600, color: "#666" }}>Player stats not available for this competition.</p>
      <p style={{ marginTop: 6, color: "#444" }}>Check the Standings tab for team stats.</p>
    </div>
  );
}
