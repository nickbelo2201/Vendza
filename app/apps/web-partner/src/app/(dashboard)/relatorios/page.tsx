import { Suspense } from "react";
import { formatCurrency } from "@vendza/utils";

import { ApiError, fetchAPI } from "../../../lib/api";
import { SeletorPeriodo } from "./SeletorPeriodo";
import { GraficoTempoReal } from "./GraficoTempoReal";
import { GraficoLinha } from "./GraficoLinha";
import { GraficoDonut } from "./GraficoDonut";
import { GraficoPagamentos } from "./GraficoPagamentos";
import { GraficoPicoHora } from "./GraficoPicoHora";
import { TabelaProdutos } from "./TabelaProdutos";
import { InsightsCard } from "./InsightsCard";
import { KpiGrid } from "./KpiGrid";
import { TabelaClientes, ClienteRelatorio } from "./TabelaClientes";

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
  topClientes?: ClienteRelatorio[];
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

// Cores do donut de clientes
const COR_NOVO = "var(--g, #1A7A5E)";
const COR_RECORRENTE = "var(--amb, #E8902A)";

// Cores do donut de origem
const CORES_ORIGEM: string[] = [
  "var(--g, #1A7A5E)",
  "var(--amb, #E8902A)",
  "var(--blue, #1b3a4b)",
  "var(--s3, #64748b)",
];

export default async function RelatoriosPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const hoje = formatarData(new Date());
  const trintaDiasAtras = formatarData(new Date(Date.now() - 30 * 86400000));

  const from = params.from ?? trintaDiasAtras;
  const to = params.to ?? hoje;

  const relatorio = await getRelatorio(from, to);

  // KPIs — agora com drillTipo para KpiGrid
  const kpis = [
    {
      id: "pedidos",
      titulo: "Total de pedidos",
      valor: relatorio ? String(relatorio.totalOrders) : "—",
      drillTipo: "pedidos" as const,
      icone: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
      ),
    },
    {
      id: "faturamento",
      titulo: "Faturamento total",
      valor: relatorio ? formatCurrency(relatorio.totalRevenueCents) : "—",
      destaque: true,
      drillTipo: "faturamento" as const,
      icone: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      id: "ticket",
      titulo: "Ticket médio",
      valor: relatorio ? formatCurrency(relatorio.averageTicketCents) : "—",
      icone: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
    {
      id: "novos",
      titulo: "Novos clientes",
      valor: relatorio ? String(relatorio.newCustomers) : "—",
      drillTipo: "novos-clientes" as const,
      icone: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      id: "cancelamento",
      titulo: "Cancelamentos",
      valor: relatorio ? `${relatorio.cancellationRate.toFixed(1)}%` : "—",
      drillTipo: "cancelamentos" as const,
      icone: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      ),
    },
    {
      id: "recompra",
      titulo: "Taxa de recompra",
      valor: relatorio ? `${relatorio.repeatRate.toFixed(1)}%` : "—",
      icone: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
      ),
    },
    {
      id: "recorrentes",
      titulo: "Clientes recorrentes",
      valor: relatorio ? String(relatorio.repeatCustomers) : "—",
      icone: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          <polyline points="17 11 19 13 23 9" />
        </svg>
      ),
    },
    {
      id: "pedidos-cancelados",
      titulo: "Pedidos cancelados",
      valor: relatorio ? String(relatorio.cancelledOrders) : "—",
      drillTipo: "cancelamentos" as const,
      icone: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      ),
    },
  ];

  // Dados para donuts
  const clientesData = relatorio
    ? [
        { name: "Novos", value: relatorio.newCustomers, color: COR_NOVO },
        { name: "Recorrentes", value: relatorio.repeatCustomers, color: COR_RECORRENTE },
      ]
    : [];

  // Origem dos pedidos: usar paymentDistribution como proxy de canais
  const origemData = relatorio
    ? relatorio.paymentDistribution.map((p, i) => ({
        name:
          p.method === "pix"
            ? "PIX"
            : p.method === "cash"
            ? "Dinheiro"
            : p.method === "card_on_delivery"
            ? "Cartão entrega"
            : p.method === "card_online"
            ? "Online"
            : p.method,
        value: p.count,
        color: CORES_ORIGEM[i % CORES_ORIGEM.length] ?? "var(--s4, #94a3b8)",
      }))
    : [];

  // Tempo real: usar dados do dia atual do relatório como proxy
  const dadosDia = {
    totalOrders: relatorio?.totalOrders ?? 0,
    totalRevenueCents: relatorio?.totalRevenueCents ?? 0,
    averageTicketCents: relatorio?.averageTicketCents ?? 0,
  };

  const topProducts = relatorio?.topProducts ?? [];
  const topClientes: ClienteRelatorio[] = relatorio?.topClientes ?? [];

  return (
    <>
      <style>{`
        @media (max-width: 1024px) {
          .relatorio-grid-2col { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .relatorio-kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      <div className="wp-stack-lg">
        {/* Header */}
        <div className="wp-page-header">
          <div className="wp-row-between" style={{ alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
            <div>
              <h1>Relatórios</h1>
              <p>Análises de vendas e desempenho da sua loja.</p>
            </div>
            <Suspense fallback={null}>
              <SeletorPeriodo from={from} to={to} />
            </Suspense>
          </div>
        </div>

        {/* Seção Tempo Real */}
        <GraficoTempoReal
          totalOrders={dadosDia.totalOrders}
          totalRevenueCents={dadosDia.totalRevenueCents}
          averageTicketCents={dadosDia.averageTicketCents}
        />

        {/* Insights automáticos */}
        <InsightsCard relatorio={relatorio} />

        {/* KPIs — Client Component com drill-down */}
        <KpiGrid
          kpis={kpis}
          from={from}
          to={to}
          topProducts={topProducts}
        />

        {/* Linha 1: Gráfico 60% + Donut Clientes 40% */}
        <div
          className="relatorio-grid-2col"
          style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16 }}
        >
          <GraficoLinha dados={relatorio?.revenueByDay ?? []} />
          <GraficoDonut
            dados={clientesData}
            titulo="Clientes"
            totalLabel="total"
          />
        </div>

        {/* Linha 2: Tabela Produtos 60% + Donut Origem 40% */}
        <div
          className="relatorio-grid-2col"
          style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16 }}
        >
          <TabelaProdutos
            produtos={relatorio?.topProducts ?? []}
            totalRevenueCents={relatorio?.totalRevenueCents ?? 0}
          />
          <GraficoDonut
            dados={origemData}
            titulo="Origem dos Pedidos"
            totalLabel="pedidos"
          />
        </div>

        {/* Linha 3: Pagamentos 50% + Pico por Hora 50% */}
        <div
          className="relatorio-grid-2col"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <GraficoPagamentos dados={relatorio?.paymentDistribution ?? []} />
          <GraficoPicoHora dados={relatorio?.salesByHour ?? []} />
        </div>

        {/* Análise de Clientes — accordion */}
        <TabelaClientes clientes={topClientes} />
      </div>
    </>
  );
}
