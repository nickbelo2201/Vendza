"use client";

import { useState } from "react";

import { salvarZonasEntrega } from "./actions";

type ZonaMode = "radius" | "neighborhoods";

type Zona = {
  id?: string;
  label: string;
  feeCents: number;
  etaMinutes: number;
  mode: ZonaMode;
  radiusKm: number | null;
  centerLat: number | null;
  centerLng: number | null;
  neighborhoods: string[];
  minimumOrderCents: number;
  freeShippingAboveCents: number;
};

function centavosParaReais(v: number): string {
  return (v / 100).toFixed(2).replace(".", ",");
}

function reaisParaCentavos(v: string): number {
  const n = parseFloat(v.replace(",", ".").replace(/[^\d.]/g, ""));
  return isNaN(n) ? 0 : Math.round(n * 100);
}

function novaZona(): Zona {
  return {
    label: "",
    feeCents: 0,
    etaMinutes: 30,
    mode: "neighborhoods",
    radiusKm: null,
    centerLat: null,
    centerLng: null,
    neighborhoods: [],
    minimumOrderCents: 0,
    freeShippingAboveCents: 0,
  };
}

type ZonaProp = {
  id?: string;
  label: string;
  feeCents: number;
  etaMinutes: number;
  mode?: "radius" | "neighborhoods";
  radiusKm?: number | null;
  centerLat?: number | null;
  centerLng?: number | null;
  neighborhoods: string[];
  minimumOrderCents?: number;
  freeShippingAboveCents?: number;
};

function normalizar(z: ZonaProp): Zona {
  return {
    id: z.id,
    label: z.label,
    feeCents: z.feeCents,
    etaMinutes: z.etaMinutes,
    mode: z.mode ?? "neighborhoods",
    radiusKm: z.radiusKm ?? null,
    centerLat: z.centerLat ?? null,
    centerLng: z.centerLng ?? null,
    neighborhoods: z.neighborhoods ?? [],
    minimumOrderCents: z.minimumOrderCents ?? 0,
    freeShippingAboveCents: z.freeShippingAboveCents ?? 0,
  };
}

