"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { createClient } from "@/utils/supabase/client";
import { formatCurrency } from "@vendza/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export type TipoDrill = "pedidos" | "faturamento" | "cancelamentos" | "novos-clientes" | null;

type TopProduto = { name: string; quantity: number; revenueCents: number };

type Props = {
  tipo: TipoDrill;
  from: string;
  to: string;
  onClose: () => void;
  topProducts?: TopProduto[];
};

// --- Tipos dos dados buscados ---
type PedidoResumo = {
  id: string;
  publicId: string;
  customerName: string;
  status: string;
  totalCents: number;
  placedAt: string;
  paymentMethod: string;
  cancellationReason?: string | null;
};

type ApiOrderItem = {
  id: string;
  publicId: string;
  customerName?: string;
  customer?: { name: string };
  status: string;
  totalCents?: number;
  totalPriceCents?: number;
  placedAt: string;
  paymentMethod: string;
  cancellationReason?: string | null;
};

type ApiOrdersResponse = {
  data: {
    orders: ApiOrderItem[];
    total: number;
    page: number;
    pageSize: number;
  };
};

// --- Constantes de labels ---
const TITULO: Record<NonNullable<TipoDrill>, string> = {
  pedidos: "Detalhamento de Pedidos",
  faturamento: "Faturamento por Produto",
  cancelamentos: "Pedidos Cancelados",
  "novos-clientes": "Novos Clientes",
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

const STATUS_BG: Record<string, string> = {
  pending: "rgba(234,179,8,.12)",
  confirmed: "rgba(59,130,246,.12)",
  preparing: "rgba(249,115,22,.12)",
  ready_for_delivery: "rgba(16,185,129,.12)",
  out_for_delivery: "rgba(99,102,241,.12)",
  delivered: "rgba(26,122,94,.15)",
  cancelled: "rgba(220,38,38,.1)",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "#92400e",
  confirmed: "#1d4ed8",
  preparing: "#c2410c",
  ready_for_delivery: "#065f46",
  out_for_delivery: "#4338ca",
  delivered: "var(--g, #1A7A5E)",
  cancelled: "#dc2626",
};

const PAYMENT_LABELS: Record<string, string> = {
  pix: "PIX",
  cash: "Dinheiro",
  card_online: "Cartão online",
  card_on_delivery: "Cartão entrega",
};

// --- Skeleton ---
function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "8px 0" }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 48,
            borderRadius: 8,
            background: "var(--s7, #f1f5f9)",
            animation: "skeleton-pulse 1.4s ease-in-out infinite",
            opacity: 1 - i * 0.1,
          }}
        />
      ))}
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

// --- Tooltip do BarChart ---
type TooltipPayloadItem = {
  value: number;
  payload: { name: string; revenueCents: number };
};

