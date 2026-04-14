"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { moverCardKanban } from "../app/(dashboard)/kanban-actions";
import { createClient } from "../utils/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

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

const STATUS_CLASS: Record<string, string> = {
  pending: "wp-status wp-status-pending",
  confirmed: "wp-status wp-status-confirmed",
  preparing: "wp-status wp-status-preparing",
  ready_for_delivery: "wp-status wp-status-ready",
  out_for_delivery: "wp-status wp-status-out_delivery",
  delivered: "wp-status wp-status-delivered",
  cancelled: "wp-status wp-status-cancelled",
};

const CHANNEL_LABELS: Record<string, string> = {
  web: "Web",
  whatsapp: "WhatsApp",
  manual: "Manual",
};

// Mapeamento de avanço de status dentro do kanban
const KANBAN_NEXT: Record<string, { status: string; colLabel: string } | null> = {
  "Preparando": { status: "out_for_delivery", colLabel: "Entregando" },
  "Entregando": { status: "delivered", colLabel: "Entregue" },
  "Entregue": null,
};

type OrderItem = {
  productId: string;
  title: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
};

type TimelineEvent = {
  type: string;
  label: string;
  createdAt: string;
  note?: string;
};

type OrderDetalhe = {
  id: string;
  publicId: string;
  status: string;
  channel: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  subtotalCents: number;
  deliveryFeeCents: number;
  discountCents: number;
  totalCents: number;
  placedAt: string;
  note: string | null;
  address: {
    line1: string;
    number?: string;
    neighborhood: string;
    city: string;
    state: string;
  } | null;
  isPickup?: boolean;
  items: OrderItem[];
  timeline: TimelineEvent[];
};

