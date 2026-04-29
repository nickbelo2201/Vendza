import { formatCurrency } from "@vendza/utils";
import type { DashboardSummary, Order, OrdersResponse, InventoryItem } from "@vendza/types";

import { ApiError, fetchAPI } from "../../lib/api";
import { KanbanBoard } from "../../components/KanbanBoard";
import { NovoPedidoFAB } from "./NovoPedidoFAB";

/* ── Sparkline SVG inline ── */
function Sparkline({ points, color }: { points: string; color: string }) {
  return (
    <svg
      className="metric-sparkline"
      viewBox="0 0 120 40"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
      <polyline
        points={`${points} 120,40 0,40`}
        fill={color}
        opacity="0.08"
        stroke="none"
      />
    </svg>
  );
}

/* ── Ícone triângulo de alerta ── */
function IconAlert({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

/* ── Ícone estrela ── */
function IconStar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}


async function getDashboardData() {
  try {
    const [summary, ordersResp, inventory] = await Promise.all([
      fetchAPI<DashboardSummary>("/partner/dashboard/summary"),
      fetchAPI<OrdersResponse>("/partner/orders"),
      fetchAPI<InventoryItem[]>("/partner/estoque")
        .catch(() => [] as InventoryItem[]),
    ]);
    const orders = ordersResp?.orders ?? [];
    return { summary, orders, inventory };
  } catch (err) {
    if (err instanceof ApiError) return { summary: null, orders: [] as Order[], inventory: [] as InventoryItem[] };
    return { summary: null, orders: [] as Order[], inventory: [] as InventoryItem[] };
  }
}

export default async function PartnerHomePage() {
  const { summary, orders, inventory } = await getDashboardData();

  // Taxa de recorrência como percentual
  const totalClientes = (summary?.recurringCustomers ?? 0) + (summary?.newCustomers ?? 0);
  const recorrenciaPct = totalClientes > 0
    ? Math.round(((summary?.recurringCustomers ?? 0) / totalClientes) * 100)
    : 0;

  const metricCards = summary
    ? [
        {
          label: "Pedidos hoje",
          value: summary.ordersToday.toString(),
          accent: "#0052CC",
          sparklinePoints: "0,35 20,30 40,28 60,20 80,15 100,10 120,6",
          delta: summary.ordersToday > 0 ? `+${summary.ordersToday}` : "0",
          deltaPositivo: summary.ordersToday > 0,
        },
        {
          label: "Faturamento",
          value: formatCurrency(summary.revenueCents),
          accent: "#FF6B35",
          sparklinePoints: "0,38 20,32 40,30 60,22 80,18 100,12 120,8",
          delta: summary.revenueCents > 0 ? `+${formatCurrency(summary.revenueCents)}` : "R$ 0",
          deltaPositivo: summary.revenueCents > 0,
        },
        {
          label: "Ticket médio",
          value: formatCurrency(summary.averageTicketCents),
          accent: "#2D5A3D",
          sparklinePoints: "0,32 20,28 40,30 60,24 80,22 100,18 120,16",
          delta: summary.averageTicketCents > 0 ? formatCurrency(summary.averageTicketCents) : "—",
          deltaPositivo: summary.averageTicketCents > 0,
        },
        {
          label: "Clientes recorrentes",
          value: recorrenciaPct > 0 ? `${recorrenciaPct}%` : `${summary.recurringCustomers}`,
          accent: "#9CA3AF",
          sparklinePoints: "0,28 20,26 40,28 60,25 80,24 100,22 120,21",
          delta: summary.newCustomers > 0 ? `+${summary.newCustomers} novos` : "Sem novos hoje",
          deltaPositivo: summary.newCustomers > 0,
        },
      ]
    : [];

  // Janelas de visibilidade do kanban — pedidos mais antigos ficam só na aba Pedidos
  const VINTE_QUATRO_HORAS_MS = 24 * 60 * 60 * 1000;
  const SETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;
  const agora = Date.now();

  // Agrupar pedidos por status para o Kanban
  const kanbanCols = [
    {
      label: "Preparando",
      items: orders
        .filter((o) => {
          if (!["pending", "confirmed", "preparing"].includes(o.status)) return false;
          return agora - new Date(o.placedAt).getTime() < SETE_DIAS_MS;
        })
        .map((o) => ({
          id: o.publicId,
          orderId: o.id,
          cliente: o.customerName,
          tempo: o.placedAt,
        })),
    },
    {
      label: "Entregando",
      items: orders
        .filter((o) => {
          if (!["ready_for_delivery", "out_for_delivery"].includes(o.status)) return false;
          return agora - new Date(o.placedAt).getTime() < SETE_DIAS_MS;
        })
        .map((o) => ({
          id: o.publicId,
          orderId: o.id,
          cliente: o.customerName,
          tempo: o.placedAt,
        })),
    },
    {
      label: "Entregue",
      items: orders
        .filter((o) => {
          if (o.status !== "delivered") return false;
          if (!o.deliveredAt) return true; // fallback: exibe se não tiver timestamp
          return agora - new Date(o.deliveredAt).getTime() < VINTE_QUATRO_HORAS_MS;
        })
        .map((o) => ({
          id: o.publicId,
          orderId: o.id,
          cliente: o.customerName,
          tempo: o.placedAt,
        })),
    },
  ];

  // Itens de estoque crítico: filtra produtos abaixo ou igual ao threshold, exclui sem threshold
  const estoqueItens = inventory
    .filter((item) => item.safetyStock > 0 && item.currentStock <= item.safetyStock)
    .slice(0, 5)
    .map((item) => {
      // Cor baseada na gravidade do alerta
      const barColor =
        item.currentStock === 0
          ? "#DC2626"
          : item.currentStock < item.safetyStock / 2
          ? "#F59E0B"
          : "#D97706";

      return {
        nome: item.product.name,
        qty: `${item.currentStock} / ${item.safetyStock} un.`,
        barWidth:
          Math.min(100, Math.round((item.currentStock / item.safetyStock) * 100)) + "%",
        barColor,
        alertColor: barColor,
      };
    });

  return (
    <div>
      {/* ── Metric Cards ── */}
      <div className="metric-grid">
        {summary === null
          ? [0, 1, 2, 3].map((i) => (
              <div key={i} className="metric-card" style={{ gap: 10 }}>
                <div className="metric-accent" style={{ background: "#E5E7EB" }} />
                <div style={{ height: 12, width: "60%", borderRadius: 6, background: "#E5E7EB", animation: "pulse 1.5s ease-in-out infinite" }} />
                <div style={{ height: 28, width: "80%", borderRadius: 6, background: "#E5E7EB", animation: "pulse 1.5s ease-in-out infinite" }} />
                <div style={{ height: 40, width: "100%", borderRadius: 6, background: "#F3F4F6", animation: "pulse 1.5s ease-in-out infinite" }} />
                <div style={{ height: 12, width: "40%", borderRadius: 6, background: "#E5E7EB", animation: "pulse 1.5s ease-in-out infinite" }} />
                <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
              </div>
            ))
          : metricCards.map((card) => (
              <div key={card.label} className="metric-card">
                <div className="metric-accent" style={{ background: card.accent }} />
                <span className="metric-label">{card.label}</span>
                <span className="metric-value">{card.value}</span>
                <Sparkline points={card.sparklinePoints} color={card.accent} />
                <span className={`metric-delta${card.deltaPositivo ? "" : " metric-delta--neg"}`}>
                  {card.delta}
                </span>
              </div>
            ))}
      </div>

      {/* ── Linha inferior ── */}
      <div className="dashboard-bottom">
        {/* Kanban com Drag-and-Drop */}
        <KanbanBoard initialCols={kanbanCols} />

        {/* Side cards */}
        <div className="side-cards">
          {/* Estoque Crítico */}
          <div className="side-card">
            <div className="side-card-header">
              <span className="side-card-title">Estoque Crítico</span>
              <span className="side-card-tag" style={{ color: estoqueItens.length > 0 ? "#F59E0B" : "var(--v2-text-muted)" }}>
                {estoqueItens.length > 0 ? "Alerta IA" : "Sem alertas"}
              </span>
            </div>
            {estoqueItens.length === 0 ? (
              <div className="action-card-body">
                <p className="action-card-text">Todos os produtos estão dentro do estoque esperado.</p>
              </div>
            ) : (
              <>
                {estoqueItens.map((item) => (
                  <div key={item.nome} className="stock-item">
                    <div className="stock-item-row">
                      <span className="stock-item-name">{item.nome}</span>
                      <IconAlert color={item.alertColor} />
                    </div>
                    <span className="stock-item-qty">{item.qty}</span>
                    <div className="stock-bar-track">
                      <div
                        className="stock-bar-fill"
                        style={{ width: item.barWidth, background: item.barColor }}
                      />
                    </div>
                  </div>
                ))}
                <div className="stock-footer">
                  <a href="/catalogo" className="stock-footer-link">Ver estoque completo →</a>
                </div>
              </>
            )}
          </div>

          {/* Próxima Ação Recomendada */}
          <div className="side-card">
            <div className="side-card-header">
              <span className="side-card-title">Próxima Ação Recomendada</span>
              <span className="side-card-tag" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <IconStar />
                <span style={{ color: "var(--v2-text-muted)", fontSize: 10 }}>IA</span>
              </span>
            </div>
            <div className="action-card-body">
              <p className="action-card-text">
                {orders.length === 0
                  ? "Nenhum pedido ativo. Verifique o catálogo e deixe a loja pronta para receber pedidos."
                  : `${orders.length} pedido${orders.length > 1 ? "s" : ""} em andamento. Acompanhe o fluxo no painel de pedidos.`}
              </p>
              <a href="/relatorios" className="action-btn">
                Ver Relatório Completo →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* FAB de atalho para criar novo pedido */}
      <NovoPedidoFAB />
    </div>
  );
}
