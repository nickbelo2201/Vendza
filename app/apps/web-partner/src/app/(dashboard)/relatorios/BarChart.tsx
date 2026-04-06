"use client";

type DataPoint = { date: string; revenueCents: number };

type Props = { dados: DataPoint[] };

function formatarMes(date: string): string {
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function BarChart({ dados }: Props) {
  if (!dados || dados.length === 0) {
    return (
      <div style={{
        height: 160, display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--text-muted)", fontSize: 13,
      }}>
        Nenhum dado para exibir no período.
      </div>
    );
  }

  const max = Math.max(...dados.map((d) => d.revenueCents), 1);
  const ALTURA = 140;
  const LARGURA_BARRA = Math.max(8, Math.min(36, Math.floor(560 / dados.length) - 6));

  return (
    <div style={{ overflowX: "auto", paddingBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, minWidth: dados.length * (LARGURA_BARRA + 6) }}>
        {dados.map((ponto) => {
          const altura = Math.round((ponto.revenueCents / max) * ALTURA);
          const alturaMinimaVisivel = ponto.revenueCents > 0 ? Math.max(altura, 4) : 0;

          return (
            <div
              key={ponto.date}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}
              title={`${formatarMes(ponto.date)}: ${formatarReais(ponto.revenueCents)}`}
            >
              {/* Valor acima da barra */}
              {ponto.revenueCents > 0 && dados.length <= 14 && (
                <div style={{
                  fontSize: 9, color: "var(--text-muted)",
                  fontFamily: "'Space Grotesk', sans-serif",
                  whiteSpace: "nowrap",
                }}>
                  {(ponto.revenueCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
              )}

              {/* Espaçador para alinhar barras */}
              <div style={{ flex: 1 }} />

              {/* Barra */}
              <div
                style={{
                  width: LARGURA_BARRA,
                  height: alturaMinimaVisivel || ALTURA,
                  background: ponto.revenueCents > 0
                    ? "var(--green)"
                    : "var(--border)",
                  borderRadius: "4px 4px 0 0",
                  opacity: ponto.revenueCents > 0 ? 1 : 0.3,
                  transition: "height 0.3s",
                  alignSelf: "flex-end",
                }}
              />

              {/* Label de data */}
              {dados.length <= 14 && (
                <div style={{
                  fontSize: 9, color: "var(--text-muted)",
                  fontFamily: "'Space Grotesk', sans-serif",
                  transform: "rotate(-35deg)",
                  transformOrigin: "center",
                  whiteSpace: "nowrap",
                  marginTop: 2,
                }}>
                  {formatarMes(ponto.date)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