export function ZonasEntrega({ zonas: zonasProp }: { zonas: ZonaProp[] }) {
  const [zonas, setZonas] = useState<Zona[]>(
    zonasProp.length > 0 ? zonasProp.map(normalizar) : [novaZona()]
  );
  // IDs de zonas que foram removidas localmente mas existiam na API
  const [removidas, setRemovidas] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  function atualizar<K extends keyof Zona>(idx: number, campo: K, valor: Zona[K]) {
    setZonas((prev) => prev.map((z, i) => (i === idx ? { ...z, [campo]: valor } : z)));
  }

  function adicionarZona() {
    setZonas((prev) => [...prev, novaZona()]);
  }

  function removerZona(idx: number) {
    const zona = zonas[idx];
    if (zona && zona.id) {
      setRemovidas((prev) => [...prev, zona.id as string]);
    }
    setZonas((prev) => prev.filter((_, i) => i !== idx));
  }

  async function salvar() {
    setSalvando(true);
    setFeedback(null);
    try {
      await salvarZonasEntrega(zonas, removidas);
      setRemovidas([]);
      setFeedback({ ok: true, msg: "Zonas salvas com sucesso." });
    } catch (err) {
      setFeedback({ ok: false, msg: err instanceof Error ? err.message : "Erro ao salvar." });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="wp-panel">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700 }}>Zonas de entrega</h2>
        <button type="button" className="wp-btn wp-btn-secondary" onClick={adicionarZona} style={{ fontSize: 12 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 4 }}>
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nova zona
        </button>
      </div>

      <div className="wp-stack">
        {zonas.map((zona, idx) => (
          <div
            key={idx}
            style={{
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: 16,
              background: "var(--cream)",
              position: "relative",
            }}
          >
            {/* Botão remover */}
            <button
              type="button"
              onClick={() => removerZona(idx)}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: 2,
              }}
              title="Remover zona"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Linha 1: nome, taxa, prazo */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div className="wp-form-group">
                <label className="wp-label">Nome da zona</label>
                <input
                  className="wp-input"
                  value={zona.label}
                  onChange={(e) => atualizar(idx, "label", e.target.value)}
                  placeholder="Ex: Centro"
                />
              </div>
              <div className="wp-form-group">
                <label className="wp-label">Taxa (R$)</label>
                <input
                  className="wp-input"
                  value={centavosParaReais(zona.feeCents)}
                  onChange={(e) => atualizar(idx, "feeCents", reaisParaCentavos(e.target.value))}
                  placeholder="0,00"
                  inputMode="decimal"
                />
              </div>
              <div className="wp-form-group">
                <label className="wp-label">Prazo (min)</label>
                <input
                  className="wp-input"
                  type="number"
                  value={zona.etaMinutes}
                  onChange={(e) => atualizar(idx, "etaMinutes", Number(e.target.value))}
                  min={0}
                />
              </div>
            </div>

            {/* Linha 2: pedido mínimo, frete grátis acima de */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div className="wp-form-group">
                <label className="wp-label">Pedido mínimo (R$)</label>
                <input
                  className="wp-input"
                  value={centavosParaReais(zona.minimumOrderCents)}
                  onChange={(e) => atualizar(idx, "minimumOrderCents", reaisParaCentavos(e.target.value))}
                  placeholder="0,00"
                  inputMode="decimal"
                />
              </div>
              <div className="wp-form-group">
                <label className="wp-label">
                  Frete grátis acima de (R$)
                  <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 4 }}>
                    (0 = desativado)
                  </span>
                </label>
                <input
                  className="wp-input"
                  value={centavosParaReais(zona.freeShippingAboveCents)}
                  onChange={(e) => atualizar(idx, "freeShippingAboveCents", reaisParaCentavos(e.target.value))}
                  placeholder="0,00"
                  inputMode="decimal"
                />
              </div>
            </div>

            {/* Toggle de modo: Raio | Bairros */}
            <div className="wp-form-group" style={{ marginBottom: 12 }}>
              <label className="wp-label">Modo de cobertura</label>
              <div style={{ display: "flex", gap: 0, borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)", width: "fit-content" }}>
                {(["neighborhoods", "radius"] as ZonaMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => atualizar(idx, "mode", m)}
                    style={{
                      padding: "6px 18px",
                      fontSize: 13,
                      fontWeight: zona.mode === m ? 600 : 400,
                      background: zona.mode === m ? "var(--green)" : "var(--surface)",
                      color: zona.mode === m ? "#fff" : "var(--text-muted)",
                      border: "none",
                      cursor: "pointer",
                      transition: "background 0.15s, color 0.15s",
                    }}
                  >
                    {m === "neighborhoods" ? "Bairros" : "Raio"}
                  </button>
                ))}
              </div>
            </div>

            {/* Campos condicionais por modo */}
            {zona.mode === "neighborhoods" && (
              <div className="wp-form-group">
                <label className="wp-label">Bairros (separados por vírgula)</label>
                <input
                  className="wp-input"
                  value={zona.neighborhoods.join(", ")}
                  onChange={(e) =>
                    atualizar(
                      idx,
                      "neighborhoods",
                      e.target.value
                        .split(",")
                        .map((b) => b.trim())
                        .filter(Boolean)
                    )
                  }
                  placeholder="Centro, Jardim América, Vila Nova..."
                />
              </div>
            )}

            {zona.mode === "radius" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div className="wp-form-group">
                  <label className="wp-label">Raio (km)</label>
                  <input
                    className="wp-input"
                    type="number"
                    step="0.1"
                    min="0"
                    value={zona.radiusKm ?? ""}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      atualizar(idx, "radiusKm", isNaN(v) ? null : v);
                    }}
                    placeholder="5.0"
                    inputMode="decimal"
                  />
                </div>
                <div className="wp-form-group">
                  <label className="wp-label">Latitude central</label>
                  <input
                    className="wp-input"
                    type="number"
                    step="any"
                    value={zona.centerLat ?? ""}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      atualizar(idx, "centerLat", isNaN(v) ? null : v);
                    }}
                    placeholder="-23.5505"
                    inputMode="decimal"
                  />
                </div>
                <div className="wp-form-group">
                  <label className="wp-label">Longitude central</label>
                  <input
                    className="wp-input"
                    type="number"
                    step="any"
                    value={zona.centerLng ?? ""}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      atualizar(idx, "centerLng", isNaN(v) ? null : v);
                    }}
                    placeholder="-46.6333"
                    inputMode="decimal"
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        {zonas.length === 0 && (
          <div className="wp-note" style={{ fontSize: 13, textAlign: "center" }}>
            Nenhuma zona cadastrada. Clique em "Nova zona" para adicionar.
          </div>
        )}

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
          <button type="button" className="wp-btn wp-btn-primary" onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar Zonas"}
          </button>
        </div>
      </div>
    </div>
  );
}
