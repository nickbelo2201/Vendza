"use client";

type ItemPagamento = { method: string; count: number };

type Props = {
  dados: ItemPagamento[];
};

const PAYMENT_LABEL: Record<string, string> = {
  pix: "PIX",
  cash: "Dinheiro",
  card_on_delivery: "Cartão na entrega",
  card_online: "Cartão online",
};

const PAYMENT_COLORS: Record<string, string> = {
  pix: "var(--g, #1A7A5E)",
  cash: "var(--amb, #E8902A)",
  card_on_delivery: "var(--blue, #1b3a4b)",
  card_online: "var(--s3, #64748b)",
};

export function GraficoPagamentos({ dados }: Props) {
  const vazio = !dados || dados.length === 0;
  const total = dados.reduce((acc, d) => acc + d.count, 0);

  const ordenados = [...dados].sort((a, b) => b.count - a.count);

  return (
    <div className="wp-panel" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--carbon)" }}>
          Formas de pagamento
        </h2>
      </div>

      <div style={{ padding: "20px 20px" }}>
        {vazio ? (
          <div style={{
            height: 120,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
            fontSize: 13,
          }}>
            Sem dados no período.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {ordenados.map((item) => {
              const pct = total > 0 ? (item.count / total) * 100 : 0;
              const label = PAYMENT_LABEL[item.method] ?? item.method;
              const cor = PAYMENT_COLORS[item.method] ?? "var(--s4, #94a3b8)";

              return (
                <div key={item.method}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: cor,
                        flexShrink: 0,
                      }} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--carbon)" }}>
                        {label}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--carbon)",
                      }}>
                        {item.count}
                      </span>
                      <span style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        minWidth: 38,
                        textAlign: "right",
                      }}>
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div style={{
                    height: 8,
                    borderRadius: 4,
                    background: "var(--s6, #e2e8f0)",
                    overflow: "hidden",
                  }}>
                    <div style={{
                      height: 8,
                      borderRadius: 4,
                      background: cor,
                      width: `${pct}%`,
                      transition: "width 0.4s ease",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
