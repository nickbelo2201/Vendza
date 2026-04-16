const shimmerCSS = `
@keyframes shimmer {
  0% { opacity: 1; }
  50% { opacity: 0.4; }
  100% { opacity: 1; }
}
.skel {
  background: #e8e4de;
  border-radius: 8px;
  animation: shimmer 1.5s ease-in-out infinite;
}
`;

export default function Loading() {
  return (
    <div style={{ padding: "24px 16px", maxWidth: 1100, margin: "0 auto" }}>
      <style>{shimmerCSS}</style>

      {/* Botão voltar mock */}
      <div
        className="skel"
        style={{ width: 100, height: 32, marginBottom: 28, borderRadius: 8 }}
      />

      {/* Layout de duas colunas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 32,
        }}
      >
        {/* Coluna esquerda: imagem + badge + título + preço */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            className="skel"
            style={{ width: "100%", height: 240, borderRadius: 12 }}
          />
          <div
            className="skel"
            style={{ width: 80, height: 24, borderRadius: 20 }}
          />
          <div
            className="skel"
            style={{ width: "75%", height: 28, borderRadius: 8 }}
          />
          <div
            className="skel"
            style={{ width: 120, height: 36, borderRadius: 8 }}
          />
        </div>

        {/* Coluna direita: card de ação */}
        <div
          style={{
            background: "#F7F3EE",
            borderRadius: 16,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            className="skel"
            style={{ width: "60%", height: 20, borderRadius: 6 }}
          />
          <div
            className="skel"
            style={{ width: "100%", height: 48, borderRadius: 10 }}
          />
          <div
            className="skel"
            style={{ width: "100%", height: 48, borderRadius: 10 }}
          />
          <div
            className="skel"
            style={{ width: "80%", height: 16, borderRadius: 6 }}
          />
        </div>
      </div>
    </div>
  );
}
