"use client";

import { useState } from "react";
import { formatCurrency } from "@vendza/utils";
import type { Cliente } from "@vendza/types";

import { ClienteDetalhe } from "./ClienteDetalhe";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export function BuscaClientes({ clientes }: { clientes: Cliente[] }) {
  const [busca, setBusca] = useState("");
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<string | null>(null);

  const resultado = busca.trim()
    ? clientes.filter((c) => {
        const q = busca.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.phone.replace(/\D/g, "").includes(q.replace(/\D/g, ""))
        );
      })
    : clientes;

  return (
    <>
    <div className="wp-stack">
      {/* Campo de busca */}
      <div style={{ position: "relative", maxWidth: 360 }}>
        <div style={{
          position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
          color: "var(--text-muted)", pointerEvents: "none",
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <input
          className="wp-input"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          style={{ paddingLeft: 36 }}
        />
      </div>

      {/* Tabela */}
      <div className="wp-panel" style={{ padding: 0, overflow: "hidden" }}>
        {resultado.length === 0 ? (
          <div className="wp-empty">
            <div className="wp-empty-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <p className="wp-empty-title">
              {busca ? "Nenhum cliente encontrado" : "Nenhum cliente ainda"}
            </p>
            <p className="wp-empty-desc">
              {busca
                ? `Nenhum resultado para "${busca}". Tente outro nome ou telefone.`
                : "Clientes são criados automaticamente no primeiro pedido."}
            </p>
          </div>
        ) : (
          <table className="wp-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Contato</th>
                <th>Total gasto</th>
                <th>Último pedido</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {resultado.map((c) => (
                <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => setClienteSelecionadoId(c.id)}>
                  <td>
                    <div className="wp-row" style={{ gap: 10 }}>
                      <div className="wp-avatar">{getInitials(c.name)}</div>
                      <span style={{ fontWeight: 600 }}>{c.name}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>{c.phone}</div>
                    {c.email && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.email}</div>}
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", fontSize: 15 }}>
                      {formatCurrency(c.totalSpentCents)}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td>
                    {c.isInactive
                      ? <span className="wp-badge wp-badge-amber">Inativo</span>
                      : <span className="wp-badge wp-badge-green">Ativo</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>

    <ClienteDetalhe
      clienteId={clienteSelecionadoId}
      onClose={() => setClienteSelecionadoId(null)}
    />
    </>
  );
}
