import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comanda",
};

export default function ImprimirLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#fff",
        color: "#000",
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: 13,
        lineHeight: 1.5,
        minHeight: "100vh",
        padding: 0,
        margin: 0,
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        body { background: #fff !important; margin: 0; padding: 0; }
        @media print { @page { margin: 10mm; } }
      `}</style>
      {children}
    </div>
  );
}