function formatCents(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

type Props = {
  orderId: string | null;
  colLabel: string | null;
  onClose: () => void;
  onStatusAvancado: (novoStatus: string, novaColLabel: string) => void;
  onCancelado: () => void;
};

export function PedidoDrawerKanban({ orderId, colLabel, onClose, onStatusAvancado, onCancelado }: Props) {
  const [pedido, setPedido] = useState<OrderDetalhe | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [avancando, setAvancando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [currentColLabel, setCurrentColLabel] = useState<string | null>(colLabel);
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Monta no cliente e observa tema dark/light
  useEffect(() => {
    setMounted(true);
    const update = () => setIsDark(document.documentElement.dataset.theme === "dark");
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  // Sincroniza colLabel quando o drawer abre para um novo pedido
  useEffect(() => {
    setCurrentColLabel(colLabel);
  }, [orderId, colLabel]);

  useEffect(() => {
    if (!orderId) {
      setPedido(null);
      setErro(null);
      return;
    }

    let cancelado = false;
    setCarregando(true);
    setErro(null);
    setPedido(null);

    (async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token ?? null;

        const res = await fetch(`${API_URL}/v1/partner/orders/${orderId}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          cache: "no-store",
        });

        if (!res.ok) throw new Error(`Erro ao carregar pedido (HTTP ${res.status})`);
        const json = await res.json();
        if (!cancelado) setPedido(json.data as OrderDetalhe);
      } catch (err) {
        if (!cancelado) setErro(err instanceof Error ? err.message : "Erro desconhecido.");
      } finally {
        if (!cancelado) setCarregando(false);
      }
    })();

    return () => { cancelado = true; };
  }, [orderId]);

  // Fechar com Escape
  useEffect(() => {
    if (!orderId) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [orderId, onClose]);

  async function handleAvancarStatus() {
    if (!pedido || !currentColLabel) return;
    const proximo = KANBAN_NEXT[currentColLabel];
    if (!proximo) return;

    setAvancando(true);
    try {
      await moverCardKanban(pedido.id, proximo.status);
      setPedido((prev) => prev ? { ...prev, status: proximo.status } : prev);
      setCurrentColLabel(proximo.colLabel);
      onStatusAvancado(proximo.status, proximo.colLabel);
    } finally {
      setAvancando(false);
    }
  }

  async function handleCancelar() {
    if (!pedido) return;
    setCancelando(true);
    try {
      await moverCardKanban(pedido.id, "cancelled");
      onCancelado();
      onClose();
    } finally {
      setCancelando(false);
    }
  }

  if (!orderId || !mounted) return null;

  const proximo = currentColLabel ? KANBAN_NEXT[currentColLabel] : null;
  const isConcluido = currentColLabel === "Entregue";

  return createPortal(
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 400,
          background: isDark ? "rgba(0,0,0,0.65)" : "rgba(10,10,14,0.45)",
          backdropFilter: "blur(2px)",
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 401,
          width: "min(480px, 100vw)",
          background: "var(--surface)",
          boxShadow: isDark ? "-8px 0 40px rgba(0,0,0,0.6)" : "-8px 0 40px rgba(15,23,42,.18)",
          borderLeft: isDark ? "1px solid var(--border)" : "none",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Cabeçalho */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px",
          borderBottom: "1px solid var(--s6)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--night)" }}>
                {pedido ? pedido.publicId : "Carregando..."}
              </div>
              {pedido && (
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  {CHANNEL_LABELS[pedido.channel] ?? pedido.channel}
                  {" · "}
                  {new Date(pedido.placedAt).toLocaleString("pt-BR", {
                    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                  })}
                </div>
              )}
            </div>
            {pedido && (
              <span className={STATUS_CLASS[pedido.status] ?? "wp-status"}>
                {STATUS_LABEL[pedido.status] ?? pedido.status}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: 6,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Corpo com scroll */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {carregando && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)", fontSize: 14 }}>
              Carregando pedido...
            </div>
          )}

          {erro && (
            <div style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 10,
              padding: "12px 16px",
              fontSize: 13,
              color: "#dc2626",
            }}>
              {erro}
            </div>
          )}

          {pedido && (
            <div className="wp-stack">
              {/* Dados do cliente */}
              <div className="wp-card">
                <div className="wp-card-header">
                  <span className="wp-card-title">Cliente</span>
                  <span className="wp-badge wp-badge-muted">
                    {PAYMENT_LABELS[pedido.paymentMethod] ?? pedido.paymentMethod}
                  </span>
                </div>
                <div className="wp-stack" style={{ gap: 6 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{pedido.customerName}</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{pedido.customerPhone}</div>
                  {pedido.isPickup ? (
                    <div style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--amber)",
                      background: "rgba(224,123,57,.1)",
                      borderRadius: 6,
                      padding: "4px 8px",
                      display: "inline-block",
                      marginTop: 4,
                    }}>
                      Retirada no local
                    </div>
                  ) : pedido.address && (
                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                      {pedido.address.line1}
                      {pedido.address.number ? `, ${pedido.address.number}` : ""}
                      {" — "}
                      {pedido.address.neighborhood}, {pedido.address.city}/{pedido.address.state}
                    </div>
                  )}
                </div>
              </div>

              {/* Itens */}
              <div className="wp-card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid var(--s6)" }}>
                  <span className="wp-card-title">Itens</span>
                </div>
                <table className="wp-table" style={{ borderRadius: 0 }}>
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th style={{ textAlign: "center" }}>Qtd</th>
                      <th style={{ textAlign: "right" }}>Unit.</th>
                      <th style={{ textAlign: "right" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedido.items.map((item) => (
                      <tr key={item.productId}>
                        <td style={{ fontSize: 13 }}>{item.title}</td>
                        <td style={{ textAlign: "center", fontSize: 13 }}>{item.quantity}</td>
                        <td style={{ textAlign: "right", fontSize: 13, color: "var(--text-muted)" }}>
                          {formatCents(item.unitPriceCents)}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 600, fontSize: 13 }}>
                          {formatCents(item.totalCents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totais */}
              <div className="wp-card">
                <div className="wp-stack" style={{ gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "var(--text-muted)" }}>Subtotal</span>
                    <span>{formatCents(pedido.subtotalCents)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "var(--text-muted)" }}>Taxa de entrega</span>
                    <span>{pedido.deliveryFeeCents === 0 ? "Grátis" : formatCents(pedido.deliveryFeeCents)}</span>
                  </div>
                  {pedido.discountCents > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "var(--text-muted)" }}>Desconto</span>
                      <span style={{ color: "var(--g)" }}>- {formatCents(pedido.discountCents)}</span>
                    </div>
                  )}
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    borderTop: "1px solid var(--s6)", paddingTop: 8, marginTop: 4,
                  }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Total</span>
                    <span style={{
                      fontWeight: 700, fontSize: 16,
                      fontFamily: "'Space Grotesk', sans-serif",
                      color: "var(--g)",
                    }}>
                      {formatCents(pedido.totalCents)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Nota */}
              {pedido.note && (
                <div className="wp-card">
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                    Observação
                  </div>
                  <div style={{ fontSize: 13, color: "var(--s2)" }}>{pedido.note}</div>
                </div>
              )}

              {/* Timeline */}
              {pedido.timeline && pedido.timeline.length > 0 && (
                <div className="wp-card">
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
                    Histórico
                  </div>
                  <div style={{ position: "relative" }}>
                    {[...pedido.timeline].reverse().map((evento, idx, arr) => (
                      <div key={idx} style={{ display: "flex", gap: 12, position: "relative" }}>
                        {idx < arr.length - 1 && (
                          <div style={{
                            position: "absolute",
                            left: 7, top: 18, bottom: -10,
                            width: 2,
                            background: "var(--s6)",
                          }} />
                        )}
                        <div style={{
                          width: 16, height: 16, borderRadius: "50%",
                          background: idx === 0 ? "var(--g)" : "var(--s5)",
                          border: "2px solid var(--surface)",
                          boxShadow: "0 0 0 2px var(--s6)",
                          flexShrink: 0, marginTop: 2,
                          position: "relative", zIndex: 1,
                        }} />
                        <div style={{ paddingBottom: idx < arr.length - 1 ? 16 : 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--night)" }}>
                            {evento.label}
                          </div>
                          {evento.note && (
                            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                              {evento.note}
                            </div>
                          )}
                          <div style={{ fontSize: 11, color: "var(--s4)", marginTop: 3 }}>
                            {new Date(evento.createdAt).toLocaleString("pt-BR", {
                              day: "2-digit", month: "2-digit", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer de ações */}
        {pedido && (
          <div style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--s6)",
            display: "flex",
            gap: 8,
            flexShrink: 0,
            background: "var(--surface)",
          }}>
            {/* Avançar Status */}
            <button
              type="button"
              onClick={handleAvancarStatus}
              disabled={isConcluido || avancando}
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: 8,
                border: "none",
                background: isConcluido ? "var(--s6)" : "var(--g)",
                color: isConcluido ? "var(--text-muted)" : "#fff",
                fontWeight: 600,
                fontSize: 13,
                cursor: isConcluido ? "not-allowed" : avancando ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                opacity: avancando ? 0.7 : 1,
                transition: "opacity 0.15s",
              }}
            >
              {avancando ? (
                <span
                  style={{
                    display: "inline-block",
                    width: 12, height: 12,
                    border: "2px solid currentColor",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "kanban-spin 0.7s linear infinite",
                  }}
                />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
              {isConcluido ? "Entregue" : proximo ? `→ ${proximo.colLabel}` : "Avançar Status"}
            </button>

            {/* Imprimir */}
            <a
              href={`/pedidos/${orderId}/imprimir`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid var(--s6)",
                background: "transparent",
                color: "var(--text-muted)",
                fontWeight: 500,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                textDecoration: "none",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Imprimir
            </a>

            {/* Cancelar */}
            <button
              type="button"
              onClick={handleCancelar}
              disabled={cancelando || isConcluido}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #fecaca",
                background: "transparent",
                color: "#dc2626",
                fontWeight: 500,
                fontSize: 13,
                cursor: cancelando || isConcluido ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                opacity: cancelando || isConcluido ? 0.5 : 1,
              }}
            >
              {cancelando ? (
                <span
                  style={{
                    display: "inline-block",
                    width: 12, height: 12,
                    border: "2px solid currentColor",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "kanban-spin 0.7s linear infinite",
                  }}
                />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              )}
              Cancelar
            </button>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}
