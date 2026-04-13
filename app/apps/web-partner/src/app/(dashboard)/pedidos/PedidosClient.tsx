"use client";

import { useState } from "react";
import { formatCurrency } from "@vendza/utils";

import { StatusSelect } from "./StatusSelect";
import { PedidoDetalhe } from "./PedidoDetalhe";
import { PedidoManualModal } from "./PedidoManualModal";

type OrderItem = { productId: string; title: string; quantity: number; totalCents: number };
type Order = {
  id: string; publicId: string; status: string; channel: string;
  customerName: string; customerPhone: string; paymentMethod: string;
  totalCents: number; placedAt: string; items: OrderItem[];
};

const PAYMENT_LABELS: Record<string, string> = {
  pix: "PIX",
  cash: "Dinheiro",
  card_online: "Cartão online",
  card_on_delivery: "Cartão na entrega",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  preparing: "Preparando",
  ready_for_delivery: "Pronto",
  out_for_delivery: "A caminho",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

type Props = {
  pedidos: Order[];
  statusFiltro: string;
};

export function PedidosClient({ pedidos, statusFiltro }: Props) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [modalManualAberto, setModalManualAberto] = useState(false);

  return (
    <>
      {/* Barra de ações */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          className="wp-btn wp-btn-primary"
          style={{ fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
          onClick={() => setModalManualAberto(true)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Novo pedido
        </button>
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((order) => (
                <tr
                  key={order.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedOrderId(order.id)}
                >
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
                  <td onClick={(e) => e.stopPropagation()}>
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
                    {new Date(order.placedAt).toLocaleString("pt-BR", {
                      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                    })}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <StatusSelect orderId={order.id} statusAtual={order.status} statusLabel={STATUS_LABEL} />
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <a
                      href={`/pedidos/${order.id}/imprimir`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Imprimir comanda"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 12,
                        color: "var(--text-muted)",
                        textDecoration: "none",
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: "1px solid var(--border)",
                        background: "var(--surface)",
                        whiteSpace: "nowrap",
                        transition: "color 0.15s, border-color 0.15s",
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
                      </svg>
                      Imprimir
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <PedidoDetalhe
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />

      <PedidoManualModal
        aberto={modalManualAberto}
        onFechar={() => setModalManualAberto(false)}
      />
    </>
  );
}
