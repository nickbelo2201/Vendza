"use client";

import { useState } from "react";

import { salvarHorarios } from "./actions";

type HorarioDia = {
  dayOfWeek: number;
  opensAt: string;
  closesAt: string;
  isClosed: boolean;
};

type Props = {
  initialHours: HorarioDia[] | null;
};

const NOMES_DIAS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

const HORARIOS_PADRAO: HorarioDia[] = [
  { dayOfWeek: 0, opensAt: "08:00", closesAt: "22:00", isClosed: true },
  { dayOfWeek: 1, opensAt: "08:00", closesAt: "22:00", isClosed: false },
  { dayOfWeek: 2, opensAt: "08:00", closesAt: "22:00", isClosed: false },
  { dayOfWeek: 3, opensAt: "08:00", closesAt: "22:00", isClosed: false },
  { dayOfWeek: 4, opensAt: "08:00", closesAt: "22:00", isClosed: false },
  { dayOfWeek: 5, opensAt: "08:00", closesAt: "22:00", isClosed: false },
  { dayOfWeek: 6, opensAt: "09:00", closesAt: "18:00", isClosed: false },
];

function buildEstadoInicial(initialHours: HorarioDia[] | null): HorarioDia[] {
  if (!initialHours || initialHours.length === 0) {
    return HORARIOS_PADRAO;
  }

  return NOMES_DIAS.map((_, idx): HorarioDia => {
    const encontrado = initialHours.find((h) => h.dayOfWeek === idx);
    if (encontrado) return encontrado;
    return HORARIOS_PADRAO[idx] ?? { dayOfWeek: idx, opensAt: "08:00", closesAt: "22:00", isClosed: false };
  });
}

export function HorariosForm({ initialHours }: Props) {
  const [horarios, setHorarios] = useState<HorarioDia[]>(() =>
    buildEstadoInicial(initialHours)
  );
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  function atualizarDia(dayOfWeek: number, campo: keyof HorarioDia, valor: string | boolean) {
    setHorarios((prev) =>
      prev.map((h) =>
        h.dayOfWeek === dayOfWeek ? { ...h, [campo]: valor } : h
      )
    );
    setFeedback(null);
  }

  async function salvar() {
    setSalvando(true);
    setFeedback(null);
    try {
      await salvarHorarios(horarios);
      setFeedback({ ok: true, msg: "Horários salvos com sucesso." });
    } catch (err) {
      setFeedback({
        ok: false,
        msg: err instanceof Error ? err.message : "Erro ao salvar horários.",
      });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="wp-panel">
      <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>
        Horários de funcionamento
      </h2>

      <div className="wp-stack">
        {horarios.map((dia) => (
          <div
            key={dia.dayOfWeek}
            className="wp-row"
            style={{ paddingBottom: 12, borderBottom: "1px solid var(--border)" }}
          >
            {/* Nome do dia */}
            <span
              style={{
                width: 80,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--carbon)",
                flexShrink: 0,
              }}
            >
              {NOMES_DIAS[dia.dayOfWeek]}
            </span>

            {/* Toggle Fechado */}
            <label
              className="wp-row"
              style={{ gap: 6, cursor: "pointer", flexShrink: 0 }}
            >
              <input
                type="checkbox"
                checked={dia.isClosed}
                onChange={(e) =>
                  atualizarDia(dia.dayOfWeek, "isClosed", e.target.checked)
                }
                style={{ accentColor: "var(--v2-green)", width: 15, height: 15 }}
              />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: dia.isClosed ? "var(--amber)" : "var(--text-muted)",
                }}
              >
                Fechado
              </span>
            </label>

            {/* Input opensAt */}
            <div className="wp-row" style={{ gap: 6 }}>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  fontWeight: 500,
                }}
              >
                Abre
              </span>
              <input
                type="time"
                className="wp-input"
                value={dia.opensAt}
                disabled={dia.isClosed}
                onChange={(e) =>
                  atualizarDia(dia.dayOfWeek, "opensAt", e.target.value)
                }
                style={{
                  width: 110,
                  opacity: dia.isClosed ? 0.4 : 1,
                  cursor: dia.isClosed ? "not-allowed" : "text",
                }}
              />
            </div>

            {/* Input closesAt */}
            <div className="wp-row" style={{ gap: 6 }}>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  fontWeight: 500,
                }}
              >
                Fecha
              </span>
              <input
                type="time"
                className="wp-input"
                value={dia.closesAt}
                disabled={dia.isClosed}
                onChange={(e) =>
                  atualizarDia(dia.dayOfWeek, "closesAt", e.target.value)
                }
                style={{
                  width: 110,
                  opacity: dia.isClosed ? 0.4 : 1,
                  cursor: dia.isClosed ? "not-allowed" : "text",
                }}
              />
            </div>
          </div>
        ))}

        {feedback && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: 13,
              background: feedback.ok ? "#f0fdf4" : "#fef2f2",
              border: `1px solid ${feedback.ok ? "#bbf7d0" : "#fecaca"}`,
              color: feedback.ok ? "#15803d" : "#dc2626",
            }}
          >
            {feedback.msg}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="wp-btn wp-btn-primary"
            onClick={salvar}
            disabled={salvando}
          >
            {salvando ? "Salvando..." : "Salvar Horários"}
          </button>
        </div>
      </div>
    </div>
  );
}
