import { Suspense } from "react";
import { formatCurrency } from "@vendza/utils";

import { ApiError, fetchAPI } from "../../../lib/api";
import { SeletorPeriodo } from "./SeletorPeriodo";
import { BarChart } from "./BarChart";

type RevenueByDay = { date: string; revenueCents: number };
type TopProduto = { name: string; quantity: number; revenueCents: number };
type PaymentDistribution = { method: string; count: number };
type SalesByHour = { hour: number; count: number; revenueCents: number };

type Relatorio = {
  totalOrders: number;
  totalRevenueCents: number;
  averageTicketCents: number;
  newCustomers: number;
  revenueByDay: RevenueByDay[];
  topProducts: TopProduto[];
  cancelledOrders: number;
  cancellationRate: number;
  repeatCustomers: number;
  repeatRate: number;
  paymentDistribution: PaymentDistribution[];
  salesByHour: SalesByHour[];
};

const PAYMENT_LABEL: Record<string, string> = {
  pix: "PIX",
  cash: "Dinheiro",
  card_on_delivery: "Cartão na entrega",
  card_online: "Cartão online",
};

function formatarData(d: Date): string {
  return d.toISOString().substring(0, 10);
}

async function getRelatorio(from: string, to: string): Promise<Relatorio | null> {
  try {
    return await fetchAPI<Relatorio>(`/partner/reports?from=${from}&to=${to}`);
  } catch (err) {
    if (err instanceof ApiError) return null;
    return null;
  }
}

type PageProps = {
  searchParams: Promise<{ from?: string; to?: string }>;
};

