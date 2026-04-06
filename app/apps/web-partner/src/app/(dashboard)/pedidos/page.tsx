import { Suspense } from "react";
import { formatCurrency } from "@vendza/utils";

import { ApiError, fetchAPI } from "../../../lib/api";
import { StatusSelect } from "./StatusSelect";
import { FiltroStatus } from "./FiltroStatus";

type OrderItem = { productId: string; title: string; quantity: number; totalCents: number };
type Order = {
  id: string; publicId: string; status: string; channel: string;
  customerName: string; customerPhone: string; paymentMethod: string;
  totalCents: number; placedAt: string; items: OrderItem[];
};

const PAYMENT_LABELS: Record<string, string> = {
  pix: "PIX", cash: "Dinheiro",
  card_online: "Cartão online", card_on_delivery: "Cartão na entrega",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente", confirmed: "Confirmado", preparing: "Preparando",
  ready_for_delivery: "Pronto", out_for_delivery: "A caminho",
  delivered: "Entregue", cancelled: "Cancelado",
};

async function getPedidos(status?: string): Promise<Order[]> {
  try {
    const path = status ? `/partner/orders?status=${status}` : "/partner/orders";
    return await fetchAPI<Order[]>(path);
  } catch (err) {
    if (err instanceof ApiError) return [];
    return [];
  }
}

type PageProps = {
  searchParams: Promise<{ status?: string }>;
};

export default async function OrdersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFiltro = params.status ?? "";
  const pedidos = await getPedidos(statusFiltro || undefined);

  return (
    <div className="wp-stack-lg">
      <div className="wp-page-header">
        <div className="wp-row-between">
          <div>
            <h1>Pedidos</h1>
            <p>Confirme, prepare e despache em tempo real.</p>
          </div>
          <span className="wp-badge wp-badge-blue">
            {pedidos.length} pedido{pedidos.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div style={{ paddingBottom: 4 }}>
        <Suspense fallback={null}>
          <FiltroStatus statusAtivo={statusFiltro} />
        </Suspense>
      </div>

      <div className="wp-panel" style={{ padding: 0, overflow: "hidden" }}>
        {pedidos.length === 0 ? (
          <div className="wp-empty">
            <div className="wp-empty-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </div>
            <p className="wp-empty-title">Nenhum pedido encontrado</p>
            <p className="wp-empty-desc">
              {statusFiltro
                ? `Nenhum pedido com status "${STATUS_LABEL[statusFiltro] ?? statusFiltro}".`
                : "Os pedidos aparecerão aqui assim que chegarem."}
            </p>
          </div>
        ) : (
          <table className="wp-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Itens</th>
                <th>Pagamento</th>
                <th>Total</th>
                <th>Horário</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((order) => (
                <tr key={order.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{order.publicId}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{order.channel}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{order.customerPhone}</div>
                  </td>
                  <td>
                    {order.items.map((item) => (
                      <div key={item.productId} style={{ fontSize: 13 }}>
                        <span style={{ fontWeight: 600 }}>{item.quantity}×</span> {item.title}
                      </div>
                    ))}
                  </td>
                  <td>
                    <span className="wp-badge wp-badge-muted">
                      {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", fontSize: 15 }}>
                      {formatCurrency(order.totalCents)}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {new Date(order.placedAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td>
                    <StatusSelect orderId={order.id} statusAtual={order.status} statusLabel={STATUS_LABEL} />
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
