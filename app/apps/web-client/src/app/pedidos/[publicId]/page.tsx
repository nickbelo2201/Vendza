import { notFound } from "next/navigation";
import { formatCurrency } from "@vendza/utils";
import type { OrderDetalhe } from "@vendza/types";

import { fetchStorefront, fetchStorefrontConfig } from "../../../lib/api";
import { OrderTracker } from "../../../components/OrderTracker";
import { SalvarEnderecoPrompt } from "../../../components/SalvarEnderecoPrompt";

export async function generateMetadata({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  try {
    const config = await fetchStorefrontConfig<{ branding: { name: string } }>("/storefront/config");
    return {
      title: `Pedido ${publicId} — ${config.branding.name}`,
      description: `Acompanhe seu pedido ${publicId} em tempo real.`,
    };
  } catch {
    return { title: `Pedido ${publicId}` };
  }
}

type StorefrontConfigWhatsapp = {
  whatsappPhone: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Aguardando confirmação",
  confirmed: "Confirmado",
  preparing: "Em preparo",
  ready_for_delivery: "Pronto para entrega",
  out_for_delivery: "Saiu para entrega",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "var(--amber)",
  confirmed: "var(--blue)",
  preparing: "var(--blue)",
  ready_for_delivery: "var(--green)",
  out_for_delivery: "var(--green)",
  delivered: "var(--green)",
  cancelled: "#dc2626",
};

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  let order: OrderDetalhe;
  try {
    order = await fetchStorefront<OrderDetalhe>(`/orders/${publicId}`);
  } catch {
    notFound();
  }

  let whatsappPhone = "";
  try {
    const config = await fetchStorefrontConfig<StorefrontConfigWhatsapp>("/storefront/config");
    whatsappPhone = config.whatsappPhone;
  } catch {
    // silencia
  }

  const statusColor = STATUS_COLORS[order.status] ?? "var(--text-muted)";
  const statusLabel = STATUS_LABELS[order.status] ?? order.status;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <a href="/" className="wc-btn wc-btn-secondary" style={{ display: "inline-flex" }}>
          ← Voltar ao início
        </a>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Cabeçalho do pedido */}
        <div className="wc-card" style={{ textAlign: "center" }}>
          <h1 style={{ margin: "0 0 8px", color: "var(--carbon)" }}>Pedido {order.publicId}</h1>
          <span
            className="wc-badge"
            style={{
              background: `${statusColor}22`,
              color: statusColor,
              fontSize: 14,
              padding: "6px 16px",
            }}
          >
            {statusLabel}
          </span>
          <p style={{ color: "var(--text-muted)", marginTop: 8, marginBottom: 0 }}>
            Olá, {order.customerName}!
          </p>
        </div>

        {/* Prompt para salvar endereço — só aparece se o pedido tem endereço e não é retirada */}
        {order.address && !order.isPickup && (
          <SalvarEnderecoPrompt
            logradouro={order.address.line1}
            numero={order.address.number ?? ""}
            bairro={order.address.neighborhood}
            cidade={order.address.city}
            estado={order.address.state}
            cep=""
          />
        )}

        {/* Timeline realtime */}
        <div className="wc-card">
          <h3 style={{ margin: "0 0 20px", color: "var(--carbon)" }}>Histórico do pedido</h3>
          <OrderTracker
            publicId={order.publicId}
            initialTimeline={order.timeline}
            initialStatus={order.status}
          />
        </div>

        {/* Itens */}
        <div className="wc-card">
          <h3 style={{ margin: "0 0 16px", color: "var(--carbon)" }}>Itens do pedido</h3>
          <table className="wc-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Produto</th>
                <th style={{ textAlign: "right" }}>Qtd</th>
                <th style={{ textAlign: "right" }}>Unit.</th>
                <th style={{ textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.productName}</td>
                  <td style={{ textAlign: "right" }}>{item.quantity}</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(item.unitPriceCents)}</td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{formatCurrency(item.totalPriceCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            style={{
              marginTop: 16,
              borderTop: "1px solid var(--border)",
              paddingTop: 12,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: 14 }}>
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotalCents)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: 14 }}>
              <span>Entrega</span>
              <span>{formatCurrency(order.deliveryFeeCents)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16 }}>
              <span>Total</span>
              <span style={{ color: "var(--green)" }}>{formatCurrency(order.totalCents)}</span>
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
              Pagamento:{" "}
              {order.paymentMethod === "pix"
                ? "PIX"
                : order.paymentMethod === "cash"
                ? "Dinheiro"
                : "Cartão na entrega"}
            </div>
          </div>
        </div>

        {/* WhatsApp */}
        {whatsappPhone && (
          <a
            href={`https://wa.me/${whatsappPhone}?text=Oi%2C+preciso+de+ajuda+com+o+pedido+${order.publicId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="wc-btn wc-btn-amber"
            style={{ textAlign: "center" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Falar no WhatsApp sobre este pedido
          </a>
        )}
      </div>
    </div>
  );
}
