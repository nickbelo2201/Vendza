"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type DataPoint = { date: string; revenueCents: number; count?: number };

type Props = {
  dados: DataPoint[];
};

function formatarDia(date: string): string {
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type TooltipPayloadItem = {
  value: number;
  payload: DataPoint;
};

function TooltipCustom({
  active,
  payload,
  modo,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  modo: "faturamento" | "pedidos";
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  if (!item) return null;
  const d = item.payload;
  return (
    <div style={{
      background: "var(--night, #0f172a)",
      color: "#fff",
      padding: "8px 12px",
      borderRadius: 8,
      fontSize: 12,
      lineHeight: 1.6,
      boxShadow: "var(--shadow-md)",
    }}>
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{formatarDia(d.date)}</div>
      {modo === "faturamento" ? (
        <div>{formatarReais(d.revenueCents)}</div>
      ) : (
        <div>{d.count ?? 0} pedidos</div>
      )}
    </div>
  );
}

export function GraficoLinha({ dados }: Props) {
  const [modo, setModo] = useState<"faturamento" | "pedidos">("faturamento");

  const dadosFormatados = dados.map((d) => ({
    ...d,
    valor: modo === "faturamento" ? d.revenueCents / 100 : (d.count ?? 0),
    label: formatarDia(d.date),
  }));

  const vazio = !dados || dados.length === 0;

  return (
    <div className="wp-panel" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--carbon)" }}>
          Evolução por dia
        </h2>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            type="button"
            onClick={() => setModo("faturamento")}
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: "4px 12px",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              background: modo === "faturamento" ? "var(--g)" : "var(--s7, #f1f5f9)",
              color: modo === "faturamento" ? "#fff" : "var(--s3, #64748b)",
              transition: "all 0.15s",
            }}
          >
            Faturamento
          </button>
          <button
            type="button"
            onClick={() => setModo("pedidos")}
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: "4px 12px",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              background: modo === "pedidos" ? "var(--g)" : "var(--s7, #f1f5f9)",
              color: modo === "pedidos" ? "#fff" : "var(--s3, #64748b)",
              transition: "all 0.15s",
            }}
          >
            Pedidos
          </button>
        </div>
      </div>

      <div style={{ padding: "20px 8px 16px 0" }}>
        {vazio ? (
          <div style={{
            height: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
            fontSize: 13,
          }}>
            Nenhum dado para exibir no período.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={dadosFormatados} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="gradienteVerde" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--g, #1A7A5E)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--g, #1A7A5E)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e5e0d8)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "var(--text-muted, #6b7280)" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--text-muted, #6b7280)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) =>
                  modo === "faturamento"
                    ? `R$${Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`
                    : String(v)
                }
                width={60}
              />
              <Tooltip content={<TooltipCustom modo={modo} />} />
              <Area
                type="monotone"
                dataKey="valor"
                stroke="var(--g, #1A7A5E)"
                strokeWidth={2}
                fill="url(#gradienteVerde)"
                dot={false}
                activeDot={{ r: 5, fill: "var(--g, #1A7A5E)", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
