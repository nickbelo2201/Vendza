import { formatCurrency } from "@vendza/utils";

import { ApiError, fetchAPI } from "../../lib/api";

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

type DashboardSummary = {
  ordersToday: number;
  revenueCents: number;
  averageTicketCents: number;
  recurringCustomers: number;
  newCustomers: number;
};

type OrderItem = { productId: string; title: string; quantity: number; totalCents: number };
type Order = {
  id: string; publicId: string; status: string; channel: string;
  customerName: string; customerPhone: string; paymentMethod: string;
  totalCents: number; placedAt: string; items: OrderItem[];
};

async function getDashboardData() {
  try {
    const [summary, orders] = await Promise.all([
      fetchAPI<DashboardSummary>("/partner/dashboard/summary"),
      fetchAPI<Order[]>("/partner/orders"),
    ]);
    return { summary, orders };
  } catch (err) {
    if (err instanceof ApiError) return { summary: null, orders: [] };
    return { summary: null, orders: [] };
  }
}

export default async function PartnerHomePage() {
  const { summary, orders } = await getDashboardData();

  const metricCards = summary
    ? [
        {
          label: "Pedidos hoje",
          value: summary.ordersToday.toString(),
          accent: "#0052CC",
          sparklinePoints: "0,35 20,30 40,28 60,20 80,15 100,10 120,6",
        },
        {
          label: "Faturamento",
          value: formatCurrency(summary.revenueCents),
          accent: "#FF6B35",
          sparklinePoints: "0,38 20,32 40,30 60,22 80,18 100,12 120,8",
        },
        {
          label: "Ticket médio",
          value: formatCurrency(summary.averageTicketCents),
          accent: "#2D5A3D",
          sparklinePoints: "0,32 20,28 40,30 60,24 80,22 100,18 120,16",
        },
        {
          label: "Clientes recorrentes",
          value: `${summary.recurringCustomers}`,
          accent: "#9CA3AF",
          sparklinePoints: "0,28 20,26 40,28 60,25 80,24 100,22 120,21",
        },
      ]
    : [];

  // Agrupar pedidos por status para o Kanban
  const kanbanCols = [
    {
      label: "A Fazer",
      items: orders
        .filter((o) => ["pending", "confirmed"].includes(o.status))
        .map((o) => ({
          id: o.publicId,
          cliente: o.customerName,
          tempo: new Date(o.placedAt).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        })),
    },
    {
      label: "Em Progresso",
      items: orders
        .filter((o) => ["preparing", "ready_for_delivery"].includes(o.status))
        .map((o) => ({
          id: o.publicId,
          cliente: o.customerName,
          tempo: new Date(o.placedAt).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        })),
    },
    {
      label: "Concluído",
      items: orders
        .filter((o) => o.status === "delivered")
        .map((o) => ({
          id: o.publicId,
          cliente: o.customerName,
          tempo: new Date(o.placedAt).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        })),
    },
  ];

  // Estado vazio ou stock alerts (stub)
  const estoqueItens: Array<{ nome: string; qty: string; barColor: string; barWidth: string; alertColor: string }> = [];

  return (
    <div>
      {/* ── Metric Cards ── */}
      <div className="metric-grid">
        {metricCards.map((card) => (
          <div key={card.label} className="metric-card">
            <div className="metric-accent" style={{ background: card.accent }} />
            <span className="metric-label">{card.label}</span>
            <span className="metric-value">{card.value}</span>
            <Sparkline points={card.sparklinePoints} color={card.accent} />
          </div>
        ))}
      </div>

      {/* ── Linha inferior ── */}
      <div className="dashboard-bottom">
        {/* Kanban */}
        <div className="kanban-card">
          <div className="kanban-header">Pedidos em Andamento</div>
          <div className="kanban-grid">
            {kanbanCols.map((col) => (
              <div key={col.label}>
                <div className="kanban-col-label">{col.label}</div>
                {col.items.length === 0 ? (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "12px 0", textAlign: "center" }}>
                    Vazio
                  </div>
                ) : (
                  col.items.map((item) => (
                    <div key={item.id} className="kanban-item">
                      <span className="kanban-item-id">{item.id}: {item.cliente}</span>
                      <span className="kanban-item-sub">{item.tempo}</span>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Side cards */}
        <div className="side-cards">
          {/* Estoque Crítico */}
          {estoqueItens.length > 0 && (
            <div className="side-card">
              <div className="side-card-header">
                <span className="side-card-title">Estoque Crítico</span>
                <span className="side-card-tag">Alerta IA</span>
              </div>
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
            </div>
          )}

          {/* Próxima Ação Recomendada */}
          <div className="side-card">
            <div className="side-card-header">
              <span className="side-card-title">Status do Painel</span>
              <span className="side-card-tag">Live</span>
            </div>
            <div className="action-card-body">
              <p className="action-card-text">
                {orders.length === 0
                  ? "Nenhum pedido em andamento no momento."
                  : `${orders.length} pedido${orders.length > 1 ? "s" : ""} carregado${orders.length > 1 ? "s" : ""} da API em tempo real.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
