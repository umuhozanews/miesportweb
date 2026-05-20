export const metadata = { title: "FIFA World Cup — MIE Sport", description: "Every FIFA World Cup from 1930 to 2026" };

export default function WorldCupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "60vh", background: "var(--bg-page)", color: "var(--t-primary)" }}>
      {children}
    </div>
  );
}
