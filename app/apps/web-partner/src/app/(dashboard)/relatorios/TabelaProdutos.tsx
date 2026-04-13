"use client";

import { useState } from "react";
import { formatCurrency } from "@vendza/utils";

type TopProduto = { name: string; quantity: number; revenueCents: number };

type Props = {
  produtos: TopProduto[];
  totalRevenueCents: number;
};

const BADGE_CORES = [
  { bg: "#FEF9C3", text: "#854D0E", borda: "#FDE68A" }, // #1 dourado
  { bg: "#F1F5F9", text: "#475569", borda: "#CBD5E1" }, // #2 prata
  { bg: "#FEF3C7", text: "#92400E", borda: "#FDE68A" }, // #3 bronze
];

export function TabelaProdutos({ produtos, totalRevenueCents }: Props) {
  const [busca, setBusca] = useState("");
  const [expandido, setExpandido] = useState(false);

  const vazio = !produtos || produtos.length === 0;

  const filtrados = produtos.filter((p) =>
    p.name.toLowerCase().includes(busca.toLowerCase())
  );

  const visiveis = expandido ? filtrados : filtrados.slice(0, 10);
  const temMais = filtrados.length > 10 && !expandido;

  return (
    <div className="wp-panel" style={{ padding: 0, overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
      }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--carbon)" }}>
          Produtos mais vendidos
        </h2>
        {!vazio && (
          <div style={{ position: "relative" }}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-muted)"
              strokeWidth="2"
              style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Buscar produto..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{
                paddingLeft: 30,
                paddingRight: 10,
                paddingTop: 6,
                paddingBottom: 6,
                fontSize: 12,
                border: "1px solid var(--border)",
                borderRadius: 8,
                outline: "none",
                background: "var(--s8, #f8fafc)",
                color: "var(--carbon)",
                width: 180,
              }}
            />
          </div>
        )}
      </div>

      {vazio ? (
        <div className="wp-empty">
          <div className="wp-empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <p className="wp-empty-title">Sem dados no período</p>
          <p className="wp-empty-desc">Nenhuma venda registrada no intervalo selecionado.</p>
        </div>
      ) : filtrados.length === 0 ? (
        <div style={{
          padding: 32,
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: 13,
        }}>
          Nenhum produto encontrado para &ldquo;{busca}&rdquo;.
        </div>
      ) : (
        <>
          <table className="wp-table">
            <thead>
              <tr>
                <th style={{ width: 48 }}>#</th>
                <th>Produto</th>
                <th>Qtd.</th>
                <th>Faturamento</th>
                <th>% do total</th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((p, idx) => {
                const pctTotal =
                  totalRevenueCents > 0
                    ? ((p.revenueCents / totalRevenueCents) * 100).toFixed(1)
                    : "0.0";
                const badgeCor = BADGE_CORES[idx] ?? null;

                return (
                  <tr key={p.name}>
                    <td>
                      {badgeCor && idx < 3 ? (
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          background: badgeCor.bg,
                          border: `1px solid ${badgeCor.borda}`,
                          color: badgeCor.text,
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontWeight: 700,
                          fontSize: 11,
                        }}>
                          {idx + 1}
                        </span>
                      ) : (
                        <span style={{
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontWeight: 700,
                          fontSize: 12,
                          color: "var(--text-muted)",
                        }}>
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                      )}
                    </td>
                    <td style={{ fontWeight: 600, color: "var(--carbon)" }}>{p.name}</td>
                    <td>
                      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
                        {p.quantity}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 3 }}>un.</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
                        {formatCurrency(p.revenueCents)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          flex: 1,
                          height: 4,
                          borderRadius: 2,
                          background: "var(--s6, #e2e8f0)",
                          overflow: "hidden",
                          maxWidth: 80,
                        }}>
                          <div style={{
                            height: 4,
                            borderRadius: 2,
                            background: "var(--g, #1A7A5E)",
                            width: `${pctTotal}%`,
                          }} />
                        </div>
                        <span style={{
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "var(--s3, #64748b)",
                          minWidth: 36,
                        }}>
                          {pctTotal}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {temMais && (
            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)" }}>
              <button
                type="button"
                onClick={() => setExpandido(true)}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--g)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Ver todos ({filtrados.length - 10} mais)
              </button>
            </div>
          )}
          {expandido && filtrados.length > 10 && (
            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)" }}>
              <button
                type="button"
                onClick={() => setExpandido(false)}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Mostrar menos
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