function TooltipFaturamento({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  if (!item) return null;
  return (
    <div
      className="chart-tooltip"
      style={{
        padding: "8px 12px",
        borderRadius: 8,
        fontSize: 12,
        lineHeight: 1.6,
        maxWidth: 220,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{item.payload.name}</div>
      <div>{formatCurrency(item.payload.revenueCents)}</div>
    </div>
  );
}

// --- Componente principal ---
export function KpiDrillDrawer({ tipo, from, to, onClose, topProducts = [] }: Props) {
  const [dados, setDados] = useState<PedidoResumo[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Fechar com Escape
  useEffect(() => {
    if (!tipo) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [tipo, onClose]);

  // Buscar dados ao abrir
  useEffect(() => {
    if (!tipo || tipo === "faturamento") {
      setDados([]);
      setErro(null);
      return;
    }

    let cancelado = false;
    setCarregando(true);
    setErro(null);
    setDados([]);

    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token ?? "";

        const res = await fetch(
          `${API_URL}/v1/partner/orders?from=${from}&to=${to}&limit=50`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }
        );

        if (!res.ok) throw new Error(`Erro ao buscar dados (HTTP ${res.status})`);
        const json = (await res.json()) as ApiOrdersResponse;

        const pedidos: PedidoResumo[] = (json.data?.orders ?? []).map((p) => ({
          id: p.id,
          publicId: p.publicId,
          customerName: p.customerName ?? p.customer?.name ?? "—",
          status: p.status,
          totalCents: p.totalCents ?? p.totalPriceCents ?? 0,
          placedAt: p.placedAt,
          paymentMethod: p.paymentMethod,
          cancellationReason: p.cancellationReason ?? null,
        }));

        if (!cancelado) {
          // Para cancelamentos: filtrar apenas cancelled
          // Para novos-clientes: deduplica por nome (proxy)
          if (tipo === "cancelamentos") {
            setDados(pedidos.filter((p) => p.status === "cancelled"));
          } else if (tipo === "novos-clientes") {
            const vistos = new Set<string>();
            const dedup: PedidoResumo[] = [];
            for (const p of pedidos) {
              if (!vistos.has(p.customerName)) {
                vistos.add(p.customerName);
                dedup.push(p);
              }
            }
            setDados(dedup);
          } else {
            setDados(pedidos);
          }
        }
      } catch (err) {
        if (!cancelado) {
          setErro(err instanceof Error ? err.message : "Erro desconhecido.");
        }
      } finally {
        if (!cancelado) setCarregando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [tipo, from, to]);

  if (!tipo) return null;

  const titulo = TITULO[tipo];
  const exportUrl = `${API_URL}/v1/partner/orders/export?from=${from}&to=${to}`;

  // Dados do gráfico de faturamento (topProducts já disponível via props)
  const dadosFaturamento = [...topProducts]
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 10)
    .map((p) => ({
      name: p.name.length > 20 ? p.name.substring(0, 20) + "…" : p.name,
      revenueCents: p.revenueCents,
      valor: p.revenueCents / 100,
    }));

  const maxRevenue = dadosFaturamento.length > 0
    ? Math.max(...dadosFaturamento.map((d) => d.revenueCents))
    : 0;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 500,
          background: "rgba(10,10,14,0.45)",
          backdropFilter: "blur(2px)",
        }}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 501,
          width: "min(520px, 100vw)",
          background: "var(--surface)",
          boxShadow: "-8px 0 40px rgba(15,23,42,.18)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Cabeçalho */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid var(--border, var(--s6))",
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--night, #0f172a)" }}>
              {titulo}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              {new Date(from + "T00:00:00").toLocaleDateString("pt-BR")}
              {" até "}
              {new Date(to + "T00:00:00").toLocaleDateString("pt-BR")}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {tipo !== "faturamento" && (
              <a
                href={exportUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border, var(--s6))",
                  background: "transparent",
                  color: "var(--g, #1A7A5E)",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  cursor: "pointer",
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Exportar CSV
              </a>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
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
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Corpo com scroll */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {/* Modo faturamento: BarChart horizontal */}
          {tipo === "faturamento" && (
            <>
              {dadosFaturamento.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 200,
                    color: "var(--text-muted)",
                    fontSize: 13,
                  }}
                >
                  Sem dados de faturamento no período.
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
                    Top {dadosFaturamento.length} produtos por faturamento no período.
                  </p>
                  <ResponsiveContainer width="100%" height={Math.max(200, dadosFaturamento.length * 36)}>
                    <BarChart
                      layout="vertical"
                      data={dadosFaturamento}
                      margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                      barSize={18}
                    >
                      <XAxis
                        type="number"
                        tick={{ fontSize: 10, fill: "var(--text-muted, #6b7280)" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) =>
                          `R$${Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`
                        }
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 11, fill: "var(--carbon, #1A1A2E)" }}
                        tickLine={false}
                        axisLine={false}
                        width={130}
                      />
                      <Tooltip content={<TooltipFaturamento />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                      <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                        {dadosFaturamento.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              maxRevenue > 0 && entry.revenueCents / maxRevenue >= 0.8
                                ? "var(--g, #1A7A5E)"
                                : "var(--gn, #15a87c)"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}

          {/* Modos que usam lista de pedidos */}
          {tipo !== "faturamento" && (
            <>
              {carregando && <Skeleton />}

              {erro && !carregando && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: 10,
                    padding: "12px 16px",
                    fontSize: 13,
                    color: "#dc2626",
                  }}
                >
                  {erro}
                </div>
              )}

              {!carregando && !erro && dados.length === 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 200,
                    flexDirection: "column",
                    gap: 8,
                    color: "var(--text-muted)",
                    fontSize: 13,
                    textAlign: "center",
                  }}
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  </svg>
                  <span>Nenhum dado encontrado no período.</span>
                </div>
              )}

              {!carregando && !erro && dados.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
                    {dados.length} registro{dados.length !== 1 ? "s" : ""} encontrado{dados.length !== 1 ? "s" : ""}
                  </p>

                  {tipo === "cancelamentos" ? (
                    /* Lista de cancelamentos com motivo */
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {dados.map((p) => (
                        <div
                          key={p.id}
                          className="drill-card-cancelamento"
                          style={{
                            padding: "12px 14px",
                            borderRadius: 10,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13 }}>
                              {p.publicId}
                            </span>
                            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                              {new Date(p.placedAt).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                          <div className="drill-card-cancelamento-cliente" style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                            {p.customerName}
                          </div>
                          <div className="drill-card-cancelamento-motivo" style={{ fontSize: 12 }}>
                            Motivo: {p.cancellationReason ?? "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : tipo === "novos-clientes" ? (
                    /* Lista de novos clientes */
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {dados.map((p) => (
                        <div
                          key={p.id}
                          style={{
                            padding: "10px 14px",
                            borderRadius: 10,
                            border: "1px solid var(--border, var(--s6))",
                            background: "var(--s8, #f8fafc)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <span style={{ fontWeight: 600, fontSize: 13, color: "var(--carbon)" }}>
                            {p.customerName}
                          </span>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                              {new Date(p.placedAt).toLocaleDateString("pt-BR")}
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                fontFamily: "'Space Grotesk', sans-serif",
                                color: "var(--g, #1A7A5E)",
                              }}
                            >
                              {formatCurrency(p.totalCents)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Tabela de pedidos */
                    <div style={{ overflowX: "auto" }}>
                      <table className="wp-table" style={{ fontSize: 12 }}>
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Cliente</th>
                            <th>Status</th>
                            <th>Pagamento</th>
                            <th style={{ textAlign: "right" }}>Valor</th>
                            <th style={{ textAlign: "right" }}>Data</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dados.map((p) => (
                            <tr key={p.id}>
                              <td>
                                <span
                                  style={{
                                    fontFamily: "'Space Grotesk', sans-serif",
                                    fontWeight: 700,
                                    fontSize: 12,
                                  }}
                                >
                                  {p.publicId}
                                </span>
                              </td>
                              <td style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {p.customerName}
                              </td>
                              <td>
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    padding: "2px 7px",
                                    borderRadius: 5,
                                    background: STATUS_BG[p.status] ?? "var(--s7)",
                                    color: STATUS_COLOR[p.status] ?? "var(--s2)",
                                  }}
                                >
                                  {STATUS_LABEL[p.status] ?? p.status}
                                </span>
                              </td>
                              <td style={{ color: "var(--text-muted)" }}>
                                {PAYMENT_LABELS[p.paymentMethod] ?? p.paymentMethod}
                              </td>
                              <td style={{ textAlign: "right" }}>
                                <span
                                  style={{
                                    fontFamily: "'Space Grotesk', sans-serif",
                                    fontWeight: 700,
                                    color: "var(--g, #1A7A5E)",
                                  }}
                                >
                                  {formatCurrency(p.totalCents)}
                                </span>
                              </td>
                              <td style={{ textAlign: "right", color: "var(--text-muted)" }}>
                                {new Date(p.placedAt).toLocaleString("pt-BR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
