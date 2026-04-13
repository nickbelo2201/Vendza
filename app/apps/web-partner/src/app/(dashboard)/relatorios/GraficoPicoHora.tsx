"use client";

import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type SalesByHour = { hour: number; count: number; revenueCents: number };

type Props = {
  dados: SalesByHour[];
};

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type TooltipPayloadItem = {
  value: number;
  payload: { hour: number; count: number; revenueCents: number };
};

function TooltipCustom({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
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
      <div style={{ fontWeight: 600 }}>{String(d.hour).padStart(2, "0")}:00h</div>
      <div>{d.count} pedido{d.count !== 1 ? "s" : ""}</div>
      <div>{formatarReais(d.revenueCents)}</div>
    </div>
  );
}

export function GraficoPicoHora({ dados }: Props) {
  const vazio = !dados || dados.length === 0;

  // Preencher todas as 24h com zeros onde não há dado
  const allHours = Array.from({ length: 24 }, (_, i) => i);
  const dataMap: Record<number, SalesByHour> = {};
  for (const d of dados) {
    dataMap[d.hour] = d;
  }

  const dadosCompletos = allHours.map((h) => ({
    hour: h,
    count: dataMap[h]?.count ?? 0,
    revenueCents: dataMap[h]?.revenueCents ?? 0,
    label: `${String(h).padStart(2, "0")}h`,
  }));

  const maxCount = dados.length > 0 ? Math.max(...dados.map((d) => d.count)) : 0;
  const horaPico = maxCount > 0 ? dados.find((d) => d.count === maxCount)?.hour ?? -1 : -1;

  // Cor proporcional: mais pedidos = verde mais escuro
  function corBarra(count: number): string {
    if (count === 0) return "var(--s6, #e2e8f0)";
    if (maxCount === 0) return "var(--gl, #e8f5f0)";
    const intensidade = count / maxCount;
    if (intensidade >= 0.8) return "var(--g, #1A7A5E)";
    if (intensidade >= 0.5) return "var(--gn, #15a87c)";
    return "var(--gl, #e8f5f0)";
  }

  return (
    <div className="wp-panel" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--carbon)" }}>
            Pico de vendas por hora
          </h2>
          {horaPico >= 0 && (
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--g)",
              background: "var(--gl, #e8f5f0)",
              padding: "3px 10px",
              borderRadius: 20,
            }}>
              Pico: {String(horaPico).padStart(2, "0")}:00h
            </span>
          )}
        </div>
      </div>

      <div style={{ padding: "20px 8px 12px 4px" }}>
        {vazio ? (
          <div style={{
            height: 160,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
            fontSize: 13,
          }}>
            Sem dados no período.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={dadosCompletos} margin={{ top: 16, right: 4, left: 0, bottom: 0 }} barSize={10}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: "var(--text-muted, #6b7280)" }}
                tickLine={false}
                axisLine={false}
                interval={3}
              />
              <Tooltip content={<TooltipCustom />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {dadosCompletos.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={corBarra(entry.count)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
