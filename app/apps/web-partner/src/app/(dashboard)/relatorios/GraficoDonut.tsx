"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

type Item = { name: string; value: number; color: string };

type Props = {
  dados: Item[];
  titulo: string;
  totalLabel?: string;
};

type TooltipPayloadItem = {
  name: string;
  value: number;
  payload: Item;
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
  return (
    <div style={{
      background: "var(--night, #0f172a)",
      color: "#fff",
      padding: "8px 12px",
      borderRadius: 8,
      fontSize: 12,
      boxShadow: "var(--shadow-md)",
    }}>
      <strong>{item.name}</strong>: {item.value}
    </div>
  );
}

export function GraficoDonut({ dados, titulo, totalLabel }: Props) {
  const total = dados.reduce((acc, d) => acc + d.value, 0);
  const vazio = dados.length === 0 || total === 0;

  return (
    <div className="wp-panel" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--carbon)" }}>{titulo}</h2>
      </div>

      <div style={{ padding: "20px 16px" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {/* Donut */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie
                    data={dados}
                    cx="50%"
                    cy="50%"
                    innerRadius={44}
                    outerRadius={64}
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {dados.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<TooltipCustom />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Label central */}
              <div style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}>
                <span style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "var(--carbon)",
                  lineHeight: 1,
                }}>
                  {total}
                </span>
                {totalLabel && (
                  <span style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                    {totalLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Legenda */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 0 }}>
              {dados.map((item) => {
                const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";
                return (
                  <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: item.color,
                      flexShrink: 0,
                    }} />
                    <span style={{
                      fontSize: 12,
                      color: "var(--carbon)",
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {item.name}
                    </span>
                    <span style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--s2, #334155)",
                      flexShrink: 0,
                    }}>
                      {item.value}
                    </span>
                    <span style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      flexShrink: 0,
                      minWidth: 36,
                      textAlign: "right",
                    }}>
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
