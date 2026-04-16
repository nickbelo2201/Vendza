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

function FieldsetMock() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        marginBottom: 24,
      }}
    >
      {/* Label do fieldset */}
      <div
        className="skel"
        style={{ width: "40%", height: 18, borderRadius: 6 }}
      />
      {/* Dois campos de input */}
      <div
        className="skel"
        style={{ width: "100%", height: 44, borderRadius: 8 }}
      />
      <div
        className="skel"
        style={{ width: "100%", height: 44, borderRadius: 8 }}
      />
    </div>
  );
}

export default function Loading() {
  return (
    <div style={{ padding: "24px 16px", maxWidth: 1100, margin: "0 auto" }}>
      <style>{shimmerCSS}</style>

      {/* Título da página */}
      <div
        className="skel"
        style={{ width: 180, height: 32, marginBottom: 32, borderRadius: 8 }}
      />

      {/* Layout de duas colunas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 380px",
          gap: 32,
          alignItems: "start",
        }}
      >
        {/* Coluna esquerda: formulário com 3 fieldsets */}
        <div>
          <FieldsetMock />
          <FieldsetMock />
          <FieldsetMock />

          {/* Botão de submit */}
          <div
            className="skel"
            style={{ width: "100%", height: 52, borderRadius: 10 }}
          />
        </div>

        {/* Coluna direita: resumo do pedido */}
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
          {/* Título do resumo */}
          <div
            className="skel"
            style={{ width: "50%", height: 20, borderRadius: 6 }}
          />

          {/* Itens do resumo */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div
                className="skel"
                style={{ flex: 1, height: 16, borderRadius: 6 }}
              />
              <div
                className="skel"
                style={{ width: 60, height: 16, borderRadius: 6 }}
              />
            </div>
          ))}

          {/* Divisor */}
          <div
            style={{
              height: 1,
              background: "#e5e0d8",
              margin: "4px 0",
            }}
          />

          {/* Total */}
          <div
            style={{ display: "flex", justifyContent: "space-between", gap: 12 }}
          >
            <div
              className="skel"
              style={{ width: 60, height: 22, borderRadius: 6 }}
            />
            <div
              className="skel"
              style={{ width: 90, height: 22, borderRadius: 6 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
