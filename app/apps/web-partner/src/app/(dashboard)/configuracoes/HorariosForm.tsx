"use client";

import { useEffect, useState } from "react";

import { salvarHorarios } from "./actions";

type HorarioDia = {
  dayOfWeek: number;
  opensAt: string;
  closesAt: string;
  isClosed: boolean;
};

type Turno = { opensAt: string; closesAt: string };
type DiaEstado = { dayOfWeek: number; isClosed: boolean; turnos: Turno[] };

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

const TURNOS_PADRAO: Turno[] = [{ opensAt: "08:00", closesAt: "22:00" }];
const TURNOS_PADRAO_DOM: Turno[] = [{ opensAt: "09:00", closesAt: "18:00" }];

function buildEstadoInicial(initialHours: HorarioDia[] | null): DiaEstado[] {
  if (!initialHours || initialHours.length === 0) {
    return NOMES_DIAS.map((_, idx) => ({
      dayOfWeek: idx,
      isClosed: idx === 0,
      turnos: idx === 0 ? TURNOS_PADRAO_DOM : TURNOS_PADRAO,
    }));
  }

  return NOMES_DIAS.map((_, idx): DiaEstado => {
    const registrosDoDia = initialHours.filter((h) => h.dayOfWeek === idx);

    if (registrosDoDia.length === 0) {
      return {
        dayOfWeek: idx,
        isClosed: idx === 0,
        turnos: idx === 0 ? TURNOS_PADRAO_DOM : TURNOS_PADRAO,
      };
    }

    // Se todos os registros marcam isClosed, o dia é fechado
    const isClosed = registrosDoDia.every((h) => h.isClosed);

    if (isClosed) {
      const primeiro = registrosDoDia[0];
      return {
        dayOfWeek: idx,
        isClosed: true,
        turnos: [{ opensAt: primeiro?.opensAt ?? "00:00", closesAt: primeiro?.closesAt ?? "00:00" }],
      };
    }

    // Múltiplos registros do mesmo dia viram múltiplos turnos
    const turnos: Turno[] = registrosDoDia
      .filter((h) => !h.isClosed)
      .map((h) => ({ opensAt: h.opensAt, closesAt: h.closesAt }));

    return {
      dayOfWeek: idx,
      isClosed: false,
      turnos: turnos.length > 0 ? turnos : TURNOS_PADRAO,
    };
  });
}

function flattenParaAPI(dias: DiaEstado[]): HorarioDia[] {
  const result: HorarioDia[] = [];
  for (const dia of dias) {
    if (dia.isClosed) {
      result.push({
        dayOfWeek: dia.dayOfWeek,
        opensAt: "00:00",
        closesAt: "00:00",
        isClosed: true,
      });
    } else {
      for (const turno of dia.turnos) {
        result.push({
          dayOfWeek: dia.dayOfWeek,
          opensAt: turno.opensAt,
          closesAt: turno.closesAt,
          isClosed: false,
        });
      }
    }
  }
  return result;
}

