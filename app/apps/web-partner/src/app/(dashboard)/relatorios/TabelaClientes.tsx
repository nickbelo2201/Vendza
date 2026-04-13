"use client";

import { useState } from "react";
import { formatCurrency } from "@vendza/utils";

export type ClienteRelatorio = {
  name: string;
  totalOrders: number;
  totalRevenueCents: number;
  lastOrderDate: string;
  firstOrderDate: string;
};

type Filtro = "todos" | "novos" | "recorrentes";

type Props = {
  clientes: ClienteRelatorio[];
};

function calcularFrequencia(firstOrderDate: string, lastOrderDate: string, totalOrders: number): string {
  if (totalOrders <= 1) return "—";
  const inicio = new Date(firstOrderDate).getTime();
  const fim = new Date(lastOrderDate).getTime();
  const diasDiferenca = Math.max(1, (fim - inicio) / (1000 * 60 * 60 * 24));
  const semanas = diasDiferenca / 7;
  const freq = totalOrders / semanas;
  if (freq >= 1) {
    return `${freq.toFixed(1)}x/sem`;
  }
  const freqMensal = totalOrders / (diasDiferenca / 30);
  return `${freqMensal.toFixed(1)}x/mês`;
}

function formatarDataBR(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function IconeChevron({ rotacionado }: { rotacionado: boolean }) {
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
      style={{
        transition: "transform 0.2s ease",
        transform: rotacionado ? "rotate(180deg)" : "rotate(0deg)",
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function IconeUsuarios() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function TabelaClientes({ clientes }: Props) {
  const [aberto, setAberto] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const ordenados = [...clientes].sort((a, b) => b.totalOrders - a.totalOrders);

  const filtrados = ordenados.filter((c) => {
    if (filtro === "novos") return c.totalOrders === 1;
    if (filtro === "recorrentes") return c.totalOrders >= 2;
    return true;
  });

  const vazio = filtrados.length === 0;
  const totalClientes = clientes.length;

  return (
    <div className="wp-panel" style={{ padding: 0, overflow: "hidden" }}>
      {/* Header clicável — accordion */}
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        style={{
          width: "100%",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          background: "none",
          border: "none",
          borderBottom: aberto ? "1px solid var(--border)" : "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h2
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--carbon)",
              margin: 0,
            }}
          >
            Análise de Clientes
          </h2>
          {totalClientes > 0 && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                background: "var(--g, #1A7A5E)",
                color: "#fff",
                borderRadius: 20,
                padding: "2px 8px",
              }}
            >
              {totalClientes}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)" }}>
          {!aberto && totalClientes === 0 && (
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Sem dados</span>
          )}
          <IconeChevron rotacionado={aberto} />
        </div>
      </button>

      {/* Conteúdo accordion */}
      {aberto && (
        <>
          {/* Filtros */}
          {clientes.length > 0 && (
            <div
              style={{
                padding: "12px 20px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                gap: 6,
              }}
            >
              {(["todos", "novos", "recorrentes"] as Filtro[]).map((f) => {
                const ativo = filtro === f;
                const labels: Record<Filtro, string> = {
                  todos: "Todos",
                  novos: "Novos",
                  recorrentes: "Recorrentes",
                };
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFiltro(f)}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "4px 12px",
                      borderRadius: 6,
                      border: "none",
                      cursor: "pointer",
                      background: ativo ? "var(--g)" : "var(--s7, #f1f5f9)",
                      color: ativo ? "#fff" : "var(--s3, #64748b)",
                      transition: "all 0.15s",
                    }}
                  >
                    {labels[f]}
                  </button>
                );
              })}
            </div>
          )}

          {vazio ? (
            <div className="wp-empty">
              <div className="wp-empty-icon">
                <IconeUsuarios />
              </div>
              <p className="wp-empty-title">
                {clientes.length === 0
                  ? "Sem dados de clientes no período"
                  : `Nenhum cliente ${filtro === "novos" ? "novo" : "recorrente"} no período`}
              </p>
              <p className="wp-empty-desc">
                {clientes.length === 0
                  ? "Os dados de clientes aparecerão aqui quando disponíveis."
                  : "Tente selecionar um filtro diferente."}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="wp-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th style={{ textAlign: "center" }}>Pedidos</th>
                    <th style={{ textAlign: "right" }}>Ticket médio</th>
                    <th style={{ textAlign: "right" }}>Último pedido</th>
                    <th style={{ textAlign: "right" }}>Frequência</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((cliente, idx) => {
                    const isTopCliente = idx < 5 && cliente.totalOrders >= 2;
                    const ticketMedio =
                      cliente.totalOrders > 0
                        ? Math.round(cliente.totalRevenueCents / cliente.totalOrders)
                        : 0;
                    const freq = calcularFrequencia(
                      cliente.firstOrderDate,
                      cliente.lastOrderDate,
                      cliente.totalOrders
                    );

                    return (
                      <tr key={`${cliente.name}-${idx}`}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontWeight: 600, color: "var(--carbon)" }}>
                              {cliente.name}
                            </span>
                            {isTopCliente && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  background: "var(--amb, #E8902A)",
                                  color: "#fff",
                                  borderRadius: 4,
                                  padding: "2px 6px",
                                  letterSpacing: "0.04em",
                                  textTransform: "uppercase",
                                  flexShrink: 0,
                                }}
                              >
                                Top cliente
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span
                            style={{
                              fontFamily: "'Space Grotesk', sans-serif",
                              fontWeight: 700,
                              fontSize: 14,
                            }}
                          >
                            {cliente.totalOrders}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <span
                            style={{
                              fontFamily: "'Space Grotesk', sans-serif",
                              fontWeight: 700,
                              fontSize: 13,
                            }}
                          >
                            {formatCurrency(ticketMedio)}
                          </span>
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            fontSize: 13,
                            color: "var(--text-muted)",
                          }}
                        >
                          {formatarDataBR(cliente.lastOrderDate)}
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            fontSize: 13,
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontWeight: 600,
                            color: "var(--s3, #64748b)",
                          }}
                        >
                          {freq}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
