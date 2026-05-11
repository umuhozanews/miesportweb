const C = { border: "#1e1e1e", panel: "#181818" };
function Bone({ w, h, r = 4 }: { w: number | string; h: number; r?: number }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: "#222" }} />;
}

export default function Loading() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "1.5rem 1rem" }}>
      {/* Team header skeleton */}
      <div style={{ background: "#0d1f3c", borderRadius: 12, padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: 16, marginBottom: 4 }}>
        <Bone w={64} h={64} r={8} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Bone w={180} h={18} />
          <Bone w={100} h={12} />
        </div>
      </div>
      {/* Tabs skeleton */}
      <div style={{ background: "#1a1a1a", borderRadius: "0 0 10px 10px", height: 44, marginBottom: 16, border: `1px solid ${C.border}` }} />
      {/* Rows */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 4, height: 52, display: "flex", alignItems: "center", padding: "0 14px", gap: 12 }}>
          <Bone w={40} h={10} />
          <Bone w={20} h={20} r={10} />
          <Bone w={`${80 + i * 15}px`} h={11} />
          <div style={{ marginLeft: "auto" }}><Bone w={36} h={14} /></div>
        </div>
      ))}
    </div>
  );
}
