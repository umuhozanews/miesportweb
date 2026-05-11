const C = { border: "#1e1e1e", panel: "#181818", compHeader: "#161616" };

function Bone({ w, h, r = 4 }: { w: number | string; h: number; r?: number }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: "#222", flexShrink: 0 }} />;
}

export default function Loading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Date bar skeleton */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.panel, borderRadius: 10, padding: "9px 14px", border: `1px solid ${C.border}`, marginBottom: 4 }}>
        <Bone w={38} h={18} r={4} />
        <Bone w={16} h={16} r={3} />
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}><Bone w={60} h={14} /></div>
        <Bone w={16} h={16} r={3} />
        <Bone w={32} h={32} r={8} />
      </div>

      {/* Competition blocks */}
      {[5, 3, 4].map((rows, i) => (
        <div key={i} style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}` }}>
          <div style={{ height: 46, background: C.compHeader, display: "flex", alignItems: "center", padding: "0 14px", gap: 10 }}>
            <Bone w={20} h={20} r={3} />
            <div style={{ flex: 1 }}><Bone w={140} h={11} /></div>
          </div>
          {Array.from({ length: rows }).map((_, j) => (
            <div key={j} style={{ background: C.panel, borderTop: `1px solid ${C.border}`, display: "grid", gridTemplateColumns: "48px 1fr auto", minHeight: 56 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderRight: `1px solid ${C.border}` }}>
                <Bone w={28} h={10} />
              </div>
              <div style={{ padding: "8px 14px", display: "flex", flexDirection: "column", gap: 10, justifyContent: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Bone w={16} h={16} r={3} />
                  <Bone w={`${60 + (j * 17) % 60}px`} h={11} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Bone w={16} h={16} r={3} />
                  <Bone w={`${50 + (j * 23) % 70}px`} h={11} />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center", gap: 8, paddingRight: 16 }}>
                <Bone w={14} h={14} />
                <Bone w={14} h={14} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