export function HorariosForm({ initialHours }: Props) {
  const [dias, setDias] = useState<DiaEstado[]>(() =>
    buildEstadoInicial(initialHours)
  );
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  function toggleFechado(dayOfWeek: number, isClosed: boolean) {
    setDias((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, isClosed } : d))
    );
    setFeedback(null);
  }

  function atualizarTurno(dayOfWeek: number, turnoIdx: number, campo: keyof Turno, valor: string) {
    setDias((prev) =>
      prev.map((d) => {
        if (d.dayOfWeek !== dayOfWeek) return d;
        const novosTurnos = d.turnos.map((t, i) =>
          i === turnoIdx ? { ...t, [campo]: valor } : t
        );
        return { ...d, turnos: novosTurnos };
      })
    );
    setFeedback(null);
  }

  function adicionarTurno(dayOfWeek: number) {
    setDias((prev) =>
      prev.map((d) => {
        if (d.dayOfWeek !== dayOfWeek) return d;
        return { ...d, turnos: [...d.turnos, { opensAt: "13:00", closesAt: "18:00" }] };
      })
    );
  }

  function removerTurno(dayOfWeek: number, turnoIdx: number) {
    setDias((prev) =>
      prev.map((d) => {
        if (d.dayOfWeek !== dayOfWeek) return d;
        return { ...d, turnos: d.turnos.filter((_, i) => i !== turnoIdx) };
      })
    );
  }

  // Auto-dismiss do toast após 3s
  useEffect(() => {
    if (feedback?.ok) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  async function salvar() {
    setSalvando(true);
    setFeedback(null);
    try {
      await salvarHorarios(flattenParaAPI(dias));
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
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700 }}>Horários de funcionamento</h2>
      </div>

      <div className="wp-stack">
        {dias.map((dia) => (
          <div
            key={dia.dayOfWeek}
            style={{
              paddingBottom: 16,
              borderBottom: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {/* Linha principal: nome + toggle fechado */}
            <div className="wp-row" style={{ gap: 16 }}>
              <span
                style={{
                  width: 80,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--night)",
                  flexShrink: 0,
                }}
              >
                {NOMES_DIAS[dia.dayOfWeek]}
              </span>

              <label className="wp-row" style={{ gap: 6, cursor: "pointer", flexShrink: 0 }}>
                <input
                  type="checkbox"
                  checked={dia.isClosed}
                  onChange={(e) => toggleFechado(dia.dayOfWeek, e.target.checked)}
                  style={{ accentColor: "var(--amber)", width: 15, height: 15 }}
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
            </div>

            {/* Turnos */}
            {!dia.isClosed && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 96 }}>
                {dia.turnos.map((turno, turnoIdx) => (
                  <div key={turnoIdx} className="wp-row" style={{ gap: 12, flexWrap: "wrap" }}>
                    <div className="wp-row" style={{ gap: 6 }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, minWidth: 36 }}>
                        Abre
                      </span>
                      <input
                        type="time"
                        className="wp-input"
                        value={turno.opensAt}
                        onChange={(e) =>
                          atualizarTurno(dia.dayOfWeek, turnoIdx, "opensAt", e.target.value)
                        }
                        style={{ width: 110 }}
                      />
                    </div>

                    <div className="wp-row" style={{ gap: 6 }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, minWidth: 36 }}>
                        Fecha
                      </span>
                      <input
                        type="time"
                        className="wp-input"
                        value={turno.closesAt}
                        onChange={(e) =>
                          atualizarTurno(dia.dayOfWeek, turnoIdx, "closesAt", e.target.value)
                        }
                        style={{ width: 110 }}
                      />
                    </div>

                    {/* Botão remover turno (só se tiver mais de 1) */}
                    {dia.turnos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removerTurno(dia.dayOfWeek, turnoIdx)}
                        style={{
                          background: "none",
                          border: "1px solid var(--border)",
                          borderRadius: 6,
                          cursor: "pointer",
                          padding: "4px 8px",
                          fontSize: 12,
                          color: "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                        title="Remover turno"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Remover turno
                      </button>
                    )}
                  </div>
                ))}

                {/* Botão adicionar segundo turno (só se tiver menos de 2) */}
                {dia.turnos.length < 2 && (
                  <button
                    type="button"
                    onClick={() => adicionarTurno(dia.dayOfWeek)}
                    style={{
                      background: "none",
                      border: "1px dashed var(--border)",
                      borderRadius: 6,
                      cursor: "pointer",
                      padding: "4px 10px",
                      fontSize: 12,
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      width: "fit-content",
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Adicionar turno
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Feedback inline — apenas erros */}
        {feedback && !feedback.ok && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: 13,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
            }}
          >
            {feedback.msg}
          </div>
        )}

        <div
          className="conf-btn-save"
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: 20,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
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

      {/* Toast de sucesso */}
      {feedback?.ok && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 500,
            background: "var(--green)",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            animation: "slide-in-right 0.2s ease",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {feedback.msg}
        </div>
      )}
    </div>
  );
}
