"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";

import { salvarZonasEntrega } from "./actions";
import type { ZonaGeometria, ZonaNoMapa } from "./MapaInterativo";

// Leaflet não suporta SSR — carregamento dinâmico obrigatório
const MapaInterativo = dynamic(
  () =>
    import("./MapaInterativo").then((m) => ({ default: m.MapaInterativo })),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
          fontSize: 13,
        }}
      >
        Carregando mapa...
      </div>
    ),
  }
);

// ─── Tipos ────────────────────────────────────────────────────────────────────

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

type ZonaEstado = {
  zonaId: string;
  apiId?: string;
  nome: string;
  feeCents: number;
  etaMinutes: number;
  minimumOrderCents: number;
  ativo: boolean;
  bairros: string;
  geometria: ZonaGeometria | null;
};

type ZonaAPI = {
  id?: string;
  label: string;
  feeCents: number;
  etaMinutes: number;
  mode: "radius" | "neighborhoods";
  centerLat: number | null | undefined;
  centerLng: number | null | undefined;
  radiusKm: number | null | undefined;
  neighborhoods: string[];
  minimumOrderCents: number;
  freeShippingAboveCents: number;
};

type Props = {
  zonas: ZonaProp[];
  storeLat?: number | null;
  storeLng?: number | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function propParaEstado(z: ZonaProp): ZonaEstado {
  let geometria: ZonaGeometria | null = null;
  if (
    z.mode === "radius" &&
    z.centerLat != null &&
    z.centerLng != null &&
    z.radiusKm != null
  ) {
    geometria = {
      tipo: "circle",
      centerLat: z.centerLat,
      centerLng: z.centerLng,
      radiusKm: z.radiusKm,
    };
  }
  return {
    zonaId: z.id ?? `temp-${Math.random().toString(36).slice(2)}`,
    apiId: z.id,
    nome: z.label,
    feeCents: z.feeCents,
    etaMinutes: z.etaMinutes,
    minimumOrderCents: z.minimumOrderCents ?? 0,
    ativo: true,
    bairros: (z.neighborhoods ?? []).join(", "),
    geometria,
  };
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function MapaZonasEntrega({ zonas: zonasProp, storeLat, storeLng }: Props) {
  const [centroMapa, setCentroMapa] = useState<{ lat: number; lng: number }>({
    lat: storeLat ?? -23.5505,
    lng: storeLng ?? -46.6333,
  });

  useEffect(() => {
    setCentroMapa({
      lat: storeLat ?? -23.5505,
      lng: storeLng ?? -46.6333,
    });
  }, [storeLat, storeLng]);

  useEffect(() => {
    function handleEnderecoAtualizado(event: Event) {
      const detail = (event as CustomEvent<{ storeLat?: number | null; storeLng?: number | null }>).detail;
      if (typeof detail?.storeLat !== "number" || typeof detail?.storeLng !== "number") return;
      setCentroMapa({ lat: detail.storeLat, lng: detail.storeLng });
    }

    window.addEventListener("config:endereco-atualizado", handleEnderecoAtualizado);
    return () => window.removeEventListener("config:endereco-atualizado", handleEnderecoAtualizado);
  }, []);

  const [zonas, setZonas] = useState<ZonaEstado[]>(
    zonasProp.map(propParaEstado)
  );
  const [removidas, setRemovidas] = useState<string[]>([]);
  const [selectedZonaId, setSelectedZonaId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    setZonas(zonasProp.map(propParaEstado));
  }, [zonasProp]);

  // Zonas que possuem geometria para exibir no mapa
  const zonasNoMapa: ZonaNoMapa[] = zonas
    .filter((z) => z.geometria !== null)
    .map((z) => ({
      zonaId: z.zonaId,
      geometria: z.geometria as ZonaGeometria,
      nome: z.nome,
      ativo: z.ativo,
    }));

  const zonaSelecionada = zonas.find((z) => z.zonaId === selectedZonaId) ?? null;

  // ── Handlers do mapa ──────────────────────────────────────────────────────

  const handleZonaCriada = useCallback((zonaId: string, geometria: ZonaGeometria) => {
    setZonas((prev) => [
      ...prev,
      {
        zonaId,
        nome: "",
        feeCents: 0,
        etaMinutes: 30,
        minimumOrderCents: 0,
        ativo: true,
        bairros: "",
        geometria,
      },
    ]);
    setSelectedZonaId(zonaId);
  }, []);

  const handleZonaRemovida = useCallback((zonaId: string) => {
    setZonas((prev) => {
      const zona = prev.find((z) => z.zonaId === zonaId);
      if (zona?.apiId) {
        setRemovidas((r) => [...r, zona.apiId as string]);
      }
      return prev.filter((z) => z.zonaId !== zonaId);
    });
    setSelectedZonaId((cur) => (cur === zonaId ? null : cur));
  }, []);

  // ── Atualização de campos da zona selecionada ─────────────────────────────

  function atualizarZona<K extends keyof ZonaEstado>(
    zonaId: string,
    campo: K,
    valor: ZonaEstado[K]
  ) {
    setZonas((prev) =>
      prev.map((z) => (z.zonaId === zonaId ? { ...z, [campo]: valor } : z))
    );
  }

  // ── Adicionar zona manual (sem geometria no mapa) ─────────────────────────

  function adicionarZonaSemMapa() {
    const zonaId = `manual-${Date.now()}`;
    setZonas((prev) => [
      ...prev,
      {
        zonaId,
        nome: "",
        feeCents: 0,
        etaMinutes: 30,
        minimumOrderCents: 0,
        ativo: true,
        bairros: "",
        geometria: null,
      },
    ]);
    setSelectedZonaId(zonaId);
  }

  // ── Remover zona do painel lateral ────────────────────────────────────────

  function removerZona(zonaId: string) {
    const zona = zonas.find((z) => z.zonaId === zonaId);
    if (zona?.apiId) {
      setRemovidas((prev) => [...prev, zona.apiId as string]);
    }
    setZonas((prev) => prev.filter((z) => z.zonaId !== zonaId));
    setSelectedZonaId((cur) => (cur === zonaId ? null : cur));
  }

  // ── Salvar ────────────────────────────────────────────────────────────────

  async function salvar() {
    setSalvando(true);
    setFeedback(null);
    try {
      const zonasParaAPI: ZonaAPI[] = zonas.map((z) => ({
        id: z.apiId,
        label: z.nome,
        feeCents: z.feeCents,
        etaMinutes: z.etaMinutes,
        mode: z.geometria?.tipo === "circle" ? "radius" : "neighborhoods",
        centerLat: z.geometria?.tipo === "circle" ? z.geometria.centerLat : null,
        centerLng: z.geometria?.tipo === "circle" ? z.geometria.centerLng : null,
        radiusKm: z.geometria?.tipo === "circle" ? z.geometria.radiusKm : null,
        neighborhoods: z.bairros
          ? z.bairros.split(",").map((b) => b.trim()).filter(Boolean)
          : [],
        minimumOrderCents: z.minimumOrderCents,
        freeShippingAboveCents: 0,
      }));
      await salvarZonasEntrega(zonasParaAPI, removidas);
      setRemovidas([]);
      setFeedback({ ok: true, msg: "Zonas salvas com sucesso." });
    } catch (err) {
      setFeedback({
        ok: false,
        msg: err instanceof Error ? err.message : "Erro ao salvar.",
      });
    } finally {
      setSalvando(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="wp-panel" id="zonas">
      {/* Header do card */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Zonas de Entrega</h2>
        <button
          type="button"
          className="wp-btn wp-btn-secondary"
          onClick={adicionarZonaSemMapa}
          style={{ fontSize: 12 }}
        >
          + Adicionar zona manual
        </button>
      </div>

      {/* Layout: mapa (60%) + painel (40%) */}
      <div
        className="conf-mapa-layout"
        style={{
          display: "flex",
          gap: 0,
          border: "1px solid var(--border)",
          borderRadius: 10,
          overflow: "hidden",
          height: 480,
        }}
      >
        {/* Mapa */}
        <div className="conf-mapa-map" style={{ flex: "0 0 60%", position: "relative" }}>
          <MapaInterativo
            centerLat={centroMapa.lat}
            centerLng={centroMapa.lng}
            zonas={zonasNoMapa}
            selectedZonaId={selectedZonaId}
            onZonaCriada={handleZonaCriada}
            onZonaSelecionada={setSelectedZonaId}
            onZonaRemovida={handleZonaRemovida}
          />
        </div>

        {/* Painel lateral de configuração */}
        <div
          className="conf-mapa-panel"
          style={{
            flex: "0 0 40%",
            borderLeft: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Lista de zonas */}
          <div style={{ overflowY: "auto", flex: 1, padding: "12px" }}>
            {zonas.map((zona) => (
              <div
                key={zona.zonaId}
                onClick={() => setSelectedZonaId(zona.zonaId)}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  marginBottom: 8,
                  cursor: "pointer",
                  border: `1px solid ${
                    zona.zonaId === selectedZonaId
                      ? "var(--green)"
                      : "var(--border)"
                  }`,
                  background:
                    zona.zonaId === selectedZonaId
                      ? "rgba(45,106,79,0.06)"
                      : "transparent",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    {zona.nome || "Zona sem nome"}
                  </span>
                  {zona.geometria === null && (
                    <span
                      style={{
                        fontSize: 10,
                        color: "#a16207",
                        background: "#fef9c3",
                        padding: "2px 6px",
                        borderRadius: 4,
                        border: "1px solid #fef08a",
                        fontWeight: 600,
                      }}
                    >
                      Sem área no mapa
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  R$ {(zona.feeCents / 100).toFixed(2).replace(".", ",")} ·{" "}
                  {zona.etaMinutes}min
                </span>
              </div>
            ))}

            {zonas.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "24px 0",
                  color: "var(--text-muted)",
                  fontSize: 13,
                }}
              >
                Desenhe uma zona no mapa para começar
              </div>
            )}
          </div>

          {/* Formulário da zona selecionada */}
          {zonaSelecionada && (
            <div
              style={{
                padding: "12px 12px 0",
                borderTop: "1px solid var(--border)",
                overflowY: "auto",
                maxHeight: 260,
              }}
            >
              <div className="wp-stack" style={{ gap: 10 }}>
                <div className="wp-field" style={{ margin: 0 }}>
                  <label className="wp-label">Nome da zona</label>
                  <input
                    className="wp-input"
                    value={zonaSelecionada.nome}
                    onChange={(e) =>
                      atualizarZona(zonaSelecionada.zonaId, "nome", e.target.value)
                    }
                    placeholder="Ex: Centro, Zona Sul..."
                  />
                </div>

                <div
                  style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
                >
                  <div className="wp-field" style={{ margin: 0 }}>
                    <label className="wp-label">Taxa (R$)</label>
                    <input
                      className="wp-input"
                      value={(zonaSelecionada.feeCents / 100)
                        .toFixed(2)
                        .replace(".", ",")}
                      onChange={(e) => {
                        const n = parseFloat(
                          e.target.value.replace(",", ".")
                        );
                        atualizarZona(
                          zonaSelecionada.zonaId,
                          "feeCents",
                          isNaN(n) ? 0 : Math.round(n * 100)
                        );
                      }}
                      inputMode="decimal"
                      placeholder="0,00"
                    />
                  </div>
                  <div className="wp-field" style={{ margin: 0 }}>
                    <label className="wp-label">Tempo (min)</label>
                    <input
                      className="wp-input"
                      type="number"
                      value={zonaSelecionada.etaMinutes}
                      onChange={(e) =>
                        atualizarZona(
                          zonaSelecionada.zonaId,
                          "etaMinutes",
                          Number(e.target.value)
                        )
                      }
                      min={0}
                    />
                  </div>
                </div>

                <div className="wp-field" style={{ margin: 0 }}>
                  <label className="wp-label">Bairros (referência)</label>
                  <input
                    className="wp-input"
                    value={zonaSelecionada.bairros}
                    onChange={(e) =>
                      atualizarZona(
                        zonaSelecionada.zonaId,
                        "bairros",
                        e.target.value
                      )
                    }
                    placeholder="Centro, Jardim América..."
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", paddingBottom: 12 }}>
                  <button
                    type="button"
                    onClick={() => removerZona(zonaSelecionada.zonaId)}
                    style={{
                      background: "none",
                      border: "1px solid #fecaca",
                      color: "#dc2626",
                      borderRadius: 6,
                      padding: "4px 10px",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Remover zona
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          style={{
            marginTop: 12,
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

      {/* Botão salvar */}
      <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          className="wp-btn wp-btn-primary"
          onClick={salvar}
          disabled={salvando}
        >
          {salvando ? "Salvando..." : "Salvar zonas"}
        </button>
      </div>
    </div>
  );
}