export default async function RelatoriosPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const hoje = formatarData(new Date());
  const trintaDiasAtras = formatarData(new Date(Date.now() - 30 * 86400000));

  const from = params.from ?? trintaDiasAtras;
  const to = params.to ?? hoje;

  const relatorio = await getRelatorio(from, to);

  const metricas = [
    {
      titulo: "Total de pedidos",
      valor: relatorio ? String(relatorio.totalOrders) : "—",
      icone: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        </svg>
      ),
    },
    {
      titulo: "Faturamento total",
      valor: relatorio ? formatCurrency(relatorio.totalRevenueCents) : "—",
      icone: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
    },
    {
      titulo: "Ticket médio",
      valor: relatorio ? formatCurrency(relatorio.averageTicketCents) : "—",
      icone: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
    },
    {
      titulo: "Novos clientes",
      valor: relatorio ? String(relatorio.newCustomers) : "—",
      icone: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      titulo: "Taxa de cancelamento",
      valor: relatorio ? `${relatorio.cancellationRate.toFixed(1)}%` : "—",
      icone: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      ),
    },
    {
      titulo: "Taxa de recompra",
      valor: relatorio ? `${relatorio.repeatRate.toFixed(1)}%` : "—",
      icone: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <polyline points="23 4 23 10 17 10"/>
          <polyline points="1 20 1 14 7 14"/>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
      ),
    },
    {
      titulo: "Clientes recorrentes",
      valor: relatorio ? String(relatorio.repeatCustomers) : "—",
      icone: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          <polyline points="17 11 19 13 23 9"/>
        </svg>
      ),
    },
  ];

  const totalPagamentos = relatorio
    ? relatorio.paymentDistribution.reduce((acc, item) => acc + item.count, 0)
    : 0;

  const maxHourCount = relatorio && relatorio.salesByHour.length > 0
    ? Math.max(...relatorio.salesByHour.map((h) => h.count))
    : 0;

  const hourMap: Record<number, SalesByHour> = {};
  if (relatorio) {
    for (const entry of relatorio.salesByHour) {
      hourMap[entry.hour] = entry;
    }
  }

  return (
    <div className="wp-stack-lg">
      <div className="wp-page-header">
        <div className="wp-row-between">
          <div>
            <h1>Relatórios</h1>
            <p>Análises de vendas e desempenho da sua loja.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Suspense fallback={null}>
              <SeletorPeriodo from={from} to={to} />
            </Suspense>
            <a
              href={`/api/exportar-pedidos?from=${from}&to=${to}`}
              className="wp-btn wp-btn-secondary"
              style={{ fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Exportar CSV
            </a>
          </div>
        </div>
      </div>

      {/* Período selecionado */}
      <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
        Exibindo dados de{" "}
        <strong>{new Date(from + "T00:00:00").toLocaleDateString("pt-BR")}</strong>
        {" "}até{" "}
        <strong>{new Date(to + "T00:00:00").toLocaleDateString("pt-BR")}</strong>
      </div>

      {/* Cards de métricas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
        {metricas.map((m) => (
          <div key={m.titulo} className="wp-panel" style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, color: "var(--text-muted)" }}>
              {m.icone}
              <span style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {m.titulo}
              </span>
            </div>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 22, fontWeight: 700,
              color: "var(--carbon)",
            }}>
              {m.valor}
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico de faturamento */}
      <div className="wp-panel">
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Faturamento por dia</h2>
        {relatorio ? (
          <BarChart dados={relatorio.revenueByDay} />
        ) : (
          <div className="wp-note" style={{ fontSize: 13 }}>
            Não foi possível carregar os dados do gráfico.
          </div>
        )}
      </div>

      {/* Produtos mais vendidos */}
      <div className="wp-panel" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>Produtos mais vendidos</h2>
        </div>

        {!relatorio || relatorio.topProducts.length === 0 ? (
          <div className="wp-empty">
            <div className="wp-empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <p className="wp-empty-title">Sem dados no período</p>
            <p className="wp-empty-desc">Nenhuma venda registrada no intervalo selecionado.</p>
          </div>
        ) : (
          <table className="wp-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Produto</th>
                <th>Qtd. vendida</th>
                <th>Faturamento</th>
              </tr>
            </thead>
            <tbody>
              {relatorio.topProducts.map((p, idx) => (
                <tr key={p.name}>
                  <td>
                    <span style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700, fontSize: 13, color: "var(--text-muted)",
                    }}>
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
                      {p.quantity}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 4 }}>un.</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
                      {formatCurrency(p.revenueCents)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Distribuição de pagamentos */}
      <div className="wp-panel">
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Distribuição de pagamentos</h2>

        {!relatorio || relatorio.paymentDistribution.length === 0 ? (
          <div className="wp-empty">
            <p className="wp-empty-title">Sem dados no período</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {relatorio.paymentDistribution.map((item) => {
              const pct = totalPagamentos > 0 ? (item.count / totalPagamentos) * 100 : 0;
              const label = PAYMENT_LABEL[item.method] ?? item.method;
              return (
                <div key={item.method}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--carbon)" }}>
                      {label}
                    </span>
                    <span style={{
                      fontSize: 13,
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                    }}>
                      {item.count}
                    </span>
                  </div>
                  <div style={{
                    height: 8,
                    borderRadius: 4,
                    background: "var(--border)",
                    overflow: "hidden",
                  }}>
                    <div style={{
                      height: 8,
                      borderRadius: 4,
                      background: "var(--wp-green, #2D6A4F)",
                      width: `${pct}%`,
                      transition: "width 0.3s ease",
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                    {pct.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pico de vendas por hora */}
      <div className="wp-panel">
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Pico de vendas por hora</h2>

        {!relatorio || relatorio.salesByHour.length === 0 ? (
          <div className="wp-empty">
            <p className="wp-empty-title">Sem dados</p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(56px, 1fr))",
            gap: 8,
          }}>
            {Array.from({ length: 24 }, (_, hour) => {
              const entry = hourMap[hour];
              const count = entry?.count ?? 0;
              const isMax = maxHourCount > 0 && count === maxHourCount && count > 0;
              const barHeight = maxHourCount > 0 ? (count / maxHourCount) * 40 : 0;

              return (
                <div
                  key={hour}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    padding: "8px 4px",
                    borderRadius: 6,
                    background: isMax ? "var(--wp-green, #2D6A4F)" : "transparent",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{
                    height: 40,
                    width: "100%",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                  }}>
                    {count > 0 && (
                      <div style={{
                        width: "60%",
                        height: barHeight,
                        borderRadius: 3,
                        background: isMax ? "rgba(255,255,255,0.5)" : "var(--wp-green, #2D6A4F)",
                        minHeight: 3,
                      }} />
                    )}
                  </div>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: isMax ? "#fff" : "var(--text-muted)",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}>
                    {String(hour).padStart(2, "0")}h
                  </span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: isMax ? "#fff" : "var(--carbon)",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}>
                    {count > 0 ? count : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
