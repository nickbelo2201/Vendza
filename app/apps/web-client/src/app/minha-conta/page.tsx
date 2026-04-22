"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePerfil } from "../../hooks/useEnderecos";
import { useCarrinho } from "../../context/CarrinhoContext";
import { formatCurrency } from "@vendza/utils";
import type { TimelineEvent } from "@vendza/types";

// ---------------------------------------------------------------------------
// Tipos locais da minha-conta
// ---------------------------------------------------------------------------

type ContaOrderItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
};

type Pedido = {
  id: string;
  publicId: string;
  status: string;
  statusLabel: string;
  paymentMethod: string;
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  placedAt: string;
  items: ContaOrderItem[];
  timeline: TimelineEvent[];
};

type ApiResponse = {
  data: {
    customer: { id: string; name: string } | null;
    orders: Pedido[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

// ---------------------------------------------------------------------------
// Labels e cores de status
// ---------------------------------------------------------------------------

const STATUS_LABEL: Record<string, string> = {
  pending: "Recebido",
  confirmed: "Confirmado",
  preparing: "Em preparo",
  ready_for_delivery: "Pronto para entrega",
  out_for_delivery: "Saiu para entrega",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "var(--text-muted)",
  confirmed: "var(--blue)",
  preparing: "var(--amber)",
  ready_for_delivery: "var(--amber)",
  out_for_delivery: "var(--amber)",
  delivered: "var(--green)",
  cancelled: "#ef4444",
};

// ---------------------------------------------------------------------------
// Ícones SVG inline
// ---------------------------------------------------------------------------

function IconeRelogio() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconeCarrinho() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function IconeChevronBaixo() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function IconeChevronCima() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function IconeBusca() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Componente: card de um pedido
// ---------------------------------------------------------------------------

type CardPedidoProps = {
  pedido: Pedido;
  onPedirDeNovo: (pedido: Pedido) => void;
};

function CardPedido({ pedido, onPedirDeNovo }: CardPedidoProps) {
  const [expandido, setExpandido] = useState(false);

  const statusLabel = STATUS_LABEL[pedido.status] ?? pedido.statusLabel ?? pedido.status;
  const statusColor = STATUS_COLOR[pedido.status] ?? "var(--text-muted)";
  const dataFormatada = new Date(pedido.placedAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const totalItens = pedido.items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div className="wc-card" style={{ padding: "16px 20px" }}>
      {/* Cabeçalho do card */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 15,
              color: "var(--carbon)",
            }}
          >
            {pedido.publicId}
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              color: "var(--text-muted)",
              fontSize: 13,
            }}
          >
            <IconeRelogio />
            {dataFormatada}
          </span>
        </div>

        {/* Badge de status */}
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: statusColor,
            border: `1px solid ${statusColor}`,
            borderRadius: 20,
            padding: "2px 10px",
            whiteSpace: "nowrap",
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Resumo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginTop: 10,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 14, color: "var(--carbon)", fontWeight: 600 }}>
          {formatCurrency(pedido.totalCents)}
        </span>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          {totalItens} {totalItens === 1 ? "item" : "itens"}
        </span>
      </div>

      {/* Ações */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 12,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setExpandido((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "5px 12px",
            fontSize: 13,
            color: "var(--carbon)",
            cursor: "pointer",
          }}
        >
          {expandido ? <IconeChevronCima /> : <IconeChevronBaixo />}
          {expandido ? "Ocultar detalhes" : "Ver detalhes"}
        </button>

        <button
          onClick={() => onPedirDeNovo(pedido)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "var(--green)",
            border: "none",
            borderRadius: 6,
            padding: "5px 12px",
            fontSize: 13,
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <IconeCarrinho />
          Pedir de novo
        </button>
      </div>

      {/* Detalhes expandíveis */}
      {expandido && (
        <div
          style={{
            marginTop: 16,
            borderTop: "1px solid var(--border)",
            paddingTop: 16,
          }}
        >
          {/* Itens do pedido */}
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 8,
            }}
          >
            Itens
          </p>
          <div className="wc-stack" style={{ gap: 6, marginBottom: 16 }}>
            {pedido.items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 13,
                  color: "var(--carbon)",
                }}
              >
                <span>
                  {item.productName}{" "}
                  <span style={{ color: "var(--text-muted)" }}>× {item.quantity}</span>
                </span>
                <span style={{ fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }}>
                  {formatCurrency(item.totalPriceCents)}
                </span>
              </div>
            ))}
          </div>

          {/* Valores */}
          <div
            style={{
              borderTop: "1px solid var(--border)",
              paddingTop: 10,
              marginBottom: 16,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "var(--text-muted)" }}>Subtotal</span>
              <span>{formatCurrency(pedido.subtotalCents)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "var(--text-muted)" }}>Entrega</span>
              <span>{formatCurrency(pedido.deliveryFeeCents)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              <span>Total</span>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {formatCurrency(pedido.totalCents)}
              </span>
            </div>
          </div>

          {/* Timeline */}
          {pedido.timeline && pedido.timeline.length > 0 && (
            <>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 10,
                }}
              >
                Histórico
              </p>
              <div className="wc-stack" style={{ gap: 8 }}>
                {pedido.timeline.map((evento, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "var(--green)",
                        marginTop: 4,
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <p style={{ fontSize: 13, color: "var(--carbon)", margin: 0 }}>
                        {evento.label}
                      </p>
                      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
                        {new Date(evento.createdAt).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export default function MinhaContaPage() {
  const router = useRouter();
  const { perfil } = usePerfil();
  const { adicionarItem, limparCarrinho } = useCarrinho();

  const [telefone, setTelefone] = useState(perfil.telefone ?? "");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{
    customer: { id: string; name: string } | null;
    orders: Pedido[];
    totalPages: number;
    page: number;
  } | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(1);

  async function buscarPedidos(pagina: number) {
    if (!telefone.trim()) return;

    setCarregando(true);
    setErro(null);

    try {
      const params = new URLSearchParams({
        phone: telefone.trim(),
        page: String(pagina),
        pageSize: "10",
      });
      const res = await fetch(`${API_URL}/v1/storefront/cliente/pedidos?${params.toString()}`);

      if (!res.ok) {
        throw new Error(`Erro ao buscar pedidos (${res.status})`);
      }

      const json: ApiResponse = await res.json();
      setResultado({
        customer: json.data.customer,
        orders: json.data.orders,
        totalPages: json.data.totalPages,
        page: json.data.page,
      });
      setPaginaAtual(json.data.page);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro inesperado. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    buscarPedidos(1);
  }

  function handlePedirDeNovo(pedido: Pedido) {
    limparCarrinho();
    for (const item of pedido.items) {
      adicionarItem({
        productId: item.productId,
        name: item.productName,
        slug: item.productId, // slug não está disponível no histórico; usa productId como fallback
        imagemUrl: null,
        unitPriceCents: item.unitPriceCents,
        quantity: item.quantity,
      });
    }
    router.push("/checkout");
  }

  function irParaPagina(pagina: number) {
    buscarPedidos(pagina);
  }

  return (
    <main
      style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: "32px 16px 64px",
      }}
    >
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "var(--carbon)",
          marginBottom: 4,
        }}
      >
        Minha conta
      </h1>
      <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 28 }}>
        Consulte o histórico dos seus pedidos pelo número de telefone.
      </p>

      {/* Form de identificação */}
      <form onSubmit={handleSubmit} className="wc-card" style={{ padding: "20px", marginBottom: 24 }}>
        <label
          htmlFor="telefone"
          style={{
            display: "block",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--carbon)",
            marginBottom: 6,
          }}
        >
          Telefone
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            id="telefone"
            type="tel"
            className="wc-input"
            placeholder="(11) 99999-9999"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <button
            type="submit"
            className="wc-btn wc-btn-primary"
            disabled={carregando || !telefone.trim()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              whiteSpace: "nowrap",
              opacity: carregando ? 0.6 : 1,
              cursor: carregando ? "not-allowed" : "pointer",
            }}
          >
            {carregando ? (
              <>
                <span
                  style={{
                    display: "inline-block",
                    width: 14,
                    height: 14,
                    border: "2px solid rgba(255,255,255,0.4)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "wc-spin 0.7s linear infinite",
                  }}
                />
                Buscando...
              </>
            ) : (
              <>
                <IconeBusca />
                Ver meus pedidos
              </>
            )}
          </button>
        </div>
      </form>

      {/* Erro */}
      {erro && (
        <div
          className="wc-note"
          style={{ color: "#ef4444", borderColor: "#ef4444", marginBottom: 20 }}
        >
          {erro}
        </div>
      )}

      {/* Resultados */}
      {resultado !== null && (
        <>
          {resultado.customer === null ? (
            <div className="wc-note" style={{ marginBottom: 20 }}>
              Nenhum pedido encontrado para este telefone.
            </div>
          ) : (
            <>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--text-muted)",
                  marginBottom: 16,
                }}
              >
                Olá,{" "}
                <strong style={{ color: "var(--carbon)" }}>{resultado.customer.name}</strong>.
                Aqui estão seus pedidos.
              </p>

              {resultado.orders.length === 0 ? (
                <div className="wc-note">Nenhum pedido registrado ainda.</div>
              ) : (
                <div className="wc-stack" style={{ gap: 12 }}>
                  {resultado.orders.map((pedido) => (
                    <CardPedido
                      key={pedido.id}
                      pedido={pedido}
                      onPedirDeNovo={handlePedirDeNovo}
                    />
                  ))}
                </div>
              )}

              {/* Paginação */}
              {resultado.totalPages > 1 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 12,
                    marginTop: 24,
                  }}
                >
                  <button
                    onClick={() => irParaPagina(paginaAtual - 1)}
                    disabled={paginaAtual <= 1 || carregando}
                    className="wc-btn"
                    style={{
                      opacity: paginaAtual <= 1 ? 0.4 : 1,
                      cursor: paginaAtual <= 1 ? "not-allowed" : "pointer",
                    }}
                  >
                    Anterior
                  </button>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    Página {paginaAtual} de {resultado.totalPages}
                  </span>
                  <button
                    onClick={() => irParaPagina(paginaAtual + 1)}
                    disabled={paginaAtual >= resultado.totalPages || carregando}
                    className="wc-btn"
                    style={{
                      opacity: paginaAtual >= resultado.totalPages ? 0.4 : 1,
                      cursor:
                        paginaAtual >= resultado.totalPages ? "not-allowed" : "pointer",
                    }}
                  >
                    Próxima
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Keyframe para spinner */}
      <style>{`
        @keyframes wc-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}
