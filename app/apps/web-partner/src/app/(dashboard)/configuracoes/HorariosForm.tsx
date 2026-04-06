"use client";

import { useState } from "react";

import { salvarHorarios } from "./actions";

export function HorariosForm({ horarios }: { horarios: unknown }) {
  const [texto, setTexto] = useState(() =>
    JSON.stringify(horarios ?? {}, null, 2)
  );
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [erroJson, setErroJson] = useState<string | null>(null);

  function handleChange(v: string) {
    setTexto(v);
    try {
      JSON.parse(v);
      setErroJson(null);
    } catch {
      setErroJson("JSON inválido. Verifique a formatação antes de salvar.");
    }
  }

  async function salvar() {
    if (erroJson) return;
    setSalvando(true);
    setFeedback(null);
    try {
      const body = JSON.parse(texto);
      await salvarHorarios(body);
      setFeedback({ ok: true, msg: "Horários salvos com sucesso." });
    } catch (err) {
      setFeedback({ ok: false, msg: err instanceof Error ? err.message : "Erro ao salvar." });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="wp-panel">
      <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Horários de funcionamento</h2>

      <div className="wp-stack">
        <div className="wp-form-group">
          <label className="wp-label">Configuração JSON</label>
          <textarea
            className="wp-input"
            value={texto}
            onChange={(e) => handleChange(e.target.value)}
            rows={12}
            style={{
              fontFamily: "'Space Grotesk', monospace",
              fontSize: 12,
              lineHeight: 1.6,
              resize: "vertical",
              minHeight: 200,
            }}
          />
        </div>

        {erroJson && (
          <div style={{
            padding: "8px 12px", borderRadius: 8, fontSize: 12,
            background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626",
          }}>
            {erroJson}
          </div>
        )}

        {feedback && (
          <div style={{
            padding: "10px 14px", borderRadius: 8, fontSize: 13,
            background: feedback.ok ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${feedback.ok ? "#bbf7d0" : "#fecaca"}`,
            color: feedback.ok ? "#15803d" : "#dc2626",
          }}>
            {feedback.msg}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="wp-btn wp-btn-primary"
            onClick={salvar}
            disabled={salvando || !!erroJson}
          >
            {salvando ? "Salvando..." : "Salvar Horários"}
          </button>
        </div>
      </div>
    </div>
  );
}
