const C = { border: "#1e1e1e", panel: "#181818" };
function Bone({ w, h, r = 4 }: { w: number | string; h: number; r?: number }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: "#222" }} />;
}

export default function Loading() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "1.5rem 1rem" }}>
      {/* League header */}
      <div style={{ background: "#0d1f3c", borderRadius: 12, padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: 16, marginBottom: 4 }}>
        <Bone w={56} h={56} r={8} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Bone w={200} h={20} />
          <Bone w={80} h={12} />
        </div>
      </div>
      {/* Tabs */}
      <div style={{ background: "#1a1a1a", borderRadius: "0 0 10px 10px", height: 44, marginBottom: 16, border: `1px solid ${C.border}` }} />
      {/* Table rows */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 6, marginBottom: 3, height: 44, display: "flex", alignItems: "center", padding: "0 14px", gap: 10 }}>
          <Bone w={20} h={10} />
          <Bone w={22} h={22} r={3} />
          <Bone w={`${100 + i * 12}px`} h={11} />
          <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
            {[24, 24, 24, 32, 36].map((w, k) => <Bone key={k} w={w} h={10} />)}
          </div>
        </div>
      ))}
    </div>
  );
}
