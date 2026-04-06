import { Suspense } from "react";
import { formatCurrency } from "@vendza/utils";

import { ApiError, fetchAPI } from "../../../lib/api";
import { SeletorPeriodo } from "./SeletorPeriodo";
import { BarChart } from "./BarChart";

type RevenueByDay = { date: string; revenueCents: number };
type TopProduto = { name: string; quantity: number; revenueCents: number };

type Relatorio = {
  totalOrders: number;
  totalRevenueCents: number;
  averageTicketCents: number;
  newCustomers: number;
  revenueByDay: RevenueByDay[];
  topProducts: TopProduto[];
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
  ];

  return (
    <div className="wp-stack-lg">
      <div className="wp-page-header">
        <div className="wp-row-between">
          <div>
            <h1>Relatórios</h1>
            <p>Análises de vendas e desempenho da sua loja.</p>
          </div>
          <Suspense fallback={null}>
            <SeletorPeriodo from={from} to={to} />
          </Suspense>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
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
    </div>
  );
}
