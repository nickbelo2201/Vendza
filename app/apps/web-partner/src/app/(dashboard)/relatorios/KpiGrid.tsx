"use client";

import { useState } from "react";
import { KpiDrillDrawer, TipoDrill } from "./KpiDrillDrawer";

export type KpiItem = {
  id: string;
  titulo: string;
  valor: string;
  deltaPercent?: number;
  icone: React.ReactNode;
  destaque?: boolean;
  drillTipo?: TipoDrill;
};

type Props = {
  kpis: KpiItem[];
  from: string;
  to: string;
  topProducts?: { name: string; quantity: number; revenueCents: number }[];
};

export function KpiGrid({ kpis, from, to, topProducts = [] }: Props) {
  const [drillAberto, setDrillAberto] = useState<TipoDrill>(null);

  function handleKpiClick(drillTipo: TipoDrill) {
    if (!drillTipo) return;
    setDrillAberto(drillTipo);
  }

  return (
    <>
      <div
        className="relatorio-kpi-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
        }}
      >
        {kpis.map((kpi) => {
          const clicavel = Boolean(kpi.drillTipo);
          return (
            <div
              key={kpi.id}
              className={`wp-panel kpi-card ${clicavel ? "kpi-card-clicavel" : ""}`}
              onClick={() => handleKpiClick(kpi.drillTipo ?? null)}
              role={clicavel ? "button" : undefined}
              tabIndex={clicavel ? 0 : undefined}
              onKeyDown={
                clicavel
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleKpiClick(kpi.drillTipo ?? null);
                      }
                    }
                  : undefined
              }
              aria-label={clicavel ? `Ver detalhes: ${kpi.titulo}` : undefined}
              style={{
                padding: "18px 20px",
                ...(kpi.destaque
                  ? { borderLeft: "3px solid var(--g, #1A7A5E)" }
                  : {}),
              }}
            >
              <div
                className="kpi-header-row"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    className="kpi-icon"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      color: kpi.destaque ? "var(--g, #1A7A5E)" : undefined,
                    }}
                  >
                    {kpi.icone}
                  </span>
                  <span
                    className="kpi-label-text"
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: kpi.destaque ? "var(--g, #1A7A5E)" : undefined,
                    }}
                  >
                    {kpi.titulo}
                  </span>
                </div>
                {clicavel && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ opacity: 0.4, flexShrink: 0 }}
                    aria-hidden="true"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                )}
              </div>

              <div
                className="kpi-value-display"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  lineHeight: 1,
                  marginBottom: kpi.deltaPercent !== undefined ? 6 : 0,
                }}
              >
                {kpi.valor}
              </div>

              {kpi.deltaPercent !== undefined && (
                <div
                  className="kpi-delta"
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: kpi.deltaPercent >= 0 ? "var(--g, #1A7A5E)" : "#dc2626",
                    marginTop: 4,
                  }}
                >
                  {kpi.deltaPercent >= 0 ? "↑" : "↓"} {Math.abs(kpi.deltaPercent).toFixed(1)}% vs anterior
                </div>
              )}
            </div>
          );
        })}
      </div>

      <KpiDrillDrawer
        tipo={drillAberto}
        from={from}
        to={to}
        onClose={() => setDrillAberto(null)}
        topProducts={topProducts}
      />
    </>
  );
}
