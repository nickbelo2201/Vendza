"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@vendza/utils";

type Props = {
  totalOrders: number;
  totalRevenueCents: number;
  averageTicketCents: number;
};

export function GraficoTempoReal({ totalOrders, totalRevenueCents, averageTicketCents }: Props) {
  const [ordens, setOrdens] = useState(totalOrders);
  const [receita, setReceita] = useState(totalRevenueCents);
  const [ticket, setTicket] = useState(averageTicketCents);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date>(new Date());

  useEffect(() => {
    const intervalo = setInterval(async () => {
      try {
        const hoje = new Date().toISOString().substring(0, 10);
        const res = await fetch(`/api/relatorios-hoje?from=${hoje}&to=${hoje}`);
        if (res.ok) {
          const json = await res.json();
          if (json?.data) {
            setOrdens(json.data.totalOrders ?? totalOrders);
            setReceita(json.data.totalRevenueCents ?? totalRevenueCents);
            setTicket(json.data.averageTicketCents ?? averageTicketCents);
            setUltimaAtualizacao(new Date());
          }
        }
      } catch {
        // falha silenciosa — mantém os dados anteriores
      }
    }, 30000);

    return () => clearInterval(intervalo);
  }, [totalOrders, totalRevenueCents, averageTicketCents]);

  const horaFormatada = ultimaAtualizacao.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="wp-panel" style={{ padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "var(--g)",
              boxShadow: "0 0 0 0 rgba(26,122,94,0.4)",
              animation: "pulso-verde 2s infinite",
            }}
          />
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--carbon)" }}>
            Tempo Real — Hoje
          </span>
        </div>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
          Atualizado às {horaFormatada}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        <div className="tr-sub-card" style={{ textAlign: "center", padding: "12px 8px", borderRadius: 10 }}>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 28,
            fontWeight: 700,
            color: "var(--g)",
            lineHeight: 1,
          }}>
            {ordens}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>Pedidos hoje</div>
        </div>

        <div className="tr-sub-card" style={{ textAlign: "center", padding: "12px 8px", borderRadius: 10 }}>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 22,
            fontWeight: 700,
            color: "var(--g)",
            lineHeight: 1,
          }}>
            {formatCurrency(receita)}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>Receita hoje</div>
        </div>

        <div className="tr-sub-card" style={{ textAlign: "center", padding: "12px 8px", borderRadius: 10 }}>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 22,
            fontWeight: 700,
            color: "var(--g)",
            lineHeight: 1,
          }}>
            {formatCurrency(ticket)}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>Ticket médio</div>
        </div>
      </div>

      <style>{`
        @keyframes pulso-verde {
          0%   { box-shadow: 0 0 0 0 rgba(26,122,94,0.5); }
          70%  { box-shadow: 0 0 0 8px rgba(26,122,94,0); }
          100% { box-shadow: 0 0 0 0 rgba(26,122,94,0); }
        }
        .tr-sub-card {
          background: var(--gl, #e8f5f0);
        }
        [data-theme="dark"] .tr-sub-card {
          background: rgba(26, 122, 94, 0.12);
          border: 1px solid rgba(26, 122, 94, 0.2);
        }
      `}</style>
    </div>
  );
}
